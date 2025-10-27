"use client"

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { getCardSubtitleFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"
import { useDashboardData } from "@/hooks/dashboard/useDashboardData"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function GenderRadialChart() {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  
  // Récupérer les données depuis le hook
  const { dashboardData, isLoading, error } = useDashboardData({ isRTL, t })
  
  // Utiliser les données réelles ou des données par défaut
  const chartData = dashboardData?.genderStatistics?.chartData || [{ month: "total", masculin: 0, feminin: 0 }]
  const statsData = dashboardData?.genderStatistics?.statsData || {
    masculin: { ageMoyen: 0, mariePourcent: 0 },
    feminin: { ageMoyen: 0, mariePourcent: 0 }
  }
  
  // Fonction helper pour formater les pourcentages selon la direction
  const formatPercent = (value: number) => {
    return isRTL ? `%${value}` : `${value}%`
  }

  const chartConfig = {
    masculin: {
      label: isRTL ? t("dashboard.genderChart.male") : "Masculin",
      color: "#72A8B7",
    },
    feminin: {
      label: isRTL ? t("dashboard.genderChart.female") : "Féminin",
      color: "#9C27B0",
    },
  } satisfies ChartConfig
  const totalEmployees = chartData[0].masculin + chartData[0].feminin
  const masculinPercent = totalEmployees > 0 ? Math.round((chartData[0].masculin / totalEmployees) * 100) : 0
  const femininPercent = totalEmployees > 0 ? Math.round((chartData[0].feminin / totalEmployees) * 100) : 0

  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-0 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRTL ? 'جاري التحميل...' : 'Chargement...'}
        </p>
      </div>
    )
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="flex flex-col h-full gap-0 items-center justify-center">
        <p className="text-sm text-destructive">
          {isRTL ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-0">
      <div className="flex justify-start">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full h-[250px]">
          <RadialBarChart className="mt-5" data={chartData} endAngle={180} innerRadius={80} outerRadius={160}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 16} className="fill-foreground text-2xl font-bold">
                          {totalEmployees.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 4} className={`fill-muted-foreground text-sm ${cardSubtitleFontClass}`}>
                          {isRTL ? t("dashboard.genderChart.employees") : "Employés"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="masculin"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-masculin)"
              className="stroke-transparent stroke-4"
            />
            <RadialBar
              dataKey="feminin"
              fill="var(--color-feminin)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-4"
            />
          </RadialBarChart>
        </ChartContainer>
      </div>

      {/* Table statistiques */}
      <div className="px-12 -mt-8 mr-1" dir={isRTL ? "rtl" : "ltr"}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-3 w-32"></th>
              <th className={`py-2 text-start font-semibold text-gray-400 ${cardSubtitleFontClass}`}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-[#72A8B7]"></div>
                  {isRTL ? t("dashboard.genderChart.male") : "Male"}
                </div>
              </th>
              <th className={`py-2 text-center font-semibold text-gray-400 ${cardSubtitleFontClass}`}>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-start w-3 h-3 bg-[#9C27B0]"></div>
                  {isRTL ? t("dashboard.genderChart.female") : "Femelle"}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className={`py-4 font-semibold text-gray-400 w-28 text-start ${cardSubtitleFontClass}`}>
                {isRTL ? t("dashboard.genderChart.genderPercent") : "% Genre"}
              </td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatPercent(masculinPercent)}</td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatPercent(femininPercent)}</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className={`py-4 font-semibold text-gray-400 w-28 text-start ${cardSubtitleFontClass}`}>
                {isRTL ? t("dashboard.genderChart.avgAge") : "Avg Age"}
              </td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">
                {statsData.masculin.ageMoyen} {isRTL ? t("dashboard.genderChart.years") : "ans"}
              </td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">
                {statsData.feminin.ageMoyen} {isRTL ? t("dashboard.genderChart.years") : "ans"}
              </td>
            </tr>
            <tr>
              <td className={`py-4 font-semibold text-gray-400 w-28 text-start ${cardSubtitleFontClass}`}>
                {isRTL ? t("dashboard.genderChart.marriedPercent") : "% marié"}
              </td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatPercent(statsData.masculin.mariePourcent)}</td>
              <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatPercent(statsData.feminin.mariePourcent)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
