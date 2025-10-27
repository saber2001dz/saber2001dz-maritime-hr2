"use client"
import { Clock, TrendingUp, FileText, Edit, AlertCircle, CheckCircle, XCircle, CalendarX } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useState, useMemo, useRef } from "react"
import { EmployeeCompleteData, EmployeeConge } from "@/types/details_employees"
import EditDialogs, { useEditDialogs } from "../tabsEdit/TabLeavesInfoEdit"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { getTitleFont, getCardTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee, getTableCellNotoFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"
import { congeOptions, getCongeOptions } from "@/lib/selectOptions"

interface TabLeavesInfoProps {
  data: EmployeeCompleteData
  onEmployeeUpdate?: (updatedEmployee: any) => void // Callback pour notifier les changements d'employé
}

// Composant Card réutilisable
function Card({
  title,
  icon: Icon,
  children,
  edit = false,
  animationDelay,
  onEdit,
  isRTL = false,
  titleFontClass = "",
}: any) {
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
    </div>
  )
}

export default function TabLeavesInfo({ data, onEmployeeUpdate }: TabLeavesInfoProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const tableNotoFontClass = getTableCellNotoFont(params.locale as Locale)

  // État pour gérer les dialogues d'édition
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const toasterRef = useRef<ToasterRef>(null)

  // État pour tracker l'onglet actif dans le LeavesTabsComponent
  const [currentActiveTab, setCurrentActiveTab] = useState("conges")

  // Fonction utilitaire pour déterminer si un statut de congé compte comme "utilisé"
  const isLeaveStatusUsed = (statut: string): boolean => {
    // Statuts considérés comme "utilisés" : congés terminés ET en cours
    const validStatuses = ['منتهية', 'قيد التنفيذ']
    return validStatuses.includes(statut)
  }

  // Fonction utilitaire pour filtrer les congés par année actuelle
  const isLeaveInCurrentYear = (conge: EmployeeConge): boolean => {
    if (!conge.date_debut) return false
    const currentYear = new Date().getFullYear() // 2025
    const leaveYear = new Date(conge.date_debut).getFullYear()
    return leaveYear === currentYear
  }


  // Types de congés avec quotas - basés sur congeOptions avec valeurs arabes
  const leaveTypes = useMemo(() => {
    // Obtenir les options de congés filtrées selon le genre
    const filteredCongeOptions = getCongeOptions(data.employee?.sexe)
    
    // Mapper avec les quotas et couleurs appropriés
    return filteredCongeOptions.map(option => {
      const quotaMap: { [key: string]: { quota: number, color: string } } = {
        "سنوية": { quota: 45, color: "#076784" },      // Annuel
        "مرض": { quota: 90, color: "#22c55e" },        // Maladie
        "طارئة": { quota: 6, color: "#8b5cf6" },      // Exceptionnel
        "زواج": { quota: 7, color: "#06b6d4" },        // Mariage
        "أمومة": { quota: 90, color: "#f59e0b" },      // Maternité
        "بدون راتب": { quota: 0, color: "#ef4444" },   // Sans Solde
      }
      
      const config = quotaMap[option.value] || { quota: 0, color: "#6b7280" }
      
      return {
        name: option.value, // Utiliser la valeur arabe comme name
        quota: config.quota,
        color: config.color,
        labelFr: option.label, // Garder le label français pour l'affichage
        labelAr: option.labelAr // Label arabe pour l'affichage RTL
      }
    })
  }, [data.employee?.sexe])

  // Fonction pour traduire les types de congés basée sur leaveTypes
  const translateLeaveType = (type: string, rtl: boolean) => {
    // Chercher le type dans leaveTypes pour obtenir les bons labels
    const leaveType = leaveTypes.find(lt => lt.name === type)
    if (leaveType) {
      return rtl ? (leaveType.labelAr || leaveType.labelFr) : leaveType.labelFr
    }
    
    // Fallback pour les anciens types si pas trouvé
    const fallbackTranslations: { [key: string]: string } = {
      "سنوية": rtl ? "سنوية" : "Annuel",
      "مرض": rtl ? "مرض" : "Maladie", 
      "طارئة": rtl ? "طارئة" : "Exceptionnel",
      "زواج": rtl ? "زواج" : "Mariage",
      "أمومة": rtl ? "أمومة" : "Maternité",
      "بدون راتب": rtl ? "بدون راتب" : "Sans Solde",
    }
    return fallbackTranslations[type] || type
  }

  // Calcul des statistiques des congés
  const leaveStats = useMemo(() => {
    const stats = leaveTypes.map((type) => {
      // Calcul des jours utilisés par type - UNIQUEMENT les congés avec statut valide
      const filteredConges = data.conges?.filter((conge: EmployeeConge) => 
        conge.type_conge === type.name && isLeaveStatusUsed(conge.statut)
      ) || []
      
      const used = filteredConges.reduce((sum, conge) => sum + (conge.duree || 0), 0)

      return {
        name: type.name,
        value: type.quota,
        used: used,
        remaining: Math.max(0, type.quota - used),
        color: type.color,
      }
    })

    return stats
  }, [data.conges, leaveTypes])

  // Statistiques filtrées pour le Card "Solde Congés" - UNIQUEMENT année actuelle (sans Mariage)
  const leaveStatsForBalance = useMemo(() => {
    // Recalculer les statistiques en filtrant par année actuelle
    const currentYearStats = leaveTypes
      .filter(type => type.name !== "زواج") // Exclure mariage
      .map((type) => {
        // Filtrer les congés par année actuelle + type + statut valide
        const filteredConges = data.conges?.filter((conge: EmployeeConge) => 
          conge.type_conge === type.name && 
          isLeaveStatusUsed(conge.statut) &&
          isLeaveInCurrentYear(conge)
        ) || []
        
        const used = filteredConges.reduce((sum, conge) => sum + (conge.duree || 0), 0)

        return {
          name: type.name,
          value: type.quota,
          used: used,
          remaining: Math.max(0, type.quota - used),
          color: type.color,
        }
      })

    return currentYearStats
  }, [data.conges, leaveTypes])


  // Gestionnaire de sauvegarde des données
  const handleSave = (field: string, updatedData: any) => {
    try {
      console.log(`Données sauvegardées pour ${field}`, updatedData)

      // Affichage du toast de succès
      toasterRef.current?.show({
        title: isRTL ? "تم الحفظ بنجاح" : "Enregistrement réussi",
        message: isRTL
          ? "تم حفظ تعديلات تاريخ الإجازات بنجاح."
          : `Les modifications de l'historique des congés ont été sauvegardées avec succès.`,
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
          ? "حدث خطأ أثناء حفظ تاريخ الإجازات."
          : `Une erreur s'est produite lors de la sauvegarde de l'historique des congés.`,
        variant: "error",
        duration: 5000,
        position: "top-right",
      })
    }
  }

  // Gestionnaires d'ouverture et fermeture des dialogues
  const openDialog = (dialogType: string) => {
    setActiveDialog(dialogType)
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 ${isRTL ? "text-start" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Left Column - Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Charts Section */}
        <LeaveDistributionChart
          leaveStats={leaveStats}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
          cardSubtitleFontClass={cardSubtitleFontClass}
          jazeeraFontClass={jazeeraFontClass}
        />

        {/* Leaves and Absences Tabs */}
        <Card
          title={isRTL ? "تاريخ الإجازات والغيابات" : "Historique des Congés et Absences"}
          icon={FileText}
          edit={true}
          animationDelay="0.4s"
          onEdit={() => {
            // Ouvrir le dialogue correspondant à l'onglet actif
            if (currentActiveTab === "conges") {
              openDialog("conges")
            } else if (currentActiveTab === "absences") {
              openDialog("absences")
            }
          }}
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <LeavesTabsComponent
            conges={data.conges || []}
            absences={data.absences || []}
            onEdit={setCurrentActiveTab}
            isRTL={isRTL}
            cardSubtitleFontClass={cardSubtitleFontClass}
            tableNotoFontClass={tableNotoFontClass}
            jazeeraFontClass={jazeeraFontClass}
          />
        </Card>
      </div>

      {/* Right Column - Sidebar */}
      <div className="space-y-6">
        {/* Notifications */}
        <Card
          title={isRTL ? "الإشعارات" : "Notifications"}
          icon={AlertCircle}
          animationDelay="0.3s"
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="space-y-3">
            <NotificationItem
              type="warning"
              message={isRTL ? "إجازة في انتظار الموافقة" : "Congé en attente d'approbation"}
              date={isRTL ? "قبل ساعتين" : "Il y a 2 heures"}
              isRTL={isRTL}
              cardSubtitleFontClass={cardSubtitleFontClass}
            />
            <NotificationItem
              type="success"
              message={isRTL ? "تم اعتماد إجازة 15-18 جوان" : "Congé approuvé du 15-18 Juin"}
              date={isRTL ? "قبل يوم" : "Il y a 1 jour"}
              isRTL={isRTL}
              cardSubtitleFontClass={cardSubtitleFontClass}
            />
          </div>
        </Card>

        {/* Leave Balance */}
        <Card
          title={isRTL ? "رصيد الإجازات" : "Solde Congés"}
          icon={Clock}
          animationDelay="0.6s"
          isRTL={isRTL}
          titleFontClass={titleFontClass}
        >
          <div className="space-y-3.5">
            {leaveStatsForBalance.map((stat) => (
              <div key={stat.name} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className={`text-sm text-gray-600 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                    {translateLeaveType(stat.name, isRTL)}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium text-gray-900 dark:text-gray-300 ${jazeeraFontClass}`}>
                    {stat.value} {isRTL ? (stat.value > 1 ? "أيام" : "يوم") : stat.value > 1 ? "jours" : "jour"}
                  </div>
                  <div className={`text-xs text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                    {stat.used} {isRTL ? "مستخدم" : stat.used > 1 ? "utilisés" : "utilisé"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Composant EditDialogs */}
      {activeDialog && (
        <EditDialogs
          data={data}
          onSave={handleSave}
          activeDialog={activeDialog}
          onClose={closeDialog}
          onEmployeeUpdate={onEmployeeUpdate}
        />
      )}

      {/* Composant Toast */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}

// Composant Tabs pour Congés et Absences
function LeavesTabsComponent({
  conges,
  absences,
  onEdit,
  isRTL = false,
  cardSubtitleFontClass = "",
  tableNotoFontClass = "",
  jazeeraFontClass = "",
}: {
  conges: any[]
  absences: any[]
  onEdit?: (tabType: string) => void
  isRTL?: boolean
  cardSubtitleFontClass?: string
  tableNotoFontClass?: string
  jazeeraFontClass?: string
}) {
  const [activeTab, setActiveTab] = useState("conges")

  // Notifier le parent du changement d'onglet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (onEdit) {
      onEdit(tab)
    }
  }

  // Fonction pour formater les dates des absences (format YYYY-MM-DD)
  const formatAbsenceDate = (dateStr: string | null | undefined, isRTL = false) => {
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

  // Fonction pour traduire les types de congés
  const translateLeaveType = (type: string, rtl: boolean) => {
    const translations: { [key: string]: string } = {
      "سنوية": rtl ? "سنوية" : "Annuel",
      "مرض": rtl ? "مرض" : "Maladie", 
      "طارئة": rtl ? "طارئة" : "Exceptionnel",
      "زواج": rtl ? "زواج" : "Mariage",
      "أمومة": rtl ? "أمومة" : "Maternité",
      "بدون راتب": rtl ? "بدون راتب" : "Sans Solde",
    }
    return translations[type] || type
  }

  // Formatage des dates pour les congés (format DD-MM-YYYY)
  const formatLeaveDate = (dateStr: string | null | undefined, rtl = false): string => {
    if (!dateStr) return rtl ? "غير محدد" : "Non définie"

    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return rtl ? "غير محدد" : "Non définie"

      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${year}-${month}-${day}`
    } catch {
      return rtl ? "غير محدد" : "Non définie"
    }
  }

  // Données récentes des congés
  const recentLeaves = useMemo(() => {
    if (!conges || conges.length === 0) return []

    return conges
      .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime())
      .slice(0, 5)
      .map((conge: any) => {
        // Utiliser le statut de la base de données s'il existe, sinon calculer basé sur les dates
        const getStatus = () => {
          // Utiliser d'abord le statut de la base de données s'il existe et n'est pas vide
          if (conge.statut && conge.statut.trim() !== '') {
            return conge.statut
          }
          
          // Fallback sur le calcul par dates si le statut n'est pas défini
          if (!conge.date_fin) return isRTL ? "قيد التنفيذ" : "En Cours"

          const currentDate = new Date()
          const endDate = new Date(conge.date_fin)

          return endDate < currentDate ? (isRTL ? "منتهية" : "Terminé") : isRTL ? "قيد التنفيذ" : "En Cours"
        }

        return {
          id: conge.id,
          type: conge.type_conge,
          startDate: conge.date_debut,
          endDate: conge.date_fin,
          days: conge.duree,
          status: getStatus(),
        }
      })
  }, [conges, isRTL])

  return (
    <div className="w-full">
      {/* En-têtes des onglets */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
        <button
          onClick={() => handleTabChange("conges")}
          className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "conges"
              ? "text-[#076784] border-[#076784]"
              : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
          }`}
        >
          <div className={`flex items-center justify-center gap-2`}>
            <FileText className="w-4 h-4" />
            <span className={cardSubtitleFontClass}>{isRTL ? "الإجــــازات" : "Congés"}</span>
          </div>
        </button>
        <button
          onClick={() => handleTabChange("absences")}
          className={`w-44 cursor-pointer px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === "absences"
              ? "text-[#076784] border-[#076784]"
              : "text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-300 hover:border-gray-300"
          }`}
        >
          <div className={`flex items-center justify-center gap-2`}>
            <CalendarX className="w-4 h-4" />
            <span className={cardSubtitleFontClass}>{isRTL ? "الغيــــابـــــات" : "Absences"}</span>
          </div>
        </button>
      </div>

      {/* Content des onglets */}
      <div className="h-[320px]">
        {activeTab === "conges" && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th
                    className={`text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "النـــوع" : "Type"}
                  </th>
                  <th
                    className={`text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "تاريخ البــدايـــة" : "Date Début"}
                  </th>
                  <th
                    className={`text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "تاريخ النهــايـــة" : "Date Fin"}
                  </th>
                  <th
                    className={`text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "المــــدة" : "Durée"}
                  </th>
                  <th
                    className={`text-start py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "الحــالــــــة" : "Statut"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.length > 0 ? (
                  recentLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td
                        className={`py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}
                      >
                        {translateLeaveType(leave.type, isRTL)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                        {formatLeaveDate(leave.startDate, isRTL)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                        {formatLeaveDate(leave.endDate, isRTL)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                        {leave.days} {isRTL ? (leave.days > 1 ? "أيام" : "يوم") : leave.days > 1 ? "jours" : "jour"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={leave.status}
                          isRTL={isRTL}
                          cardSubtitleFontClass={cardSubtitleFontClass}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className={`py-4 text-center text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "لم يتم تسجيل أي إجازة" : "Aucun congé enregistré"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "absences" && (
          <div className="h-full overflow-y-auto overflow-x-auto">
            {!absences || absences.length === 0 ? (
              <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}>
                {isRTL ? "لم يتم تسجيل أي غياب" : "Aucune absence enregistrée"}
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-12 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "رقم" : "N°"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ البداية" : "Date Début"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-40 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "مرجع البداية" : "Référence Début"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "تاريخ النهاية" : "Date Fin"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-40 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "مرجع النهاية" : "Référence Fin"}
                    </th>
                    <th
                      className={`px-3 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-24 ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? "المدة" : "Durée"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {[...(absences || [])]
                    .sort((a, b) => new Date(b.date_debut || 0).getTime() - new Date(a.date_debut || 0).getTime())
                    .map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {index + 1}
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {formatAbsenceDate(item.date_debut, isRTL)}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.reference_debut || (isRTL ? "غير محدد" : "Non défini")}
                          </span>
                        </td>
                        <td className={`px-3 py-4 text-sm text-gray-700 dark:text-gray-300 ${tableNotoFontClass}`}>
                          {formatAbsenceDate(item.date_fin, isRTL)}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className={`px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium ${cardSubtitleFontClass}`}
                          >
                            {item.reference_fin || (isRTL ? "غير محدد" : "Non défini")}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-gray-900 dark:text-white font-medium ${tableNotoFontClass}`}
                        >
                          {item.duree ? `${item.duree} ${isRTL ? "يوم" : "jours"}` : isRTL ? "غير محدد" : "Non défini"}
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

// Composants réutilisés

function StatusBadge({
  status,
  isRTL = false,
  cardSubtitleFontClass = "",
}: {
  status: string
  isRTL?: boolean
  cardSubtitleFontClass?: string
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Terminé":
      case "منتهية":
        return { color: "text-green-600", icon: CheckCircle, bg: "bg-green-100" }
      case "En Cours":
      case "قيد التنفيذ":
        return { color: "text-blue-600", icon: Clock, bg: "bg-blue-100" }
      case "En Attente":
      case "في الانتظار":
        return { color: "text-yellow-600", icon: Clock, bg: "bg-yellow-100" }
      case "Refusé":
      case "مرفوض":
        return { color: "text-red-600", icon: XCircle, bg: "bg-red-100" }
      default:
        return { color: "text-gray-600", icon: AlertCircle, bg: "bg-gray-100" }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div className={`flex items-center space-x-1 ${config.bg} px-2 py-1 rounded-full w-fit`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color} ${cardSubtitleFontClass}`}>{status}</span>
    </div>
  )
}

function NotificationItem({
  type,
  message,
  date,
  isRTL = false,
  cardSubtitleFontClass = "",
}: {
  type: "success" | "warning" | "error"
  message: string
  date: string
  isRTL?: boolean
  cardSubtitleFontClass?: string
}) {
  const colors = {
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  }

  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
  }

  const Icon = icons[type]

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
      <Icon className={`h-4 w-4 mt-0.5 ${colors[type]}`} />
      <div className="flex-1">
        <p className={`text-sm text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>{message}</p>
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${cardSubtitleFontClass}`}>{date}</p>
      </div>
    </div>
  )
}

interface LeaveDistributionChartProps {
  leaveStats: {
    name: string
    value: number
    used: number
    color: string
    remaining: number
  }[]
  isRTL?: boolean
  titleFontClass?: string
  cardSubtitleFontClass?: string
  jazeeraFontClass?: string
}

function LeaveDistributionChart({
  leaveStats,
  isRTL = false,
  titleFontClass = "",
  cardSubtitleFontClass = "",
  jazeeraFontClass = "",
}: LeaveDistributionChartProps) {
  // Fonction utilitaire pour formater les pourcentages selon RTL/LTR
  const formatPercentage = (value: number, isRTL: boolean): string => {
    return isRTL ? `%${value.toFixed(1)}` : `${value.toFixed(1)}%`
  }

  // Fonction pour traduire les types de congés - version mise à jour pour les valeurs arabes
  const translateLeaveType = (type: string, rtl: boolean) => {
    const translations: { [key: string]: string } = {
      "سنوية": rtl ? "سنوية" : "Annuel",
      "مرض": rtl ? "مرض" : "Maladie", 
      "طارئة": rtl ? "طارئة" : "Exceptionnel",
      "زواج": rtl ? "زواج" : "Mariage",
      "أمومة": rtl ? "أمومة" : "Maternité",
      "بدون راتب": rtl ? "بدون راتب" : "Sans Solde",
    }
    return translations[type] || type
  }

  // Fonction personnalisée pour le tooltip du graphique
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalUsed > 0 ? ((data.value / totalUsed) * 100).toFixed(1) : "0"
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <div className={`font-medium text-gray-900 dark:text-white ${cardSubtitleFontClass}`}>
            {translateLeaveType(data.name, isRTL)}
          </div>
          <div className={`text-sm text-gray-600 dark:text-gray-400 ${cardSubtitleFontClass}`}>
            {data.value} {isRTL ? (data.value > 1 ? "أيام" : "يوم") : (data.value > 1 ? "jours" : "jour")} ({percentage}%)
          </div>
        </div>
      )
    }
    return null
  }
  const pieData = leaveStats.map((stat) => ({
    name: stat.name,
    value: stat.used,
    color: stat.color,
  }))

  const totalUsed = pieData.reduce((sum, entry) => sum + entry.value, 0)

  // Données par défaut quand aucune donnée n'est disponible
  const defaultPieData = [
    {
      name: isRTL ? "لا توجد بيانات" : "Aucune donnée",
      value: 1,
      color: "#e5e7eb", // gray-200
    },
  ]

  // Utiliser les données par défaut si totalUsed est 0, sinon filtrer les valeurs 0
  const displayPieData = totalUsed > 0 ? pieData.filter(item => item.value > 0) : defaultPieData
  const hasData = totalUsed > 0

  return (
    <Card
      title={isRTL ? "توزيع الإجازات" : "Répartition des Congés"}
      icon={TrendingUp}
      animationDelay="0.3s"
      isRTL={isRTL}
      titleFontClass={titleFontClass}
    >
      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Table à gauche */}
        <div className="col-span-2">
          <table className="w-full ml-4">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="py-2"></th>
                <th
                  className={`text-start py-2 text-sm font-bold text-gray-600 dark:text-gray-400 w-1/3 ${cardSubtitleFontClass}`}
                >
                  {isRTL ? "الفئة" : "Catégorie"}
                </th>
                <th
                  className={`text-start py-2 text-sm font-bold text-gray-600 dark:text-gray-400 w-1/3 ${cardSubtitleFontClass}`}
                >
                  {isRTL ? "الأيام" : "Jours"}
                </th>
                <th
                  className={`text-start py-2 text-sm font-bold text-gray-600 dark:text-gray-400 w-1/3 ${cardSubtitleFontClass}`}
                >
                  {isRTL ? "النسبة" : "Pourcentage"}
                </th>
              </tr>
            </thead>
            <tbody>
              {(hasData ? pieData : []).map((entry) => (
                <tr key={entry.name} className="border-b border-gray-100 dark:border-gray-600">
                  <td className="py-2 text-right pr-4 pl-4">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                  </td>
                  <td className={`py-2 text-sm text-gray-700 dark:text-gray-300 ${jazeeraFontClass}`}>
                    {translateLeaveType(entry.name, isRTL)}
                  </td>
                  <td className={`py-2 text-sm text-gray-700 dark:text-gray-300 ${jazeeraFontClass}`}>{entry.value}</td>
                  <td className={`py-2 text-sm text-gray-700 dark:text-gray-300 ${jazeeraFontClass}`}>
                    {totalUsed > 0 ? formatPercentage((entry.value / totalUsed) * 100, isRTL) : formatPercentage(0, isRTL)}
                  </td>
                </tr>
              ))}
              {/* État par défaut si pas de données */}
              {!hasData && (
                <tr>
                  <td colSpan={4} className="py-8">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p
                        className={`text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 ${cardSubtitleFontClass}`}
                      >
                        {isRTL ? "لا توجد بيانات متاحة" : "Aucune donnée disponible"}
                      </p>
                      <p className={`text-xs text-gray-400 dark:text-gray-500 ${cardSubtitleFontClass}`}>
                        {isRTL ? "لم يتم تسجيل أي إجازة بعد" : "Aucun congé enregistré"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {/* Ligne Total - seulement si on a des données */}
              {hasData && (
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td className="py-2"></td>
                  <td className={`py-2 text-sm text-gray-900 dark:text-white ${jazeeraFontClass}`}>
                    {isRTL ? "الإجمالي" : "Total"}
                  </td>
                  <td className={`py-2 text-sm text-gray-900 dark:text-white ${jazeeraFontClass}`}>{totalUsed}</td>
                  <td className={`py-2 text-sm text-gray-900 dark:text-white ${jazeeraFontClass}`}>{formatPercentage(100, isRTL)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Graphique à droite */}
        <div className="col-span-1">
          <div className="w-full h-56 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={108}
                  paddingAngle={hasData ? 1 : 0}
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {hasData && <Tooltip content={customTooltip} />}
              </PieChart>
            </ResponsiveContainer>
            {/* Texte au centre du graphique pour l'état par défaut */}
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={`text-lg font-medium text-gray-400 dark:text-gray-500 ${cardSubtitleFontClass}`}>
                    {isRTL ? "0 يوم" : "0 jour"}
                  </p>
                  <p className={`text-xs text-gray-300 dark:text-gray-600 ${cardSubtitleFontClass}`}>
                    {isRTL ? "مستخدم" : "utilisé"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
