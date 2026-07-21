import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { getIncomes, deleteIncome, getParcels } from '@/lib/api'
import { formatMAD, formatMADDecimal } from '@/lib/format'
import { useUndoDelete } from '@/hooks/useUndoDelete'
import AddIncomeSheet from '@/components/AddIncomeSheet'
import { HeaderBar } from '@/components/HeaderBar'
import Toast from 'react-native-toast-message'
import type { Income, Parcel } from '@/lib/types'
import { TrendingUp, Plus, Trash2 } from 'lucide-react-native'

export default function IncomesScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [i, p] = await Promise.all([
      getIncomes(user.uid, selectedParcel !== 'all' ? { parcelId: selectedParcel } : undefined),
      getParcels(user.uid),
    ])
    setIncomes(i.data)
    setParcels(p.data)
    setLoading(false)
  }, [user, selectedParcel])

  useEffect(() => { loadData() }, [loadData])

  const handleRestore = async (item: Income) => {
    if (!user) return
    const { createIncome } = await import('@/lib/api')
    await createIncome(user.uid, {
      parcelId: item.parcelId, productName: item.productName,
      quantity: item.quantity, unit: item.unit, totalAmount: item.totalAmount,
      date: item.date, notes: item.notes,
    })
    loadData()
  }

  const { deleteWithUndo } = useUndoDelete(
    (id) => deleteIncome(user!.uid, id),
    handleRestore,
    loadData,
    { deleted: t.deleted, undo: t.undo, error: t.error },
  )

  const total = incomes.reduce((sum, i) => sum + i.totalAmount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <HeaderBar
          title={t.incomes}
          right={
            <TouchableOpacity onPress={() => setSheetOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          }
        />

        {/* Total */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#10B981', fontVariant: ['tabular-nums'] }}>+{formatMAD(total)} MAD</Text>
        </View>

        {/* Parcel filter */}
        <FlatList
          horizontal
          data={[{ id: 'all', name: t.allParcels } as Parcel, ...activeParcels]}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedParcel(item.id)}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === item.id ? '#16A34A' : '#F3F4F6' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: selectedParcel === item.id ? '#FFFFFF' : '#6B7280' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        {/* List */}
        {loading ? (
          <View style={{ padding: 16, gap: 10 }}>
            {[1, 2, 3].map(i => <View key={i} style={{ height: 72, borderRadius: 12, backgroundColor: '#F3F4F6' }} />)}
          </View>
        ) : (
          <FlatList
            data={incomes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <TrendingUp size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12 }}>{t.noIncomes}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const unitPrice = item.quantity && item.quantity > 0 ? item.totalAmount / item.quantity : null
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <TrendingUp size={16} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{item.productName}</Text>
                    {unitPrice ? <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.unitPrice}: {formatMADDecimal(unitPrice)} MAD/{item.unit || 'u'}</Text> : null}
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.date}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981', fontVariant: ['tabular-nums'] }}>+{formatMAD(item.totalAmount)} MAD</Text>
                  <TouchableOpacity onPress={() => deleteWithUndo(item)} style={{ padding: 6, marginLeft: 8 }}>
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )
            }}
          />
        )}

        <AddIncomeSheet visible={sheetOpen} onClose={() => { setSheetOpen(false); loadData() }} />
      </View>
    </SafeAreaView>
  )
}
