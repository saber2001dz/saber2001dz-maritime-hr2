import { createClient } from "@/lib/supabase/server"
import { RawUniteData, DisplayUnite, processUniteData, UNITE_SELECT_QUERY } from "@/types/unite.types"
import { SimpleUniteTable } from "./SimpleUniteTable"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'

export default async function UniteTablePage() {
  const t = await getTranslations()
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Récupérer les données des unités
  let unites: DisplayUnite[] = []
  let fetchError: string | null = null

  try {
    const { data, error } = await supabase
      .from("unite")
      .select(UNITE_SELECT_QUERY)

    if (error) {
      console.error("Erreur lors de la récupération des unités:", error)
      fetchError = t('unitsList.loadingError')
    } else if (data) {
      unites = data.map(processUniteData)
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des unités:", err)
    fetchError = t('unitsList.dataRetrievalError')
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F4F5F9] dark:bg-[#26272A]">
      <div className="flex-1 p-6">
        {fetchError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">{fetchError}</div>
        )}
        <SimpleUniteTable initialUnites={unites} />
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"