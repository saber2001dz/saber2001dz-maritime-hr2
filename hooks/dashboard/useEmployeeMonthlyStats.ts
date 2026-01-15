"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EmployeeMonthlyStatistic {
  period_date: string
  total_employees: number
  period_type: string
}

export function useEmployeeMonthlyStats(monthsLimit: number = 3) {
  const [data, setData] = useState<EmployeeMonthlyStatistic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const { data: monthlyStats, error: fetchError } = await supabase
          .from("employee_statistics")
          .select("period_date, total_employees, period_type")
          .eq("period_type", "monthly")
          .order("period_date", { ascending: false })
          .limit(monthsLimit)

        if (fetchError) {
          throw fetchError
        }

        // Retourner les données dans l'ordre chronologique (du plus ancien au plus récent)
        setData((monthlyStats || []).reverse())
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques mensuelles:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [monthsLimit])

  return { data, isLoading, error }
}
