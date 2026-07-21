import { create } from 'zustand'
import type { Farm, FarmRole } from './types'

interface FarmStore {
  currentFarmId: string | null
  currentFarm: Farm | null
  currentRole: FarmRole | null
  userFarms: Farm[]
  loading: boolean

  setCurrentFarm: (farm: Farm | null) => void
  setCurrentRole: (role: FarmRole | null) => void
  setUserFarms: (farms: Farm[]) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useFarmStore = create<FarmStore>((set) => ({
  currentFarmId: null,
  currentFarm: null,
  currentRole: null,
  userFarms: [],
  loading: true,

  setCurrentFarm: (farm) =>
    set({ currentFarmId: farm?.id || null, currentFarm: farm }),

  setCurrentRole: (role) => set({ currentRole: role }),

  setUserFarms: (farms) => set({ userFarms: farms }),

  setLoading: (loading) => set({ loading }),

  clear: () =>
    set({
      currentFarmId: null,
      currentFarm: null,
      currentRole: null,
      userFarms: [],
      loading: false,
    }),
}))
