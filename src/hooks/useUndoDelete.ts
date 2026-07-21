import { useCallback, useRef } from 'react'
import Toast from 'react-native-toast-message'

interface UndoState<T> {
  item: T
  timer: ReturnType<typeof setTimeout>
  restore: () => Promise<void>
}

export function useUndoDelete<T extends { id: string }>(
  deleteFn: (id: string) => Promise<{ error: any }>,
  onRestore: (item: T) => Promise<void>,
  reload: () => void,
  t: { deleted: string; undo: string; error: string },
) {
  const undoRef = useRef<UndoState<T> | null>(null)

  const deleteWithUndo = useCallback(
    async (item: T) => {
      if (undoRef.current) {
        clearTimeout(undoRef.current.timer)
        await undoRef.current.restore()
        undoRef.current = null
      }

      reload()

      const timer = setTimeout(async () => {
        const { error } = await deleteFn(item.id)
        if (error) {
          Toast.show({ type: 'error', text1: t.error })
          reload()
        }
        undoRef.current = null
      }, 5000)

      undoRef.current = {
        item,
        timer,
        restore: async () => {
          clearTimeout(timer)
          await onRestore(item)
          reload()
        },
      }

      Toast.show({
        type: 'info',
        text1: t.deleted,
        visibilityTime: 5000,
        onPress: async () => {
          if (undoRef.current) {
            await undoRef.current.restore()
            undoRef.current = null
          }
        },
      })
    },
    [deleteFn, onRestore, reload, t.deleted, t.error, t.undo],
  )

  return { deleteWithUndo }
}
