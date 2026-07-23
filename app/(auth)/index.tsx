import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { Wheat } from 'lucide-react-native'
import { cn } from '@/lib/utils'
import Toast from 'react-native-toast-message'
import { BottomSheet } from '@/components/BottomSheet'

type Tab = 'signin' | 'signup'

export default function AuthScreen() {
  const { t, language, setLanguage } = useI18n()
  const { signIn, signUp, signInWithGoogle, sendResetPasswordEmail } = useAuth()

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showForgotSheet, setShowForgotSheet] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

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

  const handleGoogleSignIn = async () => {
    setError('')
    setSuccess('')
    setGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.error) setError(result.error.message)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setGoogleLoading(false)
    }
  }

  const switchTab = (newTab: Tab) => {
    setTab(newTab)
    setError('')
    setSuccess('')
  }

  const handleForgotPassword = () => {
    setResetEmail(email)
    setShowForgotSheet(true)
  }

  const handleSendReset = async () => {
    if (!resetEmail.trim()) return
    setResetLoading(true)
    const { error } = await sendResetPasswordEmail(resetEmail.trim())
    setResetLoading(false)
    if (error) {
      Toast.show({ type: 'error', text1: t.resetPasswordError })
    } else {
      Toast.show({ type: 'success', text1: t.resetPasswordSent })
      setShowForgotSheet(false)
      setResetEmail('')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-green-600 items-center justify-center mb-4">
              <Wheat size={36} color="#FFFFFF" />
            </View>
            <Text className="text-[28px] font-bold text-foreground tracking-tight">{t.appName}</Text>
            <Text className="text-sm text-muted-foreground mt-1">{t.appTagline}</Text>
          </View>

          {/* Card */}
          <View className="bg-card rounded-2xl border border-border" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 4px 12px rgba(0,0,0,0.04)' }}>
            {/* Tabs */}
            <View className="flex-row p-4 pb-0">
              <TouchableOpacity
                onPress={() => switchTab('signin')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg items-center',
                  tab === 'signin' ? 'bg-green-600' : 'bg-accent'
                )}
              >
                <Text className={cn(
                  'text-sm font-semibold text-center',
                  tab === 'signin' ? 'text-white' : 'text-muted-foreground'
                )}>
                  {t.signIn}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchTab('signup')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg items-center ml-2',
                  tab === 'signup' ? 'bg-green-600' : 'bg-accent'
                )}
              >
                <Text className={cn(
                  'text-sm font-semibold text-center',
                  tab === 'signup' ? 'text-white' : 'text-muted-foreground'
                )}>
                  {t.signUp}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View className="p-6">
              {/* Error/Success messages */}
              {error ? (
                <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-2.5 mb-4">
                  <Text className="text-[13px] text-red-500 dark:text-red-400">{error}</Text>
                </View>
              ) : null}
              {success ? (
                <View className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-2.5 mb-4">
                  <Text className="text-[13px] text-green-600 dark:text-green-400">{success}</Text>
                </View>
              ) : null}

              {tab === 'signin' ? (
                <>
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.email}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="agriculteur@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-4"
                  />
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.password}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-2"
                  />
                  <TouchableOpacity onPress={handleForgotPassword} className="mb-5">
                    <Text className="text-[13px] text-green-600 font-medium">{t.forgotPassword}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={loading}
                    className={cn(
                      'h-12 rounded-lg bg-green-600 items-center justify-center flex-row gap-2',
                      loading && 'opacity-60'
                    )}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
                    <Text className="text-white text-base font-semibold">{t.signIn}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.fullName}</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Ahmed Benali"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-4"
                  />
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.email}</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="agriculteur@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-4"
                  />
                  <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.password}</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-5"
                  />
                  <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={loading}
                    className={cn(
                      'h-12 rounded-lg bg-green-600 items-center justify-center flex-row gap-2',
                      loading && 'opacity-60'
                    )}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
                    <Text className="text-white text-base font-semibold">{t.createAccount}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-border" />
                <Text className="mx-3 text-[13px] text-muted-foreground">{t.or}</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* Google Sign-In */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                className={cn(
                  'h-12 rounded-lg border border-border bg-card items-center justify-center flex-row gap-2.5',
                  googleLoading && 'opacity-60'
                )}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <Text className="text-lg font-bold text-[#4285F4]">G</Text>
                )}
                <Text className="text-foreground text-[15px] font-medium">{t.continueWithGoogle}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language Switcher */}
          <View className="flex-row justify-center gap-2 mt-8">
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  language === lang ? 'bg-green-600' : 'bg-accent'
                )}
              >
                <Text className={cn(
                  'text-[13px] font-semibold',
                  language === lang ? 'text-white' : 'text-muted-foreground'
                )}>
                  {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🇲🇦 AR'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomSheet visible={showForgotSheet} onClose={() => setShowForgotSheet(false)}>
        <View className="p-5">
          <Text className="text-lg font-bold text-foreground mb-2">{t.forgotPassword}</Text>
          <Text className="text-[13px] text-muted-foreground mb-4">{t.enterEmailForReset}</Text>
          <BottomSheetTextInput
            value={resetEmail}
            onChangeText={setResetEmail}
            placeholder="agriculteur@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-4"
          />
          <TouchableOpacity
            onPress={handleSendReset}
            disabled={resetLoading || !resetEmail.trim()}
            className={cn(
              'h-12 rounded-lg bg-green-600 items-center justify-center flex-row gap-2',
              (resetLoading || !resetEmail.trim()) && 'opacity-60'
            )}
          >
            {resetLoading ? <ActivityIndicator color="#FFFFFF" /> : null}
            <Text className="text-white text-sm font-semibold">{resetLoading ? t.loading : t.send}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowForgotSheet(false)}
            className="h-11 items-center justify-center mt-2"
          >
            <Text className="text-sm font-medium text-muted-foreground">{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  )
}
