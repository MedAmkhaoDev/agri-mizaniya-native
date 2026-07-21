import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { Wheat } from 'lucide-react-native'

type Tab = 'signin' | 'signup'

export default function AuthScreen() {
  const { t, language, setLanguage } = useI18n()
  const { signIn, signUp } = useAuth()

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await signIn(email, password)
      if (result.error) setError(result.error.message)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await signUp(email, password, fullName)
      if (result.error) setError(result.error.message)
      else setSuccess(t.accountCreated)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setError('')
    setSuccess('')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Wheat size={36} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827', letterSpacing: -0.5 }}>{t.appName}</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>{t.appTagline}</Text>
          </View>

          {/* Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, overflow: 'hidden' }}>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 0 }}>
              <TouchableOpacity
                onPress={() => switchTab('signin')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: tab === 'signin' ? '#16A34A' : '#F3F4F6' }}
              >
                <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: tab === 'signin' ? '#FFFFFF' : '#6B7280' }}>
                  {t.signIn}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchTab('signup')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: tab === 'signup' ? '#16A34A' : '#F3F4F6', marginLeft: 8 }}
              >
                <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: tab === 'signup' ? '#FFFFFF' : '#6B7280' }}>
                  {t.signUp}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={{ padding: 24 }}>
              {/* Error/Success messages */}
              {error ? (
                <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 10, marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, color: '#EF4444' }}>{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 8, padding: 10, marginBottom: 16 }}>
                  <Text style={{ fontSize: 13, color: '#16A34A' }}>{success}</Text>
                </View>
              ) : null}

              {tab === 'signin' ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.email}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="agriculteur@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 16 }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.password}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 20 }}
                  />
                  <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={loading}
                    style={{ height: 48, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{t.signIn}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.fullName}</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Ahmed Benali"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 16 }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.email}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 16 }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>{t.password}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 20 }}
                  />
                  <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={loading}
                    style={{ height: 48, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>{t.createAccount}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Language Switcher */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: language === lang ? '#16A34A' : '#F3F4F6' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: language === lang ? '#FFFFFF' : '#6B7280' }}>
                  {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🇲🇦 AR'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
