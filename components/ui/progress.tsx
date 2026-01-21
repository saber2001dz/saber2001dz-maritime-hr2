"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  dir,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { dir?: "ltr" | "rtl" }) {
  const isRTL = dir === "rtl"
  const progressValue = value || 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-gray-200 dark:bg-gray-700 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all duration-500 ease-in-out"
        style={{
          transform: isRTL
            ? `translateX(${100 - progressValue}%)`
            : `translateX(-${100 - progressValue}%)`,
          transformOrigin: isRTL ? "right" : "left",
          backgroundColor: "#2B778F"
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
