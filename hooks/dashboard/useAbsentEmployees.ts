"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface AbsentEmployee {
  id: string
  prenom: string | null
  nom: string | null
  matricule: string | null
  grade: string | null
  date_debut: string | null
  date_fin: string | null
  duree: number | null
}

interface UseAbsentEmployeesReturn {
  absentEmployees: AbsentEmployee[]
  totalAbsent: number
  isLoading: boolean
  error: any
}

const fetcher = async (): Promise<AbsentEmployee[]> => {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Récupérer les absences actives
  const { data: absences, error } = await supabase
    .from("employee_absence")
    .select(`
      id,
      employee_id,
      date_debut,
      date_fin,
      duree
    `)
    .not("date_debut", "is", null)
    .lte("date_debut", today)
    .gte("date_fin", today)

  if (error) {
    console.error("Error fetching absent employees:", error)
    throw error
  }

  if (!absences || absences.length === 0) {
    return []
  }

  // Récupérer les informations des employés et leurs grades
  const employeeIds = absences.map(a => a.employee_id)

  const [
    { data: employees, error: employeesError },
    { data: grades, error: gradesError }
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, prenom, nom, matricule")
      .in("id", employeeIds),
    supabase
      .from("employee_grades")
      .select("employee_id, grade, date_grade")
      .in("employee_id", employeeIds)
      .order("date_grade", { ascending: false })
  ])

  if (employeesError) {
    console.error("Error fetching employees:", employeesError)
  }

  if (gradesError) {
    console.error("Error fetching grades:", gradesError)
  }

  // Créer des maps pour les employés et grades
  const employeesMap = new Map(employees?.map(e => [e.id, e]) || [])
  const latestGrades = new Map<string, string>()
  grades?.forEach(g => {
    if (!latestGrades.has(g.employee_id)) {
      latestGrades.set(g.employee_id, g.grade || "")
    }
  })

  // Formatter les résultats
  const result: AbsentEmployee[] = absences.map(absence => {
    const employee = employeesMap.get(absence.employee_id)
    return {
      id: absence.employee_id,
      prenom: employee?.prenom || null,
      nom: employee?.nom || null,
      matricule: employee?.matricule || null,
      grade: latestGrades.get(absence.employee_id) || null,
      date_debut: absence.date_debut,
      date_fin: absence.date_fin,
      duree: absence.duree,
    }
  })

  return result
}

export function useAbsentEmployees(): UseAbsentEmployeesReturn {
  const { data, error, isLoading } = useSWR<AbsentEmployee[]>(
    "absent-employees",
    fetcher,
    {
      refreshInterval: 60000, // Rafraîchir toutes les 60 secondes
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  )

  return {
    absentEmployees: data || [],
    totalAbsent: data?.length || 0,
    isLoading,
    error,
  }
}
