import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createExpense, getExpenseTypes, getParcels, seedExpenseTypes, addExpenseType } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { useDraft, getLastParcelId, setLastParcelId, addRecentAmount, getRecentAmounts } from '@/hooks/useDraft'
import { formatMADDecimal, filterNumeric } from '@/lib/format'
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
      <View className="px-5 pt-1 pb-2.5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[17px] font-bold text-red-500 dark:text-red-500">{t.addExpense}</Text>
          {draft.description ? (
            <TouchableOpacity onPress={reset} className="flex-row items-center gap-1">
              <X size={14} color="#9CA3AF" />
              <Text className="text-xs text-muted-foreground">{t.clear}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <BottomSheetTextInput
          value={draft.description || ''}
          onChangeText={(v) => update({ description: v })}
          placeholder={t.description}
          placeholderTextColor="#9CA3AF"
          className="h-12 border border-border rounded-[10px] px-4 text-[15px] font-medium text-foreground"
        />

        <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1px] mt-5 mb-2.5">
          {t.expenseType}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {expenseTypes.map((type) => {
            const selected = draft.type_id === type.id
            const IconComp = ICON_MAP[type.icon] || MoreHorizontal
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => update({ type_id: selected ? null : type.id })}
                className={`w-[30%] items-center p-2 rounded-xl border-2 ${selected ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-transparent bg-accent'}`}
              >
                <View className="w-9 h-9 rounded-[10px] items-center justify-center mb-1" style={{ backgroundColor: type.color + '20' }}>
                  <IconComp size={18} color={type.color} />
                </View>
                <Text className="text-[11px] font-medium text-center text-foreground" numberOfLines={2}>
                  {type.nameFr || type.name}
                </Text>
              </TouchableOpacity>
            )
          })}
          {!addingCustom ? (
            <TouchableOpacity
              onPress={() => setAddingCustom(true)}
              className="w-[30%] items-center p-2 rounded-xl border-2 border-border border-dashed bg-card"
            >
              <View className="w-9 h-9 rounded-[10px] bg-accent items-center justify-center mb-1">
                <Text className="text-lg font-semibold text-muted-foreground">+</Text>
              </View>
              <Text className="text-[11px] font-medium text-center text-muted-foreground" numberOfLines={2}>
                {t.other}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {addingCustom ? (
          <View className="flex-row items-center gap-2 mt-2.5">
            <BottomSheetTextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder={t.expenseType}
              placeholderTextColor="#9CA3AF"
              autoFocus
              className="flex-1 h-12 border border-border rounded-[10px] px-3 text-sm text-foreground"
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
              className={`w-[42px] h-[42px] rounded-[10px] items-center justify-center ${customName.trim() ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              <Check size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAddingCustom(false); setCustomName('') }}
              className="w-[42px] h-[42px] rounded-[10px] bg-accent items-center justify-center"
            >
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mt-4">
          <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.quantity}</Text>
          <BottomSheetTextInput
            keyboardType="decimal-pad"
            value={draft.quantity || ''}
            onChangeText={(v) => update({ quantity: filterNumeric(v) })}
            placeholder={t.quantity}
            placeholderTextColor="#9CA3AF"
            className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 mt-2">
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => update({ unit: u })}
              className={`px-3.5 h-[38px] rounded-[10px] border items-center justify-center ${draft.unit === u ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-border bg-card'}`}
            >
              <Text className={`text-xs font-semibold ${draft.unit === u ? 'text-red-500' : 'text-muted-foreground'}`}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <BottomSheetTextInput
          keyboardType="decimal-pad"
          value={draft.amount || ''}
          onChangeText={(v) => update({ amount: filterNumeric(v) })}
          placeholder={t.amount}
          placeholderTextColor="#9CA3AF"
          className="h-16 text-[30px] font-bold text-center border-2 border-red-300 dark:border-red-700 rounded-xl text-red-500 mt-4"
        />

        {unitPrice && unitPrice > 0 ? (
          <View className="flex-row justify-between items-center p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 mt-3">
            <Text className="text-[13px] text-muted-foreground">{t.unitPrice} · {t.autoCalculated}</Text>
            <Text className="text-[17px] font-bold text-red-500">
              {formatMADDecimal(unitPrice)} <Text className="text-[13px] font-medium">MAD/{draft.unit || 'u'}</Text>
            </Text>
          </View>
        ) : null}

        {recentAmounts.length > 0 && !draft.amount ? (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {recentAmounts.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => update({ amount: a.toString() })}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-border bg-card"
              >
                <Text className="text-[12px] font-medium text-foreground">{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1px] mt-5 mb-2">
          {t.parcel}
        </Text>
        <FlatList
          horizontal
          data={parcels}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => update({ parcel_id: item.id })} className={`px-3.5 py-2 rounded-[10px] border ${draft.parcel_id === item.id ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-border bg-card'}`}>
              <Text className={`text-[13px] font-medium ${draft.parcel_id === item.id ? 'text-red-500' : 'text-muted-foreground'}`}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!draft.amount || !draft.parcel_id || saving}
          className={`h-14 rounded-xl items-center justify-center flex-row gap-2 mt-4 ${!draft.amount || !draft.parcel_id || saving ? 'bg-red-300 dark:bg-red-800' : 'bg-red-500 dark:bg-red-600'}`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" />
          )}
          <Text className="text-white text-base font-bold">
            {t.save} {draft.amount ? `· ${draft.amount} MAD` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
