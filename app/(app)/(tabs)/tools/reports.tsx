import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from 'react-native'
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

    // Per-parcel breakdown
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
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{t.reports}</Text>

      {/* Period selector */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {periods.map((p) => (
          <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: period === p.key ? '#16A34A' : '#F3F4F6', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: period === p.key ? '#FFFFFF' : '#6B7280' }}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom date range */}
      {period === 'custom' && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{t.from}</Text>
            <TextInput value={customFrom} onChangeText={setCustomFrom} placeholder="2024-01-01" placeholderTextColor="#D1D5DB" style={{ height: 40, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: '#111827' }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{t.to}</Text>
            <TextInput value={customTo} onChangeText={setCustomTo} placeholder="2024-12-31" placeholderTextColor="#D1D5DB" style={{ height: 40, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: '#111827' }} />
          </View>
        </View>
      )}

      {/* Parcel filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setSelectedParcel('all')} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === 'all' ? '#16A34A' : '#F3F4F6' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: selectedParcel === 'all' ? '#FFFFFF' : '#6B7280' }}>{t.allParcels}</Text>
        </TouchableOpacity>
        {parcels.filter(p => p.status === 'active').map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setSelectedParcel(p.id)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === p.id ? '#16A34A' : '#F3F4F6' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: selectedParcel === p.id ? '#FFFFFF' : '#6B7280' }}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Generate button */}
      <TouchableOpacity onPress={generate} disabled={loading} style={{ height: 48, borderRadius: 12, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 20, opacity: loading ? 0.6 : 1 }}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <FileBarChart2 size={18} color="#FFFFFF" />}
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>{loading ? t.loading : t.generateReport}</Text>
      </TouchableOpacity>

      {/* Results */}
      {generated && summary && (
        <>
          {/* Share + PDF buttons */}
          {canExportReports && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity onPress={handleShare} style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                <Share2 size={14} color="#374151" />
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownloadPDF} style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                <Download size={14} color="#374151" />
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>PDF</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Net profit hero */}
          <View style={{ padding: 20, borderRadius: 16, borderWidth: 2, borderColor: summary.netProfit >= 0 ? '#A7F3D0' : '#FECACA', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: summary.netProfit >= 0 ? '#ECFDF5' : '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                {summary.netProfit >= 0 ? <ArrowUpRight size={24} color="#10B981" /> : <ArrowDownRight size={24} color="#EF4444" />}
              </View>
              <View>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.netProfitLoss}</Text>
                <Text style={{ fontSize: 28, fontWeight: '700', color: summary.netProfit >= 0 ? '#10B981' : '#EF4444', fontVariant: ['tabular-nums'] }}>
                  {summary.netProfit >= 0 ? '+' : '-'}{formatMAD(summary.netProfit)} MAD
                </Text>
              </View>
            </View>
          </View>

          {/* Bar Chart */}
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
              <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{t.parcelComparison}</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#10B981' }} />
                      <Text style={{ fontSize: 10, color: '#6B7280' }}>{t.income}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#EF4444' }} />
                      <Text style={{ fontSize: 10, color: '#6B7280' }}>{t.expenses}</Text>
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
                    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 30, justifyContent: 'flex-end' }}>
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

          {/* Detail cards */}
          <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
            {[
              { label: t.totalIncome, value: summary.totalIncome, color: '#10B981', icon: <TrendingUp size={16} color="#10B981" />, prefix: '+' },
              { label: t.totalExpenses, value: summary.totalExpenses, color: '#EF4444', icon: <TrendingDown size={16} color="#EF4444" />, prefix: '-' },
              { label: t.totalGas, value: summary.totalGas, color: '#F97316', icon: <Flame size={16} color="#F97316" />, prefix: '-' },
              { label: t.totalCooperative, value: summary.totalCooperative, color: '#8B5CF6', icon: <HandCoins size={16} color="#8B5CF6" />, prefix: '-' },
            ].map((row, i) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {row.icon}
                  <Text style={{ fontSize: 13, color: '#374151' }}>{row.label}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: row.color, fontVariant: ['tabular-nums'] }}>
                  {row.prefix}{formatMAD(row.value)} MAD
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{t.totalCost}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444', fontVariant: ['tabular-nums'] }}>
                -{formatMAD(summary.totalExpenses + summary.totalGas + summary.totalCooperative)} MAD
              </Text>
            </View>
          </View>

          {/* Parcel breakdown */}
          {summary.parcelBreakdown && summary.parcelBreakdown.length > 0 && (
            <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 }}>Détail par parcelle</Text>
              {summary.parcelBreakdown.map((p: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < summary.parcelBreakdown.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: '#10B981', marginRight: 8 }}>+{formatMAD(p.totalIncome)}</Text>
                  <Text style={{ fontSize: 12, color: '#EF4444', marginRight: 8 }}>-{formatMAD(p.totalExpenses + p.totalGas + p.totalCooperative)}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: p.netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                    {p.netProfit >= 0 ? '+' : '-'}{formatMAD(p.netProfit)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}
