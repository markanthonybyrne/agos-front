"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => {
  const isIndeterminate = checked === "indeterminate"
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-none border-2 border-gray-500 bg-gray-800/90 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-gray-800/90 data-[state=checked]:text-cyan-400 data-[state=indeterminate]:border-cyan-400 data-[state=indeterminate]:bg-gray-800/90 data-[state=indeterminate]:text-cyan-400 transition-all duration-200",
        "data-[state=checked]:shadow-[0_0_8px_rgba(0,255,255,0.4)]",
        "data-[state=indeterminate]:shadow-[0_0_8px_rgba(0,255,255,0.4)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {isIndeterminate ? (
          <Minus className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

