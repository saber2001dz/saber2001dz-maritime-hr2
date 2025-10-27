// TabDisciplineInfoEdit.tsx
"use client"
import { useEffect, useState } from "react"
import { X, Save, AlertTriangle, Award, Plus, Trash2, Edit } from "lucide-react"
import { EmployeeCompleteData } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { sanctionOptions, recompenseOptions } from "@/lib/selectOptions"
import { useParams } from "next/navigation"
import { getTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface EditDialogsProps {
  data: EmployeeCompleteData
  onSave: (field: string, updatedData: any) => void
  activeDialog: string | null
  onClose: () => void
}

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: any
  children: React.ReactNode
  maxWidth?: string
  isClosing?: boolean
  isRTL?: boolean
}

// Composant Dialog générique
function Dialog({ isOpen, onClose, title, icon: Icon, children, maxWidth = "max-w-6xl", isClosing = false, isRTL = false }: DialogProps) {
  if (!isOpen) return null
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 duration-300 ${
        isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div
        className={`bg-white dark:bg-[#1C1C1C] rounded-lg shadow-2xl w-full ${maxWidth} mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600 duration-300 ${
          isClosing
            ? "animate-out slide-out-to-bottom-4 zoom-out-95"
            : "animate-in slide-in-from-bottom-4 zoom-in-95"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className={`flex items-center ${isRTL ? "space-x-reverse space-x-2" : "space-x-2"}`}>
            <Icon className="h-5 w-5 text-[#076784]" />
            <h2 className={`text-lg font-semibold text-[#076784] ${isRTL ? "font-noto-naskh-arabic" : ""}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
          >
            <X className="h-6 w-6 cursor-pointer" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function EditDialogs({ data, onSave, activeDialog, onClose }: EditDialogsProps) {
  // Logique RTL et polices
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)

  // États pour la gestion des sanctions multiples
  const [sanctionsList, setSanctionsList] = useState(data.sanctions || [])
  const [editingSanctionIndex, setEditingSanctionIndex] = useState<number | null>(null)
  const [originalSanctionsList, setOriginalSanctionsList] = useState(data.sanctions || [])

  // États pour la gestion des récompenses multiples
  const [recompensesList, setRecompensesList] = useState(data.recompenses || [])
  const [editingRecompenseIndex, setEditingRecompenseIndex] = useState<number | null>(null)
  const [originalRecompensesList, setOriginalRecompensesList] = useState(data.recompenses || [])

  // États pour les indicateurs de chargement
  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Fonction pour formater les dates pour les inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const formatDateWith2DigitDay = (dateString: string) => {
    if (!dateString) return "Non défini"
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Helper function to format date for RTL display
  const formatDateRTL = (dateStr: string | null | undefined, isRTL: boolean) => {
    if (!dateStr) return isRTL ? "غير محدد" : "Non défini"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return isRTL ? "غير محدد" : "Non défini"
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${year}-${month}-${day}`
    } catch {
      return isRTL ? "غير محدد" : "Non défini"
    }
  }

  // Fonction pour vérifier si les données d'une sanction sont vides
  const isEmptySanction = (sanction: any) => {
    return !sanction.type_sanction && !sanction.date_sanction && !sanction.motif && !sanction.autorite
  }

  // Fonction pour vérifier si les données d'une récompense sont vides
  const isEmptyRecompense = (recompense: any) => {
    return !recompense.type_recompense && !recompense.date_recompense && !recompense.motif && !recompense.autorite
  }

  // Fonction pour vérifier s'il y a une sanction non sauvegardée
  const hasUnsavedSanction = (): boolean => {
    if (editingSanctionIndex !== null) {
      return true
    }
    return sanctionsList.some(sanction => sanction.id.toString().startsWith("temp-"))
  }

  // Fonction pour vérifier s'il y a une récompense non sauvegardée
  const hasUnsavedRecompense = (): boolean => {
    if (editingRecompenseIndex !== null) {
      return true
    }
    return recompensesList.some(recompense => recompense.id.toString().startsWith("temp-"))
  }

  // Fonction pour réinitialiser les données lors de l'annulation
  const resetFormData = () => {
    setSanctionsList(originalSanctionsList)
    setEditingSanctionIndex(null)
    setRecompensesList(originalRecompensesList)
    setEditingRecompenseIndex(null)
  }

  useEffect(() => {
    setSanctionsList(data.sanctions || [])
    setRecompensesList(data.recompenses || [])
    setOriginalSanctionsList(data.sanctions || [])
    setOriginalRecompensesList(data.recompenses || [])
  }, [data.sanctions, data.recompenses])

  // Fonctions pour la gestion des sanctions
  const addSanction = () => {
    const newSanction = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      type_sanction: "",
      date_sanction: "",
      motif: "",
      autorite: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSanctionsList([...sanctionsList, newSanction])
    setEditingSanctionIndex(sanctionsList.length)
  }

  const deleteSanction = async (index: number) => {
    const sanction = sanctionsList[index]
    if (sanction.id.startsWith("temp-")) {
      // Suppression locale pour les nouvelles sanctions
      setSanctionsList(sanctionsList.filter((_, i) => i !== index))
    } else {
      // Suppression dans la base de données
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_sanctions").delete().eq("id", sanction.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setSanctionsList(sanctionsList.filter((_, i) => i !== index))
      } catch (error) {
        console.error("Erreur:", error)
      }
    }
  }

  const updateSanction = (index: number, field: string, value: string) => {
    const updatedSanctions = [...sanctionsList]
    updatedSanctions[index] = { ...updatedSanctions[index], [field]: value }
    setSanctionsList(updatedSanctions)
  }

  const saveSanction = async (index: number) => {
    const sanction = sanctionsList[index]

    // Vérifier les données vides
    if (isEmptySanction(sanction) && sanction.id.startsWith("temp-")) {
      setSanctionsList(sanctionsList.filter((_, i) => i !== index))
      setEditingSanctionIndex(null)
      return
    }

    try {
      const supabase = createClient()
      const updatedSanctions = [...sanctionsList]

      if (sanction.id.startsWith("temp-")) {
        // Création
        const { data: newSanction, error } = await supabase
          .from("employee_sanctions")
          .insert({
            employee_id: data.employee.id,
            type_sanction: sanction.type_sanction,
            date_sanction: sanction.date_sanction,
            motif: sanction.motif,
            autorite: sanction.autorite,
          })
          .select()
          .single()

        if (error) throw error

        // Mise à jour locale avec nouvel ID
        updatedSanctions[index] = newSanction
        setSanctionsList(updatedSanctions)
      } else {
        // Mise à jour
        const { error } = await supabase
          .from("employee_sanctions")
          .update({
            type_sanction: sanction.type_sanction,
            date_sanction: sanction.date_sanction,
            motif: sanction.motif,
            autorite: sanction.autorite,
          })
          .eq("id", sanction.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("sanctions", updatedSanctions)
      setEditingSanctionIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  // Fonctions pour la gestion des récompenses
  const addRecompense = () => {
    const newRecompense = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      type_recompense: "",
      date_recompense: "",
      motif: "",
      autorite: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRecompensesList([...recompensesList, newRecompense])
    setEditingRecompenseIndex(recompensesList.length)
  }

  const deleteRecompense = async (index: number) => {
    const recompense = recompensesList[index]
    if (recompense.id.startsWith("temp-")) {
      // Suppression locale pour les nouvelles récompenses
      setRecompensesList(recompensesList.filter((_, i) => i !== index))
    } else {
      // Suppression dans la base de données
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_recompenses").delete().eq("id", recompense.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setRecompensesList(recompensesList.filter((_, i) => i !== index))
      } catch (error) {
        console.error("Erreur:", error)
      }
    }
  }

  const updateRecompense = (index: number, field: string, value: string) => {
    const updatedRecompenses = [...recompensesList]
    updatedRecompenses[index] = { ...updatedRecompenses[index], [field]: value }
    setRecompensesList(updatedRecompenses)
  }

  const saveRecompense = async (index: number) => {
    const recompense = recompensesList[index]

    // Vérifier les données vides
    if (isEmptyRecompense(recompense) && recompense.id.startsWith("temp-")) {
      setRecompensesList(recompensesList.filter((_, i) => i !== index))
      setEditingRecompenseIndex(null)
      return
    }

    try {
      const supabase = createClient()
      const updatedRecompenses = [...recompensesList]

      if (recompense.id.startsWith("temp-")) {
        // Création
        const { data: newRecompense, error } = await supabase
          .from("employee_recompenses")
          .insert({
            employee_id: data.employee.id,
            type_recompense: recompense.type_recompense,
            date_recompense: recompense.date_recompense,
            motif: recompense.motif,
            autorite: recompense.autorite,
          })
          .select()
          .single()

        if (error) throw error

        // Mise à jour locale avec nouvel ID
        updatedRecompenses[index] = newRecompense
        setRecompensesList(updatedRecompenses)
      } else {
        // Mise à jour
        const { error } = await supabase
          .from("employee_recompenses")
          .update({
            type_recompense: recompense.type_recompense,
            date_recompense: recompense.date_recompense,
            motif: recompense.motif,
            autorite: recompense.autorite,
          })
          .eq("id", recompense.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("recompenses", updatedRecompenses)
      setEditingRecompenseIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  const handleDialogClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      handleCancel()
      setIsClosing(false)
    }, 300)
  }

  return (
    <>
      {/* Dialog pour Gestion des Sanctions */}
      <Dialog
        isOpen={activeDialog === "sanctions"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة العقوبات" : "Gestion des Sanctions"}
        icon={AlertTriangle}
        maxWidth="max-w-6xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}>
              {isRTL ? "قائمة العقوبات" : "Liste des Sanctions"}
            </h3>
            <button
              onClick={addSanction}
              disabled={hasUnsavedSanction()}
              className={`group p-1 transition-all duration-200 hover:shadow-sm rounded ${
                hasUnsavedSanction() 
                  ? "text-gray-400 cursor-not-allowed opacity-50" 
                  : "text-[#076784] hover:text-[#065a72] cursor-pointer"
              }`}
              title={
                hasUnsavedSanction() 
                  ? (isRTL ? "يرجى حفظ أو إلغاء العقوبة الحالية أولاً" : "Veuillez sauvegarder ou annuler la sanction actuelle d'abord")
                  : (isRTL ? "إضافة عقوبة" : "Ajouter une sanction")
              }
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-[800px] table-fixed">
              <thead className="bg-gray-100 dark:bg-gray-800 h-[48px]">
                <tr>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '250px'}}>
                    {isRTL ? "النوع" : "Type"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '140px'}}>
                    {isRTL ? "التاريخ" : "Date"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '200px'}}>
                    {isRTL ? "السبب" : "Motif"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '200px'}}>
                    {isRTL ? "السلطة" : "Autorité"}
                  </th>
                  <th className={`px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '120px'}}>
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {sanctionsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${isRTL ? cardSubtitleFontClass : ""}`}>
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span>{isRTL ? "لا توجد عقوبات مسجلة" : "Aucune sanction enregistrée"}</span>
                        <button
                          onClick={addSanction}
                          disabled={hasUnsavedSanction()}
                          className={`mt-2 text-sm underline ${
                            hasUnsavedSanction()
                              ? "text-gray-400 cursor-not-allowed opacity-50"
                              : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                          } ${isRTL ? cardSubtitleFontClass : ""}`}
                          title={
                            hasUnsavedSanction()
                              ? (isRTL ? "يرجى حفظ أو إلغاء العقوبة الحالية أولاً" : "Veuillez sauvegarder ou annuler la sanction actuelle d'abord")
                              : ""
                          }
                        >
                          {isRTL ? "إضافة العقوبة الأولى" : "Ajouter la première sanction"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sanctionsList.map((sanction, index) => (
                  <tr key={sanction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-[48px]">
                    <td className={`px-4 py-2 w-64 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingSanctionIndex === index ? (
                        <Select
                          value={sanction.type_sanction}
                          onValueChange={(value) => updateSanction(index, "type_sanction", value)}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <SelectTrigger className={`w-full px-3 py-1 text-xs !h-[32px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                            <SelectValue placeholder={isRTL ? "النوع..." : "Type..."} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                            {sanctionOptions.map((option) => (
                              <SelectItem
                                className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={sanction.type_sanction || (isRTL ? "غير محدد" : "Non défini")}>
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mr-2" />
                          {sanction.type_sanction || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingSanctionIndex === index ? (
                        <I18nProvider locale="fr-FR">
                          <DateField
                            value={sanction.date_sanction ? parseDate(sanction.date_sanction) : null}
                            onChange={(date) => {
                              const dateStr = date ? date.toString() : ""
                              updateSanction(index, "date_sanction", dateStr)
                            }}
                          >
                            <DateInput
                              focusColor="rgb(7,103,132)"
                              className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                isRTL ? "text-right font-geist-sans text-[15px]" : ""
                              } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            />
                          </DateField>
                        </I18nProvider>
                      ) : (
                        <div className="h-[32px] flex items-center">
                          {formatDateRTL(sanction.date_sanction, isRTL)}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-48 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingSanctionIndex === index ? (
                        <input
                          value={sanction.motif || ""}
                          onChange={(e) => updateSanction(index, "motif", e.target.value)}
                          placeholder={isRTL ? "سبب العقوبة" : "Motif de la sanction"}
                          className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={sanction.motif || (isRTL ? "غير محدد" : "Non défini")}>
                          {sanction.motif || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-48 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingSanctionIndex === index ? (
                        <input
                          type="text"
                          value={sanction.autorite || ""}
                          onChange={(e) => updateSanction(index, "autorite", e.target.value)}
                          placeholder={isRTL ? "السلطة" : "Autorité"}
                          className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={sanction.autorite || (isRTL ? "غير محدد" : "Non défini")}>
                          {sanction.autorite || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 w-24 align-middle">
                      <div className="flex items-center justify-center space-x-2">
                        {editingSanctionIndex === index ? (
                          <>
                            <button
                              onClick={() => saveSanction(index)}
                              className="text-green-600 hover:text-green-800 cursor-pointer"
                              title={isRTL ? "حفظ" : "Sauvegarder"}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const sanction = sanctionsList[index]
                                if (isEmptySanction(sanction) && sanction.id.startsWith("temp-")) {
                                  setSanctionsList(sanctionsList.filter((_, i) => i !== index))
                                } else {
                                  // Restaurer les valeurs originales
                                  const originalSanction = originalSanctionsList.find((s) => s.id === sanction.id)
                                  if (originalSanction) {
                                    const updatedSanctions = [...sanctionsList]
                                    updatedSanctions[index] = originalSanction
                                    setSanctionsList(updatedSanctions)
                                  }
                                }
                                setEditingSanctionIndex(null)
                              }}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer"
                              title={isRTL ? "إلـغــــاء" : "Annuler"}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingSanctionIndex(index)}
                              className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                              title={isRTL ? "تعديل" : "Modifier"}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSanction(index)}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              title={isRTL ? "حذف" : "Supprimer"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleDialogClose}
              className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
            >
              {isRTL ? "إغلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog pour Gestion des Récompenses */}
      <Dialog
        isOpen={activeDialog === "recompenses"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة التـشـجيـع والتقديرات" : "Gestion des Récompenses"}
        icon={Award}
        maxWidth="max-w-6xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}>
              {isRTL ? "قائمة التـشـجيـع والتقديرات" : "Liste des Récompenses"}
            </h3>
            <button
              onClick={addRecompense}
              disabled={hasUnsavedRecompense()}
              className={`group p-1 transition-all duration-200 hover:shadow-sm rounded ${
                hasUnsavedRecompense() 
                  ? "text-gray-400 cursor-not-allowed opacity-50" 
                  : "text-[#076784] hover:text-[#065a72] cursor-pointer"
              }`}
              title={
                hasUnsavedRecompense() 
                  ? (isRTL ? "يرجى حفظ أو إلغاء المكافأة الحالية أولاً" : "Veuillez sauvegarder ou annuler la récompense actuelle d'abord")
                  : (isRTL ? "إضافة مكافأة" : "Ajouter une récompense")
              }
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-[800px] table-fixed">
              <thead className="bg-gray-100 dark:bg-gray-800 h-[48px]">
                <tr>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '250px'}}>
                    {isRTL ? "النوع" : "Type"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '140px'}}>
                    {isRTL ? "التاريخ" : "Date"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '200px'}}>
                    {isRTL ? "السبب" : "Motif"}
                  </th>
                  <th className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '200px'}}>
                    {isRTL ? "السلطة" : "Autorité"}
                  </th>
                  <th className={`px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? cardSubtitleFontClass : ""}`} style={{width: '120px'}}>
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {recompensesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${isRTL ? cardSubtitleFontClass : ""}`}>
                      <div className="flex flex-col items-center">
                        <Award className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span>{isRTL ? "لا توجد مكافآت مسجلة" : "Aucune récompense enregistrée"}</span>
                        <button
                          onClick={addRecompense}
                          disabled={hasUnsavedRecompense()}
                          className={`mt-2 text-sm underline ${
                            hasUnsavedRecompense()
                              ? "text-gray-400 cursor-not-allowed opacity-50"
                              : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                          } ${isRTL ? cardSubtitleFontClass : ""}`}
                          title={
                            hasUnsavedRecompense()
                              ? (isRTL ? "يرجى حفظ أو إلغاء المكافأة الحالية أولاً" : "Veuillez sauvegarder ou annuler la récompense actuelle d'abord")
                              : ""
                          }
                        >
                          {isRTL ? "إضافة المكافأة الأولى" : "Ajouter la première récompense"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recompensesList.map((recompense, index) => (
                  <tr key={recompense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-[48px]">
                    <td className={`px-4 py-2 w-64 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingRecompenseIndex === index ? (
                        <Select
                          value={recompense.type_recompense}
                          onValueChange={(value) => updateRecompense(index, "type_recompense", value)}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <SelectTrigger className={`w-full px-3 py-1 text-xs !h-[32px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                            <SelectValue placeholder={isRTL ? "النوع..." : "Type..."} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                            {recompenseOptions.map((option) => (
                              <SelectItem
                                className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={recompense.type_recompense || (isRTL ? "غير محدد" : "Non défini")}>
                          <Award className="w-4 h-4 text-green-600 flex-shrink-0 mr-2" />
                          {recompense.type_recompense || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingRecompenseIndex === index ? (
                        <I18nProvider locale="fr-FR">
                          <DateField
                            value={recompense.date_recompense ? parseDate(recompense.date_recompense) : null}
                            onChange={(date) => {
                              const dateStr = date ? date.toString() : ""
                              updateRecompense(index, "date_recompense", dateStr)
                            }}
                          >
                            <DateInput
                              focusColor="rgb(7,103,132)"
                              className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                isRTL ? "text-right font-geist-sans text-[15px]" : ""
                              } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            />
                          </DateField>
                        </I18nProvider>
                      ) : (
                        <div className="h-[32px] flex items-center">
                          {formatDateRTL(recompense.date_recompense, isRTL)}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-48 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingRecompenseIndex === index ? (
                        <input
                          value={recompense.motif || ""}
                          onChange={(e) => updateRecompense(index, "motif", e.target.value)}
                          placeholder={isRTL ? "سبب المكافأة" : "Motif de la récompense"}
                          className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={recompense.motif || (isRTL ? "غير محدد" : "Non défini")}>
                          {recompense.motif || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-2 w-48 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                      {editingRecompenseIndex === index ? (
                        <input
                          type="text"
                          value={recompense.autorite || ""}
                          onChange={(e) => updateRecompense(index, "autorite", e.target.value)}
                          placeholder={isRTL ? "السلطة" : "Autorité"}
                          className={`w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        />
                      ) : (
                        <div className="truncate h-[32px] flex items-center" title={recompense.autorite || (isRTL ? "غير محدد" : "Non défini")}>
                          {recompense.autorite || (isRTL ? "غير محدد" : "Non défini")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 w-24 align-middle">
                      <div className="flex items-center justify-center space-x-2">
                        {editingRecompenseIndex === index ? (
                          <>
                            <button
                              onClick={() => saveRecompense(index)}
                              className="text-green-600 hover:text-green-800 cursor-pointer"
                              title={isRTL ? "حفظ" : "Sauvegarder"}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const recompense = recompensesList[index]
                                if (isEmptyRecompense(recompense) && recompense.id.startsWith("temp-")) {
                                  setRecompensesList(recompensesList.filter((_, i) => i !== index))
                                } else {
                                  // Restaurer les valeurs originales
                                  const originalRecompense = originalRecompensesList.find((r) => r.id === recompense.id)
                                  if (originalRecompense) {
                                    const updatedRecompenses = [...recompensesList]
                                    updatedRecompenses[index] = originalRecompense
                                    setRecompensesList(updatedRecompenses)
                                  }
                                }
                                setEditingRecompenseIndex(null)
                              }}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer"
                              title={isRTL ? "إلـغــــاء" : "Annuler"}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingRecompenseIndex(index)}
                              className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                              title={isRTL ? "تعديل" : "Modifier"}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteRecompense(index)}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              title={isRTL ? "حذف" : "Supprimer"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleDialogClose}
              className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${isRTL ? "font-noto-naskh-arabic" : ""}`}
            >
              {isRTL ? "إغلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

// Hook personnalisé pour utiliser les dialogs depuis le composant parent
export function useEditDialogs() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const openSanctionsDialog = () => {
    setActiveDialog("sanctions")
  }

  const openRecompensesDialog = () => {
    setActiveDialog("recompenses")
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return {
    activeDialog,
    openSanctionsDialog,
    openRecompensesDialog,
    closeDialog,
  }
}
