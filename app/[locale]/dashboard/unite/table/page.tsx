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

  // Récupérer les données des unités avec pagination automatique
  let unites: DisplayUnite[] = []
  let fetchError: string | null = null

  // Liste des catégories d'unités autorisées
  const ALLOWED_CATEGORIES = [
    "إدارة حرس السواحل",
    "إقليم بحري",
    "منطقة بحرية",
    "إدارة فرعية",
    "طوافة سريعة 35 متر",
    "فرقة بحرية",
    "فرقة تدخل سريع بحري",
    "فرقة توقي من الإرهاب",
    "خافرة 23 متر",
    "خافرة 20 متر",
    "خافرة 17 متر",
    "مركز بحري",
    "مركز بحري عملياتي",
    "مركز إرشاد",
    "برج مراقبة",
    "محطة رصد",
    "زورق سريع 16 متر",
    "زورق سريع 15 متر",
    "زورق سريع 14 متر",
    "زورق سريع 12 متر",
    "زورق سريع برق",
    "زورق سريع صقر",
    "مصلحة"
  ]

  try {
    // D'abord, obtenir le nombre total d'unités avec filtre de catégorie
    const { count } = await supabase
      .from("unite")
      .select("*", { count: 'exact', head: true })
      .in('unite_categorie', ALLOWED_CATEGORIES)

    if (count && count > 0) {
      const pageSize = 1000
      const totalPages = Math.ceil(count / pageSize)
      const allUnites: RawUniteData[] = []

      // Récupérer toutes les pages en parallèle avec filtre de catégorie
      const fetchPromises = []
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1
        fetchPromises.push(
          supabase
            .from("unite")
            .select(UNITE_SELECT_QUERY)
            .in('unite_categorie', ALLOWED_CATEGORIES)
            .order('unite_rang', { ascending: true })
            .range(from, to)
        )
      }

      const results = await Promise.all(fetchPromises)

      // Vérifier les erreurs
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error("Erreurs lors de la récupération des unités:", errors)
        errors.forEach((err, idx) => {
          console.error(`Erreur ${idx + 1}:`, err.error)
        })
        fetchError = t('unitsList.loadingError')
      } else {
        // Combiner toutes les données
        results.forEach(result => {
          if (result.data) {
            allUnites.push(...result.data)
          }
        })

        // Récupérer tous les IDs des responsables uniques
        const responsableIds = [...new Set(
          allUnites
            .map(u => u.unite_responsable)
            .filter(id => id !== null)
        )] as string[]

        // Récupérer les informations des employés responsables avec leur grade
        let employeesMap = new Map<string, { nom: string | null, prenom: string | null, grade_actuel: string | null }>()

        if (responsableIds.length > 0) {
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('id, nom, prenom, grade_actuel')
            .in('id', responsableIds)

          if (employeesError) {
            console.error('Erreur lors de la récupération des responsables:', employeesError)
          }

          if (!employeesError && employeesData) {
            employeesData.forEach((emp: { id: string; nom: string | null; prenom: string | null; grade_actuel: string | null }) => {
              employeesMap.set(emp.id, {
                nom: emp.nom,
                prenom: emp.prenom,
                grade_actuel: emp.grade_actuel
              })
            })
          }
        }

        // Ajouter les données des responsables aux unités
        const allUnitesWithResponsable = allUnites.map(unite => ({
          ...unite,
          responsable: unite.unite_responsable ? employeesMap.get(unite.unite_responsable) || null : null
        }))

        unites = allUnitesWithResponsable.map(processUniteData)
      }
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