import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { createParcel, updateParcel, deleteParcel, getFinancialSummary, parcelConstraints } from '@/lib/api'
import { getLastParcelId } from '@/hooks/useDraft'
import { formatMAD, filterNumeric } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRealtimeCollection, type WithPending } from '@/hooks/useRealtimeCollection'
import type { Parcel, FinancialSummary } from '@/lib/types'
import Toast from 'react-native-toast-message'
import { HeaderBar } from '@/components/HeaderBar'
import {
  MapPin, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronRight, Archive, X, Check, AlertCircle, RefreshCw,
} from 'lucide-react-native'

export default function ParcelsScreen() {
  const { user } = useAuth()
  const { currentFarmId, canManageParcels, isWorker } = useFarm()
  const { t } = useI18n()
  const [financials, setFinancials] = useState<Record<string, FinancialSummary>>({})
  const [selectedParcel, setSelectedParcel] = useState<WithPending<Parcel> | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingParcel, setEditingParcel] = useState<WithPending<Parcel> | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', area_hectares: '', location: '', notes: '' })

  const parcelsPath = currentFarmId ? `farms/${currentFarmId}/parcels` : ''
  const constraints = useMemo(() => parcelConstraints(), [])

  const { data: allParcels, loading, error } = useRealtimeCollection<Parcel>(parcelsPath, {
    constraints,
    enabled: !!currentFarmId,
  })

  const [lastParcelId, setLastParcelId] = useState<string | null>(null)

  useEffect(() => {
    getLastParcelId().then(setLastParcelId)
  }, [])

  const parcels = useMemo(() => {
    const sorted = [...allParcels].sort((a, b) => {
      if (a.id === lastParcelId) return -1
      if (b.id === lastParcelId) return 1
      return 0
    })
    return sorted
  }, [allParcels, lastParcelId])

  useEffect(() => {
    if (!currentFarmId || parcels.length === 0) return
    const finMap: Record<string, FinancialSummary> = {}
    Promise.all(parcels.map(async (p) => {
      finMap[p.id] = await getFinancialSummary(currentFarmId!, p.id)
    })).then(() => setFinancials(finMap))
  }, [currentFarmId, parcels])

  const openAdd = () => { setEditingParcel(null); setForm({ name: '', area_hectares: '', location: '', notes: '' }); setSheetOpen(true) }
  const openEdit = (p: WithPending<Parcel>) => { setEditingParcel(p); setForm({ name: p.name, area_hectares: p.areaHectares?.toString() || '', location: p.location || '', notes: p.notes || '' }); setSelectedParcel(null); setSheetOpen(true) }

  const handleSave = async () => {
    if (!user || !currentFarmId || !form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), areaHectares: form.area_hectares ? parseFloat(form.area_hectares) : null, location: form.location.trim() || null, status: (editingParcel?.status || 'active') as 'active' | 'archived', notes: form.notes.trim() || null, assignedTo: null }
    if (editingParcel) { await updateParcel(currentFarmId, editingParcel.id, payload) } else { await createParcel(currentFarmId, user.uid, payload) }
    setSheetOpen(false); setSaving(false)
  }

  const handleArchive = async (p: WithPending<Parcel>) => {
    if (!user || !currentFarmId) return
    await updateParcel(currentFarmId, p.id, { status: p.status === 'active' ? 'archived' : 'active' })
    setSelectedParcel(null)
  }

  const handleDelete = async (p: WithPending<Parcel>) => {
    if (!user || !currentFarmId) return
    await deleteParcel(currentFarmId, p.id)
    setSelectedParcel(null)
  }

  const activeParcels = parcels.filter(p => p.status === 'active')
  const archivedParcels = parcels.filter(p => p.status === 'archived')

  const renderParcelCard = (p: WithPending<Parcel>) => {
    const fin = financials[p.id]
    const isProfit = (fin?.netProfit ?? 0) >= 0
    return (
      <TouchableOpacity key={p.id} onPress={() => setSelectedParcel(p)} activeOpacity={0.7} className="p-4 rounded-xl border border-border bg-background mb-2.5">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 mb-1.5">
              <View className="w-8 h-8 rounded-[10px] bg-blue-50 dark:bg-blue-950 items-center justify-center">
                <MapPin size={16} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{p.name}</Text>
                {p.location ? <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{p.location}</Text> : null}
              </View>
            </View>
            <View className="flex-row gap-1.5 flex-wrap mt-1.5">
              {p.areaHectares ? (
                <View className="px-2 py-[3px] rounded-2xl bg-accent">
                  <Text className="text-[11px] font-medium text-muted-foreground">{p.areaHectares} ha</Text>
                </View>
              ) : null}
              {fin ? (
                <View className={cn("px-2 py-[3px] rounded-2xl border",
                  isProfit ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                )}>
                  <Text className={cn("text-[11px] font-semibold", isProfit ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
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
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 bg-background">
        <HeaderBar
          title={t.parcels}
          right={
            canManageParcels ? (
              <TouchableOpacity onPress={openAdd} className="w-9 h-9 rounded-[10px] bg-green-600 dark:bg-green-500 items-center justify-center">
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <ScrollView contentContainerClassName="p-4" refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#6B7280" />}>
          {loading ? (
            [1, 2, 3].map(i => <View key={i} className="h-24 rounded-xl bg-accent mb-2.5 animate-pulse" />)
          ) : error ? (
            <View className="items-center py-16 px-6">
              <View className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mb-4">
                <AlertCircle size={28} color="#EF4444" />
              </View>
              <Text className="text-[15px] font-semibold text-foreground mb-1">{t.failedToLoad}</Text>
              <Text className="text-[13px] text-muted-foreground mb-5 text-center">{error.message}</Text>
            </View>
          ) : activeParcels.length === 0 ? (
            <View className="items-center py-16">
              <MapPin size={48} color="#D1D5DB" />
              <Text className="text-muted-foreground mt-3">{t.noParcels}</Text>
              <TouchableOpacity onPress={openAdd} className="mt-4 flex-row items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-green-600 dark:bg-green-500">
                <Plus size={16} color="#FFFFFF" />
                <Text className="text-white font-semibold">{t.addParcel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeParcels.map(renderParcelCard)
          )}

          {archivedParcels.length > 0 && (
            <View className="mt-4">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Archive size={16} color="#9CA3AF" />
                <Text className="text-[13px] font-medium text-muted-foreground">{t.archived}</Text>
              </View>
              <View className="opacity-60">{archivedParcels.map(renderParcelCard)}</View>
            </View>
          )}
        </ScrollView>

        <Modal visible={!!selectedParcel} transparent animationType="slide" onRequestClose={() => setSelectedParcel(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setSelectedParcel(null)} className="flex-1 bg-black/40 justify-end">
            <TouchableOpacity activeOpacity={1} className="bg-background rounded-tl-[20px] rounded-tr-[20px] max-h-[85%] p-5 pb-[34px]">
              {selectedParcel && (() => {
                const fin = financials[selectedParcel.id]
                const isProfit = (fin?.netProfit ?? 0) >= 0
                return (
                  <>
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-row items-center gap-2">
                        <MapPin size={20} color="#3B82F6" />
                        <Text className="text-lg font-bold text-foreground">{selectedParcel.name}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedParcel(null)}><X size={20} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <View className="flex-row gap-1.5 flex-wrap mb-4">
                      {selectedParcel.areaHectares ? <View className="px-2.5 py-1 rounded-2xl bg-accent"><Text className="text-xs text-foreground">{selectedParcel.areaHectares} ha</Text></View> : null}
                      {selectedParcel.location ? <View className="px-2.5 py-1 rounded-2xl border border-border"><Text className="text-xs text-foreground">{selectedParcel.location}</Text></View> : null}
                      <View className={cn("px-2.5 py-1 rounded-2xl", selectedParcel.status === 'active' ? "bg-emerald-50 dark:bg-emerald-950" : "bg-accent")}>
                        <Text className={cn("text-xs font-medium", selectedParcel.status === 'active' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{selectedParcel.status === 'active' ? t.active : t.archived}</Text>
                      </View>
                    </View>

                    {fin ? (
                      <View className="mb-4">
                        <Text className="text-[13px] font-semibold text-foreground mb-2">{t.parcelDetail}</Text>
                        <View className={cn("p-4 rounded-xl border-2 mb-2.5",
                          isProfit ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
                        )}>
                          <View className="flex-row items-center gap-1.5 mb-1">
                            {isProfit ? <ArrowUpRight size={18} color="#10B981" /> : <ArrowDownRight size={18} color="#EF4444" />}
                            <Text className="text-xs text-muted-foreground">{t.netProfitLoss}</Text>
                          </View>
                          <Text className={cn("text-[22px] font-bold", isProfit ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>{isProfit ? '+' : '-'}{formatMAD(fin.netProfit)} MAD</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                          <View className="flex-1 min-w-[45%] p-3 rounded-[10px] bg-emerald-50 dark:bg-emerald-950">
                            <View className="flex-row items-center gap-1 mb-1"><TrendingUp size={12} color="#10B981" /><Text className="text-[11px] text-muted-foreground">{t.totalIncome}</Text></View>
                            <Text className="text-[15px] font-bold text-emerald-500 dark:text-emerald-400">+{formatMAD(fin.totalIncome)} MAD</Text>
                          </View>
                          <View className="flex-1 min-w-[45%] p-3 rounded-[10px] bg-red-50 dark:bg-red-950">
                            <View className="flex-row items-center gap-1 mb-1"><TrendingDown size={12} color="#EF4444" /><Text className="text-[11px] text-muted-foreground">{t.totalExpenses}</Text></View>
                            <Text className="text-[15px] font-bold text-red-500 dark:text-red-400">-{formatMAD(fin.totalExpenses)} MAD</Text>
                          </View>
                          <View className="flex-1 min-w-[45%] p-3 rounded-[10px] bg-orange-50 dark:bg-orange-950">
                            <Text className="text-[11px] text-muted-foreground mb-1">{t.totalGas}</Text>
                            <Text className="text-[15px] font-bold text-orange-500 dark:text-orange-400">-{formatMAD(fin.totalGas)} MAD</Text>
                          </View>
                          <View className="flex-1 min-w-[45%] p-3 rounded-[10px] bg-violet-50 dark:bg-violet-950">
                            <Text className="text-[11px] text-muted-foreground mb-1">{t.totalCooperative}</Text>
                            <Text className="text-[15px] font-bold text-violet-500 dark:text-violet-400">-{formatMAD(fin.totalCooperative)} MAD</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}

                    {selectedParcel.notes ? (
                      <View className="mb-4">
                        <Text className="text-xs font-medium text-muted-foreground mb-1">{t.notes}</Text>
                        <View className="p-3 rounded-2xl bg-accent"><Text className="text-[13px] text-foreground">{selectedParcel.notes}</Text></View>
                      </View>
                    ) : null}

                    {canManageParcels && (
                      <View className="gap-2">
                        <TouchableOpacity onPress={() => openEdit(selectedParcel)} className="h-11 rounded-[10px] border border-border items-center justify-center">
                          <Text className="font-semibold text-foreground">{t.edit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleArchive(selectedParcel)} className="h-11 rounded-[10px] border border-border items-center justify-center">
                          <Text className="font-semibold text-orange-500 dark:text-orange-400">{t.archiveParcel}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )
              })()}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setSheetOpen(false)} className="flex-1 bg-black/40 justify-end">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableOpacity activeOpacity={1} className="bg-background rounded-tl-[20px] rounded-tr-[20px] p-5 pb-[34px]">
              <View className="w-10 h-1 rounded-[2px] bg-border self-center mb-4" />
              <Text className="text-[17px] font-bold text-foreground mb-4">{editingParcel ? t.editParcel : t.addParcel}</Text>
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.parcelName} *</Text>
              <TextInput value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Parcelle A" placeholderTextColor="#9CA3AF" className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground mb-3" />
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.areaHectares}</Text>
                  <TextInput value={form.area_hectares} onChangeText={v => setForm(p => ({ ...p, area_hectares: filterNumeric(v) }))} placeholder="2.5" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.location}</Text>
                  <TextInput value={form.location} onChangeText={v => setForm(p => ({ ...p, location: v }))} placeholder="Douar..." placeholderTextColor="#9CA3AF" className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground" />
                </View>
              </View>
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.notes}</Text>
              <TextInput value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder={t.notes} placeholderTextColor="#9CA3AF" multiline numberOfLines={2} className="border border-border rounded-[10px] px-4 py-2.5 text-[15px] text-foreground mb-4 min-h-[60px]" style={{ textAlignVertical: 'top' }} />
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setSheetOpen(false)} className="flex-1 h-12 rounded-[10px] border border-border items-center justify-center">
                  <Text className="font-semibold text-muted-foreground">{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={!form.name.trim() || saving} className={cn("flex-1 h-12 rounded-[10px] items-center justify-center flex-row gap-1.5", !form.name.trim() || saving ? "bg-blue-300 dark:bg-blue-800" : "bg-green-600 dark:bg-green-500")}>
                  {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check size={18} color="#FFFFFF" />}
                  <Text className="text-white font-semibold">{t.save}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  )
}
