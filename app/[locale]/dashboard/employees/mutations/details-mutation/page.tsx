"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { gouvernoratOptions, getTranslatedOptions, getGradeLabel } from "@/lib/selectOptions"
import { ArrowLeft, Check, Undo2, Redo2, User, Building2, ClipboardCheck, Save, MessageSquareQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import Toaster, { ToasterRef } from "@/components/ui/toast"

interface MutationDetails {
  matricule: string
  prenom_nom: string
  grade: string
  unite_actuelle: string
  date_affectation: string
  causes: string
  type_demande: string
  unites: Array<{
    gouvernorat: string
    direction: string
    unite: string
    ordre_saisie: number
  }>
  // Champs d'évaluation - Étape 3
  interet_travail?: string
  discipline?: string
  secret_professionnel?: string
  apparence?: string
  respect_horaire?: string
  conduite?: string
  motivation?: string
  adaptation?: string
  communication?: string
  // Champs إبداء الرأي - Étape 4 (6 rubriques)
  avis_niveau1?: string
  avis_niveau2?: string
  avis_niveau3?: string
  avis_niveau4?: string
  avis_directeur?: string
  avis_direction_generale?: string
}

const typeDemandeOptions = [
  { value: "بطلب", label: "بطلـــب" },
  { value: "بإقتراح", label: "بإقتـــراح" },
  { value: "نقل صيفية", label: "نقـل صيفيــة" },
  { value: "نقل تعديلية", label: "نقــل تعـديليــة" },
]

export default function DetailsMutationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mutationId = searchParams.get("id")
  const isRTL = params.locale === "ar"
  const toasterRef = useRef<ToasterRef>(null)
  const [mutationData, setMutationData] = useState<MutationDetails | null>(null)
  const [originalData, setOriginalData] = useState<MutationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditable, setIsEditable] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [isSearching, setIsSearching] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)

  // Historique séparé pour chaque onglet
  const [historyPersonal, setHistoryPersonal] = useState<MutationDetails[]>([])
  const [currentIndexPersonal, setCurrentIndexPersonal] = useState(-1)
  const [historyUnites, setHistoryUnites] = useState<MutationDetails[]>([])
  const [currentIndexUnites, setCurrentIndexUnites] = useState(-1)
  const [historyEvaluation, setHistoryEvaluation] = useState<MutationDetails[]>([])
  const [currentIndexEvaluation, setCurrentIndexEvaluation] = useState(-1)
  const [historyAvis, setHistoryAvis] = useState<MutationDetails[]>([])
  const [currentIndexAvis, setCurrentIndexAvis] = useState(-1)

  useEffect(() => {
    const fetchMutationData = async () => {
      if (!mutationId) {
        setIsLoading(false)
        return
      }
      try {
        const supabase = createClient()
        const { data: mutationData, error: mutationError } = await supabase
          .from("employee_mutations")
          .select("*")
          .eq("id", mutationId)
          .single()

        if (mutationError || !mutationData) {
          console.error("Erreur lors de la récupération:", mutationError)
          setIsLoading(false)
          return
        }

        // Récupérer les unités associées
        const { data: unitesData, error: unitesError } = await supabase
          .from("mutation_unites")
          .select("gouvernorat, direction, unite, ordre_saisie")
          .eq("mutation_id", mutationData.id)
          .order("ordre_saisie", { ascending: true })

        if (unitesError) {
          console.error("Erreur lors de la récupération des unités:", unitesError)
        }

        // Récupérer les données d'évaluation
        const { data: evaluationData, error: evaluationError } = await supabase
          .from("mutation_evaluations")
          .select("*")
          .eq("mutation_id", mutationData.id)
          .maybeSingle()

        if (evaluationError) {
          console.error("Erreur lors de la récupération de l'évaluation:", evaluationError)
        }

        const loadedData = {
          matricule: mutationData.matricule || "",
          prenom_nom: mutationData.prenom_nom || "",
          grade: mutationData.grade || "",
          unite_actuelle: mutationData.unite_actuelle || "",
          date_affectation: mutationData.date_affectation || "",
          causes: mutationData.causes || "",
          type_demande: mutationData.type_demande || "",
          unites: unitesData || [],
          // Champs d'évaluation - Étape 3 - Mapper les colonnes de la base vers les noms utilisés dans le composant
          interet_travail: evaluationData?.attention_au_travail || "",
          discipline: evaluationData?.discipline || "",
          secret_professionnel: evaluationData?.confidentialite || "",
          apparence: evaluationData?.apparence || "",
          respect_horaire: evaluationData?.respecter_horaire || "",
          conduite: evaluationData?.comportement || "",
          motivation: evaluationData?.motivation_travail || "",
          adaptation: evaluationData?.adaptation_collegues || "",
          communication: evaluationData?.communication || "",
          // Champs إبداء الرأي (6 rubriques)
          avis_niveau1: mutationData.avis_niveau1 || "",
          avis_niveau2: mutationData.avis_niveau2 || "",
          avis_niveau3: mutationData.avis_niveau3 || "",
          avis_niveau4: mutationData.avis_niveau4 || "",
          avis_directeur: mutationData.avis_directeur || "",
          avis_direction_generale: mutationData.avis_direction_generale || "",
        }
        setMutationData(loadedData)
        setOriginalData(loadedData)
        // Initialiser les historiques pour chaque onglet avec les données chargées
        setHistoryPersonal([loadedData])
        setCurrentIndexPersonal(0)
        setHistoryUnites([loadedData])
        setCurrentIndexUnites(0)
        setHistoryEvaluation([loadedData])
        setCurrentIndexEvaluation(0)
        setHistoryAvis([loadedData])
        setCurrentIndexAvis(0)
      } catch (error) {
        console.error("Erreur inattendue:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMutationData()
  }, [mutationId])

  // Pendant le chargement, afficher le spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#26272A] flex items-center justify-center">
        <LoadingSpinner size="lg" text="جــاري تـحـمـيــل البـيـــانــات" />
      </div>
    )
  }

  if (!mutationData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-background p-4 md:p-6 flex items-center justify-center">
        <p className={`text-gray-600 dark:text-gray-300 ${isRTL ? "font-noto-naskh-arabic" : ""}`}>لا توجد بيانات</p>
      </div>
    )
  }

  // Fonction pour vérifier si un champ a été modifié
  const isFieldModified = (field: keyof MutationDetails): boolean => {
    if (!originalData || !mutationData) return false
    if (field === "unites") return false // Ne pas vérifier les unités ici
    return originalData[field] !== mutationData[field]
  }

  // Fonction pour enregistrer les modifications
  const handleSaveConfirm = async () => {
    setIsSaving(true)
    setSaveProgress(0)

    // Animation Progress en haut de la page
    const progressDuration = 400
    const progressInterval = 20
    const progressStep = 100 / (progressDuration / progressInterval)

    const progressTimer = setInterval(() => {
      setSaveProgress((prev) => {
        const newProgress = prev + progressStep
        if (newProgress >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return newProgress
      })
    }, progressInterval)

    try {
      const supabase = createClient()

      // Récupérer l'ID de la mutation (pour l'instant on utilise la dernière)
      const { data: mutationRecord, error: mutationError } = await supabase
        .from("employee_mutations")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (mutationError || !mutationRecord) {
        console.error("Erreur lors de la récupération de la mutation:", mutationError)
        toasterRef.current?.show({
          title: "خطأ",
          message: "لم يتم العثور على طلب النقلة",
          variant: "error",
          duration: 4000,
        })
        setIsSaving(false)
        setShowSaveDialog(false)
        return
      }

      console.log("Mise à jour de la mutation avec ID:", mutationRecord.id)

      // Mettre à jour les données de la mutation (onglet 1 - informations personnelles)
      const { data: updateData, error: updateError } = await supabase
        .from("employee_mutations")
        .update({
          matricule: mutationData?.matricule,
          prenom_nom: mutationData?.prenom_nom,
          grade: mutationData?.grade,
          unite_actuelle: mutationData?.unite_actuelle,
          date_affectation: mutationData?.date_affectation,
          causes: mutationData?.causes,
          type_demande: mutationData?.type_demande,
          avis_niveau1: mutationData?.avis_niveau1 || null,
          avis_niveau2: mutationData?.avis_niveau2 || null,
          avis_niveau3: mutationData?.avis_niveau3 || null,
          avis_niveau4: mutationData?.avis_niveau4 || null,
          avis_directeur: mutationData?.avis_directeur || null,
          avis_direction_generale: mutationData?.avis_direction_generale || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mutationRecord.id)
        .select()

      if (updateError) {
        console.error("Erreur lors de la mise à jour:", updateError)
        console.error("Détails de l'erreur:", JSON.stringify(updateError, null, 2))
        toasterRef.current?.show({
          title: "خطأ في الحفظ",
          message: updateError.message || "خطأ غير معروف في حفظ البيانات",
          variant: "error",
          duration: 4000,
        })
        setIsSaving(false)
        setShowSaveDialog(false)
        return
      }

      console.log("Mise à jour de employee_mutations réussie:", updateData)

      // Supprimer les anciennes unités
      const { error: deleteError } = await supabase
        .from("mutation_unites")
        .delete()
        .eq("mutation_id", mutationRecord.id)

      if (deleteError) {
        console.error("Erreur lors de la suppression des unités:", deleteError)
      }

      // Insérer les nouvelles unités (onglet 2)
      if (mutationData?.unites && mutationData.unites.length > 0) {
        const unitesToInsert = mutationData.unites.map((unite) => ({
          mutation_id: mutationRecord.id,
          gouvernorat: unite.gouvernorat,
          direction: unite.direction,
          unite: unite.unite,
          ordre_saisie: unite.ordre_saisie,
        }))

        const { error: insertError } = await supabase.from("mutation_unites").insert(unitesToInsert)

        if (insertError) {
          console.error("Erreur lors de l'insertion des unités:", insertError)
          toasterRef.current?.show({
            title: "خطأ في حفظ الوحدات",
            message: insertError.message || "خطأ غير معروف في حفظ الوحدات",
            variant: "error",
            duration: 4000,
          })
        } else {
          console.log("Insertion des unités réussie")
        }
      }

      // Mettre à jour ou insérer les données d'évaluation (onglet 3) dans mutation_evaluations
      // Vérifier si un enregistrement d'évaluation existe déjà
      const { data: existingEvaluation, error: checkError } = await supabase
        .from("mutation_evaluations")
        .select("id")
        .eq("mutation_id", mutationRecord.id)
        .maybeSingle()

      if (checkError) {
        console.error("Erreur lors de la vérification de l'évaluation:", checkError)
      }

      const evaluationData = {
        mutation_id: mutationRecord.id,
        attention_au_travail: mutationData?.interet_travail || null,
        discipline: mutationData?.discipline || null,
        confidentialite: mutationData?.secret_professionnel || null,
        apparence: mutationData?.apparence || null,
        respecter_horaire: mutationData?.respect_horaire || null,
        comportement: mutationData?.conduite || null,
        motivation_travail: mutationData?.motivation || null,
        adaptation_collegues: mutationData?.adaptation || null,
        communication: mutationData?.communication || null,
        updated_at: new Date().toISOString(),
      }

      if (existingEvaluation) {
        // Mettre à jour l'évaluation existante
        const { error: updateEvalError } = await supabase
          .from("mutation_evaluations")
          .update(evaluationData)
          .eq("id", existingEvaluation.id)

        if (updateEvalError) {
          console.error("Erreur lors de la mise à jour de l'évaluation:", JSON.stringify(updateEvalError, null, 2))
          toasterRef.current?.show({
            title: "خطأ في حفظ التقييم",
            message: updateEvalError.message || "خطأ غير معروف في حفظ التقييم",
            variant: "error",
            duration: 4000,
          })
        } else {
          console.log("Mise à jour de l'évaluation réussie")
        }
      } else {
        // Insérer une nouvelle évaluation
        const { error: insertEvalError } = await supabase.from("mutation_evaluations").insert({
          ...evaluationData,
          created_at: new Date().toISOString(),
        })

        if (insertEvalError) {
          console.error("Erreur lors de l'insertion de l'évaluation:", JSON.stringify(insertEvalError, null, 2))
          toasterRef.current?.show({
            title: "خطأ في حفظ التقييم",
            message: insertEvalError.message || "خطأ غير معروف في حفظ التقييم",
            variant: "error",
            duration: 4000,
          })
        } else {
          console.log("Insertion de l'évaluation réussie")
        }
      }

      // Mettre à jour les données originales
      setOriginalData(mutationData)

      // Réinitialiser les historiques
      if (mutationData) {
        setHistoryPersonal([mutationData])
        setCurrentIndexPersonal(0)
        setHistoryUnites([mutationData])
        setCurrentIndexUnites(0)
        setHistoryEvaluation([mutationData])
        setCurrentIndexEvaluation(0)
        setHistoryAvis([mutationData])
        setCurrentIndexAvis(0)
      }

      // Afficher le toast de succès
      toasterRef.current?.show({
        title: "تم الحفظ بنجاح",
        message: "تم حفظ التعديلات بنجاح",
        variant: "success",
        duration: 3000,
      })

      // Rediriger vers la page table-mutations après un court délai
      setTimeout(() => {
        router.push(
          isRTL
            ? "/ar/dashboard/employees/mutations/table-mutations"
            : "/fr/dashboard/employees/mutations/table-mutations",
        )
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("Erreur inattendue:", error)
      toasterRef.current?.show({
        title: "خطأ غير متوقع",
        message: "حدث خطأ أثناء الحفظ",
        variant: "error",
        duration: 4000,
      })
    } finally {
      setIsSaving(false)
      setSaveProgress(0)
      setShowSaveDialog(false)
    }
  }

  // Fonction pour rechercher un employé par matricule
  const searchEmployeeByMatricule = async (matricule: string) => {
    if (!matricule || matricule.trim() === "") return

    setIsSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employees")
        .select("prenom, nom, grade_actuel, unite_actuelle, date_affectation")
        .eq("matricule", matricule.trim())
        .maybeSingle()

      if (error) {
        console.error("Erreur lors de la recherche:", error)
        return
      }

      if (data) {
        // Mettre à jour les champs avec les données de l'employé
        setMutationData((prev) =>
          prev
            ? {
                ...prev,
                prenom_nom: `${data.prenom || ""} ${data.nom || ""}`.trim(),
                grade: data.grade_actuel || "",
                unite_actuelle: data.unite_actuelle || "",
                date_affectation: data.date_affectation || "",
              }
            : null,
        )
      }
    } catch (error) {
      console.error("Erreur inattendue:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Fonction pour gérer le blur du champ matricule
  const handleMatriculeBlur = () => {
    if (mutationData?.matricule && mutationData.matricule.trim() !== "") {
      searchEmployeeByMatricule(mutationData.matricule)
    }
  }

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  }

  // Handler pour sélectionner tout le texte au focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Fonction pour ajouter un état à l'historique d'un onglet spécifique
  const addToHistory = (newData: MutationDetails, tabType: "personal" | "unites" | "evaluation" | "avis") => {
    let history: MutationDetails[]
    let currentIndex: number
    let setHistory: React.Dispatch<React.SetStateAction<MutationDetails[]>>
    let setCurrentIndex: React.Dispatch<React.SetStateAction<number>>

    if (tabType === "personal") {
      history = historyPersonal
      currentIndex = currentIndexPersonal
      setHistory = setHistoryPersonal
      setCurrentIndex = setCurrentIndexPersonal
    } else if (tabType === "unites") {
      history = historyUnites
      currentIndex = currentIndexUnites
      setHistory = setHistoryUnites
      setCurrentIndex = setCurrentIndexUnites
    } else if (tabType === "evaluation") {
      history = historyEvaluation
      currentIndex = currentIndexEvaluation
      setHistory = setHistoryEvaluation
      setCurrentIndex = setCurrentIndexEvaluation
    } else {
      history = historyAvis
      currentIndex = currentIndexAvis
      setHistory = setHistoryAvis
      setCurrentIndex = setCurrentIndexAvis
    }

    // Supprimer tout l'historique après l'index actuel
    const newHistory = history.slice(0, currentIndex + 1)
    // Ajouter le nouvel état
    newHistory.push(JSON.parse(JSON.stringify(newData)))
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }

  // Fonctions pour annuler (undo) par onglet
  const handleUndoPersonal = () => {
    if (currentIndexPersonal > 0) {
      const newIndex = currentIndexPersonal - 1
      setCurrentIndexPersonal(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyPersonal[newIndex])))
    }
  }

  const handleUndoUnites = () => {
    if (currentIndexUnites > 0) {
      const newIndex = currentIndexUnites - 1
      setCurrentIndexUnites(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyUnites[newIndex])))
    }
  }

  const handleUndoEvaluation = () => {
    if (currentIndexEvaluation > 0) {
      const newIndex = currentIndexEvaluation - 1
      setCurrentIndexEvaluation(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyEvaluation[newIndex])))
    }
  }

  // Fonctions pour refaire (redo) par onglet
  const handleRedoPersonal = () => {
    if (currentIndexPersonal < historyPersonal.length - 1) {
      const newIndex = currentIndexPersonal + 1
      setCurrentIndexPersonal(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyPersonal[newIndex])))
    }
  }

  const handleRedoUnites = () => {
    if (currentIndexUnites < historyUnites.length - 1) {
      const newIndex = currentIndexUnites + 1
      setCurrentIndexUnites(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyUnites[newIndex])))
    }
  }

  const handleRedoEvaluation = () => {
    if (currentIndexEvaluation < historyEvaluation.length - 1) {
      const newIndex = currentIndexEvaluation + 1
      setCurrentIndexEvaluation(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyEvaluation[newIndex])))
    }
  }

  const handleUndoAvis = () => {
    if (currentIndexAvis > 0) {
      const newIndex = currentIndexAvis - 1
      setCurrentIndexAvis(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyAvis[newIndex])))
    }
  }

  const handleRedoAvis = () => {
    if (currentIndexAvis < historyAvis.length - 1) {
      const newIndex = currentIndexAvis + 1
      setCurrentIndexAvis(newIndex)
      setMutationData(JSON.parse(JSON.stringify(historyAvis[newIndex])))
    }
  }

  // Fonction wrapper pour mettre à jour les données avec historique par onglet
  const updateMutationDataPersonal = (newData: MutationDetails) => {
    setMutationData(newData)
    addToHistory(newData, "personal")
  }

  const updateMutationDataUnites = (newData: MutationDetails) => {
    setMutationData(newData)
    addToHistory(newData, "unites")
  }

  const updateMutationDataEvaluation = (newData: MutationDetails) => {
    setMutationData(newData)
    addToHistory(newData, "evaluation")
  }

  const updateMutationDataAvis = (newData: MutationDetails) => {
    setMutationData(newData)
    addToHistory(newData, "avis")
  }

  // Handler pour mettre à jour les données du tableau
  const handleTableDataChange = (groupIndex: number, rowIndex: number, field: string, value: string) => {
    if (!mutationData) return

    const actualIndex = groupIndex * 2 + rowIndex
    const updatedUnites = [...mutationData.unites]
    const uniteIndex = updatedUnites.findIndex((u) => u.ordre_saisie === actualIndex + 1)

    if (uniteIndex !== -1) {
      updatedUnites[uniteIndex] = {
        ...updatedUnites[uniteIndex],
        [field]: value,
      }
    } else {
      updatedUnites.push({
        ordre_saisie: actualIndex + 1,
        gouvernorat: field === "gouvernorat" ? value : "",
        direction: field === "direction" ? value : "",
        unite: field === "unite" ? value : "",
      })
    }

    const newData = {
      ...mutationData,
      unites: updatedUnites,
    }
    updateMutationDataUnites(newData)
  }

  // Créer un tableau de 6 lignes avec les données récupérées
  const tableRows = Array.from({ length: 6 }, (_, index) => {
    const unite = mutationData.unites.find((u) => u.ordre_saisie === index + 1)
    return {
      ordre: index + 1,
      gouvernorat: unite?.gouvernorat || "",
      direction: unite?.direction || "",
      unite: unite?.unite || "",
    }
  })

  // Grouper les lignes par gouvernorat (chaque gouvernorat a 2 lignes)
  const groupedRows = [
    { rows: [tableRows[0], tableRows[1]], gouvernoratIndex: 0 }, // Gouvernorat 1
    { rows: [tableRows[2], tableRows[3]], gouvernoratIndex: 2 }, // Gouvernorat 2
    { rows: [tableRows[4], tableRows[5]], gouvernoratIndex: 4 }, // Gouvernorat 3
  ]

  // Obtenir les options de gouvernorat traduites en arabe
  const translatedGouvernoratOptions = getTranslatedOptions(gouvernoratOptions, isRTL)

  return (
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
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* Bouton de retour */}
                <button
                  onClick={() => {
                    router.push(
                      isRTL
                        ? "/ar/dashboard/employees/mutations/table-mutations"
                        : "/fr/dashboard/employees/mutations/table-mutations",
                    )
                    router.refresh()
                  }}
                  className="p-1 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer focus:outline-none"
                  title={isRTL ? "العــودة إلى القـائمــة" : "Retour à la liste"}
                >
                  <ArrowLeft className={`h-6 w-6 text-gray-500 dark:text-gray-400 ${isRTL ? "rotate-180" : ""}`} />
                </button>

                <CardTitle className="text-xl font-semibold font-noto-naskh-arabic text-gray-900 dark:text-gray-100">
                  تفـاصيــل طـلــب النـقـلـــة
                </CardTitle>
              </div>

              <div className="flex items-center gap-3">
                {/* Boutons Undo/Redo globaux selon l'onglet actif */}
                {isEditable && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (activeTab === "personal") handleRedoPersonal()
                        else if (activeTab === "unites") handleRedoUnites()
                        else if (activeTab === "evaluation") handleRedoEvaluation()
                        else if (activeTab === "avis") handleRedoAvis()
                      }}
                      disabled={
                        activeTab === "personal" ? currentIndexPersonal >= historyPersonal.length - 1 :
                        activeTab === "unites" ? currentIndexUnites >= historyUnites.length - 1 :
                        activeTab === "evaluation" ? currentIndexEvaluation >= historyEvaluation.length - 1 :
                        currentIndexAvis >= historyAvis.length - 1
                      }
                      className={`p-1.5 rounded ${
                        (activeTab === "personal" ? currentIndexPersonal >= historyPersonal.length - 1 :
                        activeTab === "unites" ? currentIndexUnites >= historyUnites.length - 1 :
                        activeTab === "evaluation" ? currentIndexEvaluation >= historyEvaluation.length - 1 :
                        currentIndexAvis >= historyAvis.length - 1)
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title="إعــادة"
                    >
                      <Redo2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (activeTab === "personal") handleUndoPersonal()
                        else if (activeTab === "unites") handleUndoUnites()
                        else if (activeTab === "evaluation") handleUndoEvaluation()
                        else if (activeTab === "avis") handleUndoAvis()
                      }}
                      disabled={
                        activeTab === "personal" ? currentIndexPersonal <= 0 :
                        activeTab === "unites" ? currentIndexUnites <= 0 :
                        activeTab === "evaluation" ? currentIndexEvaluation <= 0 :
                        currentIndexAvis <= 0
                      }
                      className={`p-1.5 rounded ${
                        (activeTab === "personal" ? currentIndexPersonal <= 0 :
                        activeTab === "unites" ? currentIndexUnites <= 0 :
                        activeTab === "evaluation" ? currentIndexEvaluation <= 0 :
                        currentIndexAvis <= 0)
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title="تراجــع"
                    >
                      <Undo2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )}
                {/* Checkbox pour activer/désactiver l'édition */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-checkbox"
                    className="cursor-pointer"
                    checked={isEditable}
                    onCheckedChange={(checked) => setIsEditable(checked === true)}
                  />
                  <Label
                    htmlFor="edit-checkbox"
                    className={`font-noto-naskh-arabic text-[15px] cursor-pointer ${
                      isEditable ? "text-[#076784] dark:text-[#7FD4D3]" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    تــعــديــل
                  </Label>
                </div>
              </div>
            </div>
            <Separator className="mt-0.5 mb-1 bg-gray-300 dark:bg-gray-500" />
          </CardHeader>

          <CardContent className="px-4 -mt-6">
            <Tabs defaultValue="personal" className="w-full mt-4" dir="rtl" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted rounded-sm">
                <TabsTrigger
                  value="personal"
                  className="font-noto-naskh-arabic text-sm font-medium cursor-pointer gap-2"
                >
                  <User className="h-4 w-4" />
                  البيـانـات الشخـصـيـة
                </TabsTrigger>
                <TabsTrigger value="unites" className="font-noto-naskh-arabic text-sm font-medium cursor-pointer gap-2">
                  <Building2 className="h-4 w-4" />
                  الـوحــدات المطلـوبــة
                </TabsTrigger>
                <TabsTrigger
                  value="evaluation"
                  className="font-noto-naskh-arabic text-sm font-medium cursor-pointer gap-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  تقييــم رئيــس الــوحــــدة
                </TabsTrigger>
                <TabsTrigger
                  value="avis"
                  className="font-noto-naskh-arabic text-sm font-medium cursor-pointer gap-2"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  إبــداء الـــرأي
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Informations personnelles */}
              <TabsContent value="personal" className="mt-4 mb-4.5 overflow-y-auto px-2 min-h-127.5">
                <div className="pb-4">
                  <h3 className="font-noto-naskh-arabic text-[16px] font-semibold text-[#076784] dark:text-[#7FD4D3]">
                     البيــانــات الشخـصـيــة
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Ligne 1: Matricule et Prénom Nom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                    <div
                      className={`border rounded-md px-2 pt-2 relative ${
                        isFieldModified("matricule") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="matricule"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("matricule") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        الـــرقـــــم :
                      </Label>
                      <Input
                        id="matricule"
                        name="matricule"
                        placeholder="الــرقــم الشخصــي"
                        variant="lg"
                        autoComplete="on"
                        value={mutationData.matricule}
                        disabled={!isEditable}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                          updateMutationDataPersonal({ ...mutationData, matricule: value })
                        }}
                        onBlur={handleMatriculeBlur}
                        onFocus={handleInputFocus}
                        className={`font-noto-naskh-arabic ${
                          !isEditable
                            ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[14px]"
                            : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[14px]"
                        } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                      />
                      {!isSearching && isFieldModified("matricule") && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                          <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div
                      className={`border rounded-md px-2 pt-2 relative ${
                        isFieldModified("prenom_nom") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="prenom_nom"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("prenom_nom") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        الإســـم و اللقـــب :
                      </Label>
                      <Input
                        id="prenom_nom"
                        type="text"
                        placeholder="الإســم و اللقــب"
                        variant="lg"
                        autoComplete="new-password"
                        value={mutationData.prenom_nom}
                        disabled={true}
                        onChange={(e) => updateMutationDataPersonal({ ...mutationData, prenom_nom: e.target.value })}
                        className="font-noto-naskh-arabic text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                      />
                      {isFieldModified("prenom_nom") && (
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
                        isFieldModified("grade") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="grade"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("grade") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        الـرتبــــة :
                      </Label>
                      <Input
                        id="grade"
                        type="text"
                        placeholder="الــرتبـــة"
                        variant="lg"
                        autoComplete="new-password"
                        value={getGradeLabel(mutationData.grade || undefined) || "-"}
                        disabled={true}
                        onChange={(e) => updateMutationDataPersonal({ ...mutationData, grade: e.target.value })}
                        className="font-noto-naskh-arabic text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                      />
                      {isFieldModified("grade") && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                          <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div
                      className={`border rounded-md px-2 pt-2 relative ${
                        isFieldModified("unite_actuelle") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="unite_actuelle"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("unite_actuelle") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        الـوحـــدة الـحــاليـــة :
                      </Label>
                      <Input
                        id="unite_actuelle"
                        type="text"
                        placeholder="الــوحـدة الحــالـيــة"
                        variant="lg"
                        autoComplete="new-password"
                        value={mutationData.unite_actuelle}
                        disabled={true}
                        onChange={(e) =>
                          updateMutationDataPersonal({ ...mutationData, unite_actuelle: e.target.value })
                        }
                        className="font-noto-naskh-arabic text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                      />
                      {isFieldModified("unite_actuelle") && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                          <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ligne 3: Type de demande et Date d'affectation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                    <div
                      className={`border rounded-md px-2 pt-2 relative ${
                        isFieldModified("type_demande") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="type_demande"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("type_demande") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        نـــوع الـطـلــــب :
                      </Label>
                      <Select
                        dir="rtl"
                        value={mutationData.type_demande}
                        disabled={!isEditable}
                        onValueChange={(value) => updateMutationDataPersonal({ ...mutationData, type_demande: value })}
                      >
                        <SelectTrigger
                          id="type_demande"
                          className={`w-89 font-noto-naskh-arabic bg-white dark:bg-card border-0 dark:border-0 h-8 text-[15px] ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                              : "text-[#076784] dark:text-[#7FD4D3] font-semibold"
                          } rounded focus-visible:ring-0 focus-visible:ring-offset-0 pb-1`}
                        >
                          <SelectValue placeholder="نـــوع الـطـلــــب" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeDemandeOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isFieldModified("type_demande") && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                          <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div
                      className={`border rounded-md px-2 pt-2 relative ${
                        isFieldModified("date_affectation")
                          ? "border-[#339370]"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Label
                        htmlFor="date_affectation"
                        className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                          isFieldModified("date_affectation") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        تــاريــخ الإلتـحــاق بالــوحـــدة :
                      </Label>
                      <Input
                        id="date_affectation"
                        type="text"
                        placeholder="تــاريــخ الإلتـحــاق"
                        variant="lg"
                        autoComplete="new-password"
                        value={formatDate(mutationData.date_affectation)}
                        disabled={true}
                        onChange={(e) =>
                          updateMutationDataPersonal({ ...mutationData, date_affectation: e.target.value })
                        }
                        className="font-noto-naskh-arabic text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px] pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1"
                      />
                      {isFieldModified("date_affectation") && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                          <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Causes */}
                  <div
                    className={`border rounded-md px-2 pt-2 relative ${
                      isFieldModified("causes") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <Label
                      htmlFor="causes"
                      className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                        isFieldModified("causes") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      الأسـبــــــــاب :
                    </Label>
                    <Textarea
                      id="causes"
                      name="causes"
                      placeholder="أذكـــر أسبــاب طلــب النقلــة"
                      variant="lg"
                      autoComplete="on"
                      rows={5}
                      value={mutationData.causes}
                      disabled={!isEditable}
                      onChange={(e) => updateMutationDataPersonal({ ...mutationData, causes: e.target.value })}
                      className={`font-noto-naskh-arabic ${
                        !isEditable
                          ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                          : "text-[#076784] dark:text-[#7FD4D3] font-semibold text-[15px]"
                      } pr-1 border-0 dark:border-0 field-sizing-fixed w-195 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500`}
                    />
                    {isFieldModified("causes") && (
                      <div className="absolute left-2 top-8 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                        <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Unités demandées */}
              <TabsContent value="unites" className="mt-4 mb-4.5 overflow-y-auto px-2 min-h-127.5">
                <div className="pb-4">
                  <h3 className="font-noto-naskh-arabic text-[16px] font-semibold text-[#076784] dark:text-[#7FD4D3]">
                    الــوحـــدات المطلــوبـــة
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
                  <table className="w-full border-collapse" dir="rtl">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th
                          colSpan={2}
                          className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center"
                        >
                          الـــولایـــة
                        </th>
                        <th className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-l border-gray-300 dark:border-gray-600 text-center">
                          الإدارة / الإقلیـم
                        </th>
                        <th
                          colSpan={2}
                          className="font-noto-naskh-arabic text-[14px] font-semibold text-gray-700 dark:text-gray-200 py-3 px-4 border-b border-gray-300 dark:border-gray-600 text-center"
                        >
                          الوحــدات المطلـوبـــة
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedRows.map((group, groupIndex) => (
                        <React.Fragment key={`gouvernorat-${groupIndex}`}>
                          {/* Première ligne du gouvernorat */}
                          <tr key={`${groupIndex}-1`} className="border-b border-gray-200 dark:border-gray-700">
                            <td
                              rowSpan={2}
                              className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center align-middle bg-white dark:bg-card w-12"
                            >
                              {groupIndex + 1}
                            </td>
                            <td
                              rowSpan={2}
                              className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 align-middle bg-white dark:bg-card w-45"
                            >
                              <Select
                                dir="rtl"
                                value={group.rows[0].gouvernorat}
                                disabled={!isEditable}
                                onValueChange={(value) => handleTableDataChange(groupIndex, 0, "gouvernorat", value)}
                              >
                                <SelectTrigger
                                  className={`w-full font-noto-naskh-arabic bg-white dark:bg-card border border-gray-200 dark:border-gray-600 h-9 text-[15px] ${
                                    !isEditable
                                      ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                                      : "text-[#076784] dark:text-[#7FD4D3] font-medium"
                                  } rounded focus-visible:ring-0 focus-visible:ring-offset-0`}
                                >
                                  <SelectValue placeholder="" />
                                </SelectTrigger>
                                <SelectContent>
                                  {translatedGouvernoratOptions.map((gov) => (
                                    <SelectItem
                                      key={gov.value}
                                      value={gov.value}
                                      className="font-noto-naskh-arabic hover:bg-[#EBF3F5] focus:bg-[#EBF3F5] data-highlighted:bg-[#EBF3F5]"
                                    >
                                      {gov.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                              <Input
                                name={`direction_${groupIndex}_0`}
                                autoComplete="on"
                                value={group.rows[0].direction}
                                disabled={!isEditable}
                                onChange={(e) => handleTableDataChange(groupIndex, 0, "direction", e.target.value)}
                                onFocus={handleInputFocus}
                                className={`font-noto-naskh-arabic ${
                                  !isEditable
                                    ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                                    : "text-[#076784] dark:text-[#7FD4D3] font-medium"
                                } text-[15px] border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card`}
                              />
                            </td>
                            <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                              {group.rows[0].ordre}
                            </td>
                            <td className="py-2 px-3 bg-white dark:bg-card">
                              <Input
                                name={`unite_${groupIndex}_0`}
                                autoComplete="on"
                                value={group.rows[0].unite}
                                disabled={!isEditable}
                                onChange={(e) => handleTableDataChange(groupIndex, 0, "unite", e.target.value)}
                                onFocus={handleInputFocus}
                                className={`font-noto-naskh-arabic ${
                                  !isEditable
                                    ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                                    : "text-[#076784] dark:text-[#7FD4D3] font-medium"
                                } text-[15px] border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card`}
                              />
                            </td>
                          </tr>
                          {/* Deuxième ligne du gouvernorat */}
                          <tr
                            key={`${groupIndex}-2`}
                            className={groupIndex < 2 ? "border-b border-gray-300 dark:border-gray-600" : ""}
                          >
                            <td className="py-2 px-3 border-l border-gray-300 dark:border-gray-600 bg-white dark:bg-card">
                              <Input
                                name={`direction_${groupIndex}_1`}
                                autoComplete="on"
                                value={group.rows[1].direction}
                                disabled={!isEditable}
                                onChange={(e) => handleTableDataChange(groupIndex, 1, "direction", e.target.value)}
                                onFocus={handleInputFocus}
                                className={`font-noto-naskh-arabic ${
                                  !isEditable
                                    ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                                    : "text-[#076784] dark:text-[#7FD4D3] font-medium"
                                } text-[15px] border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card`}
                              />
                            </td>
                            <td className="font-noto-naskh-arabic text-[14px] text-gray-600 dark:text-gray-300 py-3 px-2 border-l border-gray-300 dark:border-gray-600 text-center bg-white dark:bg-card w-12">
                              {group.rows[1].ordre}
                            </td>
                            <td className="py-2 px-3 bg-white dark:bg-card">
                              <Input
                                name={`unite_${groupIndex}_1`}
                                autoComplete="on"
                                value={group.rows[1].unite}
                                disabled={!isEditable}
                                onChange={(e) => handleTableDataChange(groupIndex, 1, "unite", e.target.value)}
                                onFocus={handleInputFocus}
                                className={`font-noto-naskh-arabic ${
                                  !isEditable
                                    ? "text-[#076784] dark:text-[#7FD4D3] font-bold"
                                    : "text-[#076784] dark:text-[#7FD4D3] font-medium"
                                } text-[15px] border-gray-200 dark:border-gray-600 h-9 w-full rounded bg-white dark:bg-card`}
                              />
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Tab 3: Évaluation du chef d'unité */}
              <TabsContent value="evaluation" className="mt-4 mb-4.5 overflow-y-auto px-2 min-h-127.5">
                <div className="space-y-5">
                  <div className="space-y-4">
                    <div className="pb-0">
                      <h3 className="font-noto-naskh-arabic text-[15px] font-bold text-[#076784] dark:text-[#7CCFCE]">
                        الكفـايــات المهـنـيــــة
                      </h3>
                    </div>

                    {/* Ligne 1: الإهتمام بالعمل et الإنضبـــاط */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                      {/* الإهتمام بالعمل */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("interet_travail")
                            ? "border-[#339370]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="interetTravail"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("interet_travail") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          الإهتمام بالعمل :
                        </Label>
                        <Input
                          id="interetTravail"
                          name="interet_travail"
                          placeholder="أدخل الإهتمام بالعمل"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.interet_travail || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, interet_travail: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("interet_travail") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* الإنضبـــاط */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("discipline") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="discipline"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("discipline") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          الإنضبـــاط :
                        </Label>
                        <Input
                          id="discipline"
                          name="discipline"
                          placeholder="أدخل الإنضبـــاط"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.discipline || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, discipline: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("discipline") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ligne 2: المحافظة على السر المهني (seul, centré) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                      {/* المحافظة على السر المهني */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("secret_professionnel")
                            ? "border-[#339370]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="secretProfessionnel"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("secret_professionnel")
                              ? "text-[#339370]"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          المحافظة على السر المهني :
                        </Label>
                        <Input
                          id="secretProfessionnel"
                          name="secret_professionnel"
                          placeholder="أدخل المحافظة على السر المهني"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.secret_professionnel || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, secret_professionnel: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("secret_professionnel") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section الكفايات المعنوية */}
                  <div className="space-y-4">
                    <h3 className="font-noto-naskh-arabic text-[15px] font-bold text-[#076784] dark:text-[#7CCFCE]">
                      الكفـايــات المعنــويــة
                    </h3>

                    {/* Ligne 1: العناية بالمظهر العام et إحترام توقيت الحضور */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                      {/* العناية بالمظهر العام */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("apparence") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="apparence"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("apparence") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          العناية بالمظهر العام :
                        </Label>
                        <Input
                          id="apparence"
                          name="apparence"
                          placeholder="أدخل العناية بالمظهر العام"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.apparence || ""}
                          disabled={!isEditable}
                          onChange={(e) => updateMutationDataEvaluation({ ...mutationData, apparence: e.target.value })}
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("apparence") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* إحترام توقيت الحضور */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("respect_horaire")
                            ? "border-[#339370]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="respectHoraire"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("respect_horaire") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          إحترام توقيت الحضور :
                        </Label>
                        <Input
                          id="respectHoraire"
                          name="respect_horaire"
                          placeholder="أدخل إحترام توقيت الحضور"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.respect_horaire || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, respect_horaire: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("respect_horaire") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ligne 2: السيرة و السلوك et الدافعية للعمل */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                      {/* السيرة و السلوك */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("conduite") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="conduite"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("conduite") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          السيرة و السلوك :
                        </Label>
                        <Input
                          id="conduite"
                          name="conduite"
                          placeholder="أدخل السيرة و السلوك"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.conduite || ""}
                          disabled={!isEditable}
                          onChange={(e) => updateMutationDataEvaluation({ ...mutationData, conduite: e.target.value })}
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("conduite") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* الدافعية للعمل */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("motivation") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="motivation"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("motivation") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          الدافعية للعمل :
                        </Label>
                        <Input
                          id="motivation"
                          name="motivation"
                          placeholder="أدخل الدافعية للعمل"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.motivation || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, motivation: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("motivation") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ligne 3: التكيف مع المجموعة et التواصل مع المواطنين */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                      {/* التكيف مع المجموعة */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("adaptation") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="adaptation"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("adaptation") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          التكيف مع المجموعة :
                        </Label>
                        <Input
                          id="adaptation"
                          name="adaptation"
                          placeholder="أدخل التكيف مع المجموعة"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.adaptation || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, adaptation: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("adaptation") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* التواصل مع المواطنين */}
                      <div
                        className={`border rounded-md px-2 pt-2 relative ${
                          isFieldModified("communication") ? "border-[#339370]" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Label
                          htmlFor="communication"
                          className={`font-noto-naskh-arabic text-[12px] font-semibold -mt-0.5 pb-1 ${
                            isFieldModified("communication") ? "text-[#339370]" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          التواصل مع المواطنين :
                        </Label>
                        <Input
                          id="communication"
                          name="communication"
                          placeholder="أدخل التواصل مع المواطنين"
                          variant="lg"
                          autoComplete="on"
                          value={mutationData.communication || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataEvaluation({ ...mutationData, communication: e.target.value })
                          }
                          onFocus={handleInputFocus}
                          className={`font-noto-naskh-arabic ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } pr-1 border-0 dark:border-0 h-8 w-90 rounded bg-white dark:bg-card placeholder:text-gray-300 dark:placeholder:text-gray-500 truncate pb-1`}
                        />
                        {isFieldModified("communication") && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5 ml-1.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note en bas */}
                  <div className="mt-1 text-start">
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 font-noto-naskh-arabic">
                      <span className="font-semibold ">مـلاحظــة:</span> يتـم تعمييـر التقييـم مـن طــرف مديـر أو رئيـس
                      إدارة أو مـا يعادلـه.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: إبداء الرأي */}
              <TabsContent value="avis" className="mt-6 overflow-y-auto px-2 min-h-127.5">
                {/* Tableau des 6 rubriques */}
                <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  {(
                    [
                      {
                        field: "avis_niveau1" as keyof MutationDetails,
                        label: "رأي رئيس المركز\nأو رئيس الخلية\nأو رئيس القسم\nأو امر الفصيل",
                        num: 1,
                      },
                      {
                        field: "avis_niveau2" as keyof MutationDetails,
                        label: "رأي رئيس المصلحة\nأو رئيس الفرقة\nأو آمر السرية",
                        num: 2,
                      },
                      {
                        field: "avis_niveau3" as keyof MutationDetails,
                        label: "رأي رئيس المنطقة\nأو آمر الفوج\nأو رئيس الإدارة الفرعية",
                        num: 3,
                      },
                      {
                        field: "avis_niveau4" as keyof MutationDetails,
                        label: "رأي رئيس اللجنة الجهوية\n(مدير الاقليم أو\nرئيس المنطقة المنفردة)",
                        num: 4,
                      },
                      {
                        field: "avis_directeur" as keyof MutationDetails,
                        label: "رأي مدير الادارة المركزية\n(مدير إدارة الاختصاص أو\nمدير احدى الهياكل\nالمرتبطة بالقيادة)",
                        num: 5,
                      },
                      {
                        field: "avis_direction_generale" as keyof MutationDetails,
                        label: "رأي رئيس اللجنة المركزية\n(مدير عالم الاختصاص)",
                        num: 6,
                      },
                    ] as { field: keyof MutationDetails; label: string; num: number }[]
                  ).map(({ field, label, num }, idx, arr) => (
                    <div
                      key={field}
                      className={`flex flex-row ${idx < arr.length - 1 ? "border-b border-gray-300 dark:border-gray-600" : ""}`}
                    >
                      {/* Champ الاقتراحات المعللة (gauche) */}
                      <div className="flex-1 flex flex-col px-2 py-1">
                        <span className="font-noto-naskh-arabic text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                          الاقتراحات المعللة :
                        </span>
                        <Textarea
                          id={field}
                          name={field}
                          variant="lg"
                          autoComplete="on"
                          value={(mutationData[field] as string) || ""}
                          disabled={!isEditable}
                          onChange={(e) =>
                            updateMutationDataAvis({ ...mutationData, [field]: e.target.value })
                          }
                          className={`font-noto-naskh-arabic resize-none ${
                            !isEditable
                              ? "text-[#076784] dark:text-[#7FD4D3] font-bold text-[15px]"
                              : "text-[#076784] dark:text-[#7FD4D3] font-medium text-[15px]"
                          } border-0 dark:border-0 min-h-14 max-h-14 w-full rounded bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-500 px-0 py-0 leading-5`}
                        />
                        {isFieldModified(field) && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#339370]/20 rounded-full p-0.5">
                            <Check className="h-3 w-3 text-[#339370]" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Label (droite) */}
                      <div className="w-44 shrink-0 flex items-start justify-start border-r border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50">
                        <span className="font-noto-naskh-arabic text-[11.5px] font-semibold text-gray-700 dark:text-gray-200 text-start leading-5 whitespace-pre-line">
                          {label}
                        </span>
                      </div>

                      {/* Numéro (tout à droite) */}
                      <div className="flex items-center justify-center w-8 shrink-0 border-r border-gray-300 dark:border-gray-600 text-[13px] font-semibold text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                        {num}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="pt-2 pb-2 flex justify-end gap-3">
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={isSaving || !isEditable}
              className="font-noto-naskh-arabic px-8 h-10 w-32 rounded-md bg-[#076784] hover:bg-[#2B778F] dark:bg-gray-700 dark:hover:bg-gray-800 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "جاري الحفظ..." : "حــفـــظ"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* AlertDialog de confirmation */}
      <AlertDialog open={showSaveDialog} onOpenChange={(open) => !open && setShowSaveDialog(false)}>
        <AlertDialogContent dir="rtl" className="font-noto-naskh-arabic sm:max-w-lg">
          <AlertDialogHeader className="gap-3">
            <AlertDialogTitle className="text-start text-lg font-noto-naskh-arabic">
              تأكيــد حـفــظ التعــديـــلات
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start leading-relaxed font-noto-naskh-arabic">
              هل أنت متأكد من أنك تريد حفظ التعديلات التي أجريتها على طلب النقلة للموظف
              <br />
              <span className="font-semibold text-foreground">{mutationData?.prenom_nom || ""}</span>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 sm:justify-end mt-4">
            <AlertDialogCancel
              disabled={isSaving}
              className="font-noto-naskh-arabic cursor-pointer border-gray-400 dark:border-gray-500"
            >
              إلـغـــــاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveConfirm}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white font-noto-naskh-arabic cursor-pointer"
            >
              {isSaving ? "جاري الحفظ..." : "حــفــــــظ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toaster pour les notifications */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
