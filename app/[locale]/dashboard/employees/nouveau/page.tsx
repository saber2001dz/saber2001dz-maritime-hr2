// app/dashboard/employee/nouveau/page.tsx
"use client"

import { useState, useRef, useTransition, useEffect } from "react"
import { createAgentAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { Save, User, Upload, ArrowLeft, ArrowRight, AlertCircle, X } from "lucide-react"
import { Stepper, Step, StepLabel, ThemeProvider } from "@mui/material"
import { CacheProvider } from "@emotion/react"
import { rtlTheme, ltrTheme, cacheRtl, cacheLtr } from "@/lib/mui-rtl-config"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateField, DateInput } from "@/components/ui/datefield"
import { CalendarDate, parseDate } from "@internationalized/date"
import { I18nProvider } from "react-aria"
import { createClient } from "@/lib/supabase/client"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { genderOptions, gouvernoratOptions, getTranslatedOptions } from "@/lib/selectOptions"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTitleFont,
  getMainTitleFont,
  getCardTitleFont,
  getCardSubtitleFont,
  getTableCellFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"

// Steps will be dynamically generated with translations

const ProgressBar = ({ isVisible, isCompleting }: { isVisible: boolean; isCompleting?: boolean }) => {
  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className={`h-full transition-all duration-1000 ease-out ${isCompleting ? "w-full" : "animate-pulse"}`}
        style={{
          background: "linear-gradient(90deg, rgb(14, 102, 129) 0%, rgb(36, 124, 149) 50%, rgb(14, 102, 129) 100%)",
          width: isCompleting ? "100%" : "70%",
          animation: isCompleting ? "none" : "progress-bar 2s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes progress-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

// Composant Input pour les numéros de téléphone
function PhoneInputField({
  label,
  value,
  onChange,
  placeholder = "00 000 000",
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
    <div>
      <label
        className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? "font-noto-naskh-arabic" : ""}`}
      >
        {label}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        inputMode="numeric"
        className="w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-gray-300 font-geist-sans text-[15px]"
        style={{ textAlign: "right", direction: "ltr" }}
      />
    </div>
  )
}

export default function NewAgentPage() {
  const router = useRouter()
  const toasterRef = useRef<ToasterRef>(null)
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const titleFontClass = getTitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const cardTitleFontClass = getCardTitleFont(params.locale as Locale)
  // const cardFooterFontClass = getCardFooterFont(params.locale as Locale)
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const tableCellFontClass = getTableCellFont(params.locale as Locale)

  // Dynamic steps with translations
  const STEPS = [
    { id: 1, name: t("newAgent.steps.step1") },
    { id: 2, name: t("newAgent.steps.step2") },
    { id: 3, name: t("newAgent.steps.step3") },
  ]
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false)
  const [formData, setFormData] = useState({
    prenom: "",
    prenomPere: "",
    prenomGrandPere: "",
    mere: "",
    nom: "",
    matricule: "",
    dateNaissance: "",
    lieuNaissance: "",
    identifiantUnique: "",
    sexe: "",
    isPrivate: false,
    identiteConjoint: "",
    matriculemutuel: "",
    nombreEnfants: "",
    adresse: "",
    gouvernorat: "",
    telephoneMobile: "",
    whatsapp: "",
    emailPersonnel: "",
    travailConjoint: "",
    cin: "",
    passeport: "",
    dateRecrutement: "",
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const prenomRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showValidationToast, setShowValidationToast] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isProgressCompleting, setIsProgressCompleting] = useState(false)

  // État pour tracking du résultat
  const [isPending, startTransition] = useTransition()
  const [matriculeError, setMatriculeError] = useState<string | null>(null)
  const [isCheckingMatricule, setIsCheckingMatricule] = useState(false)

  // Fonction pour vérifier si le matricule existe
  const checkMatricule = async (matricule: string) => {
    if (!matricule || matricule.length < 3) {
      setMatriculeError(null)
      return
    }

    setIsCheckingMatricule(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select("matricule")
        .eq("matricule", matricule)
        .maybeSingle() // Important: utilisez maybeSingle au lieu de single

      if (error) {
        console.error("Supabase error:", error)
        setMatriculeError(t("newAgent.validation.verificationError"))
        return
      }

      setMatriculeError(data ? t("newAgent.validation.matriculeExists") : null)
    } catch (error) {
      console.error("Check matricule error:", error)
      setMatriculeError(t("newAgent.validation.verificationError"))
    } finally {
      setIsCheckingMatricule(false)
    }
  }

  // Utilisation de useEffect pour le debouncing
  useEffect(() => {
    if (formData.matricule.length >= 3) {
      const timerId = setTimeout(() => {
        checkMatricule(formData.matricule)
      }, 500)
      return () => clearTimeout(timerId)
    }
  }, [formData.matricule])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field === "matricule") {
      const cleanValue = String(value).replace(/\D/g, "")
      setFormData((prev) => ({ ...prev, matricule: cleanValue }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Valider le type de fichier
      if (!isValidImageType(file)) {
        toasterRef.current?.show({
          title: t("newAgent.photo.unsupportedFormat"),
          message: t("newAgent.photo.onlyFormats"),
          variant: "error",
          duration: 4000,
        })
        // Réinitialiser l'input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      // Valider la taille du fichier (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toasterRef.current?.show({
          title: t("newAgent.photo.fileTooLarge"),
          message: t("newAgent.photo.maxSizeExceeded"),
          variant: "error",
          duration: 4000,
        })
        // Réinitialiser l'input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Fonction de soumission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (currentStep === STEPS.length) {
      if (!validateFinalSubmission()) {
        toasterRef.current?.show({
          title: t("newAgent.validation.requiredFieldsMissing"),
          message: t("newAgent.validation.pleaseCompleteRequired"),
          variant: "error",
          duration: 3000,
        })
        return
      }

      setShowConfirmDialog(true)
    }
  }

  const resetForm = () => {
    setFormData({
      prenom: "",
      prenomPere: "",
      prenomGrandPere: "",
      mere: "",
      nom: "",
      matricule: "",
      dateNaissance: "",
      lieuNaissance: "",
      identifiantUnique: "",
      sexe: "",
      isPrivate: false,
      identiteConjoint: "",
      matriculemutuel: "",
      nombreEnfants: "",
      adresse: "",
      gouvernorat: "",
      telephoneMobile: "",
      whatsapp: "",
      emailPersonnel: "",
      travailConjoint: "",
      cin: "",
      passeport: "",
      dateRecrutement: "",
    })
    setSelectedImage(null)
    setImagePreview(null)
    setCurrentStep(1)
    setMatriculeError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false)

    const formDataObj = new FormData()
    const cleanedFormData = {
      ...formData,
      telephoneMobile: formData.telephoneMobile.replace(/\s/g, ""),
      whatsapp: formData.whatsapp.replace(/\s/g, ""),
      // Les inputs date retournent déjà le format ISO (aaaa-mm-jj)
    }
    Object.entries(cleanedFormData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString())
    })
    formDataObj.append("isPrivate", formData.isPrivate ? "on" : "")
    if (selectedImage) {
      formDataObj.append("photo", selectedImage)
    }

    startTransition(async () => {
      const result = await createAgentAction(null, formDataObj)

      if (result?.type === "error") {
        const fieldErrors = result.errors
          ? Object.entries(result.errors)
              .map(([field, messages]) => {
                if (Array.isArray(messages)) {
                  return `${field} : ${messages.join(", ")}`
                }
                return `${field} : ${String(messages)}`
              })
              .join("\n")
          : result.message || t("newAgent.messages.unknownError")
        toasterRef.current?.show({
          title: t("newAgent.messages.saveError"),
          message: fieldErrors,
          variant: "error",
          duration: 5000,
        })
        return
      }

      if (result?.type === "success") {
        // Démarrer la complétion de la barre de progression
        setIsProgressCompleting(true)

        toasterRef.current?.show({
          title: t("newAgent.messages.saveSuccess"),
          message: saveAndAddAnother
            ? t("newAgent.messages.formResetForNew")
            : t("newAgent.messages.redirectingToList"),
          variant: "success",
          duration: 3000,
        })

        // Attendre que la barre de progression se termine
        setTimeout(() => {
          if (saveAndAddAnother) {
            // Réinitialiser le formulaire pour un nouvel agent
            resetForm()
            setSaveAndAddAnother(false)
            setIsProgressCompleting(false)
            // Focus sur le premier champ
            setTimeout(() => {
              prenomRef.current?.focus()
            }, 100)
          } else {
            // Redirection vers la liste des agents
            router.push("/dashboard/employees/table")
          }
        }, 1200) // 1.2 secondes pour laisser le temps à l'animation de se terminer
      }
    })
  }

  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      if (validateCurrentStep()) {
        setCurrentStep((prev) => prev + 1)
        setShowValidationToast(false) // Masquer le toast si validation OK
      } else {
        // Afficher le toast avec le message d'erreur
        const message = getValidationMessage()
        if (message) {
          setValidationMessage(message)
          setShowValidationToast(true)

          // Auto-hide après 5 secondes
          setTimeout(() => {
            setShowValidationToast(false)
          }, 10000)
        }
      }
    }
  }

  const closeValidationToast = () => {
    setShowValidationToast(false)
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Fonction pour valider une date au format ISO (aaaa-mm-jj)
  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false
    try {
      // Le DateField utilise le format YYYY-MM-DD
      parseDate(dateStr)
      return true
    } catch {
      // Fallback pour les anciennes dates
      const date = new Date(dateStr)
      return !isNaN(date.getTime()) && dateStr === date.toISOString().split("T")[0]
    }
  }

  const StepIndicator = () => {
    const theme = isRTL ? rtlTheme : ltrTheme
    const cache = isRTL ? cacheRtl : cacheLtr

    return (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <div className="max-w-5xl mx-auto mb-16" dir={isRTL ? "rtl" : "ltr"}>
            <Stepper
              activeStep={currentStep - 1}
              alternativeLabel
              sx={{
                "& .MuiStepConnector-root": {
                  top: "20px",
                },
                "& .MuiStepLabel-root": {
                  fontFamily: isRTL ? titleFontClass : "inherit",
                },
                "& .MuiStepIcon-text": {
                  fontSize: "0.7rem", // Numéros encore plus petits
                  fontWeight: 600,
                },
              }}
            >
              {STEPS.map((step) => (
                <Step key={step.id}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        textAlign: "center !important",
                        maxWidth: "6rem",
                        wordWrap: "break-word",
                        fontFamily: isRTL ? "inherit" : "inherit",
                        display: "block",
                        width: "100%",
                        margin: "0 auto",
                      },
                      "& .MuiStepLabel-label.Mui-active": {
                        color: "rgb(14, 102, 129)",
                      },
                      "& .MuiStepLabel-labelContainer": {
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                      },
                    }}
                  >
                    {step.name}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </div>
        </ThemeProvider>
      </CacheProvider>
    )
  }

  // Composant Toast moderne
  const ValidationToast = ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-medium text-gray-900 mb-1 ${isRTL ? titleFontClass : ""}`}>
              {t("newAgent.validation.requiredFieldsMissing")}
            </h4>
            <p className={`text-sm text-gray-600 ${isRTL ? cardSubtitleFontClass : ""}`}>{message}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  )

  // Fonction pour valider le type de fichier image
  const isValidImageType = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    return validTypes.includes(file.type)
  }

  // Fonction principale de validation pour l'étape courante
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Données Basiques
        return !!(
          (
            formData.prenom.trim() &&
            formData.nom.trim() &&
            formData.matricule.trim() &&
            formData.dateNaissance &&
            validateDate(formData.dateNaissance) &&
            formData.sexe &&
            !matriculeError && // S'assurer qu'il n'y a pas d'erreur de matricule
            !isCheckingMatricule
          ) // S'assurer que la vérification est terminée
        )
      case 2: // Données Familiales
        return true // Toujours valide car aucun champ n'est requis
      case 3: // Coordonnées Personnelles - AUCUN CHAMP REQUIS
        return true // Toujours valide car aucun champ n'est requis
      default:
        return false
    }
  }

  // Fonction pour validation finale avant soumission
  const validateFinalSubmission = (): boolean => {
    return (
      // Étape 1
      !!formData.prenom.trim() &&
      !!formData.nom.trim() &&
      !!formData.matricule.trim() &&
      !!formData.dateNaissance &&
      validateDate(formData.dateNaissance) &&
      !!formData.sexe &&
      !matriculeError
    )
  }

  // Fonction pour obtenir le message d'erreur spécifique
  const getValidationMessage = (): string | null => {
    if (validateCurrentStep()) return null

    switch (currentStep) {
      case 1:
        if (!formData.prenom.trim()) return t("newAgent.validation.firstNameRequired")
        if (!formData.nom.trim()) return t("newAgent.validation.lastNameRequired")
        if (!formData.matricule.trim()) return t("newAgent.validation.matriculeRequired")
        if (matriculeError) return matriculeError
        if (isCheckingMatricule) return t("newAgent.validation.matriculeChecking")
        if (!formData.dateNaissance) return t("newAgent.validation.birthDateRequired")
        if (formData.dateNaissance && !validateDate(formData.dateNaissance)) {
          return t("newAgent.validation.invalidBirthDate")
        }
        if (!formData.sexe) return t("newAgent.validation.genderRequired")
        break
      case 2:
        return null
      case 3:
        // Aucun champ requis à l'étape 3
        return null
    }
    return null
  }

  function SubmitButton({ isFormValid, onConfirm }: { isFormValid: boolean; onConfirm: () => void }) {
    return (
      <button
        type="button"
        disabled={!isFormValid}
        onClick={onConfirm}
        className={`flex items-center justify-center gap-2 w-32 h-10 text-sm border border-gray-300 dark:border-transparent text-white rounded font-medium transition-colors ${
          !isFormValid ? "bg-gray-400 cursor-not-allowed" : "cursor-pointer hover:bg-[rgb(36,124,149)]"
        }`}
        style={{
          backgroundColor: isFormValid ? "rgb(14, 102, 129)" : "rgb(156, 163, 175)",
        }}
      >
        <Save className="w-4 h-4" />
        <span className={isRTL ? titleFontClass : ""}>{t("newAgent.buttons.save")}</span>
      </button>
    )
  }

  // Dialog de confirmation personnalisé
  function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
  }) {
    if (!isOpen) return null

    return (
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        />

        {/* Dialog */}
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`bg-white rounded-lg shadow-2xl mx-4 w-full max-w-lg border border-gray-200 pointer-events-auto transform transition-all duration-300 ease-out ${
              isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className={`flex ${isRTL ? "space-x-reverse" : "items-center"} space-x-2`}>
                <User className="h-5 w-5 text-[#076784]" />
                <h2
                  className={`${isRTL ? "text-base mr-2 -mb-2" : "text-lg"} font-semibold text-[#076784] ${
                    isRTL ? `${mainTitleFontClass} mt-0.5` : ""
                  }`}
                >
                  {t("newAgent.confirmation.title")}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:scale-110"
              >
                <X className="h-6 w-6 cursor-pointer" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 px-6">
              <p className={`text-gray-700 mb-8 mt-4 ${isRTL ? `text-right ${cardSubtitleFontClass}` : "text-center"}`}>
                {t("newAgent.confirmation.message")}
              </p>

              <div className={`flex justify-end ${isRTL ? "space-x-reverse gap-3" : ""} space-x-3`}>
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 text-[14px] text-gray-500 border border-border dark:border-transparent rounded-md hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    isRTL ? titleFontClass : ""
                  }`}
                >
                  {t("newAgent.buttons.cancel")}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center ${
                    isRTL ? "space-x-reverse gap-2" : ""
                  } space-x-2 cursor-pointer hover:shadow-md active:scale-95`}
                >
                  <Save className="h-4 w-4" />
                  <span className={isRTL ? titleFontClass : ""}>{t("newAgent.confirmation.confirm")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Barre de progression */}
      <ProgressBar isVisible={isPending} isCompleting={isProgressCompleting} />
      <div className="min-h-screen pb-12 bg-[#F4F5F9] dark:bg-[#26272A]">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-semibold text-gray-900 dark:text-white ${isRTL ? mainTitleFontClass : ""}`}>
              {t("newAgent.title")}
            </h1>
          </div>
        </div>

        <div className="mx-6 mb-6">
          <div
            className="bg-white dark:bg-[#1C1C1C] rounded border border-gray-200 dark:border-[#393A41]"
            style={{ width: "75%" }}
          >
            <div className=" px-8 py-4 rounded-t border-b border-gray-200 dark:border-b-0 bg-[rgb(236,243,245)] dark:bg-[#232A2B]">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3`}>
                  <User className="w-5 h-5 text-[rgb(14,102,129)] dark:text-[#80D5D4]" />
                  <h2
                    className={`text-lg font-medium text-[rgb(14,102,129)] dark:text-[#80D5D4] ${
                      isRTL ? cardTitleFontClass : ""
                    }`}
                  >
                    {STEPS.find((s) => s.id === currentStep)?.name || t("newAgent.form.basicData")}
                  </h2>
                </div>
                <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? titleFontClass : ""}`}>
                  {t("newAgent.steps.stepOf", { current: currentStep, total: STEPS.length })}
                </span>
              </div>
            </div>

            <form id="agentWizardForm" autoComplete="off">
              <div className="p-8">
                <StepIndicator />

                {/* --- ÉTAPE 1: Données Basiques --- */}
                {currentStep === 1 && (
                  <div className="flex gap-8">
                    <div className="flex-1 pr-4 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="prenom"
                            className={`block text-xs  text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.firstName")} *
                          </label>
                          <input
                            id="prenom"
                            name="prenom"
                            ref={prenomRef}
                            type="text"
                            autoFocus
                            value={formData.prenom}
                            onChange={(e) => handleInputChange("prenom", e.target.value)}
                            className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            autoComplete="off"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="prenomPere"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.fatherName")}
                          </label>
                          <input
                            id="prenomPere"
                            name="prenomPere"
                            type="text"
                            value={formData.prenomPere}
                            onChange={(e) => handleInputChange("prenomPere", e.target.value)}
                            className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="prenomGrandPere"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.grandfatherName")}
                          </label>
                          <input
                            id="prenomGrandPere"
                            name="prenomGrandPere"
                            type="text"
                            value={formData.prenomGrandPere}
                            onChange={(e) => handleInputChange("prenomGrandPere", e.target.value)}
                            className={`w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="nom"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.lastName")} *
                          </label>
                          <input
                            id="nom"
                            name="nom"
                            type="text"
                            value={formData.nom}
                            onChange={(e) => handleInputChange("nom", e.target.value)}
                            className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="mere"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.motherName")}
                          </label>
                          <input
                            id="mere"
                            name="mere"
                            type="text"
                            value={formData.mere}
                            onChange={(e) => handleInputChange("mere", e.target.value)}
                            className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            autoComplete="off"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="dateNaissance"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.birthDate")} *
                          </label>

                          <I18nProvider locale="fr-FR">
                            <DateField
                              value={formData.dateNaissance ? parseDate(formData.dateNaissance) : null}
                              onChange={(date) => {
                                const dateStr = date ? date.toString() : ""
                                setFormData((prev) => ({ ...prev, dateNaissance: dateStr }))
                              }}
                              isRequired
                            >
                              <DateInput
                                focusColor="rgb(7,103,132)"
                                className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:ring-0 focus-visible:ring-0 bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-[#959594] ${
                                  isRTL ? "text-right font-geist-sans text-[15px]" : ""
                                }`}
                              />
                            </DateField>
                          </I18nProvider>
                        </div>
                        <div>
                          <label
                            htmlFor="lieuNaissance"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.birthPlace")}
                          </label>
                          <input
                            id="lieuNaissance"
                            name="lieuNaissance"
                            type="text"
                            value={formData.lieuNaissance}
                            onChange={(e) => handleInputChange("lieuNaissance", e.target.value)}
                            className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-right" : ""
                            } ${isRTL ? tableCellFontClass : ""}`}
                            autoComplete="new-password"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="dateRecrutement"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.recruitmentDate")}
                          </label>
                          <I18nProvider locale="fr-FR">
                            <DateField
                              value={formData.dateRecrutement ? parseDate(formData.dateRecrutement) : null}
                              onChange={(date) => {
                                const dateStr = date ? date.toString() : ""
                                setFormData((prev) => ({ ...prev, dateRecrutement: dateStr }))
                              }}
                            >
                              <DateInput
                                focusColor="rgb(7,103,132)"
                                className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:ring-0 focus-visible:ring-0 bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-[#959594] ${
                                  isRTL ? "text-right font-geist-sans text-[15px]" : ""
                                }`}
                              />
                            </DateField>
                          </I18nProvider>
                        </div>
                        <div>
                          <label
                            htmlFor="matricule"
                            className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                              isRTL ? titleFontClass : ""
                            }`}
                          >
                            {t("newAgent.form.fields.matricule")} *
                          </label>
                          <input
                            id="matricule"
                            name="matricule"
                            type="text"
                            value={formData.matricule}
                            maxLength={5}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              handleInputChange("matricule", value)
                            }}
                            className={`w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                              isRTL ? "text-start font-geist-sans text-[15px]" : ""
                            }`}
                            required
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-xs text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.gender")} *
                        </label>
                        <div className={`flex gap-4 ${isRTL ? "justify-start" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
                          {genderOptions.map((sexe) => (
                            <label key={sexe.value} className="flex items-center cursor-pointer">
                              {isRTL ? (
                                <>
                                  <input
                                    type="radio"
                                    name="sexe"
                                    value={sexe.value}
                                    checked={formData.sexe === sexe.value}
                                    onChange={(e) => handleInputChange("sexe", e.target.value)}
                                    className="ml-2"
                                    style={{
                                      accentColor: formData.sexe === sexe.value ? "rgb(7, 103, 132)" : undefined,
                                    }}
                                    required
                                  />
                                  <span className={`text-sm text-gray-700 dark:text-[#D0D0D0] ${titleFontClass}`}>
                                    {t(`newAgent.form.gender.${sexe.value === "ذكر" ? "male" : "female"}`)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="radio"
                                    name="sexe"
                                    value={sexe.value}
                                    checked={formData.sexe === sexe.value}
                                    onChange={(e) => handleInputChange("sexe", e.target.value)}
                                    className="mr-2"
                                    style={{
                                      accentColor: formData.sexe === sexe.value ? "rgb(7, 103, 132)" : undefined,
                                    }}
                                    required
                                  />
                                  <span className="text-sm text-gray-700 dark:text-[#D0D0D0]">{sexe.label}</span>
                                </>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`flex items-start gap-3 py-1 ${isRTL ? "justify-start" : ""}`}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <button
                            type="button"
                            onClick={() => handleInputChange("isPrivate", !formData.isPrivate)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer mt-1 ${
                              formData.isPrivate ? "bg-[rgb(7,103,132)]" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isRTL
                                  ? formData.isPrivate
                                    ? "-translate-x-6"
                                    : "-translate-x-1"
                                  : formData.isPrivate
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
                              {t("newAgent.form.fields.privateProfile")}
                            </h3>
                            <p className={`text-[10px] text-gray-500 mt-0.5 ${isRTL ? cardSubtitleFontClass : ""}`}>
                              {t("newAgent.form.privateProfileDescription")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-64 flex flex-col items-center justify-start">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <label
                          className={`text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.agentPhoto")}
                        </label>

                        <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700 relative">
                          {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" fill className="object-cover rounded-lg" />
                          ) : (
                            <div className="text-center">
                              <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p
                                className={`text-[10px] text-gray-500 dark:text-gray-400 ${
                                  isRTL ? cardSubtitleFontClass : ""
                                }`}
                              >
                                {t("newAgent.photo.noImage")}
                              </p>
                            </div>
                          )}
                        </div>

                        <input
                          name="photo"
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={handleUploadClick}
                          className={`flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {t("newAgent.photo.upload")}
                        </button>

                        <p
                          className={`text-[10px] text-gray-500 dark:text-gray-400 text-center ${
                            isRTL ? cardSubtitleFontClass : ""
                          }`}
                        >
                          {t("newAgent.photo.acceptedFormats")}
                          <br />
                          {t("newAgent.photo.maxSize")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 2: Données Familiales --- */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="cin"
                          className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.cin")}
                        </label>
                        <input
                          id="cin"
                          name="cin"
                          type="text"
                          value={formData.cin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            handleInputChange("cin", value)
                          }}
                          className={`w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                            isRTL ? "text-right font-geist-sans text-[15px]" : ""
                          }`}
                          maxLength={8}
                          autoComplete="off"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="passeport"
                          className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.passport")}
                        </label>
                        <input
                          id="passeport"
                          name="passeport"
                          type="text"
                          value={formData.passeport}
                          onChange={(e) => handleInputChange("passeport", e.target.value)}
                          className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                            isRTL ? "text-right font-geist-sans text-[15px]" : ""
                          }`}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="matriculemutuel"
                          className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.mutualMatricule")}
                        </label>
                        <input
                          id="matriculemutuel"
                          name="matriculemutuel"
                          type="text"
                          value={formData.matriculemutuel}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            handleInputChange("matriculemutuel", value)
                          }}
                          className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                            isRTL ? "text-right font-geist-sans text-[15px]" : ""
                          }`}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="identifiantUnique"
                          className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.uniqueIdentifier")}
                        </label>
                        <input
                          id="identifiantUnique"
                          name="identifiantUnique"
                          type="text"
                          value={formData.identifiantUnique}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            handleInputChange("identifiantUnique", value)
                          }}
                          className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                            isRTL ? "text-right font-geist-sans text-[15px]" : ""
                          }`}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 3: Coordonnées Personnelles --- */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="adresse"
                        className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                          isRTL ? titleFontClass : ""
                        }`}
                      >
                        {t("newAgent.form.fields.address")}
                      </label>
                      <textarea
                        id="adresse"
                        name="adresse"
                        value={formData.adresse}
                        onChange={(e) => handleInputChange("adresse", e.target.value)}
                        rows={2}
                        className={`w-full h-[60px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] resize-none table-start ${
                          isRTL ? tableCellFontClass : ""
                        }`}
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gouvernorat"
                        className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                          isRTL ? titleFontClass : ""
                        }`}
                      >
                        {t("newAgent.form.fields.governorate")}
                      </label>
                      <Select
                        dir={isRTL ? "rtl" : "ltr"}
                        value={formData.gouvernorat}
                        onValueChange={(value) => handleInputChange("gouvernorat", value)}
                      >
                        <SelectTrigger
                          id="gouvernorat"
                          name="gouvernorat"
                          className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                            isRTL ? "text-right font-noto-naskh-arabic font-medium" : ""
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                          {getTranslatedOptions(gouvernoratOptions, isRTL).map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                                isRTL ? "font-noto-naskh-arabic font-medium" : ""
                              }`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <PhoneInputField
                          label={t("newAgent.form.fields.mobilePhone")}
                          value={formData.telephoneMobile}
                          onChange={(value) => setFormData((prev) => ({ ...prev, telephoneMobile: value }))}
                          placeholder="00 000 000"
                          isRTL={isRTL}
                        />
                      </div>
                      <div>
                        <PhoneInputField
                          label={t("newAgent.form.fields.whatsapp")}
                          value={formData.whatsapp}
                          onChange={(value) => setFormData((prev) => ({ ...prev, whatsapp: value }))}
                          placeholder="00 000 000"
                          isRTL={isRTL}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="emailPersonnel"
                          className={`block text-xs font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${
                            isRTL ? titleFontClass : ""
                          }`}
                        >
                          {t("newAgent.form.fields.personalEmail")}
                        </label>
                        <input
                          id="emailPersonnel"
                          name="emailPersonnel"
                          type="email"
                          value={formData.emailPersonnel}
                          onChange={(e) => handleInputChange("emailPersonnel", e.target.value)}
                          className={`w-full h-[36px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] ${
                            isRTL ? "text-right font-geist-sans text-[15px]" : ""
                          }`}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep > 1 && <hr className="mt-10 mb-8 border-t border-gray-300 dark:border-gray-600" />}

                <div className="flex justify-between">
                  {/* Bouton Précédent */}
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className={`flex items-center justify-center gap-2 w-32 h-10 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          isRTL ? titleFontClass : ""
                        }`}
                      >
                        {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        {t("newAgent.buttons.previous")}
                      </button>
                    )}
                  </div>

                  <div>
                    {/* Bouton Suivant */}
                    {currentStep < STEPS.length && (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className={`flex items-center justify-center gap-2 w-32 h-10 text-sm border border-gray-300 dark:border-transparent text-white rounded font-medium hover:bg-[rgb(36,124,149)] transition-colors cursor-pointer ${
                          isRTL ? titleFontClass : ""
                        }`}
                        style={{
                          backgroundColor: "rgb(14, 102, 129)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgb(36, 124, 149)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgb(14, 102, 129)"
                        }}
                      >
                        {t("newAgent.buttons.next")}
                        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Boutons de soumission finale */}
                    {currentStep === STEPS.length && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={!validateFinalSubmission()}
                          onClick={() => {
                            if (validateFinalSubmission()) {
                              setSaveAndAddAnother(true)
                              setShowConfirmDialog(true)
                            }
                          }}
                          className={`flex items-center justify-center gap-2 w-48 h-10 text-sm border border-gray-300 dark:border-transparent text-white rounded font-medium transition-colors ${
                            !validateFinalSubmission()
                              ? "bg-gray-400 cursor-not-allowed"
                              : "cursor-pointer hover:bg-[rgb(34,139,34)]"
                          } ${isRTL ? titleFontClass : ""}`}
                          style={{
                            backgroundColor: validateFinalSubmission() ? "rgb(46, 160, 67)" : "rgb(156, 163, 175)",
                          }}
                        >
                          <Save className="w-4 h-4" />
                          {t("newAgent.buttons.saveAndAdd")}
                        </button>
                        <SubmitButton isFormValid={validateFinalSubmission()} onConfirm={() => handleSubmit()} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
            {/* Toast de validation moderne */}
            {showValidationToast && validationMessage && (
              <ValidationToast message={validationMessage} onClose={closeValidationToast} />
            )}
          </div>
        </div>

        {/* Dialog de confirmation */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmSubmit}
        />

        {/* Toast Component avec position top-right */}
        <div style={{ zIndex: 10000, position: "relative" }}>
          <Toaster ref={toasterRef} defaultPosition="top-right" />
        </div>
      </div>

      {/* Styles pour les boutons radio en mode dark */}
      <style jsx>{`
        /* Mode dark uniquement - styles pour les boutons radio sexe */
        :global(.dark) input[name="sexe"] {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #6b7280; /* gray-500 - bordure grise */
          border-radius: 50%;
          background-color: transparent;
          position: relative;
          cursor: pointer;
        }

        :global(.dark) input[name="sexe"]:checked {
          border-color: #076784; /* couleur personnalisée - bordure quand sélectionné */
        }

        :global(.dark) input[name="sexe"]:checked::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background-color: #076784; /* couleur personnalisée - point central */
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        :global(.dark) input[name="sexe"]:hover {
          border-color: #065a72; /* couleur personnalisée hover - plus foncé */
        }

        :global(.dark) input[name="sexe"]:hover:checked::after {
          background-color: #065a72; /* couleur personnalisée hover - point central */
        }

        /* Styles pour le placeholder du Select en mode dark */
        :global(.dark) [data-placeholder] {
          color: #9ca3af !important; /* gray-400 */
        }
      `}</style>
    </>
  )
}
