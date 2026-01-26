"use client"

import React from "react"
import { Info, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PopoverClose } from "@radix-ui/react-popover"
import { useAbsentEmployees } from "@/hooks/dashboard/useAbsentEmployees"
import { getCardSubtitleFont, getTableCellNotoFont, getTitleFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface AbsentEmployeesPopoverProps {
  triggerClassName?: string
}

export function AbsentEmployeesPopover({ triggerClassName = "" }: AbsentEmployeesPopoverProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const tableCellNotoFontClass = getTableCellNotoFont(params.locale as Locale)
  const titleFontClass = getTitleFont(params.locale as Locale)

  const { absentEmployees, isLoading, error, totalAbsent } = useAbsentEmployees()

  // Fonction pour formater la date en format localisé
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return isRTL ? "غير محدد" : "N/A"

    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return isRTL ? `${year}-${month}-${day}` : `${day}-${month}-${year}`
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

    if (absentEmployees.length === 0) {
      return (
        <div className="text-sm text-muted-foreground py-4 text-center">
          {isRTL ? "لا يوجد موظفون متغيبون حالياً" : "Aucun employé absent actuellement"}
        </div>
      )
    }

    return (
      <div className="max-h-100 overflow-y-auto overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            <tr>
              <th className={`px-3 py-2 text-center text-xs font-semibold ${cardSubtitleFontClass} w-16`}>
                {isRTL ? "ع/ر" : "N°"}
              </th>
              <th className={`px-3 py-2 text-start text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "الرتبة" : "Grade"}
              </th>
              <th className={`px-3 py-2 text-start text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "الاسم واللقب" : "Nom et Prénom"}
              </th>
              <th className={`px-3 py-2 text-start text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "الرقم" : "Matricule"}
              </th>
              <th className={`px-3 py-2 text-start text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "تاريخ البداية" : "Date début"}
              </th>
              <th className={`px-3 py-2 text-start text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "تاريخ النهاية" : "Date fin"}
              </th>
              <th className={`px-3 py-2 text-center text-xs font-semibold ${cardSubtitleFontClass}`}>
                {isRTL ? "المدة (أيام)" : "Durée (jours)"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {absentEmployees.map((employee, index) => (
              <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                <td className={`px-3 py-2 text-center text-foreground ${tableCellNotoFontClass}`}>
                  {index + 1}
                </td>
                <td className={`px-3 py-2 text-foreground ${tableCellNotoFontClass}`}>
                  {employee.grade || (isRTL ? "غير محدد" : "N/A")}
                </td>
                <td className={`px-3 py-2 text-foreground ${tableCellNotoFontClass}`}>
                  {employee.prenom} {employee.nom}
                </td>
                <td className={`px-3 py-2 text-foreground ${tableCellNotoFontClass}`}>
                  {employee.matricule || (isRTL ? "غير محدد" : "N/A")}
                </td>
                <td className={`px-3 py-2 text-foreground ${tableCellNotoFontClass}`}>
                  {formatDate(employee.date_debut)}
                </td>
                <td className={`px-3 py-2 text-foreground ${tableCellNotoFontClass}`}>
                  {formatDate(employee.date_fin)}
                </td>
                <td className={`px-3 py-2 text-center text-foreground ${tableCellNotoFontClass}`}>
                  {employee.duree || (isRTL ? "غير محدد" : "N/A")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted transition-colors cursor-pointer focus:outline-none ${triggerClassName}`}
          aria-label={isRTL ? "عرض التفاصيل" : "Voir les détails"}
        >
          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-225 bg-white dark:bg-[#1C1C1C]"
        align={isRTL ? "end" : "start"}
        side="bottom"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>
            {isRTL ? "قائمة الموظفين المتغيبين" : "Liste des Employés Absents"}
          </h3>
          <PopoverClose className="focus:outline-none">
            <X className="w-4 h-4 cursor-pointer text-[#076784]" />
          </PopoverClose>
        </div>
        {renderContent()}
      </PopoverContent>
    </Popover>
  )
}
