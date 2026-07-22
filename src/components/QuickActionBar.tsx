import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useI18n } from '@/lib/i18n-context'
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
    { key: 'income', label: t.addIncome, color: '#059669', icon: <TrendingUp size={22} color="#FFFFFF" />, onPress: onAddIncome },
    { key: 'expense', label: t.addExpense, color: '#EF4444', icon: <TrendingDown size={22} color="#FFFFFF" />, onPress: onAddExpense },
  ]

  return (
    <View style={styles.container}>
      {actions.map((action, i) => {
        const delay = (actions.length - 1 - i) * 0.04
        const opacity = anim.interpolate({
          inputRange: [0, delay, delay + 0.3, 1],
          outputRange: [0, 0, 1, 1],
        })
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })

        return (
          <Animated.View key={action.key} pointerEvents={open ? 'auto' : 'none'} style={[styles.childRow, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.label}>
              <Text style={styles.labelText}>{action.label}</Text>
            </View>
            <TouchableOpacity style={[styles.childFab, { backgroundColor: action.color }]} onPress={() => { setOpen(false); action.onPress() }} activeOpacity={0.8}>
              {action.icon}
            </TouchableOpacity>
          </Animated.View>
        )
      })}

      <TouchableOpacity style={styles.mainFab} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: plusRotation }] }}>
          <Plus size={28} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
    gap: 14,
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  childFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
})
