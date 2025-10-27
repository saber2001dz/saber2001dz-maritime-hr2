"use client"
import React, { useMemo, useState, useRef } from "react"
import { Edit, Award, AlertTriangle, Calendar, FileText, User, BarChart3, PieChart, LucideIcon } from "lucide-react"
import RatioChart from "../ratioChart"
import { EmployeeCompleteData, EmployeeSanctions, EmployeeRecompenses } from "@/types/details_employees"
import EditDialogs, { useEditDialogs } from "../tabsEdit/TabDisciplineInfoEdit"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTitleFont,
  getCardTitleFont,
  getCardSubtitleFont,
  getJazzeraFontDetailsEmployee,
  getTableCellNotoFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"

// Interface pour les props du composant Card
interface CardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  edit?: boolean
  animationDelay?: string
  onEdit?: () => void
  isRTL?: boolean
  titleFontClass?: string
}

// Composant Card réutilisable (défini en dehors pour éviter les re-renders)
const Card = React.memo<CardProps>(
  ({
    title,
    icon: Icon,
    children,
    edit = false,
    animationDelay = "0s",
    onEdit,
    isRTL = false,
    titleFontClass = "",
  }) => {
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
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
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
      </div>
    )
  }
)

Card.displayName = "Card"

// Composant Field (défini en dehors pour éviter les re-renders)
const Field = React.memo<{
  label: string
  value: string | React.ReactNode
  labelFontClass?: string
  valueFontClass?: string
}>(({ label, value, labelFontClass = "", valueFontClass = "" }) => {
  return (
    <div>
      <p className={`text-sm text-gray-500 dark:text-gray-400 mb-1 ${labelFontClass}`}>{label}</p>
      <p className={`text-gray-900 dark:text-gray-300 font-medium ${valueFontClass}`}>{value}</p>
    </div>
  )
})

Field.displayName = "Field"

// Composant Divider (défini en dehors pour éviter les re-renders)
const Divider = React.memo(() => {
  return <div className="col-span-full border-t border-gray-200 dark:border-gray-600 my-2" />
})

Divider.displayName = "Divider"

interface TabDisciplineInfoProps {
  data: EmployeeCompleteData
}

interface SanctionData {
  id: string
  description: string
  date: string
  motif: string
  autorite: string
}

interface RecompenseData {
  id: string
  description: string
  date: string
  motif: string
  autorite: string
}

export default function TabDiscipline({ data }: TabDisciplineInfoProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const tableNotoFontClass = getTableCellNotoFont(params.locale as Locale)

  // État pour gérer les données et les dialogues
  const employeeData = data
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const toasterRef = useRef<ToasterRef>(null)

  // Mapping des données de sanctions
  const sanctionsData: SanctionData[] = useMemo(() => {
    return (
      employeeData.sanctions?.map((sanction: EmployeeSanctions) => ({
        id: sanction.id,
        description: sanction.type_sanction,
        date: sanction.date_sanction,
        motif: sanction.motif,
        autorite: sanction.autorite,
      })) || []
    )
  }, [employeeData.sanctions])

  // Mapping des données de récompenses
  const recompensesData: RecompenseData[] = useMemo(() => {
    return (
      employeeData.recompenses?.map((recompense: EmployeeRecompenses) => ({
        id: recompense.id,
        description: recompense.type_recompense,
        date: recompense.date_recompense,
        motif: recompense.motif,
        autorite: recompense.autorite,
      })) || []
    )
  }, [employeeData.recompenses])

  // Fonction pour formater la date
  const formatDate = (dateStr: string, isRTL = false): string => {
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

  // Gestionnaire de sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    try {
      console.log(`Données sauvegardées pour ${field}`, updatedData)

      toasterRef.current?.show({
        title: isRTL ? "تم الحفظ بنجاح" : "Enregistrement réussi",
        message: isRTL
          ? `تم حفظ تعديلات ${field} بنجاح.`
          : `Les modifications des ${field} ont été sauvegardées avec succès.`,
        variant: "success",
        duration: 4000,
        position: "top-right",
      })
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${field}:`, error)

      // Affichage du toast d'erreur
      toasterRef.current?.show({
        title: isRTL ? "خطأ في الحفظ" : "Erreur d'enregistrement",
        message: isRTL
          ? `حدث خطأ أثناء حفظ ${field}.`
          : `Une erreur s'est produite lors de la sauvegarde des ${field}.`,
        variant: "error",
        duration: 5000,
        position: "top-right",
      })
    }
  }

  // Gestionnaire d'ouverture des dialogues
  const openDialog = React.useCallback((dialogType: string) => {
    console.log("Ouverture du dialogue:", dialogType)
    setActiveDialog(dialogType)
  }, [])

  const closeDialog = React.useCallback(() => {
    console.log("Fermeture du dialogue")
    setActiveDialog(null)
  }, [])

  // Handlers mémorisés pour éviter les re-renders
  const handleSanctionsEdit = React.useCallback(() => {
    openDialog("sanctions")
  }, [openDialog])

  const handleRecompensesEdit = React.useCallback(() => {
    openDialog("recompenses")
  }, [openDialog])

  // Calcul des totaux et ratio
  const totalSanctions = sanctionsData.length
  const totalRecompenses = recompensesData.length
  const ratio = totalRecompenses > 0 ? ((totalRecompenses / (totalSanctions + totalRecompenses)) * 100).toFixed(1) : "0"

  return (
    <div className={`space-y-6 px-6 ${isRTL ? "text-start" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Table des Sanctions */}
          <Card
            title={isRTL ? "العقـوبـات" : "Sanctions"}
            icon={AlertTriangle}
            edit
            animationDelay="0.2s"
            onEdit={handleSanctionsEdit}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          >
            <div className="h-[320px] overflow-y-auto overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-red-50 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[22%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "الوصف" : "Description"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[18%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "التاريخ" : "Date"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[26%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "السبب" : "Motif"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[34%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "السلطة" : "Autorité"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {sanctionsData.length > 0 ? (
                    sanctionsData.map((sanction) => (
                      <tr key={sanction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium w-[22%] truncate ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="truncate">{sanction.description}</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[18%] ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {formatDate(sanction.date, isRTL)}
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[26%] ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">{sanction.motif}</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[34%] truncate ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {sanction.autorite}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <span className={`text-sm text-gray-500 dark:text-gray-400 ${jazeeraFontClass}`}>
                            {isRTL ? "لا توجد عقوبات مسجلة" : "Aucune sanction enregistrée"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Table des Récompenses */}
          <Card
            title={isRTL ? "التـشـجيـع" : "Récompenses"}
            icon={Award}
            edit
            animationDelay="0.4s"
            onEdit={handleRecompensesEdit}
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          >
            <div className="h-[320px] overflow-y-auto overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-green-50 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[22%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "الوصف" : "Description"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[18%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "التاريخ" : "Date"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[26%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "السبب" : "Motif"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[34%] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "السلطة" : "Autorité"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {recompensesData.length > 0 ? (
                    recompensesData.map((recompense) => (
                      <tr key={recompense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium w-[22%] truncate ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="truncate">{recompense.description}</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[18%] ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {formatDate(recompense.date, isRTL)}
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[26%] ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">{recompense.motif}</span>
                          </div>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-600 dark:text-gray-400 w-[34%] truncate ${tableNotoFontClass}`}
                        >
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {recompense.autorite}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Award className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <span className={`text-sm text-gray-500 dark:text-gray-400 ${jazeeraFontClass}`}>
                            {isRTL ? "لا توجد مكافآت مسجلة" : "Aucune récompense enregistrée"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - Graphiques */}
        <div className="space-y-6">
          {/* Graphique du Ratio */}
          <Card
            title={isRTL ? "نسبة الأداء" : "Ratio Performance"}
            icon={PieChart}
            animationDelay="0.3s"
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          >
            <RatioChart
              totalSanctions={totalSanctions}
              totalRecompenses={totalRecompenses}
              ratio={ratio}
              isRTL={isRTL}
            />
          </Card>

          {/* Statistiques Générales */}
          <Card
            title={isRTL ? "الإحصائيات العامة" : "Statistiques Générales"}
            icon={BarChart3}
            animationDelay="0.6s"
            isRTL={isRTL}
            titleFontClass={titleFontClass}
          >
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className={`text-sm text-red-900 dark:text-red-100 ${cardSubtitleFontClass}`}>
                      {isRTL ? "إجمالي العقـوبـات" : "Total Sanctions"}
                    </span>
                  </div>
                  <span className={`text-lg font-bold dark:text-white text-red-800 ${jazeeraFontClass}`}>
                    {totalSanctions}
                  </span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className={`text-sm text-green-900 dark:text-green-100 ${cardSubtitleFontClass}`}>
                      {isRTL ? "إجمالي التـشـجيـع" : "Total Récompenses"}
                    </span>
                  </div>
                  <span className={`text-lg font-bold dark:text-white text-green-800 ${jazeeraFontClass}`}>
                    {totalRecompenses}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Composant EditDialogs */}
      {activeDialog && (
        <EditDialogs data={employeeData} onSave={handleSave} activeDialog={activeDialog} onClose={closeDialog} />
      )}

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
