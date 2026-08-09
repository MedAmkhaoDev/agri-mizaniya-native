import { useState, useEffect, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  onSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

interface UseRealtimeCollectionOptions {
  constraints?: QueryConstraint[]
  enabled?: boolean
}

export type WithPending<T> = T & { _pending: boolean }

export function useRealtimeCollection<T>(
  collectionPath: string,
  options?: UseRealtimeCollectionOptions
): { data: WithPending<T>[]; loading: boolean; error: Error | null; hasPendingWrites: boolean; refreshing: boolean; refresh: () => void } {
  const [data, setData] = useState<WithPending<T>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasPendingWrites, setHasPendingWrites] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const prevPath = useRef(collectionPath)

  const refresh = () => {
    setRefreshing(true)
    setRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false)
      return
    }

    if (prevPath.current !== collectionPath) {
      setLoading(true)
      prevPath.current = collectionPath
    }

    const q = options?.constraints?.length
      ? query(collection(db, collectionPath), ...options.constraints)
      : collection(db, collectionPath)

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          _pending: doc.metadata.hasPendingWrites,
        })) as unknown as WithPending<T>[]
        setData(items)
        setHasPendingWrites(snapshot.metadata.hasPendingWrites)
        setLoading(false)
        setError(null)
        setRefreshing(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
        setRefreshing(false)
      }
    )

    return () => unsubscribe()
  }, [collectionPath, options?.enabled, refreshKey, JSON.stringify(options?.constraints)])

  return { data, loading, error, hasPendingWrites, refreshing, refresh }
}

export function watchCollection<T>(
  collectionPath: string,
  callback: (data: WithPending<T>[]) => void,
  constraints?: QueryConstraint[]
): () => void {
  const q = constraints?.length
    ? query(collection(db, collectionPath), ...constraints)
    : collection(db, collectionPath)

  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      _pending: doc.metadata.hasPendingWrites,
    })) as unknown as WithPending<T>[]
    callback(items)
  })
}
