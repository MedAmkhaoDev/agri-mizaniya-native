import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { getIncomes, deleteIncome, getParcels } from '@/lib/api'
import { formatMAD, formatMADDecimal } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useFarm } from '@/lib/farm-context'
import { useUndoDelete } from '@/hooks/useUndoDelete'
import AddIncomeSheet from '@/components/AddIncomeSheet'
import { FilterSheet } from '@/components/FilterSheet'
import { HeaderBar } from '@/components/HeaderBar'
import Toast from 'react-native-toast-message'
import type { Income, Parcel, ExpenseFilters } from '@/lib/types'
import { TrendingUp, Plus, Trash2, AlertCircle, RefreshCw, SlidersHorizontal } from 'lucide-react-native'

export default function IncomesScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { currentFarmId, canWrite } = useFarm()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ExpenseFilters>({ parcelId: 'all' })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user || !currentFarmId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [i, p] = await Promise.all([
        getIncomes(currentFarmId!, filters),
        getParcels(currentFarmId!),
      ])
      if (i.error || p.error) {
        setError(t.failedToLoad)
        return
      }
      setIncomes(i.data)
      setParcels(p.data)
    } catch {
      setError(t.failedToLoad)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, filters, currentFarmId, t.failedToLoad])

  useEffect(() => { loadData() }, [loadData])

  const handleRestore = async (item: Income) => {
    if (!user || !currentFarmId) return
    const { createIncome } = await import('@/lib/api')
    await createIncome(currentFarmId!, user.uid, {
      parcelId: item.parcelId, productName: item.productName,
      quantity: item.quantity, unit: item.unit, totalAmount: item.totalAmount,
      date: item.date, notes: item.notes,
    })
    loadData()
  }

  const { deleteWithUndo } = useUndoDelete(
    (id) => deleteIncome(currentFarmId!, id),
    handleRestore,
    loadData,
    { deleted: t.deleted, undo: t.undo, error: t.error },
  )

  const total = incomes.reduce((sum, i) => sum + i.totalAmount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')
  const advancedFilterCount = [filters.createdBy, filters.dateFrom, filters.amountMin != null ? 'min' : null, filters.amountMax != null ? 'max' : null, filters.typeId].filter(Boolean).length

  if (!currentFarmId) return null

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 bg-white dark:bg-gray-900">
        <HeaderBar
          title={t.incomes}
          right={
            canWrite ? (
              <TouchableOpacity onPress={() => setSheetOpen(true)} className="w-9 h-9 rounded-[10px] bg-green-600 dark:bg-green-500 items-center justify-center">
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View className="px-4 py-3">
          <Text style={{ fontVariant: ['tabular-nums'] }} className="text-[28px] font-bold text-emerald-500 dark:text-emerald-400">+{formatMAD(total)} MAD</Text>
        </View>

        <FlatList
          horizontal
          data={[{ id: 'all', name: t.allParcels } as Parcel, ...activeParcels, { id: '__filter__' } as Parcel]}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-2 mb-2"
          contentContainerStyle={{ alignItems: 'flex-start' }}
          style={{ flexGrow: 0 }}
          renderItem={({ item }) => {
            if (item.id === '__filter__') {
              return (
                <TouchableOpacity
                  onPress={() => setFilterSheetOpen(true)}
                  className="flex-row items-center gap-1.5 px-3.5 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-800 justify-center"
                >
                  <SlidersHorizontal size={14} color="#6B7280" />
                  {advancedFilterCount > 0 && (
                    <View className="w-4 h-4 rounded-full bg-green-600 items-center justify-center">
                      <Text className="text-[9px] font-bold text-white">{advancedFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            }
            return (
              <TouchableOpacity
                onPress={() => setFilters((f) => ({ ...f, parcelId: item.id }))}
                className={cn("px-3.5 py-2.5 rounded-[10px] h-9 items-center justify-center", filters.parcelId === item.id ? "bg-green-600 dark:bg-green-500" : "bg-gray-100 dark:bg-gray-800")}
              >
                <Text className={cn("text-xs font-semibold", filters.parcelId === item.id ? "text-white dark:text-gray-100" : "text-gray-500 dark:text-gray-400")}>{item.name}</Text>
              </TouchableOpacity>
            )
          }}
        />

        {error ? (
          <View className="items-center py-16 px-6">
            <View className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mb-4">
              <AlertCircle size={28} color="#EF4444" />
            </View>
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.failedToLoad}</Text>
            <Text className="text-[13px] text-gray-400 dark:text-gray-500 mb-5 text-center">{error}</Text>
            <TouchableOpacity onPress={() => loadData()} className="flex-row items-center gap-2 px-5 py-2.5 rounded-[10px] bg-gray-100 dark:bg-gray-800">
              <RefreshCw size={16} color="#6B7280" />
              <Text className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">{t.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            {loading && (
              <View className="absolute inset-0 z-10 items-center justify-center">
                <View className="items-center py-12">
                  {[1, 2, 3].map(i => <View key={i} className="h-[72px] w-full rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse mb-2.5" />)}
                </View>
              </View>
            )}
            <FlatList
              data={incomes}
              keyExtractor={(item) => item.id}
              contentContainerClassName="p-4"
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#6B7280" />}
              ListEmptyComponent={
                !loading ? (
                  <View className="items-center py-12">
                    <TrendingUp size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 dark:text-gray-500 mt-3">{t.noIncomes}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const unitPrice = item.quantity && item.quantity > 0 ? item.totalAmount / item.quantity : null
                return (
                  <View className="flex-row items-center p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 mb-2">
                    <View className="w-9 h-9 rounded-[10px] bg-emerald-50 dark:bg-emerald-950 items-center justify-center mr-3">
                      <TrendingUp size={16} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.productName}</Text>
                      {unitPrice ? <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t.unitPrice}: {formatMADDecimal(unitPrice)} MAD/{item.unit || 'u'}</Text> : null}
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Text className="text-[11px] text-gray-400 dark:text-gray-500">{item.date}</Text>
                        {item.createdByName ? (
                          <>
                            <Text className="text-[11px] text-gray-300 dark:text-gray-600">·</Text>
                            <Text className="text-[11px] text-gray-400 dark:text-gray-500">{t.by} {item.createdByName}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <Text style={{ fontVariant: ['tabular-nums'] }} className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">+{formatMAD(item.totalAmount)} MAD</Text>
                    <TouchableOpacity onPress={() => deleteWithUndo(item)} className="p-1.5 ml-2">
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )
              }}
            />
          </View>
        )}

        <AddIncomeSheet visible={sheetOpen} onClose={() => { setSheetOpen(false); loadData() }} />
        <FilterSheet visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} filters={filters} onApply={setFilters} />
      </View>
    </SafeAreaView>
  )
}
