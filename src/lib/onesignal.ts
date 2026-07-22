import { OneSignal, LogLevel, type NotificationClickEvent, type NotificationWillDisplayEvent } from 'react-native-onesignal'
import { Alert } from 'react-native'

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || ''

let dialogShown = false

function isRegistered(subscriptionId: string | null | undefined): boolean {
  return !!subscriptionId && !subscriptionId.startsWith('local-')
}

function maybeShowIntegrationCompleteDialog(subscriptionId: string | null | undefined): void {
  if (isRegistered(subscriptionId) && !dialogShown) {
    dialogShown = true
    showIntegrationCompleteDialog()
  }
}

function showIntegrationCompleteDialog(): void {
  Alert.alert(
    'Your OneSignal SDK integration is complete!',
    'You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.',
    [
      {
        text: 'Got it',
        onPress: () => {
          OneSignal.Notifications.requestPermission(true)
        },
      },
    ],
    { cancelable: false }
  )
}

export function initializeOneSignal(): void {
  OneSignal.Debug.setLogLevel(LogLevel.Verbose)
  OneSignal.initialize(ONESIGNAL_APP_ID)

  OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
    maybeShowIntegrationCompleteDialog(subscription.current.id)
  })

  OneSignal.User.pushSubscription.getIdAsync().then(maybeShowIntegrationCompleteDialog)
}

export function onesignalLogin(userId: string): void {
  OneSignal.login(userId)
}

export function onesignalLogout(): void {
  OneSignal.logout()
}

export function addNotificationClickListener(
  handler: (event: NotificationClickEvent) => void
): void {
  OneSignal.Notifications.addEventListener('click', handler)
}

export function removeNotificationClickListener(
  handler: (event: NotificationClickEvent) => void
): void {
  OneSignal.Notifications.removeEventListener('click', handler)
}

export function addForegroundNotificationHandler(
  handler: (event: NotificationWillDisplayEvent) => void
): void {
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', handler)
}

export function removeForegroundNotificationHandler(
  handler: (event: NotificationWillDisplayEvent) => void
): void {
  OneSignal.Notifications.removeEventListener('foregroundWillDisplay', handler)
}
