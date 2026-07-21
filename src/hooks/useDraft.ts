import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DRAFT_KEY = 'agri-mizane-drafts'

interface Drafts {
  expense: Record<string, any>
  income: Record<string, any>
}

async function readDrafts(): Promise<Drafts> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : { expense: {}, income: {} }
  } catch {
    return { expense: {}, income: {} }
  }
}

async function writeDrafts(drafts: Drafts) {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
  } catch {}
}

export function useDraft(kind: 'expense' | 'income') {
  const [draft, setDraftState] = useState<Record<string, any>>({})

  const setDraft = useCallback(
    async (values: Record<string, any>) => {
      setDraftState(values)
      const all = await readDrafts()
      all[kind] = values
      await writeDrafts(all)
    },
    [kind],
  )

  const loadDraft = useCallback(async () => {
    const all = await readDrafts()
    setDraftState(all[kind] || {})
  }, [kind])

  const clearDraft = useCallback(async () => {
    setDraftState({})
    const all = await readDrafts()
    all[kind] = {}
    await writeDrafts(all)
  }, [kind])

  return { draft, setDraft, clearDraft, loadDraft }
}

// --- Last parcel persistence ---

const LAST_PARCEL_KEY = 'agri-mizane-last-parcel'

export async function getLastParcelId(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_PARCEL_KEY)
}

export async function setLastParcelId(id: string) {
  await AsyncStorage.setItem(LAST_PARCEL_KEY, id)
}

// --- Recent products ---

const RECENT_PRODUCTS_KEY = 'agri-mizane-recent-products'

export async function getRecentProducts(limit = 8): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_PRODUCTS_KEY)
    return raw ? JSON.parse(raw).slice(0, limit) : []
  } catch {
    return []
  }
}

export async function addRecentProduct(name: string) {
  if (!name.trim()) return
  const list = await getRecentProducts(50)
  const filtered = list.filter(p => p.toLowerCase() !== name.toLowerCase())
  filtered.unshift(name.trim())
  await AsyncStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(filtered.slice(0, 50)))
}

// --- Recent amounts ---

const RECENT_AMOUNTS_KEY = 'agri-mizane-recent-amounts'

export async function getRecentAmounts(limit = 5): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_AMOUNTS_KEY)
    return raw ? JSON.parse(raw).slice(0, limit) : []
  } catch {
    return []
  }
}

export async function addRecentAmount(amount: number) {
  if (!amount || amount <= 0) return
  const list = await getRecentAmounts(20)
  const filtered = list.filter(a => a !== amount)
  filtered.unshift(amount)
  await AsyncStorage.setItem(RECENT_AMOUNTS_KEY, JSON.stringify(filtered.slice(0, 20)))
}
