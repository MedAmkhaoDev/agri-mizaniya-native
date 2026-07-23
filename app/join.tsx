import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function JoinScreen() {
  const router = useRouter()
  const { code } = useLocalSearchParams<{ code?: string }>()

  useEffect(() => {
    if (code) {
      router.replace({ pathname: '/(farm-select)', params: { code } })
    } else {
      router.replace('/(farm-select)')
    }
  }, [code])

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#16A34A" />
    </View>
  )
}
