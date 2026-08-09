import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { View, ActivityIndicator } from 'react-native'

export default function AppLayout() {
  const { user, loading } = useAuth()

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
    </Stack>
  )
}
