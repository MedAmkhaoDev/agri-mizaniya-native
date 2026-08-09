import { useState, useCallback, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFarm } from '@/lib/farm-context'

function draftKey(farmId: string) {
  return `agri-mizane-drafts:${farmId}`
}

interface Drafts {
  expense: Record<string, any>
  income: Record<string, any>
}

async function readDrafts(key: string): Promise<Drafts> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? JSON.parse(raw) : { expense: {}, income: {} }
  } catch {
    return { expense: {}, income: {} }
  }
}

async function writeDrafts(key: string, drafts: Drafts) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(drafts))
  } catch {}
}

export type DraftUpdater = Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)

export function useDraft(kind: 'expense' | 'income') {
  const [draft, setDraftState] = useState<Record<string, any>>({})
  const loadedRef = useRef(false)
  const { currentFarmId } = useFarm()

  const key = draftKey(currentFarmId ?? 'default')
  const keyRef = useRef(key)
  keyRef.current = key

  const draftRef = useRef<Record<string, any>>({})

  useEffect(() => {
    let cancelled = false
    readDrafts(key).then((all) => {
      if (cancelled) return
      draftRef.current = all[kind] || {}
      setDraftState(draftRef.current)
      loadedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [kind, key])

  // Serialize AsyncStorage writes so rapid updates can't interleave
  // (read-modify-write race would otherwise lose the latest draft).
  const writeQueue = useRef(Promise.resolve())

  const persist = useCallback(
    (next: Record<string, any>) => {
      writeQueue.current = writeQueue.current.then(async () => {
        const all = await readDrafts(keyRef.current)
        all[kind] = next
        await writeDrafts(keyRef.current, all)
      })
    },
    [kind],
  )

  const setDraft = useCallback(
    (values: DraftUpdater) => {
      const next = typeof values === 'function' ? values(draftRef.current) : values
      draftRef.current = next
      setDraftState(next)
      persist(next)
    },
    [persist],
  )

  const clearDraft = useCallback(async () => {
    const next = {}
    draftRef.current = next
    setDraftState(next)
    const all = await readDrafts(key)
    all[kind] = {}
    await writeDrafts(key, all)
  }, [kind, key])

  return { draft, setDraft, clearDraft }
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
