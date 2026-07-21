import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type {
  Parcel,
  Expense,
  Income,
  GasUsage,
  CooperativeSupport,
  ExpenseType,
  ActivityItem,
  FinancialSummary,
} from './types'

function userCollection(userId: string, collectionName: string) {
  return collection(db, 'users', userId, collectionName)
}

function userDoc(userId: string, collectionName: string, docId: string) {
  return doc(db, 'users', userId, collectionName, docId)
}

// ─── Parcels ────────────────────────────────────────────────────────────────

export async function getParcels(userId: string): Promise<{ data: Parcel[]; error: Error | null }> {
  try {
    const q = query(userCollection(userId, 'parcels'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as Parcel))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createParcel(userId: string, parcel: Omit<Parcel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(userCollection(userId, 'parcels'), {
      ...parcel,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    const docSnap = await getDoc(docRef)
    return { data: { id: docRef.id, userId, ...docSnap.data() } as Parcel, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateParcel(userId: string, id: string, parcel: Partial<Parcel>) {
  try {
    await updateDoc(userDoc(userId, 'parcels', id), {
      ...parcel,
      updatedAt: new Date().toISOString(),
    })
    const docSnap = await getDoc(userDoc(userId, 'parcels', id))
    return { data: { id, userId, ...docSnap.data() } as Parcel, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function deleteParcel(userId: string, id: string) {
  try {
    await deleteDoc(userDoc(userId, 'parcels', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Expense Types ──────────────────────────────────────────────────────────

export async function getExpenseTypes(): Promise<{ data: ExpenseType[]; error: Error | null }> {
  try {
    const q = query(collection(db, 'expense_types'), where('isActive', '==', true), orderBy('name'))
    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseType))
    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function getExpenses(
  userId: string,
  filters?: { parcelId?: string; from?: string; to?: string }
): Promise<{ data: Expense[]; error: Error | null }> {
  try {
    let q = query(userCollection(userId, 'expenses'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as Expense))

    if (filters?.from) data = data.filter((e) => e.date >= filters.from!)
    if (filters?.to) data = data.filter((e) => e.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createExpense(userId: string, expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(userCollection(userId, 'expenses'), {
      ...expense,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    return { data: { id: docRef.id, userId, ...expense, createdAt: now, updatedAt: now } as Expense, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateExpense(userId: string, id: string, expense: Partial<Expense>) {
  try {
    await updateDoc(userDoc(userId, 'expenses', id), {
      ...expense,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteExpense(userId: string, id: string) {
  try {
    await deleteDoc(userDoc(userId, 'expenses', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Incomes ────────────────────────────────────────────────────────────────

export async function getIncomes(
  userId: string,
  filters?: { parcelId?: string; from?: string; to?: string }
): Promise<{ data: Income[]; error: Error | null }> {
  try {
    let q = query(userCollection(userId, 'incomes'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as Income))

    if (filters?.from) data = data.filter((i) => i.date >= filters.from!)
    if (filters?.to) data = data.filter((i) => i.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createIncome(userId: string, income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(userCollection(userId, 'incomes'), {
      ...income,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    return { data: { id: docRef.id, userId, ...income, createdAt: now, updatedAt: now } as Income, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateIncome(userId: string, id: string, income: Partial<Income>) {
  try {
    await updateDoc(userDoc(userId, 'incomes', id), {
      ...income,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteIncome(userId: string, id: string) {
  try {
    await deleteDoc(userDoc(userId, 'incomes', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Gas Usages ─────────────────────────────────────────────────────────────

export async function getGasUsages(
  userId: string,
  filters?: { parcelId?: string; from?: string; to?: string }
): Promise<{ data: GasUsage[]; error: Error | null }> {
  try {
    let q = query(userCollection(userId, 'gasUsages'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as GasUsage))

    if (filters?.from) data = data.filter((g) => g.date >= filters.from!)
    if (filters?.to) data = data.filter((g) => g.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createGasUsage(userId: string, gas: Omit<GasUsage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(userCollection(userId, 'gasUsages'), {
      ...gas,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    return { data: { id: docRef.id, userId, ...gas, createdAt: now, updatedAt: now } as GasUsage, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateGasUsage(userId: string, id: string, gas: Partial<GasUsage>) {
  try {
    await updateDoc(userDoc(userId, 'gasUsages', id), {
      ...gas,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteGasUsage(userId: string, id: string) {
  try {
    await deleteDoc(userDoc(userId, 'gasUsages', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Cooperative Supports ───────────────────────────────────────────────────

export async function getCooperativeSupports(
  userId: string,
  filters?: { parcelId?: string; from?: string; to?: string }
): Promise<{ data: CooperativeSupport[]; error: Error | null }> {
  try {
    let q = query(userCollection(userId, 'cooperativeSupports'), orderBy('date', 'desc'))
    if (filters?.parcelId) q = query(q, where('parcelId', '==', filters.parcelId))
    const snapshot = await getDocs(q)
    let data = snapshot.docs.map((d) => ({ id: d.id, userId, ...d.data() } as CooperativeSupport))

    if (filters?.from) data = data.filter((c) => c.date >= filters.from!)
    if (filters?.to) data = data.filter((c) => c.date <= filters.to!)

    return { data, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function createCooperativeSupport(userId: string, support: Omit<CooperativeSupport, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString()
    const docRef = await addDoc(userCollection(userId, 'cooperativeSupports'), {
      ...support,
      userId,
      createdAt: now,
      updatedAt: now,
    })
    return { data: { id: docRef.id, userId, ...support, createdAt: now, updatedAt: now } as CooperativeSupport, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateCooperativeSupport(userId: string, id: string, support: Partial<CooperativeSupport>) {
  try {
    await updateDoc(userDoc(userId, 'cooperativeSupports', id), {
      ...support,
      updatedAt: new Date().toISOString(),
    })
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

export async function deleteCooperativeSupport(userId: string, id: string) {
  try {
    await deleteDoc(userDoc(userId, 'cooperativeSupports', id))
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ─── Financial Summary ──────────────────────────────────────────────────────

export async function getFinancialSummary(
  userId: string,
  parcelId?: string
): Promise<FinancialSummary> {
  const [incomes, expenses, gasUsages, cooperative, parcels] = await Promise.all([
    getIncomes(userId, parcelId ? { parcelId } : undefined),
    getExpenses(userId, parcelId ? { parcelId } : undefined),
    getGasUsages(userId, parcelId ? { parcelId } : undefined),
    getCooperativeSupports(userId, parcelId ? { parcelId } : undefined),
    getParcels(userId),
  ])

  const totalIncome = incomes.data.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalExpenses = expenses.data.reduce((sum, r) => sum + r.amount, 0)
  const totalGas = gasUsages.data.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalCooperative = cooperative.data.reduce((sum, r) => sum + r.amount, 0)
  const netProfit = totalIncome - totalExpenses - totalGas - totalCooperative
  const parcelCount = parcelId ? 1 : parcels.data.filter((p) => p.status === 'active').length

  return { totalIncome, totalExpenses, totalGas, totalCooperative, netProfit, parcelCount }
}

// ─── Recent Activity ────────────────────────────────────────────────────────

export async function getRecentActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
  const [expenses, incomes, gasUsages, cooperative] = await Promise.all([
    getDocs(query(userCollection(userId, 'expenses'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
    getDocs(query(userCollection(userId, 'incomes'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
    getDocs(query(userCollection(userId, 'gasUsages'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
    getDocs(query(userCollection(userId, 'cooperativeSupports'), orderBy('createdAt', 'desc'), firestoreLimit(limit))),
  ])

  const items: ActivityItem[] = [
    ...expenses.docs.map((d) => ({
      id: d.id,
      type: 'expense' as const,
      description: d.data().description || 'Dépense',
      amount: d.data().amount,
      date: d.data().date,
      parcelName: undefined,
    })),
    ...incomes.docs.map((d) => ({
      id: d.id,
      type: 'income' as const,
      description: d.data().productName,
      amount: d.data().totalAmount,
      date: d.data().date,
      parcelName: undefined,
    })),
    ...gasUsages.docs.map((d) => ({
      id: d.id,
      type: 'gas' as const,
      description: `${d.data().quantityBottles} bouteilles`,
      amount: d.data().totalAmount,
      date: d.data().date,
      parcelName: undefined,
    })),
    ...cooperative.docs.map((d) => ({
      id: d.id,
      type: 'cooperative' as const,
      description: d.data().supportType,
      amount: d.data().amount,
      date: d.data().date,
      parcelName: undefined,
    })),
  ]

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}
