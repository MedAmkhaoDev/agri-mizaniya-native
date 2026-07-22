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
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, maxHeight: '70%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.myFarms}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {userFarms.map((farm) => {
            const isActive = farm.id === currentFarm?.id
            return (
              <TouchableOpacity
                key={farm.id}
                onPress={() => handleSelectFarm(farm)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isActive ? '#16A34A' : '#E5E7EB',
                  backgroundColor: isActive ? '#F0FDF4' : '#FFFFFF',
                  marginBottom: 8,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isActive ? '#DCFCE7' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: isActive ? '#16A34A' : '#6B7280' }}>
                    {farm.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{farm.name}</Text>
                  {farm.description ? (
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }} numberOfLines={1}>{farm.description}</Text>
                  ) : null}
                </View>
                {isActive && <Check size={18} color="#16A34A" />}
              </TouchableOpacity>
            )
          })}

          <TouchableOpacity
            onPress={() => { onClose(); onCreateNew() }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', marginTop: 4 }}
          >
            <Plus size={16} color="#6B7280" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6B7280', marginLeft: 6 }}>{t.addFarm}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
