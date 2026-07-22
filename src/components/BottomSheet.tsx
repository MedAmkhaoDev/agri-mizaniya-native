import React, { useEffect, useState } from 'react'
import { Modal, View, TouchableWithoutFeedback, ScrollView, StyleSheet, Platform, Keyboard, KeyboardEvent, Dimensions } from 'react-native'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [safeBottom, setSafeBottom] = useState(34)

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height)
    })
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0)
      Keyboard.dismiss()
    }
  }, [visible])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[
              styles.sheet,
              {
                paddingBottom: safeBottom,
                marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
              },
            ]}>
              <View style={styles.handle} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
})
