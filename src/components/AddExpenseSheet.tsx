import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createExpense, getExpenseTypes, getParcels, seedExpenseTypes, addExpenseType } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { useDraft, getLastParcelId, setLastParcelId, addRecentAmount, getRecentAmounts } from '@/hooks/useDraft'
import { formatMADDecimal } from '@/lib/format'
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

const UNITS = ['kg', 'quintal', 'tonne', 'litre', 'caisse', 'sac', 'unité']

export default function AddExpenseSheet({ visible, onClose, defaultParcelId }: AddExpenseSheetProps) {
  const { user } = useAuth()
  const { currentFarmId } = useFarm()
  const { t } = useI18n()
  const { draft, setDraft, clearDraft } = useDraft('expense')
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [saving, setSaving] = useState(false)
  const [recentAmounts, setRecentAmounts] = useState<number[]>([])
  const [addingCustom, setAddingCustom] = useState(false)
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (visible) {
      getExpenseTypes().then(async ({ data }) => {
        if (data.length === 0) {
          await seedExpenseTypes()
          const { data: seeded } = await getExpenseTypes()
          setExpenseTypes(seeded)
        } else {
          setExpenseTypes(data)
        }
      })
      getRecentAmounts(4).then(setRecentAmounts)
    }
  }, [visible])

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
    if (!draft.parcel_id && sorted.length > 0) {
      const prefill = sorted.find((p) => p.id === lastId) || sorted[0]
      setDraft({ ...draft, parcel_id: prefill.id })
    }
  }, [defaultParcelId, draft, setDraft, user, currentFarmId])

  useEffect(() => {
    if (visible) loadParcels()
  }, [visible, loadParcels])

  const update = (patch: Record<string, any>) => setDraft({ ...draft, ...patch })

  const reset = () => clearDraft()

  const quantity = parseFloat(draft.quantity || '')
  const amount = parseFloat(draft.amount || '')
  const unitPrice = quantity > 0 && amount > 0 ? amount / quantity : null

  const handleSave = async () => {
    if (!user || !draft.parcel_id || !draft.amount) return
    setSaving(true)
    try {
      await setLastParcelId(draft.parcel_id)
      await addRecentAmount(parseFloat(draft.amount))
      await createExpense(currentFarmId!, user.uid, {
        parcelId: draft.parcel_id,
        typeId: draft.type_id || null,
        amount: parseFloat(draft.amount),
        description: draft.description || null,
        quantity: draft.quantity ? parseFloat(draft.quantity) : null,
        unit: draft.unit || null,
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
          {draft.description ? (
            <TouchableOpacity onPress={reset} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <X size={14} color="#9CA3AF" />
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.clear}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Description input */}
        <TextInput
          value={draft.description || ''}
          onChangeText={(v) => update({ description: v })}
          placeholder={t.description}
          placeholderTextColor="#D1D5DB"
          style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, fontWeight: '500', color: '#111827' }}
        />

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
          {!addingCustom ? (
            <TouchableOpacity
              onPress={() => setAddingCustom(true)}
              style={{
                width: '18%',
                alignItems: 'center',
                padding: 8,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#D1D5DB',
                borderStyle: 'dashed',
                backgroundColor: '#FAFAFA',
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#9CA3AF' }}>+</Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '500', textAlign: 'center', color: '#9CA3AF' }} numberOfLines={2}>
                {t.other}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {addingCustom ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder={t.expenseType}
              placeholderTextColor="#D1D5DB"
              autoFocus
              style={{ flex: 1, height: 42, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#111827' }}
            />
            <TouchableOpacity
              onPress={async () => {
                if (!customName.trim() || !user) return
                const { id, error } = await addExpenseType(user.uid, customName.trim())
                if (!error && id) {
                  const newType: ExpenseType = { id, userId: user.uid, name: customName.trim(), nameFr: customName.trim(), nameAr: null, icon: 'more-horizontal', color: '#6B7280', isActive: true, createdAt: new Date().toISOString() }
                  setExpenseTypes((prev) => [...prev, newType].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
                  update({ type_id: id })
                  setCustomName('')
                  setAddingCustom(false)
                } else {
                  Toast.show({ type: 'error', text1: error?.message || t.error })
                }
              }}
              disabled={!customName.trim()}
              style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: customName.trim() ? '#EF4444' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
            >
              <Check size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAddingCustom(false); setCustomName('') }}
              style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quantity */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.quantity}</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={draft.quantity || ''}
            onChangeText={(v) => update({ quantity: v })}
            placeholder={t.quantity}
            placeholderTextColor="#D1D5DB"
            style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }}
          />
        </View>

        {/* Unit selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => update({ unit: u })}
              style={{
                paddingHorizontal: 14,
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: draft.unit === u ? '#EF4444' : '#E5E7EB',
                backgroundColor: draft.unit === u ? '#FEF2F2' : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: draft.unit === u ? '#EF4444' : '#6B7280' }}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amount input - big */}
        <TextInput
          keyboardType="decimal-pad"
          value={draft.amount || ''}
          onChangeText={(v) => update({ amount: v })}
          placeholder={t.amount}
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
            marginTop: 16,
          }}
        />

        {/* Auto-calculated unit price */}
        {unitPrice && unitPrice > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>{t.unitPrice} · {t.autoCalculated}</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#EF4444' }}>
              {formatMADDecimal(unitPrice)} <Text style={{ fontSize: 13, fontWeight: '500' }}>MAD/{draft.unit || 'u'}</Text>
            </Text>
          </View>
        ) : null}

        {/* Recent amounts */}
        {recentAmounts.length > 0 && !draft.amount ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {recentAmounts.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => update({ amount: a.toString() })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Parcel list - horizontal chips */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 }}>
          {t.parcel}
        </Text>
        <FlatList
          horizontal
          data={parcels}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => update({ parcel_id: item.id })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: draft.parcel_id === item.id ? '#EF4444' : '#E5E7EB', backgroundColor: draft.parcel_id === item.id ? '#FEF2F2' : '#FFFFFF' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: draft.parcel_id === item.id ? '#EF4444' : '#6B7280' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
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
