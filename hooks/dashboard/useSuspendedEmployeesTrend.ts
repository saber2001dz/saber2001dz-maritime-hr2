"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { calculateTrendData } from "@/utils/dashboard/trend-calculator.utils"
import { getPreviousMonthDate } from "@/utils/dashboard/trend-calculator.utils"
import type { TrendData } from "@/types/dashboard"

interface UseSuspendedEmployeesTrendReturn {
  trendData: TrendData | null
  isLoading: boolean
  error: any
}

const fetcher = async (isRTL: boolean): Promise<TrendData> => {
  const supabase = createClient()
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const previousMonthDate = getPreviousMonthDate(today)
  const previousMonthStr = previousMonthDate.toISOString().split("T")[0]

  // Récupérer le nombre actuel d'employés suspendus
  const { count: currentCount, error: currentError } = await supabase
    .from("employee_sanctions")
    .select("*", { count: "exact", head: true })
    .eq("type_sanction", "إيقاف عن العمل")
    .not("date_debut", "is", null)
    .not("date_fin", "is", null)
    .lte("date_debut", todayStr)
    .gte("date_fin", todayStr)

  if (currentError) {
    console.error("Error fetching current suspended employees:", currentError)
    throw currentError
  }

  // Récupérer le nombre d'employés suspendus du mois précédent
  const { count: previousCount, error: previousError } = await supabase
    .from("employee_sanctions")
    .select("*", { count: "exact", head: true })
    .eq("type_sanction", "إيقاف عن العمل")
    .not("date_debut", "is", null)
    .not("date_fin", "is", null)
    .lte("date_debut", previousMonthStr)
    .gte("date_fin", previousMonthStr)

  if (previousError) {
    console.error("Error fetching previous month suspended employees:", previousError)
    // En cas d'erreur, on ne peut pas calculer la tendance
  }

  // Debug logging
  console.log('🔍 Suspended Trend Debug:', {
    today: todayStr,
    previousMonth: previousMonthStr,
    currentCount,
    previousCount,
    previousError: !!previousError,
    willPassToPreviousValue: previousError ? null : (previousCount ?? 0)
  })

  // Calculer la tendance
  // Si previousCount est undefined (erreur) on passe null, sinon on passe la valeur (même si c'est 0)
  const trendData = calculateTrendData(
    currentCount || 0,
    previousError ? null : (previousCount ?? 0),
    isRTL
  )

  console.log('📊 Suspended Trend Result:', trendData)

  return trendData
}

export function useSuspendedEmployeesTrend(
  isRTL: boolean
): UseSuspendedEmployeesTrendReturn {
  const { data, error, isLoading } = useSWR<TrendData>(
    ["suspended-employees-trend", isRTL],
    () => fetcher(isRTL),
    {
      refreshInterval: 60000, // Rafraîchir toutes les 60 secondes
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    trendData: data || null,
    isLoading,
    error,
  }
}
