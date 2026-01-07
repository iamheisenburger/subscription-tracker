"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Mobile app style: trackColor={{ false: '#D1D5DB', true: '#1F2937' }}
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Light mode: unchecked = gray, checked = dark slate
        "data-[state=unchecked]:bg-[#D1D5DB] data-[state=checked]:bg-[#1F2937]",
        // Dark mode: unchecked = slightly lighter gray, checked = light (inverted)
        "dark:data-[state=unchecked]:bg-[#4B5563] dark:data-[state=checked]:bg-[#F3F4F6]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Mobile app style: thumbColor="#FFFFFF"
          "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          // Always white thumb in light mode
          "bg-white",
          // Dark mode: white thumb when unchecked, dark when checked (for contrast)
          "dark:bg-white dark:data-[state=checked]:bg-[#1F2937]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
