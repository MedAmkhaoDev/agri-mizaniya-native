import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { getExpenses, getIncomes, getGasUsages, getCooperativeSupports, getParcels } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import type { Parcel } from '@/lib/types'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { BarChart } from 'react-native-gifted-charts'
import {
  FileBarChart2, Download, TrendingUp, TrendingDown, Flame, HandCoins,
  ArrowUpRight, ArrowDownRight, Share2,
} from 'lucide-react-native'

type Period = 'monthly' | 'yearly' | 'custom' | 'all'

export default function ReportsScreen() {
  const { user } = useAuth()
  const { currentFarmId, canExportReports } = useFarm()
  const { t } = useI18n()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [generated, setGenerated] = useState(false)

  if (!currentFarmId) return null

  const getDateFilters = () => {
    const now = new Date()
    switch (period) {
      case 'monthly': {
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        return { from, to }
      }
      case 'yearly': {
        const from = `${now.getFullYear()}-01-01`
        const to = `${now.getFullYear()}-12-31`
        return { from, to }
      }
      case 'custom':
        return { from: customFrom, to: customTo }
      default:
        return {}
    }
  }

  const generate = useCallback(async () => {
    if (!user || !currentFarmId) return
    setLoading(true)
    setGenerated(false)
    try {
      const dateFilters = getDateFilters()
      const filter = selectedParcel !== 'all' ? { parcelId: selectedParcel, ...dateFilters } : dateFilters

      const [{ data: parcelsList }, { data: expenses }, { data: incomes }, { data: gas }, { data: coop }] = await Promise.all([
        getParcels(currentFarmId!),
        getExpenses(currentFarmId!, filter as any),
        getIncomes(currentFarmId!, filter as any),
        getGasUsages(currentFarmId!, filter as any),
        getCooperativeSupports(currentFarmId!, filter as any),
      ])
      setParcels(parcelsList)

    const totalIncome = incomes.reduce((s, r) => s + r.totalAmount, 0)
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0)
    const totalGas = gas.reduce((s, r) => s + r.totalAmount, 0)
    const totalCooperative = coop.reduce((s, r) => s + r.amount, 0)
    const netProfit = totalIncome - totalExpenses - totalGas - totalCooperative

    const parcelBreakdown = await Promise.all(
      parcelsList.filter(p => p.status === 'active').map(async (p) => {
        const [e, i, g, c] = await Promise.all([
          getExpenses(currentFarmId!, { ...filter, parcelId: p.id } as any),
          getIncomes(currentFarmId!, { ...filter, parcelId: p.id } as any),
          getGasUsages(currentFarmId!, { ...filter, parcelId: p.id } as any),
          getCooperativeSupports(currentFarmId!, { ...filter, parcelId: p.id } as any),
        ])
        const ti = i.data.reduce((s, r) => s + r.totalAmount, 0)
        const te = e.data.reduce((s, r) => s + r.amount, 0)
        const tg = g.data.reduce((s, r) => s + r.totalAmount, 0)
        const tc = c.data.reduce((s, r) => s + r.amount, 0)
        return { name: p.name, totalIncome: ti, totalExpenses: te, totalGas: tg, totalCooperative: tc, netProfit: ti - te - tg - tc }
      })
    )

    setSummary({
      totalIncome, totalExpenses, totalGas, totalCooperative, netProfit,
      parcelName: selectedParcel !== 'all' ? parcelsList.find(p => p.id === selectedParcel)?.name : t.allParcels,
      filters: dateFilters,
      parcelBreakdown,
    })
    setGenerated(true)
    } catch (e) {
      console.error('Reports generate error:', e)
    } finally {
      setLoading(false)
    }
  }, [user, currentFarmId, selectedParcel, period, customFrom, customTo, parcels, t.allParcels])

  const handleShare = () => {
    if (!summary) return
    const isProfit = summary.netProfit >= 0
    const text = `*${t.appName} - Rapport*\n\n` +
      `📍 Parcelle: ${summary.parcelName}\n` +
      `📅 Période: ${summary.filters.from || 'Tout'} - ${summary.filters.to || ''}\n\n` +
      `💰 Revenus: +${formatMAD(summary.totalIncome)} MAD\n` +
      `📉 Dépenses: -${formatMAD(summary.totalExpenses)} MAD\n` +
      `🔥 Gaz: -${formatMAD(summary.totalGas)} MAD\n` +
      `🤝 Coopérative: -${formatMAD(summary.totalCooperative)} MAD\n\n` +
      `${isProfit ? '✅' : '❌'} *Résultat: ${isProfit ? '+' : '-'}${formatMAD(summary.netProfit)} MAD*`
    Sharing.shareAsync(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => {
      Sharing.shareAsync(text)
    })
  }

  const handleDownloadPDF = async () => {
    if (!summary) return
    const isProfit = summary.netProfit >= 0
    const breakdownRows = (summary.parcelBreakdown || []).map((p: any) =>
      `<tr><td>${p.name}</td><td style="color:green">+${formatMAD(p.totalIncome)}</td><td style="color:red">-${formatMAD(p.totalExpenses + p.totalGas + p.totalCooperative)}</td><td style="color:${p.netProfit >= 0 ? 'green' : 'red'}">${p.netProfit >= 0 ? '+' : '-'}${formatMAD(p.netProfit)}</td></tr>`
    ).join('')

    const html = `<html><head><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin:10px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.green{color:green}.red{color:red}</style></head><body>
      <h1>${t.appName} - Rapport</h1>
      <p>📍 ${summary.parcelName}</p>
      <p>📅 ${summary.filters.from || 'Tout'} → ${summary.filters.to || ''}</p>
      <hr/>
      <h2>Résultat: <span class="${isProfit ? 'green' : 'red'}">${isProfit ? '+' : '-'}${formatMAD(summary.netProfit)} MAD</span></h2>
      <p>💰 Revenus: +${formatMAD(summary.totalIncome)} MAD</p>
      <p>📉 Dépenses: -${formatMAD(summary.totalExpenses)} MAD</p>
      <p>🔥 Gaz: -${formatMAD(summary.totalGas)} MAD</p>
      <p>🤝 Coopérative: -${formatMAD(summary.totalCooperative)} MAD</p>
      ${breakdownRows ? `<h3>Détail par parcelle</h3><table><tr><th>Parcelle</th><th>Revenus</th><th>Coûts</th><th>Résultat</th></tr>${breakdownRows}</table>` : ''}
    </body></html>`

    const { uri } = await Print.printToFileAsync({ html })
    await Sharing.shareAsync(uri)
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'monthly', label: t.monthly },
    { key: 'yearly', label: t.yearly },
    { key: 'custom', label: t.custom },
    { key: 'all', label: t.all },
  ]

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      <Text className="mb-4 text-lg font-bold text-foreground">{t.reports}</Text>

      <View className="mb-3 flex-row gap-1.5">
        {periods.map((p) => (
          <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} className={`flex-1 items-center rounded-[10px] py-2.5 ${period === p.key ? 'bg-green-600' : 'bg-accent'}`}>
            <Text className={`text-xs font-semibold ${period === p.key ? 'text-white' : 'text-muted-foreground'}`}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {period === 'custom' && (
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-muted-foreground">{t.from}</Text>
            <TextInput value={customFrom} onChangeText={setCustomFrom} placeholder="2024-01-01" placeholderTextColor="#9CA3AF" className="h-12 rounded-[10px] border border-border px-4 text-[15px] text-foreground" />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-muted-foreground">{t.to}</Text>
            <TextInput value={customTo} onChangeText={setCustomTo} placeholder="2024-12-31" placeholderTextColor="#9CA3AF" className="h-12 rounded-[10px] border border-border px-4 text-[15px] text-foreground" />
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setSelectedParcel('all')} className={`rounded-[10px] px-3.5 py-2.5 ${selectedParcel === 'all' ? 'bg-green-600' : 'bg-accent'}`}>
          <Text className={`text-xs font-semibold ${selectedParcel === 'all' ? 'text-white' : 'text-muted-foreground'}`}>{t.allParcels}</Text>
        </TouchableOpacity>
        {parcels.filter(p => p.status === 'active').map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setSelectedParcel(p.id)} className={`rounded-[10px] px-3.5 py-2.5 ${selectedParcel === p.id ? 'bg-green-600' : 'bg-accent'}`}>
            <Text className={`text-xs font-semibold ${selectedParcel === p.id ? 'text-white' : 'text-muted-foreground'}`}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={generate} disabled={loading} className={`mb-5 flex-row items-center justify-center gap-2 rounded-xl bg-green-600 ${loading ? 'opacity-60' : ''}`} style={{ height: 48 }}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <FileBarChart2 size={18} color="#FFFFFF" />}
        <Text className="text-[15px] font-semibold text-white">{loading ? t.loading : t.generateReport}</Text>
      </TouchableOpacity>

      {generated && summary && (
        <>
          {canExportReports && (
            <View className="mb-4 flex-row gap-2">
              <TouchableOpacity onPress={handleShare} className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-border">
                <Share2 size={14} color="#374151" />
                <Text className="text-[13px] font-medium text-foreground">WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownloadPDF} className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] border border-border">
                <Download size={14} color="#374151" />
                <Text className="text-[13px] font-medium text-foreground">PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className={`mb-3 rounded-2xl border-2 p-5 ${summary.netProfit >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}`}>
            <View className="flex-row items-center gap-3">
              <View className={`h-12 w-12 items-center justify-center rounded-xl ${summary.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`}>
                {summary.netProfit >= 0 ? <ArrowUpRight size={24} color="#10B981" /> : <ArrowDownRight size={24} color="#EF4444" />}
              </View>
              <View>
                <Text className="text-xs text-muted-foreground">{t.netProfitLoss}</Text>
                <Text className="text-[28px] font-bold" style={{ fontVariant: ['tabular-nums'], color: summary.netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                  {summary.netProfit >= 0 ? '+' : '-'}{formatMAD(summary.netProfit)} MAD
                </Text>
              </View>
            </View>
          </View>

          {summary.parcelBreakdown && summary.parcelBreakdown.length > 0 && (() => {
            const barWidth = summary.parcelBreakdown.length > 4 ? 16 : 24
            const chartData = summary.parcelBreakdown.map((p: any) => ({
              label: p.name.length > 8 ? p.name.substring(0, 7) + '..' : p.name,
              value: Math.round(p.totalIncome),
              frontColor: '#10B981',
              topLabelComponent: () => (
                <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '600', marginBottom: 2 }}>
                  +{formatMAD(p.totalIncome)}
                </Text>
              ),
            }))
            const expenseData = summary.parcelBreakdown.map((p: any) => ({
              label: '',
              value: Math.round(p.totalExpenses + p.totalGas + p.totalCooperative),
              frontColor: '#EF4444',
              topLabelComponent: () => (
                <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '600', marginBottom: 2 }}>
                  -{formatMAD(p.totalExpenses + p.totalGas + p.totalCooperative)}
                </Text>
              ),
            }))
            const screenWidth = Dimensions.get('window').width - 64
            const totalBars = summary.parcelBreakdown.length * 2
            const chartWidth = Math.max(screenWidth, totalBars * (barWidth + 4) + 60)
            const maxValue = Math.max(
              ...summary.parcelBreakdown.map((p: any) => Math.max(p.totalIncome, p.totalExpenses + p.totalGas + p.totalCooperative))
            )

            return (
              <View className="mb-3 rounded-xl border border-border p-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-[13px] font-semibold text-foreground">{t.parcelComparison}</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                      <View className="h-2 w-2 rounded-sm bg-emerald-500" />
                      <Text className="text-[10px] text-muted-foreground">{t.income}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="h-2 w-2 rounded-sm bg-red-500" />
                      <Text className="text-[10px] text-muted-foreground">{t.expenses}</Text>
                    </View>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: screenWidth }}>
                    <BarChart
                      data={chartData}
                      barWidth={barWidth}
                      spacing={barWidth + 6}
                      roundedTop
                      noOfSections={4}
                      maxValue={maxValue * 1.15}
                      barInnerComponent={() => null}
                      yAxisTextStyle={{ color: '#9CA3AF', fontSize: 9 }}
                      xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9, textAlign: 'center' }}
                      hideRules
                      yAxisColor="#F3F4F6"
                      xAxisColor="#F3F4F6"
                    />
                    <View className="absolute bottom-[30px] left-0 right-0 top-0 justify-end">
                      <BarChart
                        data={expenseData}
                        barWidth={barWidth}
                        spacing={barWidth + 6}
                        roundedTop
                        noOfSections={0}
                        maxValue={maxValue * 1.15}
                        barInnerComponent={() => null}
                        hideYAxisText
                        hideRules
                        yAxisColor="transparent"
                        xAxisColor="transparent"
                        xAxisLabelTextStyle={{ color: 'transparent' }}
                        yAxisTextStyle={{ color: 'transparent' }}
                      />
                    </View>
                  </View>
                </ScrollView>
              </View>
            )
          })()}

          <View className="mb-3 rounded-xl border border-border p-4">
            {[
              { label: t.totalIncome, value: summary.totalIncome, color: '#10B981', icon: <TrendingUp size={16} color="#10B981" />, prefix: '+' },
              { label: t.totalExpenses, value: summary.totalExpenses, color: '#EF4444', icon: <TrendingDown size={16} color="#EF4444" />, prefix: '-' },
              { label: t.totalGas, value: summary.totalGas, color: '#F97316', icon: <Flame size={16} color="#F97316" />, prefix: '-' },
              { label: t.totalCooperative, value: summary.totalCooperative, color: '#8B5CF6', icon: <HandCoins size={16} color="#8B5CF6" />, prefix: '-' },
            ].map((row, i) => (
              <View key={row.label} className={`flex-row items-center justify-between py-2.5 ${i < 3 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <View className="flex-row items-center gap-2">
                  {row.icon}
                  <Text className="text-[13px] text-foreground">{row.label}</Text>
                </View>
                <Text className="text-sm font-semibold" style={{ fontVariant: ['tabular-nums'], color: row.color }}>
                  {row.prefix}{formatMAD(row.value)} MAD
                </Text>
              </View>
            ))}
            <View className="flex-row items-center justify-between border-t border-border py-2.5 mt-1">
              <Text className="text-[13px] font-semibold text-foreground">{t.totalCost}</Text>
              <Text className="text-sm font-bold text-red-500" style={{ fontVariant: ['tabular-nums'] }}>
                -{formatMAD(summary.totalExpenses + summary.totalGas + summary.totalCooperative)} MAD
              </Text>
            </View>
          </View>

          {summary.parcelBreakdown && summary.parcelBreakdown.length > 0 && (
            <View className="rounded-xl border border-border p-4">
              <Text className="mb-3 text-[13px] font-semibold text-foreground">Détail par parcelle</Text>
              {summary.parcelBreakdown.map((p: any, i: number) => (
                <View key={i} className={`flex-row items-center justify-between py-2 ${i < summary.parcelBreakdown.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                  <Text className="flex-1 text-[13px] font-medium text-foreground">{p.name}</Text>
                  <Text className="mr-2 text-xs text-emerald-500">+{formatMAD(p.totalIncome)}</Text>
                  <Text className="mr-2 text-xs text-red-500">-{formatMAD(p.totalExpenses + p.totalGas + p.totalCooperative)}</Text>
                  <Text className="text-[13px] font-semibold" style={{ color: p.netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                    {p.netProfit >= 0 ? '+' : '-'}{formatMAD(p.netProfit)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  )
}
