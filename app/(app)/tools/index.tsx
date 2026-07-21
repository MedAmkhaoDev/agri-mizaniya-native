import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useI18n } from '@/lib/i18n-context'
import { useRouter } from 'expo-router'
import { Flame, HandCoins, BarChart3, ChevronRight } from 'lucide-react-native'
import { HeaderBar } from '@/components/HeaderBar'

export default function MoreScreen() {
  const { t } = useI18n()
  const router = useRouter()

  const items = [
    { icon: <Flame size={20} color="#F97316" />, label: t.gasUsage, route: '/(app)/tools/gas', bg: '#FFF7ED' },
    { icon: <HandCoins size={20} color="#8B5CF6" />, label: t.cooperative, route: '/(app)/tools/cooperative', bg: '#F5F3FF' },
    { icon: <BarChart3 size={20} color="#3B82F6" />, label: t.reports, route: '/(app)/tools/reports', bg: '#EFF6FF' },
  ]

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ padding: 16, maxWidth: 480, alignSelf: 'center', width: '100%' }}>
        <HeaderBar title={t.more} />

        <View style={{ gap: 12, marginTop: 8 }}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
                paddingHorizontal: 20, paddingVertical: 18,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.label}</Text>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
