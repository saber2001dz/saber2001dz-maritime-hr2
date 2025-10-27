// TabFamilyInfoEdit.tsx
"use client"
import { useState } from "react"
import { X, Save, Heart, Users, Phone, Plus, Trash2, Edit, Baby } from "lucide-react"
import { EmployeeCompleteData } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { etatCivilFamilyOptions, sexeOptions, relationshipOptions, niveauScolaireOptions, getTranslatedOptions } from "@/lib/selectOptions"
import { useParams } from "next/navigation"
import { getTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee } from "@/lib/direction"
import type { Locale } from "@/lib/types"
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

interface EditDialogsProps {
  data: EmployeeCompleteData
  onSave: (field: string, updatedData: any) => void
  activeDialog: string | null
  onClose: () => void
  showToast?: (variant: "success" | "error", title: string, message: string) => void
}

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: any
  children: React.ReactNode
  maxWidth?: string
  isClosing?: boolean
}

// Composant Dialog générique
function Dialog({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  children, 
  maxWidth = "max-w-4xl", 
  isClosing = false,
  isRTL = false 
}: DialogProps & { isRTL?: boolean }) {
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

// Composant Input générique
function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  isRTL?: boolean
}) {
  return (
    <div className="group">
      <label className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 !h-[40px] font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      />
    </div>
  )
}

// Composant Select générique
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  isRTL?: boolean
}) {
  return (
    <div className="group">
      <label className={`block text-sm text-start font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}>
        {label}
      </label>
      <Select dir={isRTL ? "rtl" : "ltr"} value={value} onValueChange={onChange}>
        <SelectTrigger className={`w-full px-3 py-2 text-sm !h-[40px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
            isRTL ? "font-noto-naskh-arabic" : ""
          }`}>
          <SelectValue
            className={`text-gray-900 dark:text-gray-300 text-base ${isRTL ? "font-noto-naskh-arabic" : ""}`}
            placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-gray-600 shadow-lg">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function EditDialogs({ data, onSave, activeDialog, onClose, showToast }: EditDialogsProps) {
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)

  // États initiaux pour réinitialiser les données
  const initialFamilyData = {
    etat_civil: data.etat_civil?.[0]?.etat_civil || "",
    date_etat_civil: data.etat_civil?.[0]?.date_etat_civil || "",
    identite_conjoint: data.etat_civil?.[0]?.identite_conjoint || "",
    travail_conjoint: data.etat_civil?.[0]?.travail_conjoint || "",
    matricule_mutuel: data.employee.matricule_mutuel || "",
  }

  const initialContactData = {
    prenom_nom: data.urgent_contacts?.[0]?.prenom_nom || "",
    phone: data.urgent_contacts?.[0]?.phone || "",
    relationship: data.urgent_contacts?.[0]?.relationship || "",
  }

  // États pour les données
  const [familyData, setFamilyData] = useState(initialFamilyData)
  const [contactData, setContactData] = useState(initialContactData)

  // États pour la gestion des enfants multiples
  const [enfantsList, setEnfantsList] = useState(data.enfants || [])
  const [editingEnfantIndex, setEditingEnfantIndex] = useState<number | null>(null)

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

  // Fonction pour vérifier si les données d'un enfant sont vides
  const isEmptyEnfant = (enfant: any) => {
    return !enfant.prenom && !enfant.sexe && !enfant.date_naissance && !enfant.niveau_scolaire
  }

  // Fonction pour réinitialiser les données lors de l'annulation
  const resetFormData = () => {
    setFamilyData(initialFamilyData)
    setContactData(initialContactData)
    setEnfantsList(data.enfants || [])
    setEditingEnfantIndex(null)
  }

  // Fonction pour gérer la fermeture du dialogue avec réinitialisation
  const handleDialogClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      // Supprimer les enfants temporaires non sauvegardés (ceux avec un ID temp-)
      const filteredEnfants = enfantsList.filter(enfant => !enfant.id.startsWith("temp-"))
      setEnfantsList(filteredEnfants)
      setEditingEnfantIndex(null)
      handleCancel()
      setIsClosing(false)
    }, 300)
  }

  // Fonctions pour la gestion des enfants
  const addEnfant = () => {
    const newEnfant = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      prenom: "",
      sexe: "",
      date_naissance: "",
      niveau_scolaire: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setEnfantsList([...enfantsList, newEnfant])
    setEditingEnfantIndex(enfantsList.length)
  }

  const confirmDeleteEnfant = (index: number) => {
    const enfant = enfantsList[index]
    const enfantName = enfant.prenom || "Cet enfant"
    openDeleteConfirmation(index, enfantName)
  }

  const deleteEnfant = async (index: number) => {
    const enfant = enfantsList[index]
    if (enfant.id.startsWith("temp-")) {
      // Suppression locale pour les nouveaux enfants
      const updatedEnfants = enfantsList.filter((_, i) => i !== index)
      setEnfantsList(updatedEnfants)
      onSave("enfants", updatedEnfants)
    } else {
      // Suppression dans la base de données
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_enfants").delete().eq("id", enfant.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          showToast?.("error", "Erreur de suppression", "Erreur lors de la suppression de l'enfant")
          return
        }

        const updatedEnfants = enfantsList.filter((_, i) => i !== index)
        setEnfantsList(updatedEnfants)
        onSave("enfants", updatedEnfants)
        showToast?.("success", "Enfant supprimé", "L'enfant a été supprimé avec succès")
      } catch (error) {
        console.error("Erreur:", error)
        showToast?.("error", "Erreur de suppression", "Erreur lors de la suppression de l'enfant")
      }
    }
    closeDeleteConfirmation()
  }

  const updateEnfant = (index: number, field: string, value: string) => {
    const updatedEnfants = [...enfantsList]
    updatedEnfants[index] = { ...updatedEnfants[index], [field]: value }
    setEnfantsList(updatedEnfants)
  }

  const saveEnfant = async (index: number) => {
    const enfant = enfantsList[index]

    // Vérifier si les données sont vides
    if (isEmptyEnfant(enfant) && enfant.id.startsWith("temp-")) {
      // Supprimer la ligne vide
      setEnfantsList(enfantsList.filter((_, i) => i !== index))
      setEditingEnfantIndex(null)
      return
    }

    // Validation des champs requis
    if (!enfant.prenom || !enfant.sexe) {
      showToast?.("error", "Champs requis", "Le prénom et le sexe sont obligatoires")
      return
    }

    try {
      const supabase = createClient()

      if (enfant.id.startsWith("temp-")) {
        // Création d'un nouvel enfant
        const { data: newEnfant, error } = await supabase
          .from("employee_enfants")
          .insert({
            employee_id: data.employee.id,
            prenom: enfant.prenom.trim(),
            sexe: enfant.sexe,
            date_naissance: enfant.date_naissance || null,
            niveau_scolaire: enfant.niveau_scolaire || null,
          })
          .select()
          .single()

        if (error) {
          console.error("Erreur lors de la création:", error)
          showToast?.(
            "error",
            "Erreur de création",
            `Erreur lors de la création de l'enfant: ${error.message || JSON.stringify(error)}`
          )
          return
        }

        // Mettre à jour la liste avec le nouvel ID
        const updatedEnfants = [...enfantsList]
        updatedEnfants[index] = newEnfant
        setEnfantsList(updatedEnfants)

        // Mettre à jour les données dans le composant parent immédiatement
        onSave("enfants", updatedEnfants)
      } else {
        // Mise à jour d'un enfant existant
        const { error } = await supabase
          .from("employee_enfants")
          .update({
            prenom: enfant.prenom.trim(),
            sexe: enfant.sexe,
            date_naissance: enfant.date_naissance || null,
            niveau_scolaire: enfant.niveau_scolaire || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", enfant.id)

        if (error) {
          console.error("Erreur lors de la mise à jour:", error)
          showToast?.(
            "error",
            "Erreur de mise à jour",
            `Erreur lors de la mise à jour de l'enfant: ${error.message || JSON.stringify(error)}`
          )
          return
        }

        // Mettre à jour les données dans le composant parent pour les modifications
        onSave("enfants", enfantsList)
      }

      setEditingEnfantIndex(null)
      showToast?.("success", "Enfant sauvegardé", "L'enfant a été sauvegardé avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      showToast?.("error", "Erreur de sauvegarde", `Erreur lors de la sauvegarde de l'enfant: ${errorMessage}`)
    }
  }

  // Handlers de sauvegarde
  const handleSaveFamily = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Mettre à jour la table employees (matricule_mutuel)
      const { error: employeeError } = await supabase
        .from("employees")
        .update({
          matricule_mutuel: familyData.matricule_mutuel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.employee.id)

      if (employeeError) {
        console.error("Erreur lors de la sauvegarde employee:", employeeError)
        showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde des données employé")
        return
      }

      // Mettre à jour ou créer l'état civil
      if (data.etat_civil && data.etat_civil.length > 0) {
        // Mise à jour
        const { error: etatCivilError } = await supabase
          .from("employee_etat_civil")
          .update({
            etat_civil: familyData.etat_civil,
            date_etat_civil: familyData.date_etat_civil,
            identite_conjoint: familyData.identite_conjoint,
            travail_conjoint: familyData.travail_conjoint,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", data.employee.id)

        if (etatCivilError) {
          console.error("Erreur lors de la mise à jour état civil:", etatCivilError)
          showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde de l'état civil")
          return
        }
      } else {
        // Création
        const { error: etatCivilError } = await supabase.from("employee_etat_civil").insert({
          employee_id: data.employee.id,
          etat_civil: familyData.etat_civil,
          date_etat_civil: familyData.date_etat_civil,
          identite_conjoint: familyData.identite_conjoint,
          travail_conjoint: familyData.travail_conjoint,
        })

        if (etatCivilError) {
          console.error("Erreur lors de la création état civil:", etatCivilError)
          showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde de l'état civil")
          return
        }
      }

      onSave("family", familyData)
      showToast?.("success", "Données sauvegardées", "Les informations familiales ont été sauvegardées avec succès")
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde des données")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveContact = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Mettre à jour ou créer le contact d'urgence
      if (data.urgent_contacts && data.urgent_contacts.length > 0) {
        // Mise à jour
        const { error } = await supabase
          .from("employee_urgent_contacts")
          .update({
            prenom_nom: contactData.prenom_nom,
            phone: contactData.phone,
            relationship: contactData.relationship,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", data.employee.id)

        if (error) {
          console.error("Erreur lors de la mise à jour:", error)
          showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde du contact")
          return
        }
      } else {
        // Création
        const { error } = await supabase.from("employee_urgent_contacts").insert({
          employee_id: data.employee.id,
          prenom_nom: contactData.prenom_nom,
          phone: contactData.phone,
          relationship: contactData.relationship,
        })

        if (error) {
          console.error("Erreur lors de la création:", error)
          showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde du contact")
          return
        }
      }

      onSave("contact", contactData)
      showToast?.("success", "Contact sauvegardé", "Le contact d'urgence a été sauvegardé avec succès")
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.("error", "Erreur de sauvegarde", "Erreur lors de la sauvegarde des données")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = () => {
    const { index } = deleteConfirmation
    deleteEnfant(index)
  }

  const handleCancel = () => {
    resetFormData()
    onClose()
  }

  return (
    <>
      {/* Dialog pour Informations Familiales */}
      <Dialog
        isOpen={activeDialog === "family"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "تعديل المعلومات العائلية" : "Modifier les Informations Familiales"}
        icon={Heart}
        maxWidth="max-w-3xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className={`block text-sm text-start font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
                  isRTL ? "font-noto-naskh-arabic" : ""
                }`}>
                {isRTL ? "الحالة المدنية" : "État Civil"}
              </label>
              <Select dir={isRTL ? "rtl" : "ltr"} value={familyData.etat_civil} onValueChange={(value) => setFamilyData({ ...familyData, etat_civil: value })}>
                <SelectTrigger className={`w-full px-3 py-2 text-sm !h-[40px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}>
                  <SelectValue
                    className={`text-gray-900 dark:text-gray-300 text-base ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    placeholder={isRTL ? "اختر الحالة المدنية" : "Sélectionner l'état civil"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-200 dark:border-gray-600 shadow-lg">
                  {getTranslatedOptions(etatCivilFamilyOptions, isRTL).map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="group">
              <label className={`block text-sm text-start font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
                  isRTL ? "font-noto-naskh-arabic" : ""
                }`}>
                {isRTL ? "تاريخ تغيير الحالة المدنية" : "Date changement État Civil"}
              </label>
              <I18nProvider locale="fr-FR">
                <DateField
                  value={familyData.date_etat_civil ? parseDate(formatDateForInput(familyData.date_etat_civil)) : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toString() : ""
                    setFamilyData({ ...familyData, date_etat_civil: dateStr })
                  }}
                >
                  <DateInput
                    focusColor="rgb(7,103,132)"
                    className={`w-full px-3 py-2 !h-[40px] font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                      isRTL ? "text-right font-geist-sans" : ""
                    }`}
                  />
                </DateField>
              </I18nProvider>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={isRTL ? "هوية الزوج/الزوجة" : "Identité Conjoint"}
              value={familyData.identite_conjoint}
              onChange={(value) => setFamilyData({ ...familyData, identite_conjoint: value })}
              placeholder={isRTL ? "اسم ولقب الزوج/الزوجة" : "Prénom et nom du conjoint"}
              isRTL={isRTL}
            />
            <InputField
              label={isRTL ? "عمل الزوج/الزوجة" : "Travail Conjoint"}
              value={familyData.travail_conjoint}
              onChange={(value) => setFamilyData({ ...familyData, travail_conjoint: value })}
              placeholder={isRTL ? "مهنة الزوج/الزوجة" : "Profession du conjoint"}
              isRTL={isRTL}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 pb-4">
            <InputField
              label={isRTL ? "رقم التعاونية" : "Matricule Mutuel"}
              value={familyData.matricule_mutuel}
              onChange={(value) => setFamilyData({ ...familyData, matricule_mutuel: value })}
              placeholder={isRTL ? "رقم بطاقة التعاونية" : "Numéro de matricule mutuel"}
              isRTL={isRTL}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleDialogClose}
              className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
            >
              {isRTL ? <span className="font-noto-naskh-arabic">إلـغــــاء</span> : "Annuler"}
            </button>
            <button
              onClick={handleSaveFamily}
              disabled={isLoading}
              className="group px-4 py-2 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
            >
              <Save className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span>{isLoading ? (isRTL ? <span className="font-noto-naskh-arabic">جاري الحفظ...</span> : "Enregistrement...") : (isRTL ? <span className="font-noto-naskh-arabic">حفظ</span> : "Enregistrer")}</span>
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog pour Gestion des Enfants */}
      <Dialog
        isOpen={activeDialog === "enfants"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة الأطفال" : "Gestion des Enfants"}
        icon={Users}
        maxWidth="max-w-6xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? "font-noto-naskh-arabic" : ""}`}>{isRTL ? "قائمة الأطفال" : "Liste des Enfants"}</h3>
            <button
              onClick={addEnfant}
              className="p-1 text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer"
              title={isRTL ? "إضافة طفل" : "Ajouter un enfant"}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-[800px] table-fixed">
              <thead className="bg-gray-100 dark:bg-gray-800 h-[48px]">
                <tr>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    style={{ width: "250px" }}
                  >
                    {isRTL ? "الاسم" : "Prénom"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "الجنس" : "Sexe"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    style={{ width: "180px" }}
                  >
                    {isRTL ? "تاريخ الميلاد" : "Date Naissance"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    style={{ width: "200px" }}
                  >
                    {isRTL ? "المستوى الدراسي" : "Niveau Scolaire"}
                  </th>
                  <th
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    style={{ width: "120px" }}
                  >
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {enfantsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <Baby className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "لا يوجد أطفال مسجلون" : "Aucun enfant enregistré"}</span>
                        <button
                          onClick={addEnfant}
                          className="mt-2 text-[#076784] hover:text-[#065a72] text-sm underline cursor-pointer"
                        >
                          <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "إضافة الطفل الأول" : "Ajouter le premier enfant"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  enfantsList.map((enfant, index) => (
                    <tr key={enfant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-[48px]">
                      <td className="px-4 py-2 w-64 align-middle">
                        {editingEnfantIndex === index ? (
                          <input
                            type="text"
                            value={enfant.prenom || ""}
                            onChange={(e) => updateEnfant(index, "prenom", e.target.value)}
                            placeholder={isRTL ? "اسم الطفل" : "Prénom de l'enfant"}
                            className="w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                          />
                        ) : (
                          <div className="truncate h-[32px] flex items-center" title={enfant.prenom || (isRTL ? "غير محدد" : "Non défini")}>
                            <Baby className="w-4 h-4 text-[#076784] flex-shrink-0 mr-2" />
                            {enfant.prenom || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-32 align-middle">
                        {editingEnfantIndex === index ? (
                          <Select value={enfant.sexe} onValueChange={(value) => updateEnfant(index, "sexe", value)}>
                            <SelectTrigger className="w-full px-3 py-1 text-xs !h-[32px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm">
                              <SelectValue placeholder={isRTL ? "اختر" : "Choisir"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                              {sexeOptions.map((option) => (
                                <SelectItem
                                  className="px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300"
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-[32px] flex items-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                enfant.sexe === "masculin"
                                  ? "bg-blue-100 text-blue-800"
                                  : enfant.sexe === "feminin"
                                  ? "bg-pink-100 text-pink-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {enfant.sexe || (isRTL ? "غير محدد" : "Non défini")}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-32 align-middle">
                        {editingEnfantIndex === index ? (
                          <input
                            type="date"
                            value={formatDateForInput(enfant.date_naissance) || ""}
                            onChange={(e) => updateEnfant(index, "date_naissance", e.target.value)}
                            className="w-full h-[32px] px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                          />
                        ) : (
                          <div className="h-[32px] flex items-center">
                            {enfant.date_naissance ? formatDateWith2DigitDay(enfant.date_naissance) : (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-48 align-middle">
                        {editingEnfantIndex === index ? (
                          <Select
                            value={enfant.niveau_scolaire}
                            onValueChange={(value) => updateEnfant(index, "niveau_scolaire", value)}
                          >
                            <SelectTrigger className="w-full px-3 py-1 text-xs !h-[32px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm">
                              <SelectValue placeholder={isRTL ? "اختر المستوى" : "Choisir niveau"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                              {niveauScolaireOptions.map((option) => (
                                <SelectItem
                                  className="px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300"
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
                            className="truncate h-[32px] flex items-center"
                            title={enfant.niveau_scolaire || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            {enfant.niveau_scolaire || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-24 align-middle">
                        <div className="flex items-center space-x-2">
                          {editingEnfantIndex === index ? (
                            <>
                              <button
                                onClick={() => saveEnfant(index)}
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                                title={isRTL ? "حفظ" : "Sauvegarder"}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const enfant = enfantsList[index]
                                  if (isEmptyEnfant(enfant) && enfant.id.startsWith("temp-")) {
                                    setEnfantsList(enfantsList.filter((_, i) => i !== index))
                                  }
                                  setEditingEnfantIndex(null)
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
                                onClick={() => setEditingEnfantIndex(index)}
                                className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                title={isRTL ? "تعديل" : "Modifier"}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => confirmDeleteEnfant(index)}
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
              className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
            >
              {isRTL ? <span className="font-noto-naskh-arabic">إغلاق</span> : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog pour Contact d'Urgence */}
      <Dialog
        isOpen={activeDialog === "contact"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "تعديل جهة الاتصال في حالات الطوارئ" : "Modifier le Contact d'Urgence"}
        icon={Phone}
        maxWidth="max-w-2xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={isRTL ? "الاسم واللقب" : "Prénom et Nom"}
              value={contactData.prenom_nom}
              onChange={(value) => setContactData({ ...contactData, prenom_nom: value })}
              placeholder={isRTL ? "اسم ولقب جهة الاتصال" : "Prénom et nom du contact"}
              isRTL={isRTL}
            />
            <InputField
              label={isRTL ? "الهاتف" : "Téléphone"}
              value={contactData.phone}
              onChange={(value) => {
                // Remove all non-digit characters
                const digits = value.replace(/\D/g, '');
                // Limit to 8 digits
                const limitedDigits = digits.slice(0, 8);
                // Format as XX XXX XXX
                let formattedPhone = '';
                if (limitedDigits.length > 0) {
                  formattedPhone = limitedDigits.substring(0, 2);
                  if (limitedDigits.length > 2) {
                    formattedPhone += ' ' + limitedDigits.substring(2, 5);
                  }
                  if (limitedDigits.length > 5) {
                    formattedPhone += ' ' + limitedDigits.substring(5, 8);
                  }
                }
                setContactData({ ...contactData, phone: formattedPhone });
              }}
              placeholder="XX XXX XXX"
              type="tel"
              isRTL={isRTL}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 pb-4">
            <SelectField
              label={isRTL ? "العلاقة" : "Relation"}
              value={contactData.relationship}
              onChange={(value) => setContactData({ ...contactData, relationship: value })}
              options={relationshipOptions}
              placeholder={isRTL ? "اختر العلاقة" : "Sélectionner la relation"}
              isRTL={isRTL}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleDialogClose}
              className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
            >
              {isRTL ? <span className="font-noto-naskh-arabic">إلـغــــاء</span> : "Annuler"}
            </button>
            <button
              onClick={handleSaveContact}
              disabled={isLoading}
              className="group px-4 py-2 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
            >
              <Save className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span>{isLoading ? (isRTL ? <span className="font-noto-naskh-arabic">جاري الحفظ...</span> : "Enregistrement...") : (isRTL ? <span className="font-noto-naskh-arabic">حفظ</span> : "Enregistrer")}</span>
            </button>
          </div>
        </div>
      </Dialog>

      {/* AlertDialog pour confirmation de suppression */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? <span className="font-noto-naskh-arabic">تأكيد الحذف</span> : "Confirmer la suppression"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? <span className="font-noto-naskh-arabic">هل أنت متأكد من أنك تريد حذف "${deleteConfirmation.itemName}"؟ هذا الإجراء غير قابل للتراجع.</span> : `Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.itemName}" ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteConfirmation} className="cursor-pointer">
              {isRTL ? <span className="font-noto-naskh-arabic">إلـغــــاء</span> : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
            >
              {isRTL ? <span className="font-noto-naskh-arabic">حذف</span> : "Supprimer"}
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

  const openFamilyDialog = () => {
    setActiveDialog("family")
  }

  const openEnfantsDialog = () => {
    setActiveDialog("enfants")
  }

  const openContactDialog = () => {
    setActiveDialog("contact")
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return {
    activeDialog,
    openFamilyDialog,
    openEnfantsDialog,
    openContactDialog,
    closeDialog,
  }
}
