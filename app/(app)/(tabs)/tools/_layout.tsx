import { Stack, useNavigation } from 'expo-router'
import { useI18n } from '@/lib/i18n-context'
import { useEffect } from 'react'

export default function MoreLayout() {
  const { t } = useI18n()
  const navigation = useNavigation()

  useEffect(() => {
    const parent = navigation.getParent()
    if (!parent) return

    const unsubscribe = parent.addListener('focus', () => {
      try {
        const state = navigation.getState()
        if (state && state.index > 0) {
          navigation.navigate('index')
        }
      } catch {}
    })

    return unsubscribe
  }, [navigation])

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1F2937',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="gas" options={{ headerShown: false }} />
      <Stack.Screen name="cooperative" options={{ headerShown: false }} />
      <Stack.Screen name="reports" options={{ title: t.reports }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      <Stack.Screen name="farm-settings" options={{ headerShown: false }} />
      <Stack.Screen name="activity" options={{ headerShown: false }} />
    </Stack>
  )
}
