import { Stack, useNavigation } from 'expo-router'
import { useI18n } from '@/lib/i18n-context'
import { useLayoutEffect } from 'react'

export default function MoreLayout() {
  const { t } = useI18n()
  const navigation = useNavigation()

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    if (!parent) return

    const unsubscribe = parent.addListener('focus', () => {
      const state = navigation.getState()
      if (state && state.index > 0) {
        navigation.navigate('index')
      }
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
      <Stack.Screen name="gas" options={{ title: t.gasUsage }} />
      <Stack.Screen name="cooperative" options={{ title: t.cooperative }} />
      <Stack.Screen name="reports" options={{ title: t.reports }} />
      <Stack.Screen name="settings" options={{ title: t.settings }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      <Stack.Screen name="farm-settings" options={{ headerShown: false }} />
      <Stack.Screen name="activity" options={{ headerShown: false }} />
    </Stack>
  )
}
