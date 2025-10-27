"use client"

import {
  Plus,
  Edit,
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
  FileText,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import Link from "next/link"
import Image from "next/image"
import { DisplayEmployee } from "@/types/employeeTable.types"
import { processEmployeeData, EMPLOYEE_SELECT_QUERY, sortEmployeesByHierarchy } from "@/utils/employee.utils"
import { formatDateForRTL, formatDateForLTR } from "@/utils/dateUtils"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTableCellFont,
  getTitleFont,
  getCardSubtitleFont,
  getMainTitleFont,
  getTableCellNotoFont,
  getTableCellPoppinsFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface SimpleEmployeeTableProps {
  initialEmployees: DisplayEmployee[]
}

const ITEMS_PER_PAGE = 10

type SortKey = keyof DisplayEmployee | null
type SortDirection = "ascending" | "descending"

// Fonction utilitaire pour les statuts employés en français
const getStatusFrench = (status: string): string => {
  const statusMap: Record<string, string> = {
    "مباشر": "Actif",
    "غير مباشر": "Inactif", 
    "إجازة": "En congés",
    "Maladie": "Maladie",
    "Formation": "Formation",
    "Mission": "Mission",
    "Abscent": "Absent",
    "متغيب": "Absent"
  }
  return statusMap[status] || status || "Non défini"
}

const getStatusArabic = (status: string): string => {
  const statusMap: Record<string, string> = {
    "مباشر": "مبـاشــر",
    "غير مباشر": "غير مباشر",
    "إجازة": "في إجازة",
    "Maladie": "مــــرض",
    "Formation": "تكــويــن",
    "Mission": "في مهمــة",
    "Abscent": "غائــب",
    "متغيب": "غائــب"
  }
  return statusMap[status] || status || "غير محدد"
}

interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export function SimpleEmployeeTable({ initialEmployees }: SimpleEmployeeTableProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const titleFontClass = getTitleFont(params.locale as Locale)
  const tableCellFontClass = getTableCellFont(params.locale as Locale)
  const tableCellNotoFont = getTableCellNotoFont(params.locale as Locale)
  const tableCellPoppinsFont = getTableCellPoppinsFont(params.locale as Locale)
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<DisplayEmployee[]>(initialEmployees)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [highlightedEmployeeId, setHighlightedEmployeeId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Ensure component is mounted client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  const supabase = createClient()

  // Restaurer l'état uniquement depuis sessionStorage (navigation depuis détails)
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const savedParams = sessionStorage.getItem("tableParams")
    if (savedParams) {
      const urlParams = new URLSearchParams(savedParams)
      const urlSearchTerm = urlParams.get("search") || ""
      const urlMatriculeTerm = urlParams.get("matricule") || ""
      const urlStatusFilter = urlParams.get("status") || ""
      const urlSortKey = urlParams.get("sortKey") as SortKey
      const urlSortDirection = urlParams.get("sortDirection") as SortDirection
      const urlPage = parseInt(urlParams.get("page") || "1")

      setSearchTerm(urlSearchTerm)
      setMatriculeSearchTerm(urlMatriculeTerm)
      setStatusFilter(urlStatusFilter)
      setCurrentPage(urlPage)

      if (urlSortKey && urlSortDirection) {
        setSortConfig({
          key: urlSortKey,
          direction: urlSortDirection,
        })
      }

      // Nettoyer le sessionStorage après restauration
      sessionStorage.removeItem("tableParams")
    }
  }, [])

  // Vérifier si un employé doit être mis en évidence au chargement
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const highlightId = sessionStorage.getItem("highlightEmployeeId")
    if (highlightId) {
      setHighlightedEmployeeId(highlightId)
      sessionStorage.removeItem("highlightEmployeeId")

      // Supprimer la mise en évidence après 6 secondes (0.5s clignotement + 5s fixe + 0.5s disparition)
      setTimeout(() => {
        setHighlightedEmployeeId(null)
      }, 6000)
    }
  }, [])

  // Restaurer la position de scroll après la mise en évidence
  useEffect(() => {
    if (typeof window === "undefined") return

    const scrollPosition = sessionStorage.getItem("scrollPosition")
    if (scrollPosition && highlightedEmployeeId) {
      // Utiliser setTimeout pour s'assurer que le DOM est mis à jour après la mise en évidence
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(scrollPosition),
          behavior: "smooth",
        })
        sessionStorage.removeItem("scrollPosition")
      }, 100)
    }
  }, [highlightedEmployeeId])

  // Fonction de refresh des données
  const refreshData = useCallback(async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("employees").select(EMPLOYEE_SELECT_QUERY)

      if (error) {
        console.error("Erreur rechargement:", error)
        return
      }

      if (data) {
        const processedEmployees = data.map(processEmployeeData)
        setEmployees(processedEmployees)
      }
    } catch (error) {
      console.error("Erreur refresh:", error)
    }
  }, [supabase])

  // Simple realtime setup
  useEffect(() => {
    if (!supabase || !mounted) return

    console.log("Initialisation realtime simple...")

    const channel = supabase
      .channel("employees_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Changement détecté:", payload)
          // Recharger les données complètement pour simplifier
          refreshData()
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_photos" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Photo changée:", payload)
          refreshData()
        }
      )
      .subscribe((status: string) => {
        console.log("Statut realtime:", status)
        setRealtimeConnected(status === "SUBSCRIBED")
      })

    return () => {
      channel.unsubscribe()
    }
  }, [refreshData, supabase, mounted])

  // Fonction de normalisation pour la recherche
  const normalize = useCallback((str: string) => {
    return str
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

  // Filtrage des employés
  const filteredEmployees = useMemo(() => {
    let filtered = employees

    // Filtrage par prénom/nom
    if (searchTerm.trim()) {
      const normalizedSearchTerm = normalize(searchTerm)
      filtered = filtered.filter((employee) => {
        const normalizedPrenom = normalize(employee.prenom || "")
        const normalizedNom = normalize(employee.nom || "")
        return normalizedPrenom.startsWith(normalizedSearchTerm) || normalizedNom.startsWith(normalizedSearchTerm)
      })
    }

    // Filtrage par matricule
    if (matriculeSearchTerm.trim()) {
      const searchNumbers = getMatriculeNumbers(matriculeSearchTerm)
      filtered = filtered.filter((employee) => {
        const employeeMatricule = getMatriculeNumbers(employee.matricule || "")
        return employeeMatricule.startsWith(searchNumbers)
      })
    }

    // Filtrage par statut
    if (statusFilter && statusFilter !== "") {
      filtered = filtered.filter((employee) => employee.actif === statusFilter)
    }

    return filtered
  }, [employees, searchTerm, matriculeSearchTerm, statusFilter, normalize])

  // Tri des employés avec logique complexe par défaut
  const sortedEmployees = useMemo(() => {
    // Si un tri spécifique est demandé par l'utilisateur, l'utiliser
    if (sortConfig.key && sortConfig.key !== null) {
      return [...filteredEmployees].sort((a, b) => {
        const valA = a[sortConfig.key as keyof DisplayEmployee]
        const valB = b[sortConfig.key as keyof DisplayEmployee]

        if (valA === null || valA === undefined) return 1
        if (valB === null || valB === undefined) return -1

        let comparison = 0

        if (sortConfig.key === "latestDateAffectation") {
          comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime()
        } else if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB, "fr", { sensitivity: "base" })
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comparison = valA === valB ? 0 : valA ? -1 : 1
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison
      })
    }

    // Sinon, utiliser la logique de tri hiérarchique centralisée
    return sortEmployeesByHierarchy(filteredEmployees)
  }, [filteredEmployees, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedEmployees, currentPage])

  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE)

  // Reset de la page quand la recherche change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, matriculeSearchTerm, statusFilter])

  // Fonction pour sauvegarder les paramètres actuels
  const saveCurrentParams = useCallback(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (matriculeSearchTerm) params.set("matricule", matriculeSearchTerm)
    if (statusFilter && statusFilter !== "") params.set("status", statusFilter)
    if (sortConfig.key && sortConfig.key !== null) {
      params.set("sortKey", sortConfig.key)
      params.set("sortDirection", sortConfig.direction)
    }
    if (currentPage > 1) params.set("page", currentPage.toString())

    // Sauvegarder la position de scroll
    sessionStorage.setItem("scrollPosition", window.scrollY.toString())
    sessionStorage.setItem("tableParams", params.toString())
  }, [searchTerm, matriculeSearchTerm, statusFilter, sortConfig, currentPage])

  // Ajuster la pagination pour afficher l'employé mis en évidence
  useEffect(() => {
    if (highlightedEmployeeId && sortedEmployees.length > 0) {
      const employeeIndex = sortedEmployees.findIndex((emp) => emp.id === highlightedEmployeeId)
      if (employeeIndex !== -1) {
        const targetPage = Math.floor(employeeIndex / ITEMS_PER_PAGE) + 1
        setCurrentPage(targetPage)
      }
    }
  }, [highlightedEmployeeId, sortedEmployees])

  // Fonction pour réinitialiser tous les filtres
  const handleClearFilters = useCallback(() => {
    setSearchTerm("")
    setMatriculeSearchTerm("")
    setStatusFilter("")
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
      statusFilter !== "" ||
      sortConfig.key !== null ||
      sortConfig.direction !== "ascending"
    )
  }, [searchTerm, matriculeSearchTerm, statusFilter, sortConfig])

  // Fonction pour générer l'URL Print avec les filtres actuels
  const getPrintUrl = useCallback(() => {
    const urlParams = new URLSearchParams()
    if (searchTerm) urlParams.set("search", searchTerm)
    if (matriculeSearchTerm) urlParams.set("matricule", matriculeSearchTerm)
    if (statusFilter && statusFilter !== "") urlParams.set("status", statusFilter)
    
    const baseUrl = `/${params.locale}/dashboard/employees/print`
    return urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl
  }, [searchTerm, matriculeSearchTerm, statusFilter, params.locale])

  // Fonction pour actualiser les données et reconnecter le realtime
  const handleRefresh = useCallback(async () => {
    if (!supabase || isRefreshing) return

    console.log("Actualisation manuelle déclenchée...")

    // Activer l'état de chargement
    setIsRefreshing(true)

    try {
      // Déconnecter temporairement le realtime
      setRealtimeConnected(false)

      // Recharger les données
      await refreshData()

      // Reconnecter le realtime en recréant le channel
      supabase
        .channel("employees_changes_" + Date.now()) // Nouveau nom pour forcer la reconnexion
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "employees" },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log("Changement détecté:", payload)
            refreshData()
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "employee_photos" },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log("Photo changée:", payload)
            refreshData()
          }
        )
        .subscribe((status: string) => {
          console.log("Statut realtime après refresh:", status)
          setRealtimeConnected(status === "SUBSCRIBED")
        })
    } finally {
      // Désactiver l'état de chargement après un délai minimum pour voir l'animation
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }, [refreshData, supabase, isRefreshing])

  // Icône de tri
  const getSortIcon = (columnKey: SortKey) => {
    const spacingClass = isRTL ? "mr-2" : "ml-2"
    if (sortConfig.key !== columnKey)
      return <ArrowUpDown className={`${spacingClass} h-4 w-4 text-gray-400 dark:text-gray-500`} />
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className={`${spacingClass} h-4 w-4`} />
    ) : (
      <ArrowDown className={`${spacingClass} h-4 w-4`} />
    )
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return null
  }

  // Cas où il n'y a pas d'employés
  if (employees.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-white dark:bg-card rounded-sm p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">○</div>
          <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 ${getTitleFont(params.locale as Locale)}`}>
            {t("employeesList.emptyStates.noEmployees")}
          </h3>
          <p className={`text-gray-500 dark:text-gray-400 mb-6 ${isRTL ? titleFontClass : ""}`}>
            {t("employeesList.emptyStates.startByAdding")}
          </p>
          <Link
            href={`/${params.locale}/dashboard/employees/nouveau`}
            className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded font-medium transition-colors hover:opacity-90 ${
              isRTL ? titleFontClass : ""
            }`}
            style={{ backgroundColor: "rgb(14, 102, 129)" }}
          >
            <Plus className="w-4 h-4" />
            {isRTL ? t("employeesList.buttons.newAgent") : "Nouvel agent"}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl ${mainTitleFontClass} text-foreground`}>
              {isRTL ? t("employeesList.title") : "Liste des employés"}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`${isRTL ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 ${
                  isRTL ? titleFontClass : ""
                }`}
              >
                {sortedEmployees.length} {isRTL ? t("employeesList.totalEmployees") : "employés"}
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${realtimeConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span
                  className={`${isRTL ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 ${
                    isRTL ? titleFontClass : ""
                  }`}
                >
                  {realtimeConnected
                    ? isRTL ? t("employeesList.realTimeStatus.active") : "En ligne"
                    : isRTL ? t("employeesList.realTimeStatus.inactive") : "Hors ligne"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3 py-2.5 ${
              isRTL ? "text-md" : "text-sm"
            } cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRTL ? titleFontClass : ""
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRTL ? t("employeesList.refresh") : "Actualiser"}
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41] min-h-[600px] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full sm:max-w-4xl flex gap-3">
            <div className="relative w-70">
              <input
                type="text"
                className={`w-full px-2 py-1.5 ltr:pr-8 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm  bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] ${
                  isRTL ? titleFontClass : ""
                }`}
                placeholder={isRTL ? t("employeesList.filters.searchByName") : "Rechercher par nom..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="absolute ltr:right-1.5 rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative w-56">
              <input
                type="text"
                className={`w-full px-2 py-1.5 ltr:pr-8 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] ${
                  isRTL ? titleFontClass : ""
                }`}
                placeholder={isRTL ? t("employeesList.filters.searchByMatricule") : "Rechercher par matricule..."}
                value={matriculeSearchTerm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 5)
                  setMatriculeSearchTerm(value)
                }}
                maxLength={5}
              />
              {matriculeSearchTerm && (
                <button
                  onClick={() => {
                    setMatriculeSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="absolute ltr:right-1.5 rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="w-54">
              <Select
                dir={isRTL ? "rtl" : "ltr"}
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger
                  className={`w-full !h-[34px] px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-[#959594] dark:hover:bg-transparent ${
                    isRTL ? titleFontClass : ""
                  }`}
                >
                  <SelectValue placeholder={isRTL ? t("employeesList.filters.selectStatus") : "Sélectionner le statut"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                  <SelectItem
                    value="مباشر"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.مباشر") : "Actif"}
                  </SelectItem>
                  <SelectItem
                    value="غير مباشر"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.غير مباشر") : "Inactif"}
                  </SelectItem>
                  <SelectItem
                    value="إجازة"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.إجازة") : "Congés"}
                  </SelectItem>
                  <SelectItem
                    value="Maladie"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.Maladie") : "Maladie"}
                  </SelectItem>
                  <SelectItem
                    value="Formation"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.Formation") : "Formation"}
                  </SelectItem>
                  <SelectItem
                    value="Mission"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.Mission") : "Mission"}
                  </SelectItem>
                  <SelectItem
                    value="Abscent"
                    className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                      isRTL ? titleFontClass : ""
                    }`}
                  >
                    {isRTL ? t("dashboard.employeeStatus.Abscent") : "Absent"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                title={isRTL ? t("employeesList.buttons.clearFilters") : "Réinitialiser les filtres"}
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={getPrintUrl()}
              className="flex items-center gap-2 px-3 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              title={isRTL ? "عرض وتحميل قائمة الموظفين كـ PDF" : "Voir et télécharger la liste des employés en PDF"}
            >
              <FileText className="w-4 h-4" />
              {isRTL ? "PDF" : "PDF"}
            </Link>
            <Link
              href={`/${params.locale}/dashboard/employees/nouveau`}
              className={`bg-[#076784] hover:bg-[#2B778F] text-white px-6 py-2.5 rounded text-[14px] font-medium flex items-center gap-2 transition-colors ${
                isRTL ? titleFontClass : ""
              }`}
            >
              <Plus className="w-4 h-4" />
              {isRTL ? t("employeesList.buttons.newAgent") : "Nouvel agent"}
            </Link>
          </div>
        </div>

        <div className="overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full table-fixed h-full">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-gray-200 dark:border-[#393A41]">
                <tr>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-14 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? t("employeesList.table.headers.order") : "N°"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-48 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("nom")}
                  >
                    <div className="flex items-center ml-1">
                      {isRTL ? t("employeesList.table.headers.identity") : "Identité"}
                      {getSortIcon("nom")}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-24 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? t("employeesList.table.headers.matricule") : "Matricule"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-28 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? t("employeesList.table.headers.status") : "Statut"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-56 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("latestUnite")}
                  >
                    <div className="flex items-center">
                      {isRTL ? t("employeesList.table.headers.unit") : "Unité"}
                      {getSortIcon("latestUnite")}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-40 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("latestResponsibility")}
                  >
                    <div className="flex items-center">
                      {isRTL ? t("employeesList.table.headers.responsibility") : "Responsabilité"}
                      {getSortIcon("latestResponsibility")}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-28 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("latestDateAffectation")}
                  >
                    <div className="flex items-center">
                      {isRTL ? t("employeesList.table.headers.affectationDate") : "Date affectation"}
                      {getSortIcon("latestDateAffectation")}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-16 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? t("employeesList.table.headers.action") : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center">
                      <Search className="text-gray-400 dark:text-gray-500 w-8 h-8 mb-4 mx-auto" />
                      <p className={`text-gray-500 dark:text-gray-400 pt-6 ${isRTL ? titleFontClass : ""}`}>
                        {searchTerm.trim() || matriculeSearchTerm.trim() || (statusFilter && statusFilter !== "")
                          ? isRTL ? t("employeesList.emptyStates.noResults") : "Aucun résultat trouvé"
                          : isRTL ? t("employeesList.emptyStates.noDataToShow") : "Aucune donnée à afficher"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((employee, index) => {
                    const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    const isHighlighted = highlightedEmployeeId === employee.id
                    return (
                      <tr
                        key={employee.id}
                        className={`${
                          isHighlighted ? "animate-highlightBlink" : "hover:bg-gray-50 dark:hover:bg-[#363C44]"
                        }`}
                      >
                        <td className="px-6 py-2.5 w-14">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{overallIndex}</span>
                        </td>
                        <td className="px-6 py-2.5 w-48">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-transparent flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                              <Image
                                src={employee.displayImage || "/images/default-avatar.png"}
                                alt={`${employee.prenom || ""} ${employee.nom || ""}`}
                                fill
                                sizes="48px"
                                className="object-cover rounded-full"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/images/default-avatar.png"
                                }}
                              />
                            </div>
                            <Link
                              href={`/${params.locale}/dashboard/employees/details/${employee.id}`}
                              className="flex-1 min-w-0"
                              onClick={saveCurrentParams}
                            >
                              <div
                                className={`text-base font-medium text-gray-900 dark:text-white hover:text-[#076784] transition-colors truncate ${
                                  isRTL ? tableCellFontClass : ""
                                }`}
                              >
                                {employee.prenom || ""} {employee.nom || ""}
                              </div>
                              <div
                                className={`text-[15px] -mt-0.5 text-gray-500 dark:text-gray-400 truncate ${
                                  isRTL ? tableCellNotoFont : ""
                                }`}
                              >
                                {employee.latestGrade}
                              </div>
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 w-24">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                          >
                            {employee.matricule || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-28">
                          <span
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                              isRTL ? tableCellFontClass : ""
                            } ${isRTL ? "text-[10px]" : ""} ${
                              employee.actif === "مباشر"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : employee.actif === "غير مباشر"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : employee.actif === "إجازة"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : employee.actif === "Maladie"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                : employee.actif === "Formation"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : employee.actif === "Mission"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                : employee.actif === "Abscent"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 me-1.5 rounded-full ${
                                employee.actif === "مباشر"
                                  ? "bg-green-500"
                                  : employee.actif === "غير مباشر"
                                  ? "bg-red-500"
                                  : employee.actif === "إجازة"
                                  ? "bg-blue-500"
                                  : employee.actif === "Maladie"
                                  ? "bg-orange-500"
                                  : employee.actif === "Formation"
                                  ? "bg-purple-500"
                                  : employee.actif === "Mission"
                                  ? "bg-indigo-500"
                                  : employee.actif === "Abscent"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            {isRTL ? getStatusArabic(employee.actif) : getStatusFrench(employee.actif)}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-56">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                            title={employee.latestUnite || "-"}
                          >
                            {employee.latestUnite || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-40">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                            title={employee.latestResponsibility || "-"}
                          >
                            {employee.latestResponsibility || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-28">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                          >
                            {employee.latestDateAffectation
                              ? isRTL
                                ? formatDateForRTL(employee.latestDateAffectation)
                                : formatDateForLTR(employee.latestDateAffectation)
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-16">
                          <Link
                            href={`/${params.locale}/dashboard/employees/details/${employee.id}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors inline-block"
                            onClick={saveCurrentParams}
                          >
                            <Edit className="w-4 h-4" style={{ color: "rgb(7, 103, 132)" }} />
                          </Link>
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
          <div className="flex items-center justify-end ltr:space-x-6 rtl:space-x-reverse ltr:lg:space-x-8 rtl:lg:space-x-reverse px-2 py-2.5 mt-auto text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center ltr:space-x-2 rtl:space-x-reverse">
              <p className={`font-medium ${isRTL ? `${titleFontClass} ml-2` : ""}`}>
                {isRTL ? t("employeesList.pagination.rowsPerPage") : "Lignes par page"}
              </p>
              <div
                className={`px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] ${
                  isRTL ? titleFontClass : ""
                }`}
              >
                {ITEMS_PER_PAGE}
              </div>
            </div>
            <div className={`flex w-[120px] items-center justify-center font-medium ${isRTL ? titleFontClass : ""}`}>
              {isRTL ? t("employeesList.pagination.page") : "Page"} {currentPage} {isRTL ? t("employeesList.pagination.of") : "sur"} {totalPages}
            </div>
            <div className="flex items-center ltr:space-x-1 rtl:space-x-reverse">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden h-9 w-9 p-0 lg:flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRTL ? (
                  <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden h-9 w-9 p-0 lg:flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRTL ? (
                  <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
