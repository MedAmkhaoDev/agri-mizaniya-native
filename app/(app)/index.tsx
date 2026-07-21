import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { getFinancialSummary, getRecentActivity, getParcels } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import { QuickActionBar } from '@/components/QuickActionBar'
import AddExpenseSheet from '@/components/AddExpenseSheet'
import AddIncomeSheet from '@/components/AddIncomeSheet'
import AddGasSheet from '@/components/AddGasSheet'
import AddCooperativeSheet from '@/components/AddCooperativeSheet'
import type { FinancialSummary, ActivityItem, Parcel } from '@/lib/types'
import {
  TrendingUp, TrendingDown, Flame, HandCoins, MapPin,
  ArrowUpRight, ArrowDownRight, RefreshCcw,
} from 'lucide-react-native'

interface ParcelWithFin extends Parcel {
  fin?: FinancialSummary
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
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

  const loadData = useCallback(async () => {
    if (!user) return
    const [sum, act, { data: parcelData }] = await Promise.all([
      getFinancialSummary(user.uid),
      getRecentActivity(user.uid, 6),
      getParcels(user.uid),
    ])
    setSummary(sum)
    setActivity(act)

    const activeParcels = parcelData.filter((p) => p.status === 'active')
    const parcelsWithFin: ParcelWithFin[] = await Promise.all(
      activeParcels.map(async (p) => ({
        ...p,
        fin: await getFinancialSummary(user.uid, p.id),
      }))
    )
    parcelsWithFin.sort((a, b) => (b.fin?.netProfit ?? 0) - (a.fin?.netProfit ?? 0))
    setParcels(parcelsWithFin)
    setLoading(false)
  }, [user])

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
      case 'income': return '#ECFDF5'
      case 'expense': return '#FEF2F2'
      case 'gas': return '#FFF7ED'
      case 'cooperative': return '#F5F3FF'
      default: return '#EFF6FF'
    }
  }

  const stats = [
    { label: t.totalIncome, value: summary.totalIncome, icon: <TrendingUp size={20} color="#10B981" />, bg: '#ECFDF5', page: 'incomes' },
    { label: t.totalExpenses, value: summary.totalExpenses, icon: <TrendingDown size={20} color="#EF4444" />, bg: '#FEF2F2', page: 'expenses' },
    { label: t.totalGas, value: summary.totalGas, icon: <Flame size={20} color="#F97316" />, bg: '#FFF7ED', page: 'gas' },
    { label: t.totalCooperative, value: summary.totalCooperative, icon: <HandCoins size={20} color="#8B5CF6" />, bg: '#F5F3FF', page: 'cooperative' },
  ]

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>🌾</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.appName}</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.appTagline}</Text>
            </View>
          </View>
        </View>

        {/* Net P&L Hero Card */}
        <View style={{
          marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 16,
          borderWidth: 2, borderColor: isProfit ? '#A7F3D0' : '#FECACA',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 4 }}>{t.netProfitLoss}</Text>
              {loading ? (
                <View style={{ width: 160, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6' }} />
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={{ fontSize: 36, fontWeight: '700', color: isProfit ? '#10B981' : '#EF4444', fontVariant: ['tabular-nums'] }}>
                      {isProfit ? '+' : '-'}{formatMAD(summary.netProfit)}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF' }}>MAD</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 2,
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
                      backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2',
                      borderWidth: 1, borderColor: isProfit ? '#A7F3D0' : '#FECACA',
                    }}>
                      {isProfit ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isProfit ? '#10B981' : '#EF4444' }}>
                        {isProfit ? t.profit : t.loss}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                      +{formatMAD(summary.totalIncome)} / -{formatMAD(totalCosts)} MAD
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={{
              width: 64, height: 64, borderRadius: 16,
              backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {isProfit ? <ArrowUpRight size={32} color="#10B981" /> : <ArrowDownRight size={32} color="#EF4444" />}
            </View>
          </View>
        </View>

        {/* Per-parcel P&L strip */}
        {!loading && parcels.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>{t.parcels}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {parcels.slice(0, 6).map((p) => {
                const profit = p.fin?.netProfit ?? 0
                const isP = profit >= 0
                return (
                  <View key={p.id} style={{ width: 128, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={14} color="#3B82F6" />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', flex: 1 }} numberOfLines={1}>{p.name}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isP ? '#10B981' : '#EF4444', fontVariant: ['tabular-nums'] }}>
                      {isP ? '+' : '-'}{formatMAD(profit)}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
                      +{formatMAD(p.fin?.totalIncome ?? 0)} / -{formatMAD((p.fin?.totalExpenses ?? 0) + (p.fin?.totalGas ?? 0) + (p.fin?.totalCooperative ?? 0))}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 20, gap: 10 }}>
          {stats.map((card) => (
            <View key={card.label} style={{ width: '47%', padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {card.icon}
              </View>
              {loading ? (
                <View style={{ width: 80, height: 28, borderRadius: 6, backgroundColor: '#F3F4F6', marginBottom: 4 }} />
              ) : (
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] }}>
                  {formatMAD(card.value)} MAD
                </Text>
              )}
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Parcel count */}
        <View style={{ marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="#10B981" />
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 }}>{t.totalParcels}</Text>
          {loading ? (
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#F3F4F6' }} />
          ) : (
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{summary.parcelCount}</Text>
          )}
        </View>

        {/* Recent Activity */}
        <View style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>{t.recentActivity}</Text>
            <TouchableOpacity onPress={loadData} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCcw size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
            {loading ? (
              <View style={{ padding: 16, gap: 12 }}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6' }} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ width: '75%', height: 14, borderRadius: 4, backgroundColor: '#F3F4F6' }} />
                      <View style={{ width: '50%', height: 10, borderRadius: 4, backgroundColor: '#F3F4F6' }} />
                    </View>
                    <View style={{ width: 60, height: 14, borderRadius: 4, backgroundColor: '#F3F4F6' }} />
                  </View>
                ))}
              </View>
            ) : activity.length === 0 ? (
              <Text style={{ textAlign: 'center', paddingVertical: 40, fontSize: 13, color: '#9CA3AF' }}>{t.noRecentActivity}</Text>
            ) : (
              activity.map((item, i) => (
                <View key={`${item.id}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: activityBg(item.type), alignItems: 'center', justifyContent: 'center' }}>
                    {activityIcon(item.type)}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#111827' }} numberOfLines={1}>{item.description}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }} numberOfLines={1}>
                      {item.parcelName ? `${item.parcelName} · ` : ''}{new Date(item.date).toLocaleDateString('fr-MA')}
                    </Text>
                  </View>
                  {item.amount !== undefined ? (
                    <Text style={{
                      fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'],
                      color: item.type === 'income' ? '#10B981' : '#EF4444',
                    }}>
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
      />
      <AddExpenseSheet visible={expenseSheetOpen} onClose={() => { setExpenseSheetOpen(false); loadData() }} />
      <AddIncomeSheet visible={incomeSheetOpen} onClose={() => { setIncomeSheetOpen(false); loadData() }} />
      <AddGasSheet visible={gasSheetOpen} onClose={() => { setGasSheetOpen(false); loadData() }} />
      <AddCooperativeSheet visible={coopSheetOpen} onClose={() => { setCoopSheetOpen(false); loadData() }} />
    </SafeAreaView>
  )
}
