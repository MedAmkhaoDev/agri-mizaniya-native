import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { HeaderBar } from '@/components/HeaderBar'
import { getFarmMembers, sendInvite, removeMember, updateMemberRole } from '@/lib/api'
import type { FarmMember, FarmRole } from '@/lib/types'
import { UserPlus, MoreVertical, X } from 'lucide-react-native'

export default function MembersScreen() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { currentFarmId, currentFarm, canManageMembers } = useFarm()
  const { t } = useI18n()

  const [members, setMembers] = useState<FarmMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<FarmRole>('viewer')
  const [selectedMember, setSelectedMember] = useState<FarmMember | null>(null)
  const [roleModalVisible, setRoleModalVisible] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!currentFarmId) return
    const { data, error } = await getFarmMembers(currentFarmId)
    if (!error) setMembers(data)
    setLoading(false)
  }, [currentFarmId])

  useEffect(() => { loadMembers() }, [loadMembers])

  const handleInvite = async () => {
    if (!currentFarmId || !currentFarm || !user || !inviteEmail.trim()) return
    const { error } = await sendInvite(
      currentFarmId,
      currentFarm.name,
      user.uid,
      profile?.fullName || user.email || '',
      inviteEmail.trim().toLowerCase(),
      inviteRole
    )
    if (error) {
      Alert.alert(t.error, error.message || t.failedToInvite)
      return
    }
    setInviteModalVisible(false)
    setInviteEmail('')
    setInviteRole('viewer')
    Alert.alert(t.success, t.memberInvited)
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
        setMembers(members.filter(m => m.userId !== member.userId))
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
    setMembers(members.map(m => m.userId === member.userId ? { ...m, role: newRole } : m))
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      <HeaderBar title={t.members} showBack showSettings={false} right={canManageMembers ? (
        <TouchableOpacity onPress={() => setInviteModalVisible(true)} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <UserPlus size={20} color="#374151" />
        </TouchableOpacity>
      ) : undefined} />

      {loading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {members.map((member) => (
            <View key={member.userId} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151' }}>
                  {(member.fullName || member.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{member.fullName || t.unnamedMember}</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{member.email}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: roleColors[member.role] + '15' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: roleColors[member.role] }}>{getRoleLabel(member.role)}</Text>
                </View>
                {canManageMembers && member.role !== 'owner' && member.userId !== user?.uid && (
                  <TouchableOpacity onPress={() => { setSelectedMember(member); setRoleModalVisible(true) }} style={{ padding: 4 }}>
                    <MoreVertical size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {members.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 15, color: '#9CA3AF' }}>{t.noMembersYet}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={() => setInviteModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable onPress={(e: any) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{t.inviteMember}</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder={t.email}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              style={{ height: 48, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, fontSize: 15, color: '#111827', marginBottom: 16 }}
            />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>{t.role}</Text>
            {roleOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setInviteRole(opt.value)}
                style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: inviteRole === opt.value ? '#16A34A' : '#E5E7EB', backgroundColor: inviteRole === opt.value ? '#F0FDF4' : '#FFFFFF', marginBottom: 8 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: inviteRole === opt.value ? '#16A34A' : '#374151' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={handleInvite}
              disabled={!inviteEmail.trim()}
              style={{ backgroundColor: inviteEmail.trim() ? '#16A34A' : '#D1D5DB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{t.sendInvitation}</Text>
            </TouchableOpacity>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Role Change Modal */}
      <Modal visible={roleModalVisible} transparent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setRoleModalVisible(false)}>
          <Pressable onPress={(e: any) => e.stopPropagation()} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '80%' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{t.changeRole}</Text>
            {roleOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => selectedMember && handleChangeRole(selectedMember, opt.value)}
                style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: selectedMember?.role === opt.value ? '#16A34A' : '#E5E7EB', marginBottom: 8 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            {selectedMember && (
              <TouchableOpacity
                onPress={() => { handleRemoveMember(selectedMember); setRoleModalVisible(false) }}
                style={{ paddingVertical: 12, borderRadius: 10, backgroundColor: '#FEE2E2', alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>{t.removeMember}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
