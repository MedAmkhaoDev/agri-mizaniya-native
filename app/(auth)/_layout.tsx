import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/lib/auth-context'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Redirect href="/(app)" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
