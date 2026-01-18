"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Building2, X, ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Stepper, Step, StepLabel, ThemeProvider } from "@mui/material"
import { CacheProvider } from "@emotion/react"
import { rtlTheme, ltrTheme, cacheRtl, cacheLtr } from "@/lib/mui-rtl-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import Toaster, { ToasterRef } from "@/components/ui/toast"
import { useParams } from "next/navigation"
import { getDirection } from "@/lib/direction"
import type { Locale } from "@/lib/types"

// Les valeurs des ENUM sont maintenant récupérées dynamiquement depuis la base de données

// Valeurs pour le combo Direction/District (niveau_1)
const DIRECTION_VALUES = [
  "إدارة حرس السواحل",
  "إقليم الحرس البحري بالشمال",
  "إفليم الحرس البحري بالساحل",
  "إقليم الحرس البحري بالوسط",
  "إفليم الحرس البحري بالجنوب"
]

// STEPS will be dynamically generated with translations

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

export default function NewUnitePage() {
  const router = useRouter()
  const toasterRef = useRef<ToasterRef>(null)
  
  // Locale setup
  const params = useParams()
  const locale = params.locale as Locale
  const isRTL = locale === "ar"

  // Steps with hardcoded translations
  const STEPS = [
    { id: 1, name: isRTL ? "المعلومات الأساسية" : "Informations de Base" },
    { id: 2, name: isRTL ? "التسلسل الإداري" : "Hiérarchie Organisationnelle" },
    { id: 3, name: isRTL ? "معلومات الاتصال" : "Informations de Contact" },
    { id: 4, name: isRTL ? "الموقع الجغرافي" : "Localisation" },
  ]
  
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showValidationToast, setShowValidationToast] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    unite: "",
    unite_matricule: "",
    unite_type: "",
    unite_categorie: "",
    unite_classe: "",
    unite_description: "",
    unite_telephone1: "",
    unite_telephone2: "",
    unite_telephone3: "",
    unite_indicatif: "",
    unite_email: "",
    unite_batiment: "",
    unite_adresse: "",
    unite_port: "",
    unite_gps: "",
    niveau_1: "",
    niveau_2: "",
    niveau_3: "",
    navigante: "",
  })

  const [secteurOptions, setSecteurOptions] = useState<string[]>([])
  const [brigadeOptions, setBrigadeOptions] = useState<string[]>([])
  const [categorieOptions, setCategorieOptions] = useState<string[]>([])
  const [uniteNameError, setUniteNameError] = useState<string>("")
  const [isCheckingName, setIsCheckingName] = useState(false)

  const [isProgressCompleting, setIsProgressCompleting] = useState(false)
  // État pour tracking du résultat
  const [isPending, startTransition] = useTransition()
  
  // Phone validation errors
  const [phoneErrors, setPhoneErrors] = useState({
    unite_telephone1: "",
    unite_telephone2: "",
    unite_telephone3: "",
  })

  // Phone number formatting and validation
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 8 digits
    return digits.slice(0, 8)
  }

  const validatePhoneNumber = (value: string, fieldName: string) => {
    if (!value) {
      setPhoneErrors(prev => ({ ...prev, [fieldName]: "" }))
      return true
    }

    const digits = value.replace(/\D/g, '')
    if (digits.length !== 8) {
      setPhoneErrors(prev => ({
        ...prev,
        [fieldName]: isRTL ? "يجب أن يحتوي رقم الهاتف على 8 أرقام بالضبط" : "Le numéro de téléphone doit contenir exactement 8 chiffres"
      }))
      return false
    }

    setPhoneErrors(prev => ({ ...prev, [fieldName]: "" }))
    return true
  }

  // Function to check if unit name already exists
  const checkUniteNameExists = async (uniteName: string) => {
    if (!uniteName.trim()) {
      setUniteNameError("")
      return false
    }

    setIsCheckingName(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("unite").select("unite").ilike("unite", uniteName.trim()).limit(1)

      if (error) {
        console.error("Error checking unit name:", error)
        setUniteNameError("")
        return false
      }

      const exists = data && data.length > 0
      setUniteNameError(exists ? isRTL ? "هذا اسم الوحدة موجود بالفعل في قاعدة البيانات" : "Ce nom d'unité existe déjà dans la base de données" : "")
      return exists
    } catch (error) {
      console.error("Error checking unit name:", error)
      setUniteNameError("")
      return false
    } finally {
      setIsCheckingName(false)
    }
  }

  // Handle blur validation for unit name
  const handleUniteNameBlur = async () => {
    if (formData.unite.trim().length > 0) {
      const exists = await checkUniteNameExists(formData.unite)
      if (exists) {
        // Le toast d'erreur sera géré par l'état uniteNameError et affiché inline
      }
    } else {
      setUniteNameError("")
    }
  }

  // Handle blur validation for phone numbers
  const handlePhoneBlur = (fieldName: string, value: string) => {
    validatePhoneNumber(value, fieldName)
  }

  // Fetch unites options on component mount
  useEffect(() => {
    const fetchUniteOptions = async () => {
      const supabase = createClient()

      // Fetch categorie options from ENUM dynamically from database
      const { data: categorieData, error: categorieError } = await supabase.rpc(
        'get_enum_values',
        { enum_name: 'categorie_unite_enum' }
      )

      if (!categorieError && categorieData) {
        setCategorieOptions(categorieData.map((item: { value: string }) => item.value))
      } else {
        // Fallback to hardcoded values if RPC fails
        console.error('Error fetching categorie enum:', categorieError)
        const categorieValues = [
          "إدارة حرس السواحل",
          "إقليم بحري",
          "منطقة بحرية",
          "إدارة فرعية",
          "طوافة سريعة 35 متر",
          "فرقة بحرية",
          "فرقة ملاحة",
          "فرقة صيانة",
          "فرقة إستطلاع و دعم عملياتي بحري",
          "فرقة تدخل سريع بحري",
          "فرقة توقي من الإرهاب",
          "خافرة 23 متر",
          "خافرة 20 متر",
          "خافرة 17 متر",
          "مركز بحري",
          "مركز بحري عملياتي",
          "مركز إرشاد",
          "مركز",
          "فصيل",
          "برج مراقبة",
          "محطة رصد",
          "زورق سريع 16 متر",
          "زورق سريع 15 متر",
          "زورق سريع 14 متر",
          "زورق سريع 12 متر",
          "زورق سريع برق",
          "زورق سريع صقر",
          "مصلحة",
          "قسم",
          "مكتب",
          "حضيرة",
          "خلية",
          "حصة إستمرار"
        ]
        setCategorieOptions(categorieValues)
      }

      // Fetch secteur options
      const { data: secteurData } = await supabase
        .from("unite")
        .select("unite")
        .in("unite_categorie", ["منطقة بحرية", "إدارة فرعية", "طوافة سريعة 35 متر"])
        .order("unite")

      if (secteurData) {
        // Remove duplicates using Set
        const uniqueSecteurs = Array.from(new Set(secteurData.map((item: { unite: string }) => item.unite))) as string[]
        setSecteurOptions(uniqueSecteurs)
      }

      // Fetch brigade options
      const { data: brigadeData } = await supabase
        .from("unite")
        .select("unite")
        .in("unite_categorie", [
          "فرقة بحرية",
          "خافرة 23 متر",
          "خافرة 20 متر",
          "خافرة 17 متر",
          "مصلحة",
        ])
        .order("unite")

      if (brigadeData) {
        // Remove duplicates using Set
        const uniqueBrigades = Array.from(new Set(brigadeData.map((item: { unite: string }) => item.unite))) as string[]
        setBrigadeOptions(uniqueBrigades)
      }
    }

    fetchUniteOptions()
  }, [])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    // Handle phone number fields
    if (field.includes("telephone") && typeof value === "string") {
      const formattedValue = formatPhoneNumber(value)
      setFormData((prev) => ({ ...prev, [field]: formattedValue }))
      return
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear unit name error when user starts typing again
    if (field === "unite" && uniteNameError) {
      setUniteNameError("")
    }
  }

  // Navigation functions
  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      if (validateCurrentStep()) {
        setCurrentStep((prev) => prev + 1)
        setShowValidationToast(false)
      } else {
        const message = getValidationMessage()
        if (message) {
          setValidationMessage(message)
          setShowValidationToast(true)
          setTimeout(() => {
            setShowValidationToast(false)
          }, 10000)
        }
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const closeValidationToast = () => {
    setShowValidationToast(false)
  }

  // Validation functions
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Informations de Base
        return !!(
          formData.unite.trim() &&
          formData.unite_categorie &&
          !uniteNameError &&
          !isCheckingName
        )
      case 2: // Hiérarchie Organisationnelle
        return true // Toujours valide car les champs sont optionnels sauf niveau_1 (déjà validé à l'étape 1)
      case 3: // Informations de Contact
        // Check if any phone numbers have errors
        const hasPhoneErrors = Object.values(phoneErrors).some(error => error !== "")
        return !hasPhoneErrors
      case 4: // Localisation
        return true // Tous les champs sont optionnels
      default:
        return false
    }
  }

  const validateFinalSubmission = (): boolean => {
    return !!(
      formData.unite.trim() &&
      formData.unite_categorie &&
      !uniteNameError &&
      !isCheckingName
    )
  }

  const getValidationMessage = (): string | null => {
    if (validateCurrentStep()) return null

    switch (currentStep) {
      case 1:
        if (!formData.unite.trim()) return isRTL ? "اسم الوحدة مطلوب" : "Le nom de l'unité est requis"
        if (!formData.unite_categorie) return isRTL ? "فئة الوحدة مطلوبة" : "La catégorie d'unité est requise"
        if (uniteNameError) return uniteNameError
        if (isCheckingName) return isRTL ? "جاري التحقق من الاسم..." : "Vérification du nom en cours..."
        break
      case 2:
      case 3:
      case 4:
        return null
    }
    return null
  }

  const createUniteAction = async (formDataObj: FormData) => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("unite")
        .insert([
          {
            unite: (formDataObj.get("unite") as string) || null,
            unite_matricule: (formDataObj.get("unite_matricule") as string) || null,
            unite_type: (formDataObj.get("unite_type") as string) || null,
            unite_categorie: (formDataObj.get("unite_categorie") as string) || null,
            unite_classe: (formDataObj.get("unite_classe") as string) || null,
            unite_description: (formDataObj.get("unite_description") as string) || null,
            unite_telephone1: (formDataObj.get("unite_telephone1") as string) || null,
            unite_telephone2: (formDataObj.get("unite_telephone2") as string) || null,
            unite_telephone3: (formDataObj.get("unite_telephone3") as string) || null,
            unite_indicatif: (formDataObj.get("unite_indicatif") as string) || null,
            unite_email: (formDataObj.get("unite_email") as string) || null,
            unite_batiment: (formDataObj.get("unite_batiment") as string) || null,
            unite_adresse: (formDataObj.get("unite_adresse") as string) || null,
            unite_port: (formDataObj.get("unite_port") as string) || null,
            unite_gps: (formDataObj.get("unite_gps") as string) || null,
            niveau_1: (formDataObj.get("niveau_1") as string) || null,
            niveau_2: (formDataObj.get("niveau_2") as string) || null,
            niveau_3: (formDataObj.get("niveau_3") as string) || null,
            navigante: formDataObj.get("navigante") === "true",
          },
        ])
        .select()

      if (error) {
        return {
          type: "error",
          message: isRTL ? "خطأ في إنشاء الوحدة" : "Erreur lors de la création de l'unité",
          errors: { general: [error.message] },
        }
      }

      return {
        type: "success",
        message: isRTL ? "تم إنشاء الوحدة بنجاح" : "Unité créée avec succès",
        redirect: "/dashboard/unite/table",
      }
    } catch (error) {
      return {
        type: "error",
        message: isRTL ? "خطأ غير معروف" : "Erreur inconnue",
        errors: { general: [isRTL ? "خطأ في الاتصال" : "Erreur de connexion"] },
      }
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (currentStep === STEPS.length) {
      if (!validateFinalSubmission()) {
        toasterRef.current?.show({
          title: isRTL ? "حقول مطلوبة مفقودة" : "Champs requis manquants",
          message: isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Veuillez remplir tous les champs obligatoires",
          variant: "error",
          duration: 3000,
        })
        return
      }
      setShowConfirmDialog(true)
    }
  }

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false)

    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString())
    })

    startTransition(async () => {
      const result = await createUniteAction(formDataObj)

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
          : result.message || isRTL ? "خطأ غير معروف" : "Erreur inconnue"
        toasterRef.current?.show({
          title: isRTL ? "فشل في الحفظ" : "Échec de l'enregistrement",
          message: fieldErrors,
          variant: "error",
          duration: 5000,
        })
        return
      }

      if (result?.type === "success") {
        setIsProgressCompleting(true)

        toasterRef.current?.show({
          title: isRTL ? "تم حفظ الوحدة بنجاح" : "Unité enregistrée avec succès",
          message: isRTL ? "جاري التوجيه إلى جدول الوحدات..." : "Redirection vers la table des unités...",
          variant: "success",
          duration: 3000,
        })

        setTimeout(() => {
          router.push("/dashboard/unite/table")
        }, 1200)
      }
    })
  }

  // Step Indicator Component
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
                  fontFamily: isRTL ? "'Noto Naskh Arabic', serif" : "inherit",
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

  // Validation Toast Component
  const ValidationToast = ({ message, onClose }: { message: string; onClose: () => void }) => {
    const getTitle = (message: string) => {
      if (message.includes("existe déjà") || message.includes("موجود")) {
        return isRTL ? "اسم الوحدة موجود" : "Nom d'unité existant"
      }
      return isRTL ? "حقل مطلوب مفقود" : "Champs requis manquant"
    }

    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
        <div className="bg-white dark:bg-[#1C1C1C] border border-amber-200 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-[320px] max-w-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{getTitle(message)}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
            </div>
            <button onClick={onClose} className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    )
  }

  function SubmitButton({ onConfirm }: { onConfirm: () => void }) {
    return (
      <button
        type="button"
        disabled={true}
        onClick={onConfirm}
        className={`flex items-center justify-center gap-2 w-32 h-10 text-sm border border-gray-300 dark:border-transparent text-white rounded font-medium transition-colors bg-gray-400 cursor-not-allowed ${isRTL ? 'font-noto-naskh-arabic' : ""}`}
        style={{
          backgroundColor: "rgb(156, 163, 175)",
        }}
      >
        <Save className="w-4 h-4" />
        <span className={isRTL ? 'font-noto-naskh-arabic' : ""}>{isRTL ? "حفظ" : "Enregistrer"}</span>
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
            className={`bg-white dark:bg-[#1C1C1C] rounded-lg shadow-2xl mx-4 w-full max-w-lg border border-gray-200 dark:border-[#393A41] pointer-events-auto transform transition-all duration-300 ease-out ${
              isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <div className={`flex ${isRTL ? "space-x-reverse" : "items-center"} space-x-2`}>
                <Building2 className="h-5 w-5 text-[#076784]" />
                <h2 className={`${isRTL ? "text-base mr-2 -mb-2" : "text-lg"} font-semibold text-[#076784] dark:text-[#80D5D4] ${isRTL ? 'font-noto-naskh-arabic mt-0.5' : ''}`}>{isRTL ? "تأكيد الحفظ" : "Confirmation d'enregistrement"}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
              >
                <X className="h-6 w-6 cursor-pointer" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 px-6">
              <p className={`text-gray-700 dark:text-gray-300 mb-8 mt-4 ${isRTL ? 'text-right font-noto-naskh-arabic' : "text-center"}`}>
                {isRTL ? "هل أنت متأكد من أنك تريد حفظ هذه الوحدة الجديدة؟" : "Êtes-vous sûr de vouloir enregistrer cette nouvelle unité ?"}
              </p>

              <div className={`flex justify-end ${isRTL ? "space-x-reverse gap-3" : ""} space-x-3`}>
                <button
                  onClick={onClose}
                  className={`px-5 py-2.5 text-[14px] text-gray-500 border border-border dark:border-transparent rounded-md hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    isRTL ? 'font-noto-naskh-arabic' : ""
                  }`}
                >
                  {isRTL ? "إلغاء" : "Annuler"}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 bg-[#076784] text-white text-[14px] rounded-md hover:bg-[#065a72] transition-all duration-200 flex items-center ${
                    isRTL ? "space-x-reverse gap-2" : ""
                  } space-x-2 cursor-pointer hover:shadow-md active:scale-95`}
                >
                  <Save className="h-4 w-4" />
                  <span className={isRTL ? 'font-noto-naskh-arabic' : ""}>{isRTL ? "حفظ" : "Enregistrer"}</span>
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
      <ProgressBar isVisible={isPending} isCompleting={isProgressCompleting} />
      <div className="min-h-screen pb-12 bg-[#F4F5F9] dark:bg-[#26272A]" dir={getDirection(locale)}>
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>{isRTL ? "وحدة جديدة" : "Nouvelle Unité"}</h1>
          </div>
        </div>

        <div className="mx-6 mb-6">
          <div className="bg-white dark:bg-[#1C1C1C] rounded border border-gray-200 dark:border-[#393A41]" style={{ width: "75%" }}>
            <div className="px-8 py-4 rounded-t border-b border-gray-200 dark:border-b-0 bg-[rgb(236,243,245)] dark:bg-[#232A2B]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[rgb(14,102,129)] dark:text-[#80D5D4]" />
                  <h2 className={`text-lg font-medium text-[rgb(14,102,129)] dark:text-[#80D5D4] ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                    {STEPS.find((s) => s.id === currentStep)?.name || isRTL ? "اسم الوحدة" : "Nom de l'Unité"}
                  </h2>
                </div>
                <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                  {isRTL ? `الخطوة ${currentStep} من ${STEPS.length}` : `Étape ${currentStep} sur ${STEPS.length}`}
                </span>
              </div>
            </div>

            <form id="uniteWizardForm" autoComplete="off">
              <div className="p-8">
                <StepIndicator />

                {/* --- ÉTAPE 1: Informations de Base --- */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "اسم الوحدة" : "Nom de l'Unité"} *
                        </label>
                        <input
                          id="unite"
                          name="unite"
                          type="text"
                          autoComplete="off"
                          autoFocus
                          value={formData.unite}
                          onChange={(e) => handleInputChange("unite", e.target.value)}
                          onBlur={handleUniteNameBlur}
                          className={`w-full h-9 px-2 py-1.5 text-sm border rounded focus:outline-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white ${
                            uniteNameError
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 dark:border-[#565656] focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)]"
                          } ${isRTL ? "text-right" : ""} ${isRTL ? 'font-noto-naskh-arabic' : ""}`}
                          placeholder={isRTL ? "مثال: الفرقة البحرية بجرجيس" : "Ex: Brigade Maritime Zarzis"}
                          required
                        />
                        <div className="h-2 mt-0.5">
                          {uniteNameError && (
                            <p className="text-red-500 text-[9px] flex items-center gap-1 leading-tight">
                              <span className="inline-block w-0.5 h-0.5 bg-red-500 rounded-full"></span>
                              {uniteNameError}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="unite_matricule" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "الرقم المتسلسل" : "Matricule"}
                        </label>
                        <input
                          id="unite_matricule"
                          name="unite_matricule"
                          type="text"
                          autoComplete="off"
                          value={formData.unite_matricule}
                          onChange={(e) => handleInputChange("unite_matricule", e.target.value)}
                          className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                          placeholder={isRTL ? "مثال : 3501" : "Ex: UNI-001"}
                        />
                        <div className="h-2 mt-0.5"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite_categorie" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "الفئة" : "Catégorie"} *
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.unite_categorie}
                          onValueChange={(value) => handleInputChange("unite_categorie", value)}
                          required
                        >
                          <SelectTrigger
                            id="unite_categorie"
                            name="unite_categorie"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر الفئة" : "Sélectionnez une catégorie"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                            {categorieOptions.map((categorie) => (
                              <SelectItem
                                key={categorie}
                                value={categorie}
                                className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                              >
                                {categorie}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="h-4 mt-0.5"></div>
                      </div>
                      <div>
                        <label htmlFor="unite_type" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "النوع" : "Type"}
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.unite_type}
                          onValueChange={(value) => handleInputChange("unite_type", value)}
                        >
                          <SelectTrigger
                            id="unite_type"
                            name="unite_type"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر النوع" : "Sélectionnez un type"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                            <SelectItem
                              value="وحدة نشيطة"
                              className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                            >
                              {isRTL ? 'وحدة نشيطة' : 'Opérationnelle'}
                            </SelectItem>
                            <SelectItem
                              value="وحدة إدارية"
                              className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                            >
                              {isRTL ? 'وحدة إدارية' : 'Administrative'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="h-2 mt-0.5"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite_classe" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "الصنف" : "Classe"}
                        </label>
                        <input
                          id="unite_classe"
                          name="unite_classe"
                          type="text"
                          autoComplete="off"
                          value={formData.unite_classe}
                          onChange={(e) => handleInputChange("unite_classe", e.target.value)}
                          className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                          placeholder={isRTL ? "مثال : صنف أ" : "Ex: Classe A"}
                        />
                        <div className="h-2 mt-0.5"></div>
                      </div>
                      <div>
                        <label htmlFor="navigante" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "نوع الوحدة" : "Type d'Unité"}
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.navigante}
                          onValueChange={(value) => handleInputChange("navigante", value)}
                        >
                          <SelectTrigger
                            id="navigante"
                            name="navigante"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر نوع الوحدة" : "Sélectionnez le type"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                            <SelectItem
                              value="false"
                              className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                            >
                              {isRTL ? 'وحدة عائمة' : 'Non navigante'}
                            </SelectItem>
                            <SelectItem
                              value="true"
                              className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                            >
                              {isRTL ? "وحدة قارة" : "Navigante"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className={`text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'حدد إذا كانت هذه الوحدة تعمل في البحر أم لا' : 'Sélectionnez si cette unité opère en mer'}
                        </p>
                      </div>
                    </div>


                    <div>
                      <label htmlFor="unite_description" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                        {isRTL ? 'وصف الوحدة' : 'Description de l\'Unité'}
                      </label>
                      <textarea
                        id="unite_description"
                        name="unite_description"
                        rows={2}
                        autoComplete="off"
                        value={formData.unite_description}
                        onChange={(e) => handleInputChange("unite_description", e.target.value)}
                        className="w-full h-15 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] resize-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                        placeholder={isRTL ? "وصف تفصيلي للوحدة..." : "Description détaillée de l'unité..."}
                      />
                      <div className="h-4 mt-0.5"></div>
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 2: Hiérarchie Organisationnelle --- */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {/* Ligne 1: Direction/District et Niveau 2 côte à côte */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="niveau_1" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'الإدارة / المقاطعة' : 'Direction / District'}
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.niveau_1}
                          onValueChange={(value) => handleInputChange("niveau_1", value)}
                        >
                          <SelectTrigger
                            id="niveau_1"
                            name="niveau_1"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر الإدارة / المقاطعة" : "Sélectionnez une direction/district"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                            {DIRECTION_VALUES.map((direction: string, index: number) => (
                              <SelectItem
                                key={`${direction}-${index}`}
                                value={direction}
                                className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                              >
                                {direction}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="h-2 mt-0.5"></div>
                      </div>
                      <div>
                        <label htmlFor="niveau_2" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "المستوى الثاني" : "Niveau 2"}
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.niveau_2}
                          onValueChange={(value) => handleInputChange("niveau_2", value)}
                        >
                          <SelectTrigger
                            id="niveau_2"
                            name="niveau_2"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر المستوى الثاني" : "Sélectionnez un secteur/sous direction"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 max-h-75 overflow-y-auto">
                            {secteurOptions.map((secteur) => (
                              <SelectItem
                                key={secteur}
                                value={secteur}
                                className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                              >
                                {secteur}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="h-2 mt-0.5"></div>
                      </div>
                    </div>
                    
                    {/* Ligne 2: Niveau 3 sous Direction/District avec la même largeur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="niveau_3" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ''}`}>
                          {isRTL ? "المستوى الثالث" : "Niveau 3"}
                        </label>
                        <Select
                          dir={isRTL ? "rtl" : "ltr"}
                          value={formData.niveau_3}
                          onValueChange={(value) => handleInputChange("niveau_3", value)}
                        >
                          <SelectTrigger
                            id="niveau_3"
                            name="niveau_3"
                            className={`w-full h-9! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] dark:focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] dark:data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                              isRTL ? "text-start" : ""
                            } ${isRTL ? "font-noto-naskh-arabic font-medium" : ""}`}
                          >
                            <SelectValue placeholder={isRTL ? "اختر المستوى الثالث" : "Sélectionnez une brigade/service"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 max-h-75 overflow-y-auto">
                            {brigadeOptions.map((brigade) => (
                              <SelectItem
                                key={brigade}
                                value={brigade}
                                className={`px-2 py-1.5 text-[13px] hover:bg-[rgb(236,243,245)] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${isRTL ? 'font-noto-naskh-arabic font-medium' : ''}`}
                              >
                                {brigade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="h-2 mt-0.5"></div>
                      </div>
                      <div></div>
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 3: Informations de Contact --- */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite_telephone1" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'الهاتف الرئيسي' : 'Téléphone principal'}
                        </label>
                        <input
                          id="unite_telephone1"
                          name="unite_telephone1"
                          type="tel"
                          autoComplete="off"
                          autoFocus
                          value={formData.unite_telephone1}
                          onChange={(e) => handleInputChange("unite_telephone1", e.target.value)}
                          onBlur={(e) => handlePhoneBlur("unite_telephone1", e.target.value)}
                          className={`w-full h-9 px-2 py-1.5 text-sm border rounded focus:outline-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white ${
                            phoneErrors.unite_telephone1
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 dark:border-[#565656] focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)]"
                          }`}
                          placeholder={isRTL ? "12345678 (8 أرقام)" : "12345678 (8 chiffres)"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <div className="h-2 mt-0.5">
                          {phoneErrors.unite_telephone1 && (
                            <p className="text-red-500 text-[9px] flex items-center gap-1 leading-tight">
                              <span className="inline-block w-0.5 h-0.5 bg-red-500 rounded-full"></span>
                              {phoneErrors.unite_telephone1}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="unite_telephone2" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'الهاتف الثانوي' : 'Téléphone secondaire'}
                        </label>
                        <input
                          id="unite_telephone2"
                          name="unite_telephone2"
                          type="tel"
                          autoComplete="off"
                          value={formData.unite_telephone2}
                          onChange={(e) => handleInputChange("unite_telephone2", e.target.value)}
                          onBlur={(e) => handlePhoneBlur("unite_telephone2", e.target.value)}
                          className={`w-full h-9 px-2 py-1.5 text-sm border rounded focus:outline-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white ${
                            phoneErrors.unite_telephone2
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 dark:border-[#565656] focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)]"
                          }`}
                          placeholder={isRTL ? "12345678 (8 أرقام)" : "12345678 (8 chiffres)"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <div className="h-2 mt-0.5">
                          {phoneErrors.unite_telephone2 && (
                            <p className="text-red-500 text-[9px] flex items-center gap-1 leading-tight">
                              <span className="inline-block w-0.5 h-0.5 bg-red-500 rounded-full"></span>
                              {phoneErrors.unite_telephone2}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite_telephone3" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'هاتف 5 أرقـام' : 'Téléphone d\'urgence'}
                        </label>
                        <input
                          id="unite_telephone3"
                          name="unite_telephone3"
                          type="tel"
                          autoComplete="off"
                          value={formData.unite_telephone3}
                          onChange={(e) => handleInputChange("unite_telephone3", e.target.value)}
                          onBlur={(e) => handlePhoneBlur("unite_telephone3", e.target.value)}
                          className={`w-full h-9 px-2 py-1.5 text-sm border rounded focus:outline-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white ${
                            phoneErrors.unite_telephone3
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-300 dark:border-[#565656] focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)]"
                          }`}
                          placeholder={isRTL ? "12345 (5 أرقام)" : "12345 (5 chiffres)"}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <div className="h-2 mt-0.5">
                          {phoneErrors.unite_telephone3 && (
                            <p className="text-red-500 text-[9px] flex items-center gap-1 leading-tight">
                              <span className="inline-block w-0.5 h-0.5 bg-red-500 rounded-full"></span>
                              {phoneErrors.unite_telephone3}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="unite_indicatif" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'رمــز النــداء' : 'Indicatif radio'}
                        </label>
                        <input
                          id="unite_indicatif"
                          name="unite_indicatif"
                          type="text"
                          autoComplete="off"
                          value={formData.unite_indicatif}
                          onChange={(e) => handleInputChange("unite_indicatif", e.target.value)}
                          className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                          placeholder={isRTL ? "مثال: TUN-001" : "Ex: TUN-001"}
                        />
                        <div className="h-2 mt-0.5"></div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="unite_email" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                        {isRTL ? 'رقــم التراسل' : 'Adresse email'}
                      </label>
                      <input
                        id="unite_email"
                        name="unite_email"
                        type="email"
                        autoComplete="off"
                        value={formData.unite_email}
                        onChange={(e) => handleInputChange("unite_email", e.target.value)}
                        className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                        placeholder={isRTL ? "مثال: unite@garde-cotes.tn" : "Ex: unite@garde-cotes.tn"}
                      />
                      <div className="h-4 mt-0.5"></div>
                    </div>
                  </div>
                )}

                {/* --- ÉTAPE 4: Localisation --- */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="unite_batiment" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'المبنى' : 'Bâtiment / Base'}
                        </label>
                        <input
                          id="unite_batiment"
                          name="unite_batiment"
                          type="text"
                          autoComplete="off"
                          autoFocus
                          value={formData.unite_batiment}
                          onChange={(e) => handleInputChange("unite_batiment", e.target.value)}
                          className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                          placeholder={isRTL ? "" : "Ex: Base navale de Bizerte"}
                        />
                        <div className="h-2 mt-0.5"></div>
                      </div>
                      <div>
                        <label htmlFor="unite_port" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                          {isRTL ? 'ميناء الإرتفاق' : 'Port d\'attache'}
                        </label>
                        <input
                          id="unite_port"
                          name="unite_port"
                          type="text"
                          autoComplete="off"
                          value={formData.unite_port}
                          onChange={(e) => handleInputChange("unite_port", e.target.value)}
                          className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                          placeholder={isRTL ? "مثال: ميناء بنزرت" : "Ex: Port de Bizerte"}
                        />
                        <div className="h-2 mt-0.5"></div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="unite_adresse" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                        {isRTL ? 'العنوان الكامل' : 'Adresse complète'}
                      </label>
                      <textarea
                        id="unite_adresse"
                        name="unite_adresse"
                        rows={2}
                        autoComplete="off"
                        value={formData.unite_adresse}
                        onChange={(e) => handleInputChange("unite_adresse", e.target.value)}
                        className="w-full h-15 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] resize-none bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                        placeholder={isRTL ? "العنوان الكامل للوحدة..." : "Adresse complète de l'unité..."}
                      />
                      <div className="h-4 mt-0.5"></div>
                    </div>

                    <div>
                      <label htmlFor="unite_gps" className={`block text-[11px] font-medium text-gray-700 dark:text-[#D0D0D0] mb-1 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                        {isRTL ? 'إحداثيات GPS' : 'Coordonnées GPS'}
                      </label>
                      <input
                        id="unite_gps"
                        name="unite_gps"
                        type="text"
                        autoComplete="off"
                        value={formData.unite_gps}
                        onChange={(e) => handleInputChange("unite_gps", e.target.value)}
                        className="w-full h-9 px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] dark:focus:border-[rgb(7,103,132)] bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white"
                        placeholder={isRTL ? "مثال: 36.8065,10.1815 (خط العرض،خط الطول)" : "Ex: 36.8065,10.1815 (latitude,longitude)"}
                      />
                      <p className={`text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ${isRTL ? 'font-noto-naskh-arabic' : ""}`}>
                        {isRTL ? 'النموذج: خط العرض، خط الطول (عشري)' : 'Format: latitude,longitude (décimal)'}
                      </p>
                      <div className="h-4 mt-0.5"></div>
                    </div>
                  </div>
                )}

                {currentStep > 1 && <hr className="mt-6 mb-6 border-t border-gray-300 dark:border-gray-600" />}

                <div className="flex justify-between">
                  {/* Bouton Précédent */}
                  <div>
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className={`flex items-center justify-center gap-2 w-32 h-10 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                          isRTL ? 'font-noto-naskh-arabic' : ""
                        }`}
                      >
                        {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        {isRTL ? "السابق" : "Précédent"}
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
                          isRTL ? 'font-noto-naskh-arabic' : ""
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
                        {isRTL ? "التالي" : "Suivant"}
                        {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Bouton de soumission finale */}
                    {currentStep === STEPS.length && (
                      <SubmitButton onConfirm={() => handleSubmit()} />
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
    </>
  )
}
