import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationBell() {
  const router = useRouter()
  const { unreadCount } = useNotifications()

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      className="w-9 h-9 rounded-[10px] bg-gray-100 dark:bg-gray-700 items-center justify-center"
    >
      <Bell size={18} color="#6B7280" />
      {unreadCount > 0 && (
        <View className="absolute top-0.5 right-0.5 min-w-4 h-4 rounded-full bg-red-500 items-center justify-center px-1">
          <Text className="text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
