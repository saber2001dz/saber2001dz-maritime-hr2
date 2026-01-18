"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslations } from "next-intl"

export const description = "Graphique des jours de congés par mois"

interface ChartDataItem {
  month: string
  previousYear: number
  currentYear: number
}

interface BarGraphProps {
  data?: ChartDataItem[]
  isLoading?: boolean
  rtl?: boolean
}

const defaultChartData = [
  { month: "January", previousYear: 0, currentYear: 0 },
  { month: "February", previousYear: 0, currentYear: 0 },
  { month: "March", previousYear: 0, currentYear: 0 },
  { month: "April", previousYear: 0, currentYear: 0 },
  { month: "May", previousYear: 0, currentYear: 0 },
  { month: "June", previousYear: 0, currentYear: 0 },
  { month: "July", previousYear: 0, currentYear: 0 },
  { month: "August", previousYear: 0, currentYear: 0 },
  { month: "September", previousYear: 0, currentYear: 0 },
  { month: "October", previousYear: 0, currentYear: 0 },
  { month: "November", previousYear: 0, currentYear: 0 },
  { month: "December", previousYear: 0, currentYear: 0 },
]

const chartConfig = {
  views: {
    label: "Jours de Congés",
  },
  previousYear: {
    label: "2024",
    color: "#72A8B7",
  },
  currentYear: {
    label: "2025",
    color: "#9C27B0",
  },
} satisfies ChartConfig

export function BarLeavesChart({ data, isLoading, rtl = false }: BarGraphProps) {
  const [isClient, setIsClient] = React.useState(false)
  const t = useTranslations()

  // Function to translate months for RTL mode
  const getTranslatedMonth = (monthName: string, abbreviated = false) => {
    if (!rtl) return monthName

    const monthTranslations = {
      // Full month names
      January: abbreviated ? t("dashboard.months.abbreviations.Jan") : t("dashboard.months.full.Janvier"),
      February: abbreviated ? t("dashboard.months.abbreviations.Feb") : t("dashboard.months.full.Février"),
      March: abbreviated ? t("dashboard.months.abbreviations.Mar") : t("dashboard.months.full.Mars"),
      April: abbreviated ? t("dashboard.months.abbreviations.Apr") : t("dashboard.months.full.Avril"),
      May: abbreviated ? t("dashboard.months.abbreviations.May") : t("dashboard.months.full.Mai"),
      June: abbreviated ? t("dashboard.months.abbreviations.Jun") : t("dashboard.months.full.Juin"),
      July: abbreviated ? t("dashboard.months.abbreviations.Jul") : t("dashboard.months.full.Juillet"),
      August: abbreviated ? t("dashboard.months.abbreviations.Aug") : t("dashboard.months.full.Août"),
      September: abbreviated ? t("dashboard.months.abbreviations.Sep") : t("dashboard.months.full.Septembre"),
      October: abbreviated ? t("dashboard.months.abbreviations.Oct") : t("dashboard.months.full.Octobre"),
      November: abbreviated ? t("dashboard.months.abbreviations.Nov") : t("dashboard.months.full.Novembre"),
      December: abbreviated ? t("dashboard.months.abbreviations.Dec") : t("dashboard.months.full.Décembre"),
    }

    return monthTranslations[monthName as keyof typeof monthTranslations] || monthName
  }

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  // Apply translations to chart data
  const translatedData = (data || defaultChartData).map((item) => ({
    ...item,
    month: getTranslatedMonth(item.month),
  }))

  const chartData = translatedData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80 w-full">
        <div className="text-muted-foreground">Chargement des données...</div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
      <BarChart
        data={chartData}
        margin={{
          left: rtl ? 8 : -24,
          right: rtl ? -24 : 8,
        }}
      >
        <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" stroke="var(--chart-grid)" />
        <XAxis
          dataKey="month"
          tickLine={true}
          tickMargin={10}
          axisLine={true}
          tickFormatter={(value) => (rtl ? getTranslatedMonth(value, true) : value.slice(0, 3))}
          reversed={rtl}
        />
        <YAxis
          tickLine={true}
          axisLine={true}
          tickMargin={rtl ? 28 : 10}
          tick={{ fontSize: 12 }}
          orientation={rtl ? "right" : "left"}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" dir={rtl ? "rtl" : "ltr"} />} />
        <Bar dataKey="previousYear" stackId="a" fill="var(--color-previousYear)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="currentYear" stackId="a" fill="var(--color-currentYear)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
