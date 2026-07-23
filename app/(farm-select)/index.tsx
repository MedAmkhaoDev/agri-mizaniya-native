import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useFarm } from '@/lib/farm-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { joinByShareCode } from '@/lib/api'
import { QRScanner } from '@/components/QRScanner'
import { Wheat, Plus, Users, ArrowRight, X, ScanLine } from 'lucide-react-native'
import type { FarmRole } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function FarmSelectScreen() {
  const router = useRouter()
  const { code: deepLinkCode } = useLocalSearchParams<{ code?: string }>()
  const { userFarms, switchFarm, loading: farmLoading } = useFarm()
  const { user } = useAuth()
  const { t } = useI18n()

  const [roles, setRoles] = useState<Record<string, FarmRole>>({})
  const [loading, setLoading] = useState(true)
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [scannerVisible, setScannerVisible] = useState(false)

  useEffect(() => {
    if (!user) return
    if (farmLoading) return

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

  // Handle deep link via expo-router search params: agri-mizaniya://join?code=XXXXXX
  useEffect(() => {
    if (deepLinkCode) {
      setJoinCode(deepLinkCode.toUpperCase())
      setJoinModalVisible(true)
    }
  }, [deepLinkCode])

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

  const handleQRScanned = (code: string) => {
    setScannerVisible(false)
    const cleaned = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    setJoinCode(cleaned)
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
      <SafeAreaView className="flex-1">
      <View className="flex-1 bg-white dark:bg-gray-900 px-6 pt-16">
        <View className="items-center mb-10">
          <View className="w-14 h-14 rounded-[14px] bg-green-600 items-center justify-center mb-4">
            <Wheat size={30} color="#FFFFFF" />
          </View>
          <View className="w-40 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-2" />
          <View className="w-28 h-3.5 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </View>
        <Text className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t.farms}</Text>
        {[1, 2, 3].map(i => (
          <View key={i} className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse mb-3" />
        ))}
      </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
    <ScrollView className="flex-1 bg-white dark:bg-gray-900" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 px-6 pt-16 pb-12">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-14 h-14 rounded-[14px] bg-green-600 items-center justify-center mb-4">
            <Wheat size={30} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {t.welcome}, {user?.displayName || user?.email?.split('@')[0] || ''}
          </Text>
          <Text className="text-[13px] text-gray-400 dark:text-gray-500">{t.appTagline}</Text>
        </View>

        {userFarms.length > 0 ? (
          <>
            {/* Farm list */}
            <Text className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {t.farms}
            </Text>
            {userFarms.map((farm) => {
              const role = roles[farm.id]
              return (
                <TouchableOpacity
                  key={farm.id}
                  onPress={() => handleSelectFarm(farm.id)}
                  activeOpacity={0.7}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-3 flex-row items-center justify-between"
                  style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 4px 12px rgba(0,0,0,0.04)' }}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <Text className="text-base font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                        {farm.name}
                      </Text>
                      {role ? (
                        <View style={{ backgroundColor: roleBadgeColor(role) + '18' }} className="px-2 py-0.5 rounded-md">
                          <Text style={{ color: roleBadgeColor(role) }} className="text-[11px] font-semibold">
                            {roleLabel(role)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Users size={13} color="#9CA3AF" />
                      <Text className="text-[13px] text-gray-400 dark:text-gray-500">
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
              className="w-full h-11 rounded-[10px] border border-gray-300 dark:border-gray-600 border-dashed items-center justify-center mt-1"
            >
              <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {t.joinExistingFarm}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Empty state */
          <View className="items-center pt-8">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              {t.noFarms}
            </Text>
            <Text className="text-[13px] text-gray-400 dark:text-gray-500 mb-8 text-center px-4">
              {t.createFirstFarm}
            </Text>

            {/* Create farm button */}
            <TouchableOpacity
              onPress={() => router.push('/(farm-select)/create')}
              activeOpacity={0.7}
              className="w-full h-[52px] rounded-xl bg-green-600 items-center justify-center flex-row gap-2 mb-3"
            >
              <Plus size={20} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-semibold">
                {t.createFirstFarm}
              </Text>
            </TouchableOpacity>

            {/* Join farm button */}
            <TouchableOpacity
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.7}
              className="w-full h-[52px] rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center flex-row gap-2"
            >
              <Text className="text-gray-700 dark:text-gray-300 text-[15px] font-semibold">
                {t.joinExistingFarm}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Join Farm Modal */}
      <Modal visible={joinModalVisible} animationType="slide" transparent>
        <Pressable className="flex-1 bg-black/30 justify-end" onPress={() => setJoinModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable onPress={(e: any) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-t-[20px] p-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.joinFarm}</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-[13px] text-gray-500 dark:text-gray-400 mb-3">
              {t.orEnterCodeManually}
            </Text>

            {/* QR scan button */}
            <TouchableOpacity
              onPress={() => setScannerVisible(true)}
              className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 border-dashed py-3"
            >
              <ScanLine size={18} color="#16A34A" />
              <Text className="text-[14px] font-semibold text-green-600">{t.scanQRToJoin}</Text>
            </TouchableOpacity>

            <TextInput
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              placeholder="XXXXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              className="border border-gray-200 dark:border-gray-600 rounded-[10px] px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 mb-4"
              style={{ fontFamily: 'monospace', letterSpacing: 2 }}
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={!joinCode.trim() || joining}
              className={cn(
                'rounded-[10px] py-3.5 items-center flex-row justify-center gap-2',
                joinCode.trim() && !joining ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              {joining && <ActivityIndicator color="#FFF" size="small" />}
              <Text className="text-[15px] font-bold text-white">{t.joinFarm}</Text>
            </TouchableOpacity>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* QR Scanner */}
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleQRScanned}
      />
    </ScrollView>
    </SafeAreaView>
  )
}
