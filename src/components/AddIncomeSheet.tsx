import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { createIncome, getParcels } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { useDraft, getLastParcelId, setLastParcelId, getRecentProducts, addRecentProduct } from '@/hooks/useDraft'
import { formatMADDecimal } from '@/lib/format'
import Toast from 'react-native-toast-message'
import { MapPin, Check, X, Package } from 'lucide-react-native'
import type { Parcel } from '@/lib/types'

interface AddIncomeSheetProps {
  visible: boolean
  onClose: () => void
  defaultParcelId?: string
}

const UNITS = ['kg', 'quintal', 'tonne', 'litre', 'caisse', 'sac', 'unité']

export default function AddIncomeSheet({ visible, onClose, defaultParcelId }: AddIncomeSheetProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const { draft, setDraft, clearDraft, loadDraft } = useDraft('income')
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [saving, setSaving] = useState(false)
  const [recentProducts, setRecentProducts] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      loadDraft()
      getRecentProducts(8).then(setRecentProducts)
    }
  }, [visible, loadDraft])

  const loadParcels = useCallback(async () => {
    if (!user) return
    const { data } = await getParcels(user.uid)
    const active = data.filter((p) => p.status === 'active')
    const lastId = defaultParcelId || (await getLastParcelId())
    const sorted = [...active].sort((a, b) => {
      if (a.id === lastId) return -1
      if (b.id === lastId) return 1
      return 0
    })
    setParcels(sorted)
    if (!draft.parcel_id && sorted.length > 0) {
      const prefill = sorted.find((p) => p.id === lastId) || sorted[0]
      setDraft({ ...draft, parcel_id: prefill.id })
    }
  }, [defaultParcelId, draft, setDraft, user])

  useEffect(() => {
    if (visible) loadParcels()
  }, [visible, loadParcels])

  const update = (patch: Record<string, any>) => setDraft({ ...draft, ...patch })

  const reset = () => clearDraft()

  const unitPrice =
    draft.quantity && draft.total_amount && parseFloat(draft.quantity) > 0
      ? parseFloat(draft.total_amount) / parseFloat(draft.quantity)
      : null

  const handleSave = async () => {
    if (!user || !draft.product_name || !draft.total_amount || !draft.parcel_id) return
    setSaving(true)
    try {
      await setLastParcelId(draft.parcel_id)
      await addRecentProduct(draft.product_name)
      await createIncome(user.uid, {
        parcelId: draft.parcel_id,
        productName: draft.product_name,
        quantity: draft.quantity ? parseFloat(draft.quantity) : null,
        unit: draft.unit || null,
        totalAmount: parseFloat(draft.total_amount),
        date: draft.date || new Date().toISOString().split('T')[0],
        notes: null,
      })
      reset()
      onClose()
      Toast.show({ type: 'success', text1: t.incomeSaved })
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || t.error })
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#10B981' }}>{t.addIncome}</Text>
          {draft.product_name ? (
            <TouchableOpacity onPress={reset} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <X size={14} color="#9CA3AF" />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.clear}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Product name input */}
        <TextInput
          value={draft.product_name || ''}
          onChangeText={(v) => update({ product_name: v })}
          placeholder={t.productName}
          placeholderTextColor="#D1D5DB"
          style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, fontWeight: '500', color: '#111827' }}
        />

        {/* Recent products */}
        {recentProducts.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {recentProducts.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => update({ product_name: p })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: draft.product_name === p ? '#10B981' : '#E5E7EB',
                  backgroundColor: draft.product_name === p ? '#ECFDF5' : '#FFFFFF',
                }}
              >
                <Package size={12} color={draft.product_name === p ? '#10B981' : '#9CA3AF'} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: draft.product_name === p ? '#059669' : '#374151' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Quantity + Unit */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TextInput
            keyboardType="decimal-pad"
            value={draft.quantity || ''}
            onChangeText={(v) => update({ quantity: v })}
            placeholder={t.quantity}
            placeholderTextColor="#D1D5DB"
            style={{ flex: 1, height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => update({ unit: u })}
                  style={{
                    paddingHorizontal: 12,
                    height: 48,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: draft.unit === u ? '#10B981' : '#E5E7EB',
                    backgroundColor: draft.unit === u ? '#ECFDF5' : '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: draft.unit === u ? '#059669' : '#6B7280' }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Total amount - big input */}
        <TextInput
          keyboardType="decimal-pad"
          value={draft.total_amount || ''}
          onChangeText={(v) => update({ total_amount: v })}
          placeholder="0"
          placeholderTextColor="#D1D5DB"
          style={{
            height: 64,
            fontSize: 30,
            fontWeight: '700',
            textAlign: 'center',
            borderWidth: 2,
            borderColor: '#6EE7B7',
            borderRadius: 12,
            color: '#10B981',
            marginTop: 16,
          }}
        />

        {/* Auto-calculated unit price */}
        {unitPrice && unitPrice > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>{t.unitPrice} · {t.autoCalculated}</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#10B981' }}>
              {formatMADDecimal(unitPrice)} <Text style={{ fontSize: 13, fontWeight: '500' }}>MAD/{draft.unit || 'u'}</Text>
            </Text>
          </View>
        ) : null}

        {/* Parcel list */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 }}>
          {t.parcel}
        </Text>
        <View style={{ gap: 6 }}>
          {parcels.slice(0, 4).map((parcel) => {
            const selected = draft.parcel_id === parcel.id
            return (
              <TouchableOpacity
                key={parcel.id}
                onPress={() => update({ parcel_id: parcel.id })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected ? '#10B981' : '#E5E7EB',
                  backgroundColor: selected ? '#ECFDF5' : '#FFFFFF',
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: selected ? '#D1FAE5' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} color={selected ? '#10B981' : '#9CA3AF'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{parcel.name}</Text>
                  {parcel.areaHectares ? <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{parcel.areaHectares} ha</Text> : null}
                </View>
                {selected ? <Check size={16} color="#10B981" /> : null}
              </TouchableOpacity>
            )
          })}
          {parcels.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 }}>{t.noParcels}</Text>
          ) : null}
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!draft.product_name || !draft.total_amount || !draft.parcel_id || saving}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: !draft.product_name || !draft.total_amount || !draft.parcel_id || saving ? '#A7F3D0' : '#059669',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            marginTop: 16,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" />
          )}
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            {t.save} {draft.total_amount ? `· ${draft.total_amount} MAD` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
