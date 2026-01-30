// TabPersonalInfoEdit.tsx
"use client"
import { useState, useEffect } from "react"
import { X, Save, User, MapPin, Phone, Briefcase, Tag, NotebookPen, Camera } from "lucide-react"
import { DateField, DateInput } from "@/components/ui/datefield"
import { parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { EmployeeCompleteData } from "@/types/details_employees"
import { createClient } from "@/lib/supabase/client"
import {
  genderOptions,
  groupeSanguinOptions,
  gouvernoratOptions,
  getTranslatedOptions,
  SelectOption,
} from "@/lib/selectOptions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParams } from "next/navigation"
import { getTitleFont, getCardSubtitleFont, getJazzeraFontDetailsEmployee } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface EditDialogsProps {
  data: EmployeeCompleteData
  onSave: (field: string, updatedData: any) => void
  activeDialog: string | null
  onClose: () => void
  notesDialog?: {
    isOpen: boolean
    type: "principale" | "actuelle" | null
  }
  setNotesDialog?: (dialog: { isOpen: boolean; type: "principale" | "actuelle" | null }) => void
  showToast?: (variant: "success" | "error", title: string, message: string) => void
}

interface DialogProps {
  isOpen: boolean
  isClosing?: boolean
  onClose: () => void
  title: string
  icon: any
  children: React.ReactNode
}

// Composant Dialog générique
function Dialog({
  isOpen,
  isClosing = false,
  onClose,
  title,
  icon: Icon,
  children,
  isRTL = false,
}: DialogProps & { isRTL?: boolean }) {
  if (!isOpen) return null

  // Largeur spécifique pour le dialogue "Autres Informations" ou "تعديل المعلومات الأخرى"
  const maxWidth =
    title === "Modifier les Autres Informations" || title === "تعـديـل المعلومـات الأخــرى" ? "max-w-2xl" : "max-w-3xl"

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

// Composant Input pour les numéros de téléphone
function PhoneInputField({
  label,
  value,
  onChange,
  placeholder = "",
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isRTL?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Extraire uniquement les chiffres
    const digits = input.replace(/\D/g, "").slice(0, 8)
    onChange(digits) // Stocker sans espaces, juste les chiffres
  }

  // Formater pour l'affichage
  const displayValue = value ? `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5)}`.trim() : ""

  return (
    <div className="group">
      <label
        className={`block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="00 000 000"
        style={{ textAlign: "right", direction: "ltr" }}
        inputMode="numeric"
        className="w-full px-3 py-2 !h-[40px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm font-geist-sans text-[15px] text-start"
      />
    </div>
  )
}

// Composant Input pour la carte d'identité
function CINInputField({
  label,
  value,
  onChange,
  placeholder = "",
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isRTL?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Supprimer tout ce qui n'est pas un chiffre et limiter à 8 chiffres
    const numbers = input.replace(/\D/g, "").slice(0, 8)
    onChange(numbers)
  }

  return (
    <div className="group">
      <label
        className={`block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 !h-[40px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200 group-focus-within:text-[#076784]/80">
        {isRTL ? <span className="font-noto-naskh-arabic">بالضبط 8 أرقام</span> : "Exactement 8 chiffres"}
      </p>
    </div>
  )
}

// Composant Select utilisant Shadcn
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  disabled = false,
  isRTL = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  isRTL?: boolean
}) {
  return (
    <div className="group">
      <label
        className={`block text-sm text-start font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
          isRTL ? "font-noto-naskh-arabic" : ""
        }`}
      >
        {label}
      </label>
      <Select dir={isRTL ? "rtl" : "ltr"} value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full px-3 py-2 text-sm !h-[40px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784]/20 focus:border-[#076784] transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm ${
            isRTL ? "font-noto-naskh-arabic" : ""
          }`}
        >
          <SelectValue
            className={`text-gray-900 dark:text-gray-300 text-base ${isRTL ? "font-noto-naskh-arabic" : ""}`}
            placeholder={placeholder}
          />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-[#1C1C1C] border-gray-300 dark:border-gray-600">
          {options.map((option) => (
            <SelectItem
              className={`px-3 py-2 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-gray-700 focus:text-[rgb(14,102,129)] dark:focus:text-gray-300 ${
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
    </div>
  )
}

// Fonction utilitaire pour gérer la validation Supabase
const checkExistingContact = async (supabase: any, employeeId: string) => {
  const { data: existingContact, error: selectError } = await supabase
    .from("employee_contacts")
    .select("id")
    .eq("employee_id", employeeId)
    .single()

  if (selectError && selectError.code !== "PGRST116") {
    throw new Error(`Erreur lors de la vérification: ${selectError.message}`)
  }

  return existingContact
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

export default function EditDialogs({
  data,
  onSave,
  activeDialog,
  onClose,
  notesDialog,
  setNotesDialog,
  showToast,
}: EditDialogsProps) {
  // Logique RTL et polices
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const jazeeraFontClass = getJazzeraFontDetailsEmployee(params.locale as Locale)

  // États initiaux pour réinitialiser les données
  const initialIdentityData = {
    prenom: data.employee.prenom || "",
    nom: data.employee.nom || "",
    prenom_pere: data.employee.prenom_pere || "",
    prenom_grand_pere: data.employee.prenom_grand_pere || "",
    mere: data.employee.mere || "",
    sexe: data.employee.sexe || "",
    date_naissance: data.employee.date_naissance || "",
    lieu_naissance: data.employee.lieu_naissance || "",
  }

  const initialResidenceData = {
    adresse: data.contacts[0]?.adresse || "",
    gouvernorat: data.contacts[0]?.gouvernorat || "",
    adresse_actuelle: data.contacts[0]?.adresse_actuelle || "",
    gouvernorat_actuel: data.contacts[0]?.gouvernorat_actuel || "",
  }

  const initialContactData = {
    phone_1: data.contacts[0]?.phone_1 || "",
    phone_2: data.contacts[0]?.phone_2 || "",
    whatsapp: data.contacts[0]?.whatsapp || "",
    email: data.contacts[0]?.email || "",
  }

  const initialOtherInfoData = {
    cin: data.employee.cin || "",
    groupe_sanguin: data.employee.groupe_sanguin || "",
  }

  const initialTagsData = {
    tags: "", // Exemple, vous devriez adapter selon votre structure de données
  }

  // États pour les données d'identité
  const [identityData, setIdentityData] = useState(initialIdentityData)

  // États pour les données de résidence
  const [residenceData, setResidenceData] = useState(initialResidenceData)

  // État pour indiquer si l'adresse actuelle est la même que la principale
  const [sameAsMainAddress, setSameAsMainAddress] = useState<boolean>(() => {
    const mainAddr = data.contacts[0]?.adresse || ""
    const currentAddr = data.contacts[0]?.adresse_actuelle || ""
    const mainGov = data.contacts[0]?.gouvernorat || ""
    const currentGov = data.contacts[0]?.gouvernorat_actuel || ""

    return Boolean(!currentAddr && !currentGov && mainAddr && mainGov)
  })

  // État pour les notes d'adresse
  const [addressNotes, setAddressNotes] = useState({
    principale: data.contacts[0]?.adresse_note || "",
    actuelle: data.contacts[0]?.adresse_actuelle_note || "",
  })

  // États pour les données de contact
  const [contactData, setContactData] = useState(initialContactData)

  // États pour les autres informations
  const [otherInfoData, setOtherInfoData] = useState(initialOtherInfoData)

  // États pour les tags
  const [tagsData, setTagsData] = useState(initialTagsData)

  // États pour la photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoToDelete, setPhotoToDelete] = useState<boolean>(false)

  // États pour les indicateurs de chargement
  const [isLoading, setIsLoading] = useState(false)

  // État pour les animations de fermeture
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {}, [identityData.sexe])

  useEffect(() => {
    if (sameAsMainAddress) {
      setResidenceData((prev) => ({
        ...prev,
        adresse_actuelle: prev.adresse,
        gouvernorat_actuel: prev.gouvernorat,
      }))
    }
  }, [sameAsMainAddress, residenceData.adresse, residenceData.gouvernorat])

  // Fonction pour gérer le changement de la case à cocher
  const handleSameAsMainAddressChange = (checked: boolean) => {
    setSameAsMainAddress(checked)
    if (checked) {
      setResidenceData((prev) => ({
        ...prev,
        adresse_actuelle: prev.adresse,
        gouvernorat_actuel: prev.gouvernorat,
      }))
    } else {
      setResidenceData((prev) => ({
        ...prev,
        adresse_actuelle: "",
        gouvernorat_actuel: "",
      }))
    }
  }

  // Fonction pour réinitialiser les données lors de l'annulation
  const resetFormData = () => {
    setIdentityData(initialIdentityData)
    setResidenceData(initialResidenceData)
    setContactData(initialContactData)
    setOtherInfoData(initialOtherInfoData)
    setTagsData(initialTagsData)
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoToDelete(false)
    setSameAsMainAddress(
      Boolean(
        !data.contacts[0]?.adresse_actuelle &&
          !data.contacts[0]?.gouvernorat_actuel &&
          data.contacts[0]?.adresse &&
          data.contacts[0]?.gouvernorat
      )
    )
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // Fonction pour obtenir l'image par défaut selon le genre
  const getDefaultImageByGender = (gender: string) => {
    return gender === "Féminin" ? "/images/femme.png" : "/images/homme.png"
  }

  // Fonctions pour gérer la photo
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validation du type de fichier
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        showToast?.(
          "error",
          isRTL ? "تنسيق غير مدعوم" : "Format non supporté",
          isRTL
            ? "يرجى اختيار صورة بتنسيق JPG أو PNG أو WebP"
            : "Veuillez sélectionner une image au format JPG, PNG ou WebP"
        )
        return
      }

      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB en bytes
      if (file.size > maxSize) {
        showToast?.(
          "error",
          isRTL ? "الملف كبير جداً" : "Fichier trop volumineux",
          isRTL ? "حجم الملف يجب ألا يتجاوز 5 ميجا بايت" : "La taille du fichier ne doit pas dépasser 5MB"
        )
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    // Marquer la photo pour suppression sans l'effacer immédiatement de la DB
    setPhotoToDelete(true)
    setPhotoPreview(null)
    setPhotoFile(null)
    // L'image par défaut sera automatiquement affichée grâce à getDefaultImageByGender
  }

  const uploadPhoto = async () => {
    if (!photoFile) return null

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        console.log("Photo convertie en base64, taille:", base64String.length)
        resolve(base64String)
      }
      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"))
      }
      reader.readAsDataURL(photoFile)
    })
  }

  const handleSaveIdentity = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Gérer les changements de photo
      if (photoToDelete && !photoFile) {
        // Supprimer la photo de la base de données
        await supabase.from("employee_photos").delete().eq("employee_id", data.employee.id)
      } else if (photoFile) {
        try {
          // Upload de la nouvelle photo
          const photoUrl = await uploadPhoto()

          if (!photoUrl) {
            throw new Error("L'upload de la photo a échoué - URL vide")
          }

          // Supprimer l'ancienne photo si elle existe
          await supabase.from("employee_photos").delete().eq("employee_id", data.employee.id)

          // Insérer la nouvelle photo
          const { error: photoError } = await supabase.from("employee_photos").insert({
            employee_id: data.employee.id,
            photo_url: photoUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (photoError) {
            console.error("Erreur lors de la sauvegarde de la photo:", photoError)
            showToast?.(
              "error",
              isRTL ? "خطأ في الصورة" : "Erreur photo",
              isRTL ? `خطأ أثناء الحفظ: ${photoError.message}` : `Erreur lors de la sauvegarde: ${photoError.message}`
            )
            return
          }
        } catch (uploadError) {
          console.error("Erreur lors de l'upload de la photo:", uploadError)
          showToast?.(
            "error",
            isRTL ? "خطأ في الرفع" : "Erreur upload",
            isRTL
              ? `خطأ أثناء رفع الصورة: ${uploadError instanceof Error ? uploadError.message : "خطأ غير معروف"}`
              : `Erreur lors de l'upload de la photo: ${
                  uploadError instanceof Error ? uploadError.message : "Erreur inconnue"
                }`
          )
          return
        }
      }

      // Mettre à jour la table employees
      const { error } = await supabase
        .from("employees")
        .update({
          prenom: identityData.prenom,
          nom: identityData.nom,
          prenom_pere: identityData.prenom_pere,
          prenom_grand_pere: identityData.prenom_grand_pere,
          mere: identityData.mere,
          sexe: identityData.sexe,
          date_naissance: identityData.date_naissance,
          lieu_naissance: identityData.lieu_naissance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.employee.id)

      if (error) {
        console.error("Erreur lors de la sauvegarde:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
          isRTL ? "خطأ أثناء حفظ بيانات الهوية" : "Erreur lors de la sauvegarde des données d'identité"
        )
        return
      }

      showToast?.(
        "success",
        isRTL ? "تم حفظ الهوية" : "Identité sauvegardée",
        isRTL ? "تم تحديث معلومات الهوية بنجاح" : "Les informations d'identité ont été mises à jour avec succès"
      )
      onSave("identity", identityData)
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL ? "خطأ أثناء حفظ بيانات الهوية" : "Erreur lors de la sauvegarde des données d'identité"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveResidence = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Utiliser la fonction utilitaire
      const existingContact = await checkExistingContact(supabase, data.employee.id)

      // Préparer les données à sauvegarder
      // Si l'adresse actuelle est vide et que sameAsMainAddress est false, sauvegarder null
      const adresseActuelle =
        !sameAsMainAddress && !residenceData.adresse_actuelle ? null : residenceData.adresse_actuelle || null
      const gouvernoratActuel =
        !sameAsMainAddress && !residenceData.gouvernorat_actuel ? null : residenceData.gouvernorat_actuel || null

      let error = null

      if (existingContact) {
        // Mettre à jour l'enregistrement existant
        const { error: updateError } = await supabase
          .from("employee_contacts")
          .update({
            adresse: residenceData.adresse,
            gouvernorat: residenceData.gouvernorat,
            adresse_actuelle: adresseActuelle,
            gouvernorat_actuel: gouvernoratActuel,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", data.employee.id)

        error = updateError
      } else {
        // Créer un nouvel enregistrement
        const { error: insertError } = await supabase.from("employee_contacts").insert({
          employee_id: data.employee.id,
          adresse: residenceData.adresse,
          gouvernorat: residenceData.gouvernorat,
          adresse_actuelle: adresseActuelle,
          gouvernorat_actuel: gouvernoratActuel,
          email: data.contacts[0]?.email || "",
          phone_1: data.contacts[0]?.phone_1 || "",
          phone_2: data.contacts[0]?.phone_2 || "",
          whatsapp: data.contacts[0]?.whatsapp || "",
          adresse_note: data.contacts[0]?.adresse_note || "",
          adresse_actuelle_note: data.contacts[0]?.adresse_actuelle_note || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        error = insertError
      }

      if (error) {
        console.error("Erreur lors de la sauvegarde des données de résidence:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
          isRTL
            ? `خطأ أثناء حفظ بيانات السكن: ${error.message}`
            : `Erreur lors de la sauvegarde des données de résidence: ${error.message}`
        )
        return
      }

      // Mettre à jour les données locales avec les valeurs correctes
      const updatedResidenceData = {
        ...residenceData,
        adresse_actuelle: adresseActuelle,
        gouvernorat_actuel: gouvernoratActuel,
      }

      showToast?.(
        "success",
        isRTL ? "تم حفظ السكن" : "Résidence sauvegardée",
        isRTL ? "تم تحديث معلومات السكن بنجاح" : "Les informations de résidence ont été mises à jour avec succès"
      )
      onSave("residence", updatedResidenceData)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données de résidence:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL
          ? `خطأ أثناء حفظ بيانات السكن: ${error instanceof Error ? error.message : "خطأ غير معروف"}`
          : `Erreur lors de la sauvegarde des données de résidence: ${
              error instanceof Error ? error.message : "Erreur inconnue"
            }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveContact = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Utiliser la fonction utilitaire
      const existingContact = await checkExistingContact(supabase, data.employee.id)

      let error = null

      if (existingContact) {
        // Mettre à jour l'enregistrement existant
        const { error: updateError } = await supabase
          .from("employee_contacts")
          .update({
            phone_1: contactData.phone_1,
            phone_2: contactData.phone_2,
            whatsapp: contactData.whatsapp,
            email: contactData.email,
            updated_at: new Date().toISOString(),
          })
          .eq("employee_id", data.employee.id)

        error = updateError
      } else {
        // Créer un nouvel enregistrement
        const { error: insertError } = await supabase.from("employee_contacts").insert({
          employee_id: data.employee.id,
          phone_1: contactData.phone_1,
          phone_2: contactData.phone_2,
          whatsapp: contactData.whatsapp,
          email: contactData.email,
          adresse: data.contacts[0]?.adresse || "",
          gouvernorat: data.contacts[0]?.gouvernorat || "",
          adresse_actuelle: data.contacts[0]?.adresse_actuelle || "",
          gouvernorat_actuel: data.contacts[0]?.gouvernorat_actuel || "",
          adresse_note: data.contacts[0]?.adresse_note || "",
          adresse_actuelle_note: data.contacts[0]?.adresse_actuelle_note || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        error = insertError
      }

      if (error) {
        console.error("Erreur lors de la sauvegarde des données de contact:", error)
        showToast?.(
          "error",
          isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
          isRTL
            ? `خطأ أثناء حفظ بيانات الاتصال: ${error.message}`
            : `Erreur lors de la sauvegarde des données de contact: ${error.message}`
        )
        return
      }

      showToast?.(
        "success",
        isRTL ? "تم حفظ الاتصال" : "Contact sauvegardé",
        isRTL ? "تم تحديث معلومات الاتصال بنجاح" : "Les informations de contact ont été mises à jour avec succès"
      )
      onSave("contact", contactData)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données de contact:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL
          ? `خطأ أثناء حفظ بيانات الاتصال: ${error instanceof Error ? error.message : "خطأ غير معروف"}`
          : `Erreur lors de la sauvegarde des données de contact: ${
              error instanceof Error ? error.message : "Erreur inconnue"
            }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOtherInfo = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Mettre à jour la table employees pour CIN et groupe sanguin
      const { error: employeeError } = await supabase
        .from("employees")
        .update({
          cin: otherInfoData.cin,
          groupe_sanguin: otherInfoData.groupe_sanguin,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.employee.id)

      if (employeeError) {
        console.error("Erreur lors de la sauvegarde employee:", employeeError)
        showToast?.(
          "error",
          isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
          isRTL ? "خطأ أثناء حفظ بيانات الموظف" : "Erreur lors de la sauvegarde des données employé"
        )
        return
      }

      showToast?.(
        "success",
        isRTL ? "تم حفظ المعلومات" : "Informations sauvegardées",
        isRTL ? "تم تحديث المعلومات الأخرى بنجاح" : "Les autres informations ont été mises à jour avec succès"
      )
      onSave("otherInfo", otherInfoData)
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL ? "خطأ أثناء حفظ البيانات" : "Erreur lors de la sauvegarde des données"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTags = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      // Pour les tags, vous devrez peut-être créer une table spécifique
      // ou ajouter un champ dans la table employees
      console.log("Tags à sauvegarder:", tagsData)

      showToast?.(
        "success",
        isRTL ? "تم حفظ العلامات" : "Tags sauvegardés",
        isRTL ? "تم تحديث العلامات بنجاح" : "Les tags ont été mis à jour avec succès"
      )
      onSave("tags", tagsData)
      onClose()
    } catch (error) {
      console.error("Erreur:", error)
      showToast?.(
        "error",
        isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
        isRTL ? "خطأ أثناء حفظ العلامات" : "Erreur lors de la sauvegarde des tags"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = () => {
    setIsClosing(true)
    // Délai pour permettre l'animation de fermeture
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      // Réinitialiser les données APRÈS la fermeture pour éviter le flash visuel
      // Cela s'applique au bouton X et au bouton Annuler
      resetFormData()
    }, 300) // Durée de l'animation en ms
  }

  const handleCancel = () => {
    // Appeler handleDialogClose qui gère à la fois la fermeture et la réinitialisation
    handleDialogClose()
  }

  // Fonction pour fermer le dialogue des notes avec réinitialisation
  const handleNotesDialogClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setNotesDialog?.({ isOpen: false, type: null })
      setIsClosing(false)
      // Réinitialiser les notes APRÈS la fermeture pour éviter le flash visuel
      setAddressNotes({
        principale: data.contacts[0]?.adresse_note || "",
        actuelle: data.contacts[0]?.adresse_actuelle_note || "",
      })
    }, 300)
  }

  // Fonction pour annuler le dialogue des notes
  const handleNotesCancel = () => {
    handleNotesDialogClose()
  }

  return (
    <>
      {/* Dialog pour Information Identité */}
      <Dialog
        isOpen={activeDialog === "identity"}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "تعـديـل معلـومــات الهـويــة" : "Modifier les Informations d'Identité"}
        icon={User}
        isRTL={isRTL}
      >
        <div className="flex gap-12">
          {/* Section Photo à gauche */}
          <div className="shrink-0">
            <div className="relative">
              {/* Photo */}
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-lg">
                <img
                  src={
                    photoPreview ||
                    (data.photos?.[0]?.photo_url && !photoToDelete
                      ? data.photos[0].photo_url
                      : getDefaultImageByGender(identityData.sexe || data.employee.sexe))
                  }
                  alt="Photo de profil"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Button de suppression - positionné par rapport au conteneur parent */}
              {(photoPreview || (data.photos?.[0]?.photo_url && !photoToDelete)) && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={isLoading}
                  className="absolute top-2 right-2 bg-gray-400 text-white rounded-full p-2 hover:bg-red-500 transition-colors disabled:opacity-50 z-10 shadow-lg cursor-pointer"
                  title="Supprimer la photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Bouton de changement de photo */}
              <div className="mt-4 flex flex-col items-center">
                <label className="inline-flex items-center justify-center space-x-2 px-3 py-2 bg-[#076784] text-white rounded cursor-pointer hover:bg-[#065a72] transition-colors shadow-md w-32">
                  <Camera className="h-4 w-4" />
                  <span className="text-xs font-medium">{isRTL ? "تغـيـيــر" : "Changer"}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {isRTL ? "JPG, PNG, WebP" : "JPG, PNG, WebP"}
                  <br />
                  {isRTL ? "(الحد الأقصى 5 ميجا بايت)" : "(max 5MB)"}
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire à droite */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={isRTL ? "الاســـــم" : "Prénom"}
                value={identityData.prenom}
                onChange={(value) => setIdentityData({ ...identityData, prenom: value })}
                placeholder={isRTL ? "أدخل الاسم الأول" : "Entrer le prénom"}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "اللقــب" : "Nom"}
                value={identityData.nom}
                onChange={(value) => setIdentityData({ ...identityData, nom: value })}
                placeholder={isRTL ? "أدخل اللقــب" : "Entrer le nom"}
                isRTL={isRTL}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={isRTL ? "إســم الأب" : "Prénom du Père"}
                value={identityData.prenom_pere}
                onChange={(value) => setIdentityData({ ...identityData, prenom_pere: value })}
                placeholder={isRTL ? "أدخل إســم الأب" : "Entrer le prénom du père"}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "إســم الجــد" : "Prénom du Grand-Père"}
                value={identityData.prenom_grand_pere}
                onChange={(value) => setIdentityData({ ...identityData, prenom_grand_pere: value })}
                placeholder={isRTL ? "أدخل إســم الجــد" : "Entrer le prénom du grand-père"}
                isRTL={isRTL}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={isRTL ? "هـويــة الأم" : "Identité de la Mère"}
                value={identityData.mere}
                onChange={(value) => setIdentityData({ ...identityData, mere: value })}
                placeholder={isRTL ? "أدخل هوية الأم" : "Entrer l'identité de la mère"}
                isRTL={isRTL}
              />
              <SelectField
                label={isRTL ? "الجنــس" : "Genre"}
                value={identityData.sexe}
                onChange={(value) => setIdentityData({ ...identityData, sexe: value })}
                options={getTranslatedOptions(genderOptions, isRTL)}
                placeholder={isRTL ? "اختر الجنــس" : "Sélectionner le genre"}
                isRTL={isRTL}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <div className="group">
                <label
                  className={`block text-start text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 transition-colors duration-200 group-focus-within:text-[#076784] group-hover:text-gray-900 dark:group-hover:text-gray-300 ${
                    isRTL ? "font-noto-naskh-arabic" : ""
                  }`}
                >
                  {isRTL ? "تـاريخ الميــلاد" : "Date de Naissance"}
                </label>
                <I18nProvider locale="fr-FR">
                  <DateField
                    value={identityData.date_naissance ? parseDate(identityData.date_naissance) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toString() : ""
                      setIdentityData({ ...identityData, date_naissance: dateStr })
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
              <InputField
                label={isRTL ? "مكان الميلاد" : "Lieu de Naissance"}
                value={identityData.lieu_naissance}
                onChange={(value) => setIdentityData({ ...identityData, lieu_naissance: value })}
                placeholder={isRTL ? "أدخل مكان الميلاد" : "Entrer le lieu de naissance"}
                isRTL={isRTL}
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <ActionButtons onCancel={handleCancel} onSave={handleSaveIdentity} isLoading={isLoading} isRTL={isRTL} />
      </Dialog>

      {/* Dialog pour Information Résidence */}
      <Dialog
        isOpen={activeDialog === "residence"}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "تعـديـل معلـومــات السكــن" : "Modifier les Informations de Résidence"}
        icon={MapPin}
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <h3
              className={`text-md font-medium text-start text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 ${
                isRTL ? cardSubtitleFontClass : ""
              }`}
            >
              {isRTL ? "العنـوان الـرئيسي" : "Adresse Principale"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField
                  label={isRTL ? "العنـــوان" : "Adresse"}
                  value={residenceData.adresse}
                  onChange={(value) => setResidenceData({ ...residenceData, adresse: value })}
                  placeholder={isRTL ? "أدخل العنــوان الكامل" : "Entrer l'adresse complète"}
                  isRTL={isRTL}
                />
              </div>
              <SelectField
                label={isRTL ? "الولايـــة" : "Gouvernorat"}
                value={residenceData.gouvernorat}
                onChange={(value) => setResidenceData({ ...residenceData, gouvernorat: value })}
                options={getTranslatedOptions(gouvernoratOptions, isRTL)}
                placeholder={isRTL ? "اختر الولايـــة" : "Sélectionner le gouvernorat"}
                isRTL={isRTL}
              />
            </div>
          </div>
          <div className="space-y-4 pb-4">
            <h3
              className={`text-md font-medium text-start text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 ${
                isRTL ? cardSubtitleFontClass : ""
              }`}
            >
              {isRTL ? "العنـوان الحــالي" : "Adresse Actuelle"}
            </h3>

            {/* Case à cocher pour indiquer si c'est la même adresse */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sameAsMainAddress"
                checked={sameAsMainAddress}
                onChange={(e) => handleSameAsMainAddressChange(e.target.checked)}
                className="h-4 w-4 text-[#076784] focus:ring-[#076784] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C]"
              />
              <label htmlFor="sameAsMainAddress" className="text-sm text-gray-700 dark:text-gray-400 cursor-pointer">
                {isRTL ? (
                  <span className="font-noto-naskh-arabic">نفـس العنـوان الـرئيسي</span>
                ) : (
                  "Même adresse que l'adresse principale"
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 text-start md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputField
                  label={isRTL ? "العنـوان الحـالي" : "Adresse Actuelle"}
                  value={residenceData.adresse_actuelle}
                  onChange={(value) => {
                    setResidenceData({ ...residenceData, adresse_actuelle: value })
                    if (value !== residenceData.adresse) {
                      setSameAsMainAddress(false)
                    }
                  }}
                  placeholder={
                    isRTL ? "أدخل العنـوان الحــالي (إذا كان مختلفًا)" : "Entrer l'adresse actuelle (si différente)"
                  }
                  disabled={sameAsMainAddress}
                  isRTL={isRTL}
                />
              </div>
              <SelectField
                label={isRTL ? "الولايـــة الحاليــة" : "Gouvernorat Actuel"}
                value={residenceData.gouvernorat_actuel}
                onChange={(value) => {
                  setResidenceData({ ...residenceData, gouvernorat_actuel: value })
                  if (value !== residenceData.gouvernorat) {
                    setSameAsMainAddress(false)
                  }
                }}
                options={getTranslatedOptions(gouvernoratOptions, isRTL)}
                placeholder={isRTL ? "اختر الولايـة الحاليـة" : "Sélectionner le gouvernorat actuel"}
                disabled={sameAsMainAddress}
                isRTL={isRTL}
              />
            </div>
          </div>
          {/* Boutons d'action */}
          <ActionButtons onCancel={handleCancel} onSave={handleSaveResidence} isLoading={isLoading} isRTL={isRTL} />
        </div>
      </Dialog>

      {/* Dialog pour Information de Contact */}
      <Dialog
        isOpen={activeDialog === "contact"}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "تعديـل المعلومـات الإتصـاليــة" : "Modifier les Informations de Contact"}
        icon={Phone}
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <h3
              className={`text-md text-start font-medium text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 ${
                isRTL ? cardSubtitleFontClass : ""
              }`}
            >
              {isRTL ? "رقــم الهـاتـف و البـريــد" : "Contact Personnel"}
            </h3>
            <div className="grid grid-cols-1 text-start md:grid-cols-2 gap-4">
              <PhoneInputField
                label={isRTL ? "رقم الهاتف المحمول" : "Numéro Portable"}
                value={contactData.phone_1}
                onChange={(value) => setContactData({ ...contactData, phone_1: value })}
                isRTL={isRTL}
              />
              <InputField
                label={isRTL ? "البريد الإلكتروني" : "Email"}
                value={contactData.email}
                onChange={(value) => setContactData({ ...contactData, email: value })}
                placeholder={isRTL ? "example@email.com" : "exemple@email.com"}
                type="email"
              />
            </div>
          </div>
          <div className="space-y-4 py-4">
            <h3
              className={`text-md text-start font-medium text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2 ${
                isRTL ? cardSubtitleFontClass : ""
              }`}
            >
              {isRTL ? "وســائــل أخــرى" : "Autre Contact"}
            </h3>
            <div className="grid grid-cols-1 text-start md:grid-cols-2 gap-4">
              <PhoneInputField
                label={isRTL ? "رقم الهاتف المحمول 2" : "Numéro Portable 2"}
                value={contactData.phone_2}
                onChange={(value) => setContactData({ ...contactData, phone_2: value })}
                isRTL={isRTL}
              />
              <PhoneInputField
                label={isRTL ? "واتســـاب" : "WhatsApp"}
                value={contactData.whatsapp}
                onChange={(value) => setContactData({ ...contactData, whatsapp: value })}
                isRTL={isRTL}
              />
            </div>
          </div>
          <ActionButtons onCancel={handleCancel} onSave={handleSaveContact} isLoading={isLoading} isRTL={isRTL} />
        </div>
      </Dialog>

      {/* Dialog pour Autre Information */}
      <Dialog
        isOpen={activeDialog === "otherInfo"}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "تعـديـل المعلـومــات الأخــرى" : "Modifier les Autres Informations"}
        icon={Briefcase}
        isRTL={isRTL}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 text-start md:grid-cols-2 gap-6">
            <CINInputField
              label={isRTL ? "بطاقة الهوية" : "Carte d'identité"}
              value={otherInfoData.cin}
              onChange={(value) => setOtherInfoData({ ...otherInfoData, cin: value })}
              placeholder="12345678"
              isRTL={isRTL}
            />
            <SelectField
              label={isRTL ? "فصيلة الدم" : "Groupe Sanguin"}
              value={otherInfoData.groupe_sanguin}
              onChange={(value) => setOtherInfoData({ ...otherInfoData, groupe_sanguin: value })}
              options={getTranslatedOptions(groupeSanguinOptions, isRTL)}
              placeholder={isRTL ? "اختر فصيلة الدم" : "Sélectionner le groupe sanguin"}
              isRTL={isRTL}
            />
          </div>
          <ActionButtons onCancel={handleCancel} onSave={handleSaveOtherInfo} isLoading={isLoading} isRTL={isRTL} />
        </div>
      </Dialog>

      {/* Dialog pour Tags */}
      <Dialog
        isOpen={activeDialog === "tags"}
        isClosing={isClosing}
        onClose={handleDialogClose}
        title={isRTL ? "تعــديـــل العــلامــــات" : "Modifier les Tags"}
        icon={Tag}
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div className="pb-2">
            <label
              className={`block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "العلامات" : "Tags"}
            </label>
            <input
              type="text"
              value={tagsData.tags}
              onChange={(e) => setTagsData({ ...tagsData, tags: e.target.value })}
              placeholder={isRTL ? "أضف علامات مفصولة بفواصل" : "Ajouter des tags séparés par des virgules"}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#076784] focus:border-transparent ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <p className="text-sm text-start text-gray-500 dark:text-gray-400 mt-1 font-noto-naskh-arabic">
              {isRTL ? "مثــال: كــفء، منضبــط، إلــخ..." : "Exemple: compétent, ponctuel, leader"}
            </p>
          </div>
          <ActionButtons onCancel={handleCancel} onSave={handleSaveTags} isLoading={isLoading} isRTL={isRTL} />
        </div>
      </Dialog>

      {/* Dialog pour les Notes d'Adresse */}
      <Dialog
        isOpen={notesDialog?.isOpen || false}
        isClosing={isClosing}
        onClose={handleNotesDialogClose}
        title={
          isRTL
            ? `مــلاحظــات - ${notesDialog?.type === "principale" ? "العنـوان الـرئيسي" : "العنـوان الحـالي"}`
            : `Notes - ${notesDialog?.type === "principale" ? "Adresse Principale" : "Adresse Actuelle"}`
        }
        icon={NotebookPen}
        isRTL={isRTL}
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5 ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
            >
              {isRTL ? "ملاحظة" : "Note"}
            </label>
            <textarea
              value={notesDialog?.type ? addressNotes[notesDialog.type] : ""}
              onChange={(e) => {
                if (notesDialog?.type) {
                  setAddressNotes({ ...addressNotes, [notesDialog.type]: e.target.value })
                }
              }}
              placeholder={isRTL ? "أضف ملاحظة لهذا العنوان..." : "Ajouter une note pour cette adresse..."}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#076784] focus:border-transparent ${
                isRTL ? "font-noto-naskh-arabic" : ""
              }`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleNotesCancel}
              className="px-4 py-2 text-[14px] text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              {isRTL ? "إلـغــــاء" : "Annuler"}
            </button>
            <button
              onClick={async () => {
                try {
                  const supabase = createClient()
                  const noteValue = notesDialog?.type ? addressNotes[notesDialog.type] : ""

                  // Déterminer quel champ mettre à jour selon le type de note
                  const updateField = notesDialog?.type === "principale" ? "adresse_note" : "adresse_actuelle_note"

                  const { error } = await supabase
                    .from("employee_contacts")
                    .update({
                      [updateField]: noteValue,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("employee_id", data.employee.id)

                  if (error) {
                    console.error("Erreur lors de la sauvegarde:", error)
                    showToast?.(
                      "error",
                      isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
                      isRTL ? "خطأ أثناء حفظ الملاحظة" : "Erreur lors de la sauvegarde de la note"
                    )
                  } else {
                    showToast?.(
                      "success",
                      isRTL ? "تم حفظ الملاحظة" : "Note sauvegardée",
                      isRTL ? "تم حفظ ملاحظة العنوان بنجاح" : "La note d'adresse a été sauvegardée avec succès"
                    )
                    // Mettre à jour les données locales
                    onSave("notes", { [updateField]: noteValue })
                    setIsClosing(true)
                    setTimeout(() => {
                      setNotesDialog?.({ isOpen: false, type: null })
                      setIsClosing(false)
                    }, 300)
                  }
                } catch (error) {
                  console.error("Erreur:", error)
                  showToast?.(
                    "error",
                    isRTL ? "خطأ في الحفظ" : "Erreur de sauvegarde",
                    isRTL ? "خطأ أثناء حفظ الملاحظة" : "Erreur lors de la sauvegarde de la note"
                  )
                }
              }}
              className="px-4 py-2 bg-[#076784] text-white text-[14px] rounded hover:bg-[#065a72] transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isRTL ? "حفظ" : "Enregistrer"}</span>
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

  const openIdentityDialog = () => {
    setActiveDialog("identity")
  }

  const openResidenceDialog = () => {
    setActiveDialog("residence")
  }

  const openContactDialog = () => {
    setActiveDialog("contact")
  }

  const openOtherInfoDialog = () => {
    setActiveDialog("otherInfo")
  }

  const openTagsDialog = () => {
    setActiveDialog("tags")
  }

  const closeDialog = () => {
    setActiveDialog(null)
  }

  return {
    activeDialog,
    openIdentityDialog,
    openResidenceDialog,
    openContactDialog,
    openOtherInfoDialog,
    openTagsDialog,
    closeDialog,
  }
}
