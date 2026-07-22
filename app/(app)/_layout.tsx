import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { View, ActivityIndicator } from 'react-native'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const { t } = useI18n()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)" />

  const { currentFarmId, loading: farmLoading } = useFarm()
  if (farmLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }
  if (!currentFarmId) return <Redirect href="/(farm-select)" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" options={{ title: t.settings, headerShown: true, headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#1F2937', headerTitleStyle: { fontWeight: '600' } }} />
    </Stack>
  )
}
