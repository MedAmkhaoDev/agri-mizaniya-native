import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { X, ScanLine } from 'lucide-react-native'
import { useI18n } from '@/lib/i18n-context'

interface QRScannerProps {
  visible: boolean
  onClose: () => void
  onScanned: (code: string) => void
}

export function QRScanner({ visible, onClose, onScanned }: QRScannerProps) {
  const { t } = useI18n()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const scannedRef = useRef(false)

  useEffect(() => {
    if (visible) {
      setScanned(false)
      scannedRef.current = false
    }
  }, [visible])

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current) return
    scannedRef.current = true
    setScanned(true)
    onScanned(data)
  }

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.scanQRToJoin}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>{t.loading}</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    )
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.scanQRToJoin}</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.permissionBox}>
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.scannerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.scanQRToJoin}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.scanFrame}>
              <ScanLine size={40} color="#16A34A" style={{ alignSelf: 'center' }} />
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>{t.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    margin: 20,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
    flex: 1,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  scanFrame: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
})
