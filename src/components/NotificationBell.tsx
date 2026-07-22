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
      style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
    >
      <Bell size={18} color="#6B7280" />
      {unreadCount > 0 && (
        <View style={{
          position: 'absolute',
          top: 2,
          right: 2,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#EF4444',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
