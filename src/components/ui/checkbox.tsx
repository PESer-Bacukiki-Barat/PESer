"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-5 shrink-0 rounded-[6px] border border-outline-variant bg-surface-container-lowest outline-none transition-colors",
        "focus-visible:ring-3 focus-visible:ring-primary/50",
        "checked:border-primary checked:bg-primary checked:text-on-primary",
        "indeterminate:border-primary indeterminate:bg-primary indeterminate:text-on-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.indeterminate ? (
          <Minus className="size-4" />
        ) : (
          <Check className="size-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
