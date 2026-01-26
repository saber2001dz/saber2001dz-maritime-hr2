"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Eye } from "lucide-react"

interface MutationUnite {
  id: string
  mutation_id: string
  ordre_saisie: number
  gouvernorat: string | null
  direction: string | null
  unite: string | null
}

interface MutationUnitesPopoverProps {
  mutationId: string
}

export function MutationUnitesPopover({ mutationId }: MutationUnitesPopoverProps) {
  const [unites, setUnites] = useState<MutationUnite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Fonction pour charger les données des unités
  const loadUnites = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("mutation_unites")
        .select("*")
        .eq("mutation_id", mutationId)
        .order("ordre_saisie", { ascending: true })

      if (error) {
        console.error("Erreur lors du chargement des unités:", error)
        return
      }

      setUnites(data || [])
    } catch (error) {
      console.error("Erreur inattendue:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les données quand le popover s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadUnites()
    }
  }, [isOpen, mutationId])

  // Organiser les données par gouvernorat EN PRÉSERVANT L'ORDRE DE SAISIE
  // Étape 1: Trier d'abord par ordre_saisie
  const sortedUnites = [...unites].sort((a, b) => a.ordre_saisie - b.ordre_saisie)

  // Étape 2: Grouper par gouvernorat (ordre déjà préservé)
  const organizedData = sortedUnites.reduce(
    (acc, unite) => {
      const gov = unite.gouvernorat || ""
      if (!acc[gov]) {
        acc[gov] = []
      }
      acc[gov].push(unite)
      return acc
    },
    {} as Record<string, MutationUnite[]>
  )

  // Récupérer les gouvernorats uniques dans l'ordre d'apparition
  const gouvernorats = Object.keys(organizedData)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none"
          title="عرض التفاصيل"
        >
          <Eye className="w-4 h-4" style={{ color: "#076784" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-175"
        align="start"
        side="left"
        dir="rtl"
      >
        <div className="max-h-125 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-[#076784] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                جاري التحميل...
              </p>
            </div>
          ) : unites.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                لا توجد وحدات مطلوبة لهذا الطلب
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-sm overflow-hidden">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b-2 border-b-gray-400 dark:border-b-gray-500 border-l border-l-gray-300 dark:border-l-gray-600 text-center">
                      الـــولایـــة
                    </th>
                    <th className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b-2 border-b-gray-400 dark:border-b-gray-500 border-l border-l-gray-300 dark:border-l-gray-600 text-center">
                      الإدارة / الإقلیم
                    </th>
                    <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b-2 border-b-gray-400 dark:border-b-gray-500 text-center">
                      الوحدات المطلوبة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gouvernorats.map((gouvernorat, govIndex) => {
                    const govUnites = organizedData[gouvernorat]
                    return govUnites.map((unite, uniteIndex) => (
                      <tr
                        key={unite.id}
                        className={uniteIndex === govUnites.length - 1 && govIndex !== gouvernorats.length - 1 ? "border-b-2 border-gray-400 dark:border-gray-500" : ""}
                      >
                        {uniteIndex === 0 && (
                          <>
                            <td
                              rowSpan={govUnites.length}
                              className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12"
                            >
                              {govIndex + 1}
                            </td>
                            <td
                              rowSpan={govUnites.length}
                              className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card w-32"
                            >
                              <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 text-center">
                                {gouvernorat || "-"}
                              </div>
                            </td>
                          </>
                        )}
                        <td className={`py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card ${uniteIndex < govUnites.length - 1 ? "border-b border-gray-300 dark:border-gray-600" : ""}`}>
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {unite.direction || "-"}
                          </div>
                        </td>
                        <td className={`font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12 ${uniteIndex < govUnites.length - 1 ? "border-b border-gray-300 dark:border-gray-600" : ""}`}>
                          {unite.ordre_saisie}
                        </td>
                        <td className={`py-2 px-3 bg-white dark:bg-card ${uniteIndex < govUnites.length - 1 ? "border-b border-gray-300 dark:border-gray-600" : ""}`}>
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {unite.unite || "-"}
                          </div>
                        </td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
