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
        "flex h-full w-full items-center justify-center rounded-full bg-accent",
        className
      )}
      {...props}
    >
      <Text className="text-sm font-medium text-muted-foreground">
        {children}
      </Text>
    </View>
  )
}

export { Avatar, AvatarFallback }
