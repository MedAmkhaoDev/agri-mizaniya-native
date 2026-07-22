import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { FarmProvider } from '@/lib/farm-context'
import { I18nProvider } from '@/lib/i18n-context'
import { ThemeProvider } from '@/lib/theme-context'
import { View, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'
import { toastConfig } from '@/lib/toast-config'
import { initializeOneSignal } from '@/lib/onesignal'

function RootLayoutNav() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(farm-select)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}

export default function RootLayout() {
  useEffect(() => {
    initializeOneSignal()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <FarmProvider>
              <RootLayoutNav />
              <Toast config={toastConfig} />
              <StatusBar style="auto" />
            </FarmProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  )
}
