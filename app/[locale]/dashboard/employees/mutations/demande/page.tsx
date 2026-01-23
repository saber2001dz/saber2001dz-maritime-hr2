"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Check, RotateCcw, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { gradeOptions, gouvernoratOptions } from "@/lib/selectOptions"
import { motion, AnimatePresence } from "motion/react"
import { createClient } from "@/lib/supabase/client"
import Toaster, { ToasterRef } from "@/components/ui/toast"

export default function DemandeMutationPage() {
  const params = useParams()
  const router = useRouter()
  const isRTL = params.locale === "ar"
  const matriculeInputRef = useRef<HTMLInputElement>(null)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const yearInputRef = useRef<HTMLInputElement>(null)
  const skipDayBlurFormat = useRef(false)
  const skipMonthBlurFormat = useRef(false)
  const [matriculeValue, setMatriculeValue] = useState("")
  const [prenomNomValue, setPrenomNomValue] = useState("")
  const [gradeValue, setGradeValue] = useState("")
  const [affectationActuelleValue, setAffectationActuelleValue] = useState("")
  const [causesValue, setCausesValue] = useState("")
  const [emergencyContactValue, setEmergencyContactValue] = useState("")
  const [startDateValue, setStartDateValue] = useState("")
  const [dayValue, setDayValue] = useState("")
  const [monthValue, setMonthValue] = useState("")
  const [yearValue, setYearValue] = useState("")
  const [showDateValidation, setShowDateValidation] = useState(false)
  const [progress, setProgress] = useState(50)
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [isSearching, setIsSearching] = useState(false)
  const [employeeFound, setEmployeeFound] = useState(false)
  const toasterRef = useRef<ToasterRef>(null)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [step2Progress, setStep2Progress] = useState(0)

  // États pour les données du tableau de l'étape 2 (3 gouvernorats avec 2 unités chacun)
  const [tableData, setTableData] = useState<{
    gouvernorat1: string
    direction1_1: string
    direction1_2: string
    unite1_1: string
    unite1_2: string
    gouvernorat2: string
    direction2_1: string
    direction2_2: string
    unite2_1: string
    unite2_2: string
    gouvernorat3: string
    direction3_1: string
    direction3_2: string
    unite3_1: string
    unite3_2: string
  }>({
    gouvernorat1: "",
    direction1_1: "",
    direction1_2: "",
    unite1_1: "",
    unite1_2: "",
    gouvernorat2: "",
    direction2_1: "",
    direction2_2: "",
    unite2_1: "",
    unite2_2: "",
    gouvernorat3: "",
    direction3_1: "",
    direction3_2: "",
    unite3_1: "",
    unite3_2: "",
  })

  // Fonction pour mettre à jour les données du tableau
  const updateTableData = (field: keyof typeof tableData, value: string) => {
    setTableData((prev) => ({ ...prev, [field]: value }))
  }

  // Variants pour l'animation des étapes - animation simple sans opacity
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
    }),
    center: {
      x: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
    }),
  }

  // Fonction pour vérifier si au moins un champ de date est rempli
  const hasDateInput = (): boolean => {
    return !!(dayValue || monthValue || yearValue)
  }

  // Fonction pour vérifier si la date est valide et antérieure à aujourd'hui
  const isDateValidAndPast = (): boolean => {
    if (!dayValue || !monthValue || !yearValue || yearValue.length !== 4) {
      return false
    }

    const day = parseInt(dayValue)
    const month = parseInt(monthValue)
    const year = parseInt(yearValue)

    // Vérifier que les valeurs sont dans les plages valides
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return false
    }

    // Créer la date saisie
    const inputDate = new Date(year, month - 1, day)

    // Vérifier que la date est valide (par exemple, pas le 31 février)
    if (inputDate.getDate() !== day || inputDate.getMonth() !== month - 1 || inputDate.getFullYear() !== year) {
      return false
    }

    // Vérifier que la date est antérieure à aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return inputDate < today
  }

  // Fonction pour rechercher l'employé par matricule
  const searchEmployeeByMatricule = async (matricule: string) => {
    if (!matricule || matricule.trim() === "") {
      return
    }

    setIsSearching(true)
    setEmployeeFound(false)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select("prenom, nom, grade_actuel, unite_actuelle, date_affectation")
        .eq("matricule", matricule)
        .neq("actif", "متقاعد")
        .maybeSingle()

      if (error) {
        console.error("Erreur lors de la recherche:", error)
        return
      }

      if (data) {
        // Remplir les champs avec les données trouvées
        setPrenomNomValue(`${data.prenom || ""} ${data.nom || ""}`.trim())
        setAffectationActuelleValue(data.unite_actuelle || "")
        setGradeValue(data.grade_actuel || "")

        // Remplir les champs de date si date_affectation existe
        if (data.date_affectation) {
          const dateAffectation = new Date(data.date_affectation)
          const day = dateAffectation.getDate().toString().padStart(2, "0")
          const month = (dateAffectation.getMonth() + 1).toString().padStart(2, "0")
          const year = dateAffectation.getFullYear().toString()

          setDayValue(day)
          setMonthValue(month)
          setYearValue(year)
          setShowDateValidation(true)
        }

        setEmployeeFound(true)
      } else {
        // Aucun employé trouvé - pas de toast
        setEmployeeFound(false)
      }
    } catch (error) {
      console.error("Erreur inattendue:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Fonction pour gérer le blur du champ matricule
  const handleMatriculeBlur = () => {
    handleInputBlur(matriculeValue, setMatriculeValue)
    if (matriculeValue && matriculeValue.trim() !== "") {
      searchEmployeeByMatricule(matriculeValue)
    }
  }

  // Fonction pour gérer le onBlur et vider les champs contenant que des espaces
  const handleInputBlur = (value: string, setValue: (val: string) => void) => {
    if (value && value.trim() === "") {
      setValue("")
    }
  }

  // Fonction pour formater le jour avec un zéro en préfixe si nécessaire
  const handleDayBlur = () => {
    // Si le focus a été déplacé automatiquement, ne pas formater
    if (skipDayBlurFormat.current) {
      skipDayBlurFormat.current = false
      return
    }

    if (dayValue && dayValue.length === 1) {
      setDayValue(`0${dayValue}`)
    } else {
      handleInputBlur(dayValue, setDayValue)
    }
  }

  // Fonction pour formater le mois avec un zéro en préfixe si nécessaire
  const handleMonthBlur = () => {
    // Si le focus a été déplacé automatiquement, ne pas formater
    if (skipMonthBlurFormat.current) {
      skipMonthBlurFormat.current = false
      return
    }

    if (monthValue && monthValue.length === 1) {
      setMonthValue(`0${monthValue}`)
    } else {
      handleInputBlur(monthValue, setMonthValue)
    }
  }

  // Fonction pour gérer le blur du div parent des inputs de date
  const handleDateContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Vérifier si le focus sort du container (pas vers un de ses enfants)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowDateValidation(true)
    }
  }

  // Fonction pour gérer le focus sur le div parent des inputs de date
  const handleDateContainerFocus = () => {
    setShowDateValidation(false)
  }

  // Fonction pour vérifier si tous les champs de l'étape 1 sont remplis
  const isStep1Valid = (): boolean => {
    // Vérifier si la date est complètement vide
    const isDateEmpty = !dayValue && !monthValue && !yearValue

    return !!(
      matriculeValue &&
      prenomNomValue &&
      gradeValue &&
      affectationActuelleValue &&
      !isDateEmpty && // La date ne doit pas être vide
      isDateValidAndPast() && // La date doit être valide et antérieure
      causesValue
    )
  }

  // Fonction pour gérer le passage à l'étape suivante
  const handleNext = () => {
    if (!isStep1Valid()) {
      setShowValidationErrors(true)
      setShowDateValidation(true)
      return
    }
    setDirection(1)
    setIsTransitioning(true)
    setCurrentStep(2)

    // Animer le progress avec la même durée que l'animation du contenu (300ms)
    setTimeout(() => {
      setProgress(100)
    }, 0)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  // Fonction pour enregistrer les données dans la base de données
  const saveToDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient()

      // Trouver l'employee_id à partir du matricule
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id")
        .eq("matricule", matriculeValue)
        .single()

      if (employeeError || !employeeData) {
        return { success: false, error: "employee_not_found" }
      }

      // Construire la date d'affectation au format YYYY-MM-DD
      const dateAffectation = `${yearValue}-${monthValue.padStart(2, "0")}-${dayValue.padStart(2, "0")}`

      // Insérer dans la table employee_mutations et récupérer l'ID
      const { data: mutationData, error: insertError } = await supabase
        .from("employee_mutations")
        .insert({
          employee_id: employeeData.id,
          matricule: matriculeValue,
          prenom_nom: prenomNomValue,
          grade: gradeValue,
          unite_actuelle: affectationActuelleValue,
          date_affectation: dateAffectation,
          causes: causesValue,
        })
        .select("id")
        .single()

      if (insertError || !mutationData) {
        console.error("Erreur d'insertion mutation:", insertError)
        return { success: false, error: "insert_error" }
      }

      // Préparer les données des unités demandées pour mutation_unites
      const unitesData = []

      // Gouvernorat 1 - Unité 1
      if (tableData.gouvernorat1 || tableData.direction1_1 || tableData.unite1_1) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat1 || null,
          direction: tableData.direction1_1 || null,
          unite: tableData.unite1_1 || null,
        })
      }

      // Gouvernorat 1 - Unité 2
      if (tableData.gouvernorat1 || tableData.direction1_2 || tableData.unite1_2) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat1 || null,
          direction: tableData.direction1_2 || null,
          unite: tableData.unite1_2 || null,
        })
      }

      // Gouvernorat 2 - Unité 1
      if (tableData.gouvernorat2 || tableData.direction2_1 || tableData.unite2_1) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat2 || null,
          direction: tableData.direction2_1 || null,
          unite: tableData.unite2_1 || null,
        })
      }

      // Gouvernorat 2 - Unité 2
      if (tableData.gouvernorat2 || tableData.direction2_2 || tableData.unite2_2) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat2 || null,
          direction: tableData.direction2_2 || null,
          unite: tableData.unite2_2 || null,
        })
      }

      // Gouvernorat 3 - Unité 1
      if (tableData.gouvernorat3 || tableData.direction3_1 || tableData.unite3_1) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat3 || null,
          direction: tableData.direction3_1 || null,
          unite: tableData.unite3_1 || null,
        })
      }

      // Gouvernorat 3 - Unité 2
      if (tableData.gouvernorat3 || tableData.direction3_2 || tableData.unite3_2) {
        unitesData.push({
          mutation_id: mutationData.id,
          gouvernorat: tableData.gouvernorat3 || null,
          direction: tableData.direction3_2 || null,
          unite: tableData.unite3_2 || null,
        })
      }

      // Insérer les unités demandées dans mutation_unites si des données existent
      if (unitesData.length > 0) {
        const { error: unitesInsertError } = await supabase.from("mutation_unites").insert(unitesData)

        if (unitesInsertError) {
          console.error("Erreur d'insertion unités:", unitesInsertError)
          return { success: false, error: "insert_unites_error" }
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Erreur inattendue:", error)
      return { success: false, error: "unexpected_error" }
    }
  }

  // Fonction pour enregistrer la demande de mutation
  const handleSave = async () => {
    // Étape 1: Animation remplissage du 2ème progress dans le card
    const step2Duration = 500
    const step2Interval = 25
    const step2Step = 100 / (step2Duration / step2Interval)

    await new Promise<void>((resolve) => {
      const step2Timer = setInterval(() => {
        setStep2Progress((prev) => {
          const newProgress = prev + step2Step
          if (newProgress >= 100) {
            clearInterval(step2Timer)
            resolve()
            return 100
          }
          return newProgress
        })
      }, step2Interval)
    })

    // Étape 2: Animation Progress en haut de la page
    setIsSaving(true)
    setSaveProgress(0)

    const progressDuration = 400
    const progressInterval = 20
    const progressStep = 100 / (progressDuration / progressInterval)

    await new Promise<void>((resolve) => {
      const progressTimer = setInterval(() => {
        setSaveProgress((prev) => {
          const newProgress = prev + progressStep
          if (newProgress >= 100) {
            clearInterval(progressTimer)
            resolve()
            return 100
          }
          return newProgress
        })
      }, progressInterval)
    })

    // Étape 3: Enregistrement des données dans la base de données
    const result = await saveToDatabase()

    // Afficher le toast approprié
    if (result.success) {
      toasterRef.current?.show({
        title: "تم الحفظ بنجاح",
        message: "تم حفظ طلب النقلة بنجاح",
        variant: "success",
        duration: 3000,
      })

      // Étape 4: Réinitialisation de la page après un court délai
      setTimeout(() => {
        setIsSaving(false)
        setSaveProgress(0)
        setStep2Progress(0)
        handleReset()
      }, 500)
    } else {
      setIsSaving(false)
      setSaveProgress(0)
      setStep2Progress(0)

      if (result.error === "employee_not_found") {
        toasterRef.current?.show({
          title: "خطأ",
          message: "لم يتم العثور على الموظف",
          variant: "error",
          duration: 3000,
        })
      } else if (result.error === "insert_error") {
        toasterRef.current?.show({
          title: "خطأ في الحفظ",
          message: "فشل حفظ البيانات",
          variant: "error",
          duration: 3000,
        })
      } else {
        toasterRef.current?.show({
          title: "خطأ غير متوقع",
          message: "حدث خطأ أثناء الحفظ",
          variant: "error",
          duration: 3000,
        })
      }
    }
  }

  // Fonction pour gérer le retour à l'étape précédente
  const handlePrevious = () => {
    setDirection(-1)
    setIsTransitioning(true)
    setCurrentStep(1)

    // Animer le progress avec la même durée que l'animation du contenu (300ms)
    setTimeout(() => {
      setProgress(50)
    }, 0)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  // Fonction pour réinitialiser tous les champs
  const handleReset = () => {
    setMatriculeValue("")
    setPrenomNomValue("")
    setGradeValue("")
    setAffectationActuelleValue("")
    setCausesValue("")
    setEmergencyContactValue("")
    setStartDateValue("")
    setDayValue("")
    setMonthValue("")
    setYearValue("")
    setShowDateValidation(false)
    setShowValidationErrors(false)
    setCurrentStep(1)
    setProgress(50)
    setIsTransitioning(false)
    // Réinitialiser les données du tableau de l'étape 2
    setTableData({
      gouvernorat1: "",
      direction1_1: "",
      direction1_2: "",
      unite1_1: "",
      unite1_2: "",
      gouvernorat2: "",
      direction2_1: "",
      direction2_2: "",
      unite2_1: "",
      unite2_2: "",
      gouvernorat3: "",
      direction3_1: "",
      direction3_2: "",
      unite3_1: "",
      unite3_2: "",
    })
    // Donner le focus à l'input matricule après réinitialisation
    setTimeout(() => {
      matriculeInputRef.current?.focus()
    }, 0)
  }

  // Rediriger vers la version arabe si ce n'est pas déjà le cas
  useEffect(() => {
    if (!isRTL) {
      router.replace("/ar/dashboard/employees/mutations/demande")
    }
  }, [isRTL, router])

  // Donner le focus à l'input matricule au chargement de la page
  useEffect(() => {
    if (isRTL && matriculeInputRef.current) {
      matriculeInputRef.current.focus()
    }
  }, [isRTL])

  // Ne rien afficher si ce n'est pas en mode RTL
  if (!isRTL) {
    return null
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-background p-4 md:p-6">
        {/* Progress bar de chargement en haut de la page */}
        {isSaving && (
          <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-[#076784] transition-all duration-100 ease-linear"
              style={{ width: `${saveProgress}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <Card className="w-full max-w-4xl bg-white dark:bg-card rounded-2xl shadow-lg border-0 px-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold font-noto-naskh-arabic text-gray-900 dark:text-gray-100">
                طـلــــب نــقـلـــة جــديــد
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-muted-foreground font-noto-naskh-arabic">
                  المعلــومـــات الشخـصـيــة
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      tabIndex={-1}
                      variant="ghost"
                      size="icon"
                      onClick={handleReset}
                      className="h-7 w-7 bg-transparent hover:bg-transparent text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-noto-naskh-arabic">فــســخ البيــانــات</span>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Separator className="mt-0.5 mb-3 bg-gray-300 dark:bg-gray-500" />
              <div className="flex items-center gap-4 mt-3">
                <div className="flex-1 flex flex-col gap-1">
                  <span className={`font-noto-naskh-arabic text-sm transition-colors duration-300 ${currentStep >= 2 ? "text-[#2B778F] font-semibold" : "text-gray-500 dark:text-gray-700"}`}>البيـانـات الشخصيـة</span>
                  <Progress value={currentStep >= 2 ? 100 : 0} dir="rtl" className="h-3" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className={`font-noto-naskh-arabic text-sm transition-colors duration-300 ${step2Progress >= 100 ? "text-[#2B778F] font-semibold" : "text-gray-500 dark:text-gray-700"}`}>الـوحـدات حسـب الـرغبـة</span>
                  <Progress value={step2Progress} dir="rtl" className="h-3" />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-hidden relative min-h-100">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    className="absolute top-0 left-0 w-full"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      type: "tween",
                      ease: "easeOut",
                      duration: 0.3,
                    }}
                  >
                    <CardContent className="space-y-5">
                      {/* Ligne 1: Matricule et Prénom Nom */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                        <div
                          className={`border rounded-md px-2 pt-2 relative ${
                            matriculeValue
                              ? "border-[#339370]"
                              : showValidationErrors
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <Label
                            htmlFor="matricule"
                            className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                              matriculeValue
                                ? "text-[#339370]"
                                : showValidationErrors
                                  ? "text-red-500 dark:text-red-500"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            الـــرقـــــم :
                          </Label>
                          <Input
                            ref={matriculeInputRef}
                            id="matricule"
                            placeholder="الــرقــم الشخصــي"
                            variant="lg"
                            autoComplete="new-password"
                            value={matriculeValue}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                              setMatriculeValue(value)
                            }}
                            onBlur={handleMatriculeBlur}
                            className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                          />
                          {isSearching && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 ml-1.5">
                              <Spinner className="h-4 w-4 text-[#076784]" />
                            </div>
                          )}
                          {!isSearching && matriculeValue && employeeFound && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                              <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div
                          className={`border rounded-md px-2 pt-2 relative ${
                            prenomNomValue
                              ? "border-[#339370]"
                              : showValidationErrors
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <Label
                            htmlFor="prenomNom"
                            className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                              prenomNomValue
                                ? "text-[#339370]"
                                : showValidationErrors
                                  ? "text-red-500 dark:text-red-500"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            الإســـم و اللقـــب :
                          </Label>
                          <Input
                            id="prenomNom"
                            type="text"
                            placeholder="الإســم و اللقــب"
                            variant="lg"
                            autoComplete="new-password"
                            value={prenomNomValue}
                            onChange={(e) => setPrenomNomValue(e.target.value)}
                            onBlur={() => handleInputBlur(prenomNomValue, setPrenomNomValue)}
                            className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                          />
                          {prenomNomValue && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                              <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ligne 2: Grade et Affectation Actuelle */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                        <div
                          className={`border rounded-md px-2 pt-2 relative ${
                            gradeValue
                              ? "border-[#339370]"
                              : showValidationErrors
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <Label
                            htmlFor="grade"
                            className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                              gradeValue
                                ? "text-[#339370]"
                                : showValidationErrors
                                  ? "text-red-500 dark:text-red-500"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            الــرتـبـــة :
                          </Label>
                          <Select dir="rtl" value={gradeValue} onValueChange={setGradeValue}>
                            <SelectTrigger className="w-89 font-noto-naskh-arabic bg-white dark:bg-card border-0 h-8 text-[15px] text-gray-600 dark:text-gray-300 font-medium pr-1 pb-1 data-placeholder:text-gray-300 dark:data-placeholder:text-gray-500 rounded focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0">
                              <SelectValue placeholder="اخـتـر الرتبـــة" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeOptions.map((grade) => (
                                <SelectItem
                                  key={grade.value}
                                  value={grade.value}
                                  className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                                >
                                  {grade.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {gradeValue && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                              <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div
                          className={`border rounded-md px-2 pt-2 relative ${
                            affectationActuelleValue
                              ? "border-[#339370]"
                              : showValidationErrors
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <Label
                            htmlFor="affectationActuelle"
                            className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                              affectationActuelleValue
                                ? "text-[#339370]"
                                : showValidationErrors
                                  ? "text-red-500 dark:text-red-500"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            الــوحــدة الحــاليــة :
                          </Label>
                          <Input
                            id="affectationActuelle"
                            placeholder="أدخل إسم الوحدة الحالية"
                            variant="lg"
                            autoComplete="new-password"
                            value={affectationActuelleValue}
                            onChange={(e) => setAffectationActuelleValue(e.target.value)}
                            onBlur={() => handleInputBlur(affectationActuelleValue, setAffectationActuelleValue)}
                            className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] pr-1 border-0 dark:border-0 h-8 w-62 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                          />
                          {affectationActuelleValue && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                              <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ligne 3: Date de nomination */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                        <div
                          className={`border rounded-md px-2 pt-2 relative ${
                            showDateValidation && isDateValidAndPast()
                              ? "border-[#339370]"
                              : (showDateValidation && hasDateInput() && !isDateValidAndPast()) ||
                                  (showValidationErrors && !dayValue && !monthValue && !yearValue)
                                ? "border-red-500 dark:border-red-500"
                                : "border-gray-300 dark:border-gray-600"
                          }`}
                          onBlur={handleDateContainerBlur}
                          onFocus={handleDateContainerFocus}
                        >
                          <Label
                            htmlFor="appointmentDate"
                            className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                              showDateValidation && isDateValidAndPast()
                                ? "text-[#339370]"
                                : (showDateValidation && hasDateInput() && !isDateValidAndPast()) ||
                                    (showValidationErrors && !dayValue && !monthValue && !yearValue)
                                  ? "text-red-500 dark:text-red-500"
                                  : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            تـاريــخ التعـييـــن :
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              id="jourDateAffectation"
                              placeholder="اليوم"
                              variant="lg"
                              autoComplete="new-password"
                              value={dayValue}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                                if (value === "" || value === "0" || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                                  setDayValue(value)
                                  // Passer automatiquement au champ mois si 2 chiffres sont saisis
                                  if (value.length === 2) {
                                    skipDayBlurFormat.current = true
                                    monthInputRef.current?.focus()
                                  }
                                }
                              }}
                              onBlur={handleDayBlur}
                              className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] text-center border-0 dark:border-0 h-8 w-16 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 pb-1"
                            />
                            <span className="text-gray-400 font-medium">-</span>
                            <Input
                              ref={monthInputRef}
                              id="moisDateAffectation"
                              placeholder="الشهر"
                              variant="lg"
                              autoComplete="new-password"
                              value={monthValue}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                                if (value === "" || value === "0" || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                                  setMonthValue(value)
                                  // Passer automatiquement au champ année si 2 chiffres sont saisis
                                  if (value.length === 2) {
                                    skipMonthBlurFormat.current = true
                                    yearInputRef.current?.focus()
                                  }
                                }
                              }}
                              onBlur={handleMonthBlur}
                              className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] text-center border-0 dark:border-0 h-8 w-16 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 pb-1"
                            />
                            <span className="text-gray-400 font-medium">-</span>
                            <Input
                              ref={yearInputRef}
                              id="anneeDateAffectation"
                              placeholder="السنة"
                              variant="lg"
                              autoComplete="new-password"
                              value={yearValue}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                                setYearValue(value)
                              }}
                              onBlur={() => handleInputBlur(yearValue, setYearValue)}
                              className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] text-center border-0 dark:border-0 h-8 w-20 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 pb-1"
                            />
                          </div>
                          {showDateValidation && isDateValidAndPast() && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                              <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                            </div>
                          )}
                          {showDateValidation && hasDateInput() && !isDateValidAndPast() && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-red-500/20 rounded-full p-0.5 ml-1.5">
                              <AlertCircle className="h-3 w-3 text-red-500" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          causesValue
                            ? "border-[#339370]"
                            : showValidationErrors
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="causes"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            causesValue
                              ? "text-[#339370]"
                              : showValidationErrors
                                ? "text-red-500 dark:text-red-500"
                                : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          الأسـبــــــــاب :
                        </Label>
                        <Textarea
                          id="causes"
                          placeholder="أذكـــر أسبــاب طلــب النقلــة"
                          variant="lg"
                          autoComplete="new-password"
                          value={causesValue}
                          onChange={(e) => setCausesValue(e.target.value)}
                          className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] pr-1 border-0 dark:border-0 min-h-16 w-195 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500"
                        />
                        {causesValue && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}

                {/* Étape 2 - CardContent vide */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    className="absolute top-0 left-0 w-full"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      type: "tween",
                      ease: "easeOut",
                      duration: 0.3,
                    }}
                  >
                    <CardContent className="space-y-5">
                      {/* Table des unités demandées */}
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <table className="w-full border-collapse" dir="rtl">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                              <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                                الـــولایـــة
                              </th>
                              <th className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                                الإدارة / الإقلیم
                              </th>
                              <th colSpan={2} className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-gray-300 dark:border-gray-600 text-center">
                                الوحدات المطلوبة
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* الولاية 1 - صفان */}
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <td rowSpan={2} className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12">
                                1
                              </td>
                              <td rowSpan={2} className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card min-w-45">
                                <Select dir="rtl" value={tableData.gouvernorat1} onValueChange={(value) => updateTableData("gouvernorat1", value)}>
                                  <SelectTrigger className="w-full font-noto-naskh-arabic bg-white dark:bg-card border border-gray-200 dark:border-gray-600 h-9 text-[14px] text-gray-600 dark:text-gray-300 font-medium rounded focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gouvernoratOptions.map((gov) => (
                                      <SelectItem
                                        key={gov.value}
                                        value={gov.value}
                                        className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                                      >
                                        {gov.labelAr || gov.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction1_1}
                                  onChange={(e) => updateTableData("direction1_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                1
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite1_1}
                                  onChange={(e) => updateTableData("unite1_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction1_2}
                                  onChange={(e) => updateTableData("direction1_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                2
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite1_2}
                                  onChange={(e) => updateTableData("unite1_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                            {/* الولاية 2 - صفان */}
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <td rowSpan={2} className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12">
                                2
                              </td>
                              <td rowSpan={2} className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card min-w-45">
                                <Select dir="rtl" value={tableData.gouvernorat2} onValueChange={(value) => updateTableData("gouvernorat2", value)}>
                                  <SelectTrigger className="w-full font-noto-naskh-arabic bg-white dark:bg-card border border-gray-200 dark:border-gray-600 h-9 text-[14px] text-gray-600 dark:text-gray-300 font-medium rounded focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gouvernoratOptions.map((gov) => (
                                      <SelectItem
                                        key={gov.value}
                                        value={gov.value}
                                        className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                                      >
                                        {gov.labelAr || gov.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction2_1}
                                  onChange={(e) => updateTableData("direction2_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                3
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite2_1}
                                  onChange={(e) => updateTableData("unite2_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction2_2}
                                  onChange={(e) => updateTableData("direction2_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                4
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite2_2}
                                  onChange={(e) => updateTableData("unite2_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                            {/* الولاية 3 - صفان */}
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <td rowSpan={2} className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12">
                                3
                              </td>
                              <td rowSpan={2} className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card min-w-45">
                                <Select dir="rtl" value={tableData.gouvernorat3} onValueChange={(value) => updateTableData("gouvernorat3", value)}>
                                  <SelectTrigger className="w-full font-noto-naskh-arabic bg-white dark:bg-card border border-gray-200 dark:border-gray-600 h-9 text-[14px] text-gray-600 dark:text-gray-300 font-medium rounded focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <SelectValue placeholder="" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gouvernoratOptions.map((gov) => (
                                      <SelectItem
                                        key={gov.value}
                                        value={gov.value}
                                        className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                                      >
                                        {gov.labelAr || gov.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction3_1}
                                  onChange={(e) => updateTableData("direction3_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                5
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite3_1}
                                  onChange={(e) => updateTableData("unite3_1", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.direction3_2}
                                  onChange={(e) => updateTableData("direction3_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                              <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                                6
                              </td>
                              <td className="py-2 px-3 bg-white dark:bg-card">
                                <Input
                                  placeholder=""
                                  autoComplete="new-password"
                                  value={tableData.unite3_2}
                                  onChange={(e) => updateTableData("unite3_2", e.target.value)}
                                  className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[14px] border border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ligne des boutons */}
            <CardFooter className="flex justify-between gap-3 pt-6">
              <Button
                tabIndex={-1}
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="font-noto-naskh-arabic px-3 h-11 rounded-md border-gray-300 dark:border-input hover:bg-gray-50 dark:hover:bg-input/50 text-gray-700 dark:text-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                الأسـبـــــق
              </Button>
              <Button
                tabIndex={-1}
                onClick={currentStep === 1 ? handleNext : handleSave}
                className="font-noto-naskh-arabic px-8 h-11 rounded-md bg-[#076784] hover:bg-[#2B778F] dark:bg-gray-700 dark:hover:bg-gray-800 text-white cursor-pointer"
              >
                {currentStep === 1 ? "التــالــي" : "حــفـــظ"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Toaster pour les notifications */}
        <Toaster ref={toasterRef} defaultPosition="top-right" />
      </div>
    </>
  )
}
