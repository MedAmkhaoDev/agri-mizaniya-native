import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  writeBatch,
  increment,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type {
  Farm,
  FarmMember,
  FarmRole,
  FarmInvitation,
  FarmInviteCode,
  ActivityLogEntry,
  Parcel,
  Expense,
  Income,
  GasUsage,
  CooperativeSupport,
  ExpenseType,
  ActivityItem,
  FinancialSummary,
} from './types'
import { createBulkFarmNotificationsAsync, type NotificationType } from './notifications'

function farmCollection(farmId: string, collectionName: string) {
  return collection(db, 'farms', farmId, collectionName)
}

function farmDoc(farmId: string, collectionName: string, docId: string) {
  return doc(db, 'farms', farmId, collectionName, docId)
}

function userDocRef(userId: string) {
  return doc(db, 'users', userId)
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function getFarmName(farmId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'farms', farmId))
    return snap.exists() ? snap.data().name : 'Unknown Farm'
  } catch {
    return 'Unknown Farm'
  }
}

async function getUserName(userId: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'users', userId))
    return snap.exists() ? snap.data().fullName || 'Unknown' : 'Unknown'
  } catch {
    return 'Unknown'
  }
}

async function notifyFarm(
  farmId: string,
  excludeUserId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const farmName = await getFarmName(farmId)
  createBulkFarmNotificationsAsync(farmId, farmName, excludeUserId, {
    type,
    title,
    body,
    data: data || {},
  }).catch(() => {})
}

// ─── Activity Log ───────────────────────────────────────────────────────────

async function logActivity(
  farmId: string,
  entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'farms', farmId, 'activityLog'), {
      ...entry,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('logActivity error:', error)
  }
}

export async function getActivityLog(
  farmId: string,
  limit = 50
): Promise<{ data: ActivityLogEntry[]; error: Error | null }> {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'activityLog'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLogEntry))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ─── Farm CRUD ──────────────────────────────────────────────────────────────

export async function createFarm(
  userId: string,
  farm: { name: string; description?: string; location?: string }
): Promise<{ data: Farm | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const farmRef = await addDoc(collection(db, 'farms'), {
      name: farm.name,
      description: farm.description || null,
      location: farm.location || null,
      ownerId: userId,
      memberCount: 1,
      parcelCount: 0,
      currency: 'MAD',
      createdAt: now,
      updatedAt: now,
    })

    await setDoc(doc(db, 'farms', farmRef.id, 'members', userId), {
      userId,
      email: '',
      fullName: '',
      avatarUrl: null,
      role: 'owner' as FarmRole,
      joinedAt: now,
      invitedBy: null,
    })

    const userSnap = await getDoc(userDocRef(userId))
    if (userSnap.exists()) {
      const userData = userSnap.data()
      await updateDoc(userDocRef(userId), {
        farmIds: [...(userData.farmIds || []), farmRef.id],
        currentFarmId: userData.currentFarmId || farmRef.id,
        updatedAt: now,
      })
    }

    return {
      data: {
        id: farmRef.id,
        name: farm.name,
        description: farm.description || null,
        location: farm.location || null,
        ownerId: userId,
        memberCount: 1,
        parcelCount: 0,
        currency: 'MAD',
        createdAt: now,
        updatedAt: now,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getFarm(
  farmId: string
): Promise<{ data: Farm | null; error: Error | null }> {
  try {
    const snap = await getDoc(doc(db, 'farms', farmId))
    if (!snap.exists()) return { data: null, error: new Error('Farm not found') }
    return { data: { id: snap.id, ...snap.data() } as Farm, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateFarm(
  farmId: string,
  updates: Partial<Pick<Farm, 'name' | 'description' | 'location' | 'currency'>>,
  userId?: string
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(doc(db, 'farms', farmId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    if (userId) {
      const userName = await getUserName(userId)
      notifyFarm(farmId, userId, 'FARM_SETTINGS_CHANGED', 'Paramètres modifiés', `${userName} a modifié les paramètres de la ferme`, { entityId: farmId, entityType: 'farm', actionBy: userId, actionByName: userName })
    }
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteFarm(
  farmId: string
): Promise<{ error: Error | null }> {
  try {
    const batch = writeBatch(db)

    const membersSnap = await getDocs(collection(db, 'farms', farmId, 'members'))
    for (const memberDoc of membersSnap.docs) {
      const memberData = memberDoc.data()
      const userSnap = await getDoc(userDocRef(memberData.userId))
      if (userSnap.exists()) {
        const userData = userSnap.data()
        batch.update(userDocRef(memberData.userId), {
          farmIds: (userData.farmIds || []).filter((id: string) => id !== farmId),
          currentFarmId: userData.currentFarmId === farmId ? null : userData.currentFarmId,
        })
      }
    }

    const subcollections = ['parcels', 'expenses', 'incomes', 'gasUsages', 'cooperativeSupports', 'members', 'invitations', 'shareCodes', 'activityLog']
    for (const sub of subcollections) {
      const snap = await getDocs(collection(db, 'farms', farmId, sub))
      for (const d of snap.docs) {
        batch.delete(doc(db, 'farms', farmId, sub, d.id))
      }
    }

    batch.delete(doc(db, 'farms', farmId))
    await batch.commit()

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function getUserFarms(
  userId: string
): Promise<{ data: Farm[]; error: Error | null }> {
  try {
    const userSnap = await getDoc(userDocRef(userId))
    if (!userSnap.exists()) return { data: [], error: null }
    const userData = userSnap.data()
    const farmIds: string[] = userData.farmIds || []
    if (farmIds.length === 0) return { data: [], error: null }

    const farms: Farm[] = []
    const chunks: string[][] = []
    for (let i = 0; i < farmIds.length; i += 10) {
      chunks.push(farmIds.slice(i, i + 10))
    }
    for (const chunk of chunks) {
      const q = query(collection(db, 'farms'), where('__name__', 'in', chunk))
      const snap = await getDocs(q)
      for (const d of snap.docs) {
        farms.push({ id: d.id, ...d.data() } as Farm)
      }
    }

    farms.sort((a, b) => a.name.localeCompare(b.name))
    return { data: farms, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ─── Member Management ──────────────────────────────────────────────────────

export async function getFarmMembers(
  farmId: string
): Promise<{ data: FarmMember[]; error: Error | null }> {
  try {
    const snapshot = await getDocs(collection(db, 'farms', farmId, 'members'))
    const data = snapshot.docs.map((d) => d.data() as FarmMember)
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getFarmMember(
  farmId: string,
  userId: string
): Promise<{ data: FarmMember | null; error: Error | null }> {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'members'),
      where('userId', '==', userId),
      firestoreLimit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return { data: null, error: new Error('Member not found') }
    return { data: snapshot.docs[0].data() as FarmMember, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function addMemberToFarm(
  farmId: string,
  member: FarmMember
): Promise<{ error: Error | null }> {
  try {
    const batch = writeBatch(db)

    await setDoc(doc(db, 'farms', farmId, 'members', member.userId), {
      ...member,
    })

    const userSnap = await getDoc(userDocRef(member.userId))
    if (userSnap.exists()) {
      const userData = userSnap.data()
      batch.update(userDocRef(member.userId), {
        farmIds: [...(userData.farmIds || []), farmId],
      })
    }

    const farmSnap = await getDoc(doc(db, 'farms', farmId))
    if (farmSnap.exists()) {
      batch.update(doc(db, 'farms', farmId), {
        memberCount: increment(1),
        updatedAt: new Date().toISOString(),
      })
    }

    await batch.commit()
    const farmName = await getFarmName(farmId)
    notifyFarm(farmId, member.userId, 'MEMBER_JOINED', 'Membre rejoint', `${member.fullName} a rejoint la ferme`, { entityId: member.userId, entityType: 'member', actionBy: member.userId, actionByName: member.fullName })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function updateMemberRole(
  farmId: string,
  targetUserId: string,
  newRole: FarmRole
): Promise<{ error: Error | null }> {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'members'),
      where('userId', '==', targetUserId),
      firestoreLimit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return { error: new Error('Member not found') }

    await updateDoc(snapshot.docs[0].ref, { role: newRole })
    const targetName = await getUserName(targetUserId)
    const roleLabels: Record<string, string> = { owner: 'Propriétaire', manager: 'Gestionnaire', worker: 'Travailleur', viewer: 'Observateur' }
    notifyFarm(farmId, targetUserId, 'ROLE_CHANGED', 'Rôle modifié', `Le rôle de ${targetName} a été changé en ${roleLabels[newRole] || newRole}`, { entityId: targetUserId, entityType: 'member', actionBy: targetUserId, actionByName: targetName })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function removeMember(
  farmId: string,
  targetUserId: string
): Promise<{ error: Error | null }> {
  try {
    const batch = writeBatch(db)

    const q = query(
      collection(db, 'farms', farmId, 'members'),
      where('userId', '==', targetUserId),
      firestoreLimit(1)
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      batch.delete(snapshot.docs[0].ref)
    }

    const userSnap = await getDoc(userDocRef(targetUserId))
    if (userSnap.exists()) {
      const userData = userSnap.data()
      batch.update(userDocRef(targetUserId), {
        farmIds: (userData.farmIds || []).filter((id: string) => id !== farmId),
        currentFarmId: userData.currentFarmId === farmId ? null : userData.currentFarmId,
      })
    }

    batch.update(doc(db, 'farms', farmId), {
      memberCount: increment(-1),
      updatedAt: new Date().toISOString(),
    })

    await batch.commit()
    const targetName = await getUserName(targetUserId)
    notifyFarm(farmId, targetUserId, 'MEMBER_LEFT', 'Membre retiré', `${targetName} a été retiré de la ferme`, { entityId: targetUserId, entityType: 'member', actionBy: targetUserId, actionByName: targetName })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Invitations ────────────────────────────────────────────────────────────

export async function sendInvite(
  farmId: string,
  farmName: string,
  inviterId: string,
  inviterName: string,
  email: string,
  role: FarmRole
): Promise<{ data: FarmInvitation | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const docRef = await addDoc(collection(db, 'farms', farmId, 'invitations'), {
      farmId,
      farmName,
      email,
      role,
      invitedBy: inviterId,
      invitedByName: inviterName,
      status: 'pending',
      createdAt: now,
      expiresAt,
    })
    notifyFarm(farmId, inviterId, 'INVITE_SENT', 'Invitation envoyée', `${inviterName} a invité ${email} à rejoindre la ferme`, { entityId: docRef.id, entityType: 'invitation', actionBy: inviterId, actionByName: inviterName })
    return {
      data: {
        id: docRef.id,
        farmId,
        farmName,
        email,
        role,
        invitedBy: inviterId,
        invitedByName: inviterName,
        status: 'pending',
        createdAt: now,
        expiresAt,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getFarmInvitations(
  farmId: string
): Promise<{ data: FarmInvitation[]; error: Error | null }> {
  try {
    const q = query(
      collection(db, 'farms', farmId, 'invitations'),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FarmInvitation))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function acceptInvite(
  invitationId: string,
  farmId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ error: Error | null }> {
  try {
    const inviteSnap = await getDoc(doc(db, 'farms', farmId, 'invitations', invitationId))
    if (!inviteSnap.exists()) return { error: new Error('Invitation not found') }

    const inviteData = inviteSnap.data()
    const now = new Date().toISOString()

    await updateDoc(doc(db, 'farms', farmId, 'invitations', invitationId), {
      status: 'accepted',
    })

    await setDoc(doc(db, 'farms', farmId, 'members', userId), {
      userId,
      email: userEmail,
      fullName: userName,
      avatarUrl: null,
      role: inviteData.role,
      joinedAt: now,
      invitedBy: inviteData.invitedBy,
    })

    const userSnap = await getDoc(userDocRef(userId))
    if (userSnap.exists()) {
      const userData = userSnap.data()
      await updateDoc(userDocRef(userId), {
        farmIds: [...(userData.farmIds || []), farmId],
        currentFarmId: userData.currentFarmId || farmId,
        updatedAt: now,
      })
    }

    await updateDoc(doc(db, 'farms', farmId), {
      memberCount: increment(1),
      updatedAt: now,
    })

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function revokeInvite(
  farmId: string,
  invitationId: string
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(doc(db, 'farms', farmId, 'invitations', invitationId), {
      status: 'revoked',
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Share Codes ────────────────────────────────────────────────────────────

export async function generateShareCode(
  farmId: string,
  farmName: string,
  createdBy: string,
  role: FarmRole
): Promise<{ data: FarmInviteCode | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const code = generateCode()
    const codeRef = doc(collection(db, 'farm_invite_codes'))
    await setDoc(codeRef, {
      code,
      farmId,
      farmName,
      role,
      createdBy,
      maxUses: null,
      useCount: 0,
      expiresAt,
      isActive: true,
      createdAt: now,
    })
    return {
      data: {
        code,
        farmId,
        farmName,
        role,
        createdBy,
        maxUses: null,
        useCount: 0,
        expiresAt,
        isActive: true,
        createdAt: now,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function joinByShareCode(
  code: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ error: Error | null; farmId?: string }> {
  try {
    const q = query(
      collection(db, 'farm_invite_codes'),
      where('code', '==', code),
      where('isActive', '==', true),
      firestoreLimit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return { error: new Error('Invalid or inactive share code') }

    const codeDoc = snapshot.docs[0]
    const codeData = codeDoc.data() as FarmInviteCode

    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return { error: new Error('Share code has expired') }
    }
    if (codeData.maxUses && codeData.useCount >= codeData.maxUses) {
      return { error: new Error('Share code has reached maximum uses') }
    }

    const now = new Date().toISOString()
    const batch = writeBatch(db)

    batch.update(codeDoc.ref, {
      useCount: increment(1),
    })

    const memberRef = doc(db, 'farms', codeData.farmId, 'members', userId)
    batch.set(memberRef, {
      userId,
      email: userEmail,
      fullName: userName,
      avatarUrl: null,
      role: codeData.role,
      joinedAt: now,
      invitedBy: codeData.createdBy,
    })

    const userSnap = await getDoc(userDocRef(userId))
    if (userSnap.exists()) {
      const userData = userSnap.data()
      batch.update(userDocRef(userId), {
        farmIds: [...(userData.farmIds || []), codeData.farmId],
        currentFarmId: userData.currentFarmId || codeData.farmId,
      })
    }

    batch.update(doc(db, 'farms', codeData.farmId), {
      memberCount: increment(1),
      updatedAt: now,
    })

    await batch.commit()
    notifyFarm(codeData.farmId, userId, 'MEMBER_JOINED', 'Membre rejoint', `${userName} a rejoint la ferme via un code de partage`, { entityId: userId, entityType: 'member', actionBy: userId, actionByName: userName })
    return { error: null, farmId: codeData.farmId }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function getShareCodes(
  farmId: string
): Promise<{ data: FarmInviteCode[]; error: Error | null }> {
  try {
    const q = query(
      collection(db, 'farm_invite_codes'),
      where('farmId', '==', farmId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FarmInviteCode))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function deactivateShareCode(
  farmId: string,
  codeId: string
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(doc(db, 'farms', farmId, 'shareCodes', codeId), {
      isActive: false,
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Expense Types ──────────────────────────────────────────────────────────

const DEFAULT_EXPENSE_TYPES = [
  { name: 'Main d\'œuvre', nameFr: 'Main d\'œuvre', icon: 'users', color: '#8B5CF6' },
  { name: 'Carburant', nameFr: 'Carburant', icon: 'fuel', color: '#F97316' },
  { name: 'Engrais', nameFr: 'Engrais', icon: 'sprout', color: '#22C55E' },
  { name: 'Semences', nameFr: 'Semences', icon: 'leaf', color: '#10B981' },
  { name: 'Pesticides', nameFr: 'Pesticides', icon: 'shield', color: '#EF4444' },
  { name: 'Matériel', nameFr: 'Matériel', icon: 'wrench', color: '#3B82F6' },
  { name: 'Transport', nameFr: 'Transport', icon: 'truck', color: '#6366F1' },
  { name: 'Eau', nameFr: 'Eau', icon: 'droplets', color: '#06B6D4' },
  { name: 'Autre', nameFr: 'Autre', icon: 'more-horizontal', color: '#6B7280' },
]

export async function seedExpenseTypes(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'expense_types'))
    if (!snapshot.empty) return
    await Promise.all(
      DEFAULT_EXPENSE_TYPES.map((t) =>
        addDoc(collection(db, 'expense_types'), { ...t, userId: null, isActive: true, createdAt: new Date().toISOString() })
      )
    )
  } catch (error) {
    console.error('seedExpenseTypes error:', error)
  }
}

export async function getExpenseTypes(): Promise<{ data: ExpenseType[]; error: Error | null }> {
  try {
    const q = query(collection(db, 'expense_types'), where('isActive', '==', true))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseType))
    data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function addExpenseType(userId: string, name: string): Promise<{ id: string; error: Error | null }> {
  try {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const docRef = await addDoc(collection(db, 'expense_types'), {
      userId,
      name,
      nameFr: name,
      nameAr: null,
      icon: 'more-horizontal',
      color: randomColor,
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    return { id: docRef.id, error: null }
  } catch (error) {
    return { id: '', error: error as Error }
  }
}

// ─── Parcels ────────────────────────────────────────────────────────────────

export async function getParcels(farmId: string): Promise<{ data: Parcel[]; error: Error | null }> {
  try {
    const q = query(farmCollection(farmId, 'parcels'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, farmId, ...d.data() } as Parcel))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createParcel(
  farmId: string,
  userId: string,
  parcel: Omit<Parcel, 'id' | 'farmId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<{ data: Parcel | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(farmCollection(farmId, 'parcels'), {
      ...parcel,
      farmId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    const docSnap = await getDoc(docRef)
    const userName = await getUserName(userId)
    notifyFarm(farmId, userId, 'PARCEL_CREATED', 'Parcelle créée', `${userName} a créé la parcelle "${parcel.name}"`, { entityId: docRef.id, entityType: 'parcel', actionBy: userId, actionByName: userName })
    return { data: { id: docRef.id, farmId, createdBy: userId, ...docSnap.data() } as Parcel, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateParcel(
  farmId: string,
  id: string,
  parcel: Partial<Parcel>
): Promise<{ data: Parcel | null; error: Error | null }> {
  try {
    await updateDoc(farmDoc(farmId, 'parcels', id), {
      ...parcel,
      updatedAt: new Date().toISOString(),
    })
    const docSnap = await getDoc(farmDoc(farmId, 'parcels', id))
    return { data: { id, farmId, ...docSnap.data() } as Parcel, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function deleteParcel(
  farmId: string,
  id: string
): Promise<{ error: Error | null }> {
  try {
    await deleteDoc(farmDoc(farmId, 'parcels', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function getExpenses(
  farmId: string,
  filters?: { parcelId?: string; createdBy?: string; from?: string; to?: string }
): Promise<{ data: Expense[]; error: Error | null }> {
  try {
    let q = query(farmCollection(farmId, 'expenses'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    if (filters?.createdBy) q = query(q, where('createdBy', '==', filters.createdBy))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, farmId, ...d.data() } as Expense))

    if (filters?.from) data = data.filter((e) => e.date >= filters.from!)
    if (filters?.to) data = data.filter((e) => e.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createExpense(
  farmId: string,
  userId: string,
  expense: Omit<Expense, 'id' | 'farmId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<{ data: Expense | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(farmCollection(farmId, 'expenses'), {
      ...expense,
      farmId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    const userName = await getUserName(userId)
    const amount = expense.amount.toLocaleString('fr-FR')
    notifyFarm(farmId, userId, 'EXPENSE_CREATED', 'Dépense enregistrée', `${userName} a enregistré une dépense de ${amount} MAD`, { entityId: docRef.id, entityType: 'expense', actionBy: userId, actionByName: userName })
    return { data: { id: docRef.id, farmId, createdBy: userId, ...expense, createdAt: now, updatedAt: now } as Expense, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateExpense(
  farmId: string,
  id: string,
  expense: Partial<Expense>
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(farmDoc(farmId, 'expenses', id), {
      ...expense,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteExpense(
  farmId: string,
  id: string
): Promise<{ error: Error | null }> {
  try {
    await deleteDoc(farmDoc(farmId, 'expenses', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Incomes ────────────────────────────────────────────────────────────────

export async function getIncomes(
  farmId: string,
  filters?: { parcelId?: string; createdBy?: string; from?: string; to?: string }
): Promise<{ data: Income[]; error: Error | null }> {
  try {
    let q = query(farmCollection(farmId, 'incomes'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    if (filters?.createdBy) q = query(q, where('createdBy', '==', filters.createdBy))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, farmId, ...d.data() } as Income))

    if (filters?.from) data = data.filter((i) => i.date >= filters.from!)
    if (filters?.to) data = data.filter((i) => i.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createIncome(
  farmId: string,
  userId: string,
  income: Omit<Income, 'id' | 'farmId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<{ data: Income | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(farmCollection(farmId, 'incomes'), {
      ...income,
      farmId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    const userName = await getUserName(userId)
    const amount = income.totalAmount.toLocaleString('fr-FR')
    notifyFarm(farmId, userId, 'INCOME_CREATED', 'Revenu enregistré', `${userName} a enregistré un revenu de ${amount} MAD`, { entityId: docRef.id, entityType: 'income', actionBy: userId, actionByName: userName })
    return { data: { id: docRef.id, farmId, createdBy: userId, ...income, createdAt: now, updatedAt: now } as Income, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateIncome(
  farmId: string,
  id: string,
  income: Partial<Income>
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(farmDoc(farmId, 'incomes', id), {
      ...income,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteIncome(
  farmId: string,
  id: string
): Promise<{ error: Error | null }> {
  try {
    await deleteDoc(farmDoc(farmId, 'incomes', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Gas Usages ─────────────────────────────────────────────────────────────

export async function getGasUsages(
  farmId: string,
  filters?: { parcelId?: string; createdBy?: string; from?: string; to?: string }
): Promise<{ data: GasUsage[]; error: Error | null }> {
  try {
    let q = query(farmCollection(farmId, 'gasUsages'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    if (filters?.createdBy) q = query(q, where('createdBy', '==', filters.createdBy))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, farmId, ...d.data() } as GasUsage))

    if (filters?.from) data = data.filter((g) => g.date >= filters.from!)
    if (filters?.to) data = data.filter((g) => g.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createGasUsage(
  farmId: string,
  userId: string,
  gas: Omit<GasUsage, 'id' | 'farmId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<{ data: GasUsage | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(farmCollection(farmId, 'gasUsages'), {
      ...gas,
      farmId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    const userName = await getUserName(userId)
    const amount = gas.totalAmount.toLocaleString('fr-FR')
    notifyFarm(farmId, userId, 'GAS_CREATED', 'Consommation de gaz enregistrée', `${userName} a enregistré une consommation de gaz de ${amount} MAD`, { entityId: docRef.id, entityType: 'gas', actionBy: userId, actionByName: userName })
    return { data: { id: docRef.id, farmId, createdBy: userId, ...gas, createdAt: now, updatedAt: now } as GasUsage, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateGasUsage(
  farmId: string,
  id: string,
  gas: Partial<GasUsage>
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(farmDoc(farmId, 'gasUsages', id), {
      ...gas,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteGasUsage(
  farmId: string,
  id: string
): Promise<{ error: Error | null }> {
  try {
    await deleteDoc(farmDoc(farmId, 'gasUsages', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Cooperative Supports ───────────────────────────────────────────────────

export async function getCooperativeSupports(
  farmId: string,
  filters?: { parcelId?: string; createdBy?: string; from?: string; to?: string }
): Promise<{ data: CooperativeSupport[]; error: Error | null }> {
  try {
    let q = query(farmCollection(farmId, 'cooperativeSupports'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    if (filters?.createdBy) q = query(q, where('createdBy', '==', filters.createdBy))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, farmId, ...d.data() } as CooperativeSupport))

    if (filters?.from) data = data.filter((c) => c.date >= filters.from!)
    if (filters?.to) data = data.filter((c) => c.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createCooperativeSupport(
  farmId: string,
  userId: string,
  support: Omit<CooperativeSupport, 'id' | 'farmId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<{ data: CooperativeSupport | null; error: Error | null }> {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(farmCollection(farmId, 'cooperativeSupports'), {
      ...support,
      farmId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    const userName = await getUserName(userId)
    const amount = support.amount.toLocaleString('fr-FR')
    notifyFarm(farmId, userId, 'COOPERATIVE_CREATED', 'Aide coopérative enregistrée', `${userName} a enregistré une aide coopérative de ${amount} MAD`, { entityId: docRef.id, entityType: 'cooperative', actionBy: userId, actionByName: userName })
    return { data: { id: docRef.id, farmId, createdBy: userId, ...support, createdAt: now, updatedAt: now } as CooperativeSupport, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateCooperativeSupport(
  farmId: string,
  id: string,
  support: Partial<CooperativeSupport>
): Promise<{ error: Error | null }> {
  try {
    await updateDoc(farmDoc(farmId, 'cooperativeSupports', id), {
      ...support,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteCooperativeSupport(
  farmId: string,
  id: string
): Promise<{ error: Error | null }> {
  try {
    await deleteDoc(farmDoc(farmId, 'cooperativeSupports', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Financial Summary ──────────────────────────────────────────────────────

export async function getFinancialSummary(
  farmId: string,
  parcelId?: string
): Promise<FinancialSummary> {
  try {
    const [incomes, expenses, gasUsages, cooperative, parcels] = await Promise.all([
      getIncomes(farmId, parcelId ? { parcelId } : undefined),
      getExpenses(farmId, parcelId ? { parcelId } : undefined),
      getGasUsages(farmId, parcelId ? { parcelId } : undefined),
      getCooperativeSupports(farmId, parcelId ? { parcelId } : undefined),
      getParcels(farmId),
    ])

    const totalIncome = incomes.data.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalExpenses = expenses.data.reduce((sum, r) => sum + r.amount, 0)
    const totalGas = gasUsages.data.reduce((sum, r) => sum + r.totalAmount, 0)
    const totalCooperative = cooperative.data.reduce((sum, r) => sum + r.amount, 0)
    const netProfit = totalIncome - totalExpenses - totalGas - totalCooperative
    const parcelCount = parcelId ? 1 : parcels.data.filter((p) => p.status === 'active').length

    return { totalIncome, totalExpenses, totalGas, totalCooperative, netProfit, parcelCount }
  } catch (error) {
    console.error('getFinancialSummary error:', error)
    return { totalIncome: 0, totalExpenses: 0, totalGas: 0, totalCooperative: 0, netProfit: 0, parcelCount: 0 }
  }
}

// ─── Recent Activity ────────────────────────────────────────────────────────

export async function getRecentActivity(
  farmId: string,
  limit = 10
): Promise<ActivityItem[]> {
  try {
    const [expenses, incomes, gasUsages, cooperative] = await Promise.all([
      getDocs(query(farmCollection(farmId, 'expenses'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
      getDocs(query(farmCollection(farmId, 'incomes'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
      getDocs(query(farmCollection(farmId, 'gasUsages'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
      getDocs(query(farmCollection(farmId, 'cooperativeSupports'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
    ])

    const items: ActivityItem[] = [
      ...expenses.docs.map((d) => ({
        id: d.id,
        type: 'expense' as const,
        description: d.data().description || 'Dépense',
        amount: d.data().amount,
        date: d.data().date,
        parcelName: undefined,
        createdBy: d.data().createdBy,
      })),
      ...incomes.docs.map((d) => ({
        id: d.id,
        type: 'income' as const,
        description: d.data().productName,
        amount: d.data().totalAmount,
        date: d.data().date,
        parcelName: undefined,
        createdBy: d.data().createdBy,
      })),
      ...gasUsages.docs.map((d) => ({
        id: d.id,
        type: 'gas' as const,
        description: `${d.data().quantityBottles} bouteilles`,
        amount: d.data().totalAmount,
        date: d.data().date,
        parcelName: undefined,
        createdBy: d.data().createdBy,
      })),
      ...cooperative.docs.map((d) => ({
        id: d.id,
        type: 'cooperative' as const,
        description: d.data().supportType,
        amount: d.data().amount,
        date: d.data().date,
        parcelName: undefined,
        createdBy: d.data().createdBy,
      })),
    ]

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error('getRecentActivity error:', error)
    return []
  }
}
