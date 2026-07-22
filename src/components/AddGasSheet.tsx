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
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#F97316', marginBottom: 16 }}>{t.addGas}</Text>

        {/* Parcel list */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.parcel}</Text>
        <FlatList
          horizontal
          data={parcels}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setParcelId(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: parcelId === item.id ? '#F97316' : '#E5E7EB', backgroundColor: parcelId === item.id ? '#FFF7ED' : '#FFFFFF' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: parcelId === item.id ? '#F97316' : '#6B7280' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.quantityBottles}</Text>
            <TextInput value={quantityBottles} onChangeText={v => setQuantityBottles(filterNumeric(v))} keyboardType="decimal-pad" placeholder="5" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.amount} (MAD)</Text>
            <TextInput value={totalAmount} onChangeText={v => setTotalAmount(filterNumeric(v))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }} />
          </View>
        </View>

        {pricePerBottle ? (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#92400E' }}>{t.pricePerBottle}: <Text style={{ fontWeight: '700' }}>{Math.round(pricePerBottle)} MAD</Text></Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.notes} ({t.optional})</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 16 }} />

        <TouchableOpacity onPress={handleSave} disabled={!parcelId || !quantityBottles || !totalAmount || saving} style={{ height: 56, borderRadius: 12, backgroundColor: !parcelId || !quantityBottles || !totalAmount || saving ? '#FED7AA' : '#F97316', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={20} color="#FFFFFF" />}
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{t.save}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
