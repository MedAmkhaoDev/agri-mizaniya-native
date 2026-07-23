import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme-context'
import { updateProfile } from 'firebase/auth'
import type { Language } from '@/lib/i18n'
import Constants from 'expo-constants'
import {
  User, Globe, Sun, Moon, Monitor, LogOut, CheckCircle, Wifi, WifiOff, Wheat, ArrowRightLeft, Database, Shield, RefreshCw,
} from 'lucide-react-native'
import { useFarm } from '@/lib/farm-context'
import { useRouter } from 'expo-router'
import ChangePasswordSheet from '@/components/ChangePasswordSheet'
import { useSync } from '@/lib/sync-context'

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n()
  const { user, profile, signOut, refreshProfile, migrating, runMigration } = useAuth()
  const { theme, setTheme } = useTheme()
  const { currentFarm, canManageFarmSettings, canManageMembers } = useFarm()
  const { syncState, forceSync } = useSync()
  const router = useRouter()
  const [name, setName] = useState(profile?.fullName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const needsMigration = !profile?.farmIds || profile.farmIds.length === 0
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com')

  useEffect(() => { setName(profile?.fullName || '') }, [profile?.fullName])

  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return
    setSaving(true)
    try {
      await updateProfile(user, { displayName: name.trim() })
      await refreshProfile()
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaving(false)
    }
  }

  const languageOptions: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ]

  const themeOptions = [
    { value: 'system' as const, label: t.systemMode, icon: <Monitor size={18} color={theme === 'system' ? '#16A34A' : '#6B7280'} /> },
    { value: 'light' as const, label: t.lightMode, icon: <Sun size={18} color={theme === 'light' ? '#16A34A' : '#6B7280'} /> },
    { value: 'dark' as const, label: t.darkMode, icon: <Moon size={18} color={theme === 'dark' ? '#16A34A' : '#6B7280'} /> },
  ]

  const appVersion = Constants.expoConfig?.version || '1.0.0'

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, maxWidth: 480, alignSelf: 'center', width: '100%' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Text className="text-lg font-bold text-foreground mb-4">{t.settings}</Text>

        {currentFarm && (
  <View className="bg-background rounded-2xl border border-border mb-4 overflow-hidden">
    <View className="flex-row items-center gap-2 px-5 pt-5 pb-2">
      <Wheat size={16} color="#9CA3AF" />
      <Text className="text-[15px] font-semibold text-foreground">{t.currentFarm}</Text>
    </View>
    <View className="px-5 pb-4">
      <Text className="text-[17px] font-bold text-foreground mb-1">{currentFarm.name}</Text>
      {currentFarm.description ? <Text className="text-[13px] text-muted-foreground">{currentFarm.description}</Text> : null}
      <TouchableOpacity
        onPress={() => router.push('/(farm-select)')}
        className="mt-3 h-10 rounded-[10px] border border-border items-center justify-center flex-row gap-1.5"
      >
        <ArrowRightLeft size={14} color="#6B7280" />
        <Text className="text-[13px] font-medium text-muted-foreground">{t.switchFarm}</Text>
      </TouchableOpacity>
    </View>
        </View>
)}

        {needsMigration && (
          <View className="bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-300 dark:border-amber-700 mb-4 p-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Database size={16} color="#D97706" />
              <Text className="text-[15px] font-semibold text-amber-900 dark:text-amber-200">{t.dataMigration}</Text>
            </View>
            <Text className="text-[13px] text-amber-700 dark:text-amber-300 mb-3">{t.migrationDescription}</Text>
            <TouchableOpacity
              onPress={async () => {
                await runMigration()
                Alert.alert(t.success, t.migrationComplete)
              }}
              disabled={migrating}
              className={`h-11 rounded-[10px] items-center justify-center flex-row gap-1.5 ${migrating ? 'bg-amber-600 opacity-60' : 'bg-amber-500'}`}
            >
              {migrating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Database size={16} color="#FFFFFF" />}
              <Text className="text-white text-sm font-semibold">{migrating ? t.migrating : t.startMigration}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="bg-background rounded-2xl border border-border mb-4 overflow-hidden">
          <View className="flex-row items-center gap-2 px-5 pt-5 pb-2">
            <User size={16} color="#9CA3AF" />
            <Text className="text-[15px] font-semibold text-foreground">{t.profile}</Text>
          </View>
          <View className="px-5 pb-5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-green-600 items-center justify-center">
                <Text className="text-lg font-bold text-white">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </Text>
              </View>
              <View>
                <Text className="text-[15px] font-medium text-foreground">{profile?.fullName || 'Agriculteur'}</Text>
                <Text className="text-[13px] text-muted-foreground">{user?.email}</Text>
              </View>
            </View>
            <View>
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.fullName}</Text>
              <TextInput value={name} onChangeText={setName} className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground" />
            </View>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving} className={`h-11 rounded-[10px] bg-green-600 items-center justify-center flex-row gap-1.5 ${saving ? 'opacity-60' : ''}`}>
              {saved ? <CheckCircle size={16} color="#FFFFFF" /> : null}
              <Text className="text-white text-sm font-semibold">{saved ? t.success : saving ? t.loading : t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-background rounded-2xl border border-border mb-4 overflow-hidden">
          <View className="flex-row items-center gap-2 px-5 pt-5 pb-2">
            <Shield size={16} color="#9CA3AF" />
            <Text className="text-[15px] font-semibold text-foreground">{t.security}</Text>
          </View>
          <View className="px-5 pb-4">
            {isGoogleUser ? (
              <Text className="text-[13px] text-muted-foreground">{t.googlePasswordInfo}</Text>
            ) : (
              <TouchableOpacity
                onPress={() => setShowChangePassword(true)}
                className="h-11 rounded-[10px] border border-border items-center justify-center flex-row gap-1.5"
              >
                <Shield size={14} color="#6B7280" />
                <Text className="text-[13px] font-medium text-muted-foreground">{t.changePassword}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="bg-background rounded-2xl border border-border mb-4 overflow-hidden">
          <View className="flex-row items-center gap-2 px-5 pt-5 pb-2">
            <Globe size={16} color="#9CA3AF" />
            <Text className="text-[15px] font-semibold text-foreground">{t.language}</Text>
          </View>
          <View className="px-5 pb-4 gap-1.5">
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => setLanguage(opt.code)}
                className={`flex-row items-center gap-3 px-4 py-3 rounded-[10px] border ${language === opt.code ? 'border-green-600 bg-green-50 dark:bg-green-950' : 'border-border bg-background'}`}
              >
                <Text className="text-lg">{opt.flag}</Text>
                <Text className={`flex-1 text-sm font-medium ${language === opt.code ? 'text-green-600' : 'text-foreground'}`}>{opt.label}</Text>
                {language === opt.code ? <CheckCircle size={16} color="#16A34A" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-background rounded-2xl border border-border mb-4 overflow-hidden">
          <View className="flex-row items-center gap-2 px-5 pt-5 pb-2">
            <Sun size={16} color="#9CA3AF" />
            <Text className="text-[15px] font-semibold text-foreground">{t.theme}</Text>
          </View>
          <View className="px-5 pb-4 flex-row gap-2">
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                className={`flex-1 items-center gap-1.5 py-3.5 rounded-[10px] border ${theme === opt.value ? 'border-green-600 bg-green-50 dark:bg-green-950' : 'border-border bg-background'}`}
              >
                {opt.icon}
                <Text className={`text-[11px] font-medium ${theme === opt.value ? 'text-green-600' : 'text-muted-foreground'}`}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-background rounded-2xl border border-border mb-4 p-4 gap-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              {syncState === 'offline' ? <WifiOff size={16} color="#EF4444" /> : <Wifi size={16} color="#9CA3AF" />}
              <Text className="text-[13px] text-muted-foreground">{t.syncStatus}</Text>
            </View>
            {syncState === 'synced' && (
              <View className="flex-row items-center gap-1">
                <CheckCircle size={14} color="#10B981" />
                <Text className="text-[13px] font-medium text-emerald-500">{t.synced}</Text>
              </View>
            )}
            {syncState === 'syncing' && (
              <View className="flex-row items-center gap-1">
                <RefreshCw size={14} color="#F59E0B" />
                <Text className="text-[13px] font-medium text-amber-500">{t.syncing}</Text>
              </View>
            )}
            {syncState === 'offline' && (
              <View className="flex-row items-center gap-1">
                <WifiOff size={14} color="#EF4444" />
                <Text className="text-[13px] font-medium text-red-500">{t.offline}</Text>
              </View>
            )}
            {syncState === 'error' && (
              <TouchableOpacity onPress={forceSync} className="flex-row items-center gap-1">
                <RefreshCw size={14} color="#EF4444" />
                <Text className="text-[13px] font-medium text-red-500">{t.retry}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="h-px bg-accent" />
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Wheat size={16} color="#9CA3AF" />
              <Text className="text-[13px] text-muted-foreground">{t.appVersion}</Text>
            </View>
            <Text className="text-[13px] text-muted-foreground">{appVersion}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={signOut}
          className="h-12 rounded-xl border border-red-300 dark:border-red-700 items-center justify-center flex-row gap-2 mb-8 bg-red-50 dark:bg-red-950"
        >
          <LogOut size={18} color="#EF4444" />
          <Text className="text-sm font-semibold text-red-500">{t.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ChangePasswordSheet visible={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </SafeAreaView>
  )
}
