import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Pressable, ActivityIndicator, RefreshControl, Share } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { HeaderBar } from '@/components/HeaderBar'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { BottomSheet } from '@/components/BottomSheet'
import { generateShareCode, createMemberAccount, removeMember, updateMemberRole } from '@/lib/api'
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection'
import { useSync } from '@/lib/sync-context'
import type { FarmMember, FarmRole } from '@/lib/types'
import { UserPlus, MoreVertical, X, AlertCircle, RefreshCw, Copy, Share2, Link as LinkIcon, UserPlus2 } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-toast-message'
import { cn } from '@/lib/utils'

export default function MembersScreen() {
  const { user, profile } = useAuth()
  const { currentFarmId, currentFarm, canManageMembers } = useFarm()
  const { t } = useI18n()
  const { isConnected } = useSync()

  const membersPath = currentFarmId ? `farms/${currentFarmId}/members` : ''

  const { data: members, loading, error } = useRealtimeCollection<FarmMember>(membersPath, {
    enabled: !!currentFarmId,
  })

  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [inviteTab, setInviteTab] = useState<'link' | 'create'>('link')
  const [selectedMember, setSelectedMember] = useState<FarmMember | null>(null)
  const [roleModalVisible, setRoleModalVisible] = useState(false)

  // Invite link state
  const [inviteCode, setInviteCode] = useState('')
  const [generating, setGenerating] = useState(false)

  // Create account state
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [creating, setCreating] = useState(false)

  const generateInviteLink = useCallback(async () => {
    if (!currentFarmId || !currentFarm || !user) return
    setGenerating(true)
    const { data, error } = await generateShareCode(currentFarmId, currentFarm.name, user.uid, 'viewer')
    setGenerating(false)
    if (error || !data) {
      Alert.alert(t.error, error?.message || t.failedToGenerate)
      return
    }
    setInviteCode(data.code)
  }, [currentFarmId, currentFarm, user, t])

  useEffect(() => {
    if (inviteModalVisible && inviteTab === 'link' && !inviteCode) {
      generateInviteLink()
    }
  }, [inviteModalVisible, inviteTab])

  const deepLink = inviteCode ? `agri-mizaniya://join?code=${inviteCode}` : ''

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode)
  }

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(deepLink)
  }

  const handleShare = async () => {
    if (!currentFarm || !inviteCode) return
    const message = t.inviteInstructions
      .replace('{farmName}', currentFarm.name)
      .replace('{link}', deepLink)
      .replace('{code}', inviteCode)
    setInviteModalVisible(false)
    setTimeout(() => Share.share({ message, url: deepLink }), 300)
  }

  const handleCreateAccount = async () => {
    if (!currentFarmId || !currentFarm || !user) {
      Toast.show({ type: 'error', text1: t.error, text2: 'Missing farm or user context' })
      return
    }
    if (!createEmail.trim() || !createName.trim()) {
      Toast.show({ type: 'error', text1: t.error, text2: 'Name and email are required' })
      return
    }
    if (!autoGenerate && !createPassword.trim()) {
      Toast.show({ type: 'error', text1: t.error, text2: 'Password is required' })
      return
    }

    setCreating(true)
    const { data, error } = await createMemberAccount(
      currentFarmId,
      currentFarm.name,
      createEmail.trim().toLowerCase(),
      createName.trim(),
      'viewer',
      user.uid,
      profile?.fullName || user.email || '',
      autoGenerate ? undefined : createPassword.trim()
    )
    setCreating(false)

    if (error) {
      console.log('createMemberAccount error:', error.message)
      setCreateName('')
      setCreateEmail('')
      setCreatePassword('')
      setInviteModalVisible(false)
      setTimeout(() => {
        Alert.alert(t.error, error.message || t.failedToCreateMember)
      }, 300)
      return
    }

    if (data) {
      Toast.show({ type: 'success', text1: t.success, text2: t.accountCreatedAndSent })

      const credsMessage = `${t.credentials}:\n\nEmail: ${data.email}\nPassword: ${data.password}\n\n${t.inviteInstructions
        .replace('{farmName}', currentFarm.name)
        .replace('{link}', deepLink)
        .replace('{code}', inviteCode)}`

      setCreateName('')
      setCreateEmail('')
      setCreatePassword('')
      setInviteModalVisible(false)

      setTimeout(() => {
        Alert.alert(t.success, t.accountCreatedAndSent, [
          { text: t.sendCredentials, onPress: async () => {
            await Share.share({ message: credsMessage, url: deepLink })
          }},
          { text: t.close, style: 'cancel' },
        ])
      }, 300)
    }
  }

  const handleRemoveMember = async (member: FarmMember) => {
    if (!currentFarmId || !user) return
    if (member.role === 'owner') {
      Alert.alert(t.error, t.cannotRemoveOwner)
      return
    }
    if (member.userId === user.uid) {
      Alert.alert(t.error, t.cannotRemoveSelf)
      return
    }
    Alert.alert(t.removeMember, t.removeMemberConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        const { error } = await removeMember(currentFarmId, member.userId)
        if (error) {
          Alert.alert(t.error, error.message || t.failedToRemove)
          return
        }
      }}
    ])
  }

  const handleChangeRole = async (member: FarmMember, newRole: FarmRole) => {
    if (!currentFarmId) return
    if (member.role === 'owner') {
      Alert.alert(t.error, t.cannotChangeOwnerRole)
      return
    }
    const { error } = await updateMemberRole(currentFarmId, member.userId, newRole)
    if (error) {
      Alert.alert(t.error, error.message || t.failedToChangeRole)
      return
    }
    setRoleModalVisible(false)
  }

  const roleColors: Record<string, string> = {
    owner: '#EF4444', manager: '#F59E0B', worker: '#3B82F6', viewer: '#6B7280'
  }

  const roleOptions: Array<{ value: FarmRole; label: string }> = [
    { value: 'manager', label: t.manager },
    { value: 'worker', label: t.worker },
    { value: 'viewer', label: t.viewer },
  ]

  const getRoleLabel = (role: FarmRole) => {
    switch (role) {
      case 'owner': return t.roleOwner
      case 'manager': return t.roleManager
      case 'worker': return t.roleWorker
      case 'viewer': return t.roleViewer
    }
  }

  if (!currentFarmId) return null

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <HeaderBar title={t.members} showBack showSettings={false} right={canManageMembers ? (
        <TouchableOpacity
          onPress={() => { setInviteModalVisible(true); generateInviteLink() }}
          disabled={!isConnected}
          className={cn("h-10 w-10 items-center justify-center rounded-[10px]", isConnected ? "bg-accent" : "bg-border opacity-50")}
        >
          <UserPlus size={20} color={isConnected ? "#374151" : "#9CA3AF"} />
        </TouchableOpacity>
      ) : undefined} />

      {loading ? (
        <ActivityIndicator size="large" color="#16A34A" className="mt-[60px]" />
      ) : error ? (
        <View className="items-center py-16 px-6">
          <View className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mb-4">
            <AlertCircle size={28} color="#EF4444" />
          </View>
          <Text className="text-[15px] font-semibold text-foreground mb-1">{t.failedToLoad}</Text>
          <Text className="text-[13px] text-muted-foreground mb-5 text-center">{error.message}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor="#6B7280" />}>
          {members.map((member) => (
            <View key={member.userId} className="mb-3 flex-row items-center rounded-xl border border-border bg-card p-4">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Text className="text-base font-bold text-foreground">
                  {(member.fullName || member.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-foreground">{member.fullName || t.unnamedMember}</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">{member.email}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: roleColors[member.role] + '15' }}>
                  <Text className="text-[11px] font-semibold" style={{ color: roleColors[member.role] }}>{getRoleLabel(member.role)}</Text>
                </View>
                {canManageMembers && member.role !== 'owner' && member.userId !== user?.uid && (
                  <TouchableOpacity onPress={() => { setSelectedMember(member); setRoleModalVisible(true) }} className="p-1">
                    <MoreVertical size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {members.length === 0 && (
            <View className="items-center pt-[60px]">
              <Text className="text-[15px] text-muted-foreground">{t.noMembersYet}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Invite Sheet */}
      <BottomSheet visible={inviteModalVisible} onClose={() => setInviteModalVisible(false)}>
        <View className="px-5 pt-1 pb-2.5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[17px] font-bold text-foreground">{t.inviteMember}</Text>
            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          {canManageMembers && (
            <View className="mb-4 flex-row rounded-xl bg-accent p-1">
              <TouchableOpacity
                onPress={() => setInviteTab('link')}
                className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5', inviteTab === 'link' ? 'bg-card shadow-sm' : '')}
              >
                <LinkIcon size={15} color={inviteTab === 'link' ? '#16A34A' : '#6B7280'} />
                <Text className={cn('text-[13px] font-semibold', inviteTab === 'link' ? 'text-green-600' : 'text-gray-500')}>{t.inviteTab}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInviteTab('create')}
                className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2.5', inviteTab === 'create' ? 'bg-card shadow-sm' : '')}
              >
                <UserPlus2 size={15} color={inviteTab === 'create' ? '#16A34A' : '#6B7280'} />
                <Text className={cn('text-[13px] font-semibold', inviteTab === 'create' ? 'text-green-600' : 'text-gray-500')}>{t.createTab}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isConnected && (
            <View className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3">
              <Text className="text-[13px] text-amber-700 dark:text-amber-300">{t.offlineUnavailable}</Text>
            </View>
          )}

          {inviteTab === 'link' ? (
            /* Link / QR Tab */
            <View>
              {generating ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : inviteCode ? (
                <>
                  <View className="items-center mb-3">
                    <QRCodeDisplay value={deepLink} size={140} />
                  </View>

                  <View className="mb-3 rounded-xl border border-border p-3">
                    <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.shareCode}</Text>
                    <Text className="text-lg font-mono font-bold text-foreground text-center tracking-wider">{inviteCode}</Text>
                  </View>

                  <View className="mb-3 rounded-xl border border-border p-3">
                    <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t.inviteLink}</Text>
                    <Text className="text-[13px] text-green-600 dark:text-green-400" numberOfLines={1}>{deepLink}</Text>
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    <TouchableOpacity onPress={handleCopyCode} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border py-3">
                      <Copy size={15} color="#6B7280" />
                      <Text className="text-[13px] font-semibold text-foreground">{t.shareCode}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCopyLink} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border py-3">
                      <LinkIcon size={15} color="#6B7280" />
                      <Text className="text-[13px] font-semibold text-foreground">{t.copyLink}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={handleShare} className="flex-row items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5">
                    <Share2 size={18} color="#FFFFFF" />
                    <Text className="text-[15px] font-bold text-white">{t.shareInviteLink}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View className="items-center py-8">
                  <Text className="text-[13px] text-muted-foreground mb-3">{t.failedToGenerate}</Text>
                  <TouchableOpacity onPress={generateInviteLink} className="flex-row items-center gap-2 px-5 py-2.5 rounded-[10px] bg-accent">
                    <RefreshCw size={16} color="#6B7280" />
                    <Text className="text-[13px] font-semibold text-foreground">{t.retry}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Create Account Tab */
            <View>
              <Text className="text-[13px] text-muted-foreground mb-4">{t.createAccountFor}</Text>

              <Text className="mb-1.5 text-[13px] font-semibold text-foreground">{t.memberName}</Text>
              <TextInput
                value={createName}
                onChangeText={setCreateName}
                placeholder={t.fullName}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                returnKeyType="next"
                className="mb-3 h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground"
              />

              <Text className="mb-1.5 text-[13px] font-semibold text-foreground">{t.memberEmail}</Text>
              <TextInput
                value={createEmail}
                onChangeText={setCreateEmail}
                placeholder={t.email}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                className="mb-3 h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground"
              />

              <TouchableOpacity
                onPress={() => setAutoGenerate(!autoGenerate)}
                className="flex-row items-center gap-2 mb-3"
              >
                <View className={cn('h-5 w-5 rounded-md border items-center justify-center', autoGenerate ? 'bg-green-600 border-green-600' : 'border-border')}>
                  {autoGenerate && <Text className="text-white text-[11px] font-bold">✓</Text>}
                </View>
                <Text className="text-[13px] text-foreground">{t.autoGeneratePassword}</Text>
              </TouchableOpacity>

              {!autoGenerate && (
                <>
                  <Text className="mb-1.5 text-[13px] font-semibold text-foreground">{t.newPassword}</Text>
                  <TextInput
                    value={createPassword}
                    onChangeText={setCreatePassword}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="done"
                    className="mb-4 h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground"
                  />
                </>
              )}

              <TouchableOpacity
                onPress={handleCreateAccount}
                disabled={!createEmail.trim() || !createName.trim() || creating || !isConnected}
                className={cn(
                  'h-14 rounded-xl items-center justify-center flex-row gap-2',
                  createEmail.trim() && createName.trim() && !creating && isConnected ? 'bg-green-600' : 'bg-border'
                )}
              >
                {creating ? <ActivityIndicator color="#FFF" size="small" /> : <UserPlus size={18} color="#FFFFFF" />}
                <Text className="text-white text-base font-bold">{t.createAccount}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BottomSheet>

      {/* Role Modal */}
      {roleModalVisible && (
        <Pressable className="absolute inset-0 z-50 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setRoleModalVisible(false)}>
          <Pressable onPress={(e: any) => e.stopPropagation()} className="w-4/5 rounded-2xl bg-background p-5">
            <Text className="mb-4 text-[17px] font-bold text-foreground">{t.changeRole}</Text>
            {roleOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => selectedMember && handleChangeRole(selectedMember, opt.value)}
                className={`mb-2 rounded-[10px] border px-4 py-3 ${selectedMember?.role === opt.value ? 'border-green-600' : 'border-border'}`}
              >
                <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
              </TouchableOpacity>
            ))}
            {selectedMember && (
              <TouchableOpacity
                onPress={() => { handleRemoveMember(selectedMember); setRoleModalVisible(false) }}
                className="mt-2 items-center rounded-[10px] bg-red-50 dark:bg-red-950 py-3"
              >
                <Text className="text-sm font-semibold text-red-500">{t.removeMember}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  )
}
