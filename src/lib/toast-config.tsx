import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/lib/theme-context'

interface ToastProps {
  text1?: string
  text2?: string
  onPress?: () => void
  type?: string
}

function ToastContent({ text1, text2, type }: ToastProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const colors = {
    success: { bg: '#16A34A', text: '#fff' },
    error: { bg: '#DC2626', text: '#fff' },
    info: { bg: '#2563EB', text: '#fff' },
  }

  const color = colors[type as keyof typeof colors] || colors.info

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color.bg },
        isDark && styles.containerDark,
      ]}
    >
      {text1 ? <Text style={[styles.text1, { color: color.text }]}>{text1}</Text> : null}
      {text2 ? <Text style={[styles.text2, { color: color.text, opacity: 0.9 }]}>{text2}</Text> : null}
    </View>
  )
}

export const toastConfig = {
  success: (props: ToastProps) => <ToastContent {...props} type="success" />,
  error: (props: ToastProps) => <ToastContent {...props} type="error" />,
  info: (props: ToastProps) => <ToastContent {...props} type="info" />,
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 50,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.25)',
  },
  containerDark: {
    boxShadow: '0px 2px 12px rgba(0,0,0,0.4)',
  },
  text1: {
    fontSize: 15,
    fontWeight: '600',
  },
  text2: {
    fontSize: 13,
    marginTop: 4,
  },
})
