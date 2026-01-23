"use client"

import React from "react"
import { Info, Calendar, Heart, AlertTriangle, Users, Baby, DollarSign } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCongesByType } from "@/hooks/dashboard/useCongesByType"
import { getCardSubtitleFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface CongesByTypePopoverProps {
  triggerClassName?: string
}

export function CongesByTypePopover({ triggerClassName = "" }: CongesByTypePopoverProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  
  const { congesByType, isLoading, error, totalEmployees } = useCongesByType()
  
  // Configuration des icônes et couleurs pour chaque type de congé
  const typeConfig = {
    'سنوية': {
      icon: Calendar,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      key: 'annual'
    },
    'مرض': {
      icon: Heart,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      key: 'sick'
    },
    'طارئة': {
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      key: 'emergency'
    },
    'زواج': {
      icon: Heart,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      key: 'marriage'
    },
    'أمومة': {
      icon: Baby,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      key: 'maternity'
    },
    'بدون راتب': {
      icon: DollarSign,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      key: 'unpaid'
    },
    'إجازة تقاعد': {
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      key: 'retirement'
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-sm text-red-600 dark:text-red-400 py-2">
          {isRTL ? "خطأ في تحميل البيانات" : "Erreur de chargement"}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* En-tête */}
        <div className="border-b border-border pb-2">
          <h4 className={`font-semibold text-sm ${cardSubtitleFontClass}`}>
            {isRTL ? t("dashboard.conges.distributionByType") : "Répartition par type"}
          </h4>
        </div>

        {/* Liste des types */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {congesByType.map((conge) => {
            const config = typeConfig[conge.type_conge as keyof typeof typeConfig]
            if (!config) return null

            const IconComponent = config.icon

            return (
              <div key={conge.type_conge} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`p-1.5 rounded-md ${config.bgColor}`}>
                    <IconComponent className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <span className={`text-sm text-foreground ${cardSubtitleFontClass} truncate`}>
                    {isRTL ? t(`dashboard.conges.types.${config.key}`) : conge.type_conge}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {conge.nombre_employees}
                  </span>
                  <Users className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium text-foreground ${cardSubtitleFontClass}`}>
              {isRTL ? t("dashboard.conges.total") : "Total"}
            </span>
            <span className="text-sm font-semibold text-primary">
              {totalEmployees} {isRTL ? "موظف" : "employés"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors cursor-pointer ${triggerClassName}`}
          aria-label={isRTL ? "عرض التفاصيل" : "Voir les détails"}
        >
          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 max-h-128"
        align={isRTL ? "end" : "start"}
        side="bottom"
      >
        {renderContent()}
      </PopoverContent>
    </Popover>
  )
}