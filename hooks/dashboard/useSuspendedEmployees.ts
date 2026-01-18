"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface SuspendedEmployee {
  id: string
  prenom: string | null
  nom: string | null
  matricule: string | null
  grade: string | null
  date_debut: string | null
  date_fin: string | null
}

interface UseSuspendedEmployeesReturn {
  suspendedEmployees: SuspendedEmployee[]
  totalSuspended: number
  isLoading: boolean
  error: any
}

const fetcher = async (): Promise<SuspendedEmployee[]> => {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Récupérer les sanctions de type "إيقاف عن العمل" actives
  const { data: sanctions, error } = await supabase
    .from("employee_sanctions")
    .select(`
      id,
      employee_id,
      date_debut,
      date_fin,
      employees!inner (
        id,
        prenom,
        nom,
        matricule
      )
    `)
    .eq("type_sanction", "إيقاف عن العمل")
    .not("date_debut", "is", null)
    .not("date_fin", "is", null)
    .lte("date_debut", today)
    .gte("date_fin", today)

  if (error) {
    console.error("Error fetching suspended employees:", error)
    throw error
  }

  if (!sanctions || sanctions.length === 0) {
    return []
  }

  // Récupérer les grades actuels des employés
  const employeeIds = sanctions.map(s => s.employee_id)

  const { data: grades, error: gradesError } = await supabase
    .from("employee_grades")
    .select("employee_id, grade, date_grade")
    .in("employee_id", employeeIds)
    .order("date_grade", { ascending: false })

  if (gradesError) {
    console.error("Error fetching grades:", gradesError)
  }

  // Créer un map des grades les plus récents
  const latestGrades = new Map<string, string>()
  grades?.forEach(g => {
    if (!latestGrades.has(g.employee_id)) {
      latestGrades.set(g.employee_id, g.grade || "")
    }
  })

  // Formatter les résultats
  const result: SuspendedEmployee[] = sanctions.map(sanction => ({
    id: sanction.employee_id,
    prenom: (sanction.employees as any)?.prenom || null,
    nom: (sanction.employees as any)?.nom || null,
    matricule: (sanction.employees as any)?.matricule || null,
    grade: latestGrades.get(sanction.employee_id) || null,
    date_debut: sanction.date_debut,
    date_fin: sanction.date_fin,
  }))

  return result
}

export function useSuspendedEmployees(): UseSuspendedEmployeesReturn {
  const { data, error, isLoading } = useSWR<SuspendedEmployee[]>(
    "suspended-employees",
    fetcher,
    {
      refreshInterval: 60000, // Rafraîchir toutes les 60 secondes
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    suspendedEmployees: data || [],
    totalSuspended: data?.length || 0,
    isLoading,
    error,
  }
}
