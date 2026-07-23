import * as React from "react"
import { View, type ViewProps } from "react-native"
import { cn } from "@/lib/utils"

function Separator({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("h-px w-full bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  )
}

export { Separator }
