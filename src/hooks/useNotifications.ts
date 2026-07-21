import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  listenNotifications,
  markAsRead as markAsReadFn,
  markAllAsRead as markAllAsReadFn,
  type AppNotification,
} from '@/lib/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = listenNotifications(user.uid, (notifs) => {
      setNotifications(notifs)
      setLoading(false)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [user?.uid])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return
      await markAsReadFn(user.uid, notificationId)
    },
    [user?.uid]
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    await markAllAsReadFn(user.uid)
  }, [user?.uid])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  }
}
