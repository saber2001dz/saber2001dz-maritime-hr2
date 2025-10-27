"use client"
import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  Edit,
  Calendar,
  Briefcase,
  ClipboardList,
  Clock,
  Award,
  UserCheck,
  TrendingUp,
  Shield,
  CreditCard,
  Eye,
  X,
} from "lucide-react"
import { EmployeeCompleteData } from "@/types/details_employees"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PopoverClose } from "@radix-ui/react-popover"
import EditDialogs from "../tabsEdit/TabProfessionalInfoEdit"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { getTitleFont, getCardTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee, getTableCellNotoFont } from "@/lib/direction"
import { getGradeLabel } from "@/lib/selectOptions"
import type { Locale } from "@/lib/types"

interface TabProfessionalInfoProps {
  data: EmployeeCompleteData
}

// Fonction pour formater les dates
const formatDate = (dateStr: string | null | undefined, isRTL = false) => {
  if (!dateStr) return isRTL ? "غير محدد" : "Non défini"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return isRTL ? "غير محدد" : "Non défini"
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  } catch {
    return isRTL ? "غير محدد" : "Non défini"
  }
}

// Fonction pour calculer la durée
const calculateDuration = (debut: string | null | undefined, fin: string | null | undefined, isRTL = false) => {
  if (!debut) return isRTL ? "غير محدد" : "Non défini"
  try {
    const startDate = new Date(debut)
    const endDate = fin ? new Date(fin) : new Date()
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return isRTL ? "غير محدد" : "Non défini"
    }
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12
    months += endDate.getMonth() - startDate.getMonth()
    // Ajustement pour les jours
    if (endDate.getDate() < startDate.getDate()) {
      months--
    }
    if (months < 0) return isRTL ? "غير محدد" : "Non défini"
    if (months < 12) {
      return isRTL ? `${months} شهر` : `${months} mois`
    }
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (isRTL) {
      return remainingMonths > 0 ? `${years} سنة ${remainingMonths} شهر` : `${years} سنة`
    } else {
      return remainingMonths > 0
        ? `${years} an${years > 1 ? "s" : ""} ${remainingMonths} mois`
        : `${years} an${years > 1 ? "s" : ""}`
    }
  } catch {
    return isRTL ? "غير محدد" : "Non défini"
  }
}

// Fonction pour calculer la durée restante en années, mois et jours
const calculateRemainingDuration = (endDateStr: string | null | undefined, isRTL = false) => {
  if (!endDateStr) return isRTL ? "غير محدد" : "Non défini"
  try {
    const endDate = new Date(endDateStr)
    const currentDate = new Date()
    if (isNaN(endDate.getTime())) return isRTL ? "غير محدد" : "Non défini"
    if (endDate < currentDate) return isRTL ? "انتهى العقد" : "Contrat expiré"

    let years = endDate.getFullYear() - currentDate.getFullYear()
    let months = endDate.getMonth() - currentDate.getMonth()
    let days = endDate.getDate() - currentDate.getDate()

    // Ajustement pour les jours négatifs
    if (days < 0) {
      months--
      const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()
      days += daysInPrevMonth
    }
    // Ajustement pour les mois négatifs
    if (months < 0) {
      years--
      months += 12
    }

    const parts = []
    if (isRTL) {
      if (years > 0) parts.push(`${years} سنة`)
      if (months > 0) parts.push(`${months} شهر`)
      if (days > 0) parts.push(`${days} يوم`)
      return parts.length > 0 ? parts.join("، ") : "أقل من يوم"
    } else {
      if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`)
      if (months > 0) parts.push(`${months} mois`)
      if (days > 0) parts.push(`${days} jour${days > 1 ? "s" : ""}`)
      return parts.length > 0 ? parts.join(", ") : "Moins d'un jour"
    }
  } catch {
    return isRTL ? "غير محدد" : "Non défini"
  }
}

// Fonction pour formater le matricule
const formatMatricule = (matricule: string) => {
  if (!matricule) return "N/A"
  const matriculeStr = matricule.toString()
  if (matriculeStr.length === 5) {
    return `${matriculeStr.slice(0, 2)} ${matriculeStr.slice(2)}`
  } else if (matriculeStr.length === 4) {
    return `${matriculeStr.slice(0, 1)} ${matriculeStr.slice(1)}`
  }
  return matriculeStr
}

// Composant Tabs avec nouvelle colonne "Date Fin"
function TabsComponent({
  grades,
  fonctions,
  rendements,
  notesAnnuelles,
  onEdit,
  isRTL = false,
  cardSubtitleFontClass = "",
  tableNotoFontClass = "",
}: {
  grades: any[]
  fonctions: any[]
  rendements: any[]
  notesAnnuelles: any[]
  onEdit?: (tabType: string) => void
  isRTL?: boolean
  cardSubtitleFontClass?: string
  tableNotoFontClass?: string
}) {
  const [activeTab, setActiveTab] = useState("grades")

  // Notifier le parent du changement d'onglet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (onEdit) {
      onEdit(tab)
    }
  }

  return (
    <div className="w-full">
      {/* En-têtes des onglets */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
        <button
          onClick={() => handleTabChange("grades")}
          className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "grades"
              ? "text-[#076784] border-[#076784]"
              : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
          }`}
        >
          <div className={`flex items-center justify-center gap-2`}>
            <TrendingUp className={`w-4 h-4 ${isRTL ? "scale-x-[-1]" : ""}`} />
            <span className={cardSubtitleFontClass}>{isRTL ? "تقــدم الـرتــب" : "Avancement Grade"}</span>
          </div>
        </button>
        <button
          onClick={() => handleTabChange("fonctions")}
          className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "fonctions"
              ? "text-[#076784] border-[#076784]"
              : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
          }`}
        >
          <div className={`flex items-center justify-center gap-2`}>
            <Shield className="w-4 h-4" />
            <span className={cardSubtitleFontClass}>{isRTL ? "الوظائف الإداريــة" : "Fonctions Administratives"}</span>
          </div>
        </button>
        {/* Afficher l'onglet rendements uniquement en mode RTL */}
        {isRTL && (
          <button
            onClick={() => handleTabChange("rendements")}
            className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              activeTab === "rendements"
                ? "text-[#076784] border-[#076784]"
                : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
            }`}
          >
            <div className={`flex items-center justify-center gap-2`}>
              <Award className="w-4 h-4" />
              <span className={cardSubtitleFontClass}>أعـــداد الأداء</span>
            </div>
          </button>
        )}
        {/* Afficher l'onglet notes annuelles uniquement en mode RTL */}
        {isRTL && (
          <button
            onClick={() => handleTabChange("notesAnnuelles")}
            className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              activeTab === "notesAnnuelles"
                ? "text-[#076784] border-[#076784]"
                : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
            }`}
          >
            <div className={`flex items-center justify-center gap-2`}>
              <Award className="w-4 h-4" />
              <span className={cardSubtitleFontClass}>الأعــداد السنوية</span>
            </div>
          </button>
        )}
      </div>

      {/* Content des onglets */}
      <div className="h-[320px]">
        {activeTab === "grades" && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            {grades.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                {isRTL ? "لم يتم تسجيل أي رتبة" : "Aucun grade enregistré"}
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start
                       text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "رقــــم" : "N°"}
                    </th>
                    <th
                      className={`pr-5 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-40 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "الـــرتبـــــــــــة" : "Grade"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-38 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ الحصول على الرتبة" : "Date Obtention"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-38 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ النهاية" : "Date Fin"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "المــرجــــــع" : "Référence"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...grades]
                    .sort((a, b) => new Date(b.date_grade || 0).getTime() - new Date(a.date_grade || 0).getTime())
                    .map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          <div className={`flex items-center gap-2`}>
                            <Award className="w-4 h-4 text-[#076784]" />
                            {getGradeLabel(item.grade) || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {formatDate(item.date_grade, isRTL)}
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {item.date_fin_grade ? formatDate(item.date_fin_grade, isRTL) : isRTL ? "جاري" : "En cours"}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.reference || (isRTL ? "غير محدد" : "Non défini")}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "fonctions" && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            {fonctions.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                {isRTL ? "لم يتم تسجيل أي وظيفة" : "Aucune fonction enregistrée"}
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "رقــــم" : "N°"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-40 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "الوظيفة" : "Fonction"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-38 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ الحصول" : "Date Obtention"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-38 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ النهاية" : "Date Fin"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "المرجع" : "Référence"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...fonctions]
                    .sort(
                      (a, b) =>
                        new Date(b.date_obtention_fonction || 0).getTime() -
                        new Date(a.date_obtention_fonction || 0).getTime()
                    )
                    .map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          <div className={`flex items-center gap-2`}>
                            <UserCheck className="w-4 h-4 text-[#076784]" />
                            {item.fonction || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {formatDate(item.date_obtention_fonction, isRTL)}
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {item.date_fin ? formatDate(item.date_fin, isRTL) : isRTL ? "جاري" : "En cours"}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.reference || (isRTL ? "غير محدد" : "Non défini")}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Onglet rendements - affiché uniquement en RTL */}
        {activeTab === "rendements" && isRTL && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            {rendements.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                لم يتم تسجيل أي عــدد أداء
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 ${cardSubtitleFontClass}`}
                    >
                      رقــــم
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      السنــــة
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      الثـلاثيــة
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                     العــــدد / 100
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...rendements]
                    .sort((a, b) => {
                      // Trier par année desc, puis par trimestre desc
                      if (a.annee !== b.annee) {
                        return (b.annee || 0) - (a.annee || 0)
                      }
                      return (b.trimestre || 0) - (a.trimestre || 0)
                    })
                    .map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          <div className={`flex items-center gap-2`}>
                            <Calendar className="w-4 h-4 text-[#076784]" />
                            {item.annee || "غير محدد"}
                          </div>
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {item.trimestre ? `الثلاثية ${item.trimestre}` : "غير محدد"}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.rendement_note !== null && item.rendement_note !== undefined ? item.rendement_note : "غير محدد"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Onglet notes annuelles - affiché uniquement en RTL */}
        {activeTab === "notesAnnuelles" && isRTL && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            {notesAnnuelles.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                لم يتم تسجيل أي عــدد سنوي
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 ${cardSubtitleFontClass}`}
                    >
                      رقــــم
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      السنــــة
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      العــــدد / 20
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...notesAnnuelles]
                    .sort((a, b) => (b.annee || 0) - (a.annee || 0)) // Trier par année desc
                    .map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {index + 1}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          <div className={`flex items-center gap-2`}>
                            <Calendar className="w-4 h-4 text-[#076784]" />
                            {item.annee || "غير محدد"}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.note !== null && item.note !== undefined ? item.note : 
                             item.note_annuelle !== null && item.note_annuelle !== undefined ? item.note_annuelle : "غير محدد"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// Composant Card réutilisable
function Card({
  title,
  icon: Icon,
  children,
  edit = false,
  animationDelay,
  showProgress = false,
  progressPercentage = 0,
  onEdit,
  isRTL = false,
  titleFontClass = "",
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  edit?: boolean
  animationDelay?: string
  showProgress?: boolean
  progressPercentage?: number
  onEdit?: () => void
  isRTL?: boolean
  titleFontClass?: string
}) {
  const getProgressColor = (percentage: number) => {
    if (percentage <= 70) return "bg-[#9DC082]"
    if (percentage <= 90) return "bg-orange-500"
    return "bg-red-500"
  }

  const progressColor = getProgressColor(progressPercentage)

  return (
    <div
      className="bg-white dark:bg-[#1C1C1C] rounded-sm shadow-sm overflow-hidden animate-slide-up"
      style={{ animationDelay }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2`}>
            <Icon className="h-5 w-5 text-[#076784]" />
            <h2 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>{title}</h2>
          </div>
          {edit && onEdit && (
            <button
              onClick={onEdit}
              className={`flex items-center text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer gap-2`}
            >
              <Edit className="h-4 w-4" />
              <span className={`text-sm font-medium ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                {isRTL ? "تعــديــل" : "Modifier"}
              </span>
            </button>
          )}
        </div>
        {children}
      </div>
      {showProgress && (
        <div className="w-full bg-gray-200 h-1">
          <div
            className={`h-1 transition-all duration-300 ${progressColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Composant Field
function Field({
  label,
  value,
  labelFontClass = "",
  valueFontClass = "",
}: {
  label: string
  value: string | React.ReactNode | undefined
  labelFontClass?: string
  valueFontClass?: string
}) {
  return (
    <div>
      <p className={`text-sm text-gray-500 dark:text-gray-400 mb-1 ${labelFontClass}`}>{label}</p>
      <p className={`text-gray-700 dark:text-gray-300 ${valueFontClass}`}>{value || "Non défini"}</p>
    </div>
  )
}

// Composant Field avec bouton pour les grades
function FieldWithButton({
  label,
  value,
  onButtonClick,
  icon: Icon = Edit,
}: {
  label: string
  value: string | undefined
  onButtonClick: () => void
  icon?: React.ElementType
}) {
  return (
    <div>
      <div className="flex items-center mb-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <button
          onClick={onButtonClick}
          className="text-gray-400 hover:text-[#076784] transition-colors cursor-pointer ml-2"
          title="Gérer les grades"
        >
          <Icon className="h-4 w-4" />
        </button>
      </div>
      <p className="text-gray-900 dark:text-gray-300 font-medium">{value || "Non défini"}</p>
    </div>
  )
}

// Composant Divider
function Divider() {
  return <div className="col-span-full border-t border-gray-200 dark:border-gray-600 my-2" />
}

export default function TabProfessionalInfo({ data }: TabProfessionalInfoProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const tableNotoFontClass = getTableCellNotoFont(params.locale as Locale)
  // État pour gérer les données et les dialogues
  const [employeeData, setEmployeeData] = useState(data)
  const [originalData, setOriginalData] = useState(data)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [currentActiveTab, setCurrentActiveTab] = useState("grades")
  const toasterRef = useRef<ToasterRef>(null)

  // Synchroniser l'état local avec les props quand les données changent
  useEffect(() => {
    setEmployeeData((prev) => ({
      ...prev, // Préserver toutes les données existantes
      employee: data.employee, // Mettre à jour seulement les données employee
      banque: data.banque || prev.banque, // Prioriser les nouvelles données bancaires
    }))
    setOriginalData(data)
  }, [data])

  // Extraction des données professionnelles avec vérifications
  const employee = employeeData.employee || []
  const currentAffectations = employeeData.affectations || []
  const currentGrades = employeeData.grades || []
  const currentFonctions = employeeData.fonctions || []
  const currentRendements = employeeData.rendements || []
  const currentNotesAnnuelles = employeeData.notes_annuelles || []
  const banque = employeeData.banque || []

  // Trier les affectations par date de début (plus récentes en premier) et limiter l'affichage aux 3 dernières
  const sortedAffectations = [...currentAffectations].sort(
    (a, b) => new Date(b.date_responsabilite || 0).getTime() - new Date(a.date_responsabilite || 0).getTime()
  )
  const displayedAffectations = sortedAffectations.slice(0, 3)

  // Données actuelles avec vérifications
  const currentGrade = currentGrades.length > 0 ? currentGrades[0] : null
  const currentAffectation = sortedAffectations.length > 0 ? sortedAffectations[0] : null

  // Trouver la fonction administrative la plus récente qui est encore en cours
  const currentFonction = useMemo(() => {
    if (currentFonctions.length === 0) return null

    // Trier les fonctions par date d'obtention (plus récente en premier)
    const sortedFonctions = [...currentFonctions].sort((a, b) => {
      const dateA = a.date_obtention_fonction ? new Date(a.date_obtention_fonction) : new Date(0)
      const dateB = b.date_obtention_fonction ? new Date(b.date_obtention_fonction) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    // Chercher la première fonction sans date de fin ou avec une date de fin future
    const currentDate = new Date()
    for (const fonction of sortedFonctions) {
      if (!fonction.date_fin) {
        return fonction // Fonction en cours (pas de date de fin)
      }
      const dateFin = new Date(fonction.date_fin)
      if (dateFin > currentDate) {
        return fonction // Fonction encore active
      }
    }

    // Si aucune fonction en cours, retourner la plus récente
    return sortedFonctions[0] || null
  }, [currentFonctions])

  const currentBanque = banque.find((b) => b.compte_statut === true) || null

  // Popover pour les comptes bancaires
  const [showBankAccounts, setShowBankAccounts] = useState(false)

  // Fonction pour afficher les toasts
  const showToast = (variant: "success" | "error", title: string, message: string) => {
    toasterRef.current?.show({
      title,
      message,
      variant,
      duration: variant === "success" ? 4000 : 5000,
      position: "top-right",
    })
  }

  // Gestionnaire de sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    let newEmployeeData: EmployeeCompleteData

    if (field === "contract") {
      newEmployeeData = {
        ...employeeData,
        employee: {
          ...employeeData.employee,
          ...updatedData,
        },
      }
    } else if (field === "prolongation") {
      newEmployeeData = {
        ...employeeData,
        employee: {
          ...employeeData.employee,
          prolongation_retraite: updatedData.prolongation_retraite,
        },
      }
    } else if (field === "situation") {
      newEmployeeData = {
        ...employeeData,
        employee: {
          ...employeeData.employee,
          ...updatedData,
        },
      }
    } else if (field === "affectations") {
      newEmployeeData = {
        ...employeeData,
        affectations: updatedData,
      }
    } else if (field === "affectation") {
      newEmployeeData = {
        ...employeeData,
        affectations: employeeData.affectations.map((affectation, index) =>
          index === 0 ? { ...affectation, ...updatedData } : affectation
        ),
      }
    } else if (field === "grade") {
      newEmployeeData = {
        ...employeeData,
        grades: employeeData.grades.map((grade, index) => (index === 0 ? { ...grade, ...updatedData } : grade)),
      }
    } else if (field === "fonction") {
      newEmployeeData = {
        ...employeeData,
        fonctions: employeeData.fonctions.map((fonction, index) =>
          index === 0 ? { ...fonction, ...updatedData } : fonction
        ),
      }
    } else if (field === "grades") {
      newEmployeeData = {
        ...employeeData,
        grades: updatedData,
      }
    } else if (field === "fonctions") {
      newEmployeeData = {
        ...employeeData,
        fonctions: updatedData,
      }
    } else if (field === "rendements") {
      newEmployeeData = {
        ...employeeData,
        rendements: updatedData,
      }
    } else if (field === "notes_annuelles") {
      newEmployeeData = {
        ...employeeData,
        notes_annuelles: updatedData,
      }
    } else if (field === "banque") {
      newEmployeeData = {
        ...employeeData,
        banque: updatedData,
      }
    } else if (field === "absences") {
      newEmployeeData = {
        ...employeeData,
        absences: updatedData,
      }
    } else {
      newEmployeeData = employeeData
    }

    // Mettre à jour les données courantes ET les données originales après sauvegarde
    setEmployeeData(newEmployeeData)
    setOriginalData(newEmployeeData)
    console.log(`Données sauvegardées pour ${field}:`, updatedData)
  }

  // Gestionnaire d'ouverture des dialogues
  const openDialog = (dialogType: string) => {
    setActiveDialog(dialogType)
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  // Calcul de la date de fin de contrat
  const calculateEndContractDate = useMemo(() => {
    if (!employee.date_naissance) return null
    try {
      const birthDate = new Date(employee.date_naissance)
      if (isNaN(birthDate.getTime())) return null
      const endDate = new Date(birthDate)
      const prolongationYears = Number(employee.prolongation_retraite) || 0
      endDate.setFullYear(birthDate.getFullYear() + 57 + prolongationYears)
      return endDate.toISOString().split("T")[0]
    } catch {
      return null
    }
  }, [employee.date_naissance, employee.prolongation_retraite])

  // Fonction pour calculer le pourcentage du contrat écoulé
  const calculateContractProgress = useMemo(() => {
    if (!employee.date_recrutement || !calculateEndContractDate) return 0
    try {
      const startDate = new Date(employee.date_recrutement)
      const endDate = new Date(calculateEndContractDate)
      const currentDate = new Date()
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0
      const totalDuration = endDate.getTime() - startDate.getTime()
      const elapsedDuration = currentDate.getTime() - startDate.getTime()
      const percentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100))
      return Math.round(percentage)
    } catch {
      return 0
    }
  }, [employee.date_recrutement, calculateEndContractDate])

  // Formatage du grade avec la date (inspiré de formatMaritalStatus)
  const formatGradeWithDate = () => {
    try {
      const grade = employeeData?.employee?.grade_actuel
      // Utiliser la date du grade le plus récent depuis les grades
      const dateGrade = currentGrade?.date_grade

      if (!grade) return isRTL ? "غير محدد" : "Non défini"

      const gradeLabel = getGradeLabel(grade)

      if (!dateGrade) return gradeLabel

      const year = new Date(dateGrade).getFullYear()

      return (
        <>
          {gradeLabel} <span className="font-noto-naskh-arabic text-gray-600 text-xs mr-1">(منذ {year})</span>
        </>
      )
    } catch (error) {
      console.error("Erreur de formatage du grade:", error)
      return isRTL ? "غير محدد" : "Non défini"
    }
  }

  // Fonction pour obtenir les couleurs de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "actuel":
        return "bg-green-100 border-green-500 text-green-700"
      case "termine":
        return "bg-blue-100 border-blue-500 text-blue-700"
      case "mutation":
        return "bg-orange-100 border-orange-500 text-orange-700"
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-500 text-gray-700 dark:text-gray-300"
    }
  }

  // Calcul de la durée restante avant expiration du contrat
  const calculateRemainingContractDuration = useMemo(() => {
    return calculateRemainingDuration(calculateEndContractDate, isRTL)
  }, [calculateEndContractDate, isRTL])

  // Calcul de l'ancienneté totale
  const calculateTotalSeniority = useMemo(() => {
    if (sortedAffectations.length === 0) return isRTL ? "غير محدد" : "Non défini"
    try {
      // Prendre la dernière affectation dans la liste triée (date la plus ancienne)
      const firstAffectation = sortedAffectations[sortedAffectations.length - 1]
      return calculateDuration(firstAffectation.date_responsabilite, null, isRTL)
    } catch {
      return isRTL ? "غير محدد" : "Non défini"
    }
  }, [sortedAffectations, isRTL])

  // Fonction pour déterminer le statut d'une affectation
  const getAffectationStatus = (affectation: any) => {
    if (!affectation.date_fin) return "actuel"
    try {
      const endDate = new Date(affectation.date_fin)
      const today = new Date()
      if (isNaN(endDate.getTime())) return "actuel"
      return endDate > today ? "actuel" : "termine"
    } catch {
      return "actuel"
    }
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 ${isRTL ? "text-start" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contract Duration */}
        <Card
          title={isRTL ? "مـــدة العـمــل" : "Durée du Contrat"}
          icon={Calendar}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
          edit
          animationDelay="0.2s"
          showProgress={true}
          progressPercentage={calculateContractProgress}
          onEdit={() => openDialog("contract")}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className={`text-gray-500 dark:text-gray-400 text-sm ${cardSubtitleFontClass}`}>
                {isRTL ? "تاريخ الإنتداب" : "Début du contrat"}
              </p>
              <p className={`text-gray-900 dark:text-gray-300 font-medium mt-2 ${jazeeraFontClass}`}>
                {formatDate(employee.date_recrutement, isRTL)}
              </p>
            </div>
            <span className="text-gray-400">{isRTL ? "←" : "→"}</span>
            <div>
              <p className={`text-gray-500 dark:text-gray-400 text-sm ${cardSubtitleFontClass}`}>
                {isRTL ? "نهاية العقد" : "Fin du contrat"}
              </p>
              <p className={`text-gray-900 dark:text-gray-300 font-medium mt-2 ${jazeeraFontClass}`}>
                {formatDate(calculateEndContractDate, isRTL)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => openDialog("prolongation")}
                className="text-sm px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-600 cursor-pointer font-semibold"
              >
                {isRTL ? "تـمــد يــد" : "Prolonger"}
              </button>
            </div>
          </div>
          <div className={`text-sm text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
            {calculateRemainingContractDuration} {isRTL ? "قبل التقاعد" : "avant la retraite"}
          </div>
        </Card>

        {/* Situation Administrative */}
        <Card
          title={isRTL ? "الوضعية الإدارية" : "Situation Administrative"}
          icon={Briefcase}
          edit
          animationDelay="0.3s"
          onEdit={() => openDialog("situation")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field
              label={isRTL ? "الــرتبــــة" : "Grade"}
              value={formatGradeWithDate()}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "الوحــدة الحاليـة" : "Unité Actuelle"}
              value={currentAffectation?.unite || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "المسؤوليــة" : "Responsabilité"}
              value={currentAffectation?.responsibility || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "تاريخ المسؤوليــة" : "Date Responsabilité"}
              value={formatDate(currentAffectation?.date_responsabilite, isRTL)}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "الخطـة الوظيفيـة" : "Fonction Administrative"}
              value={currentFonction?.fonction || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "تاريخ الوظيفــة" : "Date Fonction"}
              value={formatDate(currentFonction?.date_obtention_fonction, isRTL)}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Divider />
            <Field
              label={isRTL ? "الــرقــــم" : "Matricule"}
              value={<span dir="ltr">{formatMatricule(employee.matricule)}</span>}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
            <Field
              label={isRTL ? "الـرقـم المـوحـد" : "Identifiant Unique"}
              value={employee.identifiant_unique || (isRTL ? "غير محدد" : "Non défini")}
              labelFontClass={cardSubtitleFontClass}
              valueFontClass={jazeeraFontClass}
            />
          </div>
        </Card>

        {/* Grades & Fonctions avec Tabs */}
        <Card
          title={isRTL ? "الرتب والوظائف" : "Grades & Fonctions"}
          icon={Award}
          edit
          animationDelay="0.4s"
          onEdit={() => {
            // Ouvrir le dialogue correspondant à l'onglet actif
            if (currentActiveTab === "grades") {
              openDialog("gradesList")
            } else if (currentActiveTab === "fonctions") {
              openDialog("fonctionsList")
            } else if (currentActiveTab === "rendements") {
              openDialog("rendementsList")
            } else if (currentActiveTab === "notesAnnuelles") {
              openDialog("notesAnnuellesList")
            }
          }}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <TabsComponent
            grades={currentGrades}
            fonctions={currentFonctions}
            rendements={currentRendements}
            notesAnnuelles={currentNotesAnnuelles}
            onEdit={setCurrentActiveTab}
            isRTL={isRTL}
            cardSubtitleFontClass={cardSubtitleFontClass}
            tableNotoFontClass={tableNotoFontClass}
          />
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        {/* Affectations */}
        <Card
          title={isRTL ? "التعيينات" : "Affectations"}
          icon={ClipboardList}
          edit
          animationDelay="0.4s"
          onEdit={() => openDialog("affectation")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          {sortedAffectations.length === 0 ? (
            <div className={`text-center py-8 text-gray-500 ${cardSubtitleFontClass}`}>
              {isRTL ? "لم يتم تسجيل أي تعيين" : "Aucune affectation enregistrée"}
            </div>
          ) : (
            <div className="relative">
              {/* En-tête avec bouton popover */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm text-gray-600 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                  {isRTL
                    ? sortedAffectations.length > 3
                      ? `3 أحدث من أصل ${sortedAffectations.length}`
                      : `${sortedAffectations.length} تعيين`
                    : sortedAffectations.length > 3
                    ? `3 dernières sur ${sortedAffectations.length}`
                    : `${sortedAffectations.length} affectation${sortedAffectations.length > 1 ? "s" : ""}`}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Eye className="w-4 h-4 cursor-pointer text-[#076784]" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[1000px] bg-white dark:bg-[#1C1C1C]" align="end">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>
                        {isRTL ? "جميع التعيينات" : "Toutes les Affectations"}
                      </h3>
                      <PopoverClose>
                        <X className="w-4 h-4 cursor-pointer text-[#076784]" />
                      </PopoverClose>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                          <tr>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "الوحدة" : "Unité"}
                            </th>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "المسؤولية" : "Responsabilité"}
                            </th>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "تاريخ البداية" : "Date Début"}
                            </th>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "تاريخ النهاية" : "Date Fin"}
                            </th>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "المدة" : "Durée"}
                            </th>
                            <th
                              className={`px-3 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "الحالة" : "Statut"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {sortedAffectations.map((affectation, index) => {
                            const status = getAffectationStatus(affectation)
                            return (
                              <tr key={affectation.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className={`px-3 py-2 ${jazeeraFontClass}`}>
                                  {affectation.unite || (isRTL ? "-" : "-")}
                                </td>
                                <td className={`px-3 py-2 ${jazeeraFontClass}`}>
                                  {affectation.responsibility || (isRTL ? "-" : "-")}
                                </td>
                                <td className={`px-3 py-2 ${jazeeraFontClass}`}>
                                  {formatDate(affectation.date_responsabilite, isRTL)}
                                </td>
                                <td className={`px-3 py-2 ${jazeeraFontClass}`}>
                                  {affectation.date_fin
                                    ? formatDate(affectation.date_fin, isRTL)
                                    : isRTL
                                    ? "جاري"
                                    : "En cours"}
                                </td>
                                <td className={`px-3 py-2 ${jazeeraFontClass}`}>
                                  {calculateDuration(affectation.date_responsabilite, affectation.date_fin, isRTL)}
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      status
                                    )} ${cardSubtitleFontClass}`}
                                  >
                                    {status === "actuel" ? (isRTL ? "جاري" : "En cours") : isRTL ? "منتهي" : "Terminé"}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="absolute left-4 w-0.5 bg-[#076784]" style={{ top: "76px", bottom: "18px" }} />
              {displayedAffectations.map((affectation, index) => {
                const status = getAffectationStatus(affectation)
                return (
                  <div key={affectation.id || index}>
                    <div className="relative py-4 pl-12">
                      <div className="absolute left-2 top-5 w-4 h-4 rounded-full bg-[#076784] border-4 border-white shadow-md z-10" />
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3
                              className={`text-md font-semibold text-gray-800 dark:text-gray-300 ${jazeeraFontClass}`}
                            >
                              {affectation.unite || (isRTL ? "غير محدد" : "Non défini")}
                            </h3>
                            <p className={`text-sm mt-1 text-gray-600 dark:text-gray-300 ${jazeeraFontClass}`}>
                              {affectation.responsibility || (isRTL ? "غير محدد" : "Non défini")}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              status
                            )} ${cardSubtitleFontClass}`}
                          >
                            {status === "actuel" ? (isRTL ? "جـــاري" : "En cours") : isRTL ? "منتهـــي" : "Terminé"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                          <div className={`flex gap-1.5 dark:text-gray-400 mt-1`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span className={cardSubtitleFontClass}>
                              {formatDate(affectation.date_responsabilite, isRTL)}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 dark:text-gray-400`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span className={cardSubtitleFontClass}>{formatDate(affectation.date_fin, isRTL)}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 dark:text-gray-400`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span className={cardSubtitleFontClass}>
                              {calculateDuration(affectation.date_responsabilite, affectation.date_fin, isRTL)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < displayedAffectations.length - 1 && (
                      <div className="ml-12 border-b border-gray-200 dark:border-gray-600" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-3 ml-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-3 text-[13px] text-gray-500 dark:text-gray-400">
              <span>
                {isRTL ? "الأقدمية الإجمالية : " : "Ancienneté totale:"} {calculateTotalSeniority}
              </span>
              <span>|</span>
              <span>
                {isRTL ? "عدد التعيينات : " : "Nombre d'affectations:"} {sortedAffectations.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Identité Bancaire - Version modifiée */}
        <Card
          title={isRTL ? "الهـويـة البنكيــة" : "Identité Bancaire"}
          icon={CreditCard}
          edit
          animationDelay="0.5s"
          onEdit={() => openDialog("banque")}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          {!currentBanque ? (
            <div className={`text-center py-8 text-gray-500 ${cardSubtitleFontClass}`}>
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{isRTL ? "لم يتم تسجيل أي معلومات مصرفية" : "Aucune information bancaire enregistrée"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nouvelle disposition avec logo */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm text-gray-500 mb-1 ${cardSubtitleFontClass}`}>
                    {isRTL ? "المؤسسة المصرفية" : "Établissement Bancaire"}
                  </p>
                  <div className={`flex items-center gap-3`}>
                    {currentBanque.logo_url && (
                      <img src={currentBanque.logo_url} alt="Logo banque" className="w-7 h-7 object-contain" />
                    )}
                    <p className={`text-gray-900 dark:text-gray-300 text-[15px] ${jazeeraFontClass}`}>
                      {currentBanque.banque || (isRTL ? "غير محدد" : "Non défini")}
                    </p>
                  </div>
                </div>
                {/* Popover des comptes bancaires */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Eye className="w-4 h-4 cursor-pointer text-[#076784]" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[800px] bg-white dark:bg-[#1C1C1C]" align="end">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-semibold text-[#076784] ${titleFontClass}`}>
                        {isRTL ? "الحسابات المصرفية" : "Comptes Bancaires"}
                      </h3>
                      <PopoverClose>
                        <X className="w-4 h-4 cursor-pointer text-[#076784]" />
                      </PopoverClose>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                      <table className="w-full text-xs table-fixed">
                        <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                          <tr>
                            <th
                              className={`px-2 py-2.5 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase w-[10%] ${cardSubtitleFontClass}`}
                            >
                              #
                            </th>
                            <th
                              className={`px-2 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase w-[25%] ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "المـؤسســة البـنــكيــة" : "Banque"}
                            </th>
                            <th
                              className={`px-2 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase w-[20%] ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "الـفـــــرع البـنـــكـــي" : "Agence"}
                            </th>
                            <th
                              className={`px-2 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase w-[25%] ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "رقـــم الحســــاب الجــــــاري" : "RIB"}
                            </th>
                            <th
                              className={`px-2 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase w-[10%] ${cardSubtitleFontClass}`}
                            >
                              {isRTL ? "الحــالــــــــة" : "Statut"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {banque.map((banque, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-2 py-3 text-center">
                                {banque.logo_url && (
                                  <img src={banque.logo_url} alt="Logo" className="w-5 h-5 object-contain mx-auto" />
                                )}
                              </td>
                              <td
                                className={`px-2 py-3 truncate text-sm ${cardSubtitleFontClass}`}
                                title={banque.banque || "-"}
                              >
                                {banque.banque || "-"}
                              </td>
                              <td
                                className={`px-2 py-3 truncate text-xs ${cardSubtitleFontClass}`}
                                title={banque.agence || "-"}
                              >
                                {banque.agence || "-"}
                              </td>
                              <td
                                className={`px-2 py-3 font-mono text-xs truncate ${cardSubtitleFontClass}`}
                                title={banque.rib || "-"}
                              >
                                {banque.rib || "-"}
                              </td>
                              <td className="px-2 py-3 text-start">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] ${cardSubtitleFontClass} ${
                                    banque.compte_statut === true
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {banque.compte_statut === true ? (isRTL ? "نشط" : "Actif") : isRTL ? "غير نشط" : "Inactif"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Field
                label={isRTL ? "الفـــــرع" : "Agence"}
                value={currentBanque.agence || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={jazeeraFontClass}
              />
              <Field
                label={isRTL ? "رقم الحساب" : "RIB"}
                value={currentBanque.rib || (isRTL ? "غير محدد" : "Non défini")}
                labelFontClass={cardSubtitleFontClass}
                valueFontClass={jazeeraFontClass}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Composant EditDialogs */}
      <EditDialogs
        data={employeeData}
        onSave={handleSave}
        activeDialog={activeDialog}
        onClose={closeDialog}
        showToast={showToast}
      />

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
