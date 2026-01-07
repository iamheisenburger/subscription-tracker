import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles matching mobile app
        "h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm",
        // Light mode - mobile app style: backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#1F2937'
        "bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF]",
        // Dark mode - inverted for visibility
        "dark:bg-[#0F1419] dark:border-[#374151] dark:text-[#F3F4F6] dark:placeholder:text-[#6B7280]",
        // Focus states
        "focus-visible:border-[#1F2937] dark:focus-visible:border-[#F3F4F6] focus-visible:ring-0",
        // Selection
        "selection:bg-primary selection:text-primary-foreground",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
