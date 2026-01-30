// TabTrainingInfoEdit.tsx
"use client"
import { useState, useEffect } from "react"
import { X, Save, BookOpen, GraduationCap, Plus, Trash2, Edit } from "lucide-react"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { EmployeeCompleteData } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  typeFormationOptions,
  typeEtablissementOptions,
  lieuOptions,
  statutOptions,
  niveauScolaireOptions,
} from "@/lib/selectOptions"
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
  isRTL?: boolean
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
      <label
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
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
      <label
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger
          className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
            isRTL ? "font-noto-naskh-arabic" : ""
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-gray-200 dark:border-gray-600 shadow-lg dark:bg-[#1C1C1C]">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={`hover:bg-[#076784]/10 dark:hover:bg-gray-700 focus:bg-[#076784]/10 dark:focus:bg-gray-700 transition-colors duration-150 cursor-pointer ${
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
  // Localisation et RTL
  const params = useParams()
  const titleFontClass = getTitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)
  const isRTL = params.locale === "ar"

  // États pour les formations
  const [formationsList, setFormationsList] = useState(data.formations || [])
  const [editingFormationIndex, setEditingFormationIndex] = useState<number | null>(null)
  const [selectedFormation, setSelectedFormation] = useState<any>(null)
  const [newFormation, setNewFormation] = useState<any>(null)

  // États pour les niveaux scolaires
  const [niveauxScolarite, setNiveauxScolarite] = useState(data.parcours_scolaire || [])
  const [editingNiveauIndex, setEditingNiveauIndex] = useState<number | null>(null)

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

  // Synchroniser selectedFormation avec data.selectedFormation
  useEffect(() => {
    if (data.selectedFormation && !selectedFormation) {
      setSelectedFormation(data.selectedFormation)
    }
  }, [data.selectedFormation, selectedFormation])

  // Initialiser newFormation quand le dialog d'ajout s'ouvre
  useEffect(() => {
    if (activeDialog === "add-formation" && !newFormation) {
      setNewFormation({
        employee_id: data.employee.id,
        type_formation: "",
        etablissement: "",
        lieu: "",
        description_diplome: "",
        date_debut: "",
        date_fin: "",
        resultat: "",
        type_etablissement: "",
        progression: "",
      })
    }
  }, [activeDialog, newFormation, data.employee.id])

  // Fonction pour formater les dates pour les inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // Fonction pour calculer la durée entre deux dates
  const calculateDuration = (dateDebut: string, dateFin: string | null): string => {
    if (!dateDebut) return "Non défini"

    const startDate = new Date(dateDebut)
    const endDate = dateFin ? new Date(dateFin) : new Date()

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const months = Math.floor(diffDays / 30)
    const remainingDays = diffDays % 30

    if (months === 0) {
      return `${remainingDays} jour${remainingDays > 1 ? "s" : ""}`
    } else if (remainingDays === 0) {
      return `${months} mois`
    } else {
      return `${months} mois ${remainingDays} jour${remainingDays > 1 ? "s" : ""}`
    }
  }

  // Fonction pour ouvrir le dialog d'édition individuelle
  const openIndividualEdit = (formation: any) => {
    setSelectedFormation(formation)
  }

  // Fonction pour sauvegarder une nouvelle formation
  const saveNewFormation = async () => {
    if (!newFormation) return

    // Validation des champs requis
    if (!newFormation.type_formation || !newFormation.etablissement || !newFormation.description_diplome) {
      showToast?.(
        "error",
        isRTL ? "الحقول المطلوبة" : "Champs requis",
        isRTL
          ? "نوع التكوين، المؤسسة ووصف الشهادة مطلوبة"
          : "Le type de formation, l'établissement et la description du diplôme sont obligatoires"
      )
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data: createdFormation, error } = await supabase
        .from("employee_formations")
        .insert({
          employee_id: data.employee.id,
          type_formation: newFormation.type_formation,
          etablissement: newFormation.etablissement.trim(),
          lieu: newFormation.lieu,
          description_diplome: newFormation.description_diplome.trim(),
          date_debut: newFormation.date_debut || null,
          date_fin: newFormation.date_fin || null,
          resultat: newFormation.resultat || null,
          type_etablissement: newFormation.type_etablissement,
          progression: newFormation.progression,
        })
        .select()
        .single()

      if (error) {
        console.error("Erreur lors de la création:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في الإنشاء" : "Erreur de création",
          `${isRTL ? "خطأ أثناء إنشاء التكوين" : "Erreur lors de la création de la formation"}: ${
            error.message || JSON.stringify(error)
          }`
        )
        return
      }

      // Ajouter la nouvelle formation à la liste
      const updatedFormations = [...formationsList, createdFormation]
      setFormationsList(updatedFormations)
      onSave("formations", updatedFormations)

      showToast?.(
        "success",
        isRTL ? "تم إضافة التكوين" : "Formation ajoutée",
        isRTL ? "تم إضافة التكوين بنجاح" : "La formation a été ajoutée avec succès"
      )
      setNewFormation(null)
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        `${isRTL ? "خطأ أثناء الحفظ" : "Erreur lors de la sauvegarde"}: ${errorMessage}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour sauvegarder une formation individuelle
  const saveIndividualFormation = async () => {
    if (!selectedFormation) return

    // Validation des champs requis
    if (
      !selectedFormation.type_formation ||
      !selectedFormation.etablissement ||
      !selectedFormation.description_diplome
    ) {
      showToast?.(
        "error",
        isRTL ? "الحقول المطلوبة" : "Champs requis",
        isRTL
          ? "نوع التكوين، المؤسسة ووصف الشهادة مطلوبة"
          : "Le type de formation, l'établissement et la description du diplôme sont obligatoires"
      )
      return
    }

    try {
      setIsLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from("employee_formations")
        .update({
          type_formation: selectedFormation.type_formation,
          etablissement: selectedFormation.etablissement.trim(),
          lieu: selectedFormation.lieu,
          description_diplome: selectedFormation.description_diplome.trim(),
          date_debut: selectedFormation.date_debut || null,
          date_fin: selectedFormation.date_fin || null,
          resultat: selectedFormation.resultat || null,
          type_etablissement: selectedFormation.type_etablissement,
          progression: selectedFormation.progression,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedFormation.id)

      if (error) {
        console.error("Erreur lors de la mise à jour:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في التحديث" : "Erreur de mise à jour",
          `${isRTL ? "خطأ أثناء تحديث التكوين" : "Erreur lors de la mise à jour de la formation"}: ${
            error.message || JSON.stringify(error)
          }`
        )
        return
      }

      // Mettre à jour la liste des formations
      const updatedFormations = formationsList.map((f) => (f.id === selectedFormation.id ? selectedFormation : f))
      setFormationsList(updatedFormations)
      onSave("formations", updatedFormations)

      showToast?.(
        "success",
        isRTL ? "تم تحديث التكوين" : "Formation mise à jour",
        isRTL ? "تم تحديث التكوين بنجاح" : "La formation a été mise à jour avec succès"
      )
      setSelectedFormation(null)
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        `${isRTL ? "خطأ أثناء الحفظ" : "Erreur lors de la sauvegarde"}: ${errorMessage}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Fonctions pour la gestion des niveaux scolaires
  const addNiveauScolaire = () => {
    const newNiveau = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      niveau_scolaire: "",
      diplome: "",
      lieu: "",
      annee_debut: "",
      annee_fin: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setNiveauxScolarite([...niveauxScolarite, newNiveau])
    setEditingNiveauIndex(niveauxScolarite.length)
  }

  const openDeleteConfirmation = (index: number, itemName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      index,
      itemName,
    })
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      index: -1,
      itemName: "",
    })
  }

  const confirmDeleteNiveau = (index: number) => {
    const niveau = niveauxScolarite[index]
    const niveauName = niveau.niveau_scolaire || "Ce niveau"
    openDeleteConfirmation(index, niveauName)
  }

  const deleteNiveau = async (index: number) => {
    const niveau = niveauxScolarite[index]
    if (niveau.id.toString().startsWith("temp-")) {
      // Suppression locale pour les nouveaux niveaux
      const updatedNiveaux = niveauxScolarite.filter((_, i) => i !== index)
      setNiveauxScolarite(updatedNiveaux)
      onSave("parcours_scolaire", updatedNiveaux)
    } else {
      // Suppression dans la base de données
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_parcours_scolaire").delete().eq("id", niveau.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          showToast?.(
            "error",
            isRTL ? "خطأ في الحذف" : "Erreur de suppression",
            isRTL ? "خطأ أثناء حذف المستوى التعليمي" : "Erreur lors de la suppression du niveau scolaire"
          )
          return
        }

        const updatedNiveaux = niveauxScolarite.filter((_, i) => i !== index)
        setNiveauxScolarite(updatedNiveaux)
        onSave("parcours_scolaire", updatedNiveaux)
        showToast?.(
          "success",
          isRTL ? "تم حذف المستوى" : "Niveau supprimé",
          isRTL ? "تم حذف المستوى التعليمي بنجاح" : "Le niveau scolaire a été supprimé avec succès"
        )
      } catch (error) {
        console.error("Erreur:", error)
        showToast?.("error", "Erreur de suppression", "Erreur lors de la suppression du niveau scolaire")
      }
    }
    closeDeleteConfirmation()
  }

  const updateNiveau = (index: number, field: string, value: string) => {
    const updatedNiveaux = [...niveauxScolarite]
    updatedNiveaux[index] = { ...updatedNiveaux[index], [field]: value }
    setNiveauxScolarite(updatedNiveaux)
  }

  const isEmptyNiveau = (niveau: any) => {
    return !niveau.niveau_scolaire && !niveau.diplome && !niveau.lieu
  }

  const saveNiveau = async (index: number) => {
    const niveau = niveauxScolarite[index]

    // Vérifier si les données sont vides
    if (isEmptyNiveau(niveau) && niveau.id.toString().startsWith("temp-")) {
      // Supprimer la ligne vide
      setNiveauxScolarite(niveauxScolarite.filter((_, i) => i !== index))
      setEditingNiveauIndex(null)
      return
    }

    try {
      const supabase = createClient()

      if (niveau.id.toString().startsWith("temp-")) {
        // Création d'un nouveau niveau
        const { data: newNiveau, error } = await supabase
          .from("employee_parcours_scolaire")
          .insert({
            employee_id: data.employee.id,
            niveau_scolaire: niveau.niveau_scolaire,
            diplome: niveau.diplome,
            lieu: niveau.lieu,
            annee_debut: niveau.annee_debut || null,
            annee_fin: niveau.annee_fin || null,
          })
          .select()
          .single()

        if (error) {
          console.error("Erreur lors de la création:", error)
          showToast?.(
            "error",
            isRTL ? "خطأ في الإنشاء" : "Erreur de création",
            isRTL ? "خطأ أثناء إنشاء المستوى التعليمي" : "Erreur lors de la création du niveau scolaire"
          )
          return
        }

        // Mettre à jour la liste avec le nouvel ID
        const updatedNiveaux = [...niveauxScolarite]
        updatedNiveaux[index] = newNiveau
        setNiveauxScolarite(updatedNiveaux)
        onSave("parcours_scolaire", updatedNiveaux)
      } else {
        // Mise à jour d'un niveau existant
        const { error } = await supabase
          .from("employee_parcours_scolaire")
          .update({
            niveau_scolaire: niveau.niveau_scolaire,
            diplome: niveau.diplome,
            lieu: niveau.lieu,
            annee_debut: niveau.annee_debut || null,
            annee_fin: niveau.annee_fin || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", niveau.id)

        if (error) {
          console.error("Erreur lors de la mise à jour:", error)
          showToast?.(
            "error",
            isRTL ? "خطأ في التحديث" : "Erreur de mise à jour",
            isRTL ? "خطأ أثناء تحديث المستوى التعليمي" : "Erreur lors de la mise à jour du niveau scolaire"
          )
          return
        }

        // Mettre à jour la liste
        const updatedNiveaux = [...niveauxScolarite]
        updatedNiveaux[index] = niveau
        setNiveauxScolarite(updatedNiveaux)
        onSave("parcours_scolaire", updatedNiveaux)
      }

      setEditingNiveauIndex(null)
      showToast?.(
        "success",
        isRTL ? "تم حفظ المستوى" : "Niveau sauvegardé",
        isRTL ? "تم حفظ المستوى التعليمي بنجاح" : "Le niveau scolaire a été sauvegardé avec succès"
      )
    } catch (error) {
      console.error("Erreur:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        `${isRTL ? "خطأ أثناء الحفظ" : "Erreur lors de la sauvegarde"}: ${errorMessage}`
      )
    }
  }

  const handleConfirmDelete = () => {
    const { index } = deleteConfirmation
    deleteNiveau(index)
  }

  const handleDialogClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  return (
    <>
      {/* Dialog pour modification individuelle d'une formation */}
      <Dialog
        isOpen={activeDialog === "individual-formation" && selectedFormation !== null}
        onClose={() => {
          setSelectedFormation(null)
          handleDialogClose()
        }}
        isClosing={isClosing}
        title={isRTL ? "تعديل التكوين" : "Modifier la Formation"}
        icon={BookOpen}
        maxWidth="max-w-4xl"
        isRTL={isRTL}
      >
        {selectedFormation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={isRTL ? "نوع التكوين" : "Type de Formation"}
                value={selectedFormation.type_formation || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, type_formation: value })}
                options={typeFormationOptions}
                placeholder={isRTL ? "اختر النوع" : "Sélectionner le type"}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "المؤسسة" : "Établissement"}
                value={selectedFormation.etablissement || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, etablissement: value })}
                placeholder={isRTL ? "أدخل اسم المؤسسة" : "Nom de l'établissement"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={isRTL ? "نوع المؤسسة" : "Type d'Établissement"}
                value={selectedFormation.type_etablissement || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, type_etablissement: value })}
                options={typeEtablissementOptions}
                placeholder={isRTL ? "اختر النوع" : "Sélectionner le type"}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? "المكان" : "Lieu"}
                value={selectedFormation.lieu || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, lieu: value })}
                options={lieuOptions}
                placeholder={isRTL ? "اختر المكان" : "Sélectionner le lieu"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <InputField
                label={isRTL ? "وصف الشهادة" : "Description du Diplôme"}
                value={selectedFormation.description_diplome || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, description_diplome: value })}
                placeholder={isRTL ? "وصف الشهادة المحصل عليها" : "Description du diplôme obtenu"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تاريخ البداية" : "Date de Début"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={selectedFormation.date_debut ? parseDate(selectedFormation.date_debut) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setSelectedFormation({ ...selectedFormation, date_debut: dateStr })
                    }}
                  >
                    <DateInput
                      focusColor="rgb(7,103,132)"
                      className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                        isRTL ? "text-right font-geist-sans" : ""
                      } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    />
                  </DateField>
                </I18nProvider>
              </div>
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تـاريخ النهـايــة" : "Date de Fin"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={selectedFormation.date_fin ? parseDate(selectedFormation.date_fin) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setSelectedFormation({ ...selectedFormation, date_fin: dateStr })
                    }}
                  >
                    <DateInput
                      focusColor="rgb(7,103,132)"
                      className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                        isRTL ? "text-right font-geist-sans" : ""
                      } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    />
                  </DateField>
                </I18nProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <InputField
                label={isRTL ? "" : "Résultat"}
                value={selectedFormation.resultat || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, resultat: value })}
                placeholder={isRTL ? "النتيجة المحصل عليها" : "Résultat obtenu"}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? "الحالة" : "Statut"}
                value={selectedFormation.progression || ""}
                onChange={(value) => setSelectedFormation({ ...selectedFormation, progression: value })}
                options={statutOptions}
                placeholder={isRTL ? "اختر الحالة" : "Sélectionner le statut"}
                isRTL={isRTL}
              />
            </div>

            <div
              className={`flex justify-end pt-5 border-t border-gray-200 dark:border-gray-600 ${
                isRTL ? "space-x-reverse space-x-3" : "space-x-3"
              }`}
            >
              <button
                onClick={() => {
                  setSelectedFormation(null)
                  onClose()
                }}
                className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                  isRTL ? "font-noto-naskh-arabic" : ""
                }`}
              >
                {isRTL ? "إلـغــــاء" : "Annuler"}
              </button>
              <button
                onClick={saveIndividualFormation}
                disabled={isLoading}
                className={`group px-4 py-2 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95 ${
                  isRTL ? "space-x-reverse space-x-2 font-noto-naskh-arabic" : "space-x-2"
                }`}
              >
                <Save className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span>
                  {isLoading ? (isRTL ? "جاري الحفظ..." : "Enregistrement...") : isRTL ? "حفظ" : "Enregistrer"}
                </span>
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog pour ajouter une nouvelle formation */}
      <Dialog
        isOpen={activeDialog === "add-formation"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إضافة تكوين" : "Ajouter une Formation"}
        icon={Plus}
        maxWidth="max-w-4xl"
        isRTL={isRTL}
      >
        {newFormation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={isRTL ? "نوع التكوين" : "Type de Formation"}
                value={newFormation.type_formation || ""}
                onChange={(value) => setNewFormation({ ...newFormation, type_formation: value })}
                options={typeFormationOptions}
                placeholder={isRTL ? "اختر النوع" : "Sélectionner le type"}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "المؤسسة" : "Établissement"}
                value={newFormation.etablissement || ""}
                onChange={(value) => setNewFormation({ ...newFormation, etablissement: value })}
                placeholder={isRTL ? "أدخل اسم المؤسسة" : "Nom de l'établissement"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={isRTL ? "نوع المؤسسة" : "Type d'Établissement"}
                value={newFormation.type_etablissement || ""}
                onChange={(value) => setNewFormation({ ...newFormation, type_etablissement: value })}
                options={typeEtablissementOptions}
                placeholder={isRTL ? "اختر النوع" : "Sélectionner le type"}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? "المكان" : "Lieu"}
                value={newFormation.lieu || ""}
                onChange={(value) => setNewFormation({ ...newFormation, lieu: value })}
                options={lieuOptions}
                placeholder={isRTL ? "اختر المكان" : "Sélectionner le lieu"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <InputField
                label={isRTL ? "وصف الشهادة" : "Description du Diplôme"}
                value={newFormation.description_diplome || ""}
                onChange={(value) => setNewFormation({ ...newFormation, description_diplome: value })}
                placeholder={isRTL ? "وصف الشهادة المحصل عليها" : "Description du diplôme obtenu"}
                isRTL={isRTL}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تاريخ البداية" : "Date de Début"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={newFormation.date_debut ? parseDate(newFormation.date_debut) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setNewFormation({ ...newFormation, date_debut: dateStr })
                    }}
                  >
                    <DateInput
                      focusColor="rgb(7,103,132)"
                      className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                        isRTL ? "text-right font-geist-sans" : ""
                      } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    />
                  </DateField>
                </I18nProvider>
              </div>
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-100 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تـاريــخ النهـايــة" : "Date de Fin"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={newFormation.date_fin ? parseDate(newFormation.date_fin) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setNewFormation({ ...newFormation, date_fin: dateStr })
                    }}
                  >
                    <DateInput
                      focusColor="rgb(7,103,132)"
                      className={`w-full h-10! px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                        isRTL ? "text-right font-geist-sans" : ""
                      } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    />
                  </DateField>
                </I18nProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <InputField
                label={isRTL ? "النتيجة" : "Résultat"}
                value={newFormation.resultat || ""}
                onChange={(value) => setNewFormation({ ...newFormation, resultat: value })}
                placeholder={isRTL ? "النتيجة المحصل عليها" : "Résultat obtenu"}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? "الحالة" : "Statut"}
                value={newFormation.progression || ""}
                onChange={(value) => setNewFormation({ ...newFormation, progression: value })}
                options={statutOptions}
                placeholder={isRTL ? "اختر الحالة" : "Sélectionner le statut"}
                isRTL={isRTL}
              />
            </div>

            <div
              className={`flex justify-end pt-5 border-t border-gray-200 dark:border-gray-600 gap-2`}
            >
              <button
                onClick={() => {
                  setNewFormation(null)
                  onClose()
                }}
                className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                  isRTL ? "font-noto-naskh-arabic" : ""
                }`}
              >
                {isRTL ? "إلـغــــاء" : "Annuler"}
              </button>
              <button
                onClick={saveNewFormation}
                disabled={isLoading}
                className={`group px-4 py-2 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95 ${
                  isRTL ? "space-x-reverse space-x-2 font-noto-naskh-arabic" : "space-x-2"
                }`}
              >
                <Save className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span>{isLoading ? (isRTL ? "جاري الحفظ..." : "Enregistrement...") : isRTL ? "إضافة" : "Ajouter"}</span>
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog pour gestion des niveaux scolaires */}
      <Dialog
        isOpen={activeDialog === "niveaux-scolaires"}
        onClose={handleDialogClose}
        isClosing={isClosing}
        title={isRTL ? "إدارة المستويات التعليمية" : "Gestion des Niveaux Scolaires"}
        icon={GraduationCap}
        maxWidth="max-w-5xl"
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <h3
              className={`text-md font-medium text-gray-900 dark:text-gray-100 ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "المسار التعليمي" : "Parcours Scolaire"}
            </h3>
            <button
              onClick={addNiveauScolaire}
              className="p-1 text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer"
              title={isRTL ? "إضافة مستوى" : "Ajouter un niveau"}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-200 table-fixed">
              <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                <tr>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "180px" }}
                  >
                    {isRTL ? "المستوى" : "Niveau"}
                  </th>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "250px" }}
                  >
                    {isRTL ? "الشهادة" : "Diplôme"}
                  </th>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "180px" }}
                  >
                    {isRTL ? "المكان" : "Lieu"}
                  </th>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "100px" }}
                  >
                    {isRTL ? "البداية" : "Début"}
                  </th>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "100px" }}
                  >
                    {isRTL ? "النهاية" : "Fin"}
                  </th>
                  <th
                    className={`px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                      isRTL ? "text-right font-noto-naskh-arabic" : "text-left"
                    }`}
                    style={{ width: "120px" }}
                  >
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {niveauxScolarite.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <GraduationCap className="w-8 h-8 text-gray-300 mb-2" />
                        <span>{isRTL ? "لا توجد مستويات تعليمية مسجلة" : "Aucun niveau scolaire enregistré"}</span>
                        <button
                          onClick={addNiveauScolaire}
                          className={`mt-2 text-[#076784] hover:text-[#065a72] text-sm underline cursor-pointer ${
                            isRTL ? "font-noto-naskh-arabic" : ""
                          }`}
                        >
                          {isRTL ? "إضافة أول مستوى" : "Ajouter le premier niveau"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  niveauxScolarite.map((niveau, index) => (
                    <tr key={niveau.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 h-12">
                      <td className="px-4 py-2 w-44 align-middle">
                        {editingNiveauIndex === index ? (
                          <Select
                            value={niveau.niveau_scolaire || ""}
                            onValueChange={(value) => updateNiveau(index, "niveau_scolaire", value)}
                          >
                            <SelectTrigger
                              className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                isRTL ? "font-noto-naskh-arabic" : ""
                              }`}
                            >
                              <SelectValue placeholder={isRTL ? "اختر المستوى" : "Sélectionner..."} />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-[#1C1C1C] dark:border-gray-600">
                              {niveauScolaireOptions.map((option) => (
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
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={niveau.niveau_scolaire || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            <GraduationCap
                              className={`w-4 h-4 text-[#076784] shrink-0 ${isRTL ? "ml-2" : "mr-2"}`}
                            />
                            {niveau.niveau_scolaire || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-64 align-middle">
                        {editingNiveauIndex === index ? (
                          <input
                            type="text"
                            value={niveau.diplome || ""}
                            onChange={(e) => updateNiveau(index, "diplome", e.target.value)}
                            placeholder={isRTL ? "الشهادة المحصل عليها" : "Diplôme obtenu"}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={niveau.diplome || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            {niveau.diplome || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-44 align-middle">
                        {editingNiveauIndex === index ? (
                          <input
                            type="text"
                            value={niveau.lieu || ""}
                            onChange={(e) => updateNiveau(index, "lieu", e.target.value)}
                            placeholder={isRTL ? "مكان الدراسة" : "Lieu d'études"}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={niveau.lieu || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            {niveau.lieu || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-20 align-middle">
                        {editingNiveauIndex === index ? (
                          <input
                            type="text"
                            value={niveau.annee_debut || ""}
                            onChange={(e) => updateNiveau(index, "annee_debut", e.target.value)}
                            placeholder={isRTL ? "2020" : "2020"}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={niveau.annee_debut || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            {niveau.annee_debut || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-20 align-middle">
                        {editingNiveauIndex === index ? (
                          <input
                            type="text"
                            value={niveau.annee_fin || ""}
                            onChange={(e) => updateNiveau(index, "annee_fin", e.target.value)}
                            placeholder={isRTL ? "2024" : "2024"}
                            className={`w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                              isRTL ? "font-noto-naskh-arabic" : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`truncate h-8 flex items-center ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                            title={niveau.annee_fin || (isRTL ? "غير محدد" : "Non défini")}
                          >
                            {niveau.annee_fin || (isRTL ? "غير محدد" : "Non défini")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 w-24 align-middle">
                        <div className={`flex items-center ${isRTL ? "space-x-reverse space-x-2" : "space-x-2"}`}>
                          {editingNiveauIndex === index ? (
                            <>
                              <button
                                onClick={() => saveNiveau(index)}
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                                title={isRTL ? "حفظ" : "Sauvegarder"}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const niveau = niveauxScolarite[index]
                                  if (isEmptyNiveau(niveau) && niveau.id.toString().startsWith("temp-")) {
                                    setNiveauxScolarite(niveauxScolarite.filter((_, i) => i !== index))
                                  }
                                  setEditingNiveauIndex(null)
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
                                onClick={() => setEditingNiveauIndex(index)}
                                className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                title={isRTL ? "تعديل" : "Modifier"}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => confirmDeleteNiveau(index)}
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
            className={`flex justify-end pt-5 border-t border-gray-200 dark:border-gray-600 ${
              isRTL ? "space-x-reverse space-x-3" : "space-x-3"
            }`}
          >
            <button
              onClick={onClose}
              className={`group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "إغـــــلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* AlertDialog pour confirmation de suppression */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"} className="dark:bg-[#1C1C1C] dark:border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {isRTL ? "تأكيد الحذف" : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "font-noto-naskh-arabic" : ""}>
              {isRTL
                ? `هل أنت متأكد من حذف "${deleteConfirmation.itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Êtes-vous sûr de vouloir supprimer "${deleteConfirmation.itemName}" ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "space-x-reverse space-x-2" : "space-x-2"}>
            <AlertDialogCancel
              onClick={closeDeleteConfirmation}
              className={`cursor-pointer dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "إلـغــــاء" : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={`bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "حذف" : "Supprimer"}
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

  const openAddFormationDialog = () => {
    setActiveDialog("add-formation")
  }

  const openNiveauxScolairesDialog = () => {
    setActiveDialog("niveaux-scolaires")
  }

  const openIndividualFormationDialog = () => {
    setActiveDialog("individual-formation")
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return {
    activeDialog,
    openAddFormationDialog,
    openNiveauxScolairesDialog,
    openIndividualFormationDialog,
    closeDialog,
  }
}
