"use client"

import { Award, AlertTriangle } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ChartPieLabelProps {
  totalSanctions: number
  totalRecompenses: number
  isRTL?: boolean
}

export function ChartPieLabel({ totalSanctions, totalRecompenses, isRTL = false }: ChartPieLabelProps) {
  const chartData = [
    {
      category: "recompenses",
      value: totalRecompenses,
      fill: "#4ade80",
      label: isRTL ? "التـشـجيـع" : "Récompenses",
    },
    {
      category: "sanctions",
      value: totalSanctions,
      fill: "#ef4444",
      label: isRTL ? "العقـوبـات" : "Sanctions",
    },
  ]

  const chartConfig = {
    value: {
      label: isRTL ? "العدد" : "Nombre",
    },
    recompenses: {
      label: isRTL ? "التـشـجيـع" : "Récompenses",
      color: "#f0fdf4",
    },
    sanctions: {
      label: isRTL ? "العقـوبـات" : "Sanctions",
      color: "#fef2f2",
    },
  } satisfies ChartConfig

  const total = totalSanctions + totalRecompenses

  // État vide quand aucune donnée n'est disponible
  if (total === 0) {
    return (
      <div className="h-75 w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          <div className="space-y-2">
            <p className={`text-sm text-gray-500 dark:text-gray-400 font-medium ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
              {isRTL ? "لا توجد بيانات للعرض" : "Aucune donnée à afficher"}
            </p>
            <p className={`text-xs text-gray-400 dark:text-gray-500 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
              {isRTL ? "لم يتم تسجيل أي جزاءات أو مكافآت بعد" : "Aucune sanction ou récompense enregistrée"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-75"
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
          />
        </PieChart>
      </ChartContainer>

      {/* Légende avec statistiques */}
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-green-600" />
          <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
            {isRTL ? "التـشـجيـع" : "Récompenses"}: {totalRecompenses}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
            {isRTL ? "العقـوبـات" : "Sanctions"}: {totalSanctions}
          </span>
        </div>
      </div>
    </div>
  )
}
