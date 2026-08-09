import React from 'react'
import { Platform, View } from 'react-native'
import { WEB_MAX_WIDTH } from '@/lib/web-layout'

export function WebShell({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>

  return (
    <View className="flex-1 w-full items-center bg-[#F4F6F5] dark:bg-[#0D1410]">
      <View
        className="flex-1 w-full bg-background border-x border-border"
        style={{ maxWidth: WEB_MAX_WIDTH, boxShadow: '0 0 32px rgba(0, 0, 0, 0.08)' }}
      >
        {children}
      </View>
    </View>
  )
}
