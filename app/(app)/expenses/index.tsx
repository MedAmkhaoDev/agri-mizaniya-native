import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { getExpenses, deleteExpense, getParcels } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import { useUndoDelete } from '@/hooks/useUndoDelete'
import AddExpenseSheet from '@/components/AddExpenseSheet'
import Toast from 'react-native-toast-message'
import type { Expense, Parcel } from '@/lib/types'
import { TrendingDown, Plus, Trash2, MapPin } from 'lucide-react-native'

export default function ExpensesScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [displayExpenses, setDisplayExpenses] = useState<Expense[]>([])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [e, p] = await Promise.all([
      getExpenses(user.uid, selectedParcel !== 'all' ? { parcelId: selectedParcel } : undefined),
      getParcels(user.uid),
    ])
    setExpenses(e.data)
    setParcels(p.data)
    setLoading(false)
  }, [user, selectedParcel])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    setDisplayExpenses(expenses)
  }, [expenses])

  const handleRestore = async (item: Expense) => {
    if (!user) return
    const { createExpense } = await import('@/lib/api')
    await createExpense(user.uid, {
      parcelId: item.parcelId, typeId: item.typeId, description: item.description,
      amount: item.amount, quantity: item.quantity, unit: item.unit,
      date: item.date, notes: item.notes,
    })
    loadData()
  }

  const { deleteWithUndo } = useUndoDelete(
    (id) => deleteExpense(user!.uid, id),
    handleRestore,
    loadData,
    { deleted: t.deleted, undo: t.undo, error: t.error },
  )

  const total = displayExpenses.reduce((sum, e) => sum + e.amount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.expenses}</Text>
          <TouchableOpacity onPress={() => setSheetOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Total */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#EF4444', fontVariant: ['tabular-nums'] }}>-{formatMAD(total)} MAD</Text>
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
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === item.id ? '#EF4444' : '#F3F4F6' }}
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
            data={displayExpenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <TrendingDown size={48} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12 }}>{t.noExpenses}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <TrendingDown size={16} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{item.description || t.other}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.date}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444', fontVariant: ['tabular-nums'] }}>-{formatMAD(item.amount)} MAD</Text>
                <TouchableOpacity onPress={() => deleteWithUndo(item)} style={{ padding: 6, marginLeft: 8 }}>
                  <Trash2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <AddExpenseSheet visible={sheetOpen} onClose={() => { setSheetOpen(false); loadData() }} />
      </View>
    </SafeAreaView>
  )
}
