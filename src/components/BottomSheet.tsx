import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Platform, Keyboard } from 'react-native'
import BottomSheetLib, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useColorScheme } from 'nativewind'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { bottom } = useSafeAreaInsets()
  const ref = useRef<BottomSheetLib>(null)
    const snapPoints = useMemo(() => ['96%'], [])

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
      ref.current?.expand()
    } else {
      ref.current?.close()
    }
  }, [visible])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!visible) return null

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <BottomSheetLib
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
          width: 40,
        }}
        handleStyle={styles.handle}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.content}>
          {children}
        </BottomSheetView>
      </BottomSheetLib>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
})
