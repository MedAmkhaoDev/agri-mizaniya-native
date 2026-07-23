import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createGasUsage, getParcels } from '@/lib/api'
import { getLastParcelId, setLastParcelId } from '@/hooks/useDraft'
import { BottomSheet } from '@/components/BottomSheet'
import { filterNumeric } from '@/lib/format'
import Toast from 'react-native-toast-message'
import { MapPin, Check } from 'lucide-react-native'
import type { Parcel } from '@/lib/types'

interface AddGasSheetProps {
  visible: boolean
  onClose: () => void
  defaultParcelId?: string
}

export default function AddGasSheet({ visible, onClose, defaultParcelId }: AddGasSheetProps) {
  const { user } = useAuth()
  const { currentFarmId } = useFarm()
  const { t } = useI18n()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [parcelId, setParcelId] = useState('')
  const [quantityBottles, setQuantityBottles] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadParcels = useCallback(async () => {
    if (!user || !currentFarmId) return
    const { data } = await getParcels(currentFarmId!)
    const active = data.filter((p) => p.status === 'active')
    const lastId = defaultParcelId || (await getLastParcelId())
    const sorted = [...active].sort((a, b) => {
      if (a.id === lastId) return -1
      if (b.id === lastId) return 1
      return 0
    })
    setParcels(sorted)
    if (!parcelId && sorted.length > 0) {
      const prefill = sorted.find((p) => p.id === lastId) || sorted[0]
      setParcelId(prefill.id)
    }
  }, [defaultParcelId, parcelId, user, currentFarmId])

  useEffect(() => {
    if (visible) {
      loadParcels()
      setQuantityBottles('')
      setTotalAmount('')
      setNotes('')
    }
  }, [visible, loadParcels])

  const pricePerBottle = quantityBottles && totalAmount && parseFloat(quantityBottles) > 0
    ? parseFloat(totalAmount) / parseFloat(quantityBottles)
    : null

  const handleSave = async () => {
    if (!user || !parcelId || !quantityBottles || !totalAmount) return
    setSaving(true)
    try {
      await setLastParcelId(parcelId)
      await createGasUsage(currentFarmId!, user.uid, {
        parcelId,
        quantityBottles: parseFloat(quantityBottles),
        totalAmount: parseFloat(totalAmount),
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
      })
      onClose()
      Toast.show({ type: 'success', text1: t.gasUsage + ' ✓' })
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || t.error })
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-5 pt-1 pb-2.5">
        <Text className="text-[17px] font-bold text-orange-500 dark:text-orange-500 mb-4">{t.addGas}</Text>

        <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-[1px] mb-2">{t.parcel}</Text>
        <FlatList
          horizontal
          data={parcels}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 mb-4"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setParcelId(item.id)} className={`px-3.5 py-2 rounded-[10px] border ${parcelId === item.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
              <Text className={`text-[13px] font-medium ${parcelId === item.id ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.quantityBottles}</Text>
            <TextInput value={quantityBottles} onChangeText={v => setQuantityBottles(filterNumeric(v))} keyboardType="decimal-pad" placeholder="5" placeholderTextColor="#9CA3AF" className="h-12 border border-gray-200 dark:border-gray-600 rounded-[10px] px-4 text-[15px] text-gray-900 dark:text-white" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.amount} (MAD)</Text>
            <TextInput value={totalAmount} onChangeText={v => setTotalAmount(filterNumeric(v))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" className="h-12 border border-gray-200 dark:border-gray-600 rounded-[10px] px-4 text-[15px] text-gray-900 dark:text-white" />
          </View>
        </View>

        {pricePerBottle ? (
          <View className="p-3 rounded-[10px] bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 mb-3">
            <Text className="text-[13px] text-orange-900 dark:text-orange-200">{t.pricePerBottle}: <Text className="font-bold">{Math.round(pricePerBottle)} MAD</Text></Text>
          </View>
        ) : null}

        <Text className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.notes} ({t.optional})</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF" className="h-12 border border-gray-200 dark:border-gray-600 rounded-[10px] px-4 text-[15px] text-gray-900 dark:text-white mb-4" />

        <TouchableOpacity onPress={handleSave} disabled={!parcelId || !quantityBottles || !totalAmount || saving} className={`h-14 rounded-xl items-center justify-center flex-row gap-2 ${!parcelId || !quantityBottles || !totalAmount || saving ? 'bg-orange-200 dark:bg-orange-800' : 'bg-orange-500 dark:bg-orange-600'}`}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={20} color="#FFFFFF" />}
          <Text className="text-white text-base font-bold">{t.save}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
