import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useI18n } from '@/lib/i18n-context'
import { useRouter } from 'expo-router'
import { Flame, HandCoins, BarChart3, ChevronRight, Users, Wheat, Clock } from 'lucide-react-native'
import { HeaderBar } from '@/components/HeaderBar'
import { useFarm } from '@/lib/farm-context'
import { useIsDesktop } from '@/lib/web-layout'
import { cn } from '@/lib/utils'

export default function MoreScreen() {
  const { t } = useI18n()
  const router = useRouter()
  const { canManageMembers, canManageFarmSettings } = useFarm()
  const isDesktop = useIsDesktop()

  const items = [
    { icon: <Flame size={20} color="#F97316" />, label: t.gasUsage, route: '/(app)/tools/gas', bg: 'bg-orange-50 dark:bg-orange-950' },
    { icon: <HandCoins size={20} color="#8B5CF6" />, label: t.cooperative, route: '/(app)/tools/cooperative', bg: 'bg-violet-50 dark:bg-violet-950' },
    { icon: <Clock size={20} color="#8B5CF6" />, label: t.activityLog, route: '/(app)/tools/activity', bg: 'bg-violet-100 dark:bg-violet-900' },
    { icon: <BarChart3 size={20} color="#3B82F6" />, label: t.reports, route: '/(app)/tools/reports', bg: 'bg-blue-50 dark:bg-blue-950' },
    { icon: <Users size={20} color="#F59E0B" />, label: t.members, route: '/(app)/tools/members', bg: 'bg-amber-50 dark:bg-amber-950', show: canManageMembers },
    { icon: <Wheat size={20} color="#EF4444" />, label: t.farmSettings, route: '/(app)/tools/farm-settings', bg: 'bg-red-50 dark:bg-red-950', show: canManageFarmSettings },
  ]

  const visibleItems = items.filter((item) => (item as any).show !== false)

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName={isDesktop ? "px-8 py-6" : "px-4 py-4"}
      >
        <HeaderBar title={t.more} />

        {isDesktop ? (
          <View className="mt-4 flex-row flex-wrap gap-4">
            {visibleItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                className="w-[31.5%] flex-row items-center gap-4 rounded-xl border border-border bg-card px-5 py-5"
              >
                <View className={cn("h-11 w-11 items-center justify-center rounded-xl shrink-0", item.bg)}>
                  {item.icon}
                </View>
                <Text className="flex-1 text-[15px] font-semibold text-foreground">{item.label}</Text>
                <ChevronRight size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="mt-2 gap-3">
            {visibleItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                className="flex-row items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <View className={`h-10 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                  {item.icon}
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">{item.label}</Text>
                <ChevronRight size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
