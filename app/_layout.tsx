import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { FarmProvider } from '@/lib/farm-context'
import { I18nProvider } from '@/lib/i18n-context'
import { ThemeProvider } from '@/lib/theme-context'
import { View, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'

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
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <FarmProvider>
            <RootLayoutNav />
            <Toast />
            <StatusBar style="auto" />
          </FarmProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
