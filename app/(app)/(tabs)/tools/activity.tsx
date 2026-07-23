import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { HeaderBar } from '@/components/HeaderBar'
import { getActivityLog } from '@/lib/api'
import { ActivityLogEntry } from '@/lib/types'
import { Clock, ArrowUpRight, ArrowDownRight, Fuel, Users, Wheat, AlertCircle, RefreshCw } from 'lucide-react-native'

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
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (!currentFarmId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const result = await getActivityLog(currentFarmId, 50)
      if (result.error) {
        setError(t.failedToLoad)
        return
      }
      setLogs(result.data)
    } catch {
      setError(t.failedToLoad)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentFarmId, t.failedToLoad])

  useEffect(() => { loadLogs() }, [loadLogs])

  if (!currentFarmId) return null

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <HeaderBar title={t.activityLog} showBack showSettings={false} showFarmSwitcher={false} />
      {loading ? (
        <ActivityIndicator size="large" color="#16A34A" className="mt-[60px]" />
      ) : error ? (
        <View className="items-center py-16 px-6">
          <View className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center mb-4">
            <AlertCircle size={28} color="#EF4444" />
          </View>
          <Text className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.failedToLoad}</Text>
          <Text className="text-[13px] text-gray-400 dark:text-gray-500 mb-5 text-center">{error}</Text>
          <TouchableOpacity onPress={() => loadLogs()} className="flex-row items-center gap-2 px-5 py-2.5 rounded-[10px] bg-gray-100 dark:bg-gray-800">
            <RefreshCw size={16} color="#6B7280" />
            <Text className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLogs(true)} tintColor="#6B7280" />}>
          {logs.map((log) => (
            <View key={log.id} className="mb-4 flex-row">
              <View className="mr-3 mt-0.5 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: entityColors[log.entityType] || '#F3F4F6' }}>
                {entityIcons[log.entityType] || <Clock size={14} color="#6B7280" />}
              </View>
              <View className="flex-1">
                <Text className="text-[13px] leading-[18px] text-gray-700 dark:text-gray-300">
                  <Text className="font-semibold">{log.userName || t.someone}</Text>
                  {' '}{log.action === 'create' ? t.added : log.action === 'update' ? t.updated : t.deleted}{' '}
                  <Text className="font-semibold">{log.entityName || log.entityType}</Text>
                </Text>
                {log.details ? (
                  <Text className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{JSON.stringify(log.details)}</Text>
                ) : null}
                <Text className="mt-1 text-[11px] text-gray-300 dark:text-gray-600">{formatTimestamp(log.createdAt)}</Text>
              </View>
            </View>
          ))}
          {logs.length === 0 && (
            <View className="items-center pt-[60px]">
              <Clock size={40} color="#D1D5DB" />
              <Text className="mt-3 text-[15px] text-gray-400 dark:text-gray-500">{t.noActivityYet}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
