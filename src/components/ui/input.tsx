import * as React from "react"
import { TextInput, type TextInputProps, Platform } from "react-native"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        "h-12 rounded-xl border border-border bg-background px-4 text-[15px] text-foreground",
        "placeholder:text-muted-foreground dark:placeholder:text-muted-foreground",
        Platform.OS === "ios" && "py-3",
        className
      )}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  )
}

export { Input }
