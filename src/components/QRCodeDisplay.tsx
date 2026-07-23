import React from 'react'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useColorScheme } from 'nativewind'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View className="items-center justify-center rounded-2xl bg-card p-4">
      <QRCode
        value={value}
        size={size}
        color={isDark ? '#111827' : '#000000'}
        backgroundColor="transparent"
      />
    </View>
  )
}
