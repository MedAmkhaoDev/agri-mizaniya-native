import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { getGasUsages, createGasUsage, deleteGasUsage, getParcels } from '@/lib/api'
import { formatMAD } from '@/lib/format'
import type { GasUsage, Parcel } from '@/lib/types'
import Toast from 'react-native-toast-message'
import { Plus, Trash2, Flame, X, Check } from 'lucide-react-native'

export default function GasScreen() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [gasUsages, setGasUsages] = useState<GasUsage[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formParcelId, setFormParcelId] = useState('')
  const [quantityBottles, setQuantityBottles] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [g, p] = await Promise.all([
      getGasUsages(user.uid, selectedParcel !== 'all' ? { parcelId: selectedParcel } : undefined),
      getParcels(user.uid),
    ])
    setGasUsages(g.data)
    setParcels(p.data)
    setLoading(false)
  }, [user, selectedParcel])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => { setFormParcelId(''); setQuantityBottles(''); setTotalAmount(''); setNotes(''); setSheetOpen(false) }

  const handleSave = async () => {
    if (!user || !formParcelId || !quantityBottles || !totalAmount) return
    setSaving(true)
    await createGasUsage(user.uid, {
      parcelId: formParcelId, quantityBottles: parseFloat(quantityBottles),
      totalAmount: parseFloat(totalAmount), date: new Date().toISOString().split('T')[0], notes: notes.trim() || null,
    })
    resetForm(); setSaving(false); loadData()
  }

  const handleDelete = (gas: GasUsage) => {
    Alert.alert(t.delete, `${t.delete}?`, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => { if (!user) return; await deleteGasUsage(user.uid, gas.id); loadData() } },
    ])
  }

  const total = gasUsages.reduce((sum, g) => sum + g.totalAmount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.gasUsage}</Text>
        <TouchableOpacity onPress={() => setSheetOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Total */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#F97316', fontVariant: ['tabular-nums'] }}>-{formatMAD(total)} MAD</Text>
      </View>

      {/* Parcel filter */}
      <FlatList
        horizontal
        data={[{ id: 'all', name: t.allParcels } as Parcel, ...activeParcels]}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedParcel(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === item.id ? '#F97316' : '#F3F4F6' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: selectedParcel === item.id ? '#FFFFFF' : '#6B7280' }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={{ padding: 16, gap: 10 }}>
          {[1, 2, 3].map(i => <View key={i} style={{ height: 72, borderRadius: 12, backgroundColor: '#F3F4F6' }} />)}
        </View>
      ) : (
        <FlatList
          data={gasUsages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Flame size={48} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 12 }}>{t.noGas}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Flame size={16} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{item.quantityBottles} bouteilles</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.date}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#F97316', fontVariant: ['tabular-nums'] }}>-{formatMAD(item.totalAmount)} MAD</Text>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 6, marginLeft: 8 }}>
                <Trash2 size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Sheet */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setSheetOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#F97316', marginBottom: 16 }}>{t.addGas}</Text>

            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.parcel}</Text>
            <FlatList
              horizontal data={activeParcels} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setFormParcelId(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: formParcelId === item.id ? '#F97316' : '#E5E7EB', backgroundColor: formParcelId === item.id ? '#FFF7ED' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: formParcelId === item.id ? '#F97316' : '#6B7280' }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.quantityBottles}</Text>
            <TextInput value={quantityBottles} onChangeText={setQuantityBottles} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.totalAmount}</Text>
            <TextInput value={totalAmount} onChangeText={setTotalAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.notes} ({t.optional})</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF" style={{ height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#111827', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setSheetOpen(false)} style={{ flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#6B7280' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!formParcelId || !quantityBottles || !totalAmount || saving} style={{ flex: 1, height: 48, borderRadius: 10, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: !formParcelId || !quantityBottles || !totalAmount || saving ? 0.5 : 1 }}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
