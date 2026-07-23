import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useFarm } from '@/lib/farm-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { createFarm } from '@/lib/api'
import { ArrowLeft } from 'lucide-react-native'
import { cn } from '@/lib/utils'

export default function CreateFarmScreen() {
  const router = useRouter()
  const { reloadFarms } = useFarm()
  const { user, refreshProfile } = useAuth()
  const { t } = useI18n()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    if (!user) return

    setLoading(true)
    setError('')
    try {
      const result = await createFarm(user.uid, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        await refreshProfile()
        await reloadFarms()
        router.replace('/(app)')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-14 pb-12">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-6"
          >
            <ArrowLeft size={20} color="#374151" />
            <Text className="text-sm font-medium text-foreground">{t.back}</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground mb-6">
            {t.createFarm}
          </Text>

          {/* Error */}
          {error ? (
            <View className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <Text className="text-[13px] text-red-500 dark:text-red-400">{error}</Text>
            </View>
          ) : null}

          {/* Farm name */}
          <Text className="text-[13px] font-medium text-foreground mb-1.5">
            {t.farmName}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.farmName}
            placeholderTextColor="#9CA3AF"
            className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-4"
          />

          {/* Description */}
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Text className="text-[13px] font-medium text-foreground">
              {t.farmDescription}
            </Text>
            <Text className="text-xs text-muted-foreground">
              ({t.optional})
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t.farmDescription}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-border rounded-[10px] px-4 py-3 text-[15px] text-foreground bg-card mb-4"
            style={{ minHeight: 80 }}
          />

          {/* Location */}
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Text className="text-[13px] font-medium text-foreground">
              {t.farmLocation}
            </Text>
            <Text className="text-xs text-muted-foreground">
              ({t.optional})
            </Text>
          </View>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder={t.farmLocation}
            placeholderTextColor="#9CA3AF"
            className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground bg-card mb-8"
          />

          {/* Create button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !name.trim()}
            className={cn(
              'h-12 rounded-lg bg-green-600 items-center justify-center flex-row gap-2',
              (loading || !name.trim()) && 'opacity-50'
            )}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
            <Text className="text-white text-base font-semibold">
              {t.createFarm}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            className={cn(
              'h-12 rounded-lg bg-accent items-center justify-center mt-3',
              loading && 'opacity-50'
            )}
          >
            <Text className="text-muted-foreground text-base font-semibold">
              {t.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
