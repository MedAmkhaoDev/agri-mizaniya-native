import React, { createContext, useContext, useEffect, useCallback, useState } from 'react'
import { useFarmStore } from './farm-store'
import { useAuth } from './auth-context'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Farm, FarmRole } from './types'
import {
  canCreateEntries,
  canEditOwnEntries,
  canEditAnyEntries,
  canDeleteOwnEntries,
  canDeleteAnyEntries,
  canManageParcels,
  canExportReports,
  canManageMembers,
  canManageFarmSettings,
  canDeleteFarm,
  canLeaveFarm,
  isViewer,
  isWorker,
  isOwner,
} from './permissions'

interface FarmContextType {
  currentFarmId: string | null
  currentFarm: Farm | null
  currentRole: FarmRole | null
  userFarms: Farm[]
  loading: boolean
  switchFarm: (farmId: string) => Promise<void>
  refreshFarm: () => Promise<void>
  reloadFarms: () => Promise<void>
  canWrite: boolean
  canCreateEntries: boolean
  canEditOwnEntries: boolean
  canEditAnyEntries: boolean
  canDeleteOwnEntries: boolean
  canDeleteAnyEntries: boolean
  canManageParcels: boolean
  canExportReports: boolean
  canManageMembers: boolean
  canManageFarmSettings: boolean
  canDeleteFarm: boolean
  canLeaveFarm: boolean
  isViewer: boolean
  isWorker: boolean
  isOwner: boolean
}

const FarmContext = createContext<FarmContextType | null>(null)

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, migrating, refreshProfile } = useAuth()
  const store = useFarmStore()
  const [initialized, setInitialized] = useState(false)

  const loadUserFarms = useCallback(async () => {
    if (!user) return

    let farmIds: string[] = []
    let currentFarmId: string | null = null
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      if (userSnap.exists()) {
        const userData = userSnap.data()
        farmIds = userData.farmIds || []
        currentFarmId = userData.currentFarmId || null
      }
    } catch (e) {
      console.error('loadUserFarms: error fetching user profile:', e)
    }

    if (farmIds.length === 0) {
      store.setFarmsAndLoading([], false)
      store.setCurrentFarm(null)
      store.setCurrentRole(null)
      setInitialized(true)
      return
    }

    try {
      const farmDocs = await Promise.all(
        farmIds.map(async (fid) => {
          const snap = await getDoc(doc(db, 'farms', fid))
          return snap.exists() ? ({ id: snap.id, ...snap.data() } as Farm) : null
        })
      )
      const farms = farmDocs.filter(Boolean) as Farm[]

      // Determine target farm
      let targetFarm: Farm | null = null
      if (currentFarmId && farms.find((f) => f.id === currentFarmId)) {
        targetFarm = farms.find((f) => f.id === currentFarmId)!
      } else if (farms.length > 0) {
        targetFarm = farms[0]
        await updateDoc(doc(db, 'users', user.uid), { currentFarmId: farms[0].id })
      }

      // Load role BEFORE updating store to avoid flash of no-permission UI
      let targetRole: FarmRole | null = null
      if (targetFarm) {
        const memberSnap = await getDoc(doc(db, 'farms', targetFarm.id, 'members', user.uid))
        if (memberSnap.exists()) {
          targetRole = memberSnap.data().role as FarmRole
        }
      }

      // Update store once with all data — farms + loading in one Zustand set()
      store.setFarmsAndLoading(farms, false)
      store.setCurrentFarm(targetFarm)
      store.setCurrentRole(targetRole)
    } catch (e) {
      console.error('loadUserFarms error:', e)
      store.setFarmsAndLoading(store.userFarms, false)
    } finally {
      setInitialized(true)
    }
  }, [user])

  useEffect(() => {
    if (user && !authLoading && !migrating && !initialized) {
      loadUserFarms()
    }
    if (!user) {
      store.clear()
      setInitialized(false)
    }
  }, [user, authLoading, migrating, initialized, loadUserFarms])

  const switchFarm = useCallback(async (farmId: string) => {
    const farm = store.userFarms.find((f) => f.id === farmId)
    if (!farm || !user) return

    // Load role BEFORE updating store
    let newRole: FarmRole | null = null
    const memberSnap = await getDoc(doc(db, 'farms', farmId, 'members', user.uid))
    if (memberSnap.exists()) {
      newRole = memberSnap.data().role as FarmRole
    }

    // Update store once
    store.setCurrentFarm(farm)
    store.setCurrentRole(newRole)
    await updateDoc(doc(db, 'users', user.uid), { currentFarmId: farmId })
  }, [user])

  const refreshFarm = useCallback(async () => {
    if (store.currentFarmId) {
      let updatedFarm: Farm | null = null
      const farmSnap = await getDoc(doc(db, 'farms', store.currentFarmId))
      if (farmSnap.exists()) {
        updatedFarm = { id: farmSnap.id, ...farmSnap.data() } as Farm
      }
      let updatedRole: FarmRole | null = null
      if (user) {
        const memberSnap = await getDoc(doc(db, 'farms', store.currentFarmId, 'members', user.uid))
        if (memberSnap.exists()) {
          updatedRole = memberSnap.data().role as FarmRole
        }
      }
      if (updatedFarm) store.setCurrentFarm(updatedFarm)
      store.setCurrentRole(updatedRole)
    }
  }, [store.currentFarmId, user])

  const reloadFarms = useCallback(async () => {
    setInitialized(false)
    await loadUserFarms()
  }, [loadUserFarms])

  const role = store.currentRole

  const value: FarmContextType = {
    currentFarmId: store.currentFarmId,
    currentFarm: store.currentFarm,
    currentRole: store.currentRole,
    userFarms: store.userFarms,
    loading: store.loading,
    switchFarm,
    refreshFarm,
    reloadFarms,
    canWrite: canCreateEntries(role),
    canCreateEntries: canCreateEntries(role),
    canEditOwnEntries: canEditOwnEntries(role),
    canEditAnyEntries: canEditAnyEntries(role),
    canDeleteOwnEntries: canDeleteOwnEntries(role),
    canDeleteAnyEntries: canDeleteAnyEntries(role),
    canManageParcels: canManageParcels(role),
    canExportReports: canExportReports(role),
    canManageMembers: canManageMembers(role),
    canManageFarmSettings: canManageFarmSettings(role),
    canDeleteFarm: canDeleteFarm(role),
    canLeaveFarm: canLeaveFarm(role),
    isViewer: isViewer(role),
    isWorker: isWorker(role),
    isOwner: isOwner(role),
  }

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

export function useFarm() {
  const ctx = useContext(FarmContext)
  if (!ctx) throw new Error('useFarm must be used within FarmProvider')
  return ctx
}
