"use client"

import { useTheme } from "next-themes"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark"
      const root = document.documentElement

      if (!document.startViewTransition) {
        setTheme(newTheme)
        return
      }

      if (e) {
        root.style.setProperty("--x", `${e.clientX}px`)
        root.style.setProperty("--y", `${e.clientY}px`)
      }

      document.startViewTransition(() => {
        setTheme(newTheme)
      })
    },
    [resolvedTheme, setTheme]
  )

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full cursor-pointer">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full cursor-pointer" onClick={handleThemeToggle}>
      <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Sun className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
