import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { HeaderBar } from '@/components/HeaderBar'
import { updateFarm, generateShareCode, getShareCodes } from '@/lib/api'
import type { FarmInviteCode, FarmRole } from '@/lib/types'
import { Save, Copy, Plus } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'

export default function FarmSettingsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentFarmId, currentFarm, canManageFarmSettings, refreshFarm } = useFarm()
  const { t } = useI18n()

  const [farmName, setFarmName] = useState(currentFarm?.name || '')
  const [farmDesc, setFarmDesc] = useState(currentFarm?.description || '')
  const [shareCodes, setShareCodes] = useState<FarmInviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const loadData = useCallback(async () => {
    if (!currentFarmId) return
    const { data, error } = await getShareCodes(currentFarmId)
    if (!error) setShareCodes(data)
    setLoading(false)
  }, [currentFarmId])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (currentFarm) {
      setFarmName(currentFarm.name)
      setFarmDesc(currentFarm.description || '')
    }
  }, [currentFarm?.name, currentFarm?.description])

  const handleSave = async () => {
    if (!currentFarmId || !farmName.trim()) return
    setSaving(true)
    const { error } = await updateFarm(currentFarmId, { name: farmName.trim(), description: farmDesc.trim() || undefined }, user?.uid)
    if (error) {
      Alert.alert(t.error, error.message || t.failedToSave)
      setSaving(false)
      return
    }
    await refreshFarm()
    Alert.alert(t.success, t.farmUpdated)
    setSaving(false)
  }

  const handleGenerateCode = async () => {
    if (!currentFarmId || !currentFarm || !user) return
    setGenerating(true)
    const { data, error } = await generateShareCode(currentFarmId, currentFarm.name, user.uid, 'viewer' as FarmRole)
    if (error) {
      Alert.alert(t.error, error.message || t.failedToGenerate)
      setGenerating(false)
      return
    }
    if (data) setShareCodes([data, ...shareCodes])
    Alert.alert(t.success, t.codeGenerated)
    setGenerating(false)
  }

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code)
    Alert.alert(t.copied, t.codeCopiedToClipboard)
  }

  if (!currentFarmId) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      <HeaderBar title={t.farmSettings} showBack showSettings={false} />
      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {/* Farm Info */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 }}>{t.farmInformation}</Text>
          <TextInput
            value={farmName}
            onChangeText={setFarmName}
            placeholder={t.farmName}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
            style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 12 }}
          />
          <TextInput
            value={farmDesc}
            onChangeText={setFarmDesc}
            placeholder={t.farmDescriptionOptional}
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
            multiline
            numberOfLines={3}
            style={{ height: 80, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', marginBottom: 16, textAlignVertical: 'top' }}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !farmName.trim() || !canManageFarmSettings}
            style={{ backgroundColor: farmName.trim() && canManageFarmSettings ? '#16A34A' : '#D1D5DB', borderRadius: 10, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Save size={16} color="#FFFFFF" />}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{saving ? t.saving : t.save}</Text>
          </TouchableOpacity>
        </View>

        {/* Share Codes */}
        {canManageFarmSettings && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t.shareCodes}</Text>
              <TouchableOpacity
                onPress={handleGenerateCode}
                disabled={generating}
                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                {generating ? <ActivityIndicator size="small" /> : <Plus size={16} color="#374151" />}
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : shareCodes.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{t.noShareCodes}</Text>
            ) : (
              shareCodes.map(code => (
                <View key={code.code} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: 'monospace', color: '#111827' }}>{code.code}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginRight: 12 }}>{code.useCount}/{code.maxUses || '∞'}</Text>
                  <TouchableOpacity onPress={() => handleCopyCode(code.code)} style={{ padding: 4 }}>
                    <Copy size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
