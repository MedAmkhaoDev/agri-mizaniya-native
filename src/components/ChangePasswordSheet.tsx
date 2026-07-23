import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n-context'
import { BottomSheet } from '@/components/BottomSheet'
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react-native'
import Toast from 'react-native-toast-message'

interface ChangePasswordSheetProps {
  visible: boolean
  onClose: () => void
}

export default function ChangePasswordSheet({ visible, onClose }: ChangePasswordSheetProps) {
  const { changePassword, user } = useAuth()
  const { t } = useI18n()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com')

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return

    if (newPassword.length < 8) {
      Toast.show({ type: 'error', text1: t.passwordTooShort })
      return
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: t.passwordMismatch })
      return
    }

    setLoading(true)
    try {
      const { error } = await changePassword(currentPassword, newPassword)
      if (error) {
        const msg = error.message?.includes('wrong-password') || error.message?.includes('invalid-credential')
          ? t.wrongPassword
          : t.passwordChangeError
        Toast.show({ type: 'error', text1: msg })
      } else {
        Toast.show({ type: 'success', text1: t.passwordChanged })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        onClose()
      }
    } catch {
      Toast.show({ type: 'error', text1: t.passwordChangeError })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View className="p-5">
        <View className="flex-row items-center gap-2 mb-5">
          <Lock size={20} color="#16A34A" />
          <Text className="text-lg font-bold text-foreground">{t.changePassword}</Text>
        </View>

        {isGoogleUser ? (
          <View className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 mb-4">
            <Text className="text-[13px] text-blue-700 dark:text-blue-300">{t.googlePasswordInfo}</Text>
          </View>
        ) : (
          <>
            <View className="mb-3">
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.currentPassword}</Text>
              <View className="flex-row items-center h-12 border border-border rounded-[10px] px-4">
                <BottomSheetTextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  className="flex-1 text-[15px] text-foreground"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.newPassword}</Text>
              <View className="flex-row items-center h-12 border border-border rounded-[10px] px-4">
                <BottomSheetTextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  className="flex-1 text-[15px] text-foreground"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-[13px] font-medium text-foreground mb-1.5">{t.confirmNewPassword}</Text>
              <BottomSheetTextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showNew}
                className="h-12 border border-border rounded-[10px] px-4 text-[15px] text-foreground"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className={`h-12 rounded-[10px] bg-green-600 items-center justify-center flex-row gap-1.5 ${loading || !currentPassword || !newPassword || !confirmPassword ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <CheckCircle size={16} color="#FFFFFF" />
              )}
              <Text className="text-white text-sm font-semibold">{loading ? t.loading : t.changePassword}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={handleClose} className="h-11 rounded-[10px] items-center justify-center mt-3">
          <Text className="text-sm font-medium text-muted-foreground">{t.cancel}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  )
}
