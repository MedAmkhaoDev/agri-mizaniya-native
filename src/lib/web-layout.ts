import { Platform, useWindowDimensions } from 'react-native'

export const isWeb = Platform.OS === 'web'

export const WEB_MAX_WIDTH = 2000

export function useIsDesktop(breakpoint = 1024) {
  const { width } = useWindowDimensions()
  return Platform.OS === 'web' && width >= breakpoint
}
