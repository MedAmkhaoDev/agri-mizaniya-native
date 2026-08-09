import { Alert, Platform, type AlertButton, type AlertOptions } from 'react-native'

export function alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
  if (Platform.OS === 'web') {
    const action = buttons?.find((b) => b.style === 'destructive' || b.style === 'default')
    const cancel = buttons?.find((b) => b.style === 'cancel')
    if (action && cancel) {
      if (window.confirm(`${title}${message ? `\n\n${message}` : ''}`)) {
        action.onPress?.()
      }
      return
    }
    if (action || buttons?.length === 1) {
      ;(action ?? buttons?.[0])?.onPress?.()
      return
    }
    window.alert(`${title}${message ? `\n\n${message}` : ''}`)
    return
  }
  Alert.alert(title, message, buttons, options)
}
