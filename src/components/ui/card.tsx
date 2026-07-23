import * as React from "react"
import { View, type ViewProps } from "react-native"
import { cn } from "@/lib/utils"

function Card({ className, style, ...props }: ViewProps & { style?: any }) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
        className
      )}
      style={[
        {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 4px 12px rgba(0,0,0,0.04)',
        },
        style,
      ]}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: ViewProps) {
  return (
    <View className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />
  )
}

function CardTitle({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("flex-row items-center gap-2", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ViewProps) {
  return (
    <View className={cn("", className)} {...props} />
  )
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("p-5 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("flex-row items-center p-5 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
