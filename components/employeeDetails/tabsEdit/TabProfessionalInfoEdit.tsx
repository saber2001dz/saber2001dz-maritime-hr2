// Simplified TabProfessionalInfoEdit.tsx - Direct implementation without external dependencies
"use client"
import { useState, useEffect } from "react"
import { X, Save, Calendar, Briefcase, Award, ClipboardList, CreditCard, Plus, Trash2, Edit } from "lucide-react"
import {
  EmployeeCompleteData,
  EmployeeGrade,
  EmployeeFonctions,
  EmployeeAffectation,
  EmployeeBanque,
  EmployeeRendement,
  EmployeeNoteAnnuelle,
} from "@/types/details_employees"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { createClient } from "@/lib/supabase/client"
import { gradeOptions, fonctionOptions, banqueOptions } from "@/lib/selectOptions"
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

// Helper function to format date for input
const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
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

// Status options function - matches the database enum values
const getStatutOptions = () => {
  return [
    { value: "Actif", label: "Actif" },
    { value: "Inactif", label: "Inactif" },
    { value: "Conges", label: "Congés" },
    { value: "Maladie", label: "Maladie" },
    { value: "Formation", label: "Formation" },
    { value: "Mission", label: "Mission" },
    { value: "Abscent", label: "Absent" },
  ]
}

// Generic Dialog Component
function Dialog({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  isClosing = false,
  isRTL = false,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: any
  children: React.ReactNode
  isClosing?: boolean
  isRTL?: boolean
}) {
  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 duration-300 ${
        isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
      }`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div
        className={`bg-white dark:bg-[#1C1C1C] rounded-lg shadow-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600 duration-300 ${
          isClosing ? "animate-out slide-out-to-bottom-4 zoom-out-95" : "animate-in slide-in-from-bottom-4 zoom-in-95"
        } ${
          title === "Modifier la Prolongation de Retraite" || title === "تعديل تمديد التقاعد"
            ? "w-full max-w-md"
            : title === "Modifier la Situation Administrative" ||
              title === "Modifier la Durée du Contrat" ||
              title === "تعديل الوضع الإداري" ||
              title === "تعديل مدة العمل"
            ? "w-full max-w-2xl"
            : "w-full max-w-7xl"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Generic Input Field Component
function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
  isRTL?: boolean
}) {
  return (
    <div className="group">
      <label
        className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
          disabled ? "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" : ""
        } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      />
    </div>
  )
}

// Composant générique pour les boutons d'action
function ActionButtons({
  onCancel,
  onSave,
  isLoading,
  saveText = "Enregistrer",
  isRTL = false,
}: {
  onCancel: () => void
  onSave: () => void
  isLoading: boolean
  saveText?: string
  isRTL?: boolean
}) {
  return (
    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-600">
      <button
        onClick={onCancel}
        className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
      >
        {isRTL ? <span className="font-noto-naskh-arabic">إلغـــــاء</span> : "Annuler"}
      </button>
      <button
        onClick={onSave}
        disabled={isLoading}
        className="group px-4 py-2 bg-[#076784] text-white text-[14px] rounded hover:bg-[#065a72] transition-all duration-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
      >
        <Save className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span>
          {isLoading ? (
            isRTL ? (
              <span className="font-noto-naskh-arabic">جاري الحفظ...</span>
            ) : (
              "Enregistrement..."
            )
          ) : isRTL ? (
            <span className="font-noto-naskh-arabic">حــــفـــظ</span>
          ) : (
            saveText
          )}
        </span>
      </button>
    </div>
  )
}

export default function EditDialogs({ data, onSave, activeDialog, onClose, showToast }: EditDialogsProps) {
  // Logique RTL et polices
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)

  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Initial data
  const initialContractData = {
    date_recrutement: data.employee.date_recrutement || "",
  }

  const initialSituationData = {
    matricule: data.employee.matricule || "",
    identifiant_unique: data.employee.identifiant_unique || "",
    prive: data.employee.prive || false,
  }

  const initialProlongationData = {
    prolongation_retraite: data.employee.prolongation_retraite || 0,
  }

  const [contractData, setContractData] = useState(initialContractData)
  const [situationData, setSituationData] = useState(initialSituationData)
  const [prolongationData, setProlongationData] = useState(initialProlongationData)
  const [grades, setGrades] = useState<EmployeeGrade[]>(data.grades || [])
  const [editingGradeIndex, setEditingGradeIndex] = useState<number | null>(null)
  const [originalGradesList, setOriginalGradesList] = useState<EmployeeGrade[]>(data.grades || [])

  const [fonctions, setFonctions] = useState<EmployeeFonctions[]>(data.fonctions || [])
  const [editingFonctionIndex, setEditingFonctionIndex] = useState<number | null>(null)
  const [originalFonctionsList, setOriginalFonctionsList] = useState<EmployeeFonctions[]>(data.fonctions || [])

  const [affectations, setAffectations] = useState<EmployeeAffectation[]>(data.affectations || [])
  const [editingAffectationIndex, setEditingAffectationIndex] = useState<number | null>(null)
  const [originalAffectationsList, setOriginalAffectationsList] = useState<EmployeeAffectation[]>(
    data.affectations || []
  )

  const [banques, setBanques] = useState<EmployeeBanque[]>(data.banque || [])
  const [editingBanqueIndex, setEditingBanqueIndex] = useState<number | null>(null)
  const [originalBanquesList, setOriginalBanquesList] = useState<EmployeeBanque[]>(data.banque || [])

  const [rendements, setRendements] = useState<EmployeeRendement[]>(data.rendements || [])
  const [editingRendementIndex, setEditingRendementIndex] = useState<number | null>(null)
  const [originalRendementsList, setOriginalRendementsList] = useState<EmployeeRendement[]>(data.rendements || [])

  const [notesAnnuelles, setNotesAnnuelles] = useState<EmployeeNoteAnnuelle[]>(data.notes_annuelles || [])
  const [editingNoteAnnuelleIndex, setEditingNoteAnnuelleIndex] = useState<number | null>(null)
  const [originalNotesAnnuellesList, setOriginalNotesAnnuellesList] = useState<EmployeeNoteAnnuelle[]>(
    data.notes_annuelles || []
  )

  const [banquesList, setBanquesList] = useState<{ banque_nom: string; banque_logo: string }[]>([])
  const [unitesList, setUnitesList] = useState<{ id: string; unite: string; unite_categorie: string }[]>([])
  const [responsibilitiesList, setResponsibilitiesList] = useState<string[]>([])
  const [selectedUniteCategory, setSelectedUniteCategory] = useState<string>("")

  // Synchroniser les données avec les props
  useEffect(() => {
    setGrades(data.grades || [])
    setFonctions(data.fonctions || [])
    setAffectations(data.affectations || [])
    setBanques(data.banque || [])
    setRendements(data.rendements || [])
    setNotesAnnuelles(data.notes_annuelles || [])

    setOriginalGradesList(data.grades || [])
    setOriginalFonctionsList(data.fonctions || [])
    setOriginalAffectationsList(data.affectations || [])
    setOriginalBanquesList(data.banque || [])
    setOriginalRendementsList(data.rendements || [])
    setOriginalNotesAnnuellesList(data.notes_annuelles || [])

    // Synchroniser les données de l'employé (y compris prolongation_retraite)
    setContractData({
      date_recrutement: data.employee.date_recrutement || "",
    })
    setSituationData({
      matricule: data.employee.matricule || "",
      identifiant_unique: data.employee.identifiant_unique || "",
      prive: data.employee.prive || false,
    })
    setProlongationData({
      prolongation_retraite: data.employee.prolongation_retraite || 0,
    })
  }, [
    data.grades,
    data.fonctions,
    data.affectations,
    data.banque,
    data.rendements,
    data.notes_annuelles,
    data.employee,
  ])

  // Charger la liste des banques pour le dropdown lors de l'ouverture du dialog banque
  useEffect(() => {
    if (activeDialog === "banque" && banquesList.length === 0) {
      fetchBanquesList()
    }
  }, [activeDialog, banquesList.length])

  // Charger la liste des unités pour le dropdown lors de l'ouverture du dialog affectation
  useEffect(() => {
    if (activeDialog === "affectation" && unitesList.length === 0) {
      fetchUnitesList()
    }
  }, [activeDialog, unitesList.length])

  const fetchBanquesList = async () => {
    try {
      const supabase = createClient()
      // Fetch banks list for dropdown
      const { data: banksData, error: banksError } = await supabase
        .from("banque")
        .select("banque_nom, banque_logo")
        .order("banque_nom", { ascending: true })

      if (banksError) {
        console.error("Erreur lors du chargement de la liste des banques:", banksError)
      } else {
        setBanquesList(banksData || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const fetchUnitesList = async () => {
    try {
      const supabase = createClient()
      // Fetch unites list for dropdown
      const { data: unitesData, error: unitesError } = await supabase
        .from("unite")
        .select("id, unite, unite_categorie")
        .order("unite", { ascending: true })

      if (unitesError) {
        console.error("Erreur lors du chargement de la liste des unités:", unitesError)
      } else {
        setUnitesList(unitesData || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const fetchResponsibilities = async (uniteCategorie: string) => {
    // Don't fetch if uniteCategorie is empty or null
    if (!uniteCategorie || uniteCategorie.trim() === "") {
      setResponsibilitiesList([])
      return
    }

    try {
      const supabase = createClient()
      // Fetch responsibilities for the selected unite category
      const { data: responsibilitiesData, error: responsibilitiesError } = await supabase
        .from("unite_category_responsibilities")
        .select("available_responsibilities")
        .eq("unite_categorie", uniteCategorie)
        .maybeSingle()

      if (responsibilitiesError) {
        console.error("Erreur lors du chargement des responsabilités:", responsibilitiesError)
        setResponsibilitiesList([])
      } else if (!responsibilitiesData) {
        // Aucune responsabilité définie pour cette catégorie
        setResponsibilitiesList([])
      } else {
        setResponsibilitiesList(responsibilitiesData?.available_responsibilities || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des responsabilités:", error)
      setResponsibilitiesList([])
    }
  }

  // Fonction pour réinitialiser les données lors de l'annulation
  const resetFormData = () => {
    setContractData(initialContractData)
    setSituationData(initialSituationData)
    setProlongationData(initialProlongationData)
    setGrades(originalGradesList)
    setEditingGradeIndex(null)
    setFonctions(originalFonctionsList)
    setEditingFonctionIndex(null)
    setAffectations(originalAffectationsList)
    setEditingAffectationIndex(null)
    setBanques(originalBanquesList)
    setEditingBanqueIndex(null)
    setRendements(originalRendementsList)
    setEditingRendementIndex(null)
    setNotesAnnuelles(originalNotesAnnuellesList)
    setEditingNoteAnnuelleIndex(null)
  }

  // Fonctions pour vérifier si les données sont vides
  const isEmptyGrade = (grade: any) => {
    return !grade.grade && !grade.date_grade
  }

  const hasUnsavedGrade = (): boolean => {
    // Vérifier s'il y a une ligne en cours de modification
    if (editingGradeIndex !== null) {
      return true
    }
    // Vérifier s'il y a des nouvelles lignes non sauvegardées (IDs temporaires)
    return grades.some((grade) => grade.id.toString().startsWith("temp-"))
  }

  const isEmptyFonction = (fonction: any) => {
    return !fonction.fonction && !fonction.date_obtention_fonction
  }

  const hasUnsavedFonction = (): boolean => {
    // Vérifier s'il y a une ligne en cours de modification
    if (editingFonctionIndex !== null) {
      return true
    }
    // Vérifier s'il y a des nouvelles lignes non sauvegardées (IDs temporaires)
    return fonctions.some((fonction) => fonction.id.toString().startsWith("temp-"))
  }

  const isEmptyAffectation = (affectation: any) => {
    return !affectation.unite && !affectation.responsibility && !affectation.date_debut
  }

  const isEmptyBanque = (banque: any) => {
    return !banque.banque && !banque.agence && !banque.rib
  }

  // Fonctions pour la gestion des grades
  const addGrade = () => {
    const newGrade = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      grade: "",
      date_grade: "",
      date_fin: "",
      reference: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setGrades([...grades, newGrade])
    setEditingGradeIndex(grades.length)
  }

  const updateGrade = (index: number, field: string, value: string) => {
    const updatedGrades = [...grades]
    updatedGrades[index] = { ...updatedGrades[index], [field]: value }
    setGrades(updatedGrades)
  }

  const saveGrade = async (index: number) => {
    const grade = grades[index]

    // Vérifier les données vides
    if (isEmptyGrade(grade) && grade.id.toString().startsWith("temp-")) {
      setGrades(grades.filter((_, i) => i !== index))
      setEditingGradeIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (!grade.grade || !grade.date_grade) {
      showToast?.(
        "error",
        isRTL ? "حقول مطلوبة مفقودة" : "Champs obligatoires manquants",
        isRTL
          ? "يرجى ملء الرتبة وتاريخ الحصول قبل الحفظ."
          : "Veuillez remplir le grade et la date d'obtention avant d'enregistrer."
      )
      return
    }

    try {
      const supabase = createClient()
      const updatedGrades = [...grades]

      // Si c'est un nouveau grade, vérifier et mettre à jour le grade hiérarchiquement précédent
      if (grade.id.toString().startsWith("temp-")) {
        // Définir la hiérarchie des grades (du plus bas au plus haut)
        const gradeHierarchy = [
          "Caporal",
          "Caporal Chef",
          "Sergent",
          "Sergent Chef",
          "Adjudant",
          "Adjudant Chef",
          "Sous-Lieutenant",
          "Lieutenant",
          "Capitaine",
          "Commandant",
          "Lieutenant-Colonel",
          "Colonel",
          "Colonel Major",
        ]

        // Trouver l'index hiérarchique du nouveau grade
        const newGradeHierarchyIndex = gradeHierarchy.indexOf(grade.grade)
        console.log("Nouveau grade:", grade.grade, "Index hiérarchique:", newGradeHierarchyIndex)

        if (newGradeHierarchyIndex > 0) {
          // Si ce n'est pas le grade le plus bas
          // Trouver le grade hiérarchiquement précédent
          const previousGradeName = gradeHierarchy[newGradeHierarchyIndex - 1]
          console.log("Grade précédent recherché:", previousGradeName)

          // Chercher ce grade dans les grades existants
          const existingGrades = grades.filter((g) => !g.id.toString().startsWith("temp-"))
          console.log(
            "Grades existants:",
            existingGrades.map((g) => ({ grade: g.grade, date_fin: g.date_fin }))
          )

          const previousGrade = existingGrades.find((g) => g.grade === previousGradeName)
          console.log("Grade précédent trouvé:", previousGrade)

          if (previousGrade) {
            // Calculer la date qui précède d'un jour la nouvelle date d'obtention
            const newGradeDate = new Date(grade.date_grade)
            const previousEndDate = new Date(newGradeDate)
            previousEndDate.setDate(previousEndDate.getDate() - 1)
            const previousEndDateStr = previousEndDate.toISOString().split("T")[0]

            // Mettre à jour le grade précédent avec la date de fin
            const { error: updatePreviousError } = await supabase
              .from("employee_grades")
              .update({
                date_fin: previousEndDateStr,
              })
              .eq("id", previousGrade.id)

            if (updatePreviousError) {
              console.error("Erreur lors de la mise à jour du grade hiérarchiquement précédent:", updatePreviousError)
            } else {
              // Mettre à jour aussi dans l'état local
              const updatedPreviousGradeIndex = updatedGrades.findIndex((g) => g.id === previousGrade.id)
              if (updatedPreviousGradeIndex !== -1) {
                updatedGrades[updatedPreviousGradeIndex] = {
                  ...updatedGrades[updatedPreviousGradeIndex],
                  date_fin: previousEndDateStr,
                }
              }

              showToast?.(
                "success",
                isRTL ? "تم تحديث الرتبة السابقة" : "Grade précédent mis à jour",
                isRTL
                  ? `تم ملء تاريخ انتهاء "${previousGradeName}" تلقائياً.`
                  : `La date de fin de "${previousGradeName}" a été automatiquement remplie.`
              )
            }
          }
        }

        // Création du nouveau grade
        const { data: newGrade, error } = await supabase
          .from("employee_grades")
          .insert({
            employee_id: data.employee.id,
            grade: grade.grade,
            date_grade: grade.date_grade,
            date_fin: grade.date_fin || null,
            reference: grade.reference || null,
          })
          .select()
          .single()

        if (error) throw error

        updatedGrades[index] = newGrade
        setGrades(updatedGrades)
      } else {
        // Mise à jour d'un grade existant
        // Vérifier si la date d'obtention a changé pour mettre à jour le grade précédent
        const originalGrade = originalGradesList.find((g) => g.id === grade.id)
        const dateChanged = originalGrade && originalGrade.date_grade !== grade.date_grade

        if (dateChanged) {
          // Définir la hiérarchie des grades (du plus bas au plus haut)
          const gradeHierarchy = [
            "Caporal",
            "Caporal Chef",
            "Sergent",
            "Sergent Chef",
            "Adjudant",
            "Adjudant Chef",
            "Sous-Lieutenant",
            "Lieutenant",
            "Capitaine",
            "Commandant",
            "Lieutenant-Colonel",
            "Colonel",
            "Colonel Major",
          ]

          // Trouver l'index hiérarchique du grade modifié
          const gradeHierarchyIndex = gradeHierarchy.indexOf(grade.grade)
          console.log("Grade modifié:", grade.grade, "Index hiérarchique:", gradeHierarchyIndex)

          if (gradeHierarchyIndex > 0) {
            // Si ce n'est pas le grade le plus bas
            // Trouver le grade hiérarchiquement précédent
            const previousGradeName = gradeHierarchy[gradeHierarchyIndex - 1]
            console.log("Grade précédent recherché:", previousGradeName)

            // Chercher ce grade dans les grades existants
            const existingGrades = grades.filter((g) => !g.id.toString().startsWith("temp-") && g.id !== grade.id)
            console.log(
              "Grades existants (excluant le grade modifié):",
              existingGrades.map((g) => ({ grade: g.grade, date_fin: g.date_fin }))
            )

            const previousGrade = existingGrades.find((g) => g.grade === previousGradeName)
            console.log("Grade précédent trouvé:", previousGrade)

            if (previousGrade) {
              // Calculer la date qui précède d'un jour la nouvelle date d'obtention
              const newGradeDate = new Date(grade.date_grade)
              const previousEndDate = new Date(newGradeDate)
              previousEndDate.setDate(previousEndDate.getDate() - 1)
              const previousEndDateStr = previousEndDate.toISOString().split("T")[0]

              // Mettre à jour le grade précédent avec la date de fin
              const { error: updatePreviousError } = await supabase
                .from("employee_grades")
                .update({
                  date_fin: previousEndDateStr,
                })
                .eq("id", previousGrade.id)

              if (updatePreviousError) {
                console.error("Erreur lors de la mise à jour du grade hiérarchiquement précédent:", updatePreviousError)
              } else {
                // Mettre à jour aussi dans l'état local
                const updatedPreviousGradeIndex = updatedGrades.findIndex((g) => g.id === previousGrade.id)
                if (updatedPreviousGradeIndex !== -1) {
                  updatedGrades[updatedPreviousGradeIndex] = {
                    ...updatedGrades[updatedPreviousGradeIndex],
                    date_fin: previousEndDateStr,
                  }
                }

                showToast?.(
                  "success",
                  "Grade précédent mis à jour",
                  `La date de fin de "${previousGradeName}" a été automatiquement ajustée.`
                )
              }
            }
          }
        }

        const { error } = await supabase
          .from("employee_grades")
          .update({
            grade: grade.grade,
            date_grade: grade.date_grade,
            date_fin: grade.date_fin || null,
            reference: grade.reference || null,
          })
          .eq("id", grade.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("grades", updatedGrades)
      setEditingGradeIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const deleteGrade = async (index: number) => {
    const grade = grades[index]
    const updatedGrades = grades.filter((_, i) => i !== index)

    if (grade.id.toString().startsWith("temp-")) {
      setGrades(updatedGrades)
      onSave("grades", updatedGrades)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_grades").delete().eq("id", grade.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setGrades(updatedGrades)
        onSave("grades", updatedGrades)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }
  }

  // Fonctions pour la gestion des fonctions
  const addFonction = () => {
    const newFonction = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      fonction: "",
      date_obtention_fonction: "",
      date_fin: "",
      reference: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setFonctions([...fonctions, newFonction])
    setEditingFonctionIndex(fonctions.length)
  }

  const updateFonction = (index: number, field: string, value: string) => {
    const updatedFonctions = [...fonctions]
    updatedFonctions[index] = { ...updatedFonctions[index], [field]: value }
    setFonctions(updatedFonctions)
  }

  const saveFonction = async (index: number) => {
    const fonction = fonctions[index]

    // Vérifier les données vides
    if (isEmptyFonction(fonction) && fonction.id.toString().startsWith("temp-")) {
      setFonctions(fonctions.filter((_, i) => i !== index))
      setEditingFonctionIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (!fonction.fonction || !fonction.date_obtention_fonction) {
      showToast?.(
        "error",
        isRTL ? "حقول مطلوبة مفقودة" : "Champs obligatoires manquants",
        isRTL
          ? "يرجى ملء المهمة وتاريخ الحصول قبل الحفظ."
          : "Veuillez remplir la fonction et la date d'obtention avant d'enregistrer."
      )
      return
    }

    try {
      const supabase = createClient()
      const updatedFonctions = [...fonctions]

      // Si c'est une nouvelle fonction, vérifier et mettre à jour la fonction hiérarchiquement précédente
      if (fonction.id.toString().startsWith("temp-")) {
        // Définir la hiérarchie des fonctions administratives (du plus bas au plus haut)
        const fonctionHierarchy = [
          "Agent",
          "Chef de Bureau",
          "Chef de Section",
          "Chef de Service",
          "Sous-Directeur",
          "Directeur",
        ]

        // Trouver l'index hiérarchique de la nouvelle fonction
        const newFunctionHierarchyIndex = fonctionHierarchy.indexOf(fonction.fonction)
        console.log("Nouvelle fonction:", fonction.fonction, "Index hiérarchique:", newFunctionHierarchyIndex)

        if (newFunctionHierarchyIndex > 0) {
          // Si ce n'est pas la fonction la plus basse
          // Trouver la fonction hiérarchiquement précédente
          const previousFunctionName = fonctionHierarchy[newFunctionHierarchyIndex - 1]
          console.log("Fonction précédente recherchée:", previousFunctionName)

          // Chercher cette fonction dans les fonctions existantes
          const existingFonctions = fonctions.filter((f) => !f.id.toString().startsWith("temp-"))
          console.log(
            "Fonctions existantes:",
            existingFonctions.map((f) => ({ fonction: f.fonction, date_fin: f.date_fin }))
          )

          const previousFonction = existingFonctions.find((f) => f.fonction === previousFunctionName)
          console.log("Fonction précédente trouvée:", previousFonction)

          if (previousFonction) {
            // Calculer la date qui précède d'un jour la nouvelle date d'obtention
            const newFonctionDate = new Date(fonction.date_obtention_fonction)
            const previousEndDate = new Date(newFonctionDate)
            previousEndDate.setDate(previousEndDate.getDate() - 1)
            const previousEndDateStr = previousEndDate.toISOString().split("T")[0]

            // Mettre à jour la fonction précédente avec la date de fin
            const { error: updatePreviousError } = await supabase
              .from("employee_fonctions")
              .update({
                date_fin: previousEndDateStr,
              })
              .eq("id", previousFonction.id)

            if (updatePreviousError) {
              console.error(
                "Erreur lors de la mise à jour de la fonction hiérarchiquement précédente:",
                updatePreviousError
              )
            } else {
              // Mettre à jour aussi dans l'état local
              const updatedPreviousFunctionIndex = updatedFonctions.findIndex((f) => f.id === previousFonction.id)
              if (updatedPreviousFunctionIndex !== -1) {
                updatedFonctions[updatedPreviousFunctionIndex] = {
                  ...updatedFonctions[updatedPreviousFunctionIndex],
                  date_fin: previousEndDateStr,
                }
              }

              showToast?.(
                "success",
                "Fonction précédente mise à jour",
                `La date de fin de "${previousFunctionName}" a été automatiquement remplie.`
              )
            }
          }
        }

        // Création de la nouvelle fonction
        const { data: newFonction, error } = await supabase
          .from("employee_fonctions")
          .insert({
            employee_id: data.employee.id,
            fonction: fonction.fonction,
            date_obtention_fonction: fonction.date_obtention_fonction,
            date_fin: fonction.date_fin || null,
            reference: fonction.reference || null,
          })
          .select()
          .single()

        if (error) throw error

        updatedFonctions[index] = newFonction
        setFonctions(updatedFonctions)
      } else {
        // Mise à jour d'une fonction existante
        // Vérifier si la date d'obtention a changé pour mettre à jour la fonction précédente
        const originalFonction = originalFonctionsList.find((f) => f.id === fonction.id)
        const dateChanged =
          originalFonction && originalFonction.date_obtention_fonction !== fonction.date_obtention_fonction

        if (dateChanged) {
          // Définir la hiérarchie des fonctions administratives (du plus bas au plus haut)
          const fonctionHierarchy = [
            "Agent",
            "Chef de Bureau",
            "Chef de Section",
            "Chef de Service",
            "Sous-Directeur",
            "Directeur",
          ]

          // Trouver l'index hiérarchique de la fonction modifiée
          const fonctionHierarchyIndex = fonctionHierarchy.indexOf(fonction.fonction)
          console.log("Fonction modifiée:", fonction.fonction, "Index hiérarchique:", fonctionHierarchyIndex)

          if (fonctionHierarchyIndex > 0) {
            // Si ce n'est pas la fonction la plus basse
            // Trouver la fonction hiérarchiquement précédente
            const previousFunctionName = fonctionHierarchy[fonctionHierarchyIndex - 1]
            console.log("Fonction précédente recherchée:", previousFunctionName)

            // Chercher cette fonction dans les fonctions existantes
            const existingFonctions = fonctions.filter(
              (f) => !f.id.toString().startsWith("temp-") && f.id !== fonction.id
            )
            console.log(
              "Fonctions existantes (excluant la fonction modifiée):",
              existingFonctions.map((f) => ({ fonction: f.fonction, date_fin: f.date_fin }))
            )

            const previousFonction = existingFonctions.find((f) => f.fonction === previousFunctionName)
            console.log("Fonction précédente trouvée:", previousFonction)

            if (previousFonction) {
              // Calculer la date qui précède d'un jour la nouvelle date d'obtention
              const newFonctionDate = new Date(fonction.date_obtention_fonction)
              const previousEndDate = new Date(newFonctionDate)
              previousEndDate.setDate(previousEndDate.getDate() - 1)
              const previousEndDateStr = previousEndDate.toISOString().split("T")[0]

              // Mettre à jour la fonction précédente avec la date de fin
              const { error: updatePreviousError } = await supabase
                .from("employee_fonctions")
                .update({
                  date_fin: previousEndDateStr,
                })
                .eq("id", previousFonction.id)

              if (updatePreviousError) {
                console.error(
                  "Erreur lors de la mise à jour de la fonction hiérarchiquement précédente:",
                  updatePreviousError
                )
              } else {
                // Mettre à jour aussi dans l'état local
                const updatedPreviousFunctionIndex = updatedFonctions.findIndex((f) => f.id === previousFonction.id)
                if (updatedPreviousFunctionIndex !== -1) {
                  updatedFonctions[updatedPreviousFunctionIndex] = {
                    ...updatedFonctions[updatedPreviousFunctionIndex],
                    date_fin: previousEndDateStr,
                  }
                }

                showToast?.(
                  "success",
                  "Fonction précédente mise à jour",
                  `La date de fin de "${previousFunctionName}" a été automatiquement ajustée.`
                )
              }
            }
          }
        }

        const { error } = await supabase
          .from("employee_fonctions")
          .update({
            fonction: fonction.fonction,
            date_obtention_fonction: fonction.date_obtention_fonction,
            date_fin: fonction.date_fin || null,
            reference: fonction.reference || null,
          })
          .eq("id", fonction.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("fonctions", updatedFonctions)
      setEditingFonctionIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const deleteFonction = async (index: number) => {
    const fonction = fonctions[index]
    const updatedFonctions = fonctions.filter((_, i) => i !== index)

    if (fonction.id.toString().startsWith("temp-")) {
      setFonctions(updatedFonctions)
      onSave("fonctions", updatedFonctions)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_fonctions").delete().eq("id", fonction.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setFonctions(updatedFonctions)
        onSave("fonctions", updatedFonctions)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }
  }

  // Fonctions pour la gestion des affectations
  const addAffectation = () => {
    const newAffectation = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      unite: "",
      responsibility: "",
      reference: "",
      date_debut: "",
      date_fin: "",
      telex_debut: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setAffectations([...affectations, newAffectation])
    setEditingAffectationIndex(affectations.length)
  }

  // Charger les responsabilités quand on commence à éditer une affectation existante
  const startEditingAffectation = (index: number) => {
    const affectation = affectations[index]
    if (affectation.unite) {
      const selectedUnite = unitesList.find((unite) => unite.unite === affectation.unite)
      if (selectedUnite && selectedUnite.unite_categorie) {
        setSelectedUniteCategory(selectedUnite.unite_categorie)
        fetchResponsibilities(selectedUnite.unite_categorie)
      }
    } else {
      setSelectedUniteCategory("")
      setResponsibilitiesList([])
    }
    setEditingAffectationIndex(index)
  }

  const updateAffectation = (index: number, field: string, value: string) => {
    const updatedAffectations = [...affectations]
    updatedAffectations[index] = { ...updatedAffectations[index], [field]: value }

    // Si le champ "unite" change, charger les responsabilités correspondantes
    if (field === "unite") {
      const selectedUnite = unitesList.find((unite) => unite.unite === value)
      if (selectedUnite && selectedUnite.unite_categorie) {
        setSelectedUniteCategory(selectedUnite.unite_categorie)
        fetchResponsibilities(selectedUnite.unite_categorie)
        // Réinitialiser la responsabilité quand l'unité change
        updatedAffectations[index] = { ...updatedAffectations[index], responsibility: "" }
      } else {
        setSelectedUniteCategory("")
        setResponsibilitiesList([])
      }
    }

    setAffectations(updatedAffectations)
  }

  const saveAffectation = async (index: number) => {
    const affectation = affectations[index]

    // Vérifier les données vides
    if (isEmptyAffectation(affectation) && affectation.id.toString().startsWith("temp-")) {
      setAffectations(affectations.filter((_, i) => i !== index))
      setEditingAffectationIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (!affectation.unite || !affectation.responsibility || !affectation.date_debut) {
      return
    }

    try {
      const supabase = createClient()
      const updatedAffectations = [...affectations]

      if (affectation.id.toString().startsWith("temp-")) {
        // Création
        const { data: newAffectation, error } = await supabase
          .from("employee_affectations")
          .insert({
            employee_id: data.employee.id,
            unite: affectation.unite,
            responsibility: affectation.responsibility,
            date_debut: affectation.date_debut,
            date_fin: affectation.date_fin || null,
            telex_debut: affectation.telex_debut || null,
          })
          .select()
          .single()

        if (error) throw error

        updatedAffectations[index] = newAffectation
        setAffectations(updatedAffectations)
      } else {
        // Mise à jour
        const { error } = await supabase
          .from("employee_affectations")
          .update({
            unite: affectation.unite,
            responsibility: affectation.responsibility,
            date_debut: affectation.date_debut,
            date_fin: affectation.date_fin || null,
            telex_debut: affectation.telex_debut || null,
          })
          .eq("id", affectation.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("affectations", updatedAffectations)
      setEditingAffectationIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const deleteAffectation = async (index: number) => {
    const affectation = affectations[index]
    const updatedAffectations = affectations.filter((_, i) => i !== index)

    if (affectation.id.toString().startsWith("temp-")) {
      setAffectations(updatedAffectations)
      onSave("affectations", updatedAffectations)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_affectations").delete().eq("id", affectation.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setAffectations(updatedAffectations)
        onSave("affectations", updatedAffectations)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }
  }

  // Fonctions pour la gestion des données bancaires
  const addBanque = () => {
    const newBanque = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      banque: "",
      agence: "",
      rib: "",
      logo_url: "",
      compte_statut: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setBanques([...banques, newBanque])
    setEditingBanqueIndex(banques.length)
  }

  const updateBanque = (index: number, field: string, value: string | boolean) => {
    const updatedBanques = [...banques]
    updatedBanques[index] = { ...updatedBanques[index], [field]: value }

    // Si le champ "banque" change, mettre à jour automatiquement le logo_url
    if (field === "banque" && typeof value === "string") {
      const selectedBank = banquesList.find((bank) => bank.banque_nom === value)
      if (selectedBank) {
        updatedBanques[index] = {
          ...updatedBanques[index],
          logo_url: selectedBank.banque_logo,
        }
      }
    }

    setBanques(updatedBanques)
  }

  const saveBanque = async (index: number) => {
    const banque = banques[index]

    // Vérifier les données vides
    if (isEmptyBanque(banque) && banque.id.toString().startsWith("temp-")) {
      setBanques(banques.filter((_, i) => i !== index))
      setEditingBanqueIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (!banque.banque || !banque.agence || !banque.rib) {
      return
    }

    try {
      const supabase = createClient()
      const updatedBanques = [...banques]

      // S'assurer que le logo_url correspond à la banque sélectionnée
      const selectedBank = banquesList.find((bank) => bank.banque_nom === banque.banque)
      const logoUrl = selectedBank ? selectedBank.banque_logo : banque.logo_url

      // Si ce compte est activé, désactiver tous les autres comptes de cet employé
      if (banque.compte_statut === true) {
        // Pour les nouveaux comptes (temp ID), désactiver tous les comptes existants
        // Pour les comptes existants, désactiver tous les autres comptes
        const isNewAccount = banque.id.toString().startsWith("temp-")

        let deactivateQuery = supabase
          .from("employee_banque")
          .update({ compte_statut: false })
          .eq("employee_id", data.employee.id)

        // Si ce n'est pas un nouveau compte, exclure le compte actuel
        if (!isNewAccount) {
          deactivateQuery = deactivateQuery.neq("id", banque.id)
        }

        const { error: deactivateError } = await deactivateQuery

        if (deactivateError) {
          console.error("Erreur lors de la désactivation des autres comptes:", deactivateError)
          showToast?.("error", "Erreur", "Impossible de désactiver les autres comptes bancaires")
          return
        }

        // Mettre à jour l'état local pour refléter la désactivation des autres comptes
        updatedBanques.forEach((b, i) => {
          if (i !== index) {
            updatedBanques[i] = { ...b, compte_statut: false }
          }
        })
      }

      if (banque.id.toString().startsWith("temp-")) {
        // Création
        const { data: newBanque, error } = await supabase
          .from("employee_banque")
          .insert({
            employee_id: data.employee.id,
            banque: banque.banque,
            agence: banque.agence,
            rib: banque.rib,
            logo_url: logoUrl || null,
            compte_statut: banque.compte_statut,
          })
          .select()
          .single()

        if (error) throw error

        updatedBanques[index] = newBanque
        setBanques(updatedBanques)
      } else {
        // Mise à jour
        const { error } = await supabase
          .from("employee_banque")
          .update({
            banque: banque.banque,
            agence: banque.agence,
            rib: banque.rib,
            logo_url: logoUrl || null,
            compte_statut: banque.compte_statut,
          })
          .eq("id", banque.id)

        if (error) throw error
      }

      // Afficher un message de confirmation si un compte a été activé
      if (banque.compte_statut === true) {
        showToast?.(
          "success",
          "Compte bancaire activé",
          `${banque.banque} est maintenant le compte principal. Les autres comptes ont été désactivés.`
        )
      }

      // Appel onSave APRÈS la mise à jour
      onSave("banque", updatedBanques)
      setEditingBanqueIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.("error", "Erreur de sauvegarde", "Une erreur est survenue lors de la sauvegarde")
    }
  }

  const deleteBanque = async (index: number) => {
    const banque = banques[index]
    const updatedBanques = banques.filter((_, i) => i !== index)

    if (banque.id.toString().startsWith("temp-")) {
      setBanques(updatedBanques)
      onSave("banque", updatedBanques)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_banque").delete().eq("id", banque.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setBanques(updatedBanques)
        onSave("banque", updatedBanques)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
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

  const handleSaveContract = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("employees")
        .update({ date_recrutement: contractData.date_recrutement || null })
        .eq("id", data.employee.id)

      if (error) {
        console.error("Erreur lors de la mise à jour:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
          isRTL ? "خطأ أثناء تحديث البيانات" : "Erreur lors de la mise à jour des données"
        )
        return
      }

      onSave("contract", contractData)
      handleDialogClose()

      showToast?.(
        "success",
        isRTL ? "تم حفظ البيانات" : "Données sauvegardées",
        isRTL ? "تم تحديث البيانات بنجاح" : "Les données ont été mises à jour avec succès"
      )
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL ? "خطأ أثناء تحديث البيانات" : "Erreur lors de la mise à jour des données"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSituation = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("employees")
        .update({
          matricule: situationData.matricule || null,
          identifiant_unique: situationData.identifiant_unique || null,
          prive: situationData.prive,
        })
        .eq("id", data.employee.id)

      if (error) {
        console.error("Erreur lors de la mise à jour:", error)
        showToast?.(
          "error",
          "Erreur de sauvegarde",
          `Erreur lors de la mise à jour: ${error.message || error.code || "Erreur inconnue"}`
        )
        return
      }

      onSave("situation", situationData)
      handleDialogClose()

      showToast?.(
        "success",
        isRTL ? "تم حفظ البيانات" : "Données sauvegardées",
        isRTL ? "تم تحديث البيانات بنجاح" : "Les données ont été mises à jour avec succès"
      )
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        "Erreur de sauvegarde",
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProlongation = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("employees")
        .update({ prolongation_retraite: prolongationData.prolongation_retraite })
        .eq("id", data.employee.id)

      if (error) {
        console.error("Erreur lors de la mise à jour:", error)
        showToast?.(
          "error",
          "Erreur de sauvegarde",
          `Erreur lors de la mise à jour: ${error.message || error.code || "Erreur inconnue"}`
        )
        return
      }

      onSave("prolongation", prolongationData)
      handleDialogClose()

      showToast?.(
        "success",
        isRTL ? "تم تحديث التمديد" : "Prolongation mise à jour",
        isRTL
          ? `تم تحديث تمديد التقاعد إلى ${prolongationData.prolongation_retraite} ${
              prolongationData.prolongation_retraite === 1 ? "سنة" : "سنوات"
            }.`
          : `La prolongation de retraite a été mise à jour à ${prolongationData.prolongation_retraite} an${
              prolongationData.prolongation_retraite > 1 ? "s" : ""
            }.`
      )
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        "Erreur de sauvegarde",
        `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ===== GESTION DES RENDEMENTS =====
  const isEmptyRendement = (rendement: EmployeeRendement): boolean => {
    return !rendement.annee || !rendement.trimestre || !rendement.rendement_note
  }

  const hasUnsavedRendement = (): boolean => {
    // Vérifier s'il y a une ligne en cours de modification
    if (editingRendementIndex !== null) {
      return true
    }
    // Vérifier s'il y a des nouvelles lignes non sauvegardées (IDs temporaires)
    return rendements.some((rendement) => rendement.id.toString().startsWith("temp-"))
  }

  const addRendement = () => {
    const newRendement: EmployeeRendement = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      annee: new Date().getFullYear(),
      trimestre: 1,
      rendement_note: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRendements([...rendements, newRendement])
    setEditingRendementIndex(rendements.length)
  }

  const updateRendement = (index: number, field: string, value: string | number) => {
    const updatedRendements = [...rendements]
    updatedRendements[index] = { ...updatedRendements[index], [field]: value }
    setRendements(updatedRendements)
  }

  const saveRendement = async (index: number) => {
    const rendement = rendements[index]

    // Vérifier les données vides
    if (isEmptyRendement(rendement) && rendement.id.toString().startsWith("temp-")) {
      setRendements(rendements.filter((_, i) => i !== index))
      setEditingRendementIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (
      !rendement.annee ||
      !rendement.trimestre ||
      rendement.rendement_note === null ||
      rendement.rendement_note === undefined
    ) {
      showToast?.("error", "حقول مطلوبة مفقودة", "يرجى ملء السنة الثلاثية العدد قبل الحفظ.")
      return
    }

    // Validation de la note (entre 0 et 20)
    if (rendement.rendement_note < 0 || rendement.rendement_note > 101) {
      showToast?.("error", "العـدد غير صحيحة", "يجب أن تكون العـدد بين 0 و 100.")
      return
    }

    try {
      const supabase = createClient()
      const updatedRendements = [...rendements]

      if (rendement.id.toString().startsWith("temp-")) {
        // Création d'un nouveau rendement
        const { data: newRendement, error } = await supabase
          .from("employee_rendement")
          .insert({
            employee_id: data.employee.id,
            annee: rendement.annee,
            trimestre: rendement.trimestre,
            rendement_note: rendement.rendement_note,
          })
          .select()
          .single()

        if (error) throw error

        updatedRendements[index] = newRendement
        setRendements(updatedRendements)
      } else {
        // Mise à jour d'un rendement existant
        const { error } = await supabase
          .from("employee_rendement")
          .update({
            annee: rendement.annee,
            trimestre: rendement.trimestre,
            rendement_note: rendement.rendement_note,
          })
          .eq("id", rendement.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("rendements", updatedRendements)
      // Mettre à jour aussi la liste originale pour la cohérence
      setOriginalRendementsList(updatedRendements)
      setEditingRendementIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const deleteRendement = async (index: number) => {
    const rendement = rendements[index]
    const updatedRendements = rendements.filter((_, i) => i !== index)

    if (rendement.id.toString().startsWith("temp-")) {
      setRendements(updatedRendements)
      onSave("rendements", updatedRendements)
      // Mettre à jour aussi la liste originale
      setOriginalRendementsList(updatedRendements)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_rendement").delete().eq("id", rendement.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setRendements(updatedRendements)
        onSave("rendements", updatedRendements)
        // Mettre à jour aussi la liste originale
        setOriginalRendementsList(updatedRendements)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }
  }

  // ===== GESTION DES NOTES ANNUELLES =====
  const isEmptyNoteAnnuelle = (noteAnnuelle: EmployeeNoteAnnuelle): boolean => {
    return !noteAnnuelle.annee || noteAnnuelle.note_annuelle === null || noteAnnuelle.note_annuelle === undefined
  }

  const addNoteAnnuelle = () => {
    const newNoteAnnuelle: EmployeeNoteAnnuelle = {
      id: `temp-${Date.now()}`,
      employee_id: data.employee.id,
      annee: 0,
      note_annuelle: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    // Ajouter toujours à la fin de la liste
    const updatedList = [...notesAnnuelles, newNoteAnnuelle]
    setNotesAnnuelles(updatedList)
    // Utiliser l'index correct après ajout (dernière position)
    setEditingNoteAnnuelleIndex(updatedList.length - 1)
  }

  const updateNoteAnnuelle = (index: number, field: string, value: string | number) => {
    const updatedNotesAnnuelles = [...notesAnnuelles]
    if (field === "note_annuelle") {
      // Limiter la valeur entre 0 et 100
      const numericValue = typeof value === "string" ? parseFloat(value) : value
      const limitedValue = Math.max(0, Math.min(100, numericValue || 0))

      updatedNotesAnnuelles[index] = {
        ...updatedNotesAnnuelles[index],
        note_annuelle: limitedValue,
      }
    } else {
      updatedNotesAnnuelles[index] = { ...updatedNotesAnnuelles[index], [field]: value }
    }
    setNotesAnnuelles(updatedNotesAnnuelles)
  }

  const saveNoteAnnuelle = async (index: number) => {
    const noteAnnuelle = notesAnnuelles[index]

    // Vérifier les données vides
    if (isEmptyNoteAnnuelle(noteAnnuelle) && noteAnnuelle.id.toString().startsWith("temp-")) {
      setNotesAnnuelles(notesAnnuelles.filter((_, i) => i !== index))
      setEditingNoteAnnuelleIndex(null)
      return
    }

    // Validation des champs obligatoires
    if (!noteAnnuelle.annee || noteAnnuelle.note_annuelle === null || noteAnnuelle.note_annuelle === undefined) {
      showToast?.("error", "حقول مطلوبة مفقودة", "يرجى ملء السنة والعدد قبل الحفظ.")
      return
    }

    // Validation de la note (entre 0 et 100)
    if (noteAnnuelle.note_annuelle < 0 || noteAnnuelle.note_annuelle > 100) {
      showToast?.("error", "العـدد غير صحيح", "يجب أن يكون العـدد بين 0 و 100.")
      return
    }

    try {
      const supabase = createClient()
      const updatedNotesAnnuelles = [...notesAnnuelles]

      if (noteAnnuelle.id.toString().startsWith("temp-")) {
        // Création d'une nouvelle note annuelle
        const { data: newNoteAnnuelle, error } = await supabase
          .from("employee_note_annuelle")
          .insert({
            employee_id: data.employee.id,
            annee: noteAnnuelle.annee,
            note_annuelle: noteAnnuelle.note_annuelle,
          })
          .select()
          .single()

        if (error) throw error

        updatedNotesAnnuelles[index] = newNoteAnnuelle
        setNotesAnnuelles(updatedNotesAnnuelles)
      } else {
        // Mise à jour d'une note annuelle existante
        const { error } = await supabase
          .from("employee_note_annuelle")
          .update({
            annee: noteAnnuelle.annee,
            note_annuelle: noteAnnuelle.note_annuelle,
          })
          .eq("id", noteAnnuelle.id)

        if (error) throw error
      }

      // Appel onSave APRÈS la mise à jour
      onSave("notes_annuelles", updatedNotesAnnuelles)
      // Mettre à jour aussi la liste originale pour la cohérence
      setOriginalNotesAnnuellesList(updatedNotesAnnuelles)
      setEditingNoteAnnuelleIndex(null)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  const deleteNoteAnnuelle = async (index: number) => {
    const noteAnnuelle = notesAnnuelles[index]
    const updatedNotesAnnuelles = notesAnnuelles.filter((_, i) => i !== index)

    if (noteAnnuelle.id.toString().startsWith("temp-")) {
      setNotesAnnuelles(updatedNotesAnnuelles)
      onSave("notes_annuelles", updatedNotesAnnuelles)
      // Mettre à jour aussi la liste originale
      setOriginalNotesAnnuellesList(updatedNotesAnnuelles)
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("employee_note_annuelle").delete().eq("id", noteAnnuelle.id)

        if (error) {
          console.error("Erreur lors de la suppression:", error)
          return
        }

        setNotesAnnuelles(updatedNotesAnnuelles)
        onSave("notes_annuelles", updatedNotesAnnuelles)
        // Mettre à jour aussi la liste originale
        setOriginalNotesAnnuellesList(updatedNotesAnnuelles)
      } catch (error) {
        console.error("Erreur:", error)
        return
      }
    }
  }

  return (
    <>
      {/* Contract Dialog */}
      {activeDialog === "contract" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "تعديل مدة العمل" : "Modifier la Durée du Contrat"}
          icon={Calendar}
          isRTL={isRTL}
        >
          <div className="space-y-4">
            <div className="pb-4">
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تاريخ الإنتداب" : "Date de Recrutement"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={contractData.date_recrutement ? parseDate(contractData.date_recrutement) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setContractData({ ...contractData, date_recrutement: dateStr })
                    }}
                  >
                    <DateInput
                      focusColor="rgb(7,103,132)"
                      className={`w-full px-3 py-2 font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                        isRTL ? "text-right font-geist-sans" : ""
                      } ${isRTL ? "font-noto-naskh-arabic" : ""}`}
                    />
                  </DateField>
                </I18nProvider>
              </div>
            </div>
            <ActionButtons
              onCancel={handleDialogClose}
              onSave={handleSaveContract}
              isLoading={isLoading}
              isRTL={isRTL}
            />
          </div>
        </Dialog>
      )}

      {/* Situation Dialog */}
      {activeDialog === "situation" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "تعديل الوضع الإداري" : "Modifier la Situation Administrative"}
          icon={Briefcase}
          isRTL={isRTL}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <InputField
                label={isRTL ? "رقم التسجيل" : "Matricule"}
                value={situationData.matricule}
                onChange={(value) => setSituationData({ ...situationData, matricule: value })}
                placeholder={isRTL ? "رقم التسجيل" : "Matricule"}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "المعرف الفريد" : "Identifiant Unique"}
                value={situationData.identifiant_unique}
                onChange={(value) => setSituationData({ ...situationData, identifiant_unique: value })}
                placeholder={isRTL ? "أدخل المعرف الفريد" : "Entrer l'identifiant unique"}
                isRTL={isRTL}
              />
            </div>

            <div className="space-y-4 pb-4">
              <div className="group">
                <div
                  className={`flex items-start gap-3 py-1 ${isRTL ? "justify-start" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <button
                    type="button"
                    onClick={() => setSituationData({ ...situationData, prive: !situationData.prive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer mt-1 ${
                      situationData.prive ? "bg-[rgb(7,103,132)]" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isRTL
                          ? situationData.prive
                            ? "-translate-x-6"
                            : "-translate-x-1"
                          : situationData.prive
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`text-[12px] font-medium text-gray-700 dark:text-[#D0D0D0] ${
                        isRTL ? titleFontClass : ""
                      }`}
                    >
                      {isRTL ? "ملف شخصي خاص" : "Profil Privé"}
                    </h3>
                    <p className={`text-[10px] text-gray-500 mt-0.5 ${isRTL ? cardSubtitleFontClass : ""}`}>
                      {isRTL
                        ? "تفعيل هذا الخيار لجعل الملف الشخصي خاصاً"
                        : "Activer cette option pour rendre le profil privé"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ActionButtons
              onCancel={handleDialogClose}
              onSave={handleSaveSituation}
              isLoading={isLoading}
              isRTL={isRTL}
            />
          </div>
        </Dialog>
      )}

      {/* Prolongation Dialog */}
      {activeDialog === "prolongation" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "تعديل تمديد التقاعد" : "Modifier la Prolongation de Retraite"}
          icon={Calendar}
          isRTL={isRTL}
        >
          <div className="space-y-4">
            <div className="pb-4">
              <div className="group">
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تمديد التقاعد" : "Prolongation de Retraite"}
                </label>
                <Select
                  dir={isRTL ? "rtl" : "ltr"}
                  value={prolongationData.prolongation_retraite.toString()}
                  onValueChange={(value) =>
                    setProlongationData({ ...prolongationData, prolongation_retraite: parseInt(value) })
                  }
                >
                  <SelectTrigger
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                      isRTL ? "font-noto-naskh-arabic" : ""
                    }`}
                  >
                    <SelectValue
                      placeholder={isRTL ? "اختر مدة التمديد..." : "Sélectionner la durée de prolongation..."}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
                    <SelectItem
                      className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                      value="0"
                    >
                      {isRTL ? "لا يوجد تمديد" : "Aucune prolongation"}
                    </SelectItem>
                    <SelectItem
                      className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                      value="1"
                    >
                      {isRTL ? "سنة واحدة" : "1 an"}
                    </SelectItem>
                    <SelectItem
                      className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                      value="2"
                    >
                      {isRTL ? "سنتان" : "2 ans"}
                    </SelectItem>
                    <SelectItem
                      className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                        isRTL ? "font-noto-naskh-arabic" : ""
                      }`}
                      value="3"
                    >
                      {isRTL ? "ثلاث سنوات" : "3 ans"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                  {isRTL
                    ? "اختر مدة التمديد بعد سن التقاعد (57 سنة)"
                    : "Sélectionnez la durée de prolongation après l'âge de retraite (57 ans)"}
                </p>
              </div>
            </div>
            <ActionButtons
              onCancel={handleDialogClose}
              onSave={handleSaveProlongation}
              isLoading={isLoading}
              isRTL={isRTL}
            />
          </div>
        </Dialog>
      )}

      {/* Grades Dialog */}
      {activeDialog === "gradesList" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "إدارة الرتب" : "Gestion des Grades"}
          icon={Award}
          isRTL={isRTL}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3
                className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}
              >
                {isRTL ? "قائمة الرتب" : "Liste des Grades"}
              </h3>
              <button
                onClick={addGrade}
                disabled={hasUnsavedGrade()}
                className={`group p-1 transition-all duration-200 rounded ${
                  hasUnsavedGrade()
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
                }`}
                title={
                  hasUnsavedGrade()
                    ? isRTL
                      ? "يجب حفظ أو إلغاء التعديلات قبل إضافة رتبة جديدة"
                      : "Veuillez sauvegarder ou annuler avant d'ajouter un grade"
                    : isRTL
                    ? "إضافة رتبة"
                    : "Ajouter un grade"
                }
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-200 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "180px" }}
                    >
                      {isRTL ? "الرتبة" : "Grade"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "140px" }}
                    >
                      {isRTL ? "تاريخ الحصول" : "Date d'obtention"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "140px" }}
                    >
                      {isRTL ? "تاريخ الانتهاء" : "Date de fin"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "120px" }}
                    >
                      {isRTL ? "المرجع" : "Référence"}
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
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {grades.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                          isRTL ? cardSubtitleFontClass : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <Award className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>{isRTL ? "لا توجد رتب مسجلة" : "Aucun grade enregistré"}</span>
                          <button
                            onClick={addGrade}
                            disabled={hasUnsavedGrade()}
                            className={`mt-2 text-sm underline ${isRTL ? cardSubtitleFontClass : ""} ${
                              hasUnsavedGrade()
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                            }`}
                          >
                            {isRTL ? "إضافة الرتبة الأولى" : "Ajouter le premier grade"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    grades.map((grade, index) => (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                        <td className={`px-4 py-2 w-48 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingGradeIndex === index ? (
                            <Select value={grade.grade} onValueChange={(value) => updateGrade(index, "grade", value)}>
                              <SelectTrigger
                                className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                <SelectValue placeholder={isRTL ? "اختيار الرتبة..." : "Sélectionner un grade..."} />
                              </SelectTrigger>
                              <SelectContent
                                className={`bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600 ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                {gradeOptions.map((option) => (
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
                              className="truncate h-8 flex items-center"
                              title={grade.grade || (isRTL ? "غير محدد" : "Non défini")}
                            >
                              <Award className="w-4 h-4 text-blue-600 shrink-0 mr-2" />
                              {grade.grade || (isRTL ? "غير محدد" : "Non défini")}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingGradeIndex === index ? (
                            <I18nProvider locale="fr-FR">
                              <DateField
                                value={grade.date_grade ? parseDate(grade.date_grade) : null}
                                onChange={(date) => {
                                  const dateStr = date ? date.toString() : ""
                                  updateGrade(index, "date_grade", dateStr)
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
                            <div className="h-8 flex items-center">{formatDateRTL(grade.date_grade, isRTL)}</div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingGradeIndex === index ? (
                            <I18nProvider locale="fr-FR">
                              <DateField
                                value={grade.date_fin ? parseDate(grade.date_fin) : null}
                                onChange={(date) => {
                                  const dateStr = date ? date.toString() : ""
                                  updateGrade(index, "date_fin", dateStr)
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
                            <div className="h-8 flex items-center">{formatDateRTL(grade.date_fin, isRTL)}</div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-36 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingGradeIndex === index ? (
                            <input
                              type="text"
                              value={grade.reference || ""}
                              onChange={(e) => updateGrade(index, "reference", e.target.value)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              placeholder={isRTL ? "المرجع..." : "Référence..."}
                            />
                          ) : (
                            <div
                              className="truncate h-8 flex items-center"
                              title={grade.reference || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                            >
                              {grade.reference || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 w-24 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            {editingGradeIndex === index ? (
                              <>
                                <button
                                  onClick={() => saveGrade(index)}
                                  className="text-green-600 hover:text-green-800 cursor-pointer"
                                  title={isRTL ? "حفظ" : "Sauvegarder"}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const grade = grades[index]
                                    if (isEmptyGrade(grade) && grade.id.toString().startsWith("temp-")) {
                                      setGrades(grades.filter((_, i) => i !== index))
                                    } else {
                                      // Restaurer les valeurs originales
                                      const originalGrade = originalGradesList.find((g) => g.id === grade.id)
                                      if (originalGrade) {
                                        const updatedGrades = [...grades]
                                        updatedGrades[index] = originalGrade
                                        setGrades(updatedGrades)
                                      }
                                    }
                                    setEditingGradeIndex(null)
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
                                  onClick={() => setEditingGradeIndex(index)}
                                  className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                  title={isRTL ? "تعديل" : "Modifier"}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteGrade(index)}
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
                <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "إغلاق" : "Fermer"}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Fonctions Dialog */}
      {activeDialog === "fonctionsList" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "إدارة المهام" : "Gestion des Fonctions"}
          isRTL={isRTL}
          icon={Briefcase}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3
                className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}
              >
                {isRTL ? "قائمة المهام" : "Liste des Fonctions"}
              </h3>
              <button
                onClick={addFonction}
                disabled={hasUnsavedFonction()}
                className={`group p-1 transition-all duration-200 rounded ${
                  hasUnsavedFonction()
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
                }`}
                title={
                  hasUnsavedFonction()
                    ? isRTL
                      ? "يجب حفظ أو إلغاء التعديلات قبل إضافة مهمة جديدة"
                      : "Veuillez sauvegarder ou annuler avant d'ajouter une fonction"
                    : isRTL
                    ? "إضافة مهمة"
                    : "Ajouter une fonction"
                }
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-200 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "180px" }}
                    >
                      {isRTL ? "المهمة" : "Fonction"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "140px" }}
                    >
                      {isRTL ? "تاريخ الحصول" : "Date d'obtention"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "140px" }}
                    >
                      {isRTL ? "تاريخ الانتهاء" : "Date de fin"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "120px" }}
                    >
                      {isRTL ? "المرجع" : "Référence"}
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
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {fonctions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                          isRTL ? cardSubtitleFontClass : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <Briefcase className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>{isRTL ? "لا توجد مهام مسجلة" : "Aucune fonction enregistrée"}</span>
                          <button
                            onClick={addFonction}
                            disabled={hasUnsavedFonction()}
                            className={`mt-2 text-sm underline ${isRTL ? cardSubtitleFontClass : ""} ${
                              hasUnsavedFonction()
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                            }`}
                          >
                            {isRTL ? "إضافة المهمة الأولى" : "Ajouter la première fonction"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    fonctions
                      .map((fonction, index) => ({ fonction, originalIndex: index }))
                      .map(({ fonction, originalIndex }) => {
                        return (
                          <tr key={fonction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                            <td className={`px-4 py-2 w-44 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                              {editingFonctionIndex === originalIndex ? (
                                <Select
                                  value={fonction.fonction}
                                  onValueChange={(value) => updateFonction(originalIndex, "fonction", value)}
                                >
                                  <SelectTrigger
                                    className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                  >
                                    <SelectValue
                                      placeholder={isRTL ? "اختيار المهمة..." : "Sélectionner une fonction..."}
                                    />
                                  </SelectTrigger>
                                  <SelectContent
                                    className={`bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                  >
                                    {fonctionOptions.map((option) => (
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
                                  className="truncate h-8 flex items-center"
                                  title={
                                    fonction.fonction || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")
                                  }
                                >
                                  <Briefcase className="w-4 h-4 text-blue-600 shrink-0 mr-2" />
                                  {fonction.fonction || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                              {editingFonctionIndex === originalIndex ? (
                                <I18nProvider locale="fr-FR">
                                  <DateField
                                    value={
                                      fonction.date_obtention_fonction
                                        ? parseDate(fonction.date_obtention_fonction)
                                        : null
                                    }
                                    onChange={(date) => {
                                      const dateStr = date ? date.toString() : ""
                                      updateFonction(originalIndex, "date_obtention_fonction", dateStr)
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
                                  {formatDateRTL(fonction.date_obtention_fonction, isRTL)}
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-2 w-32 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                              {editingFonctionIndex === originalIndex ? (
                                <I18nProvider locale="fr-FR">
                                  <DateField
                                    value={fonction.date_fin ? parseDate(fonction.date_fin) : null}
                                    onChange={(date) => {
                                      const dateStr = date ? date.toString() : ""
                                      updateFonction(originalIndex, "date_fin", dateStr)
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
                                  {formatDateRTL(fonction.date_fin, isRTL)}
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                              {editingFonctionIndex === originalIndex ? (
                                <input
                                  type="text"
                                  value={fonction.reference || ""}
                                  onChange={(e) => updateFonction(originalIndex, "reference", e.target.value)}
                                  className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                                  placeholder={isRTL ? "المرجع..." : "Référence..."}
                                />
                              ) : (
                                <div
                                  className="truncate h-8 flex items-center"
                                  title={
                                    fonction.reference || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")
                                  }
                                >
                                  {fonction.reference || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 w-24 align-middle">
                              <div className="flex items-center justify-center space-x-2">
                                {editingFonctionIndex === originalIndex ? (
                                  <>
                                    <button
                                      onClick={() => saveFonction(originalIndex)}
                                      className="text-green-600 hover:text-green-800 cursor-pointer"
                                      title={isRTL ? "حفظ" : "Sauvegarder"}
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const fonction = fonctions[originalIndex]
                                        if (fonction.id.toString().startsWith("temp-")) {
                                          // Supprimer la ligne temporaire (nouvelle ligne) peu importe son contenu
                                          setFonctions(fonctions.filter((_, i) => i !== originalIndex))
                                        } else {
                                          // Restaurer les valeurs originales pour les lignes existantes
                                          const originalFonction = originalFonctionsList.find(
                                            (f) => f.id === fonction.id
                                          )
                                          if (originalFonction) {
                                            const updatedFonctions = [...fonctions]
                                            updatedFonctions[originalIndex] = originalFonction
                                            setFonctions(updatedFonctions)
                                          }
                                        }
                                        setEditingFonctionIndex(null)
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
                                      onClick={() => setEditingFonctionIndex(originalIndex)}
                                      className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                      title={isRTL ? "تعديل" : "Modifier"}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteFonction(originalIndex)}
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
                        )
                      })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleDialogClose}
                className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
              >
                <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "إغلاق" : "Fermer"}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Affectations Dialog */}
      {activeDialog === "affectation" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "إدارة التعيينــات" : "Gestion des Affectations"}
          isRTL={isRTL}
          icon={ClipboardList}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3
                className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}
              >
                {isRTL ? "قائمة التعيينـات" : "Liste des Affectations"}
              </h3>
              <button
                onClick={addAffectation}
                className="group p-1 text-[#076784] hover:text-[#065a72] transition-all duration-200 cursor-pointer hover:shadow-sm rounded"
                title={isRTL ? "إضافة تعيين" : "Ajouter une affectation"}
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-250 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "250px" }}
                    >
                      {isRTL ? "الــوحــــــــــــــــدة" : "Unité"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "150px" }}
                    >
                      {isRTL ? "المسؤوليـــة" : "Responsabilité"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "120px" }}
                    >
                      {isRTL ? "تاريخ البداية" : "Date début"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "120px" }}
                    >
                      {isRTL ? "تاريخ النهاية" : "Date fin"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "160px" }}
                    >
                      {isRTL ? "البــرقيــــة" : "Télex"}
                    </th>
                    <th
                      className={`px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "100px" }}
                    >
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {affectations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>Aucune affectation enregistrée</span>
                          <button
                            onClick={addAffectation}
                            className="mt-2 text-[#076784] hover:text-[#065a72] text-sm underline cursor-pointer"
                          >
                            Ajouter la première affectation
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    affectations.map((affectation, index) => (
                      <tr key={affectation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                        <td className={`px-4 py-2 w-60 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingAffectationIndex === index ? (
                            <SearchableSelect
                              value={affectation.unite}
                              onValueChange={(value) => updateAffectation(index, "unite", value)}
                              options={unitesList.map((unite) => unite.unite)}
                              placeholder={isRTL ? "اختيار الوحدة..." : "Sélectionner une unité..."}
                              searchPlaceholder={isRTL ? "البحث عن وحدة..." : "Rechercher une unité..."}
                              triggerClassName={`w-full px-3 py-1 text-xs !h-[32px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                isRTL ? "font-noto-naskh-arabic" : ""
                              }`}
                              contentClassName={isRTL ? "font-noto-naskh-arabic" : ""}
                              optionClassName={isRTL ? "font-noto-naskh-arabic" : ""}
                              emptyMessage={isRTL ? "لم يتم العثور على وحدات" : "Aucune unité trouvée"}
                            />
                          ) : (
                            <div
                              className="truncate h-8 flex items-center"
                              title={affectation.unite || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                            >
                              <ClipboardList className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                              {affectation.unite || (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-36 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingAffectationIndex === index ? (
                            <Select
                              dir={isRTL ? "rtl" : "ltr"}
                              value={affectation.responsibility}
                              onValueChange={(value) => updateAffectation(index, "responsibility", value)}
                            >
                              <SelectTrigger
                                className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                <SelectValue
                                  placeholder={isRTL ? "اختيار المسؤولية..." : "Sélectionner une responsabilité..."}
                                />
                              </SelectTrigger>
                              <SelectContent
                                className={`bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600 ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                {responsibilitiesList.length > 0 ? (
                                  responsibilitiesList.map((responsibility) => (
                                    <SelectItem
                                      className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                        isRTL ? "font-noto-naskh-arabic" : ""
                                      }`}
                                      key={responsibility}
                                      value={responsibility}
                                    >
                                      {responsibility}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem
                                    className={`px-3 py-2 text-xs text-gray-500 dark:text-gray-400 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    value="no-responsibilities"
                                    disabled
                                  >
                                    {affectation.unite
                                      ? isRTL
                                        ? "لا توجد مسؤوليات متاحة"
                                        : "Aucune responsabilité disponible"
                                      : isRTL
                                      ? "اختر الوحدة أولاً"
                                      : "Sélectionnez d'abord une unité"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="h-8 flex items-center">
                              {affectation.responsibility ||
                                (isRTL ? "غير محددة" : isRTL ? "غير محددة" : "Non définie")}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingAffectationIndex === index ? (
                            <I18nProvider locale="fr-FR">
                              <DateField
                                value={
                                  affectation.date_debut ? parseDate(affectation.date_debut) : null
                                }
                                onChange={(date) => {
                                  const dateStr = date ? date.toString() : ""
                                  updateAffectation(index, "date_debut", dateStr)
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
                              {formatDateRTL(affectation.date_debut, isRTL)}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingAffectationIndex === index ? (
                            <I18nProvider locale="fr-FR">
                              <DateField
                                value={affectation.date_fin ? parseDate(affectation.date_fin) : null}
                                onChange={(date) => {
                                  const dateStr = date ? date.toString() : ""
                                  updateAffectation(index, "date_fin", dateStr)
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
                              {formatDateRTL(affectation.date_fin, isRTL)}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-40 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingAffectationIndex === index ? (
                            <input
                              type="text"
                              value={affectation.telex_debut || ""}
                              onChange={(e) => updateAffectation(index, "telex_debut", e.target.value)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              placeholder={isRTL ? "التلكس..." : "Télex..."}
                            />
                          ) : (
                            <div
                              className="truncate h-8 flex items-center"
                              title={affectation.telex_debut || (isRTL ? "غير محدد" : "Non défini")}
                            >
                              {affectation.telex_debut || (isRTL ? "غير محدد" : "Non défini")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 w-24 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            {editingAffectationIndex === index ? (
                              <>
                                <button
                                  onClick={() => saveAffectation(index)}
                                  className="text-green-600 hover:text-green-800 cursor-pointer"
                                  title={isRTL ? "حفظ" : "Sauvegarder"}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const affectation = affectations[index]
                                    if (
                                      isEmptyAffectation(affectation) &&
                                      affectation.id.toString().startsWith("temp-")
                                    ) {
                                      setAffectations(affectations.filter((_, i) => i !== index))
                                    } else {
                                      // Restaurer les valeurs originales
                                      const originalAffectation = originalAffectationsList.find(
                                        (a) => a.id === affectation.id
                                      )
                                      if (originalAffectation) {
                                        const updatedAffectations = [...affectations]
                                        updatedAffectations[index] = originalAffectation
                                        setAffectations(updatedAffectations)
                                      }
                                    }
                                    setEditingAffectationIndex(null)
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
                                  onClick={() => startEditingAffectation(index)}
                                  className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                  title={isRTL ? "تعديل" : "Modifier"}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteAffectation(index)}
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
                <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "إغلاق" : "Fermer"}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Banque Dialog */}
      {activeDialog === "banque" && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title={isRTL ? "إدارة الهوية البنكية" : "Gestion de l'Identité Bancaire"}
          isRTL={isRTL}
          icon={CreditCard}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3
                className={`text-md font-medium text-gray-900 dark:text-gray-300 ${isRTL ? cardSubtitleFontClass : ""}`}
              >
                {isRTL ? "قائمة الحسابات المصرفية" : "Liste des Comptes Bancaires"}
              </h3>
              <button
                onClick={addBanque}
                className="group p-1 text-[#076784] hover:text-[#065a72] transition-all duration-200 cursor-pointer hover:shadow-sm rounded"
                title={isRTL ? "إضافة حساب مصرفي" : "Ajouter un compte bancaire"}
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-250 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "80px" }}
                    >
                      {isRTL ? "#" : "#"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "300px" }}
                    >
                      {isRTL ? "البنك" : "Banque"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "180px" }}
                    >
                      {isRTL ? "الفــــرع" : "Agence"}
                    </th>
                    <th
                      className={`px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${
                        isRTL ? cardSubtitleFontClass : ""
                      }`}
                      style={{ width: "160px" }}
                    >
                      {isRTL ? "رقم الحساب البنكي" : "RIB"}
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
                      style={{ width: "100px" }}
                    >
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {banques.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${
                          isRTL ? cardSubtitleFontClass : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <CreditCard className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>{isRTL ? "لا توجد حسابات مصرفية مسجلة" : "Aucun compte bancaire enregistré"}</span>
                          <button
                            onClick={addBanque}
                            className={`mt-2 text-[#076784] hover:text-[#065a72] text-sm underline cursor-pointer ${
                              isRTL ? cardSubtitleFontClass : ""
                            }`}
                          >
                            {isRTL ? "إضافة الحساب الأول" : "Ajouter le premier compte"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    banques.map((banque, index) => (
                      <tr
                        key={banque.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-12"
                      >
                        <td className="px-4 py-2 w-20 align-middle">
                          {(() => {
                            const selectedBank = banquesList.find((bank) => bank.banque_nom === banque.banque)
                            if (selectedBank?.banque_logo) {
                              return (
                                <div className="h-8 flex items-center justify-center">
                                  <img
                                    src={selectedBank.banque_logo}
                                    alt={banque.banque || "Logo banque"}
                                    className="h-6 w-auto max-w-15 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                </div>
                              )
                            }
                            return (
                              <div className="h-8 flex items-center justify-center">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                  <CreditCard className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className={`px-4 py-2 w-72 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingBanqueIndex === index ? (
                            <Select
                              value={banque.banque}
                              onValueChange={(value) => updateBanque(index, "banque", value)}
                            >
                              <SelectTrigger
                                className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                <SelectValue placeholder={isRTL ? "اختيار البنك..." : "Sélectionner une banque..."} />
                              </SelectTrigger>
                              <SelectContent
                                className={`bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600 ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                }`}
                              >
                                {banquesList.map((bank) => (
                                  <SelectItem
                                    className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    key={bank.banque_nom}
                                    value={bank.banque_nom}
                                  >
                                    {bank.banque_nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div
                              className="truncate h-8 flex items-center gap-2"
                              title={banque.banque || (isRTL ? "غير محددة" : "Non définie")}
                            >
                              <CreditCard className={`w-4 h-4 text-blue-600 shrink-0`} />
                              {banque.banque || (isRTL ? "غير محددة" : "Non définie")}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-44 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingBanqueIndex === index ? (
                            <input
                              type="text"
                              value={banque.agence}
                              onChange={(e) => updateBanque(index, "agence", e.target.value)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              placeholder={isRTL ? "الفــــرع..." : "Agence..."}
                            />
                          ) : (
                            <div className="h-8 flex items-center">
                              {banque.agence || (isRTL ? "غير محددة" : "Non définie")}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-40 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingBanqueIndex === index ? (
                            <input
                              type="text"
                              value={banque.rib}
                              onChange={(e) => updateBanque(index, "rib", e.target.value)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              placeholder={isRTL ? "رقم الحساب البنكي..." : "Numéro RIB..."}
                              maxLength={20}
                            />
                          ) : (
                            <div
                              className="h-8 flex items-center font-mono text-xs truncate"
                              title={banque.rib || (isRTL ? "غير محدد" : "Non défini")}
                            >
                              {banque.rib || (isRTL ? "غير محدد" : "Non défini")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 w-24 align-middle">
                          {editingBanqueIndex === index ? (
                            <div className="flex items-center h-8">
                              <Switch
                                isSelected={banque.compte_statut}
                                onChange={(isSelected: boolean) => updateBanque(index, "compte_statut", isSelected)}
                                className="shrink-0 scale-75"
                                customColor="#076784"
                              />
                            </div>
                          ) : (
                            <div className="h-8 flex items-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  isRTL ? "font-noto-naskh-arabic" : ""
                                } ${banque.compte_statut ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                              >
                                {banque.compte_statut ? (isRTL ? "نشط" : "Actif") : isRTL ? "غير نشط" : "Inactif"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 w-24 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            {editingBanqueIndex === index ? (
                              <>
                                <button
                                  onClick={() => saveBanque(index)}
                                  className="text-green-600 hover:text-green-800 cursor-pointer"
                                  title={isRTL ? "حفظ" : "Sauvegarder"}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const banque = banques[index]
                                    if (isEmptyBanque(banque) && banque.id.toString().startsWith("temp-")) {
                                      setBanques(banques.filter((_, i) => i !== index))
                                    } else {
                                      // Restaurer les valeurs originales
                                      const originalBanque = originalBanquesList.find((b) => b.id === banque.id)
                                      if (originalBanque) {
                                        const updatedBanques = [...banques]
                                        updatedBanques[index] = originalBanque
                                        setBanques(updatedBanques)
                                      }
                                    }
                                    setEditingBanqueIndex(null)
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
                                  onClick={() => setEditingBanqueIndex(index)}
                                  className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                  title={isRTL ? "تعديل" : "Modifier"}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteBanque(index)}
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
                <span className={isRTL ? "font-noto-naskh-arabic" : ""}>{isRTL ? "إغلاق" : "Fermer"}</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Rendements Dialog - Affiché uniquement en mode RTL */}
      {activeDialog === "rendementsList" && isRTL && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title="إدارة أعــداد الأداء"
          icon={Award}
          isRTL={isRTL}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                قائمة أعــداد الأداء
              </h3>
              <button
                onClick={addRendement}
                disabled={hasUnsavedRendement()}
                className={`group p-1 transition-all duration-200 rounded ${
                  hasUnsavedRendement()
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
                }`}
                title={
                  hasUnsavedRendement() ? "يجب حفظ أو إلغاء التعديلات قبل إضافة عــدد أداء جديد" : "إضافة عــدد أداء"
                }
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-150 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "120px" }}
                    >
                      السنة
                    </th>
                    <th
                      className={`px-4 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "120px" }}
                    >
                      الفصل
                    </th>
                    <th
                      className={`px-4 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "120px" }}
                    >
                      الأعـــداد
                    </th>
                    <th
                      className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "120px" }}
                    >
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {rendements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                      >
                        <div className="flex flex-col items-center">
                          <Award className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>لم يتم تسجيل أي عــدد أداء</span>
                          <button
                            onClick={addRendement}
                            disabled={hasUnsavedRendement()}
                            className={`mt-2 text-sm underline ${cardSubtitleFontClass} ${
                              hasUnsavedRendement()
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                            }`}
                          >
                            إضافة عــدد الأولى
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rendements
                      .map((rendement, index) => ({ rendement, originalIndex: index }))
                      .map(({ rendement, originalIndex }) => (
                        <tr key={rendement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                          <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                            {editingRendementIndex === originalIndex ? (
                              <input
                                type="number"
                                value={rendement.annee || ""}
                                onChange={(e) => updateRendement(originalIndex, "annee", parseInt(e.target.value) || 0)}
                                className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                                min="2000"
                                max="2100"
                                placeholder="السنة"
                              />
                            ) : (
                              <div className="h-8 flex items-center">
                                <Calendar className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                                {rendement.annee || "غير محدد"}
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                            {editingRendementIndex === originalIndex ? (
                              <Select
                                dir="rtl"
                                value={rendement.trimestre?.toString() || "1"}
                                onValueChange={(value) =>
                                  updateRendement(originalIndex, "trimestre", parseInt(value) || 1)
                                }
                              >
                                <SelectTrigger
                                  className={`w-full px-3 py-1 text-xs h-8! border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
                                    isRTL ? "font-noto-naskh-arabic" : ""
                                  }`}
                                >
                                  <SelectValue placeholder="اختر الثلاثية..." />
                                </SelectTrigger>
                                <SelectContent
                                  className={`bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600 ${
                                    isRTL ? "font-noto-naskh-arabic" : ""
                                  }`}
                                >
                                  <SelectItem
                                    className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    value="1"
                                  >
                                    الثلاثية الأولى
                                  </SelectItem>
                                  <SelectItem
                                    className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    value="2"
                                  >
                                    الثلاثنية الثانية
                                  </SelectItem>

                                  <SelectItem
                                    className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    value="3"
                                  >
                                    الثلاثية الثالثة
                                  </SelectItem>
                                  <SelectItem
                                    className={`px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
                                      isRTL ? "font-noto-naskh-arabic" : ""
                                    }`}
                                    value="4"
                                  >
                                    الثلاثية الرابعة
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="h-8 flex items-center">
                                {rendement.trimestre ? `الثلاثية ${rendement.trimestre}` : "غير محدد"}
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-2 w-30 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                            {editingRendementIndex === originalIndex ? (
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                value={rendement.rendement_note || ""}
                                onChange={(e) =>
                                  updateRendement(originalIndex, "rendement_note", parseInt(e.target.value) || 0)
                                }
                                className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                                placeholder="العـدد  (0-100)"
                              />
                            ) : (
                              <div className="h-8 flex items-center">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-medium ${cardSubtitleFontClass} ${
                                    (rendement.rendement_note ?? 0) >= 80
                                      ? "bg-green-100 text-green-800"
                                      : (rendement.rendement_note ?? 0) >= 65
                                      ? "bg-orange-100 text-orange-800"
                                      : (rendement.rendement_note ?? 0) >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {rendement.rendement_note !== null && rendement.rendement_note !== undefined
                                    ? rendement.rendement_note
                                    : "غير محدد"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 w-24 align-middle">
                            <div className="flex items-center justify-center space-x-2">
                              {editingRendementIndex === originalIndex ? (
                                <>
                                  <button
                                    onClick={() => saveRendement(originalIndex)}
                                    className="text-green-600 hover:text-green-800 cursor-pointer"
                                    title="حفظ"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const rendement = rendements[originalIndex]
                                      if (rendement.id.toString().startsWith("temp-")) {
                                        // Supprimer la ligne temporaire
                                        setRendements(rendements.filter((_, i) => i !== originalIndex))
                                      } else {
                                        // Restaurer les valeurs originales
                                        const originalRendement = originalRendementsList.find(
                                          (r) => r.id === rendement.id
                                        )
                                        if (originalRendement) {
                                          const updatedRendements = [...rendements]
                                          updatedRendements[originalIndex] = originalRendement
                                          setRendements(updatedRendements)
                                        }
                                      }
                                      setEditingRendementIndex(null)
                                    }}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer"
                                    title="إلـغــــاء"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingRendementIndex(originalIndex)}
                                    className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteRendement(originalIndex)}
                                    className="text-red-600 hover:text-red-800 cursor-pointer"
                                    title="حذف"
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
                <span className={cardSubtitleFontClass}>إغلاق</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Notes Annuelles Dialog - Affiché uniquement en mode RTL */}
      {activeDialog === "notesAnnuellesList" && isRTL && (
        <Dialog
          isOpen={true}
          onClose={handleDialogClose}
          isClosing={isClosing}
          title="إدارة الأعــداد السنوية"
          icon={Award}
          isRTL={isRTL}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-md font-medium text-gray-900 dark:text-gray-300 ${cardSubtitleFontClass}`}>
                قائمة الأعــداد السنوية
              </h3>
              <button
                onClick={addNoteAnnuelle}
                disabled={editingNoteAnnuelleIndex !== null}
                className={`group p-1 transition-all duration-200 rounded ${
                  editingNoteAnnuelleIndex !== null
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-[#076784] hover:text-[#065a72] cursor-pointer hover:shadow-sm"
                }`}
                title={editingNoteAnnuelleIndex !== null ? "انتهي من التعديل أولاً" : "إضافة عــدد سنوي"}
              >
                <Plus
                  className={`h-4 w-4 transition-transform duration-200 ${
                    editingNoteAnnuelleIndex === null ? "group-hover:scale-110" : ""
                  }`}
                />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96 mb-1">
              <table className="w-full text-sm min-w-125 table-fixed">
                <thead className="bg-gray-100 dark:bg-gray-800 h-12">
                  <tr>
                    <th
                      className={`px-4 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "140px" }}
                    >
                      السنة
                    </th>
                    <th
                      className={`px-4 py-2 text-start text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "140px" }}
                    >
                      العــــدد / 100
                    </th>
                    <th
                      className={`px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase ${cardSubtitleFontClass}`}
                      style={{ width: "120px" }}
                    >
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {notesAnnuelles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className={`px-4 py-8 text-center text-gray-500 dark:text-gray-400 ${cardSubtitleFontClass}`}
                      >
                        <div className="flex flex-col items-center">
                          <Award className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                          <span>لم يتم تسجيل أي عــدد سنوي</span>
                          <button
                            onClick={addNoteAnnuelle}
                            disabled={editingNoteAnnuelleIndex !== null}
                            className={`mt-2 text-sm underline transition-all duration-200 ${cardSubtitleFontClass} ${
                              editingNoteAnnuelleIndex !== null
                                ? "text-gray-400 cursor-not-allowed opacity-50"
                                : "text-[#076784] hover:text-[#065a72] cursor-pointer"
                            }`}
                            title={
                              editingNoteAnnuelleIndex !== null
                                ? "انتهي من التعديل أولاً"
                                : "إضافة العــدد السنوي الأول"
                            }
                          >
                            إضافة العــدد السنوي الأول
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    notesAnnuelles.map((noteAnnuelle, index) => (
                      <tr key={noteAnnuelle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 h-12">
                        <td className={`px-4 py-2 w-35 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingNoteAnnuelleIndex === index ? (
                            <input
                              type="number"
                              value={noteAnnuelle.annee || ""}
                              onChange={(e) => updateNoteAnnuelle(index, "annee", parseInt(e.target.value) || 0)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              min="2000"
                              max="2100"
                              placeholder="السنة"
                            />
                          ) : (
                            <div className="h-8 flex items-center">
                              <Calendar className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                              {noteAnnuelle.annee || "غير محدد"}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-2 w-35 align-middle ${isRTL ? "font-noto-naskh-arabic" : ""}`}>
                          {editingNoteAnnuelleIndex === index ? (
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="100"
                              value={noteAnnuelle.note_annuelle || ""}
                              onChange={(e) =>
                                updateNoteAnnuelle(index, "note_annuelle", parseInt(e.target.value) || 0)
                              }
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm"
                              placeholder="العـدد (0-100)"
                            />
                          ) : (
                            <div className="h-8 flex items-center">
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium ${cardSubtitleFontClass} ${
                                  (noteAnnuelle.note_annuelle || 0) >= 80
                                    ? "bg-green-100 text-green-800"
                                    : (noteAnnuelle.note_annuelle || 0) >= 65
                                    ? "bg-orange-100 text-orange-800"
                                    : (noteAnnuelle.note_annuelle || 0) >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {noteAnnuelle.note_annuelle !== null && noteAnnuelle.note_annuelle !== undefined
                                  ? noteAnnuelle.note_annuelle
                                  : "غير محدد"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 w-24 align-middle">
                          <div className="flex items-center justify-center space-x-2">
                            {editingNoteAnnuelleIndex === index ? (
                              <>
                                <button
                                  onClick={() => saveNoteAnnuelle(index)}
                                  className="text-green-600 hover:text-green-800 cursor-pointer"
                                  title="حفظ"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const noteAnnuelle = notesAnnuelles[index]
                                    if (noteAnnuelle.id.toString().startsWith("temp-")) {
                                      // Supprimer la ligne temporaire
                                      setNotesAnnuelles(notesAnnuelles.filter((_, i) => i !== index))
                                    } else {
                                      // Restaurer les valeurs originales
                                      const originalNoteAnnuelle = originalNotesAnnuellesList.find(
                                        (n) => n.id === noteAnnuelle.id
                                      )
                                      if (originalNoteAnnuelle) {
                                        const updatedNotesAnnuelles = [...notesAnnuelles]
                                        updatedNotesAnnuelles[index] = originalNoteAnnuelle
                                        setNotesAnnuelles(updatedNotesAnnuelles)
                                      }
                                    }
                                    setEditingNoteAnnuelleIndex(null)
                                  }}
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer"
                                  title="إلـغــــاء"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingNoteAnnuelleIndex(index)}
                                  className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteNoteAnnuelle(index)}
                                  className="text-red-600 hover:text-red-800 cursor-pointer"
                                  title="حذف"
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
                <span className={cardSubtitleFontClass}>إغلاق</span>
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Stub Dialogs */}
    </>
  )
}
