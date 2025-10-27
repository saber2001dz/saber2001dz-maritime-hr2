// app/dashboard/employees/table/page.tsx
import { createClient } from "@/lib/supabase/server"
import { SimpleEmployeeTable } from "./SimpleEmployeeTable"
import { RawEmployeeData, DisplayEmployee } from "@/types/employeeTable.types"
import { processEmployeeData, EMPLOYEE_SELECT_QUERY } from "@/utils/employee.utils"
import { getTranslations } from 'next-intl/server'

export default async function EmployeesTablePage() {
  const t = await getTranslations()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT_QUERY)

  let employees: DisplayEmployee[] = []
  let fetchError: string | null = null

  if (error) {
    console.error("Server-side error fetching employees:", error)
    fetchError = t('employeesList.loadingError', { error: error.message })
  } else if (data) {
    employees = (data as RawEmployeeData[]).map(processEmployeeData)
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        {fetchError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{fetchError}</div>
        )}
        <SimpleEmployeeTable initialEmployees={employees} />
      </div>
    </div>
  )
}