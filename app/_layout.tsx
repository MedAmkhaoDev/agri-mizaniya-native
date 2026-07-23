import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { FarmProvider } from '@/lib/farm-context'
import { I18nProvider } from '@/lib/i18n-context'
import { ThemeProvider } from '@/lib/theme-context'
import { ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'
import { toastConfig } from '@/lib/toast-config'
import { initializeOneSignal } from '@/lib/onesignal'
import { View } from 'react-native'

function RootLayoutNav() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
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
        <Stack.Screen name="join" />
      </Stack>
  )
}

export default function RootLayout() {
  useEffect(() => {
    initializeOneSignal()
  }, [])

  return (
    <GestureHandlerRootView className="flex-1 bg-white dark:bg-gray-900">
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <FarmProvider>
                <RootLayoutNav />
                <Toast config={toastConfig} />
                <StatusBar style="dark" />
              </FarmProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
