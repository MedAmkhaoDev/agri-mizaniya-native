import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createCooperativeSupport, getParcels } from '@/lib/api'
import { getLastParcelId, setLastParcelId } from '@/hooks/useDraft'
import { BottomSheet } from '@/components/BottomSheet'
import Toast from 'react-native-toast-message'
import { MapPin, Check } from 'lucide-react-native'
import type { Parcel, CooperativeSupportType } from '@/lib/types'

const SUPPORT_TYPES: CooperativeSupportType[] = ['gas', 'seeds', 'tools', 'fertilizer', 'equipment', 'other']
const SUPPORT_COLORS: Record<CooperativeSupportType, string> = {
  gas: '#F97316', seeds: '#10B981', tools: '#3B82F6',
  fertilizer: '#EAB308', equipment: '#8B5CF6', other: '#6B7280',
}

interface AddCooperativeSheetProps {
  visible: boolean
  onClose: () => void
}

export default function AddCooperativeSheet({ visible, onClose }: AddCooperativeSheetProps) {
  const { user } = useAuth()
  const { currentFarmId } = useFarm()
  const { t } = useI18n()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [supportType, setSupportType] = useState<CooperativeSupportType>('other')
  const [amount, setAmount] = useState('')
  const [parcelId, setParcelId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadParcels = useCallback(async () => {
    if (!user || !currentFarmId) return
    const { data } = await getParcels(currentFarmId!)
    const active = data.filter((p) => p.status === 'active')
    const lastId = await getLastParcelId()
    const sorted = [...active].sort((a, b) => {
      if (a.id === lastId) return -1
      if (b.id === lastId) return 1
      return 0
    })
    setParcels(sorted)
    if (!parcelId && sorted.length > 0) {
      setParcelId(sorted[0].id)
    }
  }, [parcelId, user, currentFarmId])

  useEffect(() => {
    if (visible) {
      loadParcels()
      setAmount('')
      setInvoiceNumber('')
      setNotes('')
      setSupportType('other')
    }
  }, [visible, loadParcels])

  const supportTypeLabel = (type: CooperativeSupportType) => t.supportTypes[type] || type

  const handleSave = async () => {
    if (!user || !amount) return
    setSaving(true)
    try {
      if (parcelId) await setLastParcelId(parcelId)
      await createCooperativeSupport(currentFarmId!, user.uid, {
        parcelId: parcelId || null,
        invoiceNumber: invoiceNumber.trim() || null,
        supportType,
        description: null,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
      })
      onClose()
      Toast.show({ type: 'success', text1: t.cooperative + ' ✓' })
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || t.error })
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#8B5CF6', marginBottom: 16 }}>{t.addCooperative}</Text>

        {/* Support type toggle */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.supportType}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {SUPPORT_TYPES.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setSupportType(st)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                borderColor: supportType === st ? SUPPORT_COLORS[st] : '#E5E7EB',
                backgroundColor: supportType === st ? SUPPORT_COLORS[st] + '15' : '#FFFFFF',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: supportType === st ? SUPPORT_COLORS[st] : '#6B7280' }}>
                {supportTypeLabel(st)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.amount} (MAD)</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF"
          style={{ height: 56, borderWidth: 2, borderColor: '#C4B5FD', borderRadius: 12, paddingHorizontal: 16, fontSize: 26, fontWeight: '700', color: '#8B5CF6', textAlign: 'center', marginBottom: 12 }} />

        {/* Invoice number */}
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.invoiceNumber}</Text>
        <TextInput value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="FAC-2024-001" placeholderTextColor="#9CA3AF"
          style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />

        {/* Parcel list */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.parcel}</Text>
        <FlatList
          horizontal
          data={[{ id: '', name: t.none } as Parcel, ...parcels]}
          keyExtractor={(i) => i.id || 'none'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginBottom: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setParcelId(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: parcelId === item.id ? '#8B5CF6' : '#E5E7EB', backgroundColor: parcelId === item.id ? '#F5F3FF' : '#FFFFFF' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: parcelId === item.id ? '#8B5CF6' : '#6B7280' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Notes */}
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.notes} ({t.optional})</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF"
          style={{ height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#111827', marginBottom: 16 }} />

        <TouchableOpacity onPress={handleSave} disabled={!amount || saving}
          style={{ height: 56, borderRadius: 12, backgroundColor: !amount || saving ? '#DDD6FE' : '#8B5CF6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={20} color="#FFFFFF" />}
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{t.save}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
