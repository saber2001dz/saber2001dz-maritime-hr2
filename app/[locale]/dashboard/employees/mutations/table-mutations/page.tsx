// app/[locale]/dashboard/employees/mutations/table-mutations/page.tsx
import { createClient } from "@/lib/supabase/server"
import { SimpleMutationsTable } from "./SimpleMutationsTable"
import { RawMutationData, DisplayMutation, processMutationData, MUTATION_SELECT_QUERY } from "@/types/mutation.types"

export default async function MutationsTablePage() {
  const supabase = await createClient()

  let mutations: DisplayMutation[] = []
  let fetchError: string | null = null

  try {
    // Récupérer toutes les mutations
    const { data, error } = await supabase
      .from("employee_mutations")
      .select(MUTATION_SELECT_QUERY)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur lors de la récupération des mutations:", error)
      fetchError = `خطأ في تحميل البيانات: ${error.message}`
    } else if (data) {
      mutations = (data as RawMutationData[]).map(processMutationData)
    }
  } catch (err) {
    console.error("Erreur inattendue:", err)
    fetchError = `خطأ غير متوقع: ${String(err)}`
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        {fetchError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md font-noto-naskh-arabic">
            {fetchError}
          </div>
        )}
        <SimpleMutationsTable initialMutations={mutations} />
      </div>
    </div>
  )
}
