import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { enableNetwork, disableNetwork } from 'firebase/firestore'
import { db } from '@/config/firebase'

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error'

interface SyncContextType {
  isConnected: boolean
  syncState: SyncState
  forceSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextType>({
  isConnected: true,
  syncState: 'synced',
  forceSync: async () => {},
})

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true)
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const wasOffline = useRef(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false
      setIsConnected(connected)

      if (!connected) {
        setSyncState('offline')
        wasOffline.current = true
        disableNetwork(db).catch(() => {})
      } else {
        enableNetwork(db).catch(() => {})
        if (wasOffline.current) {
          setSyncState('syncing')
          wasOffline.current = false
          setTimeout(() => setSyncState('synced'), 2000)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const forceSync = useCallback(async () => {
    try {
      setSyncState('syncing')
      const state = await NetInfo.fetch()
      if (state.isConnected) {
        await enableNetwork(db)
        setTimeout(() => setSyncState('synced'), 1500)
      } else {
        setSyncState('offline')
      }
    } catch {
      setSyncState('error')
    }
  }, [])

  return (
    <SyncContext.Provider value={{ isConnected, syncState, forceSync }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  return useContext(SyncContext)
}
