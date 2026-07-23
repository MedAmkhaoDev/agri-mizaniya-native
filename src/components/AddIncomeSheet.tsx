import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createIncome, getParcels } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { useDraft, getLastParcelId, setLastParcelId, getRecentProducts, addRecentProduct } from '@/hooks/useDraft'
import { formatMADDecimal, filterNumeric } from '@/lib/format'
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
  const { currentFarmId } = useFarm()
  const { t } = useI18n()
  const { draft, setDraft, clearDraft } = useDraft('income')
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [saving, setSaving] = useState(false)
  const [recentProducts, setRecentProducts] = useState<string[]>([])

  useEffect(() => {
    if (visible) {
      getRecentProducts(8).then(setRecentProducts)
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

  const update = (patch: Record<string, any>) => {
    setDraft({ ...draft, ...patch })
  }

  const reset = () => clearDraft()

  const quantity = parseFloat(draft.quantity || '')
  const totalAmount = parseFloat(draft.total_amount || '')
  const unitPrice = quantity > 0 && totalAmount > 0 ? totalAmount / quantity : null

  const handleSave = async () => {
    if (!user || !draft.product_name || !draft.total_amount || !draft.parcel_id) return
    setSaving(true)
    try {
      await setLastParcelId(draft.parcel_id)
      await addRecentProduct(draft.product_name)
      await createIncome(currentFarmId!, user.uid, {
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
      <View className="px-5 pt-1 pb-2.5">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[17px] font-bold text-emerald-500 dark:text-emerald-500">{t.addIncome}</Text>
          {draft.product_name ? (
            <TouchableOpacity onPress={reset} className="flex-row items-center gap-1">
              <X size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 dark:text-gray-400">{t.clear}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TextInput
          value={draft.product_name || ''}
          onChangeText={(v) => update({ product_name: v })}
          placeholder={t.productName}
          placeholderTextColor="#9CA3AF"
          className="h-12 border border-gray-200 dark:border-gray-600 rounded-[10px] px-4 text-[15px] font-medium text-gray-900 dark:text-white"
        />

        {recentProducts.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {recentProducts.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => update({ product_name: p })}
                className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${draft.product_name === p ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
              >
                <Package size={12} color={draft.product_name === p ? '#10B981' : '#9CA3AF'} />
                <Text className={`text-[12px] font-medium ${draft.product_name === p ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View className="mt-4">
          <Text className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.quantity}</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={draft.quantity || ''}
            onChangeText={(v) => update({ quantity: filterNumeric(v) })}
            placeholder={t.quantity}
            placeholderTextColor="#9CA3AF"
            className="h-12 border border-gray-200 dark:border-gray-600 rounded-[10px] px-4 text-[15px] text-gray-900 dark:text-white"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5 mt-2">
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => update({ unit: u })}
              className={`px-3.5 h-[38px] rounded-[10px] border items-center justify-center ${draft.unit === u ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
            >
              <Text className={`text-xs font-semibold ${draft.unit === u ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          keyboardType="decimal-pad"
          value={draft.total_amount || ''}
          onChangeText={(v) => update({ total_amount: filterNumeric(v) })}
          placeholder={t.totalAmount}
          placeholderTextColor="#9CA3AF"
          className="h-16 text-[30px] font-bold text-center border-2 border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-500 mt-4"
        />

        {unitPrice && unitPrice > 0 ? (
          <View className="flex-row justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 mt-3">
            <Text className="text-[13px] text-gray-500 dark:text-gray-400">{t.unitPrice} · {t.autoCalculated}</Text>
            <Text className="text-[17px] font-bold text-emerald-500">
              {formatMADDecimal(unitPrice)} <Text className="text-[13px] font-medium">MAD/{draft.unit || 'u'}</Text>
            </Text>
          </View>
        ) : null}

        <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-[1px] mt-5 mb-2">
          {t.parcel}
        </Text>
        <FlatList
          horizontal
          data={parcels}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => update({ parcel_id: item.id })} className={`px-3.5 py-2 rounded-[10px] border ${draft.parcel_id === item.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
              <Text className={`text-[13px] font-medium ${draft.parcel_id === item.id ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400'}`}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!draft.product_name || !draft.total_amount || !draft.parcel_id || saving}
          className={`h-14 rounded-xl items-center justify-center flex-row gap-2 mt-4 ${!draft.product_name || !draft.total_amount || !draft.parcel_id || saving ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-emerald-500 dark:bg-emerald-600'}`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" />
          )}
          <Text className="text-white text-base font-bold">
            {t.save} {draft.total_amount ? `· ${draft.total_amount} MAD` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
