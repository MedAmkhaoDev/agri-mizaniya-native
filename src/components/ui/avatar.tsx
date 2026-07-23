import * as React from "react"
import { View, Text, type ViewProps } from "react-native"
import { cn } from "@/lib/utils"

function Avatar({ className, children, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </View>
  )
}

function AvatarFallback({ className, children, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {children}
      </Text>
    </View>
  )
}

export { Avatar, AvatarFallback }
