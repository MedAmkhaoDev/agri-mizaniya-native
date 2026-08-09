import { View, Text } from 'react-native'
import { cn } from '@/lib/utils'

export interface TableColumn {
  label: string
  flex?: number
  align?: 'left' | 'right' | 'center'
}

interface DesktopTableProps<T> {
  columns: TableColumn[]
  rows: T[]
  renderCell: (row: T, columnIndex: number) => React.ReactNode
  rowKey: (row: T) => string
  emptyText?: string
  actionColumnIndex?: number
}

export function DesktopTable<T>({ columns, rows, renderCell, rowKey, emptyText, actionColumnIndex }: DesktopTableProps<T>) {
  return (
    <View className="rounded-xl border border-border bg-background overflow-hidden">
      <View className="flex-row items-center bg-accent px-5 py-2.5">
        {columns.map((c, i) => (
          <Text
            key={i}
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
              c.align === 'right' && 'text-right'
            )}
            style={{ flex: c.flex ?? 1 }}
          >
            {c.label}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <View className="items-center py-14">
          <Text className="text-[13px] text-muted-foreground">{emptyText}</Text>
        </View>
      ) : (
        rows.map((row) => (
          <View key={rowKey(row)} className="flex-row items-center px-5 py-3 border-t border-border">
            {columns.map((c, i) => (
              <View
                key={i}
                style={{
                  flex: c.flex ?? 1,
                  alignItems: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
                  paddingLeft: actionColumnIndex != null && i > actionColumnIndex ? 12 : 0,
                }}
              >
                {renderCell(row, i)}
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  )
}
