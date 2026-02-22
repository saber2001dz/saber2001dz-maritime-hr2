"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Eye } from "lucide-react"
import React from "react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { XIcon } from "lucide-react"

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
  asMenuItem?: boolean
  onOpen?: () => void
  dialogOpen?: boolean
  onDialogClose?: () => void
}

export function MutationUnitesPopover({ mutationId, asMenuItem, onOpen, dialogOpen, onDialogClose }: MutationUnitesPopoverProps) {
  const [unites, setUnites] = useState<MutationUnite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const controlled = dialogOpen !== undefined
  const open = controlled ? dialogOpen : isOpen
  const setOpen = controlled ? (val: boolean) => { if (!val) onDialogClose?.() } : setIsOpen

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

  useEffect(() => {
    if (open) {
      loadUnites()
    }
  }, [open, mutationId])

  const tableRows = Array.from({ length: 6 }, (_, index) => {
    const unite = unites.find((u) => u.ordre_saisie === index + 1)
    return {
      ordre: index + 1,
      gouvernorat: unite?.gouvernorat || "",
      direction: unite?.direction || "",
      unite: unite?.unite || "",
    }
  })

  const groupedRows = [
    { rows: [tableRows[0], tableRows[1]], gouvernoratIndex: 0 },
    { rows: [tableRows[2], tableRows[3]], gouvernoratIndex: 2 },
    { rows: [tableRows[4], tableRows[5]], gouvernoratIndex: 4 },
  ]

  const handleOpen = () => {
    onOpen?.()
    if (!controlled) setIsOpen(true)
  }

  return (
    <>
      {!controlled && (asMenuItem ? (
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#363C44] transition-colors font-noto-naskh-arabic"
          onClick={handleOpen}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" style={{ color: "#076784" }} />
          الوحدات المطلوبة
        </button>
      ) : (
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer focus:outline-none"
          title="عرض التفاصيل"
          onClick={handleOpen}
        >
          <Eye className="w-4 h-4" style={{ color: "#076784" }} />
        </button>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-4xl! border-0"
          style={{ maxWidth: "900px" }}
          dir="rtl"
        >
          <DialogClose
            tabIndex={-1}
            className="absolute left-4 top-4 rounded-xs opacity-70 hover:opacity-100 focus:outline-none"
          >
            <XIcon className="h-4 w-4 cursor-pointer" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader className="text-right">
            <DialogTitle className="font-noto-naskh-arabic text-start text-[#076784] dark:text-[#7FD4D3]">
              الوحــدات المطلـوبــة
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
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
                      <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-[#7FD4D3] py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                        الـــولایـــة
                      </th>
                      <th className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-[#7FD4D3] py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                        الإدارة / الإقلیـم
                      </th>
                      <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-[#7FD4D3] py-3 px-4 border-b border-gray-300 dark:border-gray-600 text-center">
                        الوحــدات المطلـوبــة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRows.map((group, groupIndex) => (
                      <React.Fragment key={`gouvernorat-${groupIndex}`}>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
