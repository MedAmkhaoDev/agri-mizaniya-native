import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { HeaderBar } from '@/components/HeaderBar'
import { getActivityLog } from '@/lib/api'
import { ActivityLogEntry } from '@/lib/types'
import { Clock, ArrowUpRight, ArrowDownRight, Fuel, Users, Wheat } from 'lucide-react-native'

const entityIcons: Record<string, React.ReactNode> = {
  expense: <ArrowUpRight size={14} color="#EF4444" />,
  income: <ArrowDownRight size={14} color="#16A34A" />,
  parcel: <Wheat size={14} color="#3B82F6" />,
  gas: <Fuel size={14} color="#F59E0B" />,
  cooperative: <Users size={14} color="#8B5CF6" />,
}

const entityColors: Record<string, string> = {
  expense: '#FEE2E2',
  income: '#DCFCE7',
  parcel: '#DBEAFE',
  gas: '#FEF3C7',
  cooperative: '#EDE9FE',
}

function formatTimestamp(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function ActivityScreen() {
  const { currentFarmId } = useFarm()
  const { t } = useI18n()

  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    if (!currentFarmId) return
    try {
      const result = await getActivityLog(currentFarmId, 50)
      setLogs(result.data)
    } catch (e) {
      console.error('Failed to load activity log:', e)
    } finally {
      setLoading(false)
    }
  }, [currentFarmId])

  useEffect(() => { loadLogs() }, [loadLogs])

  if (!currentFarmId) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      <HeaderBar title={t.activityLog} showBack showSettings={false} showFarmSwitcher={false} />
      {loading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {logs.map((log) => (
            <View key={log.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: entityColors[log.entityType] || '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 }}>
                {entityIcons[log.entityType] || <Clock size={14} color="#6B7280" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>{log.userName || t.someone}</Text>
                  {' '}{log.action === 'create' ? t.added : log.action === 'update' ? t.updated : t.deleted}{' '}
                  <Text style={{ fontWeight: '600' }}>{log.entityName || log.entityType}</Text>
                </Text>
                {log.details ? (
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{JSON.stringify(log.details)}</Text>
                ) : null}
                <Text style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>{formatTimestamp(log.createdAt)}</Text>
              </View>
            </View>
          ))}
          {logs.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Clock size={40} color="#D1D5DB" />
              <Text style={{ fontSize: 15, color: '#9CA3AF', marginTop: 12 }}>{t.noActivityYet}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
