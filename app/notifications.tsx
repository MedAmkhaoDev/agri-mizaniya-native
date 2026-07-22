import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useNotifications } from '@/hooks/useNotifications'
import { useI18n } from '@/lib/i18n-context'
import { NOTIFICATION_ICONS, NOTIFICATION_ROUTES, type AppNotification } from '@/lib/notifications'
import { HeaderBar } from '@/components/HeaderBar'
import {
  Mail, UserPlus, UserMinus, Shield, MapPin, TrendingDown,
  TrendingUp, Flame, HandCoins, Settings, CheckCheck, Inbox,
} from 'lucide-react-native'

const ICONS: Record<string, any> = {
  mail: Mail,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  shield: Shield,
  'map-pin': MapPin,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  flame: Flame,
  'hand-coins': HandCoins,
  settings: Settings,
}

function getRelativeTime(dateStr: string, t: any): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t.justNow || 'à l\'instant'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}j`
  return date.toLocaleDateString()
}

function NotificationItem({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const iconConfig = NOTIFICATION_ICONS[notification.type]
  const iconName = iconConfig?.icon || 'bell'
  const iconColor = iconConfig?.color || '#6B7280'
  const IconComponent = ICONS[iconName] || Mail

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: notification.read ? '#FFFFFF' : '#F0FDF4',
      }}
    >
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${iconColor}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 2,
      }}>
        <IconComponent size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: notification.read ? '500' : '700', color: '#111827' }} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
          {notification.farmName} · {getRelativeTime(notification.createdAt, { justNow: 'à l\'instant' })}
        </Text>
      </View>
      {!notification.read && (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginTop: 6, marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()

  const handlePress = async (notification: AppNotification) => {
    await markAsRead(notification.id)
    const route = NOTIFICATION_ROUTES[notification.type]
    if (route) {
      router.push(route as any)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      <HeaderBar
        title={t.notifications}
        showBack
        showSettings={false}
        showNotifications={false}
        right={
          notifications.some((n) => !n.read) ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' }}
            >
              <CheckCheck size={14} color="#6B7280" />
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>{t.markAllRead}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Inbox size={28} color="#D1D5DB" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' }}>{t.noNotifications}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  )
}
