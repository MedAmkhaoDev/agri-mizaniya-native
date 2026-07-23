import * as React from "react"
import { View, type ViewProps } from "react-native"
import { cn } from "@/lib/utils"

function Separator({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(        "h-px w-full bg-border", className)}
      {...props}
    />
  )
}

export { Separator }
