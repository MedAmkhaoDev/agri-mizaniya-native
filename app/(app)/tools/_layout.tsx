import { Stack } from 'expo-router'
import { useI18n } from '@/lib/i18n-context'

export default function MoreLayout() {
  const { t } = useI18n()

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
    </Stack>
  )
}
