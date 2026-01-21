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
import { gradeOptions } from "@/lib/selectOptions"
import { motion, AnimatePresence } from "motion/react"

export default function DemandeMutationPage() {
  const params = useParams()
  const router = useRouter()
  const isRTL = params.locale === "ar"
  const matriculeInputRef = useRef<HTMLInputElement>(null)
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

  // Variants pour l'animation des étapes
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
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

  // Fonction pour gérer le onBlur et vider les champs contenant que des espaces
  const handleInputBlur = (value: string, setValue: (val: string) => void) => {
    if (value && value.trim() === "") {
      setValue("")
    }
  }

  // Fonction pour formater le jour avec un zéro en préfixe si nécessaire
  const handleDayBlur = () => {
    if (dayValue && dayValue.length === 1) {
      setDayValue(`0${dayValue}`)
    } else {
      handleInputBlur(dayValue, setDayValue)
    }
  }

  // Fonction pour formater le mois avec un zéro en préfixe si nécessaire
  const handleMonthBlur = () => {
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

  // Fonction pour gérer le passage à l'étape suivante
  const handleNext = () => {
    setDirection(1)
    setIsTransitioning(true)
    setCurrentStep(2)
    setProgress(100)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  // Fonction pour gérer le retour à l'étape précédente
  const handlePrevious = () => {
    setDirection(-1)
    setIsTransitioning(true)
    setCurrentStep(1)
    setProgress(50)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
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
    setCurrentStep(1)
    setProgress(50)
    setIsTransitioning(false)
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
    <div className="min-h-screen bg-gray-100 dark:bg-background p-4 md:p-6">
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
              <Progress value={progress} dir="rtl" className="h-3 flex-1" />
              <span className="font-noto-naskh-arabic text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                2/{currentStep} مكتملة
              </span>
            </div>
          </CardHeader>
          <div className="overflow-hidden relative min-h-100">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
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
                        className={`border rounded-md px-2 pt-2 relative ${matriculeValue ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"}`}
                      >
                        <Label
                          htmlFor="matricule"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${matriculeValue ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"}`}
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
                          onBlur={() => handleInputBlur(matriculeValue, setMatriculeValue)}
                          className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                        />
                        {matriculeValue && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div
                        className={`border rounded-md px-2 pt-2 relative ${prenomNomValue ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"}`}
                      >
                        <Label
                          htmlFor="prenomNom"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${prenomNomValue ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"}`}
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
                        className={`border rounded-md px-2 pt-2 relative ${gradeValue ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"}`}
                      >
                        <Label
                          htmlFor="grade"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${gradeValue ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"}`}
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
                        className={`border rounded-md px-2 pt-2 relative ${affectationActuelleValue ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"}`}
                      >
                        <Label
                          htmlFor="affectationActuelle"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${affectationActuelleValue ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"}`}
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
                            : showDateValidation && hasDateInput() && !isDateValidAndPast()
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
                              : showDateValidation && hasDateInput() && !isDateValidAndPast()
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
                              }
                            }}
                            onBlur={handleDayBlur}
                            className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] text-center border-0 dark:border-0 h-8 w-16 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 pb-1"
                          />
                          <span className="text-gray-400 font-medium">-</span>
                          <Input
                            id="moisDateAffectation"
                            placeholder="الشهر"
                            variant="lg"
                            autoComplete="new-password"
                            value={monthValue}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                              if (value === "" || value === "0" || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                                setMonthValue(value)
                              }
                            }}
                            onBlur={handleMonthBlur}
                            className="font-noto-naskh-arabic text-gray-600 dark:text-gray-300 font-medium text-[15px] text-center border-0 dark:border-0 h-8 w-16 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 pb-1"
                          />
                          <span className="text-gray-400 font-medium">-</span>
                          <Input
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
                      className={`border rounded-md px-2 pt-2 relative ${causesValue ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"}`}
                    >
                      <Label
                        htmlFor="causes"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${causesValue ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"}`}
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
                    {/* Contenu de l'étape 2 - vide pour l'instant */}
                    <div className="text-center py-20">
                      <p className="font-noto-naskh-arabic text-gray-500 dark:text-gray-400">المرحلة الثانية</p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ligne des boutons */}
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button
              tabIndex={-1}
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="font-noto-naskh-arabic px-3 h-11 rounded-md border-gray-300 dark:border-input hover:bg-gray-50 dark:hover:bg-input/50 text-gray-700 dark:text-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              الأسبـــق
            </Button>
            <Button
              tabIndex={-1}
              onClick={handleNext}
              disabled={currentStep === 2}
              className="font-noto-naskh-arabic px-8 h-11 rounded-md bg-[#076784] hover:bg-[#2B778F] dark:bg-gray-700 dark:hover:bg-gray-800 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التـالــي
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
