"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import type { Locale } from "@/lib/types"

export function LanguageSelector() {
  const t = useTranslations("common")
  const router = useRouter()
  const pathname = usePathname()

  // Utiliser le pathname pour déterminer la langue actuelle de manière fiable
  const currentLocale = pathname.split("/")[1] as Locale
  const isRTL = currentLocale === "ar"

  const switchLanguage = (newLocale: Locale) => {
    // Construire le nouveau path avec le locale
    const segments = pathname.split("/")
    segments[1] = newLocale
    const newPath = segments.join("/")
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("changeLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        <div
          className={`relative flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent/50 transition-colors gap-4 ${
            currentLocale === "fr" ? "bg-accent text-accent-foreground" : ""
          } ${isRTL ? "flex-row-reverse" : ""}`}
          onClick={() => switchLanguage("fr")}
        >
          <span className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>🇫🇷</span>
            <span>{isRTL ? "الفرنسية" : "Français"}</span>
          </span>
          {currentLocale === "fr" && <span className="text-green-600">✓</span>}
        </div>
        <div
          className={`relative flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent/50 transition-colors gap-4 ${
            currentLocale === "ar" ? "bg-accent text-accent-foreground" : ""
          } ${isRTL ? "flex-row-reverse" : ""}`}
          onClick={() => switchLanguage("ar")}
        >
          <span className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>🇹🇳</span>
            <span>{isRTL ? "العربية" : "Arabe"}</span>
          </span>
          {currentLocale === "ar" && <span className="text-green-600">✓</span>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
