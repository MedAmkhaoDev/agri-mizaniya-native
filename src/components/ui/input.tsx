import * as React from "react"
import { TextInput, type TextInputProps, Platform } from "react-native"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        "h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-[15px] text-gray-900 dark:text-gray-100",
        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
        Platform.OS === "ios" && "py-3",
        className
      )}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  )
}

export { Input }
