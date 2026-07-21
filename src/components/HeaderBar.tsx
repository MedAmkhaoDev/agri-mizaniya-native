import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Settings, ChevronDown, ChevronLeft } from 'lucide-react-native'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import FarmSwitcherModal from './FarmSwitcherModal'

interface HeaderBarProps {
  title: string
  right?: React.ReactNode
  showFarmSwitcher?: boolean
  showBack?: boolean
  showSettings?: boolean
}

export function HeaderBar({ title, right, showFarmSwitcher = true, showBack = false, showSettings = true }: HeaderBarProps) {
  const router = useRouter()
  const { currentFarm, userFarms } = useFarm()
  const { t } = useI18n()
  const [farmSwitcherVisible, setFarmSwitcherVisible] = useState(false)

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{title}</Text>
          {showFarmSwitcher && currentFarm && userFarms.length > 1 && (
            <TouchableOpacity onPress={() => setFarmSwitcherVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
              <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '500' }}>{currentFarm.name}</Text>
              <ChevronDown size={12} color="#16A34A" />
            </TouchableOpacity>
          )}
          {showFarmSwitcher && currentFarm && userFarms.length <= 1 && (
            <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '500', marginTop: 2 }}>{currentFarm.name}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {right}
          {showSettings && (
            <TouchableOpacity onPress={() => router.push('/(app)/tools/settings')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FarmSwitcherModal visible={farmSwitcherVisible} onClose={() => setFarmSwitcherVisible(false)} onCreateNew={() => { setFarmSwitcherVisible(false); router.push('/(farm-select)/create') }} />
    </>
  )
}
