import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { getParcels, createParcel, updateParcel, deleteParcel, getFinancialSummary } from '@/lib/api'
import { getLastParcelId } from '@/hooks/useDraft'
import { formatMAD } from '@/lib/format'
import type { Parcel, FinancialSummary } from '@/lib/types'
import Toast from 'react-native-toast-message'
import { HeaderBar } from '@/components/HeaderBar'
import {
  MapPin, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronRight, Archive, X, Check,
} from 'lucide-react-native'

export default function ParcelsScreen() {
  const { user } = useAuth()
  const { currentFarmId, canManageParcels, isWorker } = useFarm()
  const { t } = useI18n()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [loading, setLoading] = useState(true)
  const [financials, setFinancials] = useState<Record<string, FinancialSummary>>({})
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', area_hectares: '', location: '', notes: '' })

  const load = useCallback(async () => {
    if (!user || !currentFarmId) return
    setLoading(true)
    const { data } = await getParcels(currentFarmId)
    const lastId = await getLastParcelId()
    const sorted = [...data].sort((a, b) => {
      if (a.id === lastId) return -1
      if (b.id === lastId) return 1
      return 0
    })
    setParcels(sorted)
    const finMap: Record<string, FinancialSummary> = {}
    await Promise.all(data.map(async (p) => { finMap[p.id] = await getFinancialSummary(currentFarmId!, p.id) }))
    setFinancials(finMap)
    setLoading(false)
  }, [user, currentFarmId])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditingParcel(null); setForm({ name: '', area_hectares: '', location: '', notes: '' }); setSheetOpen(true) }
  const openEdit = (p: Parcel) => { setEditingParcel(p); setForm({ name: p.name, area_hectares: p.areaHectares?.toString() || '', location: p.location || '', notes: p.notes || '' }); setSelectedParcel(null); setSheetOpen(true) }

  const handleSave = async () => {
    if (!user || !currentFarmId || !form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), areaHectares: form.area_hectares ? parseFloat(form.area_hectares) : null, location: form.location.trim() || null, status: (editingParcel?.status || 'active') as 'active' | 'archived', notes: form.notes.trim() || null, assignedTo: null }
    if (editingParcel) { await updateParcel(currentFarmId, editingParcel.id, payload) } else { await createParcel(currentFarmId, user.uid, payload) }
    setSheetOpen(false); setSaving(false); load()
  }

  const handleArchive = async (p: Parcel) => {
    if (!user || !currentFarmId) return
    await updateParcel(currentFarmId, p.id, { status: p.status === 'active' ? 'archived' : 'active' })
    setSelectedParcel(null); load()
  }

  const handleDelete = async (p: Parcel) => {
    if (!user || !currentFarmId) return
    await deleteParcel(currentFarmId, p.id)
    setSelectedParcel(null); load()
  }

  const activeParcels = parcels.filter(p => p.status === 'active')
  const archivedParcels = parcels.filter(p => p.status === 'archived')

  const renderParcelCard = (p: Parcel) => {
    const fin = financials[p.id]
    const isProfit = (fin?.netProfit ?? 0) >= 0
    return (
      <TouchableOpacity key={p.id} onPress={() => setSelectedParcel(p)} activeOpacity={0.7} style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={16} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }} numberOfLines={1}>{p.name}</Text>
                {p.location ? <Text style={{ fontSize: 11, color: '#9CA3AF' }} numberOfLines={1}>{p.location}</Text> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {p.areaHectares ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>{p.areaHectares} ha</Text>
                </View>
              ) : null}
              {fin ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2', borderWidth: 1, borderColor: isProfit ? '#A7F3D0' : '#FECACA' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isProfit ? '#10B981' : '#EF4444' }}>
                    {isProfit ? '+' : '-'}{formatMAD(fin.netProfit)} MAD
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <ChevronRight size={16} color="#9CA3AF" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    )
  }

  if (!currentFarmId) return null

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <HeaderBar
          title={t.parcels}
          right={
            canManageParcels ? (
              <TouchableOpacity onPress={openAdd} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {loading ? (
            [1, 2, 3].map(i => <View key={i} style={{ height: 96, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 10 }} />)
          ) : activeParcels.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <MapPin size={48} color="#D1D5DB" />
              <Text style={{ color: '#9CA3AF', marginTop: 12 }}>{t.noParcels}</Text>
              <TouchableOpacity onPress={openAdd} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#16A34A' }}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t.addParcel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeParcels.map(renderParcelCard)
          )}

          {archivedParcels.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Archive size={16} color="#9CA3AF" />
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#9CA3AF' }}>{t.archived}</Text>
              </View>
              <View style={{ opacity: 0.6 }}>{archivedParcels.map(renderParcelCard)}</View>
            </View>
          )}
        </ScrollView>

        {/* Detail Modal */}
        <Modal visible={!!selectedParcel} transparent animationType="slide" onRequestClose={() => setSelectedParcel(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setSelectedParcel(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', padding: 20, paddingBottom: 34 }}>
              {selectedParcel && (() => {
                const fin = financials[selectedParcel.id]
                const isProfit = (fin?.netProfit ?? 0) >= 0
                return (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MapPin size={20} color="#3B82F6" />
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{selectedParcel.name}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedParcel(null)}><X size={20} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {selectedParcel.areaHectares ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F3F4F6' }}><Text style={{ fontSize: 12 }}>{selectedParcel.areaHectares} ha</Text></View> : null}
                      {selectedParcel.location ? <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}><Text style={{ fontSize: 12 }}>{selectedParcel.location}</Text></View> : null}
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: selectedParcel.status === 'active' ? '#ECFDF5' : '#F3F4F6' }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: selectedParcel.status === 'active' ? '#059669' : '#6B7280' }}>{selectedParcel.status === 'active' ? t.active : t.archived}</Text>
                      </View>
                    </View>

                    {fin ? (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>{t.parcelDetail}</Text>
                        <View style={{ padding: 16, borderRadius: 12, borderWidth: 2, borderColor: isProfit ? '#A7F3D0' : '#FECACA', backgroundColor: isProfit ? '#ECFDF5' : '#FEF2F2', marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            {isProfit ? <ArrowUpRight size={18} color="#10B981" /> : <ArrowDownRight size={18} color="#EF4444" />}
                            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{t.netProfitLoss}</Text>
                          </View>
                          <Text style={{ fontSize: 22, fontWeight: '700', color: isProfit ? '#10B981' : '#EF4444' }}>{isProfit ? '+' : '-'}{formatMAD(fin.netProfit)} MAD</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          <View style={{ flex: 1, minWidth: '45%', padding: 12, borderRadius: 10, backgroundColor: '#ECFDF5' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}><TrendingUp size={12} color="#10B981" /><Text style={{ fontSize: 11, color: '#9CA3AF' }}>{t.totalIncome}</Text></View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#10B981' }}>+{formatMAD(fin.totalIncome)} MAD</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: '45%', padding: 12, borderRadius: 10, backgroundColor: '#FEF2F2' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}><TrendingDown size={12} color="#EF4444" /><Text style={{ fontSize: 11, color: '#9CA3AF' }}>{t.totalExpenses}</Text></View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#EF4444' }}>-{formatMAD(fin.totalExpenses)} MAD</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: '45%', padding: 12, borderRadius: 10, backgroundColor: '#FFF7ED' }}>
                            <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{t.totalGas}</Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>-{formatMAD(fin.totalGas)} MAD</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: '45%', padding: 12, borderRadius: 10, backgroundColor: '#F5F3FF' }}>
                            <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{t.totalCooperative}</Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#8B5CF6' }}>-{formatMAD(fin.totalCooperative)} MAD</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}

                    {selectedParcel.notes ? (
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginBottom: 4 }}>{t.notes}</Text>
                        <View style={{ padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6' }}><Text style={{ fontSize: 13 }}>{selectedParcel.notes}</Text></View>
                      </View>
                    ) : null}

                    {canManageParcels && (
                      <View style={{ gap: 8 }}>
                        <TouchableOpacity onPress={() => openEdit(selectedParcel)} style={{ height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontWeight: '600', color: '#374151' }}>{t.edit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleArchive(selectedParcel)} style={{ height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontWeight: '600', color: '#F97316' }}>{t.archiveParcel}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )
              })()}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Add/Edit Sheet */}
        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setSheetOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{editingParcel ? t.editParcel : t.addParcel}</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.parcelName} *</Text>
              <TextInput value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Parcelle A" placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.areaHectares}</Text>
                  <TextInput value={form.area_hectares} onChangeText={v => setForm(p => ({ ...p, area_hectares: v }))} placeholder="2.5" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.location}</Text>
                  <TextInput value={form.location} onChangeText={v => setForm(p => ({ ...p, location: v }))} placeholder="Douar..." placeholderTextColor="#9CA3AF" style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }} />
                </View>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.notes}</Text>
              <TextInput value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder={t.notes} placeholderTextColor="#9CA3AF" multiline numberOfLines={2} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', marginBottom: 16, minHeight: 60, textAlignVertical: 'top' }} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setSheetOpen(false)} style={{ flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '600', color: '#6B7280' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.name.trim() || saving} style={{ flex: 1, height: 48, borderRadius: 10, backgroundColor: !form.name.trim() || saving ? '#93C5FD' : '#16A34A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                  {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  )
}
