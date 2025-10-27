"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  Ship,
  Building2,
  Calendar,
  UserCheck,
  Anchor,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { GenderRadialChart } from "@/components/dashboard/GenderRadialChart"
import { EmployeesAreaChart } from "@/components/dashboard/EmployeesAreaChart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarLeavesChart } from "@/components/dashboard/BarLeavesChart"
import { ChartRadarOfficier, ChartRadarSousOfficier } from "@/components/dashboard/GradeRadarChart"
import { CongesByTypePopover } from "@/components/dashboard/CongesByTypePopover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/motion-primitives/animated-number"
import type { DashboardData } from "@/types/dashboard"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTitleFont,
  getMainTitleFont,
  getCardTitleFont,
  getSelectFont,
  getCardFooterFont,
  getCardSubtitleFont,
  getTableCellFont,
  getTableCellNotoFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"
import { sortEmployeesByHierarchy } from "@/utils/employee.utils"

interface DashboardContentProps {
  data: DashboardData
}

export function DashboardContent({ data }: DashboardContentProps) {
  const [selectedChart, setSelectedChart] = useState("conges")
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const cardTitleFontClass = getCardTitleFont(params.locale as Locale)
  const selectFontClass = getSelectFont(params.locale as Locale)
  const cardFooterFontClass = getCardFooterFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const tableCellFontClass = getTableCellFont(params.locale as Locale)
  const tableCellNotoFontClass = getTableCellNotoFont(params.locale as Locale)

  // Fonction pour calculer les totaux des grades
  const calculateGradeTotals = () => {
    const officerTotal = data.officerGradesData?.reduce((sum, item) => sum + item.count, 0) || 0
    const ncoTotal = data.ncoGradesData?.reduce((sum, item) => sum + item.count, 0) || 0
    return { officerTotal, ncoTotal }
  }

  // Fonction pour formatter les données de statistiques d'employés pour le chart
  const formatEmployeeStatsForChart = () => {
    if (!data.employeeMonthlyStatistics || data.employeeMonthlyStatistics.length === 0) {
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
      January: isRTL ? t("dashboard.months.abbreviations.Jan") : "Jan",
      February: isRTL ? t("dashboard.months.abbreviations.Feb") : "Fév",
      March: isRTL ? t("dashboard.months.abbreviations.Mar") : "Mar",
      April: isRTL ? t("dashboard.months.abbreviations.Apr") : "Avr",
      May: isRTL ? t("dashboard.months.abbreviations.May") : "Mai",
      June: isRTL ? t("dashboard.months.abbreviations.Jun") : "Juin",
      July: isRTL ? t("dashboard.months.abbreviations.Jul") : "Juil",
      August: isRTL ? t("dashboard.months.abbreviations.Aug") : "Août",
      September: isRTL ? t("dashboard.months.abbreviations.Sep") : "Sep",
      October: isRTL ? t("dashboard.months.abbreviations.Oct") : "Oct",
      November: isRTL ? t("dashboard.months.abbreviations.Nov") : "Nov",
      December: isRTL ? t("dashboard.months.abbreviations.Dec") : "Déc",
    }

    return data.employeeMonthlyStatistics.map((stat: any) => {
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
        text: isRTL ? t("dashboard.charts.loadingData") : "Chargement des données...",
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
      January: t("dashboard.months.full.Janvier"),
      February: t("dashboard.months.full.Février"),
      March: t("dashboard.months.full.Mars"),
      April: t("dashboard.months.full.Avril"),
      May: t("dashboard.months.full.Mai"),
      June: t("dashboard.months.full.Juin"),
      July: t("dashboard.months.full.Juillet"),
      August: t("dashboard.months.full.Août"),
      September: t("dashboard.months.full.Septembre"),
      October: t("dashboard.months.full.Octobre"),
      November: t("dashboard.months.full.Novembre"),
      December: t("dashboard.months.full.Décembre"),
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
            ? `${t("dashboard.charts.newLeaveActivity")} ${currentYear}`
            : `Nouvelle activité de congés en ${currentYear}`,
          period: isRTL
            ? `${t("dashboard.months.full.Janvier")} - ${currentMonthTranslated}`
            : `Janvier - ${currentMonthFrench}`,
          trend: "up",
        }
      return {
        text: isRTL ? t("dashboard.charts.noLeaveData") : "Aucune donnée de congés disponible",
        period: isRTL
          ? `${t("dashboard.months.full.Janvier")} - ${currentMonthTranslated}`
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
          ? `${t("dashboard.charts.stableLeaveLevel")} ${previousYear}`
          : `Niveau de congés stable par rapport à ${previousYear}`,
        period: isRTL
          ? `${t("dashboard.months.full.Janvier")} - ${currentMonthTranslated}`
          : `Janvier - ${currentMonthFrench}`,
        trend: "neutral",
      }
    }

    const trend = percentageChange > 0 ? "up" : "down"
    const trendText =
      percentageChange > 0
        ? isRTL
          ? t("dashboard.charts.increase")
          : "Augmentation"
        : isRTL
        ? t("dashboard.charts.decrease")
        : "Diminution"
    const absPercentage = Math.abs(percentageChange).toFixed(1)

    return {
      text: `${trendText} ${isRTL ? "بنسبة" : "de"} ${isRTL ? `%${absPercentage}` : `${absPercentage}%`} ${isRTL ? "مقارنة بـ" : "vs"} ${previousYear}`,
      period: isRTL
        ? `${t("dashboard.months.full.Janvier")} - ${currentMonthTranslated}`
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
      title: isRTL ? t("dashboard.charts.barChart") : "Bar Chart - Jours de Congé",
      description: `${previousYear} - ${currentYear}`,
      footer: congesTrendData.text,
      period: congesTrendData.period,
      trend: congesTrendData.trend,
    },
    grade: {
      title: isRTL ? t("dashboard.charts.radarChart") : "Radar Chart - Répartition par Grade",
      description: isRTL ? t("dashboard.charts.officersSubOfficers") : "Officiers - Sous-Officiers",
      footer: isRTL ? t("dashboard.charts.gradeAnalysis") : "Analyse des effectifs par grade",
      period: "",
      trend: "neutral",
    },
    funnel: {
      title: isRTL ? t("dashboard.charts.funnelChart") : "Funnel Chart - Flux Personnel",
      description: isRTL ? t("dashboard.charts.recruitmentProcess") : "Processus de recrutement",
      footer: isRTL ? t("dashboard.charts.chartInDevelopment") : "Chart en développement",
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

  // Données dynamiques basées sur les vraies statistiques
  const expensesData = {
    amount: data.dashboardStats?.total?.toString() || "0",
    label: isRTL ? t("dashboard.totalEmployees") : "Total des Employées",
  }

  const orderSectionsData = [
    {
      title: isRTL ? t("dashboard.unitStatistics.totalUnits") : "Total des unités",
      value: data.uniteStats?.total?.toString() || "0",
      icon: Building2,
      iconColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: isRTL ? t("dashboard.unitStatistics.administrativeUnits") : "Total des unités administratives",
      value: data.uniteStats?.administrative?.toString() || "0",
      icon: FileText,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      title: isRTL ? t("dashboard.unitStatistics.operationalUnits") : "Total des unités opérationnelles",
      value: data.uniteStats?.operational?.toString() || "0",
      icon: Ship,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
  ]

  const bottomStatsData = [
    {
      title: isRTL ? t("dashboard.employeeStatistics.employeesOnLeave") : "Total Employees en Conges",
      value: data.employeeStatistics?.conges?.toString() || "0",
      changeValue: data.employeeTrends?.conges?.changeValue || "",
      changeText: data.employeeTrends?.conges?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: data.employeeTrends?.conges?.changeType || ("no_data" as const),
      icon: Calendar,
    },
    {
      title: isRTL ? t("dashboard.employeeStatistics.employeesAdministration") : "Total Employees Administration",
      value: data.employeeStatistics?.administrative?.toString() || "0",
      changeValue: data.employeeTrends?.administrative?.changeValue || "",
      changeText: data.employeeTrends?.administrative?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: data.employeeTrends?.administrative?.changeType || ("no_data" as const),
      icon: UserCheck,
    },
    {
      title: isRTL ? t("dashboard.employeeStatistics.employeesOperational") : "Total Employees Operationnels",
      value: data.employeeStatistics?.operational?.toString() || "0",
      changeValue: data.employeeTrends?.operational?.changeValue || "",
      changeText: data.employeeTrends?.operational?.changeText || (isRTL ? "لا توجد بيانات" : "Pas de données"),
      changeTextEnd: "",
      changeType: data.employeeTrends?.operational?.changeType || ("no_data" as const),
      icon: Anchor,
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
        <h1 className={`text-2xl ${mainTitleFontClass} text-foreground`}>
          {isRTL ? t("dashboard.title") : "Tableau de bord"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 mb-6">
        {/* === CARD : Total des employés avec graphique d'évolution mensuelle === */}
        {/* Affiche le nombre total d'employés avec animation et graphique en aire des statistiques mensuelles */}
        <Card className="flex flex-col h-[300px] overflow-hidden pl-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-[20px] -mt-1 font-semibold ${titleFontClass} text-gray-700 dark:text-gray-300 pb-1`}
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

              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="-mt-5 -ms-6">
            <EmployeesAreaChart
              data={formatEmployeeStatsForChart()}
              config={{
                employees: {
                  label: isRTL ? t("dashboard.employees") : "Employés",
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
          <Card className="p-4 md:p-6 flex flex-col justify-center h-[140px] overflow-hidden bg-card rounded-md shadow-sm border-0">
            <h3 className={`text-[20px] font-semibold ${titleFontClass} text-gray-700 dark:text-gray-300 pb-3 pl-4`}>
              {isRTL ? t("dashboard.unitStatistics.title") : "Statistiques des Unités"}
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
                      <p className={`text-[16px] text-muted-foreground whitespace-nowrap ${cardSubtitleFontClass}`}>
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
          {/* Trois cards affichant les statistiques spécifiques (congés, administration, opérationnel) avec tendances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bottomStatsData.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={index}
                  className="p-4 md:p-6 flex flex-col h-[135px] overflow-hidden bg-card rounded-md shadow-sm border-0"
                >
                  <div className="flex items-center justify-between -mt-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-[16px] font-medium text-muted-foreground ${cardSubtitleFontClass}`}>
                        {stat.title}
                      </p>
                      {/* Ajouter le bouton popover uniquement pour les congés */}
                      {index === 0 && <CongesByTypePopover />}
                    </div>
                    <IconComponent className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                  </div>

                  <div className="mt-auto">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center text-xs gap-1">
                      <span className={`${cardSubtitleFontClass}`}>{stat.changeText}</span>
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
                      {stat.changeTextEnd && <span className={`${cardSubtitleFontClass}`}>{stat.changeTextEnd}</span>}
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
                    <CardTitle className={cardTitleFontClass}>{chartConfig.conges.title}</CardTitle>
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
                    <CardTitle className={cardTitleFontClass}>{chartConfig.grade.title}</CardTitle>
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
                    <CardTitle className={cardTitleFontClass}>{chartConfig.funnel.title}</CardTitle>
                    <CardDescription>{chartConfig.funnel.description}</CardDescription>
                  </motion.div>
                )}
              </AnimatePresence>
              <Select
                dir={isRTL ? "rtl" : "ltr"}
                defaultValue="conges"
                onValueChange={(value) => setSelectedChart(value)}
              >
                <SelectTrigger className={`w-[120px] rounded ${selectFontClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conges" className={selectFontClass}>
                    {isRTL ? t("dashboard.select.leaves") : "Congés"}
                  </SelectItem>
                  <SelectItem value="funnel" className={selectFontClass}>
                    {isRTL ? t("dashboard.select.funnel") : "Funnel"}
                  </SelectItem>
                  <SelectItem value="grade" className={selectFontClass}>
                    {isRTL ? t("dashboard.select.grade") : "Grade"}
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
                  className="flex flex-col h-[330px]"
                >
                  <div className="h-[330px]">
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
                  className="flex flex-col h-[330px]"
                >
                  <div className="flex items-center justify-center h-[330px]">
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
                  className="flex flex-col h-[330px]"
                >
                  <div className="flex items-center justify-center h-[330px] text-muted-foreground">
                    <p>{isRTL ? t("dashboard.charts.funnelComingSoon") : "Funnel Chart - Coming Soon"}</p>
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
                  <div className={`flex gap-2 leading-none font-[600] min-h-4 ${cardFooterFontClass}`}>
                    {chartConfig[selectedChart as keyof typeof chartConfig].footer}
                    {(() => {
                      const currentChart = chartConfig[selectedChart as keyof typeof chartConfig]
                      const { icon: Icon, className } = getTrendIcon(currentChart.trend)
                      return <Icon className={className} style={isRTL ? { transform: "scaleX(-1)" } : {}} />
                    })()}
                  </div>
                  {chartConfig[selectedChart as keyof typeof chartConfig].period && (
                    <div className={`text-[13px] text-muted-foreground pt-1 ${cardFooterFontClass}`}>
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
                  <div className={`flex gap-2 leading-none font-[600] min-h-4 ${cardFooterFontClass}`}>
                    <div>
                      {isRTL ? t("dashboard.charts.effectivesByCategory") : "Effectifs par Categorie: "}
                      <span className="font-semibold" style={{ color: "#72A8B7" }}>
                        {officerTotal}
                      </span>{" "}
                      <span className="font-normal">
                        {isRTL ? t("dashboard.charts.officers") + " - " : "officiers - "}
                      </span>
                      <span className="font-semibold" style={{ color: "#9C27B0" }}>
                        {ncoTotal}
                      </span>{" "}
                      <span className="font-normal">
                        {isRTL ? " " + t("dashboard.charts.subOfficers") : " Sous-Officiers"}
                      </span>
                    </div>
                  </div>
                  <div className={`text-[13px] text-muted-foreground pt-1 ${cardFooterFontClass}`}>
                    {isRTL ? t("dashboard.charts.gradeAnalysis") : "Analyse des effectifs par grade"}
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
                  <div className={`flex gap-2 leading-none font-[600] min-h-4 ${cardFooterFontClass}`}>
                    {chartConfig[selectedChart as keyof typeof chartConfig].footer}
                  </div>
                  <div className={`text-[13px] text-muted-foreground pt-1 ${cardFooterFontClass}`}>
                    {isRTL
                      ? t("dashboard.charts.functionalityInDevelopment")
                      : "Fonctionnalité en cours de développement"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardFooter>
        </Card>

        {/* === CARD : Répartition par genre === */}
        {/* Graphique radial affichant la répartition hommes/femmes des employés */}
        <div className={`${cardStyles} p-6`}>
          <h2 className={`text-lg font-semibold text-foreground mb-2 text-center ${cardTitleFontClass}`}>
            {isRTL ? t("dashboard.charts.genderDistribution") : "Répartition par Genre"}
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
            <h2 className={`text-base font-semibold text-foreground ${cardTitleFontClass}`}>
              {isRTL ? t("dashboard.tables.unitsList") : "Liste des Unités"}
            </h2>
            <Link
              href={isRTL ? "/ar/dashboard/unite/table" : "/fr/dashboard/unite/table"}
              className={`${viewAllButtonBaseClasses} hover:bg-[#D9E7EB] active:bg-[#C8D7E0] dark:hover:bg-[#2B3839] rounded-none ${cardSubtitleFontClass}`}
              style={{ color: viewAllButtonTextColor }}
            >
              {isRTL ? t("dashboard.tables.viewAll") : "View All"}
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
                        } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? t("dashboard.tables.unitColumns.unitName") : "Nom Unité"}
                    </th>
                    <th
                      className={`px-6 py-4 text-start ${
                          isRTL ? "text-[15px]" : "text-xs"
                        } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? t("dashboard.tables.unitColumns.type") : "Type"}
                    </th>
                    <th
                      className={`px-6 py-4 text-start ${
                          isRTL ? "text-[15px]" : "text-xs"
                        } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    >
                      {isRTL ? t("dashboard.tables.unitColumns.nature") : "Nature"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                  {!data.recentUnites || data.recentUnites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className={`px-6 py-8 text-center text-muted-foreground ${cardSubtitleFontClass}`}
                      >
                        {isRTL ? t("dashboard.tables.noData.noUnitsFound") : "Aucune unité trouvée"}
                      </td>
                    </tr>
                  ) : (
                    data.recentUnites.map((unite: any) => (
                      <tr key={unite.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                              {getUniteIcon(unite.navigante)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-md font-medium text-foreground truncate ${tableCellFontClass}`}
                                title={unite.unite || "Non défini"}
                              >
                                {unite.unite || "Non défini"}
                              </div>
                              <div
                                className={`text-xs mt-1 text-muted-foreground truncate dark:text-gray-400 ${tableCellNotoFontClass}`}
                                title={unite.niveau_1 || (isRTL ? t("common.notAvailable") : "N/A")}
                              >
                                {unite.niveau_1 || (isRTL ? t("common.notAvailable") : "N/A")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-sm text-foreground block truncate ${tableCellNotoFontClass} ${
                              isRTL ? "text-[16px]" : ""
                            }`}
                            title={unite.unite_type || "-"}
                          >
                            {unite.unite_type || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${tableCellFontClass} ${
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
                              ? isRTL
                                ? t("dashboard.tables.unitTypes.navigante")
                                : "Navigante"
                              : isRTL
                              ? t("dashboard.tables.unitTypes.terrestre")
                              : "Terrestre"}
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
            <h2 className={`text-base font-semibold text-foreground ${cardTitleFontClass}`}>
              {isRTL ? t("dashboard.tables.employeesList") : "Liste des Employés"}
            </h2>
            <Link
              href={isRTL ? "/ar/dashboard/employees/table" : "/fr/dashboard/employees/table"}
              className={`${viewAllButtonBaseClasses} hover:bg-[#D9E7EB] active:bg-[#C8D7E0] dark:hover:bg-[#2B3839] rounded-none ${cardSubtitleFontClass}`}
              style={{ color: viewAllButtonTextColor }}
            >
              {isRTL ? t("dashboard.tables.viewAll") : "View All"}
            </Link>
          </div>
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-border">
                  <tr>
                    {(isRTL
                      ? [
                          t("dashboard.tables.employeeColumns.identity"),
                          t("dashboard.tables.employeeColumns.matricule"),
                          t("dashboard.tables.employeeColumns.uniqueIdentifier"),
                          t("dashboard.tables.employeeColumns.status"),
                        ]
                      : ["Identité", "Matricule", "Identifiant unique", "Statut"]
                    ).map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-4 text-start ${
                          isRTL ? "text-[15px]" : "text-xs"
                        } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
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
                        className={`px-6 py-8 text-center text-muted-foreground ${cardSubtitleFontClass}`}
                      >
                        {isRTL ? t("dashboard.tables.noData.noEmployeesFound") : "Aucun employé trouvé"}
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee: any) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-muted">
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
                                } font-medium text-foreground pb-0 ${tableCellFontClass}`}
                              >
                                {employee.prenom} {employee.nom}
                              </div>
                              <div
                                className={`text-sm text-muted-foreground dark:text-gray-400 ${tableCellNotoFontClass}`}
                              >
                                {employee.latestGrade}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-2.5 whitespace-nowraptext-foreground text-sm ${tableCellNotoFontClass}`}
                        >
                          {employee.matricule}
                        </td>
                        <td
                          className={`px-6 py-2.5 whitespace-nowraptext-foreground text-sm ${tableCellNotoFontClass} `}
                        >
                          {employee.identifiant_unique}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap text-sm text-muted-foreground">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${tableCellFontClass} ${
                              employee.actif === "مباشر"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : employee.actif === "غير مباشر"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : employee.actif === "إجازة"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : employee.actif === "Maladie"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                : employee.actif === "Formation"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : employee.actif === "Mission"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                : employee.actif === "Abscent"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
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
                                  : employee.actif === "Maladie"
                                  ? "bg-orange-500"
                                  : employee.actif === "Formation"
                                  ? "bg-purple-500"
                                  : employee.actif === "Mission"
                                  ? "bg-indigo-500"
                                  : employee.actif === "Abscent"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {isRTL ? t(`dashboard.employeeStatus.${employee.actif}`) || employee.actif : employee.actif}
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
