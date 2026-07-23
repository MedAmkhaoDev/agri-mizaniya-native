import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createCooperativeSupport, getParcels } from '@/lib/api'
import { getLastParcelId, setLastParcelId } from '@/hooks/useDraft'
import { BottomSheet } from '@/components/BottomSheet'
import { filterNumeric } from '@/lib/format'
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
      <View className="px-5 pt-1 pb-2.5">
        <Text className="text-[17px] font-bold text-violet-500 dark:text-violet-500 mb-4">{t.addCooperative}</Text>

        <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1px] mb-2">{t.supportType}</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-4">
          {SUPPORT_TYPES.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setSupportType(st)}
              className="px-3.5 py-2 rounded-[10px] border"
              style={{
                borderColor: supportType === st ? SUPPORT_COLORS[st] : '#E5E7EB',
                backgroundColor: supportType === st ? SUPPORT_COLORS[st] + '15' : '#FFFFFF',
              }}
            >
              <Text className="text-[13px] font-medium text-muted-foreground">
                {supportTypeLabel(st)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.amount} (MAD)</Text>
        <BottomSheetTextInput value={amount} onChangeText={v => setAmount(filterNumeric(v))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF"
          className="h-16 border-2 border-violet-300 dark:border-violet-700 rounded-xl text-[30px] font-bold text-violet-500 text-center mt-4 mb-3" />

        <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.invoiceNumber}</Text>
        <BottomSheetTextInput value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="FAC-2024-001" placeholderTextColor="#9CA3AF"
          className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground mb-3" />

        <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1px] mb-2">{t.parcel}</Text>
        <FlatList
          horizontal
          data={[{ id: '', name: t.none } as Parcel, ...parcels]}
          keyExtractor={(i) => i.id || 'none'}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 mb-3"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setParcelId(item.id)} className={`px-3.5 py-2 rounded-[10px] border ${parcelId === item.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-border bg-card'}`}>
              <Text className={`text-[13px] font-medium ${parcelId === item.id ? 'text-violet-500' : 'text-muted-foreground'}`}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.notes} ({t.optional})</Text>
        <BottomSheetTextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF"
          className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground mb-4" />

        <TouchableOpacity onPress={handleSave} disabled={!amount || saving}
          className={`h-14 rounded-xl items-center justify-center flex-row gap-2 ${!amount || saving ? 'bg-violet-200 dark:bg-violet-800' : 'bg-violet-500 dark:bg-violet-600'}`}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={20} color="#FFFFFF" />}
          <Text className="text-white text-base font-bold">{t.save}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
