import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useFarm } from '@/lib/farm-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { createFarm } from '@/lib/api'
import { ArrowLeft } from 'lucide-react-native'

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
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 }}
          >
            <ArrowLeft size={20} color="#374151" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{t.back}</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 }}>
            {t.createFarm}
          </Text>

          {/* Error */}
          {error ? (
            <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#EF4444' }}>{error}</Text>
            </View>
          ) : null}

          {/* Farm name */}
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
            {t.farmName}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.farmName}
            placeholderTextColor="#9CA3AF"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              paddingHorizontal: 16,
              fontSize: 15,
              color: '#111827',
              marginBottom: 16,
            }}
          />

          {/* Description */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
              {t.farmDescription}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
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
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 15,
              color: '#111827',
              marginBottom: 16,
              minHeight: 80,
            }}
          />

          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
              {t.farmLocation}
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
              ({t.optional})
            </Text>
          </View>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder={t.farmLocation}
            placeholderTextColor="#9CA3AF"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              paddingHorizontal: 16,
              fontSize: 15,
              color: '#111827',
              marginBottom: 32,
            }}
          />

          {/* Create button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !name.trim()}
            style={{
              height: 48,
              borderRadius: 10,
              backgroundColor: '#16A34A',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: loading || !name.trim() ? 0.5 : 1,
            }}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              {t.createFarm}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={loading}
            style={{
              height: 48,
              borderRadius: 10,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '600' }}>
              {t.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
