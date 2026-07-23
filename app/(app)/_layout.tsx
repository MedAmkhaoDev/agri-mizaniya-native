import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { useTheme } from '@/lib/theme-context'
import { View, ActivityIndicator } from 'react-native'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)" />

  const { currentFarmId, loading: farmLoading } = useFarm()
  if (farmLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }
  if (!currentFarmId) return <Redirect href="/(farm-select)" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ title: t.settings, headerShown: true, headerStyle: { backgroundColor: isDark ? '#1a2e1a' : '#FFFFFF' }, headerTintColor: isDark ? '#e5e7eb' : '#1F2937', headerTitleStyle: { fontWeight: '600' } }} />
    </Stack>
  )
}
