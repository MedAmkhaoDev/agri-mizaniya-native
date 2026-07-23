import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useFarm } from '@/lib/farm-context'
import { useI18n } from '@/lib/i18n-context'
import { getFarmMembers } from '@/lib/api'
import { BottomSheet } from '@/components/BottomSheet'
import { cn } from '@/lib/utils'
import type { ExpenseFilters, FarmMember } from '@/lib/types'
import { X, Check } from 'lucide-react-native'

interface FilterSheetProps {
  visible: boolean
  onClose: () => void
  filters: ExpenseFilters
  onApply: (filters: ExpenseFilters) => void
}

const DATE_PRESETS = ['7d', '30d', 'month'] as const

function getDatePreset(key: string): { dateFrom: string; dateTo: string } {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  if (key === '7d') {
    const from = new Date(today)
    from.setDate(today.getDate() - 7)
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to }
  }
  if (key === '30d') {
    const from = new Date(today)
    from.setDate(today.getDate() - 30)
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to }
  }
  if (key === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to }
  }
  return { dateFrom: '', dateTo: '' }
}

function getPresetLabel(key: string, t: any): string {
  if (key === '7d') return t.last7Days
  if (key === '30d') return t.last30Days
  if (key === 'month') return t.thisMonth
  return key
}

export function FilterSheet({ visible, onClose, filters, onApply }: FilterSheetProps) {
  const { currentFarmId } = useFarm()
  const { t } = useI18n()
  const [members, setMembers] = useState<FarmMember[]>([])
  const [draft, setDraft] = useState<ExpenseFilters>(filters)

  useEffect(() => {
    if (visible) {
      setDraft(filters)
      if (currentFarmId) {
        getFarmMembers(currentFarmId).then((res) => setMembers(res.data))
      }
    }
  }, [visible, currentFarmId])

  const activePreset = (() => {
    if (!draft.dateFrom || !draft.dateTo) return null
    for (const key of DATE_PRESETS) {
      const p = getDatePreset(key)
      if (p.dateFrom === draft.dateFrom && p.dateTo === draft.dateTo) return key
    }
    return null
  })()

  const activeCount = [
    draft.createdBy,
    draft.dateFrom,
    draft.amountMin != null ? 'min' : null,
    draft.amountMax != null ? 'max' : null,
    draft.typeId,
  ].filter(Boolean).length

  const clearAll = () => setDraft({ parcelId: draft.parcelId })

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-5 pt-1 pb-2">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.filters}</Text>
          <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Date range */}
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">{t.dateRange}</Text>
        <View className="flex-row gap-2 mb-6">
          {DATE_PRESETS.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                const p = getDatePreset(key)
                setDraft((d) => ({ ...d, dateFrom: p.dateFrom, dateTo: p.dateTo }))
              }}
              className={cn(
                'px-4 h-9 items-center justify-center rounded-[10px]',
                activePreset === key ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <Text className={cn('text-xs font-semibold', activePreset === key ? 'text-white' : 'text-gray-600 dark:text-gray-300')}>
                {getPresetLabel(key, t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Created by — only show if multi-user farm */}
        {members.length > 1 && (
          <>
            <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">{t.createdBy}</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {members.map((m) => (
                <TouchableOpacity
                  key={m.userId}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      createdBy: d.createdBy === m.userId ? undefined : m.userId,
                    }))
                  }
                  className={cn(
                    'flex-row items-center gap-1.5 px-3.5 h-9 justify-center rounded-[10px]',
                    draft.createdBy === m.userId ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {draft.createdBy === m.userId && <Check size={14} color="#FFFFFF" />}
                  <Text className={cn('text-xs font-semibold', draft.createdBy === m.userId ? 'text-white' : 'text-gray-600 dark:text-gray-300')}>
                    {m.fullName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Amount range */}
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider">{t.amountRange}</Text>
        <View className="flex-row gap-3 mb-6">
          <TextInput
            value={draft.amountMin?.toString() ?? ''}
            onChangeText={(v) => setDraft((d) => ({ ...d, amountMin: v ? Number(v) : undefined }))}
            placeholder={t.min}
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="flex-1 h-11 px-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[15px] text-gray-900 dark:text-gray-100"
          />
          <TextInput
            value={draft.amountMax?.toString() ?? ''}
            onChangeText={(v) => setDraft((d) => ({ ...d, amountMax: v ? Number(v) : undefined }))}
            placeholder={t.max}
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="flex-1 h-11 px-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[15px] text-gray-900 dark:text-gray-100"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={clearAll}
            disabled={activeCount === 0}
            className={cn('flex-1 h-11 items-center justify-center rounded-[10px] bg-gray-100 dark:bg-gray-800', activeCount === 0 && 'opacity-50')}
          >
            <Text className="text-sm font-semibold text-gray-600 dark:text-gray-300">{t.clearAll}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              onApply(draft)
              onClose()
            }}
            className="flex-1 h-11 items-center justify-center rounded-[10px] bg-green-600 dark:bg-green-500"
          >
            <Text className="text-sm font-semibold text-white">
              {t.apply}{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
}
