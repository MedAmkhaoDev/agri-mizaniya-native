import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native'
import React from 'react'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { Farm } from '@/lib/types'
import { Check, Plus, X } from 'lucide-react-native'

interface FarmSwitcherModalProps {
  visible: boolean
  onClose: () => void
  onCreateNew: () => void
}

export default function FarmSwitcherModal({ visible, onClose, onCreateNew }: FarmSwitcherModalProps) {
  const { userFarms, currentFarm, switchFarm } = useFarm()
  const { t } = useI18n()

  const handleSelectFarm = async (farm: Farm) => {
    if (farm.id === currentFarm?.id) {
      onClose()
      return
    }
    await switchFarm(farm.id)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/30 justify-center items-center p-6" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-card rounded-[20px] p-5 w-full max-w-[400px] max-h-[70%]" style={{ boxShadow: '0px 8px 32px rgba(0,0,0,0.15)' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-foreground">{t.myFarms}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {userFarms.map((farm) => {
            const isActive = farm.id === currentFarm?.id
            return (
              <TouchableOpacity
                key={farm.id}
                onPress={() => handleSelectFarm(farm)}
                className={`flex-row items-center p-3.5 rounded-xl border mb-2 ${isActive ? 'border-green-600 dark:border-emerald-500 bg-green-50 dark:bg-emerald-900/30' : 'border-border bg-card'}`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isActive ? 'bg-green-100 dark:bg-emerald-900/50' : 'bg-accent'}`}>
                  <Text className={`text-lg font-bold ${isActive ? 'text-green-600 dark:text-emerald-500' : 'text-muted-foreground'}`}>
                    {farm.name[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">{farm.name}</Text>
                  {farm.description ? (
                    <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>{farm.description}</Text>
                  ) : null}
                </View>
                {isActive && <Check size={18} color="#16A34A" />}
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            onPress={() => { onClose(); onCreateNew() }}
            className="flex-row items-center justify-center p-3.5 rounded-xl border border-border border-dashed mt-1"
          >
            <Plus size={16} color="#6B7280" />
            <Text className="text-sm font-medium text-muted-foreground ml-1.5">{t.addFarm}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
