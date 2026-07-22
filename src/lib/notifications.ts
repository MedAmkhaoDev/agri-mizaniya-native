import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// ─── Types ───────────────────────────────────────────────

export type NotificationType =
  | 'INVITE_SENT'
  | 'INVITE_ACCEPTED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'ROLE_CHANGED'
  | 'PARCEL_CREATED'
  | 'PARCEL_UPDATED'
  | 'EXPENSE_CREATED'
  | 'INCOME_CREATED'
  | 'GAS_CREATED'
  | 'COOPERATIVE_CREATED'
  | 'FARM_SETTINGS_CHANGED'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  farmId: string
  farmName: string
  read: boolean
  createdAt: string
  data: {
    entityId?: string
    entityType?: string
    actionBy?: string
    actionByName?: string
  }
}

export interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  farmId: string
  farmName: string
  data?: {
    entityId?: string
    entityType?: string
    actionBy?: string
    actionByName?: string
  }
}

// ─── In-App Notifications ────────────────────────────────

export async function createInAppNotification(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      type: notification.type,
      title: notification.title,
      body: notification.body,
      farmId: notification.farmId,
      farmName: notification.farmName,
      read: false,
      createdAt: new Date().toISOString(),
      data: notification.data || {},
    })
  } catch (error) {
    console.error('Failed to create in-app notification:', error)
  }
}

export async function createBulkFarmNotifications(
  farmId: string,
  farmName: string,
  excludeUserId: string,
  notification: Omit<NotificationPayload, 'farmId' | 'farmName'>
): Promise<void> {
  try {
    const membersSnap = await getDocs(collection(db, 'farms', farmId, 'members'))
    const batch = writeBatch(db)
    let count = 0

    for (const memberDoc of membersSnap.docs) {
      if (memberDoc.id === excludeUserId) continue

      const notifRef = doc(collection(db, 'users', memberDoc.id, 'notifications'))
      batch.set(notifRef, {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        farmId,
        farmName,
        read: false,
        createdAt: new Date().toISOString(),
        data: notification.data || {},
      })
      count++

      if (count >= 450) {
        await batch.commit()
        break
      }
    }

    if (count > 0 && count < 450) {
      await batch.commit()
    }
  } catch (error) {
    console.error('Failed to create bulk farm notifications:', error)
  }
}

export async function createBulkFarmNotificationsAsync(
  farmId: string,
  farmName: string,
  excludeUserId: string,
  notification: Omit<NotificationPayload, 'farmId' | 'farmName'>
): Promise<void> {
  try {
    const membersSnap = await getDocs(collection(db, 'farms', farmId, 'members'))
    const notifications: Promise<void>[] = []

    for (const memberDoc of membersSnap.docs) {
      if (memberDoc.id === excludeUserId) continue

      notifications.push(
        createInAppNotification(memberDoc.id, {
          ...notification,
          farmId,
          farmName,
        })
      )
    }

    await Promise.all(notifications)
  } catch (error) {
    console.error('Failed to create bulk farm notifications:', error)
  }
}

export function listenNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as AppNotification[]
    callback(notifications)
  })
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      read: true,
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false)
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true })
    })

    await batch.commit()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false)
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return 0
  }
}

export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId))
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}

// ─── Notification Type Helpers ────────────────────────────

export const NOTIFICATION_ICONS: Record<NotificationType, { icon: string; color: string }> = {
  INVITE_SENT: { icon: 'mail', color: '#3B82F6' },
  INVITE_ACCEPTED: { icon: 'user-plus', color: '#10B981' },
  MEMBER_JOINED: { icon: 'user-plus', color: '#10B981' },
  MEMBER_LEFT: { icon: 'user-minus', color: '#EF4444' },
  ROLE_CHANGED: { icon: 'shield', color: '#F97316' },
  PARCEL_CREATED: { icon: 'map-pin', color: '#06B6D4' },
  PARCEL_UPDATED: { icon: 'map-pin', color: '#06B6D4' },
  EXPENSE_CREATED: { icon: 'trending-down', color: '#EF4444' },
  INCOME_CREATED: { icon: 'trending-up', color: '#10B981' },
  GAS_CREATED: { icon: 'flame', color: '#F97316' },
  COOPERATIVE_CREATED: { icon: 'hand-coins', color: '#8B5CF6' },
  FARM_SETTINGS_CHANGED: { icon: 'settings', color: '#6B7280' },
}

export const NOTIFICATION_ROUTES: Partial<Record<NotificationType, string>> = {
  INVITE_SENT: '/(farm-select)',
  INVITE_ACCEPTED: '/(farm-select)',
  MEMBER_JOINED: '/(app)/tools/members',
  MEMBER_LEFT: '/(app)/tools/members',
  ROLE_CHANGED: '/(app)/tools/members',
  PARCEL_CREATED: '/(app)/parcels',
  PARCEL_UPDATED: '/(app)/parcels',
  EXPENSE_CREATED: '/(app)/expenses',
  INCOME_CREATED: '/(app)/incomes',
  GAS_CREATED: '/(app)/tools/gas',
  COOPERATIVE_CREATED: '/(app)/tools/cooperative',
  FARM_SETTINGS_CHANGED: '/(app)/tools/farm-settings',
}
