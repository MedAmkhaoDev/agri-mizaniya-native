import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { createExpense, getExpenseTypes, getParcels } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { useDraft, getLastParcelId, setLastParcelId, addRecentAmount, getRecentAmounts } from '@/hooks/useDraft'
import Toast from 'react-native-toast-message'
import {
  Users, Fuel, Flame, Leaf, Wrench, Truck,
  Sprout, Shield, Droplets, MoreHorizontal, Check, MapPin, X,
} from 'lucide-react-native'
import type { ExpenseType, Parcel } from '@/lib/types'

interface AddExpenseSheetProps {
  visible: boolean
  onClose: () => void
  defaultParcelId?: string
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  users: Users, fuel: Fuel, flame: Flame, leaf: Leaf, wrench: Wrench,
  truck: Truck, sprout: Sprout, shield: Shield, droplets: Droplets,
  'more-horizontal': MoreHorizontal,
}

export default function AddExpenseSheet({ visible, onClose, defaultParcelId }: AddExpenseSheetProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const { draft, setDraft, clearDraft, loadDraft } = useDraft('expense')
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [saving, setSaving] = useState(false)
  const [recentAmounts, setRecentAmounts] = useState<number[]>([])

  useEffect(() => {
    if (visible) {
      loadDraft()
      getExpenseTypes().then(({ data }) => setExpenseTypes(data))
      getRecentAmounts(4).then(setRecentAmounts)
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

  const handleSave = async () => {
    if (!user || !draft.parcel_id || !draft.amount) return
    setSaving(true)
    try {
      await setLastParcelId(draft.parcel_id)
      await addRecentAmount(parseFloat(draft.amount))
      await createExpense(user.uid, {
        parcelId: draft.parcel_id,
        typeId: draft.type_id || null,
        amount: parseFloat(draft.amount),
        description: draft.description || null,
        quantity: null,
        unit: null,
        date: draft.date || new Date().toISOString().split('T')[0],
        notes: null,
      })
      reset()
      onClose()
      Toast.show({ type: 'success', text1: t.expenseSaved })
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
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#EF4444' }}>{t.addExpense}</Text>
          {draft.amount ? (
            <TouchableOpacity onPress={reset} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <X size={14} color="#9CA3AF" />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.clear}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Amount input */}
        <TextInput
          keyboardType="decimal-pad"
          value={draft.amount || ''}
          onChangeText={(v) => update({ amount: v })}
          placeholder="0"
          placeholderTextColor="#D1D5DB"
          style={{
            height: 64,
            fontSize: 30,
            fontWeight: '700',
            textAlign: 'center',
            borderWidth: 2,
            borderColor: '#FCA5A5',
            borderRadius: 12,
            color: '#EF4444',
          }}
        />

        {/* Recent amounts */}
        {recentAmounts.length > 0 && !draft.amount ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{t.recentAmounts}:</Text>
            {recentAmounts.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => update({ amount: a.toString() })}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Expense type grid */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 }}>
          {t.expenseType}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {expenseTypes.map((type) => {
            const selected = draft.type_id === type.id
            const IconComp = ICON_MAP[type.icon] || MoreHorizontal
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => update({ type_id: selected ? null : type.id })}
                style={{
                  width: '18%',
                  alignItems: 'center',
                  padding: 8,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected ? '#EF4444' : 'transparent',
                  backgroundColor: selected ? '#FEF2F2' : '#F3F4F6',
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: type.color + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <IconComp size={18} color={type.color} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '500', textAlign: 'center', color: '#374151' }} numberOfLines={2}>
                  {type.nameFr || type.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

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
                  borderColor: selected ? '#EF4444' : '#E5E7EB',
                  backgroundColor: selected ? '#FEF2F2' : '#FFFFFF',
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: selected ? '#FEE2E2' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={16} color={selected ? '#EF4444' : '#9CA3AF'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{parcel.name}</Text>
                  {parcel.areaHectares ? <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{parcel.areaHectares} ha</Text> : null}
                </View>
                {selected ? <Check size={16} color="#EF4444" /> : null}
              </TouchableOpacity>
            )
          })}
          {parcels.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 }}>{t.noParcels}</Text>
          ) : null}
        </View>

        {/* Description */}
        <TextInput
          value={draft.description || ''}
          onChangeText={(v) => update({ description: v })}
          placeholder={t.description + ' (' + t.optional + ')'}
          placeholderTextColor="#D1D5DB"
          style={{ height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#111827', marginTop: 16 }}
        />

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!draft.amount || !draft.parcel_id || saving}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: !draft.amount || !draft.parcel_id || saving ? '#FCA5A5' : '#EF4444',
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
            {t.save} {draft.amount ? `· ${draft.amount} MAD` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
