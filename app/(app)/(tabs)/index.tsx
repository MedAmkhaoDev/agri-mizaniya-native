import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { getFinancialSummary, getRecentActivity, getParcels } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import { cn } from '@/lib/utils'
import { QuickActionBar } from '@/components/QuickActionBar'
import FarmSwitcherModal from '@/components/FarmSwitcherModal'
import AddExpenseSheet from '@/components/AddExpenseSheet'
import AddIncomeSheet from '@/components/AddIncomeSheet'
import AddGasSheet from '@/components/AddGasSheet'
import AddCooperativeSheet from '@/components/AddCooperativeSheet'
import { useRouter } from 'expo-router'
import type { FinancialSummary, ActivityItem, Parcel } from '@/lib/types'
import { NotificationBell } from '@/components/NotificationBell'
import {
  TrendingUp, TrendingDown, Flame, HandCoins, MapPin,
  ArrowUpRight, ArrowDownRight, RefreshCcw, Settings, ChevronDown,
} from 'lucide-react-native'

interface ParcelWithFin extends Parcel {
  fin?: FinancialSummary
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const { currentFarmId, currentFarm, canWrite } = useFarm()
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0, totalExpenses: 0, totalGas: 0, totalCooperative: 0, netProfit: 0, parcelCount: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [parcels, setParcels] = useState<ParcelWithFin[]>([])
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false)
  const [gasSheetOpen, setGasSheetOpen] = useState(false)
  const [coopSheetOpen, setCoopSheetOpen] = useState(false)
  const [farmSwitcherVisible, setFarmSwitcherVisible] = useState(false)

  const loadData = useCallback(async () => {
    if (!user || !currentFarmId) return
    try {
      const [sum, act, { data: parcelData }] = await Promise.all([
        getFinancialSummary(currentFarmId),
        getRecentActivity(currentFarmId, 6),
        getParcels(currentFarmId),
      ])
      setSummary(sum)
      setActivity(act)

      const activeParcels = parcelData.filter((p) => p.status === 'active')
      const parcelsWithFin: ParcelWithFin[] = await Promise.all(
        activeParcels.map(async (p) => ({
          ...p,
          fin: await getFinancialSummary(currentFarmId!, p.id),
        }))
      )
      parcelsWithFin.sort((a, b) => (b.fin?.netProfit ?? 0) - (a.fin?.netProfit ?? 0))
      setParcels(parcelsWithFin)
    } catch (e) {
      console.error('Dashboard loadData error:', e)
    } finally {
      setLoading(false)
    }
  }, [user, currentFarmId])

  useEffect(() => { loadData() }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const isProfit = summary.netProfit >= 0
  const totalCosts = summary.totalExpenses + summary.totalGas + summary.totalCooperative

  const activityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'income': return <TrendingUp size={16} color="#10B981" />
      case 'expense': return <TrendingDown size={16} color="#EF4444" />
      case 'gas': return <Flame size={16} color="#F97316" />
      case 'cooperative': return <HandCoins size={16} color="#8B5CF6" />
      default: return <MapPin size={16} color="#3B82F6" />
    }
  }

  const activityBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'income': return 'bg-emerald-50 dark:bg-emerald-950'
      case 'expense': return 'bg-red-50 dark:bg-red-950'
      case 'gas': return 'bg-orange-50 dark:bg-orange-950'
      case 'cooperative': return 'bg-violet-50 dark:bg-violet-950'
      default: return 'bg-blue-50 dark:bg-blue-950'
    }
  }

  const stats = [
    { label: t.totalIncome, value: summary.totalIncome, icon: <TrendingUp size={20} color="#10B981" />, bgClass: 'bg-emerald-50 dark:bg-emerald-950', page: 'incomes' },
    { label: t.totalExpenses, value: summary.totalExpenses, icon: <TrendingDown size={20} color="#EF4444" />, bgClass: 'bg-red-50 dark:bg-red-950', page: 'expenses' },
    { label: t.totalGas, value: summary.totalGas, icon: <Flame size={20} color="#F97316" />, bgClass: 'bg-orange-50 dark:bg-orange-950', page: 'gas' },
    { label: t.totalCooperative, value: summary.totalCooperative, icon: <HandCoins size={20} color="#8B5CF6" />, bgClass: 'bg-violet-50 dark:bg-violet-950', page: 'cooperative' },
  ]

  if (!currentFarmId) return null

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1 bg-white dark:bg-gray-900"
        contentContainerClassName="pb-[120px]"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-[10px] bg-green-600 dark:bg-green-500 items-center justify-center">
              <Text className="text-base font-bold text-white">🌾</Text>
            </View>
            <TouchableOpacity onPress={() => setFarmSwitcherVisible(true)} className="flex-1" activeOpacity={0.7}>
              <View className="flex-row items-center gap-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentFarm?.name || t.appName}</Text>
                <ChevronDown size={16} color="#9CA3AF" />
              </View>
              <Text className="text-xs text-gray-400 dark:text-gray-500">{t.appTagline}</Text>
            </TouchableOpacity>
            <NotificationBell />
            <TouchableOpacity onPress={() => router.push('/(app)/settings')} className="w-9 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <Settings size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View pointerEvents="box-none" className={cn("mx-4 mt-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border-2",
          isProfit ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"
        )} style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-[13px] font-medium text-gray-400 dark:text-gray-500 mb-1">{t.netProfitLoss}</Text>
              {loading ? (
                <View className="w-40 h-10 rounded-lg bg-gray-100 dark:bg-gray-800" />
              ) : (
                <>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className={cn("text-4xl font-bold tabular-nums", isProfit ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                      {isProfit ? '+' : '-'}{formatMAD(summary.netProfit)}
                    </Text>
                    <Text className="text-base font-semibold text-gray-400 dark:text-gray-500">MAD</Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                    <View className={cn("flex-row items-center gap-0.5 px-2 py-[3px] rounded-xl border",
                      isProfit ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    )}>
                      {isProfit ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
                      <Text className={cn("text-[11px] font-semibold", isProfit ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                        {isProfit ? t.profit : t.loss}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-gray-400 dark:text-gray-500">
                      +{formatMAD(summary.totalIncome)} / -{formatMAD(totalCosts)} MAD
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View className={cn("w-16 h-16 rounded-2xl items-center justify-center",
              isProfit ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"
            )}>
              {isProfit ? <ArrowUpRight size={32} color="#10B981" /> : <ArrowDownRight size={32} color="#EF4444" />}
            </View>
          </View>
        </View>

        {!loading && parcels.length > 0 && (
          <View className="mt-5">
            <View className="flex-row justify-between items-center px-4 mb-2">
              <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.parcels}</Text>
            </View>
            <ScrollView
              horizontal
              directionalLockEnabled={true}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-4 gap-2"
            >
              {parcels.slice(0, 6).map((p) => {
                const profit = p.fin?.netProfit ?? 0
                const isP = profit >= 0
                return (
                  <View key={p.id} className="w-32 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 items-center justify-center">
                        <MapPin size={14} color="#3B82F6" />
                      </View>
                      <Text className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1" numberOfLines={1}>{p.name}</Text>
                    </View>
                    <Text className={cn("text-sm font-bold tabular-nums", isP ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                      {isP ? '+' : '-'}{formatMAD(profit)}
                    </Text>
                    <Text className="text-[10px] text-gray-400 dark:text-gray-500">
                      +{formatMAD(p.fin?.totalIncome ?? 0)} / -{formatMAD((p.fin?.totalExpenses ?? 0) + (p.fin?.totalGas ?? 0) + (p.fin?.totalCooperative ?? 0))}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        <View pointerEvents="box-none" className="flex-row flex-wrap px-4 mt-5 gap-2.5">
          {stats.map((card) => (
            <TouchableOpacity key={card.label} onPress={() => router.push(`/(app)/(tabs)/${card.page}`)} activeOpacity={0.7} className="w-[47%] p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <View className={cn("w-9 h-9 rounded-[10px] items-center justify-center mb-2.5", card.bgClass)}>
                {card.icon}
              </View>
              {loading ? (
                <View className="w-20 h-7 rounded-md bg-gray-100 dark:bg-gray-800 mb-1" />
              ) : (
                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatMAD(card.value)} MAD
                </Text>
              )}
              <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mx-4 mt-2.5 p-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex-row items-center gap-2">
          <MapPin size={18} color="#10B981" />
          <Text className="text-[13px] font-medium text-gray-700 dark:text-gray-300 flex-1">{t.totalParcels}</Text>
          {loading ? (
            <View className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800" />
          ) : (
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{summary.parcelCount}</Text>
          )}
        </View>

        <View className="mx-4 mt-5 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.recentActivity}</Text>
            <TouchableOpacity onPress={loadData} className="w-8 h-8 rounded-2xl items-center justify-center bg-gray-100 dark:bg-gray-800">
              <RefreshCcw size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View pointerEvents="box-none" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            {loading ? (
              <View className="p-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} className="flex-row items-center gap-3">
                    <View className="w-9 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <View className="flex-1 gap-1">
                      <View className="w-[75%] h-3.5 rounded bg-gray-100 dark:bg-gray-800" />
                      <View className="w-[50%] h-2.5 rounded bg-gray-100 dark:bg-gray-800" />
                    </View>
                    <View className="w-[60px] h-3.5 rounded bg-gray-100 dark:bg-gray-800" />
                  </View>
                ))}
              </View>
            ) : activity.length === 0 ? (
              <Text className="text-center py-10 text-[13px] text-gray-400 dark:text-gray-500">{t.noRecentActivity}</Text>
            ) : (
              activity.map((item, i) => (
                <View key={`${item.id}-${i}`} className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <View className={cn("w-9 h-9 rounded-[10px] items-center justify-center", activityBg(item.type))}>
                    {activityIcon(item.type)}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[13px] font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>{item.description}</Text>
                    <Text className="text-[11px] text-gray-400 dark:text-gray-500" numberOfLines={1}>
                      {item.parcelName ? `${item.parcelName} · ` : ''}{new Date(item.date).toLocaleDateString('fr-MA')}
                    </Text>
                  </View>
                  {item.amount !== undefined ? (
                    <Text style={{ fontVariant: ['tabular-nums'] }} className={cn("text-[13px] font-semibold", item.type === 'income' ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                      {item.type === 'income' ? '+' : '-'}{formatMAD(item.amount)}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <QuickActionBar
        onAddExpense={() => setExpenseSheetOpen(true)}
        onAddIncome={() => setIncomeSheetOpen(true)}
        onAddGas={() => setGasSheetOpen(true)}
        onAddCooperative={() => setCoopSheetOpen(true)}
        canWrite={canWrite}
      />
      <AddExpenseSheet visible={expenseSheetOpen} onClose={() => { setExpenseSheetOpen(false); loadData() }} />
      <AddIncomeSheet visible={incomeSheetOpen} onClose={() => { setIncomeSheetOpen(false); loadData() }} />
      <AddGasSheet visible={gasSheetOpen} onClose={() => { setGasSheetOpen(false); loadData() }} />
      <AddCooperativeSheet visible={coopSheetOpen} onClose={() => { setCoopSheetOpen(false); loadData() }} />
      <FarmSwitcherModal visible={farmSwitcherVisible} onClose={() => setFarmSwitcherVisible(false)} onCreateNew={() => router.push('/(farm-select)/create')} />
    </SafeAreaView>
  )
}
