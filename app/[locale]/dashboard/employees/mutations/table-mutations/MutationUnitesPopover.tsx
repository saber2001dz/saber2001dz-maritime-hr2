"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Eye } from "lucide-react"
import React from "react"

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

  // Créer un tableau de 6 lignes avec les données récupérées
  const tableRows = Array.from({ length: 6 }, (_, index) => {
    const unite = unites.find((u) => u.ordre_saisie === index + 1)
    return {
      ordre: index + 1,
      gouvernorat: unite?.gouvernorat || "",
      direction: unite?.direction || "",
      unite: unite?.unite || "",
    }
  })

  // Grouper les lignes par gouvernorat (chaque gouvernorat a 2 lignes)
  const groupedRows = [
    { rows: [tableRows[0], tableRows[1]], gouvernoratIndex: 0 }, // Gouvernorat 1
    { rows: [tableRows[2], tableRows[3]], gouvernoratIndex: 2 }, // Gouvernorat 2
    { rows: [tableRows[4], tableRows[5]], gouvernoratIndex: 4 }, // Gouvernorat 3
  ]

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
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-sm overflow-hidden">
              <table className="w-full border-collapse" dir="rtl">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                      الـــولایـــة
                    </th>
                    <th className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                      الإدارة / الإقلیـم
                    </th>
                    <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-gray-300 dark:border-gray-600 text-center">
                      الوحــدات المطلـوبــة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map((group, groupIndex) => (
                    <React.Fragment key={`gouvernorat-${groupIndex}`}>
                      {/* Première ligne du gouvernorat */}
                      <tr key={`${groupIndex}-1`} className="border-b border-gray-200 dark:border-gray-700">
                        <td
                          rowSpan={2}
                          className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12"
                        >
                          {groupIndex + 1}
                        </td>
                        <td
                          rowSpan={2}
                          className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card min-w-32"
                        >
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 text-center">
                            {group.rows[0].gouvernorat || "-"}
                          </div>
                        </td>
                        <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {group.rows[0].direction || "-"}
                          </div>
                        </td>
                        <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                          {group.rows[0].ordre}
                        </td>
                        <td className="py-2 px-3 bg-white dark:bg-card">
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {group.rows[0].unite || "-"}
                          </div>
                        </td>
                      </tr>
                      {/* Deuxième ligne du gouvernorat */}
                      <tr
                        key={`${groupIndex}-2`}
                        className={groupIndex < 2 ? "border-b border-gray-300 dark:border-gray-600" : ""}
                      >
                        <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {group.rows[1].direction || "-"}
                          </div>
                        </td>
                        <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                          {group.rows[1].ordre}
                        </td>
                        <td className="py-2 px-3 bg-white dark:bg-card">
                          <div className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300">
                            {group.rows[1].unite || "-"}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
