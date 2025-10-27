"use client"
import { cn } from "@/lib/utils"
import { motion, SpringOptions, useSpring, useTransform } from "motion/react"
import { useEffect } from "react"

export type AnimatedNumberProps = {
  value: number
  className?: string
  springOptions?: SpringOptions
  as?: React.ElementType
}

export function AnimatedNumber({ value, className, springOptions, as = "span" }: AnimatedNumberProps) {
  const spring = useSpring(0, springOptions)
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString())

  useEffect(() => {
    spring.set(0)
    const timer = setTimeout(() => {
      spring.set(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [spring, value])

  if (as === "div") {
    return (
      <motion.div className={cn("tabular-nums", className)}>
        {display}
      </motion.div>
    )
  }

  if (as === "p") {
    return (
      <motion.p className={cn("tabular-nums", className)}>
        {display}
      </motion.p>
    )
  }

  return (
    <motion.span className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  )
}
