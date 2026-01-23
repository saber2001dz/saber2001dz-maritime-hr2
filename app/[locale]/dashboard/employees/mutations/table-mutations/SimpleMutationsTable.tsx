"use client"

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  RotateCcw,
  Search,
  Download,
  ChevronDown,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useParams, useRouter } from "next/navigation"
import { DisplayMutation, RawMutationData, processMutationData, MUTATION_SELECT_QUERY } from "@/types/mutation.types"
import { formatDateForRTL } from "@/utils/dateUtils"
import { getGradeLabel } from "@/lib/selectOptions"
import {
  getCardSubtitleFont,
  getMainTitleFont,
  getTitleFont,
  getTableCellNotoFont,
} from "@/lib/direction"
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
import Toaster, { ToasterRef } from "@/components/ui/toast"

interface SimpleMutationsTableProps {
  initialMutations: DisplayMutation[]
}

const ITEMS_PER_PAGE = 10

type SortKey = keyof DisplayMutation | null
type SortDirection = "ascending" | "descending"

interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export function SimpleMutationsTable({ initialMutations }: SimpleMutationsTableProps) {
  const params = useParams()
  const router = useRouter()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const titleFontClass = getTitleFont(params.locale as Locale)
  const tableCellNotoFont = getTableCellNotoFont(params.locale as Locale)
  const [mounted, setMounted] = useState(false)
  const [mutations, setMutations] = useState<DisplayMutation[]>(initialMutations)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState("")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [mutationToDelete, setMutationToDelete] = useState<DisplayMutation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [showDeleteProgress, setShowDeleteProgress] = useState(false)
  const toasterRef = useRef<ToasterRef>(null)

  const supabase = createClient()

  // Rediriger vers la version arabe si ce n'est pas déjà le cas
  useEffect(() => {
    if (!isRTL) {
      router.replace("/ar/dashboard/employees/mutations/table-mutations")
    }
  }, [isRTL, router])

  // Ensure component is mounted client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fonction de refresh des données
  const refreshData = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from("employee_mutations")
        .select(MUTATION_SELECT_QUERY)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erreur rechargement mutations:", error)
        return
      }

      if (data) {
        const processedMutations = (data as RawMutationData[]).map(processMutationData)
        setMutations(processedMutations)
        console.log(`${processedMutations.length} mutations rechargées`)
      }
    } catch (error) {
      console.error("Erreur refresh mutations:", error)
    }
  }, [supabase])

  // Simple realtime setup
  useEffect(() => {
    if (!supabase || !mounted) return

    console.log("Initialisation realtime mutations...")

    const channel = supabase
      .channel("mutations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_mutations" },
        (payload: RealtimePostgresChangesPayload<RawMutationData>) => {
          console.log("Changement mutations détecté:", payload)
          refreshData()
        }
      )
      .subscribe((status: string) => {
        console.log("Statut realtime mutations:", status)
        setRealtimeConnected(status === "SUBSCRIBED")
      })

    return () => {
      channel.unsubscribe()
    }
  }, [refreshData, supabase, mounted])

  // Fonction de normalisation pour la recherche
  const normalize = useCallback((str: string) => {
    return str
      .replace(/[أإآا]/g, "ا")
      .replace(/[ى]/g, "ي")
      .replace(/[ة]/g, "ه")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }, [])

  // Fonction pour extraire les chiffres du matricule
  const getMatriculeNumbers = (formattedValue: string) => {
    return formattedValue.replace(/\D/g, "")
  }

  // Fonction de tri
  const requestSort = useCallback(
    (key: SortKey) => {
      if (!key) return
      const newDirection = sortConfig.key === key && sortConfig.direction === "ascending" ? "descending" : "ascending"
      setSortConfig({
        key,
        direction: newDirection,
      })
      setCurrentPage(1)
    },
    [sortConfig]
  )

  // Filtrage des mutations
  const filteredMutations = useMemo(() => {
    let filtered = mutations

    // Filtrage par nom
    if (searchTerm.trim()) {
      const normalizedSearchTerm = normalize(searchTerm)
      filtered = filtered.filter((mutation) => {
        const normalizedName = normalize(mutation.prenom_nom || "")
        return normalizedName.includes(normalizedSearchTerm)
      })
    }

    // Filtrage par matricule
    if (matriculeSearchTerm.trim()) {
      const searchNumbers = getMatriculeNumbers(matriculeSearchTerm)
      filtered = filtered.filter((mutation) => {
        const mutationMatricule = getMatriculeNumbers(mutation.matricule || "")
        return mutationMatricule.startsWith(searchNumbers)
      })
    }

    return filtered
  }, [mutations, searchTerm, matriculeSearchTerm, normalize])

  // Tri des mutations
  const sortedMutations = useMemo(() => {
    if (sortConfig.key && sortConfig.key !== null) {
      return [...filteredMutations].sort((a, b) => {
        const valA = a[sortConfig.key as keyof DisplayMutation]
        const valB = b[sortConfig.key as keyof DisplayMutation]

        if (valA === null || valA === undefined) return 1
        if (valB === null || valB === undefined) return -1

        let comparison = 0

        if (sortConfig.key === "date_affectation" || sortConfig.key === "created_at") {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime()
        } else if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB, "ar", { sensitivity: "base" })
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison
      })
    }

    // Par défaut, trier par date de création (plus récent en premier)
    return [...filteredMutations].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filteredMutations, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedMutations.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedMutations, currentPage])

  const totalPages = Math.ceil(sortedMutations.length / ITEMS_PER_PAGE)

  // Reset de la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, matriculeSearchTerm])

  // Fonction pour réinitialiser tous les filtres
  const handleClearFilters = useCallback(() => {
    setSearchTerm("")
    setMatriculeSearchTerm("")
    setSortConfig({
      key: null,
      direction: "ascending",
    })
    setCurrentPage(1)
  }, [])

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      matriculeSearchTerm.trim() !== "" ||
      sortConfig.key !== null ||
      sortConfig.direction !== "ascending"
    )
  }, [searchTerm, matriculeSearchTerm, sortConfig])

  // Fonction pour actualiser les données
  const handleRefresh = useCallback(async () => {
    if (!supabase || isRefreshing) return

    console.log("Actualisation manuelle déclenchée...")
    setIsRefreshing(true)

    try {
      setRealtimeConnected(false)
      await refreshData()

      supabase
        .channel("mutations_changes_" + Date.now())
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "employee_mutations" },
          (payload: RealtimePostgresChangesPayload<RawMutationData>) => {
            console.log("Changement mutations détecté:", payload)
            refreshData()
          }
        )
        .subscribe((status: string) => {
          console.log("Statut realtime après refresh:", status)
          setRealtimeConnected(status === "SUBSCRIBED")
        })
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }, [refreshData, supabase, isRefreshing])

  // Fonctions d'exportation
  const exportToExcel = useCallback(() => {
    const dataToExport = sortedMutations.map((mut, index) => ({
      "ع/ر": index + 1,
      "الرتبة": mut.grade || "",
      "الإسم و اللقب": mut.prenom_nom || "",
      "الرقم": mut.matricule || "",
      "الوحدة الحالية": mut.unite_actuelle || "",
      "تاريخ التعيين": mut.date_affectation ? formatDateForRTL(mut.date_affectation) : "",
      "الأسباب": mut.causes || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "طلبات النقلة")
    XLSX.writeFile(workbook, `mutations_${new Date().toISOString().split("T")[0]}.xlsx`)
  }, [sortedMutations])

  const exportToCSV = useCallback(() => {
    const dataToExport = sortedMutations.map((mut, index) => ({
      "ع/ر": index + 1,
      "الرتبة": mut.grade || "",
      "الإسم و اللقب": mut.prenom_nom || "",
      "الرقم": mut.matricule || "",
      "الوحدة الحالية": mut.unite_actuelle || "",
      "تاريخ التعيين": mut.date_affectation ? formatDateForRTL(mut.date_affectation) : "",
      "الأسباب": mut.causes || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `mutations_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [sortedMutations])

  const exportToJSON = useCallback(() => {
    const dataToExport = sortedMutations.map((mut, index) => ({
      numero: index + 1,
      grade: mut.grade || "",
      prenom_nom: mut.prenom_nom || "",
      matricule: mut.matricule || "",
      unite_actuelle: mut.unite_actuelle || "",
      date_affectation: mut.date_affectation || "",
      causes: mut.causes || "",
    }))

    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `mutations_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [sortedMutations])

  // Fonction de suppression d'une mutation
  const handleDeleteMutation = useCallback(async () => {
    if (!mutationToDelete || !supabase) return

    // Fermer l'AlertDialog immédiatement
    const mutationToDeleteCopy = { ...mutationToDelete }
    setMutationToDelete(null)
    setIsDeleting(true)

    // Étape 1: Animation Progress en haut de la page
    setShowDeleteProgress(true)
    setDeleteProgress(0)

    const progressDuration = 400
    const progressInterval = 20
    const progressStep = 100 / (progressDuration / progressInterval)

    await new Promise<void>((resolve) => {
      const progressTimer = setInterval(() => {
        setDeleteProgress((prev) => {
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

    // Étape 2: Suppression dans la base de données
    try {
      // La suppression dans employee_mutations va automatiquement supprimer
      // les lignes liées dans mutation_unites grâce à ON DELETE CASCADE
      const { error } = await supabase
        .from("employee_mutations")
        .delete()
        .eq("id", mutationToDeleteCopy.id)

      if (error) {
        console.error("Erreur lors de la suppression:", error)
        toasterRef.current?.show({
          title: "خطأ في الحذف",
          message: error.message,
          variant: "error",
          duration: 3000,
        })
      } else {
        toasterRef.current?.show({
          title: "تم الحذف بنجاح",
          message: "تم حذف طلب النقلة بنجاح",
          variant: "success",
          duration: 3000,
        })
        // Mettre à jour la liste localement
        setMutations((prev) => prev.filter((m) => m.id !== mutationToDeleteCopy.id))
      }
    } catch (error) {
      console.error("Erreur inattendue lors de la suppression:", error)
      toasterRef.current?.show({
        title: "خطأ غير متوقع",
        message: "حدث خطأ أثناء الحذف",
        variant: "error",
        duration: 3000,
      })
    } finally {
      // Réinitialiser après un court délai
      setTimeout(() => {
        setShowDeleteProgress(false)
        setDeleteProgress(0)
        setIsDeleting(false)
      }, 300)
    }
  }, [mutationToDelete, supabase])

  // Icône de tri
  const getSortIcon = (columnKey: SortKey) => {
    const spacingClass = "mr-2"
    if (sortConfig.key !== columnKey)
      return <ArrowUpDown className={`${spacingClass} h-4 w-4 text-gray-400 dark:text-gray-500`} />
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className={`${spacingClass} h-4 w-4`} />
    ) : (
      <ArrowDown className={`${spacingClass} h-4 w-4`} />
    )
  }

  // Ne rien afficher si ce n'est pas en mode RTL
  if (!isRTL) {
    return null
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return null
  }

  // Cas où il n'y a pas de mutations
  if (mutations.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-white dark:bg-card rounded-sm p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">○</div>
          <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 font-noto-naskh-arabic`}>
            لا توجد طلبات نقلة
          </h3>
          <p className={`text-gray-500 dark:text-gray-400 mb-6 font-noto-naskh-arabic`}>
            لم يتم تسجيل أي طلب نقلة حتى الآن
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col">
      {/* Progress bar de suppression en haut de la page */}
      {showDeleteProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#076784] transition-all duration-100 ease-linear"
            style={{ width: `${deleteProgress}%` }}
          />
        </div>
      )}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl ${mainTitleFontClass} text-foreground`}>
             قائمـة طلبـات النقـل
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className={`text-sm text-gray-500 dark:text-gray-400 ${titleFontClass}`}>
                {sortedMutations.length} طلب نقلة
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${realtimeConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm text-gray-500 dark:text-gray-400 ${titleFontClass}`}>
                  {realtimeConnected ? "الربط المباشر نشط" : "الربط المباشر غير نشط"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3 py-2.5 text-md cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-noto-naskh-arabic`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41] min-h-150 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full sm:max-w-4xl flex gap-3">
            <div className="relative w-70">
              <input
                id="search-name"
                name="search-name"
                type="text"
                className={`w-full px-2 py-1.5 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] font-noto-naskh-arabic`}
                placeholder="البحث بالإسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="absolute rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative w-56">
              <input
                id="search-matricule"
                name="search-matricule"
                type="text"
                className={`w-full px-2 py-1.5 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] font-noto-naskh-arabic`}
                placeholder="البحث بالرقم..."
                value={matriculeSearchTerm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setMatriculeSearchTerm(value)
                }}
                maxLength={6}
              />
              {matriculeSearchTerm && (
                <button
                  onClick={() => {
                    setMatriculeSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="absolute rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-gray-500"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.75 bg-white dark:bg-card border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-[14px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 rounded cursor-pointer"
                style={{ fontFamily: "'Noto Naskh Arabic', sans-serif" }}
              >
                <Download size={14} />
                تــصــديــر
                <ChevronDown size={14} className="opacity-50" />
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-card border border-gray-300 dark:border-gray-600 shadow-lg rounded-md z-20">
                    <button
                      onClick={() => {
                        exportToExcel()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => {
                        exportToCSV()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => {
                        exportToJSON()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full table-fixed h-full" dir="rtl">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-gray-200 dark:border-[#393A41]">
                <tr>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold w-12 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                  >
                    ع/ر
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-44 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    onClick={() => requestSort("prenom_nom")}
                  >
                    <div className="flex items-center">
                        هــويــــة المــوظــــف
                      {getSortIcon("prenom_nom")}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold w-24 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                  >
                    الــرقـــم
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-36 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    onClick={() => requestSort("unite_actuelle")}
                  >
                    <div className="flex items-center">
                      الـوحــدة الحــاليــة
                      {getSortIcon("unite_actuelle")}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-32 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                    onClick={() => requestSort("date_affectation")}
                  >
                    <div className="flex items-center">
                      تــاريــخ التعييــن
                      {getSortIcon("date_affectation")}
                    </div>
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold w-56 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                  >
                    الأسبــــاب
                  </th>
                  <th
                    className={`px-4 py-4 text-start text-[15px] font-semibold w-24 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic`}
                  >
                    خيــارات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Search className="text-gray-400 dark:text-gray-500 w-8 h-8 mb-4 mx-auto" />
                      <p className={`text-gray-500 dark:text-gray-400 pt-6 font-noto-naskh-arabic`}>
                        {searchTerm.trim() || matriculeSearchTerm.trim()
                          ? "لم يتم العثور على نتائج"
                          : "لا توجد بيانات للعرض"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((mutation, index) => {
                    const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    return (
                      <tr
                        key={mutation.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#363C44]"
                      >
                        <td className="px-4 py-2.5 w-12">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{overallIndex}</span>
                        </td>
                        <td className="px-4 py-2.5 w-44">
                          <div className="flex flex-col">
                            <span
                              className={`text-base font-medium text-gray-900 dark:text-white truncate font-noto-naskh-arabic`}
                            >
                              {mutation.prenom_nom || "-"}
                            </span>
                            <span
                              className={`text-[14px] -mt-0.5 text-gray-500 dark:text-gray-400 truncate font-noto-naskh-arabic`}
                            >
                              {getGradeLabel(mutation.grade || undefined) || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 w-24">
                          <span
                            className={`text-[15px] text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic`}
                          >
                            {mutation.matricule || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 w-36">
                          <span
                            className={`text-[15px] text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic`}
                            title={mutation.unite_actuelle || "-"}
                          >
                            {mutation.unite_actuelle || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 w-32">
                          <span
                            className={`text-[15px] text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic`}
                          >
                            {mutation.date_affectation
                              ? formatDateForRTL(mutation.date_affectation)
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 w-56">
                          <span
                            className={`text-[15px] text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic`}
                            title={mutation.causes || "-"}
                          >
                            {mutation.causes || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 w-24">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                // TODO: Implémenter la visualisation détaillée
                                console.log("Voir mutation:", mutation.id)
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" style={{ color: "#076784" }} />
                            </button>
                            <button
                              onClick={() => setMutationToDelete(mutation)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end rtl:space-x-reverse lg:space-x-8 px-2 py-2.5 mt-auto text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center rtl:space-x-reverse">
              <p className={`font-medium font-noto-naskh-arabic ml-2`}>
                صفوف في الصفحة
              </p>
              <div
                className={`px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] font-noto-naskh-arabic`}
              >
                {ITEMS_PER_PAGE}
              </div>
            </div>
            <div className={`flex w-30 items-center justify-center font-medium font-noto-naskh-arabic`}>
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex items-center rtl:space-x-reverse">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden h-9 w-9 p-0 lg:flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden h-9 w-9 p-0 lg:flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog open={!!mutationToDelete} onOpenChange={(open) => !open && setMutationToDelete(null)}>
        <AlertDialogContent dir="rtl" className="font-noto-naskh-arabic sm:max-w-md">
          <AlertDialogHeader className="gap-3">
            <AlertDialogTitle className="text-start text-lg font-noto-naskh-arabic">
              تأكيد حذف طلب النقلة
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start leading-relaxed font-noto-naskh-arabic">
              هل أنت متأكد من حذف طلب النقلة للموظف{" "}
              <span className="font-semibold text-foreground">
                {mutationToDelete?.prenom_nom || ""}
              </span>
              ؟
              <br />
              <span className="text-red-500 dark:text-red-400 mt-1 block">
                سيتم حذف جميع الوحدات المطلوبة المرتبطة بهذا الطلب.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 sm:justify-end mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="font-noto-naskh-arabic cursor-pointer border-gray-400 dark:border-gray-500"
            >
              إلـغـــــاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMutation}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-noto-naskh-arabic cursor-pointer"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحذف...
                </span>
              ) : (
                "حـــــــــذف"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toaster pour les notifications */}
      <Toaster ref={toasterRef} defaultPosition="top-right" />
    </div>
  )
}
