import React from 'react'
import { Modal, View, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native'
import { useColorScheme } from 'nativewind'

interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheet, isDark && styles.sheetDark]}>
              <View style={[styles.handle, isDark && styles.handleDark]} />
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
    paddingBottom: 34,
  },
  sheetDark: {
    backgroundColor: '#111827',
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
  handleDark: {
    backgroundColor: '#4B5563',
  },
})
