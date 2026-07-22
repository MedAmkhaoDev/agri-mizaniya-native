import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { getCooperativeSupports, createCooperativeSupport, deleteCooperativeSupport, getParcels } from '@/lib/api'
import { formatMAD, filterNumeric } from '@/lib/format'
import type { CooperativeSupport, Parcel, CooperativeSupportType } from '@/lib/types'
import Toast from 'react-native-toast-message'
import { Plus, Trash2, HandCoins, X, Check } from 'lucide-react-native'

const SUPPORT_TYPES: CooperativeSupportType[] = ['gas', 'seeds', 'tools', 'fertilizer', 'equipment', 'other']

export default function CooperativeScreen() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { currentFarmId, canWrite } = useFarm()
  const [supports, setSupports] = useState<CooperativeSupport[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParcel, setSelectedParcel] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formParcelId, setFormParcelId] = useState('')
  const [supportType, setSupportType] = useState<CooperativeSupportType>('other')
  const [amount, setAmount] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!currentFarmId) return null

  const loadData = useCallback(async () => {
    if (!user || !currentFarmId) return
    setLoading(true)
    const [s, p] = await Promise.all([
      getCooperativeSupports(currentFarmId!, selectedParcel !== 'all' ? { parcelId: selectedParcel } : undefined),
      getParcels(currentFarmId!),
    ])
    setSupports(s.data)
    setParcels(p.data)
    setLoading(false)
  }, [user, currentFarmId, selectedParcel])

  useEffect(() => { loadData() }, [loadData])

  const resetForm = () => { setFormParcelId(''); setSupportType('other'); setAmount(''); setInvoiceNumber(''); setNotes(''); setSheetOpen(false) }

  const handleSave = async () => {
    if (!user || !currentFarmId || !amount) return
    setSaving(true)
    await createCooperativeSupport(currentFarmId!, user.uid, {
      parcelId: formParcelId || null, supportType, amount: parseFloat(amount),
      invoiceNumber: invoiceNumber.trim() || null, description: null,
      date: new Date().toISOString().split('T')[0], notes: notes.trim() || null,
    })
    resetForm(); setSaving(false); loadData()
  }

  const handleDelete = (support: CooperativeSupport) => {
    Alert.alert(t.delete, `${t.delete}?`, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => { if (!user || !currentFarmId) return; await deleteCooperativeSupport(currentFarmId!, support.id); loadData() } },
    ])
  }

  const total = supports.reduce((sum, s) => sum + s.amount, 0)
  const activeParcels = parcels.filter(p => p.status === 'active')

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.cooperative}</Text>
        {canWrite && (
          <TouchableOpacity onPress={() => setSheetOpen(true)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Total */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#8B5CF6', fontVariant: ['tabular-nums'] }}>-{formatMAD(total)} MAD</Text>
      </View>

      {/* Parcel filter */}
      <FlatList
        horizontal
        data={[{ id: 'all', name: t.allParcels } as Parcel, ...activeParcels]}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedParcel(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: selectedParcel === item.id ? '#8B5CF6' : '#F3F4F6' }}>
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
          data={supports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <HandCoins size={48} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 12 }}>{t.noCooperative}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <HandCoins size={16} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{t.supportTypes[item.supportType]}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.date}</Text>
                {item.invoiceNumber ? <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{t.invoiceNumber}: {item.invoiceNumber}</Text> : null}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#8B5CF6', fontVariant: ['tabular-nums'] }}>-{formatMAD(item.amount)} MAD</Text>
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
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#8B5CF6', marginBottom: 16 }}>{t.addCooperative}</Text>

            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.supportType}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {SUPPORT_TYPES.map((type) => (
                <TouchableOpacity key={type} onPress={() => setSupportType(type)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: supportType === type ? '#8B5CF6' : '#E5E7EB', backgroundColor: supportType === type ? '#F5F3FF' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: supportType === type ? '#8B5CF6' : '#6B7280' }}>{t.supportTypes[type]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t.parcel} ({t.optional})</Text>
            <FlatList
              horizontal data={activeParcels} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setFormParcelId(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: formParcelId === item.id ? '#8B5CF6' : '#E5E7EB', backgroundColor: formParcelId === item.id ? '#F5F3FF' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: formParcelId === item.id ? '#8B5CF6' : '#6B7280' }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.amount}</Text>
            <TextInput value={amount} onChangeText={v => setAmount(filterNumeric(v))} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.invoiceNumber}</Text>
            <TextInput value={invoiceNumber} onChangeText={setInvoiceNumber} placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />

            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.notes} ({t.optional})</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholderTextColor="#9CA3AF" style={{ height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#111827', marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setSheetOpen(false)} style={{ flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '600', color: '#6B7280' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={!amount || saving} style={{ flex: 1, height: 48, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: !amount || saving ? 0.5 : 1 }}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
