import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Settings, ChevronDown, ChevronLeft } from 'lucide-react-native'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import FarmSwitcherModal from './FarmSwitcherModal'
import { NotificationBell } from './NotificationBell'

interface HeaderBarProps {
  title: string
  right?: React.ReactNode
  showFarmSwitcher?: boolean
  showBack?: boolean
  showSettings?: boolean
  showNotifications?: boolean
}

export function HeaderBar({ title, right, showFarmSwitcher = true, showBack = false, showSettings = true, showNotifications = true }: HeaderBarProps) {
  const router = useRouter()
  const { currentFarm, userFarms } = useFarm()
  const { t } = useI18n()
  const [farmSwitcherVisible, setFarmSwitcherVisible] = useState(false)

  return (
    <>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-700 items-center justify-center mr-2.5">
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
          {showFarmSwitcher && currentFarm && userFarms.length > 1 && (
            <TouchableOpacity onPress={() => setFarmSwitcherVisible(true)} className="flex-row items-center gap-0.5 mt-0.5">
              <Text className="text-xs text-green-600 dark:text-emerald-500 font-medium">{currentFarm.name}</Text>
              <ChevronDown size={12} color="#16A34A" />
            </TouchableOpacity>
          )}
          {showFarmSwitcher && currentFarm && userFarms.length <= 1 && (
            <Text className="text-xs text-green-600 dark:text-emerald-500 font-medium mt-0.5">{currentFarm.name}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          {right}
          {showNotifications && <NotificationBell />}
          {showSettings && (
            <TouchableOpacity onPress={() => router.push('/(app)/settings')} className="w-9 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-700 items-center justify-center">
              <Settings size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FarmSwitcherModal visible={farmSwitcherVisible} onClose={() => setFarmSwitcherVisible(false)} onCreateNew={() => { setFarmSwitcherVisible(false); router.push('/(farm-select)/create') }} />
    </>
  )
}
