// app/dashboard/employees/retraite/page.tsx
import { createClient } from "@/lib/supabase/server"
import { SimpleRetraiteTable } from "./SimpleRetraiteTable"
import { RawEmployeeData, DisplayEmployee } from "@/types/employeeTable.types"
import { processEmployeeData, EMPLOYEE_SELECT_QUERY } from "@/utils/employee.utils"
import { getTranslations } from 'next-intl/server'

export default async function RetraiteTablePage() {
  const t = await getTranslations()
  const supabase = await createClient()

  let employees: DisplayEmployee[] = []
  let fetchError: string | null = null

  try {
    // D'abord, obtenir le nombre total
    const { count } = await supabase
      .from("employees")
      .select("*", { count: 'exact', head: true })

    if (count && count > 0) {
      const pageSize = 1000
      const totalPages = Math.ceil(count / pageSize)
      const allEmployees: RawEmployeeData[] = []

      // Récupérer toutes les pages en parallèle
      const fetchPromises = []
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1
        fetchPromises.push(
          supabase
            .from("employees")
            .select(EMPLOYEE_SELECT_QUERY)
            .range(from, to)
        )
      }

      const results = await Promise.all(fetchPromises)

      // Vérifier les erreurs
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error("Erreurs lors de la récupération des employés:", errors)
        fetchError = t('employeesList.loadingError', { error: errors[0].error?.message || 'Unknown error' })
      } else {
        // Combiner toutes les données
        results.forEach(result => {
          if (result.data) {
            allEmployees.push(...(result.data as RawEmployeeData[]))
          }
        })

        employees = allEmployees.map(processEmployeeData)
      }
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des employés:", err)
    fetchError = t('employeesList.loadingError', { error: String(err) })
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        {fetchError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{fetchError}</div>
        )}
        <SimpleRetraiteTable initialEmployees={employees} />
      </div>
    </div>
  )
}
