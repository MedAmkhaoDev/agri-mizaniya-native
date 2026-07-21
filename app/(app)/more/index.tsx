import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme-context'
import { useRouter } from 'expo-router'
import { updateProfile } from 'firebase/auth'
import type { Language } from '@/lib/i18n'
import Constants from 'expo-constants'
import {
  User, Globe, Sun, Moon, Monitor, LogOut, CheckCircle, Wifi, Wheat,
  Flame, HandCoins, BarChart3, ChevronRight,
} from 'lucide-react-native'

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [name, setName] = useState(profile?.fullName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 16, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{t.settings}</Text>

        {/* Navigation menu */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden' }}>
          {[
            { icon: <Flame size={18} color="#F97316" />, label: t.gasUsage, route: '/(app)/more/gas' },
            { icon: <HandCoins size={18} color="#8B5CF6" />, label: t.cooperative, route: '/(app)/more/cooperative' },
            { icon: <BarChart3 size={18} color="#3B82F6" />, label: t.reports, route: '/(app)/more/reports' },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 20, paddingVertical: 14,
                borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' }}>{item.label}</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <User size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t.profile}</Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827' }}>{profile?.fullName || 'Agriculteur'}</Text>
                <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{user?.email}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F3F4F6', alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>{profile?.role || 'farmer'}</Text>
                </View>
              </View>
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.fullName}</Text>
              <TextInput value={name} onChangeText={setName} style={{ height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827' }} />
            </View>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={{ height: 44, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: saving ? 0.6 : 1 }}>
              {saved ? <CheckCircle size={16} color="#FFFFFF" /> : null}
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{saved ? t.success : saving ? t.loading : t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <Globe size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t.language}</Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 6 }}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => setLanguage(opt.code)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
                  borderWidth: 1, borderColor: language === opt.code ? '#16A34A' : '#E5E7EB',
                  backgroundColor: language === opt.code ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 18 }}>{opt.flag}</Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: language === opt.code ? '#16A34A' : '#374151' }}>{opt.label}</Text>
                {language === opt.code ? <CheckCircle size={16} color="#16A34A" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <Sun size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>{t.theme}</Text>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setTheme(opt.value)}
                style={{
                  flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 10,
                  borderWidth: 1, borderColor: theme === opt.value ? '#16A34A' : '#E5E7EB',
                  backgroundColor: theme === opt.value ? '#F0FDF4' : '#FFFFFF',
                }}
              >
                {opt.icon}
                <Text style={{ fontSize: 11, fontWeight: '500', color: theme === opt.value ? '#16A34A' : '#6B7280' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Wifi size={16} color="#9CA3AF" />
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{t.syncStatus}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#10B981' }}>{t.synced}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Wheat size={16} color="#9CA3AF" />
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{t.appVersion}</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{appVersion}</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={signOut}
          style={{ height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 32, backgroundColor: '#FEF2F2' }}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{t.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
