import * as React from "react"
import { View, Text, type ViewProps } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "flex-row items-center rounded-full px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-green-100 dark:bg-green-900",
        secondary: "bg-gray-100 dark:bg-gray-800",
        destructive: "bg-red-100 dark:bg-red-900",
        outline: "border border-gray-200 dark:border-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const badgeTextVariants = cva("text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-green-700 dark:text-green-300",
      secondary: "text-gray-700 dark:text-gray-300",
      destructive: "text-red-700 dark:text-red-300",
      outline: "text-gray-900 dark:text-gray-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  textClassName?: string
}

function Badge({ className, variant, textClassName, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn(badgeTextVariants({ variant }), textClassName)}>
        {children}
      </Text>
    </View>
  )
}

export { Badge, badgeVariants }
