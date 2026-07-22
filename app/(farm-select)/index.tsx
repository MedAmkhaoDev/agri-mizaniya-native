import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useFarm } from '@/lib/farm-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { joinByShareCode } from '@/lib/api'
import { Wheat, Plus, Users, ArrowRight, X } from 'lucide-react-native'
import type { FarmRole } from '@/lib/types'

export default function FarmSelectScreen() {
  const router = useRouter()
  const { userFarms, switchFarm, loading: farmLoading } = useFarm()
  const { user } = useAuth()
  const { t } = useI18n()

  const [roles, setRoles] = useState<Record<string, FarmRole>>({})
  const [loading, setLoading] = useState(true)
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (farmLoading || !user) return
    if (userFarms.length === 0) {
      setLoading(false)
      return
    }

    const loadRoles = async () => {
      const rolesMap: Record<string, FarmRole> = {}
      await Promise.all(
        userFarms.map(async (farm) => {
          try {
            const snap = await getDoc(doc(db, 'farms', farm.id, 'members', user.uid))
            if (snap.exists()) {
              rolesMap[farm.id] = snap.data().role as FarmRole
            }
          } catch {}
        })
      )
      setRoles(rolesMap)
      setLoading(false)
    }

    loadRoles()
  }, [userFarms, farmLoading, user])

  const handleSelectFarm = async (farmId: string) => {
    await switchFarm(farmId)
    router.replace('/(app)')
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return
    setJoining(true)
    const { error, farmId } = await joinByShareCode(
      joinCode.trim().toUpperCase(),
      user.uid,
      user.displayName || user.email || '',
      user.email || ''
    )
    setJoining(false)
    if (error) {
      Alert.alert(t.error, error.message)
      return
    }
    setJoinModalVisible(false)
    setJoinCode('')
    if (farmId) {
      await switchFarm(farmId)
      router.replace('/(app)')
    }
  }

  const roleLabel = (role: FarmRole) => {
    switch (role) {
      case 'owner': return t.roleOwner
      case 'manager': return t.roleManager
      case 'worker': return t.roleWorker
      case 'viewer': return t.roleViewer
    }
  }

  const roleBadgeColor = (role: FarmRole) => {
    switch (role) {
      case 'owner': return '#16A34A'
      case 'manager': return '#3B82F6'
      case 'worker': return '#F59E0B'
      case 'viewer': return '#9CA3AF'
    }
  }

  if (farmLoading || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 12, fontSize: 14, color: '#6B7280' }}>{t.loading}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 48 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Wheat size={30} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
            {t.welcome}, {user?.displayName || user?.email?.split('@')[0] || ''}
          </Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{t.appTagline}</Text>
        </View>

        {userFarms.length > 0 ? (
          <>
            {/* Farm list */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              {t.farms}
            </Text>
            {userFarms.map((farm) => {
              const role = roles[farm.id]
              return (
                <TouchableOpacity
                  key={farm.id}
                  onPress={() => handleSelectFarm(farm.id)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }} numberOfLines={1}>
                        {farm.name}
                      </Text>
                      {role ? (
                        <View style={{ backgroundColor: roleBadgeColor(role) + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: roleBadgeColor(role) }}>
                            {roleLabel(role)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Users size={13} color="#9CA3AF" />
                      <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
                        {farm.memberCount} {t.memberCount}
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={18} color="#D1D5DB" />
                </TouchableOpacity>
              )
            })}
            {/* Join another farm */}
            <TouchableOpacity
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.7}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>
                {t.joinExistingFarm}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Empty state */
          <View style={{ alignItems: 'center', paddingTop: 32 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              {t.noFarms}
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32, textAlign: 'center', paddingHorizontal: 16 }}>
              {t.createFirstFarm}
            </Text>

            {/* Create farm button */}
            <TouchableOpacity
              onPress={() => router.push('/(farm-select)/create')}
              activeOpacity={0.7}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 12,
                backgroundColor: '#16A34A',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                {t.createFirstFarm}
              </Text>
            </TouchableOpacity>

            {/* Join farm button */}
            <TouchableOpacity
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.7}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 12,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Text style={{ color: '#374151', fontSize: 15, fontWeight: '600' }}>
                {t.joinExistingFarm}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Join Farm Modal */}
      <Modal visible={joinModalVisible} animationType="slide" transparent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={() => setJoinModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable onPress={(e: any) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.joinFarm}</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              {t.enterShareCode || 'Enter a share code to join an existing farm'}
            </Text>
            <TextInput
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              placeholder="XXXX-XXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 16 }}
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={!joinCode.trim() || joining}
              style={{ backgroundColor: joinCode.trim() && !joining ? '#16A34A' : '#D1D5DB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              {joining && <ActivityIndicator color="#FFF" size="small" />}
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{t.joinFarm}</Text>
            </TouchableOpacity>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}
