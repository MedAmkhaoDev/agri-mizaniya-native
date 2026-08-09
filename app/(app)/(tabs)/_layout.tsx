import { Tabs } from 'expo-router'
import { useI18n } from '@/lib/i18n-context'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform, useWindowDimensions } from 'react-native'
import { useColorScheme } from 'nativewind'
import { LayoutDashboard, MapPin, TrendingDown, TrendingUp, MoreHorizontal } from 'lucide-react-native'
import { WEB_MAX_WIDTH } from '@/lib/web-layout'

export default function AppTabs() {
  const { t } = useI18n()
  const { bottom } = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isSidebar = Platform.OS === 'web' && width >= 1024

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isSidebar ? 'left' : 'bottom',
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarActiveBackgroundColor: isSidebar ? (isDark ? '#133F24' : '#DCFCE7') : undefined,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A2E1A' : '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderRightColor: '#E5E7EB',
          borderTopWidth: isSidebar ? 0 : 1,
          borderRightWidth: isSidebar ? 1 : 0,
          paddingBottom: Math.max(bottom, 8),
          paddingTop: 8,
          height: isSidebar ? undefined : 64 + bottom,
          ...Platform.select({
            web: {
              maxWidth: isSidebar ? undefined : WEB_MAX_WIDTH,
              alignSelf: isSidebar ? 'stretch' : 'center',
              width: isSidebar ? undefined : '100%',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: isSidebar ? 6 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: t.parcels,
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t.expenses,
          tabBarIcon: ({ color, size }) => <TrendingDown size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: t.incomes,
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: t.more,
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  )
}
