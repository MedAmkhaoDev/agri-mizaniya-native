import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Platform, Keyboard, ScrollView, TouchableOpacity, Text } from 'react-native'
import BottomSheetLib, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useColorScheme } from 'nativewind'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { X } from 'lucide-react-native'

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

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  if (Platform.OS === 'web') {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]} className="items-center justify-center bg-black/40 p-4">
        <View
          className="bg-background rounded-2xl border border-border w-full"
          style={{ maxWidth: 640, maxHeight: '90%', flexShrink: 1 }}
        >
          <View className="flex-row justify-end pt-3 pr-3">
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-accent items-center justify-center"
            >
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.webContent}
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    )
  }

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
  webContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
})
