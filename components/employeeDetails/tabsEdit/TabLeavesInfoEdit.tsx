// TabLeavesInfoEdit.tsx
"use client"
import { useEffect, useState, useRef } from "react"
import { X, Save, FileText, Plus, Trash2, Edit, ClipboardList } from "lucide-react"
import { EmployeeCompleteData, EmployeeAbsence } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { getCongeOptions, getTranslatedOptions, getAutomaticLeaveStatus, getTranslatedLeaveStatus } from "@/lib/selectOptions"
import { updateEmployeeStatusBasedOnLeaves, updateEmployeeStatusBasedOnAbsences } from "@/utils/employee-status.utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useParams } from "next/navigation"
import { getTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface EditDialogsProps {
  data: EmployeeCompleteData
  onSave: (field: string, updatedData: any) => void
  activeDialog: string | null
  onClose: () => void
  onEmployeeUpdate?: (updatedEmployee: any) => void // Nouveau callback pour notifier les changements d'employé
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
function Dialog({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-6xl",
  isClosing = false,
  isRTL = false,
}: DialogProps) {
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
          isClosing ? "animate-out slide-out-to-bottom-4 zoom-out-95" : "animate-in slide-in-from-bottom-4 zoom-in-95"
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

export default function EditDialogs({ data, onSave, activeDialog, onClose, onEmployeeUpdate }: EditDialogsProps) {
  // Logique RTL et polices
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)

  // États pour la gestion des congés multiples
  const [congesList, setCongesList] = useState(data.conges || [])
  const [editingCongeIndex, setEditingCongeIndex] = useState<number | null>(null)
  const [originalCongesList, setOriginalCongesList] = useState(data.conges || [])

  // États pour la gestion des absences
  const [absences, setAbsences] = useState<EmployeeAbsence[]>(data.absences || [])
  const [editingAbsenceIndex, setEditingAbsenceIndex] = useState<number | null>(null)
  const [originalAbsencesList, setOriginalAbsencesList] = useState<EmployeeAbsence[]>(data.absences || [])

  // États pour les indicateurs de chargement
  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // États pour la confirmation de suppression
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    index: number
    itemName: string
  }>({
    isOpen: false,
    index: -1,
    itemName: "",
  })

  // État pour les notifications d'erreur
  const [validationError, setValidationError] = useState<{
    isOpen: boolean
    message: string
    congeIndex?: number
  }>({
    isOpen: false,
    message: "",
  })

  // Ref pour l'input durée pour remettre le focus après la notification
  const durationInputRef = useRef<HTMLInputElement>(null)

  // Fonction pour mettre à jour le statut de l'employé basé sur les congés
  const updateEmployeeStatus = async (updatedConges: any[]) => {
    try {
      const supabase = createClient()
      const newStatus = await updateEmployeeStatusBasedOnLeaves(data.employee.id, updatedConges, supabase)

      // Notifier le composant parent du changement de statut
      if (onEmployeeUpdate) {
        const updatedEmployee = { ...data.employee, actif: newStatus }
        onEmployeeUpdate(updatedEmployee)
      }

      console.log(`Statut de l'employé mis à jour: ${newStatus}`)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de l'employé:", error)
    }
  }

  // Fonction pour mettre à jour le statut de l'employé basé sur les absences
  const updateEmployeeStatusForAbsences = async (updatedAbsences: EmployeeAbsence[]) => {
    try {
      const supabase = createClient()
      // Convertir les absences au format attendu par la fonction utilitaire
      const absenceData = updatedAbsences.map(absence => ({
        date_debut: absence.date_debut,
        date_fin: absence.date_fin,
        reference_debut: absence.reference_debut,
        reference_fin: absence.reference_fin,
        duree: absence.duree
      }))

      const newStatus = await updateEmployeeStatusBasedOnAbsences(
        data.employee.id, 
        absenceData, 
        supabase,
        congesList // Inclure les congés pour la logique de priorité
      )

      // Notifier le composant parent du changement de statut
      if (onEmployeeUpdate) {
        const updatedEmployee = { ...data.employee, actif: newStatus }
        onEmployeeUpdate(updatedEmployee)
      }

      console.log(`Statut de l'employé mis à jour basé sur les absences: ${newStatus}`)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de l'employé:", error)
    }
  }

  // Fonction pour formater les dates pour les inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const formatDateWith2DigitDay = (dateString: string) => {
    if (!dateString) return isRTL ? "غير محدد" : "Non défini"
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
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

  // Fonction pour formater les dates d'absence avec le même format
  const formatAbsenceDisplayDate = (dateString: string) => {
    if (!dateString) return isRTL ? "غير محددة" : "Non définie"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return isRTL ? "غير محددة" : "Non définie"
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${year}-${month}-${day}`
    } catch {
      return isRTL ? "غير محددة" : "Non définie"
    }
  }

  // Fonction pour calculer la durée entre deux dates
  const calculateDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le jour de fin
    return diffDays
  }

  // Fonction pour calculer la date de fin à partir de la date de début et de la durée
  const calculateEndDate = (startDate: string, duration: number): string => {
    if (!startDate || !duration) return ""
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + duration - 1) // -1 car on inclut le jour de début
    return end.toISOString().split("T")[0]
  }

  // Fonction pour calculer le solde des congés annuels restant pour une année donnée
  const calculateAnnualLeaveBalance = (year: number, excludeIndex?: number): number => {
    const annualQuota = 45 // 45 jours par année

    // Filtrer les congés annuels et mariage pour l'année donnée (exclure l'index en cours d'édition)
    const relevantLeaves = congesList.filter((conge, index) => {
      // Excluure le congé en cours d'édition pour éviter le double comptage
      if (excludeIndex !== undefined && index === excludeIndex) return false

      // Inclure les congés "Annuel" et "Mariage" car le mariage compte dans le solde annuel
      if (conge.type_conge !== "Annuel" && conge.type_conge !== "Mariage") return false

      // Vérifier que le congé est dans l'année spécifiée
      if (!conge.date_debut) return false
      const leaveYear = new Date(conge.date_debut).getFullYear()
      return leaveYear === year
    })

    // Calculer le total des jours utilisés
    const usedDays = relevantLeaves.reduce((sum, conge) => sum + (conge.duree || 0), 0)

    // Retourner le solde restant
    return Math.max(0, annualQuota - usedDays)
  }

  // Fonction pour ouvrir la confirmation de suppression
  const openDeleteConfirmation = (index: number, itemName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      index,
      itemName,
    })
  }

  // Fonction pour fermer la confirmation de suppression
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      index: -1,
      itemName: "",
    })
  }

  // Fonction pour vérifier si les données d'un congé sont vides
  const isEmptyConge = (conge: any) => {
    return !conge.type_conge && !conge.date_debut && !conge.date_fin
  }

  // Fonction pour vérifier s'il y a des congés non sauvegardés
  const hasUnsavedConge = (): boolean => {
    // Vérifier s'il y a une ligne en cours de modification
    if (editingCongeIndex !== null) {
      return true
    }
    // Vérifier s'il y a des nouvelles lignes non sauvegardées (IDs temporaires)
    return congesList.some(conge => conge.id.toString().startsWith("temp-"))
  }

  // Fonction pour vérifier s'il y a des absences non sauvegardées
  const hasUnsavedAbsence = (): boolean => {
    // Vérifier s'il y a une ligne en cours de modification
    if (editingAbsenceIndex !== null) {
      return true
    }
    // Vérifier s'il y a des nouvelles lignes non sauvegardées (IDs temporaires)
    return absences.some(absence => absence.id.toString().startsWith("temp-"))
  }

  // Fonction pour réinitialiser les données lors de l'annulation
  const resetFormData = () => {
    setCongesList(originalCongesList)
    setEditingCongeIndex(null)
  }

  useEffect(() => {
    setCongesList(data.conges || [])
    setOriginalCongesList(data.conges || [])
    setAbsences(data.absences || [])
    setOriginalAbsencesList(data.absences || [])
  }, [data.conges, data.absences])

  // Fonctions pour la gestion des congés
  const addConge = () => {
    const newConge = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      type_conge: "",
      date_debut: "",
      date_fin: "",
      duree: 0,
      statut: "منتهية",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCongesList([...congesList, newConge])
    setEditingCongeIndex(congesList.length)
  }

  const confirmDeleteConge = (index: number) => {
    const conge = congesList[index]
    const congeName = conge.type_conge || (isRTL ? "هذه الإجازة" : "Ce congé")
    openDeleteConfirmation(index, congeName)
  }

  const deleteConge = async (index: number) => {
    const conge = congesList[index]
    const updatedConges = congesList.filter((_, i) => i !== index)

    if (conge.id.toString().startsWith("temp-")) {
      // Suppression locale pour les nouveaux congés
      setCongesList(updatedConges)
    } else {
      // Suppression dans la base de données
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_conges").delete().eq("id", conge.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setCongesList(updatedConges)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }

    // Mettre à jour le statut de l'employé après suppression (pour tous les cas)
    await updateEmployeeStatus(updatedConges)
    closeDeleteConfirmation()
  }

  // Fonctions pour la gestion des absences
  const isEmptyAbsence = (absence: EmployeeAbsence) => {
    return !absence.date_debut && !absence.reference_debut
  }

  const addAbsence = () => {
    if (!data.employee?.id) {
      console.error("Impossible d'ajouter une absence: employee_id manquant")
      return
    }

    const newAbsence: EmployeeAbsence = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      date_debut: "",
      reference_debut: "",
      date_fin: "",
      reference_fin: "",
      duree: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Ajout d'une nouvelle absence temporaire:", newAbsence)
    setAbsences([...absences, newAbsence])
    setEditingAbsenceIndex(absences.length)
  }

  // Fonction pour calculer la durée en jours entre deux dates pour les absences
  const calculateAbsenceDuration = (dateDebut: string, dateFin: string): number => {
    if (!dateDebut || !dateFin) return 0

    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)

    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0
    if (fin < debut) return 0

    // Calcul de la différence en millisecondes puis conversion en jours
    const diffTime = fin.getTime() - debut.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le jour de fin

    return diffDays
  }

  const updateAbsence = (index: number, field: string, value: string | number) => {
    const updatedAbsences = [...absences]
    const originalAbsence = updatedAbsences[index]
    updatedAbsences[index] = { ...updatedAbsences[index], [field]: value }

    // Si on modifie date_debut ou date_fin, recalculer automatiquement la durée
    if (field === "date_debut" || field === "date_fin") {
      const absence = updatedAbsences[index]
      const dateDebut = field === "date_debut" ? (value as string) : absence.date_debut
      const dateFin = field === "date_fin" ? (value as string) : absence.date_fin

      if (dateDebut && dateFin) {
        updatedAbsences[index] = {
          ...updatedAbsences[index],
          duree: calculateAbsenceDuration(dateDebut, dateFin),
        }
      } else {
        updatedAbsences[index] = {
          ...updatedAbsences[index],
          duree: 0,
        }
      }
    }

    setAbsences(updatedAbsences)

    // Si c'est date_fin qui change et que l'absence n'est pas temporaire (id non temp-),
    // déclencher immédiatement la mise à jour du statut pour une réactivité immédiate
    if (field === "date_fin" && !originalAbsence.id.toString().startsWith("temp-")) {
      const dateFin = value as string
      if (dateFin) {
        const today = new Date()
        const endDate = new Date(dateFin)
        
        // Si la date de fin est dans le passé, l'employé devrait passer à "مباشر"
        if (endDate < today) {
          // Déclencher une mise à jour du statut avec un léger délai pour laisser le temps à l'état de se mettre à jour
          setTimeout(() => {
            updateEmployeeStatusForAbsences(updatedAbsences)
          }, 100)
        }
      }
    }
  }

  const saveAbsence = async (index: number) => {
    const absence = absences[index]

    // Vérifier les données vides
    if (isEmptyAbsence(absence) && absence.id.toString().startsWith("temp-")) {
      setAbsences(absences.filter((_, i) => i !== index))
      setEditingAbsenceIndex(null)
      return
    }

    // Validation des champs obligatoires (date_debut est obligatoire en DB)
    if (!absence.date_debut) {
      console.error("Erreur de validation: date_debut est obligatoire")
      return
    }

    // Validation de l'employee_id
    if (!data.employee?.id) {
      console.error("Erreur de validation: employee_id manquant")
      return
    }

    try {
      const supabase = createClient()
      const updatedAbsences = [...absences]

      console.log("Tentative de sauvegarde absence:", { absence, employee_id: data.employee.id })

      if (absence.id.toString().startsWith("temp-")) {
        // Création
        const insertData = {
          employee_id: data.employee.id,
          date_debut: absence.date_debut,
          reference_debut: absence.reference_debut,
          date_fin: absence.date_fin || null,
          reference_fin: absence.reference_fin || null,
          duree: absence.duree || null,
        }

        console.log("Données à insérer:", insertData)

        const { data: newAbsence, error } = await supabase
          .from("employee_absence")
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error("Erreur Supabase lors de l'insertion:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(`Erreur lors de la création de l'absence: ${error.message}`)
        }

        if (!newAbsence) {
          throw new Error("Aucune donnée retournée après l'insertion")
        }

        console.log("Absence créée avec succès:", newAbsence)
        updatedAbsences[index] = newAbsence
        setAbsences(updatedAbsences)
      } else {
        // Mise à jour
        const updateData = {
          date_debut: absence.date_debut,
          reference_debut: absence.reference_debut,
          date_fin: absence.date_fin || null,
          reference_fin: absence.reference_fin || null,
          duree: absence.duree || null,
        }

        console.log("Données à mettre à jour:", updateData, "pour ID:", absence.id)

        const { error } = await supabase
          .from("employee_absence")
          .update(updateData)
          .eq("id", absence.id)

        if (error) {
          console.error("Erreur Supabase lors de la mise à jour:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(`Erreur lors de la mise à jour de l'absence: ${error.message}`)
        }

        console.log("Absence mise à jour avec succès")
      }

      // Appel onSave APRÈS la mise à jour
      onSave("absences", updatedAbsences)
      setEditingAbsenceIndex(null)

      // Mettre à jour le statut de l'employé après la sauvegarde
      await updateEmployeeStatusForAbsences(updatedAbsences)
      
      console.log("Sauvegarde terminée avec succès")
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'absence:", error)
      // Optionnel: afficher un toast d'erreur à l'utilisateur
    }
  }

  const deleteAbsence = async (index: number) => {
    const absence = absences[index]
    const updatedAbsences = absences.filter((_, i) => i !== index)

    if (absence.id.toString().startsWith("temp-")) {
      console.log("Suppression d'une absence temporaire:", absence.id)
      setAbsences(updatedAbsences)
      onSave("absences", updatedAbsences)
      
      // Mettre à jour le statut de l'employé après suppression d'une absence temporaire
      await updateEmployeeStatusForAbsences(updatedAbsences)
    } else {
      try {
        console.log("Tentative de suppression de l'absence:", absence.id)
        const supabase = createClient()
        const { error } = await supabase.from("employee_absence").delete().eq("id", absence.id)

        if (error) {
          console.error("Erreur Supabase lors de la suppression:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return
        }

        console.log("Absence supprimée avec succès")
        setAbsences(updatedAbsences)
        onSave("absences", updatedAbsences)
        
        // Mettre à jour le statut de l'employé après suppression
        await updateEmployeeStatusForAbsences(updatedAbsences)
      } catch (error) {
        console.error("Erreur lors de la suppression de l'absence:", error)
        return
      }
    }
  }

  const updateConge = (index: number, field: string, value: string | number) => {
    const updatedConges = [...congesList]
    updatedConges[index] = { ...updatedConges[index], [field]: value }

    const conge = updatedConges[index]

    // Validation pour les congés annuels et mariage (y compris lors du changement de type)
    if (
      (field === "duree" || field === "date_debut" || field === "type_conge") &&
      (conge.type_conge === "Annuel" ||
        conge.type_conge === "Mariage" ||
        (field === "type_conge" && (value === "Annuel" || value === "Mariage")))
    ) {
      let year: number | null = null
      let durationToCheck = 0

      if (field === "duree") {
        durationToCheck = typeof value === "number" ? value : parseInt(value.toString()) || 0
        if (conge.date_debut) {
          year = new Date(conge.date_debut).getFullYear()
        }
      } else if (field === "date_debut") {
        year = new Date(value.toString()).getFullYear()
        durationToCheck = conge.duree || 0
      } else if (field === "type_conge") {
        // Lors du changement de type vers Annuel ou Mariage
        if (conge.date_debut && conge.duree) {
          year = new Date(conge.date_debut).getFullYear()
          durationToCheck = conge.duree
        }
      }

      if (year && durationToCheck > 0) {
        const remainingBalance = calculateAnnualLeaveBalance(year, index)

        if (durationToCheck > remainingBalance) {
          setValidationError({
            isOpen: true,
            message: isRTL
              ? `تحذير: لا يتبقى سوى ${remainingBalance} ${
                  remainingBalance === 1 ? "يوم" : "أيام"
                } من الإجازة السنوية للعام ${year}. يرجى تعديل المدة.`
              : `Attention : Il ne reste que ${remainingBalance} jour${
                  remainingBalance > 1 ? "s" : ""
                } de congé annuel pour l'année ${year}. Veuillez ajuster la durée.`,
            congeIndex: index,
          })
          // Ne pas appliquer la modification si elle dépasse le solde
          return
        }
      }
    }

    // Calculer la date de fin si la date de début ou la durée changent
    if (field === "date_debut" || field === "duree") {
      if (conge.date_debut && conge.duree > 0) {
        updatedConges[index].date_fin = calculateEndDate(conge.date_debut, conge.duree)
        // Calculer automatiquement le nouveau statut
        updatedConges[index].statut = getAutomaticLeaveStatus(conge.date_debut, updatedConges[index].date_fin)
      }
    }
    // Si c'est la date de fin qui change, recalculer la durée
    else if (field === "date_fin") {
      if (conge.date_debut && conge.date_fin) {
        const newDuration = calculateDuration(conge.date_debut, conge.date_fin)
        updatedConges[index].duree = newDuration
        // Calculer automatiquement le nouveau statut
        updatedConges[index].statut = getAutomaticLeaveStatus(conge.date_debut, conge.date_fin)

        // Validation après recalcul de la durée pour les congés annuels/mariage
        if (conge.type_conge === "Annuel" || conge.type_conge === "Mariage") {
          const year = new Date(conge.date_debut).getFullYear()
          const remainingBalance = calculateAnnualLeaveBalance(year, index)

          if (newDuration > remainingBalance) {
            setValidationError({
              isOpen: true,
              message: isRTL
                ? `تحذير: لا يتبقى سوى ${remainingBalance} ${
                    remainingBalance === 1 ? "يوم" : "أيام"
                  } من الإجازة السنوية للعام ${year}. يرجى تعديل التواريخ.`
                : `Attention : Il ne reste que ${remainingBalance} jour${
                    remainingBalance > 1 ? "s" : ""
                  } de congé annuel pour l'année ${year}. Veuillez ajuster les dates.`,
              congeIndex: index,
            })
            // Ne pas appliquer la modification si elle dépasse le solde
            return
          }
        }
      }
    }

    setCongesList(updatedConges)
  }

  const saveConge = async (index: number) => {
    const conge = congesList[index]

    // Vérifier les données vides
    if (isEmptyConge(conge) && conge.id.toString().startsWith("temp-")) {
      setCongesList(congesList.filter((_, i) => i !== index))
      setEditingCongeIndex(null)
      return
    }

    // Validation pour empêcher l'enregistrement de congés avec 0 jour
    if (!conge.duree || conge.duree <= 0) {
      setValidationError({
        isOpen: true,
        message: isRTL
          ? "يجب أن تكون مدة الإجازة أكبر من 0 يوم. يرجى إدخال مدة صحيحة."
          : "La durée du congé doit être supérieure à 0 jour. Veuillez saisir une durée valide.",
        congeIndex: index,
      })
      return
    }

    // Validation supplémentaire pour les champs obligatoires
    if (!conge.type_conge || !conge.date_debut) {
      setValidationError({
        isOpen: true,
        message: isRTL
          ? "يرجى ملء جميع الحقول المطلوبة (النوع، تاريخ البداية، المدة)."
          : "Veuillez remplir tous les champs obligatoires (Type, Date de début, Durée).",
        congeIndex: index,
      })
      return
    }

    try {
      const supabase = createClient()
      const updatedConges = [...congesList]

      if (conge.id.toString().startsWith("temp-")) {
        // Création
        const automaticStatus = getAutomaticLeaveStatus(conge.date_debut, conge.date_fin)
        const { data: newConge, error } = await supabase
          .from("employee_conges")
          .insert({
            employee_id: data.employee.id,
            type_conge: conge.type_conge,
            date_debut: conge.date_debut,
            date_fin: conge.date_fin,
            duree: conge.duree,
            statut: automaticStatus,
          })
          .select()
          .single()

        if (error) throw error

        // Mise à jour locale avec nouvel ID
        updatedConges[index] = newConge
        setCongesList(updatedConges)
      } else {
        // Mise à jour
        const automaticStatus = getAutomaticLeaveStatus(conge.date_debut, conge.date_fin)
        const { error } = await supabase
          .from("employee_conges")
          .update({
            type_conge: conge.type_conge,
            date_debut: conge.date_debut,
            date_fin: conge.date_fin,
            duree: conge.duree,
            statut: automaticStatus,
          })
          .eq("id", conge.id)

        if (error) throw error
        
        // Mettre à jour le statut localement aussi
        updatedConges[index].statut = automaticStatus
      }

      // Appel onSave APRÈS la mise à jour
      onSave("conges", updatedConges)
      setEditingCongeIndex(null)

      // Mettre à jour le statut de l'employé basé sur les nouveaux congés
      await updateEmployeeStatus(updatedConges)
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
      {/* Dialog pour Gestion des Congés */}
      <Dialog
        isOpen={activeDialog === "conges"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة سجل الإجازات" : "Gestion de l'Historique des Congés"}
        icon={FileText}
        maxWidth="max-w-7xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3
              className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}
            >
              {isRTL ? "قائمة الإجازات" : "Liste des Congés"}
            </h3>
            <button
              onClick={addConge}
              disabled={hasUnsavedConge()}
              className={`group p-1 transition-all duration-200 rounded ${
                hasUnsavedConge()
                  ? "text-gray-400 cursor-not-allowed opacity-50"
                  : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
              }`}
              title={
                hasUnsavedConge()
                  ? isRTL
                    ? "انتهي من التعديل أولاً"
                    : "Veuillez finir l'édition en cours"
                  : isRTL
                  ? "إضافة إجازة"
                  : "Ajouter un congé"
              }
            >
              <Plus className={`h-4 w-4 transition-transform duration-200 ${
                hasUnsavedConge() ? "" : "group-hover:scale-110"
              }`} />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-200 table-fixed" dir={isRTL ? "rtl" : "ltr"}>
              <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                <tr>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "150px" }}
                  >
                    {isRTL ? "النوع" : "Type"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "تاريخ البداية" : "Date Début"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "100px" }}
                  >
                    {isRTL ? "المدة" : "Durée"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "تـاريــخ النهـايــة" : "Date Fin"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "100px" }}
                  >
                    {isRTL ? "الحالة" : "Statut"}
                  </th>
                  <th
                    className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "120px" }}
                  >
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {congesList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span>{isRTL ? "لا توجد إجازات مسجلة" : "Aucun congé enregistré"}</span>
                        <button
                          onClick={addConge}
                          disabled={hasUnsavedConge()}
                          className={`mt-2 text-sm underline transition-all duration-200 ${
                            isRTL ? cardSubtitleFontClass : ""
                          } ${
                            hasUnsavedConge()
                              ? "text-gray-400 cursor-not-allowed opacity-50"
                              : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                          }`}
                          title={
                            hasUnsavedConge()
                              ? isRTL
                                ? "انتهي من التعديل أولاً"
                                : "Veuillez finir l'édition en cours"
                              : isRTL
                              ? "إضافة الإجازة الأولى"
                              : "Ajouter le premier congé"
                          }
                        >
                          {isRTL ? "إضافة الإجازة الأولى" : "Ajouter le premier congé"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  congesList.map((conge, index) => (
                    <tr key={conge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 h-12">
                      <td className="px-4 py-2 w-48 align-middle">
                        {editingCongeIndex === index ? (
                          <Select
                            value={conge.type_conge}
                            onValueChange={(value) => updateConge(index, "type_conge", value)}
                          >
                            <SelectTrigger
                              className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                isRTL ? "font-noto-naskh-arabic" : ""
                              }`}
                              dir={isRTL ? "rtl" : "ltr"}
                            >
                              <SelectValue placeholder={isRTL ? "النوع..." : "Type..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                              {getTranslatedOptions(getCongeOptions(data.employee?.sexe), isRTL).map((option) => (
                                <SelectItem
                                  className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                    isRTL ? "font-noto-naskh-arabic" : ""
                                  }`}
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${
                              isRTL ? "space-x-reverse space-x-2" : ""
                            }`}
                            title={conge.type_conge || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            <FileText className={`w-4 h-4 text-blue-600 shrink-0 ${isRTL ? "ml-2" : "mr-2"}`} />
                            <span className={isRTL ? "font-noto-naskh-arabic" : ""}>
                              {conge.type_conge || (isRTL ? "غير محدد" : "Non défini")}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                        {editingCongeIndex === index ? (
                          <I18nProvider locale="fr-FR">
                            <DateField
                              value={conge.date_debut ? parseDate(conge.date_debut) : null}
                              onChange={(date) => {
                                const dateStr = date ? date.toString() : ""
                                updateConge(index, "date_debut", dateStr)
                              }}
                            >
                              <DateInput
                                focusColor="rgb(7,103,132)"
                                className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "text-right font-geist-sans text-[15px]" : ""
                                } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                              />
                            </DateField>
                          </I18nProvider>
                        ) : (
                          <div className="h-8 flex items-center">
                            {formatDateRTL(conge.date_debut, isRTL)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-20 align-middle">
                        {editingCongeIndex === index ? (
                          <input
                            ref={durationInputRef}
                            type="number"
                            min="1"
                            value={conge.duree || ""}
                            onChange={(e) => updateConge(index, "duree", parseInt(e.target.value) || 0)}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                            dir={isRTL ? "rtl" : "ltr"}
                            placeholder={(() => {
                              // Calculer les jours restants pour le placeholder
                              if (
                                (conge.type_conge === "Annuel" || conge.type_conge === "Mariage") &&
                                conge.date_debut
                              ) {
                                const year = new Date(conge.date_debut).getFullYear()
                                const remaining = calculateAnnualLeaveBalance(year, index)
                                return isRTL
                                  ? `الحد الأقصى: ${remaining} ${remaining === 1 ? "يوم" : "أيام"}`
                                  : `Max: ${remaining} jour${remaining > 1 ? "s" : ""}`
                              }
                              return isRTL ? "أيام" : "Jours"
                            })()}
                          />
                        ) : (
                          <div
                            className={`h-8 flex items-center ${
                              isRTL ? "space-x-reverse space-x-1" : "space-x-1"
                            }`}
                          >
                            <span
                              className={`text-sm font-medium text-gray-900 dark:text-gray-300 ${
                                isRTL ? "font-noto-naskh-arabic" : ""
                              }`}
                            >
                              {conge.duree || 0}
                            </span>
                            <div
                              className={`text-xs text-gray-500 dark:text-gray-400 ${
                                isRTL ? "mr-1 font-noto-naskh-arabic" : "ml-1"
                              }`}
                            >
                              {isRTL
                                ? (conge.duree || 0) === 1
                                  ? "يوم"
                                  : "أيام"
                                : `jour${(conge.duree || 0) > 1 ? "s" : ""}`}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-32 align-middle">
                        <div className={`h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {conge.date_fin ? formatDateWith2DigitDay(conge.date_fin) : isRTL ? "غير محدد" : "Non défini"}
                        </div>
                      </td>
                      <td className="px-4 py-2 w-20 align-middle">
                        <div
                          className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                          title={(() => {
                            const automaticStatus = getAutomaticLeaveStatus(conge.date_debut, conge.date_fin);
                            return getTranslatedLeaveStatus(automaticStatus, isRTL);
                          })()}
                        >
                          {(() => {
                            const automaticStatus = getAutomaticLeaveStatus(conge.date_debut, conge.date_fin);
                            return getTranslatedLeaveStatus(automaticStatus, isRTL);
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className={`flex items-center justify-center gap-2`}>
                          {editingCongeIndex === index ? (
                            <>
                              <button
                                onClick={() => saveConge(index)}
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                                title={isRTL ? "حفظ" : "Sauvegarder"}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const conge = congesList[index]
                                  // Si c'est une nouvelle ligne temporaire, la supprimer directement
                                  if (conge.id.toString().startsWith("temp-")) {
                                    setCongesList(congesList.filter((_, i) => i !== index))
                                  } else {
                                    // Restaurer les valeurs originales pour les lignes existantes
                                    const originalConge = originalCongesList.find((c) => c.id === conge.id)
                                    if (originalConge) {
                                      const updatedConges = [...congesList]
                                      updatedConges[index] = originalConge
                                      setCongesList(updatedConges)
                                    }
                                  }
                                  setEditingCongeIndex(null)
                                }}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                                title={isRTL ? "إلـغــــاء" : "Annuler"}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingCongeIndex(index)}
                                className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                title={isRTL ? "تعديل" : "Modifier"}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => confirmDeleteConge(index)}
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

          <div
            className={`flex justify-end ${
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            } pt-5 border-t border-gray-200 dark:border-gray-600`}
          >
            <button
              onClick={handleDialogClose}
              className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "إغـــــلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog pour Gestion des Absences */}
      <Dialog
        isOpen={activeDialog === "absences"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة الغيابات" : "Gestion des Absences"}
        icon={ClipboardList}
        maxWidth="max-w-7xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}>
              {isRTL ? "قائمة الغيابات" : "Liste des Absences"}
            </h3>
            <button
              onClick={addAbsence}
              disabled={hasUnsavedAbsence()}
              className={`group p-1 transition-all duration-200 rounded ${
                hasUnsavedAbsence()
                  ? "text-gray-400 cursor-not-allowed opacity-50"
                  : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
              }`}
              title={
                hasUnsavedAbsence()
                  ? isRTL
                    ? "انتهي من التعديل أولاً"
                    : "Veuillez finir l'édition en cours"
                  : isRTL
                  ? "إضافة غياب"
                  : "Ajouter une absence"
              }
            >
              <Plus className={`h-4 w-4 transition-transform duration-200 ${
                hasUnsavedAbsence() ? "" : "group-hover:scale-110"
              }`} />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-237.5 table-fixed" dir={isRTL ? "rtl" : "ltr"}>
              <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                <tr>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "تاريخ البداية" : "Date Début"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "160px" }}
                  >
                    {isRTL ? "مرجع البداية" : "Référence Début"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "تـاريــخ النهـايــة" : "Date Fin"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "160px" }}
                  >
                    {isRTL ? "مرجع النهاية" : "Référence Fin"}
                  </th>
                  <th
                    className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "120px" }}
                  >
                    {isRTL ? "المدة (أيام)" : "Durée (jours)"}
                  </th>
                  <th
                    className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? cardSubtitleFontClass : ""
                    }`}
                    style={{ width: "130px" }}
                  >
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {absences.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span>{isRTL ? "لا توجد غيابات مسجلة" : "Aucune absence enregistrée"}</span>
                        <button
                          onClick={addAbsence}
                          disabled={hasUnsavedAbsence()}
                          className={`mt-2 text-sm underline transition-all duration-200 ${
                            isRTL ? cardSubtitleFontClass : ""
                          } ${
                            hasUnsavedAbsence()
                              ? "text-gray-400 cursor-not-allowed opacity-50"
                              : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                          }`}
                          title={
                            hasUnsavedAbsence()
                              ? isRTL
                                ? "انتهي من التعديل أولاً"
                                : "Veuillez finir l'édition en cours"
                              : isRTL
                              ? "إضافة الغياب الأول"
                              : "Ajouter la première absence"
                          }
                        >
                          {isRTL ? "إضافة الغياب الأول" : "Ajouter la première absence"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  absences.map((absence, index) => (
                    <tr key={absence.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                      <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                        {editingAbsenceIndex === index ? (
                          <I18nProvider locale="fr-FR">
                            <DateField
                              value={absence.date_debut ? parseDate(absence.date_debut) : null}
                              onChange={(date) => {
                                const dateStr = date ? date.toString() : ""
                                updateAbsence(index, "date_debut", dateStr)
                              }}
                            >
                              <DateInput
                                focusColor="rgb(7,103,132)"
                                className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "text-right font-geist-sans text-[15px]" : ""
                                } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                              />
                            </DateField>
                          </I18nProvider>
                        ) : (
                          <div className="h-8 flex items-center">
                            {formatDateRTL(absence.date_debut, isRTL)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-44 align-middle">
                        {editingAbsenceIndex === index ? (
                          <input
                            type="text"
                            value={absence.reference_debut || ""}
                            onChange={(e) => updateAbsence(index, "reference_debut", e.target.value)}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                            placeholder={isRTL ? "مرجع البداية..." : "Référence début..."}
                            dir={isRTL ? "rtl" : "ltr"}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={absence.reference_debut || (isRTL ? "غير محددة" : "Non définie")}
                          >
                            {absence.reference_debut || (isRTL ? "غير محددة" : "Non définie")}
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                        {editingAbsenceIndex === index ? (
                          <I18nProvider locale="fr-FR">
                            <DateField
                              value={absence.date_fin ? parseDate(absence.date_fin) : null}
                              onChange={(date) => {
                                const dateStr = date ? date.toString() : ""
                                updateAbsence(index, "date_fin", dateStr)
                              }}
                            >
                              <DateInput
                                focusColor="rgb(7,103,132)"
                                className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "text-right font-geist-sans text-[15px]" : ""
                                } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                              />
                            </DateField>
                          </I18nProvider>
                        ) : (
                          <div className="h-8 flex items-center">
                            {formatDateRTL(absence.date_fin, isRTL)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-40 align-middle">
                        {editingAbsenceIndex === index ? (
                          <input
                            type="text"
                            value={absence.reference_fin || ""}
                            onChange={(e) => updateAbsence(index, "reference_fin", e.target.value)}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                            placeholder={isRTL ? "مرجع النهاية..." : "Référence fin..."}
                            dir={isRTL ? "rtl" : "ltr"}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={absence.reference_fin || (isRTL ? "غير محددة" : "Non définie")}
                          >
                            {absence.reference_fin || (isRTL ? "غير محددة" : "Non définie")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-30 align-middle">
                        <div className="h-8 flex items-center justify-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              absence.duree && absence.duree > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            } ${isRTL ? cardSubtitleFontClass : ""}`}
                          >
                            {absence.duree && absence.duree > 0
                              ? isRTL 
                                ? `${absence.duree} ${absence.duree === 1 ? "يوم" : "أيام"}`
                                : `${absence.duree} jour${absence.duree > 1 ? "s" : ""}`
                              : (isRTL ? "غير محسوبة" : "Non calculée")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 w-32 align-middle">
                        <div className="flex items-center justify-center space-x-2">
                          {editingAbsenceIndex === index ? (
                            <>
                              <button
                                onClick={() => saveAbsence(index)}
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                                title={isRTL ? "حفظ" : "Sauvegarder"}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const absence = absences[index]
                                  if (absence.id.toString().startsWith("temp-")) {
                                    // Pour les nouvelles lignes temporaires, toujours les supprimer
                                    setAbsences(absences.filter((_, i) => i !== index))
                                  } else {
                                    // Restaurer les valeurs originales pour les lignes existantes
                                    const originalAbsence = originalAbsencesList.find((a) => a.id === absence.id)
                                    if (originalAbsence) {
                                      const updatedAbsences = [...absences]
                                      updatedAbsences[index] = originalAbsence
                                      setAbsences(updatedAbsences)
                                    }
                                  }
                                  setEditingAbsenceIndex(null)
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
                                onClick={() => setEditingAbsenceIndex(index)}
                                className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                title={isRTL ? "تعديل" : "Modifier"}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteAbsence(index)}
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

          <div
            className={`flex justify-end ${
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            } pt-5 border-t border-gray-200 dark:border-gray-600`}
          >
            <button
              onClick={handleDialogClose}
              className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "إغـــــلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* AlertDialog pour confirmation de suppression */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(open) => !open && closeDeleteConfirmation()}>
        <AlertDialogContent
          className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {isRTL ? "تأكيد الحذف" : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {isRTL
                ? `هل أنت متأكد من حذف "${deleteConfirmation.itemName}"؟ هذا الإجراء غير قابل للإلغاء.`
                : `Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.itemName}" ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel
              onClick={closeDeleteConfirmation}
              className={`cursor-pointer ${isRTL ? "font-noto-naskh-arabic" : ""}`}
            >
              {isRTL ? "إلـغــــاء" : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConge(deleteConfirmation.index)}
              className={`bg-red-600 hover:bg-red-700 text-white cursor-pointer ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "حذف" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour les erreurs de validation */}
      <AlertDialog
        open={validationError.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Reset l'input durée et remettre le focus
            if (validationError.congeIndex !== undefined) {
              const updatedConges = [...congesList]
              updatedConges[validationError.congeIndex].duree = 0
              setCongesList(updatedConges)
            }
            setValidationError({ isOpen: false, message: "" })
            // Remettre le focus sur l'input durée après un court délai
            setTimeout(() => {
              durationInputRef.current?.focus()
            }, 100)
          }
        }}
      >
        <AlertDialogContent
          className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {isRTL ? "التحقق من رصيد الإجازات" : "Validation du solde de congés"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {validationError.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                // Reset l'input durée et remettre le focus
                if (validationError.congeIndex !== undefined) {
                  const updatedConges = [...congesList]
                  updatedConges[validationError.congeIndex].duree = 0
                  setCongesList(updatedConges)
                }
                setValidationError({ isOpen: false, message: "" })
                // Remettre le focus sur l'input durée après un court délai
                setTimeout(() => {
                  durationInputRef.current?.focus()
                }, 100)
              }}
              className={`bg-[#076784] hover:bg-[#065a72] text-white cursor-pointer ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "مفهوم" : "Compris"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Hook personnalisé pour utiliser les dialogs depuis le composant parent
export function useEditDialogs() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const openCongesDialog = () => {
    setActiveDialog("conges")
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return {
    activeDialog,
    openCongesDialog,
    closeDialog,
  }
}
