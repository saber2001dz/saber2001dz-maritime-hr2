"use client"

import React, { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { TrendingUp, TrendingDown, Minus, FileText, Ship, Building2, Calendar, UserCheck, UserX } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { GenderRadialChart } from "@/components/dashboard/GenderRadialChart"
import { EmployeesAreaChart } from "@/components/dashboard/EmployeesAreaChart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarLeavesChart } from "@/components/dashboard/BarLeavesChart"
import { ChartRadarOfficier, ChartRadarSousOfficier } from "@/components/dashboard/GradeRadarChart"
import { CongesByTypePopover } from "@/components/dashboard/CongesByTypePopover"
import { SuspendedEmployeesPopover } from "@/components/dashboard/SuspendedEmployeesPopover"
import { AbsentEmployeesPopover } from "@/components/dashboard/AbsentEmployeesPopover"
import { useSuspendedEmployees } from "@/hooks/dashboard/useSuspendedEmployees"
import { useSuspendedEmployeesTrend } from "@/hooks/dashboard/useSuspendedEmployeesTrend"
import { useCongesEmployeesTrend } from "@/hooks/dashboard/useCongesEmployeesTrend"
import { useAbsentEmployees } from "@/hooks/dashboard/useAbsentEmployees"
import { useAbsentEmployeesTrend } from "@/hooks/dashboard/useAbsentEmployeesTrend"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/motion-primitives/animated-number"
import type { DashboardData } from "@/types/dashboard"
import { useParams } from "next/navigation"
import { sortEmployeesByHierarchy } from "@/utils/employee.utils"
import { useEmployeeMonthlyStats } from "@/hooks/dashboard/useEmployeeMonthlyStats"

interface DashboardContentProps {
  data: DashboardData
}

export function DashboardContent({ data }: DashboardContentProps) {
  const [selectedChart, setSelectedChart] = useState("grade")
  const [monthsLimit, setMonthsLimit] = useState(6)
  const params = useParams()
  const isRTL = params.locale === "ar"


  // Charger les statistiques mensuelles selon la période sélectionnée
  const { data: monthlyStatsData, isLoading: isLoadingMonthlyStats } = useEmployeeMonthlyStats(monthsLimit)

  // Charger les données des employés suspendus
  const { totalSuspended, isLoading: isLoadingSuspended } = useSuspendedEmployees()

  // Charger les données des employés absents
  const { totalAbsent, isLoading: isLoadingAbsent } = useAbsentEmployees()

  // Charger les tendances pour les employés suspendus, absents et en congé
  const { trendData: suspendedTrend, isLoading: isLoadingSuspendedTrend } = useSuspendedEmployeesTrend(isRTL)
  const { trendData: absentTrend, isLoading: isLoadingAbsentTrend } = useAbsentEmployeesTrend(isRTL)
  const { trendData: congesTrend, isLoading: isLoadingCongesTrend } = useCongesEmployeesTrend(isRTL)

  // Fonction pour calculer les totaux des grades
  const calculateGradeTotals = () => {
    const officerTotal = data.officerGradesData?.reduce((sum, item) => sum + item.count, 0) || 0
    const ncoTotal = data.ncoGradesData?.reduce((sum, item) => sum + item.count, 0) || 0
    return { officerTotal, ncoTotal }
  }

  // Fonction pour convertir la valeur du select en nombre de mois
  const periodToMonths = (period: string): number => {
    switch (period) {
      case "3months":
        return 3
      case "4months":
        return 4
      case "6months":
        return 6
      case "8months":
        return 8
      case "1year":
        return 12
      default:
        return 6
    }
  }

  // Fonction pour gérer le changement de période
  const handlePeriodChange = (value: string) => {
    const months = periodToMonths(value)
    setMonthsLimit(months)
  }

  // Fonction pour formatter les données de statistiques d'employés pour le chart
  const formatEmployeeStatsForChart = () => {
    // Utiliser monthlyStatsData si disponible, sinon fallback sur data.employeeMonthlyStatistics
    const statsToUse = monthlyStatsData.length > 0 ? monthlyStatsData : data.employeeMonthlyStatistics

    if (!statsToUse || statsToUse.length === 0) {
      return []
    }

    // Mapping des mois en anglais pour la cohérence avec BarLeavesChart
    const monthsInEnglish = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const monthTranslations = {
      January: isRTL ? "جانفي" : "Jan",
      February: isRTL ? "فيفري" : "Fév",
      March: isRTL ? "مارس" : "Mar",
      April: isRTL ? "أفريل" : "Avr",
      May: isRTL ? "ماي" : "Mai",
      June: isRTL ? "جوان" : "Juin",
      July: isRTL ? "جويلية" : "Juil",
      August: isRTL ? "أوت" : "Août",
      September: isRTL ? "سبتمبر" : "Sep",
      October: isRTL ? "أكتوبر" : "Oct",
      November: isRTL ? "نوفمبر" : "Nov",
      December: isRTL ? "ديسمبر" : "Déc",
    }

    return statsToUse.map((stat: any) => {
      const date = new Date(stat.period_date)
      const monthIndex = date.getMonth()
      const monthInEnglish = monthsInEnglish[monthIndex]
      const translatedMonth = monthTranslations[monthInEnglish as keyof typeof monthTranslations] || monthInEnglish

      return {
        month: translatedMonth,
        employees: stat.total_employees,
      }
    })
  }

  // Fonction pour calculer la tendance des congés
  const calculateCongesTrend = (chartData?: any[]) => {
    if (!chartData)
      return {
        text: isRTL ? "جاري تحميل البيانات..." : "Chargement des données...",
        period: "",
        trend: "loading",
      }

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const previousYear = currentYear - 1
    const currentMonth = currentDate.getMonth()

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const monthsInFrench = {
      January: "Janvier",
      February: "Février",
      March: "Mars",
      April: "Avril",
      May: "Mai",
      June: "Juin",
      July: "Juillet",
      August: "Août",
      September: "Septembre",
      October: "Octobre",
      November: "Novembre",
      December: "Décembre",
    }

    const monthsInArabic = {
      January: "جانفي",
      February: "فيفري",
      March: "مارس",
      April: "أفريل",
      May: "ماي",
      June: "جوان",
      July: "جويلية",
      August: "أوت",
      September: "سبتمبر",
      October: "أكتوبر",
      November: "نوفمبر",
      December: "ديسمبر",
    }

    let totalCurrentYear = 0
    let totalPreviousYear = 0

    // Calculer les totaux depuis janvier jusqu'au mois actuel
    for (let i = 0; i <= currentMonth; i++) {
      const monthName = months[i]
      const monthData = chartData.find((item) => item.month === monthName)

      if (monthData) {
        // Utiliser directement les propriétés currentYear et previousYear des données
        totalCurrentYear += monthData.currentYear || 0
        totalPreviousYear += monthData.previousYear || 0
      }
    }

    const currentMonthName = months[currentMonth]
    const currentMonthFrench = monthsInFrench[currentMonthName as keyof typeof monthsInFrench]
    const currentMonthArabic = monthsInArabic[currentMonthName as keyof typeof monthsInArabic]
    const currentMonthTranslated = isRTL ? currentMonthArabic : currentMonthFrench

    // Cas où il n'y a pas de données de l'année précédente
    if (totalPreviousYear === 0) {
      if (totalCurrentYear > 0)
        return {
          text: isRTL
            ? `نشاط إجازات جديد في ${currentYear}`
            : `Nouvelle activité de congés en ${currentYear}`,
          period: isRTL
            ? `جانفي - ${currentMonthTranslated}`
            : `Janvier - ${currentMonthFrench}`,
          trend: "up",
        }
      return {
        text: isRTL ? "لا توجد بيانات إجازات متاحة" : "Aucune donnée de congés disponible",
        period: isRTL
          ? `جانفي - ${currentMonthTranslated}`
          : `Janvier - ${currentMonthFrench}`,
        trend: "neutral",
      }
    }

    // Calcul du pourcentage de changement avec protection contre la division par zéro
    const percentageChange =
      totalPreviousYear > 0
        ? ((totalCurrentYear - totalPreviousYear) / totalPreviousYear) * 100
        : totalCurrentYear > 0
        ? 100
        : 0

    if (Math.abs(percentageChange) < 1) {
      return {
        text: isRTL
          ? `مستوى إجازات مستقر مقارنة بـ ${previousYear}`
          : `Niveau de congés stable par rapport à ${previousYear}`,
        period: isRTL
          ? `جانفي - ${currentMonthTranslated}`
          : `Janvier - ${currentMonthFrench}`,
        trend: "neutral",
      }
    }

    const trend = percentageChange > 0 ? "up" : "down"
    const trendText = percentageChange > 0 ? (isRTL ? "زيادة" : "Augmentation") : (isRTL ? "انخفاض" : "Diminution")
    const absPercentage = Math.abs(percentageChange).toFixed(1)

    return {
      text: `${trendText} ${isRTL ? "بنسبة" : "de"} ${isRTL ? `%${absPercentage}` : `${absPercentage}%`} ${
        isRTL ? "مقارنة بـ" : "vs"
      } ${previousYear}`,
      period: isRTL
        ? `جانفي - ${currentMonthTranslated}`
        : `Janvier - ${currentMonthFrench}`,
      trend,
    }
  }

  // Fonction pour obtenir l'icône et le style selon la tendance
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return { icon: TrendingUp, className: "h-4 w-4 text-green-600" }
      case "down":
        return { icon: TrendingDown, className: "h-4 w-4 text-red-600" }
      case "neutral":
        return { icon: Minus, className: "h-4 w-4 text-gray-500" }
      default:
        return { icon: TrendingUp, className: "h-4 w-4 text-gray-400" }
    }
  }

  // Configuration du contenu pour chaque type de chart
  const congesTrendData = calculateCongesTrend(data.congesData)
  const { officerTotal, ncoTotal } = calculateGradeTotals()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const previousYear = currentYear - 1

  const chartConfig = {
    conges: {
      title: isRTL ? "مخــطط - عــدد أيــام الإجــازات" : "Bar Chart - Jours de Congé",
      description: `${previousYear} - ${currentYear}`,
      footer: congesTrendData.text,
      period: congesTrendData.period,
      trend: congesTrendData.trend,
    },
    grade: {
      title: isRTL ? "مخــطط - التوزيع حسب الــرتب" : "Radar Chart - Répartition par Grade",
      description: isRTL ? "ضباط - ضباط صف" : "Officiers - Sous-Officiers",
      footer: isRTL ? "توزيع الأفراد حسب الرتب" : "Analyse des effectifs par grade",
      period: "",
      trend: "neutral",
    },
    funnel: {
      title: isRTL ? "مخــطط - تــدفق المــوظفيــن" : "Funnel Chart - Flux Personnel",
      description: isRTL ? "عملية التوظيف" : "Processus de recrutement",
      footer: isRTL ? "المخطط قيد التطوير" : "Chart en développement",
      period: "",
      trend: "neutral",
    },
  }

  // Traitement des données des employés avec tri complexe
  const employees = React.useMemo(() => {
    if (!data.colonelMajorEmployees) return []

    // Les données sont déjà traitées par processEmployeeData dans le hook fetchRecentEmployees
    // Appliquer directement le tri hiérarchique centralisé et limiter aux 3 premiers
    return sortEmployeesByHierarchy(data.colonelMajorEmployees).slice(0, 3)
  }, [data.colonelMajorEmployees])

  // Appliquer le même tri que la table des unités (par unite_rang + nom alphabétique)
  const sortedRecentUnites = useMemo(() => {
    if (!data.recentUnites || data.recentUnites.length === 0) return []

    return [...data.recentUnites].sort((a: any, b: any) => {
      // Tri primaire : par unite_rang (ordre croissant)
      const rankA = a.unite_rang ?? 999
      const rankB = b.unite_rang ?? 999

      if (rankA !== rankB) {
        return rankA - rankB
      }

      // Tri secondaire : par nom d'unité (alphabétique)
      const nameA = a.unite || ""
      const nameB = b.unite || ""
      return nameA.localeCompare(nameB, "fr", { sensitivity: "base" })
    })
  }, [data.recentUnites])

  // Calculer le total des employés (prendre le dernier mois disponible)
  const calculateEmployeesTotal = () => {
    // Utiliser monthlyStatsData si disponible, sinon fallback sur data.employeeMonthlyStatistics
    const statsToUse = monthlyStatsData.length > 0 ? monthlyStatsData : data.employeeMonthlyStatistics

    if (!statsToUse || statsToUse.length === 0) {
      return "0"
    }

    // Prendre le dernier mois de la période (le plus récent)
    const latestMonth = statsToUse[statsToUse.length - 1]
    return latestMonth?.total_employees?.toString() || "0"
  }

  // Données dynamiques basées sur les vraies statistiques
  const expensesData = {
    amount: calculateEmployeesTotal(),
    label: isRTL ? "إجمــالــي الأفـــــراد" : "Total des Employées",
  }

  const orderSectionsData = [
    {
      title: isRTL ? "إجمـالـي الــوحـــدات" : "Total des unités",
      value: data.uniteStats?.total?.toString() || "0",
      icon: Building2,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: isRTL ? "الــوحـــدات الإداريــــة" : "Total des unités administratives",
      value: data.uniteStats?.administrative?.toString() || "0",
      icon: FileText,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: isRTL ? "الــوحـــدات النشيطـــــة" : "Total des unités opérationnelles",
      value: data.uniteStats?.operational?.toString() || "0",
      icon: Ship,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
  ]

  const bottomStatsData = [
    {
      title: isRTL ? "إجمالي الموظفين في إجازة" : "Total Employees en Conges",
      value: data.employeeStatistics?.conges?.toString() || "0",
      changeValue: isLoadingCongesTrend
        ? ""
        : congesTrend?.changeValue || data.employeeTrends?.conges?.changeValue || "",
      changeText: isLoadingCongesTrend
        ? (isRTL ? "جاري التحميل..." : "Chargement...")
        : congesTrend?.changeText || data.employeeTrends?.conges?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: isLoadingCongesTrend
        ? ("no_data" as const)
        : congesTrend?.changeType || data.employeeTrends?.conges?.changeType || ("no_data" as const),
      icon: Calendar,
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: isRTL ? "إجمالي الموظفين الموقوفين عن العمل" : "Total Employés Suspendus",
      value: isLoadingSuspended ? "..." : totalSuspended.toString(),
      changeValue: isLoadingSuspendedTrend ? "" : suspendedTrend?.changeValue || "",
      changeText: isLoadingSuspendedTrend
        ? (isRTL ? "جاري التحميل..." : "Chargement...")
        : suspendedTrend?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: isLoadingSuspendedTrend ? ("no_data" as const) : suspendedTrend?.changeType || ("no_data" as const),
      icon: UserX,
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      title: isRTL ? "إجمالي الموظفين المتغيبين" : "Total Employés Absents",
      value: isLoadingAbsent ? "..." : totalAbsent.toString(),
      changeValue: isLoadingAbsentTrend ? "" : absentTrend?.changeValue || "",
      changeText: isLoadingAbsentTrend
        ? (isRTL ? "جاري التحميل..." : "Chargement...")
        : absentTrend?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: isLoadingAbsentTrend ? ("no_data" as const) : absentTrend?.changeType || ("no_data" as const),
      icon: UserCheck,
      iconColor: "text-amber-500 dark:text-amber-400",
    },
  ]

  const cardStyles = "bg-card rounded-md shadow-sm border-0"
  const viewAllButtonBaseClasses = "px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer"
  const viewAllButtonTextColor = "#197791"

  // Fonction pour obtenir l'icône selon le type d'unité
  const getUniteIcon = (navigante: boolean) => {
    return navigante ? (
      <Ship className="w-5 h-5" style={{ color: "#076784" }} />
    ) : (
      <Building2 className="w-5 h-5" style={{ color: "#076784" }} />
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-8">
        <h1 className={`text-2xl ${isRTL ? 'font-jazeera-bold' : 'font-medium'} text-foreground`}>
          {isRTL ? "لوحة المعلومات" : "Tableau de bord"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 mb-6">
        {/* === CARD : Total des employés avec graphique d'évolution mensuelle === */}
        {/* Affiche le nombre total d'employés avec animation et graphique en aire des statistiques mensuelles */}
        <Card className="flex flex-col h-75 overflow-hidden pl-1">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle
                  className={`text-[20px] font-semibold ${isRTL ? 'font-noto-naskh-arabic font-medium' : 'font-medium'} text-gray-700 dark:text-gray-300 pb-1`}
                >
                  {expensesData.label}
                </CardTitle>
                <AnimatedNumber
                  className="text-3xl font-bold text-foreground"
                  springOptions={{
                    bounce: 0,
                    duration: 2000,
                  }}
                  value={Number(expensesData.amount)}
                />
              </div>

              <Select dir={isRTL ? "rtl" : "ltr"} defaultValue="6months" onValueChange={handlePeriodChange}>
                <SelectTrigger
                  className={`w-23.75 rounded focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus:outline-none ${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "3 أشهر" : "3 mois"}
                  </SelectItem>
                  <SelectItem value="4months" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "4 أشهر" : "4 mois"}
                  </SelectItem>
                  <SelectItem value="6months" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "6 أشهر" : "6 mois"}
                  </SelectItem>
                  <SelectItem value="8months" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "8 أشهر" : "8 mois"}
                  </SelectItem>
                  <SelectItem value="1year" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "سنـــــة" : "1 an"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="-mt-5 -ms-6">
            <EmployeesAreaChart
              data={formatEmployeeStatsForChart()}
              config={{
                employees: {
                  label: isRTL ? "الموظفون" : "Employés",
                  color: "#8884d8",
                },
              }}
              xAxisKey="month"
              lineKey="employees"
              rtl={isRTL}
            />
          </CardContent>
        </Card>

        <div className="grid grid-rows-2 gap-6">
          {/* === CARD : Statistiques des unités === */}
          {/* Affiche les statistiques des unités : total, administratives et opérationnelles avec icônes */}
          <Card className="p-4 md:p-6 flex flex-col justify-center h-35 overflow-hidden bg-card rounded-md shadow-sm border-0">
            <h3 className={`text-[20px] font-semibold ${isRTL ? 'font-noto-naskh-arabic font-medium' : 'font-medium'} text-gray-700 dark:text-gray-300 pb-3 pl-4`}>
              {isRTL ? "إحصــائيـــات الــوحــــدات" : "Statistiques des Unités"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 pl-4 gap-x-4 gap-y-4 w-full">
              {orderSectionsData.map((section) => {
                const IconComponent = section.icon
                return (
                  <div key={section.title} className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-md ${section.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${section.iconColor}`} />
                    </div>
                    <div>
                      <p className={`text-[16px] text-muted-foreground whitespace-nowrap ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                        {section.title}
                      </p>
                      <p className="text-xl font-semibold text-foreground">{section.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          {/* === CARDS : Statistiques employées individuelles === */}
          {/* Trois cards affichant les statistiques spécifiques (congés, suspendus, opérationnel) avec tendances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bottomStatsData.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={index}
                  className="p-4 md:p-6 flex flex-col h-33.75 overflow-hidden bg-card rounded-md shadow-sm border-0"
                >
                  <div className="flex items-center justify-between -mt-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[16px] font-medium text-muted-foreground ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                        {stat.title}
                      </p>
                      {/* Ajouter le bouton popover pour les congés */}
                      {index === 0 && <CongesByTypePopover />}
                      {/* Ajouter le bouton popover pour les employés suspendus */}
                      {index === 1 && <SuspendedEmployeesPopover />}
                      {/* Ajouter le bouton popover pour les employés absents */}
                      {index === 2 && <AbsentEmployeesPopover />}
                    </div>
                    <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>

                  <div className="mt-auto">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center text-xs gap-1">
                      <span className={`${isRTL ? 'font-noto-naskh-arabic' : ''}`}>{stat.changeText}</span>
                      {stat.changeValue && (
                        <span
                          className={`${
                            stat.changeType === "increase"
                              ? "text-green-600"
                              : stat.changeType === "decrease"
                              ? "text-red-600"
                              : "text-gray-500"
                          } font-medium`}
                        >
                          {stat.changeValue}
                        </span>
                      )}
                      {stat.changeTextEnd && <span className={`${isRTL ? 'font-noto-naskh-arabic' : ''}`}>{stat.changeTextEnd}</span>}
                      {stat.changeType !== "no_data" && (
                        <>
                          {stat.changeType === "increase" && (
                            <TrendingUp
                              className={`w-3.5 h-3.5 text-green-600 dark:text-green-400`}
                              style={{
                                transform: isRTL ? "scaleX(-1)" : "none",
                              }}
                            />
                          )}
                          {stat.changeType === "decrease" && (
                            <TrendingDown
                              className={`w-3.5 h-3.5 text-red-600 dark:text-red-400`}
                              style={{
                                transform: isRTL ? "scaleX(-1)" : "none",
                              }}
                            />
                          )}
                          {stat.changeType === "stable" && (
                            <Minus
                              className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400`}
                              style={{
                                transform: isRTL ? "scaleX(-1)" : "none",
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" style={{ height: "auto" }}>
        {/* === CARD : Graphiques interactifs avec sélecteur === */}
        {/* Zone principale des graphiques (congés, grades, funnel) avec sélecteur de type et animations */}
        <Card className={`lg:col-span-2 px-3 text-start`} dir={isRTL ? "rtl" : "ltr"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {selectedChart === "conges" && (
                  <motion.div
                    key="conges-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <CardTitle className={`${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>{chartConfig.conges.title}</CardTitle>
                    <CardDescription>{chartConfig.conges.description}</CardDescription>
                  </motion.div>
                )}
                {selectedChart === "grade" && (
                  <motion.div
                    key="grade-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <CardTitle className={`${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>{chartConfig.grade.title}</CardTitle>
                    <CardDescription>{chartConfig.grade.description}</CardDescription>
                  </motion.div>
                )}
                {selectedChart === "funnel" && (
                  <motion.div
                    key="funnel-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <CardTitle className={`${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>{chartConfig.funnel.title}</CardTitle>
                    <CardDescription>{chartConfig.funnel.description}</CardDescription>
                  </motion.div>
                )}
              </AnimatePresence>
              <Select
                dir={isRTL ? "rtl" : "ltr"}
                defaultValue="grade"
                onValueChange={(value) => setSelectedChart(value)}
              >
                <SelectTrigger className={`w-30 rounded focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus:outline-none ${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grade" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "الـرتـــــب" : "Grade"}
                  </SelectItem>
                  <SelectItem value="conges" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "الإجــازات" : "Congés"}
                  </SelectItem>
                  <SelectItem value="funnel" className={`${isRTL ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm'}`}>
                    {isRTL ? "قــمــع" : "Funnel"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {selectedChart === "conges" && (
                <motion.div
                  key="conges"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-82.5"
                >
                  <div className="h-82.5">
                    <BarLeavesChart data={data.congesData} isLoading={false} rtl={isRTL} />
                  </div>
                </motion.div>
              )}
              {selectedChart === "grade" && (
                <motion.div
                  key="grade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-82.5"
                >
                  <div className="flex items-center justify-center h-82.5">
                    <div className="w-1/2 flex justify-center">
                      <ChartRadarOfficier rtl={isRTL} />
                    </div>
                    <div className="w-px bg-gray-300 dark:bg-border h-4/5 ml-6"></div>
                    <div className="w-1/2 flex justify-center -mr-3">
                      <ChartRadarSousOfficier rtl={isRTL} />
                    </div>
                  </div>
                </motion.div>
              )}
              {selectedChart === "funnel" && (
                <motion.div
                  key="funnel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-82.5"
                >
                  <div className="flex items-center justify-center h-82.5 text-muted-foreground">
                    <p>{isRTL ? "مخــطط القمع - قريباً" : "Funnel Chart - Coming Soon"}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter>
            <AnimatePresence mode="wait">
              {selectedChart === "conges" && (
                <motion.div
                  key="conges-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-col items-start gap-1 text-sm w-full"
                >
                  <div className={`flex gap-2 leading-none font-semibold min-h-4 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    {chartConfig[selectedChart as keyof typeof chartConfig].footer}
                    {(() => {
                      const currentChart = chartConfig[selectedChart as keyof typeof chartConfig]
                      const { icon: Icon, className } = getTrendIcon(currentChart.trend)
                      return <Icon className={className} style={isRTL ? { transform: "scaleX(-1)" } : {}} />
                    })()}
                  </div>
                  {chartConfig[selectedChart as keyof typeof chartConfig].period && (
                    <div className={`text-[13px] text-muted-foreground pt-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                      {chartConfig[selectedChart as keyof typeof chartConfig].period}
                    </div>
                  )}
                </motion.div>
              )}
              {selectedChart === "grade" && (
                <motion.div
                  key="grade-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-col items-start gap-1 text-sm w-full"
                >
                  <div className={`flex gap-2 leading-none font-semibold min-h-4 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    <div>
                      {isRTL ? "الموظفين حسب الفئة: " : "Effectifs par Categorie: "}
                      <span className="font-semibold" style={{ color: "#72A8B7" }}>
                        {officerTotal}
                      </span>{" "}
                      <span className="font-normal">
                        {isRTL ? "الضباط" : "officiers"}{isRTL ? " - " : " - "}
                      </span>
                      <span className="font-semibold" style={{ color: "#9C27B0" }}>
                        {ncoTotal}
                      </span>{" "}
                      <span className="font-normal">
                        {isRTL ? " " : " "}{isRTL ? "ضباط صف" : "Sous-Officiers"}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[13px] text-muted-foreground pt-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    {isRTL ? "توزيع الأفراد حسب الرتب" : "Analyse des effectifs par grade"}
                  </div>
                </motion.div>
              )}
              {selectedChart === "funnel" && (
                <motion.div
                  key="funnel-footer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-col items-start gap-1 text-sm w-full"
                >
                  <div className={`flex gap-2 leading-none font-semibold min-h-4 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    {chartConfig[selectedChart as keyof typeof chartConfig].footer}
                  </div>
                  <div className={`text-[13px] text-muted-foreground pt-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    {isRTL ? "الوظيفة قيد التطوير" : "Fonctionnalité en cours de développement"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardFooter>
        </Card>

        {/* === CARD : Répartition par genre === */}
        {/* Graphique radial affichant la répartition hommes/femmes des employés */}
        <div className={`${cardStyles} p-6`}>
          <h2 className={`text-lg font-semibold text-foreground mb-2 text-center ${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>
            {isRTL ? "التوزيع حسب الجنس" : "Répartition par Genre"}
          </h2>
          <GenderRadialChart />
        </div>
      </div>

      {/* ===== SECTION INFÉRIEURE - Tableaux unités et employés ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === CARD : Tableau des unités === */}
        {/* Liste des unités récentes avec informations : nom, type, nature (navigante/terrestre) */}
        <div className={`${cardStyles}`}>
          <div className="px-6 py-4 flex items-center justify-between mb-1">
            <h2 className={`text-base font-semibold text-foreground ${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>
              {isRTL ? "قــائمــــة الــوحــــدات" : "Liste des Unités"}
            </h2>
            <Link
              href={isRTL ? "/ar/dashboard/unite/table" : "/fr/dashboard/unite/table"}
              className={`${viewAllButtonBaseClasses} hover:bg-[#D9E7EB] active:bg-[#C8D7E0] dark:hover:bg-[#2B3839] rounded-none focus:outline-none ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
              style={{ color: viewAllButtonTextColor }}
            >
              {isRTL ? "عرض الكل" : "View All"}
            </Link>
          </div>
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-border">
                  <tr>
                    <th
                      className={`px-6 py-4 text-start w-[350] ${
                        isRTL ? "text-[15px]" : "text-xs"
                      } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                    >
                      {isRTL ? "الـــــــوحــــــــدة" : "Nom Unité"}
                    </th>
                    <th
                      className={`px-6 py-4 text-start ${
                        isRTL ? "text-[15px]" : "text-xs"
                      } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                    >
                      {isRTL ? "النـــــــــــــوع" : "Type"}
                    </th>
                    <th
                      className={`px-6 py-4 text-start ${
                        isRTL ? "text-[15px]" : "text-xs"
                      } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                    >
                      {isRTL ? "طبيعــة الوحــــدة" : "Nature"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                  {!sortedRecentUnites || sortedRecentUnites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className={`px-6 py-8 text-center text-muted-foreground ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                      >
                        {isRTL ? "لم يتم العثور على وحدات" : "Aucune unité trouvée"}
                      </td>
                    </tr>
                  ) : (
                    sortedRecentUnites.map((unite: any) => (
                      <tr key={unite.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted shrink-0 flex items-center justify-center">
                              {getUniteIcon(unite.navigante)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-md font-medium text-foreground truncate ${isRTL ? 'font-jazeera-bold text-sm' : ''}`}
                                title={unite.unite || "Non défini"}
                              >
                                {unite.unite || "Non défini"}
                              </div>
                              <div
                                className={`text-xs mt-1 text-muted-foreground truncate dark:text-gray-400 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                                title={unite.niveau_1 || (isRTL ? "غير متوفر" : "N/A")}
                              >
                                {unite.niveau_1 || (isRTL ? "غير متوفر" : "N/A")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-sm text-foreground block truncate ${isRTL ? 'font-noto-naskh-arabic' : ''} ${
                              isRTL ? "text-[16px]" : ""
                            }`}
                            title={unite.unite_type || "-"}
                          >
                            {unite.unite_type || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${isRTL ? 'font-jazeera-bold text-sm' : ''} ${
                              unite.navigante
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 me-1.5 rounded-full ${
                                unite.navigante ? "bg-blue-500" : "bg-green-500"
                              }`}
                            />
                            {unite.navigante
                              ? (isRTL ? "وحـدة عـائمـة" : "Navigante")
                              : (isRTL ? "وحـدة قــــارة" : "Terrestre")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* === CARD : Tableau des employés === */}
        {/* Liste des employés de haut rang (colonels/majors) avec photo, grade et statut */}
        <div className={`${cardStyles}`}>
          <div className="px-6 py-4 flex items-center justify-between mb-1">
            <h2 className={`text-base font-semibold text-foreground ${isRTL ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300'}`}>
              {isRTL ? "قــائمــــة المــوظفيــــن" : "Liste des Employés"}
            </h2>
            <Link
              href={isRTL ? "/ar/dashboard/employees/table" : "/fr/dashboard/employees/table"}
              className={`${viewAllButtonBaseClasses} hover:bg-[#D9E7EB] active:bg-[#C8D7E0] dark:hover:bg-[#2B3839] rounded-none focus:outline-none ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
              style={{ color: viewAllButtonTextColor }}
            >
              {isRTL ? "عرض الكل" : "View All"}
            </Link>
          </div>
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-border">
                  <tr>
                    {(isRTL
                      ? [
                          "الهــــويـــــــــــــة",
                          "الرقــــم",
                          "المعــرف الوحيـــد",
                          "الحــالــــــة",
                        ]
                      : ["Identité", "Matricule", "Identifiant unique", "Statut"]
                    ).map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-4 text-start ${
                          isRTL ? "text-[15px]" : "text-xs"
                        } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                  {!employees || employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className={`px-6 py-8 text-center text-muted-foreground ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                      >
                        {isRTL ? "لم يتم العثور على موظفين" : "Aucun employé trouvé"}
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee: any) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-muted">
                              <Image
                                className="object-cover "
                                src={employee.displayImage || "/images/default-avatar.png"}
                                alt={`${employee.prenom} ${employee.nom}`}
                                fill
                                sizes="40px"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                }}
                              />
                            </div>
                            <div>
                              <div
                                className={`${
                                  isRTL ? "text-md" : "text-md"
                                } font-medium text-foreground pb-0 ${isRTL ? 'font-jazeera-bold text-sm' : ''}`}
                              >
                                {employee.prenom} {employee.nom}
                              </div>
                              <div
                                className={`text-sm text-muted-foreground dark:text-gray-400 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                              >
                                {employee.latestGrade}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-2.5 whitespace-nowraptext-foreground text-sm ${isRTL ? 'font-noto-naskh-arabic' : ''}`}
                        >
                          {employee.matricule}
                        </td>
                        <td
                          className={`px-6 py-2.5 whitespace-nowraptext-foreground text-sm ${isRTL ? 'font-noto-naskh-arabic' : ''} `}
                        >
                          {employee.identifiant_unique}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap text-sm text-muted-foreground">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${isRTL ? 'font-jazeera-bold text-sm' : ''} ${
                              employee.actif === "مباشر"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : employee.actif === "غير مباشر"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : employee.actif === "إجازة"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : employee.actif === "مرض"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                : employee.actif === "تدريب"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : employee.actif === "مهمة"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                : employee.actif === "متغيب"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : employee.actif === "موقوف"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 me-1.5 rounded-full ${
                                employee.actif === "مباشر"
                                  ? "bg-green-500"
                                  : employee.actif === "غير مباشر"
                                  ? "bg-red-500"
                                  : employee.actif === "إجازة"
                                  ? "bg-blue-500"
                                  : employee.actif === "مرض"
                                  ? "bg-orange-500"
                                  : employee.actif === "تدريب"
                                  ? "bg-purple-500"
                                  : employee.actif === "مهمة"
                                  ? "bg-indigo-500"
                                  : employee.actif === "متغيب"
                                  ? "bg-yellow-500"
                                  : employee.actif === "موقوف"
                                  ? "bg-gray-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {isRTL ? (
                              employee.actif === "مباشر" ? "مبـاشــر" :
                              employee.actif === "غير مباشر" ? "غير مباشر" :
                              employee.actif === "إجازة" ? "في إجازة" :
                              employee.actif === "مرض" ? "مــــرض" :
                              employee.actif === "تدريب" ? "تكــويــن" :
                              employee.actif === "مهمة" ? "في مهمــة" :
                              employee.actif === "متغيب" ? "غائــب" :
                              employee.actif === "موقوف" ? "موقــوف" :
                              employee.actif
                            ) : employee.actif}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
