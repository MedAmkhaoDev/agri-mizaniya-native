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
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-[20px] p-5 w-full max-w-[400px] max-h-[70%]" style={{ boxShadow: '0px 8px 32px rgba(0,0,0,0.15)' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{t.myFarms}</Text>
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
                className={`flex-row items-center p-3.5 rounded-xl border mb-2 ${isActive ? 'border-green-600 dark:border-emerald-500 bg-green-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isActive ? 'bg-green-100 dark:bg-emerald-900/50' : 'bg-gray-100 dark:bg-gray-600'}`}>
                  <Text className={`text-lg font-bold ${isActive ? 'text-green-600 dark:text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {farm.name[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">{farm.name}</Text>
                  {farm.description ? (
                    <Text className="text-xs text-gray-400 dark:text-gray-400 mt-0.5" numberOfLines={1}>{farm.description}</Text>
                  ) : null}
                </View>
                {isActive && <Check size={18} color="#16A34A" />}
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            onPress={() => { onClose(); onCreateNew() }}
            className="flex-row items-center justify-center p-3.5 rounded-xl border border-gray-300 dark:border-gray-500 border-dashed mt-1"
          >
            <Plus size={16} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1.5">{t.addFarm}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
