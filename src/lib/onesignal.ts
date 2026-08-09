import { Platform } from 'react-native'
import type { NotificationClickEvent, NotificationWillDisplayEvent } from 'react-native-onesignal'

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || ''

const isWeb = Platform.OS === 'web'

function nativeOneSignal(): any {
  // react-native-onesignal throws at import time on web (TurboModuleRegistry),
  // so it must never be evaluated there — lazy-require only on native.
  return require('react-native-onesignal')
}

export function initializeOneSignal(): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal, LogLevel } = nativeOneSignal()
  OneSignal.Debug.setLogLevel(LogLevel.Verbose)
  OneSignal.initialize(ONESIGNAL_APP_ID)
  OneSignal.User.pushSubscription.getIdAsync()
}

export function onesignalLogin(userId: string): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.login(userId)
}

export function onesignalLogout(): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.logout()
}

export function addNotificationClickListener(
  handler: (event: NotificationClickEvent) => void
): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.Notifications.addEventListener('click', handler)
}

export function removeNotificationClickListener(
  handler: (event: NotificationClickEvent) => void
): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.Notifications.removeEventListener('click', handler)
}

export function addForegroundNotificationHandler(
  handler: (event: NotificationWillDisplayEvent) => void
): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', handler)
}

export function removeForegroundNotificationHandler(
  handler: (event: NotificationWillDisplayEvent) => void
): void {
  if (isWeb || !ONESIGNAL_APP_ID) return
  const { OneSignal } = nativeOneSignal()
  OneSignal.Notifications.removeEventListener('foregroundWillDisplay', handler)
}
