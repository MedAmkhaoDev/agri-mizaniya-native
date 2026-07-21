import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Profile } from './types'

const BATCH_SIZE = 500

export async function migrateUserData(
  userId: string,
  profile: Profile
): Promise<{ success: boolean; farmId?: string; error?: Error }> {
  // Check if already migrated
  if (profile.farmIds && profile.farmIds.length > 0) {
    return { success: true, farmId: profile.currentFarmId || profile.farmIds[0] }
  }

  // Check if there's any old data to migrate
  const oldParcels = await getDocs(collection(db, 'users', userId, 'parcels'))
  if (oldParcels.empty) {
    // No old data — this is a new user, skip migration
    return { success: true }
  }

  try {
    // Create personal farm
    const farmName = `${profile.fullName}'s Farm`
    const farmId = doc(collection(db, 'farms')).id
    const now = new Date().toISOString()

    const farmData = {
      name: farmName,
      description: 'Personal farm (migrated from single-user mode)',
      location: null,
      ownerId: userId,
      memberCount: 1,
      parcelCount: 0,
      currency: 'MAD',
      createdAt: now,
      updatedAt: now,
    }

    // Create farm + owner member + update user profile in a batch
    const batch1 = writeBatch(db)
    batch1.set(doc(db, 'farms', farmId), farmData)
    batch1.set(doc(db, 'farms', farmId, 'members', userId), {
      userId,
      email: profile.email || '',
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl || null,
      role: 'owner',
      joinedAt: now,
      invitedBy: null,
    })
    batch1.update(doc(db, 'users', userId), {
      currentFarmId: farmId,
      farmIds: [farmId],
      updatedAt: now,
    })
    await batch1.commit()

    // Copy subcollections
    const collectionsToMigrate = [
      'parcels',
      'expenses',
      'incomes',
      'gasUsages',
      'cooperativeSupports',
    ]

    for (const colName of collectionsToMigrate) {
      await migrateCollection(userId, farmId, colName)
    }

    return { success: true, farmId }
  } catch (error) {
    console.error('migrateUserData error:', error)
    return { success: false, error: error as Error }
  }
}

async function migrateCollection(
  userId: string,
  farmId: string,
  collectionName: string
) {
  const oldSnapshot = await getDocs(
    collection(db, 'users', userId, collectionName)
  )

  const docs = oldSnapshot.docs
  if (docs.length === 0) return

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    const chunk = docs.slice(i, i + BATCH_SIZE)

    for (const oldDoc of chunk) {
      const oldData = oldDoc.data()
      const { userId: _oldUserId, ...rest } = oldData
      const newData = {
        ...rest,
        farmId,
        createdBy: userId,
      }

      const newDocRef = doc(
        collection(db, 'farms', farmId, collectionName)
      )
      batch.set(newDocRef, newData)
    }

    await batch.commit()
  }
}
