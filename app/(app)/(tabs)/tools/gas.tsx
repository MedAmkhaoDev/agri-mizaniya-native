import { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { deleteGasUsage, gasUsageConstraints } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUndoDelete } from '@/hooks/useUndoDelete'
import { useRealtimeCollection, type WithPending } from '@/hooks/useRealtimeCollection'
import AddGasSheet from '@/components/AddGasSheet'
import { FilterSheet } from '@/components/FilterSheet'
import { HeaderBar } from '@/components/HeaderBar'
import Toast from 'react-native-toast-message'
import type { GasUsage, Parcel, ExpenseFilters } from '@/lib/types'
import { Flame, Plus, Trash2, AlertCircle, RefreshCw, SlidersHorizontal } from 'lucide-react-native'

export default function GasScreen() {
  const { user } = useAuth()
  const { currentFarmId, canWrite } = useFarm()
  const { t } = useI18n()
  const [filters, setFilters] = useState<ExpenseFilters>({ parcelId: 'all' })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const gasPath = currentFarmId ? `farms/${currentFarmId}/gasUsages` : ''
  const parcelsPath = currentFarmId ? `farms/${currentFarmId}/parcels` : ''

  const constraints = useMemo(() => gasUsageConstraints(filters), [filters])
  const parcelConstraintsMemo = useMemo(() => [], [])

  const { data: gasUsages, loading, error } = useRealtimeCollection<GasUsage>(gasPath, {
    constraints,
    enabled: !!currentFarmId,
  })

  const { data: parcels } = useRealtimeCollection<Parcel>(parcelsPath, {
    constraints: parcelConstraintsMemo,
    enabled: !!currentFarmId,
  })

  const handleRestore = async (item: WithPending<GasUsage>) => {
    if (!user || !currentFarmId) return
    await import('@/lib/api').then(m => m.createGasUsage(currentFarmId!, user.uid, {
      parcelId: item.parcelId, quantityBottles: item.quantityBottles,
      totalAmount: item.totalAmount, date: item.date, notes: item.notes,
    }))
  }

  const { deleteWithUndo } = useUndoDelete(
    (id) => deleteGasUsage(currentFarmId!, id),
    handleRestore,
    () => {},
    { deleted: t.deleted, undo: t.undo, error: t.error },
  )

  const total = gasUsages.reduce((sum, g) => sum + g.totalAmount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')
  const advancedFilterCount = [filters.createdBy, filters.dateFrom, filters.amountMin != null ? 'min' : null, filters.amountMax != null ? 'max' : null, filters.typeId].filter(Boolean).length

  if (!currentFarmId) return null

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 bg-background">
        <HeaderBar
          title={t.gasUsage}
          right={
            canWrite ? (
              <TouchableOpacity onPress={() => setSheetOpen(true)} className="w-9 h-9 rounded-[10px] bg-orange-500 items-center justify-center">
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View className="px-4 py-3">
          <Text style={{ fontVariant: ['tabular-nums'] }} className="text-[28px] font-bold text-orange-500 dark:text-orange-400">-{formatMAD(total)} MAD</Text>
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
                  className="flex-row items-center gap-1.5 px-3.5 h-9 rounded-[10px] bg-accent justify-center"
                >
                  <SlidersHorizontal size={14} color="#6B7280" />
                  {advancedFilterCount > 0 && (
                    <View className="w-4 h-4 rounded-full bg-orange-500 items-center justify-center">
                      <Text className="text-[9px] font-bold text-white">{advancedFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            }
            return (
              <TouchableOpacity
                onPress={() => setFilters((f) => ({ ...f, parcelId: item.id }))}
                className={cn("px-3.5 py-2.5 rounded-[10px] h-9 items-center justify-center", filters.parcelId === item.id ? "bg-orange-500 dark:bg-orange-600" : "bg-accent")}
              >
                <Text className={cn("text-xs font-semibold", filters.parcelId === item.id ? "text-white dark:text-gray-100" : "text-muted-foreground")}>{item.name}</Text>
              </TouchableOpacity>
            )
          }}
        />

        {error ? (
          <View className="items-center py-16 px-6">
            <View className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mb-4">
              <AlertCircle size={28} color="#EF4444" />
            </View>
            <Text className="text-[15px] font-semibold text-foreground mb-1">{t.failedToLoad}</Text>
            <Text className="text-[13px] text-muted-foreground mb-5 text-center">{error.message}</Text>
          </View>
        ) : (
          <View className="flex-1">
            {loading && (
              <View className="absolute inset-0 z-10 items-center justify-center">
                <View className="items-center py-12">
                  {[1, 2, 3].map(i => <View key={i} className="h-[72px] w-full rounded-xl bg-accent animate-pulse mb-2.5" />)}
                </View>
              </View>
            )}
            <FlatList
              data={gasUsages}
              keyExtractor={(item) => item.id}
              contentContainerClassName="p-4"
              refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#6B7280" />}
              ListEmptyComponent={
                !loading ? (
                  <View className="items-center py-12">
                    <Flame size={48} color="#D1D5DB" />
                    <Text className="text-muted-foreground mt-3">{t.noGas}</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <View className="flex-row items-center p-3.5 rounded-xl border border-border mb-2">
                  <View className="w-9 h-9 rounded-[10px] bg-orange-50 dark:bg-orange-950 items-center justify-center mr-3">
                    <Flame size={16} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{item.quantityBottles} bouteilles</Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Text className="text-[11px] text-muted-foreground">{item.date}</Text>
                      {item.createdByName ? (
                        <>
                          <Text className="text-[11px] text-gray-300 dark:text-gray-600">·</Text>
                          <Text className="text-[11px] text-muted-foreground">{t.by} {item.createdByName}</Text>
                        </>
                      ) : null}
                    </View>
                    {item._pending && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <ActivityIndicator size="small" color="#9CA3AF" />
                        <Text className="text-[10px] text-gray-400">{t.syncing}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontVariant: ['tabular-nums'] }} className="text-sm font-semibold text-orange-500 dark:text-orange-400">-{formatMAD(item.totalAmount)} MAD</Text>
                  <TouchableOpacity onPress={() => deleteWithUndo(item)} className="p-1.5 ml-2">
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        <AddGasSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
        <FilterSheet visible={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} filters={filters} onApply={setFilters} />
      </View>
    </SafeAreaView>
  )
}
