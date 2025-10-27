"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { useOfficerGradesDistribution, useNCOGradesDistribution } from "@/hooks/useSupabaseData"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslations } from "next-intl"

export const description = "A radar chart with dots showing officer grades distribution"

interface RadarChartProps {
  rtl?: boolean
}

export function ChartRadarOfficier({ rtl = false }: RadarChartProps) {
  const { data: chartData, isLoading, error } = useOfficerGradesDistribution()
  const t = useTranslations()

  // Function to translate grades (Arabic to French or keep Arabic for RTL)
  const translateGrade = (arabicGradeName: string) => {
    // Mapping des grades arabes vers français pour affichage non-RTL
    const arabicToFrenchMapping = {
      "عميد": "Colonel Major",
      "عقيد": "Colonel", 
      "مقدم": "Lieutenant Colonel",
      "رائد": "Commandant",
      "نقيب": "Capitaine",
      "ملازم أول": "Lieutenant",
      "ملازم": "Sous-Lieutenant",
    }

    // En mode RTL, garder l'arabe, sinon traduire en français
    if (rtl) {
      return arabicGradeName
    } else {
      return arabicToFrenchMapping[arabicGradeName as keyof typeof arabicToFrenchMapping] || arabicGradeName
    }
  }

  const chartConfig = {
    desktop: {
      label: rtl ? t("dashboard.charts.effectif") : "Effectif",
      color: "#72A8B7",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {rtl ? t("dashboard.charts.loadingData") : "Chargement des données..."}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-destructive">
          {rtl ? t("dashboard.charts.loadingError") : "Erreur lors du chargement"}
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {rtl ? t("dashboard.charts.noDataAvailable") : "Aucune donnée disponible"}
        </div>
      </div>
    )
  }

  // Apply translations to chart data
  const translatedChartData = chartData ? chartData.map(item => ({
    ...item,
    month: translateGrade(item.month)
  })) : []

  return (
    <ChartContainer config={chartConfig} className="aspect-square h-[320px] w-[380px]">
      <RadarChart data={translatedChartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" dir={rtl ? "rtl" : "ltr"} />} />
        <PolarAngleAxis dataKey="month" />
        <PolarGrid stroke="var(--chart-grid)" />
        <Radar
          dataKey="count"
          fill="var(--color-desktop)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}

export function ChartRadarSousOfficier({ rtl = false }: RadarChartProps) {
  const { data: chartData, isLoading, error } = useNCOGradesDistribution()
  const t = useTranslations()

  // Function to translate NCO grades (Arabic to French or keep Arabic for RTL)
  const translateNCOGrade = (arabicGradeName: string) => {
    // Mapping des grades arabes vers français pour affichage non-RTL
    const arabicToFrenchMapping = {
      "وكيل أول": "Adjudant Chef",
      "وكيل": "Adjudant",
      "رقيب أول": "Sergent Chef",
      "رقيب": "Sergent",
      "عريف أول": "Caporal Chef",
      "عريف": "Caporal",
      "حارس": "Garde",
    }

    // En mode RTL, garder l'arabe, sinon traduire en français
    if (rtl) {
      return arabicGradeName
    } else {
      return arabicToFrenchMapping[arabicGradeName as keyof typeof arabicToFrenchMapping] || arabicGradeName
    }
  }

  const chartConfig2 = {
    desktop: {
      label: rtl ? t("dashboard.charts.effectif") : "Effectif",
      color: "#9C27B0",
    },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {rtl ? t("dashboard.charts.loadingData") : "Chargement des données..."}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-destructive">
          {rtl ? t("dashboard.charts.loadingError") : "Erreur lors du chargement"}
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="aspect-square h-[280px] w-[380px] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {rtl ? t("dashboard.charts.noDataAvailable") : "Aucune donnée disponible"}
        </div>
      </div>
    )
  }

  // Apply translations to NCO chart data
  const translatedNCOChartData = chartData ? chartData.map(item => ({
    ...item,
    month: translateNCOGrade(item.month)
  })) : []

  return (
    <ChartContainer config={chartConfig2} className="aspect-square h-[320px] w-[380px]">
      <RadarChart data={translatedNCOChartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" dir={rtl ? "rtl" : "ltr"} />} />
        <PolarAngleAxis dataKey="month" />
        <PolarGrid stroke="var(--chart-grid)" />
        <Radar
          dataKey="count"
          fill="var(--color-desktop)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
          }}
        />
      </RadarChart>
    </ChartContainer>
  )
}