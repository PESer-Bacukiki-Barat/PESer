import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-label-sm text-label-sm transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-container text-on-primary-container",
        secondary: "border-transparent bg-secondary-container text-on-secondary-container",
        tertiary: "border-transparent bg-tertiary-container text-on-tertiary-container",
        outline: "border-outline-variant text-on-surface-variant",
        destructive: "border-transparent bg-error-container text-error",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
