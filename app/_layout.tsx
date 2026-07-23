import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { FarmProvider } from '@/lib/farm-context'
import { I18nProvider } from '@/lib/i18n-context'
import { ThemeProvider, useTheme } from '@/lib/theme-context'
import { SyncProvider, useSync } from '@/lib/sync-context'
import { ActivityIndicator, Text } from 'react-native'
import Toast from 'react-native-toast-message'
import { toastConfig } from '@/lib/toast-config'
import { initializeOneSignal } from '@/lib/onesignal'
import { View } from 'react-native'

function RootLayoutNav() {
  const { loading } = useAuth()
  const { resolvedTheme } = useTheme()
  const { isConnected } = useSync()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  return (
      <>
        {!isConnected && (
          <View className="bg-amber-500 py-1.5 items-center">
            <Text className="text-white text-xs font-semibold">You're offline — changes will sync automatically</Text>
          </View>
        )}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(farm-select)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="join" />
        </Stack>
      </>
  )
}

function ThemedStatusBar() {
  const { resolvedTheme } = useTheme()
  return <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
}

export default function RootLayout() {
  useEffect(() => {
    initializeOneSignal()
  }, [])

  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <SyncProvider>
                <FarmProvider>
                  <RootLayoutNav />
                  <Toast config={toastConfig} />
                  <ThemedStatusBar />
                </FarmProvider>
              </SyncProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
