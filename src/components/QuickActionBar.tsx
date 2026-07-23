import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { useI18n } from '@/lib/i18n-context'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TrendingDown, TrendingUp, Flame, HandCoins, Plus } from 'lucide-react-native'

interface QuickActionBarProps {
  onAddExpense: () => void
  onAddIncome: () => void
  onAddGas: () => void
  onAddCooperative: () => void
  canWrite?: boolean
}

export function QuickActionBar({ onAddExpense, onAddIncome, onAddGas, onAddCooperative, canWrite = true }: QuickActionBarProps) {
  const { t } = useI18n()
  const { bottom } = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start()
  }, [open])

  if (!canWrite) return null

  const plusRotation = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] })

  const actions = [
    { key: 'coop', label: t.addCooperative, color: '#8B5CF6', icon: <HandCoins size={22} color="#FFFFFF" />, onPress: onAddCooperative },
    { key: 'gas', label: t.addGas, color: '#F97316', icon: <Flame size={22} color="#FFFFFF" />, onPress: onAddGas },
    { key: 'income', label: t.addIncome, color: '#10B981', icon: <TrendingUp size={22} color="#FFFFFF" />, onPress: onAddIncome },
    { key: 'expense', label: t.addExpense, color: '#EF4444', icon: <TrendingDown size={22} color="#FFFFFF" />, onPress: onAddExpense },
  ]

  return (
    <View pointerEvents="box-none" className="absolute bottom-20 right-5 items-end gap-3.5 z-50">
      {actions.map((action, i) => {
        const delay = (actions.length - 1 - i) * 0.04
        const opacity = anim.interpolate({
          inputRange: [0, delay, delay + 0.3, 1],
          outputRange: [0, 0, 1, 1],
        })
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })

        return (
          <Animated.View key={action.key} pointerEvents={open ? 'auto' : 'none'} className="flex-row items-center gap-3" style={{ opacity, transform: [{ translateY }] }}>
            <View className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-[20px] px-3.5 py-1.5" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.08)' }}>
              <Text className="text-[13px] font-semibold text-gray-900 dark:text-white">{action.label}</Text>
            </View>
            <TouchableOpacity className="w-[54px] h-[54px] rounded-[27px] items-center justify-center" style={{ backgroundColor: action.color, boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' }} onPress={() => { setOpen(false); action.onPress() }} activeOpacity={0.8}>
              {action.icon}
            </TouchableOpacity>
          </Animated.View>
        )
      })}

      <TouchableOpacity className="w-[60px] h-[60px] rounded-full bg-green-600 dark:bg-emerald-500 items-center justify-center" style={{ boxShadow: '0px 4px 16px rgba(22,163,74,0.35)' }} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
          <Plus size={28} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}
