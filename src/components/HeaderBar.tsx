import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Settings } from 'lucide-react-native'

interface HeaderBarProps {
  title: string
  right?: React.ReactNode
}

export function HeaderBar({ title, right }: HeaderBarProps) {
  const router = useRouter()

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {right}
        <TouchableOpacity onPress={() => router.push('/(app)/tools/settings')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  )
}
