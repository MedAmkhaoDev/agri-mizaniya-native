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
      className={`flex-row items-start p-3.5 border-b border-gray-100 dark:border-gray-800 ${notification.read ? 'bg-background' : 'bg-green-50 dark:bg-green-950'}`}
    >
      <View
        className="w-9 h-9 rounded-[10px] items-center justify-center mr-3 mt-0.5"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <IconComponent size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-[13px] ${notification.read ? 'font-medium' : 'font-bold'} text-foreground`} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-[10px] text-muted-foreground mt-1">
          {notification.farmName} · {getRelativeTime(notification.createdAt, { justNow: 'à l\'instant' })}
        </Text>
      </View>
      {!notification.read && (
        <View className="w-2 h-2 rounded-full bg-green-600 mt-1.5 ml-2" />
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <HeaderBar
        title={t.notifications}
        showBack
        showSettings={false}
        showNotifications={false}
        right={
          notifications.some((n) => !n.read) ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent"
            >
              <CheckCheck size={14} color="#6B7280" />
              <Text className="text-[11px] font-medium text-muted-foreground">{t.markAllRead}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center mb-4">
            <Inbox size={28} color="#D1D5DB" />
          </View>
          <Text className="text-[15px] font-semibold text-foreground text-center">{t.noNotifications}</Text>
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
