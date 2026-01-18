"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  Camera,
  Plus,
  ArrowLeft,
  Award,
  Anchor,
  Mountain,
  Users,
  X,
  Save,
  Plane,
  Edit,
  User,
  CheckIcon,
  ArrowRight,
  Trash2,
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { RawUniteData, processUniteData } from "@/types/unite.types"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { useRouter } from "next/navigation"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useParams } from "next/navigation"
import {
  getDirection,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"
import { getGradeLabel } from "@/lib/selectOptions"
import { formatDateForRTL, formatDateForLTR } from "@/utils/dateUtils"
import Toaster, { ToasterRef } from "@/components/ui/toast"

interface UnitePhoto {
  id: string
  unite_id: string
  photo_url: string
  description: string | null
  created_at: string
  updated_at: string | null
}

interface AgentData {
  id: string
  prenom: string
  nom: string
  matricule: string
  responsibility: string | null
  date_responsabilite: string | null
  photo_url: string | null
  employee_grade: string | null
  phone_1: string | null
  sexe: string | null
  telex_debut: string | null
}

interface EmployeeSearchResult {
  id: string
  prenom: string
  nom: string
  matricule: string
  employee_grade: string
  sexe: string
  photo_url: string | null
}

interface UniteCompleteData {
  unite: RawUniteData
  photos: UnitePhoto[]
  agents: AgentData[]
}

interface SimpleUniteDetailsProps {
  initialData: UniteCompleteData
  uniteId: string
}

interface DialogProps {
  isOpen: boolean
  isClosing?: boolean
  onClose: () => void
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  maxWidth?: string
}

// Composant Dialog générique
function Dialog({
  isOpen,
  isClosing = false,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-4xl",
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
        className={`bg-white dark:bg-[#26272A] rounded-lg shadow-2xl w-full ${maxWidth} mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600 duration-300 ${
          isClosing ? "animate-out slide-out-to-bottom-4 zoom-out-95" : "animate-in slide-in-from-bottom-4 zoom-in-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-[#076784]" />
            <h2 className="text-lg font-semibold text-[#076784] dark:text-[#4FC3F7]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
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


export default function SimpleUniteDetails({ initialData, uniteId }: SimpleUniteDetailsProps) {
  const [data, setData] = useState(initialData)
  const [activeTab, setActiveTab] = useState("agents")
  const [showEmployeesDialog, setShowEmployeesDialog] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [employeesList, setEmployeesList] = useState(data.agents)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditPressed, setIsEditPressed] = useState(false)
  const [editingEmployeeIndex, setEditingEmployeeIndex] = useState<number | null>(null)
  const toasterRef = useRef<ToasterRef>(null)
  const [editedUniteBatiment, setEditedUniteBatiment] = useState(initialData.unite.unite_batiment || "")
  const [editedDescription, setEditedDescription] = useState(initialData.unite.unite_description || "")
  const [editedAdresse, setEditedAdresse] = useState(initialData.unite.unite_adresse || "")
  const [editedLatitude, setEditedLatitude] = useState(
    Array.isArray(initialData.unite.unite_gps) && initialData.unite.unite_gps.length > 0
      ? initialData.unite.unite_gps[0] || ""
      : ""
  )
  const [editedLongitude, setEditedLongitude] = useState(
    Array.isArray(initialData.unite.unite_gps) && initialData.unite.unite_gps.length > 1
      ? initialData.unite.unite_gps[1] || ""
      : ""
  )
  const [editedIndicatif, setEditedIndicatif] = useState(initialData.unite.unite_indicatif || "")
  const [editedEmail, setEditedEmail] = useState(initialData.unite.unite_email || "")
  const [editedTelephone1, setEditedTelephone1] = useState(initialData.unite.unite_telephone1 || "")
  const [editedTelephone2, setEditedTelephone2] = useState(initialData.unite.unite_telephone2 || "")
  const [editedTelephone3, setEditedTelephone3] = useState(initialData.unite.unite_telephone3 || "")
  const [editedUnite, setEditedUnite] = useState(initialData.unite.unite || "")
  const [editedUniteCategorie, setEditedUniteCategorie] = useState(initialData.unite.unite_categorie || "")
  const [editedUnitePort, setEditedUnitePort] = useState(initialData.unite.unite_port || "")
  const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [selectedEmployeeForAdd, setSelectedEmployeeForAdd] = useState<EmployeeSearchResult | null>(null)
  const [newEmployeeData, setNewEmployeeData] = useState<{
    responsibility: string
    date_responsabilite: string
  }>({ responsibility: "", date_responsabilite: "" })
  const [isAddingNewEmployee, setIsAddingNewEmployee] = useState(false)
  const [availableResponsibilities, setAvailableResponsibilities] = useState<{ value: string; label: string }[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    index: number
    itemName: string
  }>({
    isOpen: false,
    index: -1,
    itemName: "",
  })
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [pendingSecondaryPhotos, setPendingSecondaryPhotos] = useState<(File | null)[]>([null, null, null, null])
  const [pendingSecondaryPhotoPreviews, setPendingSecondaryPhotoPreviews] = useState<(string | null)[]>([null, null, null, null])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0) // Index de la photo sélectionnée pour l'affichage principal
  const secondaryPhotoInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])
  const router = useRouter()
  const unite = processUniteData(data.unite)

  // Translation and locale setup
  const params = useParams()
  const locale = params.locale as Locale
  const isRTL = params.locale === "ar"


  const supabase = createClient()

  // Fonction pour récupérer les responsabilités disponibles selon la catégorie de l'unité
  const fetchAvailableResponsibilities = async (
    currentEditingEmployeeId?: string,
    currentEmployeeResponsibility?: string
  ) => {
    try {
      // 1. Récupérer toutes les responsabilités possibles pour cette catégorie
      const { data: responsibilitiesArray, error } = await supabase
        .from("unite_category_responsibilities")
        .select("available_responsibilities")
        .eq("unite_categorie", unite.unite_categorie)

      // Prendre le premier élément ou null si pas de résultats
      const responsibilities =
        responsibilitiesArray && responsibilitiesArray.length > 0 ? responsibilitiesArray[0] : null

      if (error) {
        console.error("Erreur lors de la récupération des responsabilités:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          unite_categorie: unite.unite_categorie,
        })
        setAvailableResponsibilities([{ value: "Agent", label: "Agent" }])
        return
      }

      // Vérifier si des données ont été trouvées
      if (
        !responsibilities ||
        !responsibilities?.available_responsibilities ||
        !Array.isArray(responsibilities.available_responsibilities)
      ) {
        console.warn("Aucune responsabilité définie pour la catégorie:", unite.unite_categorie)
        // Définir des responsabilités par défaut si aucune n'est configurée
        const defaultResponsibilities = [{ value: "Agent", label: "Agent" }]
        setAvailableResponsibilities(defaultResponsibilities)
        return
      }

      // 2. Récupérer les responsabilités déjà prises dans cette unité
      let query = supabase
        .from("employee_affectations")
        .select("responsibility, employee_id")
        .eq("unite", unite.unite)
        .not("responsibility", "is", null)

      // Exclure l'employé en cours d'édition pour qu'il puisse garder sa responsabilité actuelle
      if (currentEditingEmployeeId) {
        query = query.neq("employee_id", currentEditingEmployeeId)
      }

      const { data: takenResponsibilities, error: takenError } = await query

      if (takenError) {
        console.error("Erreur lors de la récupération des responsabilités prises:", {
          message: takenError.message,
          details: takenError.details,
          hint: takenError.hint,
          code: takenError.code,
          unite: unite.unite,
        })
        // En cas d'erreur, afficher toutes les responsabilités
        const formattedResponsibilities = responsibilities.available_responsibilities.map((resp: string) => ({
          value: resp,
          label: resp,
        }))
        setAvailableResponsibilities(formattedResponsibilities)
        return
      }

      // 3. Filtrer les responsabilités disponibles
      const takenRespSet = new Set(
        takenResponsibilities?.map((item: { responsibility: string; employee_id: string }) => item.responsibility) || []
      )

      const availableResponsibilities = responsibilities.available_responsibilities.filter((resp: string) => {
        // Toujours garder "Agent" disponible
        if (resp === "Agent") {
          return true
        }
        // Garder la responsabilité actuelle de l'employé en cours même si elle est prise
        if (currentEmployeeResponsibility && resp === currentEmployeeResponsibility) {
          return true
        }
        // Pour les autres, vérifier si elles ne sont pas déjà prises
        return !takenRespSet.has(resp)
      })

      // Si la responsabilité actuelle n'est pas dans la liste standard, l'ajouter à sa position logique
      if (
        currentEmployeeResponsibility &&
        !responsibilities.available_responsibilities.includes(currentEmployeeResponsibility)
      ) {
        // Trouver la position appropriée (par exemple, après la dernière responsabilité disponible non-Agent)
        const nonAgentIndex = availableResponsibilities.findIndex((resp: string) => resp === "Agent")
        if (nonAgentIndex > 0) {
          availableResponsibilities.splice(nonAgentIndex, 0, currentEmployeeResponsibility)
        } else {
          availableResponsibilities.unshift(currentEmployeeResponsibility)
        }
      }

      const formattedResponsibilities = availableResponsibilities.map((resp: string) => ({
        value: resp,
        label: resp,
      }))

      setAvailableResponsibilities(formattedResponsibilities)
    } catch (error) {
      console.error("Erreur lors de la récupération des responsabilités:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        unite_categorie: unite.unite_categorie,
      })
      // En cas d'erreur fatale, définir des responsabilités par défaut
      setAvailableResponsibilities([{ value: "Agent", label: "Agent" }])
    }
  }

  // Fonction pour traiter l'image d'affichage d'un agent (similaire à processEmployeeData)
  const processAgentDisplayImage = (agent: AgentData): string => {
    // 1. Utiliser photo custom si disponible
    if (agent.photo_url) {
      return agent.photo_url
    }

    // 2. Utiliser image par défaut basée sur le sexe (valeurs arabes de la base de données)
    if (agent.sexe) {
      if (agent.sexe === "ذكر") {
        // Masculin en arabe
        return "/images/homme.png"
      } else if (agent.sexe === "أنثى") {
        // Féminin en arabe
        return "/images/femme.png"
      }
    }

    // 3. Fallback - avatar par défaut générique
    return "/images/default-avatar.png"
  }

  // Fonction pour traiter l'image d'affichage d'un employé dans les résultats de recherche
  const processEmployeeSearchImage = (employee: EmployeeSearchResult): string => {
    // 1. Utiliser photo custom si disponible
    if (employee.photo_url) {
      return employee.photo_url
    }

    // 2. Utiliser image par défaut basée sur le sexe (valeurs arabes de la base de données)
    if (employee.sexe) {
      if (employee.sexe === "ذكر") {
        // Masculin en arabe
        return "/images/homme.png"
      } else if (employee.sexe === "أنثى") {
        // Féminin en arabe
        return "/images/femme.png"
      }
    }

    // 3. Fallback - avatar par défaut générique
    return "/images/default-avatar.png"
  }

  // Fonctions utilitaires pour les employés
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const formatDateWith2DigitDay = (dateString: string) => {
    if (!dateString) return "غير محدد"
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Fonction de formatage des numéros de téléphone
  const formatPhoneNumber = (phone: string, isRTL: boolean) => {
    if (!phone) return ""

    // Nettoyer le numéro (enlever les espaces)
    const cleanPhone = phone.replace(/\s/g, "")

    // Déterminer le format selon le nombre de chiffres
    let formatted = ""

    if (cleanPhone.length === 5) {
      // Format pour 5 chiffres : xx xxx
      formatted = cleanPhone.replace(/(\d{2})(\d{3})/, "$1 $2")
    } else if (cleanPhone.length === 8) {
      // Format pour 8 chiffres : xx xxx xxx
      formatted = cleanPhone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")
    } else {
      // Retourner tel quel si le nombre de chiffres n'est ni 5 ni 8
      return phone
    }

    if (isRTL) {
      // Ajouter des marqueurs de direction pour forcer l'ordre correct en RTL
      return `\u202D${formatted}\u202C` // LTR override + pop directional formatting
    } else {
      return formatted
    }
  }

  // Fonction pour fermer la confirmation de suppression
  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      index: -1,
      itemName: "",
    })
  }

  // Fonctions de gestion des employés
  const updateEmployee = (index: number, field: string, value: string) => {
    const updatedEmployees = [...employeesList]
    updatedEmployees[index] = { ...updatedEmployees[index], [field]: value }
    setEmployeesList(updatedEmployees)
  }

  const deleteEmployee = async (index: number) => {
    const employee = employeesList[index]
    try {
      const supabase = createClient()
      // Supprimer l'affectation de l'employé
      const { error } = await supabase
        .from("employee_affectations")
        .delete()
        .eq("employee_id", employee.id)
        .eq("unite", unite.unite)

      if (error) {
        console.error("Erreur lors de la suppression:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return
      }

      const updatedEmployees = employeesList.filter((_, i) => i !== index)
      setEmployeesList(updatedEmployees)
      // Recharger les responsabilités disponibles après suppression
      fetchAvailableResponsibilities()
    } catch (error) {
      console.error("Erreur lors de la suppression d'employé:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
    closeDeleteConfirmation()
  }

  const saveEmployee = async (index: number) => {
    const employee = employeesList[index]

    // Validation des champs requis
    if (!employee.responsibility) {
      return
    }

    try {
      const supabase = createClient()
      // Mettre à jour l'affectation de l'employé
      const { error } = await supabase
        .from("employee_affectations")
        .update({
          responsibility: employee.responsibility.trim(),
          date_responsabilite: employee.date_responsabilite || null,
          updated_at: new Date().toISOString(),
        })
        .eq("employee_id", employee.id)
        .eq("unite", unite.unite)

      if (error) {
        console.error("Erreur lors de la mise à jour:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return
      }

      setEditingEmployeeIndex(null)
      // Recharger les responsabilités disponibles après sauvegarde (sans exclusion)
      fetchAvailableResponsibilities()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde d'employé:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }

  const handleConfirmDelete = () => {
    const { index } = deleteConfirmation
    deleteEmployee(index)
  }

  // Fonctions pour la recherche d'employés
  const searchEmployees = async (searchValue: string) => {
    setIsSearching(true)

    try {
      // Récupérer les IDs des employés déjà affectés à cette unité
      const currentEmployeeIds = employeesList.map((emp) => emp.id)

      let query = supabase
        .from("employees")
        .select("id, prenom, nom, matricule, employee_grade:employee_grades(grade), sexe, employee_photos(photo_url)")

      // Exclure les employés déjà affectés (seulement s'il y en a)
      if (currentEmployeeIds.length > 0) {
        query = query.not("id", "in", `(${currentEmployeeIds.join(",")})`)
      }

      if (searchValue && searchValue.length <= 5) {
        // Recherche par matricule si une valeur est saisie
        query = query.ilike("matricule", `%${searchValue}%`).limit(10)
      } else {
        // Affichage des 4 premiers employés par défaut
        query = query.limit(4)
      }

      const { data, error } = await query

      if (error) {
        console.error("Erreur recherche employés:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return
      }

      const processedResults: EmployeeSearchResult[] = (data || []).map((emp: any) => ({
        id: emp.id,
        prenom: emp.prenom,
        nom: emp.nom,
        matricule: emp.matricule,
        employee_grade: emp.employee_grade?.[0]?.grade || "غير محدد",
        sexe: emp.sexe,
        photo_url: emp.employee_photos?.[0]?.photo_url || null,
      }))

      setSearchResults(processedResults)
    } catch (error) {
      console.error("Erreur lors de la recherche d'employés:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const selectEmployeeFromPopover = (employee: EmployeeSearchResult) => {
    setSelectedEmployeeForAdd(employee)
    setShowPopover(false)
    setIsAddingNewEmployee(true)
    setEditingEmployeeIndex(-1) // -1 pour indiquer une nouvelle ligne
    setSearchTerm("")
    setSearchResults([])
  }

  const openAddEmployeePopover = () => {
    setShowPopover(true)
    setSearchTerm("")
    setSearchResults([])
    // Charger les 4 premiers employés par défaut
    searchEmployees("")
  }

  const saveNewEmployee = async () => {
    if (!selectedEmployeeForAdd) {
      return
    }

    try {
      // Créer l'affectation
      const { error: affectationError } = await supabase.from("employee_affectations").insert({
        employee_id: selectedEmployeeForAdd.id,
        unite: unite.unite,
        responsibility: newEmployeeData.responsibility || null,
        date_responsabilite: newEmployeeData.date_responsabilite || null,
      })

      if (affectationError) {
        console.error("Erreur lors de la création de l'affectation:", affectationError)
        return
      }

      // Ajouter l'employé à la liste locale
      const newAgent: AgentData = {
        id: selectedEmployeeForAdd.id,
        prenom: selectedEmployeeForAdd.prenom,
        nom: selectedEmployeeForAdd.nom,
        matricule: selectedEmployeeForAdd.matricule,
        responsibility: newEmployeeData.responsibility || null,
        date_responsabilite: newEmployeeData.date_responsabilite || null,
        photo_url: selectedEmployeeForAdd.photo_url,
        employee_grade: selectedEmployeeForAdd.employee_grade,
        phone_1: null, // Sera mis à jour par le realtime
        sexe: selectedEmployeeForAdd.sexe,
        telex_debut: null, // Sera mis à jour par le realtime
      }

      setEmployeesList([...employeesList, newAgent])
      setIsAddingNewEmployee(false)
      setEditingEmployeeIndex(null)
      setSelectedEmployeeForAdd(null)
      setNewEmployeeData({ responsibility: "", date_responsabilite: "" })
      // Recharger les responsabilités disponibles après ajout
      fetchAvailableResponsibilities()
    } catch (error) {
      console.error("Erreur lors de l'ajout d'employé:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }

  const cancelNewEmployee = () => {
    setIsAddingNewEmployee(false)
    setEditingEmployeeIndex(null)
    setSelectedEmployeeForAdd(null)
    setNewEmployeeData({ responsibility: "", date_responsabilite: "" })
  }

  // Fonction pour gérer le chargement temporaire des photos secondaires
  const handleSecondaryPhotoUpload = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toasterRef.current?.show({
        title: isRTL ? "خطأ في الملف" : "Erreur de fichier",
        message: isRTL
          ? "يرجى اختيار ملف صورة صالح"
          : "Veuillez sélectionner un fichier image valide",
        variant: "error",
        duration: 4000,
      })
      return
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toasterRef.current?.show({
        title: isRTL ? "حجم الملف كبير جداً" : "Fichier trop volumineux",
        message: isRTL
          ? "يجب أن يكون حجم الصورة أقل من 5 ميجابايت"
          : "La taille de l'image doit être inférieure à 5 Mo",
        variant: "error",
        duration: 4000,
      })
      return
    }

    // Stocker le fichier temporairement
    setPendingSecondaryPhotos(prev => {
      const newPhotos = [...prev]
      newPhotos[index] = file
      return newPhotos
    })

    // Créer une URL de prévisualisation
    const previewUrl = URL.createObjectURL(file)
    setPendingSecondaryPhotoPreviews(prev => {
      const newPreviews = [...prev]
      // Révoquer l'ancienne URL si elle existe
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]!)
      }
      newPreviews[index] = previewUrl
      return newPreviews
    })

    // Réinitialiser l'input pour permettre de charger le même fichier à nouveau
    if (secondaryPhotoInputRefs.current[index]) {
      secondaryPhotoInputRefs.current[index]!.value = ''
    }
  }

  // Fonction pour supprimer une photo secondaire
  const handleDeleteSecondaryPhoto = async (index: number) => {
    const photo = data.photos[index]

    // Si c'est une photo en attente (pas encore sauvegardée), juste la retirer du state
    if (pendingSecondaryPhotoPreviews[index]) {
      setPendingSecondaryPhotos(prev => {
        const newPhotos = [...prev]
        newPhotos[index] = null
        return newPhotos
      })
      setPendingSecondaryPhotoPreviews(prev => {
        const newPreviews = [...prev]
        if (newPreviews[index]) {
          URL.revokeObjectURL(newPreviews[index]!)
        }
        newPreviews[index] = null
        return newPreviews
      })
      return
    }

    // Si c'est une photo existante, la supprimer de la base de données
    if (!photo) return

    try {
      // Supprimer de la table unite_photos
      const { error: deleteError } = await supabase
        .from('unite_photos')
        .delete()
        .eq('id', photo.id)

      if (deleteError) {
        console.error("Erreur lors de la suppression de la photo:", deleteError)
        toasterRef.current?.show({
          title: isRTL ? "خطأ في الحذف" : "Erreur de suppression",
          message: isRTL
            ? "حدث خطأ أثناء حذف الصورة"
            : "Une erreur s'est produite lors de la suppression de l'image",
          variant: "error",
          duration: 4000,
        })
        return
      }

      // Mettre à jour les données locales
      setData(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }))

      toasterRef.current?.show({
        title: isRTL ? "تم الحذف" : "Supprimé",
        message: isRTL
          ? "تم حذف الصورة بنجاح"
          : "L'image a été supprimée avec succès",
        variant: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const handleDialogClose = () => {
    setIsClosing(true)
    setEditingEmployeeIndex(null)
    setIsAddingNewEmployee(false)
    setSelectedEmployeeForAdd(null)
    setShowPopover(false)
    setSearchTerm("")
    setSearchResults([])
    setNewEmployeeData({ responsibility: "", date_responsabilite: "" })
    // Délai pour permettre l'animation de fermeture
    setTimeout(() => {
      setShowEmployeesDialog(false)
      setIsClosing(false)
    }, 300) // Durée de l'animation en ms
  }

  // Charger les responsabilités disponibles au montage
  useEffect(() => {
    fetchAvailableResponsibilities()
  }, [unite.unite_categorie])

  // Simple realtime setup
  useEffect(() => {
    console.log("Initialisation realtime détails unité...")

    const channel = supabase
      .channel(`unite_details_${uniteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unite" },
        (payload: RealtimePostgresChangesPayload<RawUniteData>) => {
          if (payload.new && (payload.new as RawUniteData).id === uniteId) {
            refreshData()
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unite_photos" },
        (payload: RealtimePostgresChangesPayload<UnitePhoto>) => {
          if (
            (payload.new && (payload.new as UnitePhoto).unite_id === uniteId) ||
            (payload.old && (payload.old as UnitePhoto).unite_id === uniteId)
          ) {
            refreshData()
          }
        }
      )
      .subscribe((status: string) => {
        console.log("Statut realtime détails unité:", status)
      })

    const refreshData = async () => {
      try {
        // Récupération de l'unité
        const { data: uniteData, error: uniteError } = await supabase
          .from("unite")
          .select("*")
          .eq("id", uniteId)
          .single()

        if (uniteError) {
          console.error("Erreur refresh unité:", uniteError)
          return
        }

        // Récupération des données associées en parallèle
        const [{ data: photos }, { data: agents }] = await Promise.all([
          supabase.from("unite_photos").select("*").eq("unite_id", uniteId).order("created_at", { ascending: false }),

          supabase.rpc("get_unite_agents", {
            unite_name: uniteData.unite,
          }),
        ])

        setData({
          unite: uniteData,
          photos: photos || [],
          agents: agents || [],
        })

        // Mettre à jour les champs édités si on n'est pas en mode édition
        if (!isEditPressed) {
          setEditedUnite(uniteData.unite || "")
          setEditedUniteBatiment(uniteData.unite_batiment || "")
          setEditedDescription(uniteData.unite_description || "")
          setEditedAdresse(uniteData.unite_adresse || "")
          setEditedLatitude(
            Array.isArray(uniteData.unite_gps) && uniteData.unite_gps.length > 0
              ? uniteData.unite_gps[0] || ""
              : ""
          )
          setEditedLongitude(
            Array.isArray(uniteData.unite_gps) && uniteData.unite_gps.length > 1
              ? uniteData.unite_gps[1] || ""
              : ""
          )
          setEditedIndicatif(uniteData.unite_indicatif || "")
          setEditedEmail(uniteData.unite_email || "")
        }
      } catch (error) {
        console.error("Erreur refresh détails unité:", {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    }

    return () => {
      channel.unsubscribe()
    }
  }, [uniteId])

  // Nettoyer les URLs blob lors du démontage du composant
  useEffect(() => {
    return () => {
      pendingSecondaryPhotoPreviews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview)
      })
    }
  }, [pendingSecondaryPhotoPreviews])

  return (
    <div className="py-6 px-6 bg-[#F4F5F9] dark:bg-[#26272A] min-h-screen overflow-hidden" dir={getDirection(locale)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sessionStorage.setItem("highlightUniteId", uniteId)
              router.push(isRTL ? "/ar/dashboard/unite/table" : "/fr/dashboard/unite/table")
            }}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isRTL ? <ArrowRight className="w-4 h-4 text-gray-600" /> : <ArrowLeft className="w-4 h-4 text-gray-600" />}
          </button>
          <div>
            <h1 className={`text-lg font-semibold text-gray-700 dark:text-white font-['JazeeraBold']`}>
              {isRTL ? "تفاصيـل الوحــدة" : "Détail Unité"}
            </h1>
          </div>
        </div>
      </div>

      {/* Layout principal avec photos à gauche (1/3) et informations à droite (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Photos de l'unité - 1/3 de la largeur */}
        <div className="lg:col-span-1 h-full min-w-0">
          <div className="flex flex-col h-full space-y-3">
            {/* Photo principale - Affichage de la photo sélectionnée */}
            <div className="w-full aspect-4/3 relative">
              {(() => {
                // En mode édition, priorité aux previews, sinon afficher la photo sélectionnée
                const selectedPreview = pendingSecondaryPhotoPreviews[selectedPhotoIndex]
                const selectedPhoto = data.photos[selectedPhotoIndex]

                // Chercher la première photo disponible si la sélectionnée n'existe pas
                const firstAvailablePreviewIndex = pendingSecondaryPhotoPreviews.findIndex(p => p !== null)
                const firstAvailablePhoto = data.photos[0]

                let displayPhoto: string | null = null
                let isPreview = false
                let altText = editedUnite || "Photo de l'unité"

                if (selectedPreview) {
                  displayPhoto = selectedPreview
                  isPreview = true
                } else if (selectedPhoto) {
                  displayPhoto = selectedPhoto.photo_url
                  altText = selectedPhoto.description || altText
                } else if (firstAvailablePreviewIndex !== -1) {
                  displayPhoto = pendingSecondaryPhotoPreviews[firstAvailablePreviewIndex]
                  isPreview = true
                } else if (firstAvailablePhoto) {
                  displayPhoto = firstAvailablePhoto.photo_url
                  altText = firstAvailablePhoto.description || altText
                }

                return displayPhoto ? (
                  <div className="absolute inset-0 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-700">
                    <Image
                      src={displayPhoto}
                      alt={altText}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      style={{ objectFit: "contain" }}
                      unoptimized={isPreview}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                        {isRTL ? "لا توجد صورة" : "Aucune image"}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Petites photos en ligne */}
            <div className="flex gap-2 shrink-0">
              {[...Array(4)].map((_, index) => {
                const photo = data.photos[index] // Photos indexées de 0 à 3
                const pendingPreview = pendingSecondaryPhotoPreviews[index]
                const hasPhoto = pendingPreview || photo
                const isSelected = selectedPhotoIndex === index
                return (
                  <div
                    key={index}
                    className={`w-25 h-25 border-2 rounded bg-gray-50 dark:bg-gray-700 relative overflow-hidden transition-all ${
                      isSelected && hasPhoto
                        ? "border-[#076784] border-solid"
                        : "border-dashed border-gray-300 dark:border-gray-600"
                    } ${!isEditPressed && hasPhoto ? "cursor-pointer hover:border-[#076784]/50" : ""}`}
                    onClick={() => {
                      // En mode non-édition, cliquer sur une photo la sélectionne pour l'affichage principal
                      if (!isEditPressed && hasPhoto) {
                        setSelectedPhotoIndex(index)
                      }
                    }}
                  >
                    {/* Input file caché pour cette photo secondaire */}
                    <input
                      ref={(el) => { secondaryPhotoInputRefs.current[index] = el }}
                      type="file"
                      accept="image/*"
                      onChange={handleSecondaryPhotoUpload(index)}
                      className="hidden"
                    />

                    {hasPhoto ? (
                      <>
                        <Image
                          src={pendingPreview || photo!.photo_url}
                          alt={photo?.description || editedUnite || `Photo ${index + 1}`}
                          fill
                          sizes="100px"
                          style={{ objectFit: "contain" }}
                          unoptimized={!!pendingPreview}
                        />
                        {isEditPressed && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                secondaryPhotoInputRefs.current[index]?.click()
                              }}
                              disabled={isUploadingPhoto}
                              className="p-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isRTL ? "تغيير الصورة" : "Changer l'image"}
                            >
                              <Camera className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteSecondaryPhoto(index)
                              }}
                              disabled={isUploadingPhoto}
                              className="p-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isRTL ? "حذف الصورة" : "Supprimer l'image"}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {pendingPreview && (
                          <div className="absolute top-0.5 right-0.5 bg-yellow-500 text-white px-1 py-0.5 rounded text-[8px] font-medium font-noto-naskh-arabic">
                            {isRTL ? "انتظار" : "Att."}
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center transition-colors ${
                          isEditPressed && !isUploadingPhoto
                            ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            : "cursor-not-allowed"
                        }`}
                        onClick={() => isEditPressed && !isUploadingPhoto && secondaryPhotoInputRefs.current[index]?.click()}
                      >
                        <Plus className={`w-4 h-4 ${isEditPressed ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"}`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Informations - 2/3 de la largeur */}
        <div className="lg:col-span-2 min-w-0">
          <div className="space-y-6">
            {/* Titre et évaluation */}
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm text-blue-600 dark:text-blue-400 mb-2 font-noto-naskh-arabic`}>{unite.unite_type}</p>
                <h1 className={`text-2xl font-bold text-[#076784] dark:text-[#4FC3F7] mb-1 font-noto-naskh-arabic flex items-baseline gap-2`}>
                  <span>
                    {editedUnite || "غير محدد"}
                  </span>
                  <span className={`text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic`}>({unite.niveau_1})</span>
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {"★★★★☆".split("").map((star, i) => (
                      <span key={i} className="text-lg">
                        {star}
                      </span>
                    ))}
                  </div>
                  <span className={`text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic`}>
                    (125 {isRTL ? "تقييمات الأفراد" : "Évaluations Personnel"})
                  </span>
                </div>
              </div>
              <Button className={`rounded bg-[#D7E4E7] text-[#076784] border-0 hover:bg-[#ACCBD3] px-4 py-2 text-sm font-normal cursor-pointer font-noto-naskh-arabic`}>
                {isRTL ? "طبـاعــة" : "Modification"}
              </Button>
            </div>

            {/* Cartes d'informations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className={`text-sm font-medium text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                    {isRTL ? "عــدد الأفــراد" : "Personnel"}:
                  </span>
                </div>
                <p className="text-lg font-medium dark:text-gray-300">
                  {data.agents.length < 100
                    ? String(data.agents.length).padStart(2, "0")
                    : String(data.agents.length).padStart(3, "0")}{" "}
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Plane className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className={`text-sm font-medium text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                    {isRTL ? "في إجازة" : "En congés"}:
                  </span>
                </div>
                <p className={`text-lg font-medium dark:text-gray-300 font-noto-naskh-arabic`}>{isRTL ? "1 إجازة" : "1 congés"}</p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`text-sm font-medium text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                    {isRTL ? "الفـئــــة" : "Classe"}:
                  </span>
                </div>
                <p className={`text-lg font-medium dark:text-gray-300 font-noto-naskh-arabic`}>{isRTL ? "غير محدد" : "Non défini"}</p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    {unite.navigante ? (
                      <Anchor className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Mountain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <span className={`text-sm font-medium text-gray-600 dark:text-gray-400 font-noto-naskh-arabic`}>
                    {isRTL ? "النوع" : "Type"}:
                  </span>
                </div>
                <p className={`text-md font-medium text-[#198754] dark:text-[#20c997] font-noto-naskh-arabic`}>
                  {unite.navigante ? (isRTL ? "بحرية" : "Navigante") : isRTL ? "وحـدة قــارة" : "Terrestre"}
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <Toggle
                pressed={isEditPressed}
                onPressedChange={async (pressed) => {
                  if (isEditPressed && !pressed) {
                    // Sauvegarder les modifications
                    try {
                      // Fonction pour vérifier si une valeur GPS est valide (pas vide, pas zéro uniquement)
                      const isValidGPSValue = (value: string): boolean => {
                        const trimmed = value.trim()
                        if (!trimmed || trimmed === "" || trimmed === "غير محدد" || trimmed === "Non défini" || trimmed === "0.0000") {
                          return false
                        }
                        // Vérifier si c'est uniquement des zéros (avec ou sans point)
                        const numValue = parseFloat(trimmed)
                        return !isNaN(numValue) && numValue !== 0
                      }

                      // Convertir GPS en tableau avec latitude et longitude
                      const gpsArray: string[] = []
                      if (isValidGPSValue(editedLatitude)) {
                        gpsArray.push(editedLatitude.trim())
                      }
                      if (isValidGPSValue(editedLongitude)) {
                        gpsArray.push(editedLongitude.trim())
                      }

                      // Nettoyer les numéros de téléphone : convertir "00 000 000" en null
                      const cleanPhoneNumber = (phone: string): string | null => {
                        const cleaned = phone.trim().replace(/\s/g, '')
                        if (!cleaned || cleaned === '00000000' || phone.trim() === '00 000 000') {
                          return null
                        }
                        return phone.trim()
                      }

                      // Fonction pour nettoyer les champs texte et éviter d'enregistrer "غير محدد"
                      const cleanTextField = (value: string): string | null => {
                        const trimmed = value.trim()
                        // Ne pas enregistrer "غير محدد" ou "Non défini" dans la base de données
                        if (trimmed === "غير محدد" || trimmed === "Non défini" || trimmed === "") {
                          return null
                        }
                        return trimmed
                      }

                      const { error } = await supabase
                        .from("unite")
                        .update({
                          unite: editedUnite,
                          unite_batiment: cleanTextField(editedUniteBatiment),
                          unite_description: editedDescription,
                          unite_adresse: cleanTextField(editedAdresse),
                          unite_gps: gpsArray.length > 0 ? gpsArray : null,
                          unite_indicatif: cleanTextField(editedIndicatif),
                          unite_email: cleanTextField(editedEmail),
                          unite_telephone1: cleanPhoneNumber(editedTelephone1),
                          unite_telephone2: cleanPhoneNumber(editedTelephone2),
                          unite_telephone3: cleanPhoneNumber(editedTelephone3),
                          unite_categorie: cleanTextField(editedUniteCategorie),
                          unite_port: cleanTextField(editedUnitePort),
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", uniteId)

                      if (error) {
                        console.error("Erreur lors de la mise à jour:", error)
                        toasterRef.current?.show({
                          title: isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
                          message: isRTL
                            ? "خطأ أثناء حفظ بيانات الوحدة"
                            : "Erreur lors de la sauvegarde des données de l'unité",
                          variant: "error",
                          duration: 4000,
                        })
                        return
                      }

                      // Upload des photos secondaires si des photos sont en attente
                      const hasSecondaryPhotos = pendingSecondaryPhotos.some(photo => photo !== null)
                      if (hasSecondaryPhotos) {
                        setIsUploadingPhoto(true)
                        try {
                          for (let i = 0; i < pendingSecondaryPhotos.length; i++) {
                            const secondaryPhoto = pendingSecondaryPhotos[i]
                            if (!secondaryPhoto) continue

                            // Upload de l'image vers Supabase Storage
                            const fileExt = secondaryPhoto.name.split('.').pop()
                            const fileName = `${uniteId}_secondary_${i + 1}_${Date.now()}.${fileExt}`
                            const filePath = `unite-photos/${fileName}`

                            const { error: uploadError } = await supabase.storage
                              .from('photo-unite')
                              .upload(filePath, secondaryPhoto)

                            if (uploadError) {
                              console.error(`Erreur lors de l'upload de la photo secondaire ${i + 1}:`, uploadError)
                              continue
                            }

                            // Obtenir l'URL publique
                            const { data: { publicUrl } } = supabase.storage
                              .from('photo-unite')
                              .getPublicUrl(filePath)

                            // La photo secondaire correspond à data.photos[index]
                            const existingPhoto = data.photos[i]
                            if (existingPhoto) {
                              // Mettre à jour la photo existante
                              const { error: updatePhotoError } = await supabase
                                .from('unite_photos')
                                .update({
                                  photo_url: publicUrl,
                                  updated_at: new Date().toISOString(),
                                })
                                .eq('id', existingPhoto.id)

                              if (updatePhotoError) {
                                console.error(`Erreur lors de la mise à jour de la photo secondaire ${i + 1}:`, updatePhotoError)
                              }
                            } else {
                              // Créer une nouvelle entrée pour la photo secondaire
                              const { error: insertPhotoError } = await supabase
                                .from('unite_photos')
                                .insert({
                                  unite_id: uniteId,
                                  photo_url: publicUrl,
                                  description: editedUnite || unite.unite,
                                })

                              if (insertPhotoError) {
                                console.error(`Erreur lors de l'insertion de la photo secondaire ${i + 1}:`, insertPhotoError)
                              }
                            }
                          }
                        } catch (photoError) {
                          console.error("Erreur lors du traitement des photos secondaires:", photoError)
                        } finally {
                          setIsUploadingPhoto(false)
                          // Nettoyer les états des photos secondaires
                          setPendingSecondaryPhotos([null, null, null, null])
                          // Libérer les URLs blob
                          pendingSecondaryPhotoPreviews.forEach(preview => {
                            if (preview) URL.revokeObjectURL(preview)
                          })
                          setPendingSecondaryPhotoPreviews([null, null, null, null])
                        }
                      }

                      // Mettre à jour les données locales
                      setData({
                        ...data,
                        unite: {
                          ...data.unite,
                          unite: editedUnite,
                          unite_batiment: cleanTextField(editedUniteBatiment),
                          unite_description: editedDescription,
                          unite_adresse: cleanTextField(editedAdresse),
                          unite_gps: gpsArray.length > 0 ? gpsArray : null,
                          unite_indicatif: cleanTextField(editedIndicatif),
                          unite_email: cleanTextField(editedEmail),
                          unite_telephone1: cleanPhoneNumber(editedTelephone1),
                          unite_telephone2: cleanPhoneNumber(editedTelephone2),
                          unite_telephone3: cleanPhoneNumber(editedTelephone3),
                          unite_categorie: cleanTextField(editedUniteCategorie) as RawUniteData["unite_categorie"],
                          unite_port: cleanTextField(editedUnitePort),
                        },
                      })

                      // Mettre à jour les états locaux avec les valeurs nettoyées
                      setEditedUniteBatiment(cleanTextField(editedUniteBatiment) || "")
                      setEditedAdresse(cleanTextField(editedAdresse) || "")
                      setEditedLatitude(gpsArray.length > 0 ? gpsArray[0] : "")
                      setEditedLongitude(gpsArray.length > 1 ? gpsArray[1] : "")
                      setEditedIndicatif(cleanTextField(editedIndicatif) || "")
                      setEditedEmail(cleanTextField(editedEmail) || "")
                      setEditedUniteCategorie(cleanTextField(editedUniteCategorie) || "")
                      setEditedUnitePort(cleanTextField(editedUnitePort) || "")
                      setEditedTelephone1(cleanPhoneNumber(editedTelephone1) || "")
                      setEditedTelephone2(cleanPhoneNumber(editedTelephone2) || "")
                      setEditedTelephone3(cleanPhoneNumber(editedTelephone3) || "")

                      // Afficher le toast de succès
                      toasterRef.current?.show({
                        title: isRTL ? "تم حفظ البيانات" : "Données sauvegardées",
                        message: isRTL
                          ? "تم تحديث معلومات الوحدة بنجاح"
                          : "Les informations de l'unité ont été mises à jour avec succès",
                        variant: "success",
                        duration: 4000,
                      })
                    } catch (error) {
                      console.error("Erreur lors de la sauvegarde:", error)
                      toasterRef.current?.show({
                        title: isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
                        message: isRTL
                          ? "خطأ أثناء حفظ بيانات الوحدة"
                          : "Erreur lors de la sauvegarde des données de l'unité",
                        variant: "error",
                        duration: 4000,
                      })
                    }
                  }
                  setIsEditPressed(pressed)
                }}
                variant="outline"
                className="border-[#076784] rounded text-[#076784] bg-transparent hover:bg-[#DCE7E9] hover:text-[#076784] data-[state=on]:bg-[#076784] data-[state=on]:hover:bg-[#247C95] data-[state=on]:text-white data-[state=on]:border-[#076784] px-7 py-2 text-[15px] font-normal cursor-pointer font-noto-naskh-arabic"
              >
                {isEditPressed ? "حــفـــظ" : "تعــديـل"}
              </Toggle>
              {isEditPressed && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Annuler les modifications et restaurer les valeurs d'origine
                    setEditedUniteBatiment(data.unite.unite_batiment || "")
                    setEditedDescription(data.unite.unite_description || "")
                    setEditedAdresse(data.unite.unite_adresse || "")
                    setEditedLatitude(
                      Array.isArray(data.unite.unite_gps) && data.unite.unite_gps.length > 0
                        ? data.unite.unite_gps[0] || ""
                        : ""
                    )
                    setEditedLongitude(
                      Array.isArray(data.unite.unite_gps) && data.unite.unite_gps.length > 1
                        ? data.unite.unite_gps[1] || ""
                        : ""
                    )
                    setEditedIndicatif(data.unite.unite_indicatif || "")
                    setEditedEmail(data.unite.unite_email || "")
                    setEditedTelephone1(data.unite.unite_telephone1 || "")
                    setEditedTelephone2(data.unite.unite_telephone2 || "")
                    setEditedTelephone3(data.unite.unite_telephone3 || "")
                    setEditedUniteCategorie(data.unite.unite_categorie || "")
                    setEditedUnitePort(data.unite.unite_port || "")
                    // Annuler les photos secondaires en attente
                    setPendingSecondaryPhotos([null, null, null, null])
                    pendingSecondaryPhotoPreviews.forEach(preview => {
                      if (preview) URL.revokeObjectURL(preview)
                    })
                    setPendingSecondaryPhotoPreviews([null, null, null, null])
                    setIsEditPressed(false)
                  }}
                  className="border-[#076784] rounded text-[#076784] bg-transparent hover:bg-[#DCE7E9] hover:text-[#076784] px-7 py-2 text-[13px] font-medium font-noto-naskh-arabic cursor-pointer"
                >
                  إلـغــــاء
                </Button>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 font-noto-naskh-arabic`}>
                {isRTL ? "الــوصــف :" : "Description :"}
              </h3>
              <p
                contentEditable={isEditPressed}
                suppressContentEditableWarning
                onBlur={(e) => setEditedDescription(e.currentTarget.textContent || "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                className={`text-gray-600 dark:text-gray-300 text-md leading-relaxed font-noto-naskh-arabic px-2 py-1 rounded border min-h-9 ${
                  isEditPressed
                    ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                    : "border-transparent"
                }`}
              >
                {editedDescription}
              </p>
            </div>

            {/* Caractéristiques et Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-1">
              <div>
                <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-3 font-noto-naskh-arabic`}>
                  {isRTL ? "اللــوجســتيــة :" : "Logistique :"}
                </h3>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {unite.navigante ? (
                      <>
                        <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                          {isRTL ? "وحـدة بحـريــة مـن فــئــة :" : "Unité Navigante de type:"}
                        </span>{" "}
                        <span
                          key={`unite-categorie-${isEditPressed}`}
                          contentEditable={isEditPressed}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            // Sélectionner tout le texte au focus
                            const range = document.createRange()
                            const sel = window.getSelection()
                            range.selectNodeContents(e.currentTarget)
                            sel?.removeAllRanges()
                            sel?.addRange(range)
                          }}
                          onBlur={(e) => setEditedUniteCategorie(e.currentTarget.textContent || "")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                            isEditPressed
                              ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                              : "border-transparent"
                          }`}
                        >
                          {editedUniteCategorie || "غير محدد"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                          {isRTL ? "البنــــــــايـــــــــــــــــــــــة : " : "Batiment: "}
                        </span>
                        <span
                          key={`unite-batiment-${isEditPressed}`}
                          contentEditable={isEditPressed}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            // Sélectionner tout le texte au focus
                            const range = document.createRange()
                            const sel = window.getSelection()
                            range.selectNodeContents(e.currentTarget)
                            sel?.removeAllRanges()
                            sel?.addRange(range)
                          }}
                          onBlur={(e) => setEditedUniteBatiment(e.currentTarget.textContent || "")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                            isEditPressed
                              ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                              : "border-transparent"
                          }`}
                        >
                          {editedUniteBatiment || "غير محدد"}
                        </span>
                      </>
                    )}
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {unite.navigante ? (
                      <>
                        <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                          {isRTL ? "مــيــنـــــاء الإرســــــــــاء :" : "Port d'attache:"}
                        </span>{" "}
                        <span
                          key={`unite-port-${isEditPressed}`}
                          contentEditable={isEditPressed}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            // Sélectionner tout le texte au focus
                            const range = document.createRange()
                            const sel = window.getSelection()
                            range.selectNodeContents(e.currentTarget)
                            sel?.removeAllRanges()
                            sel?.addRange(range)
                          }}
                          onBlur={(e) => setEditedUnitePort(e.currentTarget.textContent || "")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                            isEditPressed
                              ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                              : "border-transparent"
                          }`}
                        >
                          {editedUnitePort || "غير محدد"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                          {isRTL ? "العـــنــــــــــــــــــــــــــوان :" : "Adresse:"}
                        </span>{" "}
                        <span
                          key={`adresse-${isEditPressed}`}
                          contentEditable={isEditPressed}
                          suppressContentEditableWarning
                          onFocus={(e) => {
                            // Sélectionner tout le texte au focus
                            const range = document.createRange()
                            const sel = window.getSelection()
                            range.selectNodeContents(e.currentTarget)
                            sel?.removeAllRanges()
                            sel?.addRange(range)
                          }}
                          onBlur={(e) => setEditedAdresse(e.currentTarget.textContent || "")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                          }}
                          className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                            isEditPressed
                              ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                              : "border-transparent"
                          }`}
                        >
                          {editedAdresse || "غير محدد"}
                        </span>
                      </>
                    )}
                  </li>
                  <li className="flex items-center gap-2 text-sm min-w-0 overflow-hidden">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0"></span>
                    <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic shrink-0`}>
                      {isRTL ? "إحــداثــيــــــــــات GPS :" : "Coordonnées GPS:"}
                    </span>{" "}
                    <span
                      key={`latitude-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onInput={(e) => {
                        const text = e.currentTarget.textContent || ""
                        // Permettre uniquement les chiffres, le point, le signe moins et les espaces
                        const cleaned = text.replace(/[^\d.\-\s]/g, "")
                        if (text !== cleaned) {
                          e.currentTarget.textContent = cleaned
                          const range = document.createRange()
                          const sel = window.getSelection()
                          range.selectNodeContents(e.currentTarget)
                          range.collapse(false)
                          sel?.removeAllRanges()
                          sel?.addRange(range)
                        }
                      }}
                      onBlur={(e) => {
                        const content = e.currentTarget.textContent || ""
                        setEditedLatitude(content.trim())
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed px-2 py-1 rounded border truncate ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                      dir="ltr"
                      style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                    >
                      {editedLatitude || "0.0000"}
                    </span>
                    <span className="text-gray-400 shrink-0">/</span>
                    <span
                      key={`longitude-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onInput={(e) => {
                        const text = e.currentTarget.textContent || ""
                        // Permettre uniquement les chiffres, le point, le signe moins et les espaces
                        const cleaned = text.replace(/[^\d.\-\s]/g, "")
                        if (text !== cleaned) {
                          e.currentTarget.textContent = cleaned
                          const range = document.createRange()
                          const sel = window.getSelection()
                          range.selectNodeContents(e.currentTarget)
                          range.collapse(false)
                          sel?.removeAllRanges()
                          sel?.addRange(range)
                        }
                      }}
                      onBlur={(e) => {
                        const content = e.currentTarget.textContent || ""
                        setEditedLongitude(content.trim())
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed px-2 py-1 rounded border truncate ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                      dir="ltr"
                      style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                    >
                      {editedLongitude || "0.0000"}
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-3 font-noto-naskh-arabic`}>
                  {isRTL ? "الاتـصــالات :" : "Télécommunications :"}
                </h3>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                      {isRTL ? "أرقــم الهــواتــف :" : "Téléphone:"}
                    </span>{" "}
                    <span
                      key={`telephone1-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onInput={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        if (text !== numbersOnly) {
                          e.currentTarget.textContent = numbersOnly
                          const range = document.createRange()
                          const sel = window.getSelection()
                          range.selectNodeContents(e.currentTarget)
                          range.collapse(false)
                          sel?.removeAllRanges()
                          sel?.addRange(range)
                        }
                      }}
                      onBlur={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        setEditedTelephone1(numbersOnly)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                      dir="ltr"
                      style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                    >
                      {isEditPressed ? (editedTelephone1 && editedTelephone1.trim() !== "" ? editedTelephone1 : "00 000 000") : (editedTelephone1 && editedTelephone1 !== "غير محدد" && editedTelephone1.trim() !== "" ? formatPhoneNumber(editedTelephone1, isRTL) : "00 000 000")}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span
                      key={`telephone2-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onInput={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        if (text !== numbersOnly) {
                          e.currentTarget.textContent = numbersOnly
                          const range = document.createRange()
                          const sel = window.getSelection()
                          range.selectNodeContents(e.currentTarget)
                          range.collapse(false)
                          sel?.removeAllRanges()
                          sel?.addRange(range)
                        }
                      }}
                      onBlur={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        setEditedTelephone2(numbersOnly)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                      dir="ltr"
                      style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                    >
                      {isEditPressed ? (editedTelephone2 && editedTelephone2.trim() !== "" ? editedTelephone2 : "00 000 000") : (editedTelephone2 && editedTelephone2 !== "غير محدد" && editedTelephone2.trim() !== "" ? formatPhoneNumber(editedTelephone2, isRTL) : "00 000 000")}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span
                      key={`telephone3-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onInput={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        if (text !== numbersOnly) {
                          e.currentTarget.textContent = numbersOnly
                          const range = document.createRange()
                          const sel = window.getSelection()
                          range.selectNodeContents(e.currentTarget)
                          range.collapse(false)
                          sel?.removeAllRanges()
                          sel?.addRange(range)
                        }
                      }}
                      onBlur={(e) => {
                        const text = e.currentTarget.textContent || ""
                        const numbersOnly = text.replace(/\D/g, "").slice(0, 8)
                        setEditedTelephone3(numbersOnly)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                      dir="ltr"
                      style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                    >
                      {isEditPressed ? (editedTelephone3 && editedTelephone3.trim() !== "" ? editedTelephone3 : "00 000 000") : (editedTelephone3 && editedTelephone3 !== "غير محدد" && editedTelephone3.trim() !== "" ? formatPhoneNumber(editedTelephone3, isRTL) : "00 000 000")}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                      {isRTL ? "رمـــــز الــنــــــــــــــــداء :" : "Indicatif d'appel:"}
                    </span>{" "}
                    <span
                      key={`indicatif-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onBlur={(e) => setEditedIndicatif(e.currentTarget.textContent || "")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                    >
                      {editedIndicatif || "غير محدد"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span className={`text-sm font-bold text-gray-600 dark:text-gray-300 font-noto-naskh-arabic`}>
                      {isRTL ? "عنـــــوان التـــراســـــــل :" : "Code Email:"}
                    </span>{" "}
                    <span
                      key={`email-${isEditPressed}`}
                      contentEditable={isEditPressed}
                      suppressContentEditableWarning
                      onFocus={(e) => {
                        // Sélectionner tout le texte au focus
                        const range = document.createRange()
                        const sel = window.getSelection()
                        range.selectNodeContents(e.currentTarget)
                        sel?.removeAllRanges()
                        sel?.addRange(range)
                      }}
                      onBlur={(e) => setEditedEmail(e.currentTarget.textContent || "")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      className={`text-gray-600 dark:text-gray-400 text-[15px] font-noto-naskh-arabic leading-relaxed px-2 py-1 rounded border whitespace-nowrap overflow-hidden ${
                        isEditPressed
                          ? "outline-none cursor-text border-dashed border-gray-300 dark:border-gray-600"
                          : "border-transparent"
                      }`}
                    >
                      {editedEmail || "غير محدد"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Spécifications */}
            <div className="pt-2">
              <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-4 font-noto-naskh-arabic pt-3`}>
                {isRTL ? "المعلومـات التفصيلية" : "Spécifications Détaillées"} :
              </h3>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-600 mb-4">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActiveTab("agents")}
                    className={`pb-2 font-medium text-sm ${
                      activeTab === "agents"
                        ? "border-b-2 border-[#076784] text-[#076784]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                    } font-noto-naskh-arabic`}
                  >
                    {isRTL ? "قـائمـة الأعـــوان" : "Liste des agents"}
                  </button>
                  <button
                    onClick={() => setActiveTab("organigramme")}
                    className={`pb-2 font-medium text-sm ${
                      activeTab === "organigramme"
                        ? "border-b-2 border-[#076784] text-[#076784]"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                    } font-noto-naskh-arabic`}
                  >
                    {isRTL ? "الهيكل التنظيمي" : "Organigramme"}
                  </button>
                </div>
              </div>

              {/* Contenu des tabs */}
              {activeTab === "agents" && (
                <div className="bg-white dark:bg-[#26272A] rounded-none shadow-sm border border-gray-100 dark:border-gray-600 rounded-t-md">
                  <div className="px-6 py-4 flex items-center justify-between mb-1">
                    <h2 className={`text-base font-semibold text-gray-700 dark:text-gray-300 font-noto-naskh-arabic`}>
                      {isRTL ? "قـائمـة الأعـــوان" : "Liste des agents"}
                    </h2>
                    <button
                      onClick={() => {
                        setEmployeesList(data.agents)
                        setShowEmployeesDialog(true)
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer hover:bg-[#D9E7EB] active:bg-[#C8D7E0] rounded-none font-noto-naskh-arabic`}
                      style={{ color: "#197791" }}
                    >
                      {isRTL ? "عرض الكل" : "View All"}
                    </button>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-border">
                          <tr>
                            <th
                              className={`px-6 py-4 text-start w-70 ${
                                isRTL ? "text-sm" : "text-xs"
                              } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                            >
                              {isRTL ? "الأعــــوان" : "Agents"}
                            </th>
                            <th
                              className={`px-6 py-4 text-start ${
                                isRTL ? "text-sm" : "text-xs"
                              } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                            >
                              {isRTL ? "الــرقــــم" : "Matricule"}
                            </th>
                            <th
                              className={`px-6 py-4 text-start ${
                                isRTL ? "text-sm" : "text-xs"
                              } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                            >
                              {isRTL ? "المســــؤوليــــــة" : "Responsabilité"}
                            </th>
                            <th
                              className={`px-6 py-4 text-start ${
                                isRTL ? "text-sm" : "text-xs"
                              } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                            >
                              {isRTL ? "تاريخ التعييــن" : "Date Affectation"}
                            </th>
                            <th
                              className={`px-6 py-4 text-start ${
                                isRTL ? "text-sm" : "text-xs"
                              } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                            >
                              {isRTL ? "الهاتــــف" : "Téléphone"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                          {data.agents.length > 0 ? (
                            data.agents.slice(0, 3).map((agent) => (
                              <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-muted">
                                      <Image
                                        className="object-cover "
                                        src={processAgentDisplayImage(agent)}
                                        alt={`${agent.prenom} ${agent.nom}`}
                                        fill
                                        sizes="40px"
                                        onError={(e) => {
                                          ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className={`${
                                          isRTL ? "text-md" : "text-md"
                                        } font-medium text-foreground truncate font-noto-naskh-arabic`}
                                        title={`${agent.prenom} ${agent.nom}`}
                                      >
                                        {agent.prenom} {agent.nom}
                                      </div>
                                      <div
                                        className={`text-sm text-muted-foreground truncate dark:text-gray-400 font-noto-naskh-arabic`}
                                        title={
                                          getGradeLabel(agent.employee_grade ?? undefined) ||
                                          (agent.employee_grade ?? "")
                                        }
                                      >
                                        {getGradeLabel(agent.employee_grade ?? undefined) ||
                                          (agent.employee_grade ?? "")}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <span
                                    className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                                    title={agent.matricule || "-"}
                                  >
                                    {agent.matricule}
                                  </span>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <span
                                    className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                                    title={agent.responsibility || (isRTL ? "غير محدد" : "N/A")}
                                  >
                                    {agent.responsibility || (isRTL ? "غير محدد" : "N/A")}
                                  </span>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <span
                                    className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                                    title={
                                      agent.date_responsabilite
                                        ? isRTL
                                          ? formatDateForRTL(agent.date_responsabilite)
                                          : formatDateForLTR(agent.date_responsabilite)
                                        : (isRTL ? "غير محدد" : "N/A")
                                    }
                                  >
                                    {agent.date_responsabilite
                                      ? isRTL
                                        ? formatDateForRTL(agent.date_responsabilite)
                                        : formatDateForLTR(agent.date_responsabilite)
                                      : (isRTL ? "غير محدد" : "N/A")}
                                  </span>
                                </td>
                                <td className="px-6 py-2.5 whitespace-nowrap">
                                  <span
                                    className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                                    dir="ltr"
                                    style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                                    title={
                                      agent.phone_1 ? formatPhoneNumber(agent.phone_1, isRTL) : (isRTL ? "غير محدد" : "N/A")
                                    }
                                  >
                                    {agent.phone_1 ? formatPhoneNumber(agent.phone_1, isRTL) : (isRTL ? "غير محدد" : "N/A")}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className={`px-6 py-8 text-center text-muted-foreground dark:text-gray-400 font-noto-naskh-arabic`}
                              >
                                {isRTL ? "لم يتم العثور على أعوان لهذه الوحدة" : "Aucun agent trouvé pour cette unité"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "organigramme" && (
                <Card className="bg-white dark:bg-[#26272A] border border-gray-200 dark:border-gray-600 rounded-sm">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Niveau 1 - Direction */}
                      <div className="text-center">
                        <div className="inline-block bg-[#076784] dark:bg-[#4FC3F7] text-white dark:text-black px-6 py-3 rounded-lg shadow-md">
                          <div className="text-sm font-semibold">NIVEAU 1</div>
                          <div className="text-lg font-bold">{unite.niveau_1}</div>
                          <div className="text-xs opacity-90">Direction</div>
                        </div>
                      </div>

                      {/* Ligne de connexion */}
                      <div className="flex justify-center">
                        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                      </div>

                      {/* Niveau 2 - Départements */}
                      <div className="flex justify-center">
                        <div className="flex gap-8">
                          <div className="text-center">
                            <div className="bg-[#D7E4E7] dark:bg-[#2D3748] text-[#076784] dark:text-[#4FC3F7] px-4 py-3 rounded-lg shadow-sm">
                              <div className="text-xs font-semibold">NIVEAU 2</div>
                              <div className="text-sm font-bold">{unite.niveau_2 || "Département A"}</div>
                              <div className="text-xs opacity-75">Chef de Département</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="bg-[#D7E4E7] dark:bg-[#2D3748] text-[#076784] dark:text-[#4FC3F7] px-4 py-3 rounded-lg shadow-sm">
                              <div className="text-xs font-semibold">NIVEAU 2</div>
                              <div className="text-sm font-bold">Département B</div>
                              <div className="text-xs opacity-75">Chef de Département</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lignes de connexion */}
                      <div className="flex justify-center">
                        <div className="flex gap-8">
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                      </div>

                      {/* Niveau 3 - Équipes */}
                      <div className="grid grid-cols-4 gap-4">
                        {data.agents.slice(0, 4).map((agent) => (
                          <div key={agent.id} className="text-center">
                            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded shadow-sm">
                              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">AGENT</div>
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                {agent.prenom} {agent.nom}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{agent.employee_grade}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour Gestion des Employés */}
      <Dialog
        isOpen={showEmployeesDialog}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "إدارة المــوظــفيــن المــعيــنيــن" : "Gestion des Employés Affectés"}
        icon={Users}
        maxWidth="max-w-6xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-md font-medium text-gray-900 dark:text-gray-100 font-noto-naskh-arabic`}>
              {isRTL ? "قائــمــة المــوظــفيــن" : "Liste des Employés"}
            </h3>
            <Popover open={showPopover} onOpenChange={setShowPopover}>
              <PopoverTrigger asChild>
                <button
                  onClick={openAddEmployeePopover}
                  className="p-1 text-[#076784] hover:text-[#065a72] transition-colors cursor-pointer"
                  title={isRTL ? "إضافة عون" : "Ajouter un agent"}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>min-w-(--radix-popper-anchor-width)
              <PopoverContent
                className="border-input w-full min-w-(--radix-popper-anchor-width) p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder={isRTL ? "البحث بالرقم التسلسلي..." : "Rechercher matricule..."}
                    value={searchTerm}
                    onValueChange={(value) => {
                      const filteredValue = value.replace(/\D/g, "").slice(0, 5)
                      setSearchTerm(filteredValue)
                      searchEmployees(filteredValue)
                    }}
                  />
                  <CommandList>
                    {isSearching && searchResults.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          {isSearching ? (
                            <div className="flex items-center justify-center py-4">
                              <LoadingSpinner size="sm" text={isRTL ? "جاري التحميل..." : "Recherche en cours..."} />
                            </div>
                          ) : (
                            isRTL ? "لم يتم العثور على موظفين" : "Aucun employé trouvé"
                          )}
                        </CommandEmpty>
                        {searchResults.length > 0 && (
                          <CommandGroup heading={searchTerm ? isRTL ? "البحث عن موظف..." : "Rechercher un employé..." : isRTL ? "البحث عن موظف..." : "Rechercher un employé..."}>
                            {searchResults.map((result) => (
                              <CommandItem
                                key={result.id}
                                value={`${result.matricule} ${result.prenom} ${result.nom}`}
                                onSelect={() => selectEmployeeFromPopover(result)}
                                className="flex items-center space-x-3 px-3 py-2"
                              >
                                <div className="shrink-0 h-8 w-8 relative rounded-full overflow-hidden bg-gray-200">
                                  <Image
                                    className="object-cover"
                                    src={processEmployeeSearchImage(result)}
                                    alt={`${result.prenom} ${result.nom}`}
                                    fill
                                    sizes="32px"
                                    onError={(e) => {
                                      ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{result.matricule}</div>
                                  <div className="text-gray-500 text-xs truncate">
                                    {result.prenom} {result.nom}
                                  </div>
                                  <div className="text-gray-400 text-xs">{result.employee_grade}</div>
                                </div>
                                {selectedEmployeeForAdd?.id === result.id && (
                                  <CheckIcon size={16} className="ml-auto text-[#076784]" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="overflow-x-auto max-h-96 mb-1">
            <table className="w-full text-sm min-w-250 table-fixed dark:text-gray-300">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-border">
                <tr>
                  <th
                    className={`px-6 py-4 text-start ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "240px" }}
                  >
                    {isRTL ? "هــويــــة المــوظــــف" : "Identité"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "140px" }}
                  >
                    {isRTL ? "الــرقــــم" : "Matricule"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "200px" }}
                  >
                    {isRTL ? "المســــؤوليــــــة" : "Responsabilité"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "180px" }}
                  >
                    {isRTL ? "تاريخ المسؤولية" : "Date de responsabilité"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "180px" }}
                  >
                    {isRTL ? "الهاتــــف" : "Téléphone"}
                  </th>
                  <th
                    className={`px-6 py-4 text-center ${
                      isRTL ? "text-sm" : "text-xs"
                    } font-semibold uppercase tracking-wider text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    style={{ width: "120px" }}
                  >
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {employeesList.length === 0 && !isAddingNewEmployee ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <User className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <span>{isRTL ? "لا يوجد موظف مخصص لهذه الوحدة" : "Aucun employé affecté à cette unité"}</span>
                        <button
                          onClick={openAddEmployeePopover}
                          className="mt-2 text-[#076784] hover:text-[#065a72] text-sm underline cursor-pointer"
                        >
                          {isRTL ? "إضافة عون" : "Ajouter un agent"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {employeesList.map((employee, index) => (
                      <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-[#363C44]">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-muted">
                              <Image
                                className="object-cover"
                                src={processAgentDisplayImage(employee)}
                                alt={`${employee.prenom} ${employee.nom}`}
                                fill
                                sizes="40px"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`${
                                  isRTL ? "text-md" : "text-md"
                                } font-medium text-foreground truncate font-noto-naskh-arabic`}
                                title={`${employee.prenom} ${employee.nom}`}
                              >
                                {employee.prenom} {employee.nom}
                              </div>
                              <div
                                className={`text-sm text-muted-foreground truncate dark:text-gray-400 font-noto-naskh-arabic`}
                                title={
                                  getGradeLabel(employee.employee_grade || undefined) ||
                                  (employee.employee_grade || "")
                                }
                              >
                                {getGradeLabel(employee.employee_grade || undefined) ||
                                  (employee.employee_grade || "")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                            title={employee.matricule || "-"}
                          >
                            {employee.matricule}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          {editingEmployeeIndex === index ? (
                            <Select
                              value={employee.responsibility || ""}
                              onValueChange={(value) => updateEmployee(index, "responsibility", value)}
                            >
                              <SelectTrigger className="w-full px-3 py-1 text-xs h-8! border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 hover:shadow-sm">
                                <SelectValue placeholder={isRTL ? "اختر المسؤولية" : "Choisir responsabilité"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableResponsibilities.map((option) => (
                                  <SelectItem
                                    className="px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 focus:bg-[rgb(236,243,245)] focus:text-[rgb(14,102,129)]"
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                              title={employee.responsibility || (isRTL ? "غير محدد" : "Non défini")}
                            >
                              {employee.responsibility || (isRTL ? "غير محدد" : "Non défini")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          {editingEmployeeIndex === index ? (
                            <input
                              type="date"
                              value={formatDateForInput(employee.date_responsabilite || "") || ""}
                              onChange={(e) => updateEmployee(index, "date_responsabilite", e.target.value)}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                            />
                          ) : (
                            <span
                              className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                              title={
                                employee.date_responsabilite
                                  ? isRTL
                                    ? formatDateForRTL(employee.date_responsabilite)
                                    : formatDateForLTR(employee.date_responsabilite)
                                  : (isRTL ? "غير محدد" : "Non défini")
                              }
                            >
                              {employee.date_responsabilite
                                ? isRTL
                                  ? formatDateForRTL(employee.date_responsabilite)
                                  : formatDateForLTR(employee.date_responsabilite)
                                : (isRTL ? "غير محدد" : "Non défini")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          {editingEmployeeIndex === index ? (
                            <input
                              type="text"
                              value={employee.telex_debut || ""}
                              onChange={(e) => updateEmployee(index, "telex_debut", e.target.value)}
                              placeholder={isRTL ? "الهاتــــف" : "Téléphone"}
                              className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                            />
                          ) : (
                            <span
                              className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                              dir="ltr"
                              style={isRTL ? { textAlign: "right", unicodeBidi: "embed" } : {}}
                              title={employee.telex_debut || (isRTL ? "غير محدد" : "Non défini")}
                            >
                              {employee.telex_debut || (isRTL ? "غير محدد" : "Non défini")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-2">
                            {editingEmployeeIndex === index ? (
                              <>
                                <button
                                  onClick={() => saveEmployee(index)}
                                  className="text-green-600 hover:text-green-800 cursor-pointer"
                                  title={isRTL ? "حفظ" : "Sauvegarder"}
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingEmployeeIndex(null)
                                    // Recharger les responsabilités sans exclusion
                                    fetchAvailableResponsibilities()
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
                                  onClick={() => {
                                    setEditingEmployeeIndex(index)
                                    // Recharger les responsabilités en excluant l'employé en cours d'édition
                                    // et en incluant sa responsabilité actuelle
                                    fetchAvailableResponsibilities(employee.id, employee.responsibility || undefined)
                                  }}
                                  className="text-[#076784] hover:text-[#065a72] cursor-pointer"
                                  title={isRTL ? "تعديل" : "Modifier"}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {isAddingNewEmployee && selectedEmployeeForAdd && (
                      <tr className="hover:bg-gray-50 dark:hover:bg-[#363C44] bg-blue-50">
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-muted">
                              <Image
                                className="object-cover"
                                src={processEmployeeSearchImage(selectedEmployeeForAdd)}
                                alt={`${selectedEmployeeForAdd.prenom} ${selectedEmployeeForAdd.nom}`}
                                fill
                                sizes="40px"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`${
                                  isRTL ? "text-md" : "text-md"
                                } font-medium text-foreground truncate font-noto-naskh-arabic`}
                                title={`${selectedEmployeeForAdd.prenom} ${selectedEmployeeForAdd.nom}`}
                              >
                                {selectedEmployeeForAdd.prenom} {selectedEmployeeForAdd.nom}
                              </div>
                              <div
                                className={`text-sm text-muted-foreground truncate dark:text-gray-400 font-noto-naskh-arabic`}
                                title={
                                  getGradeLabel(selectedEmployeeForAdd.employee_grade || undefined) ||
                                  selectedEmployeeForAdd.employee_grade
                                }
                              >
                                {getGradeLabel(selectedEmployeeForAdd.employee_grade || undefined) ||
                                  selectedEmployeeForAdd.employee_grade}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                            title={selectedEmployeeForAdd.matricule || "-"}
                          >
                            {selectedEmployeeForAdd.matricule}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <Select
                            value={newEmployeeData.responsibility}
                            onValueChange={(value) => setNewEmployeeData({ ...newEmployeeData, responsibility: value })}
                          >
                            <SelectTrigger className="w-full px-3 py-1 text-xs h-8! border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 hover:shadow-sm">
                              <SelectValue placeholder={isRTL ? "اختر المسؤولية" : "Choisir responsabilité"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableResponsibilities.map((option) => (
                                <SelectItem
                                  className="px-3 py-2 text-xs hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 focus:bg-[rgb(236,243,245)] focus:text-[rgb(14,102,129)]"
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <input
                            type="date"
                            value={newEmployeeData.date_responsabilite}
                            onChange={(e) =>
                              setNewEmployeeData({ ...newEmployeeData, date_responsabilite: e.target.value })
                            }
                            className="w-full h-8 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 hover:shadow-sm"
                          />
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-sm text-foreground block truncate font-noto-naskh-arabic ${isRTL ? "text-[15px]" : ""}`}
                          >
                            -
                          </span>
                        </td>
                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={saveNewEmployee}
                              disabled={!selectedEmployeeForAdd}
                              className="text-green-600 hover:text-green-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isRTL ? "حفظ" : "Sauvegarder"}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                cancelNewEmployee()
                                // Recharger les responsabilités sans exclusion
                                fetchAvailableResponsibilities()
                              }}
                              className="text-gray-600 hover:text-gray-800 cursor-pointer"
                              title={isRTL ? "إلـغــــاء" : "Annuler"}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {employeesList.length}{" "}
              {employeesList.length > 1 ? (isRTL ? "موظف مُعيّن" : "employés affectés") : (isRTL ? "موظف مُعيّن" : "employé affecté")}
            </div>
            <button
              onClick={handleDialogClose}
              className="group px-4 py-2 text-[14px] text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer hover:shadow-sm"
            >
              {isRTL ? "إغــلاق" : "Fermer"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* AlertDialog pour confirmation de suppression */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`font-noto-naskh-arabic`}>
              {isRTL ? "تأكيد الحذف" : "Confirmer la suppression"}
            </AlertDialogTitle>
            <AlertDialogDescription className={`font-noto-naskh-arabic`}>
              {isRTL
                ? "هل أنت متأكد من حذف تعيين هذا الموظف من هذه الوحدة؟"
                : "Êtes-vous sûr de vouloir supprimer l'affectation de cet agent de cette unité ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteConfirmation} className={`cursor-pointer font-noto-naskh-arabic`}>
              {isRTL ? "إلـغــــاء" : "Annuler"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={`bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer font-noto-naskh-arabic`}
            >
              {isRTL ? "حذف" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toaster pour les notifications */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
