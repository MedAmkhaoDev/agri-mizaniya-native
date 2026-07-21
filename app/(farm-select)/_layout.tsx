import { Stack } from 'expo-router'

export default function FarmSelectLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
    </Stack>
  )
}
