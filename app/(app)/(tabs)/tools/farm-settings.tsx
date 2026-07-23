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
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <HeaderBar title={t.farmSettings} showBack showSettings={false} />
      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <Text className="mb-3 text-[15px] font-semibold text-gray-700 dark:text-gray-300">{t.farmInformation}</Text>
          <TextInput
            value={farmName}
            onChangeText={setFarmName}
            placeholder={t.farmName}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
            className="mb-3 h-12 rounded-[10px] border border-gray-200 dark:border-gray-700 px-4 text-[15px] text-gray-900 dark:text-gray-100"
          />
          <TextInput
            value={farmDesc}
            onChangeText={setFarmDesc}
            placeholder={t.farmDescriptionOptional}
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
            multiline
            numberOfLines={3}
            className="mb-4 h-20 rounded-[10px] border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-[15px] text-gray-900 dark:text-gray-100"
            style={{ textAlignVertical: 'top' }}
          />
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !farmName.trim() || !canManageFarmSettings}
            className={`flex-row items-center justify-center gap-2 rounded-[10px] py-3.5 ${farmName.trim() && canManageFarmSettings ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Save size={16} color="#FFFFFF" />}
            <Text className="text-[15px] font-bold text-white">{saving ? t.saving : t.save}</Text>
          </TouchableOpacity>
        </View>

        {canManageFarmSettings && (
          <View className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-gray-700 dark:text-gray-300">{t.shareCodes}</Text>
              <TouchableOpacity
                onPress={handleGenerateCode}
                disabled={generating}
                className="h-9 w-9 items-center justify-center rounded-[10px] bg-gray-100 dark:bg-gray-700"
              >
                {generating ? <ActivityIndicator size="small" /> : <Plus size={16} color="#374151" />}
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : shareCodes.length === 0 ? (
              <Text className="text-[13px] text-gray-400 dark:text-gray-500">{t.noShareCodes}</Text>
            ) : (
              shareCodes.map(code => (
                <View key={code.code} className="flex-row items-center border-b border-gray-100 dark:border-gray-800 py-2.5">
                  <Text className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">{code.code}</Text>
                  <Text className="mr-3 text-[11px] text-gray-400 dark:text-gray-500">{code.useCount}/{code.maxUses || '∞'}</Text>
                  <TouchableOpacity onPress={() => handleCopyCode(code.code)} className="p-1">
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
