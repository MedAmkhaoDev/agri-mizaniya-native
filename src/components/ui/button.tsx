import * as React from "react"
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-xl web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-green-600 dark:bg-green-500",
        destructive: "bg-red-500 dark:bg-red-600",
        outline: "border border-border bg-transparent",
        secondary: "bg-accent",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-12 px-5 py-3",
        sm: "h-9 px-3",
        lg: "h-14 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonTextVariants = cva("text-sm font-semibold", {
  variants: {
    variant: {
      default: "text-white dark:text-white",
      destructive: "text-white dark:text-white",
      outline: "text-foreground",
      secondary: "text-foreground",
      ghost: "text-foreground",
      link: "text-green-600 dark:text-green-400 underline-offset-4",
    },
    size: {
      default: "",
      sm: "",
      lg: "text-base",
      icon: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? "#111827" : "#FFFFFF"}
          size="small"
        />
      ) : (
        <Text className={cn(buttonTextVariants({ variant, size }))}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}

export { Button, buttonVariants, buttonTextVariants }
