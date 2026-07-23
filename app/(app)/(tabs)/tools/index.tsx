import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useI18n } from '@/lib/i18n-context'
import { useRouter } from 'expo-router'
import { Flame, HandCoins, BarChart3, ChevronRight, Users, Wheat, Clock } from 'lucide-react-native'
import { HeaderBar } from '@/components/HeaderBar'
import { useFarm } from '@/lib/farm-context'

export default function MoreScreen() {
  const { t } = useI18n()
  const router = useRouter()
  const { canManageMembers, canManageFarmSettings } = useFarm()

  const items = [
    { icon: <Flame size={20} color="#F97316" />, label: t.gasUsage, route: '/(app)/tools/gas', bg: 'bg-orange-50 dark:bg-orange-950' },
    { icon: <HandCoins size={20} color="#8B5CF6" />, label: t.cooperative, route: '/(app)/tools/cooperative', bg: 'bg-violet-50 dark:bg-violet-950' },
    { icon: <Clock size={20} color="#8B5CF6" />, label: t.activityLog, route: '/(app)/tools/activity', bg: 'bg-violet-100 dark:bg-violet-900' },
    { icon: <BarChart3 size={20} color="#3B82F6" />, label: t.reports, route: '/(app)/tools/reports', bg: 'bg-blue-50 dark:bg-blue-950' },
    { icon: <Users size={20} color="#F59E0B" />, label: t.members, route: '/(app)/tools/members', bg: 'bg-amber-50 dark:bg-amber-950', show: canManageMembers },
    { icon: <Wheat size={20} color="#EF4444" />, label: t.farmSettings, route: '/(app)/tools/farm-settings', bg: 'bg-red-50 dark:bg-red-950', show: canManageFarmSettings },
  ]

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView className="flex-1 bg-white dark:bg-gray-900" contentContainerStyle={{ padding: 16, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <HeaderBar title={t.more} />

        <View className="mt-2 gap-3">
          {items.filter(item => (item as any).show !== false).map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              className="flex-row items-center gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4"
            >
              <View className={`h-10 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                {item.icon}
              </View>
              <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">{item.label}</Text>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
