import * as React from "react"
import { Text, type TextProps } from "react-native"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn(
        "text-sm font-medium leading-none text-gray-700 dark:text-gray-300",
        className
      )}
      {...props}
    />
  )
}

export { Label }
