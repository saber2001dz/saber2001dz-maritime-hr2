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
} from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import Link from "next/link"
import Image from "next/image"
import { DisplayEmployee, RawEmployeeData } from "@/types/employeeTable.types"
import { processEmployeeData, EMPLOYEE_SELECT_QUERY } from "@/utils/employee.utils"
import { formatDateForRTL, formatDateForLTR } from "@/utils/dateUtils"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
  getTableCellFont,
  getTitleFont,
  getCardSubtitleFont,
  getMainTitleFont,
  getTableCellNotoFont,
} from "@/lib/direction"
import type { Locale } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface SimpleRetraiteTableProps {
  initialEmployees: DisplayEmployee[]
}

const ITEMS_PER_PAGE = 10

type SortKey = keyof DisplayEmployee | null
type SortDirection = "ascending" | "descending"

interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export function SimpleRetraiteTable({ initialEmployees }: SimpleRetraiteTableProps) {
  const t = useTranslations()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const titleFontClass = getTitleFont(params.locale as Locale)
  const tableCellFontClass = getTableCellFont(params.locale as Locale)
  const tableCellNotoFont = getTableCellNotoFont(params.locale as Locale)
  const [mounted, setMounted] = useState(false)
  const [employees, setEmployees] = useState<DisplayEmployee[]>(initialEmployees)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [showRetired, setShowRetired] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Générer les années disponibles
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    if (showRetired) {
      // Si le checkbox est coché, générer les années basées sur les dates de retraite réelles
      const retiredEmployees = employees.filter((employee) => employee.actif === "متقاعد" && employee.dateRetraite)

      if (retiredEmployees.length === 0) return []

      // Extraire toutes les années de retraite
      const retirementYears = retiredEmployees.map((employee) => new Date(employee.dateRetraite!).getFullYear())

      // Obtenir l'année la plus récente et la plus ancienne
      const maxYear = Math.max(...retirementYears)
      const minYear = Math.min(...retirementYears)

      // Générer la liste des années du plus récent au plus ancien
      const years: number[] = []
      for (let year = maxYear; year >= minYear; year--) {
        years.push(year)
      }

      return years
    } else {
      // Sinon, année actuelle + 10 ans (comportement par défaut)
      const years: number[] = []
      for (let i = 0; i <= 10; i++) {
        years.push(currentYear + i)
      }
      return years
    }
  }, [currentYear, showRetired, employees])
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

    const savedParams = sessionStorage.getItem("retraiteTableParams")
    if (savedParams) {
      const urlParams = new URLSearchParams(savedParams)
      const urlSearchTerm = urlParams.get("search") || ""
      const urlMatriculeTerm = urlParams.get("matricule") || ""
      const urlSortKey = urlParams.get("sortKey") as SortKey
      const urlSortDirection = urlParams.get("sortDirection") as SortDirection
      const urlPage = parseInt(urlParams.get("page") || "1")

      setSearchTerm(urlSearchTerm)
      setMatriculeSearchTerm(urlMatriculeTerm)
      setCurrentPage(urlPage)

      if (urlSortKey && urlSortDirection) {
        setSortConfig({
          key: urlSortKey,
          direction: urlSortDirection,
        })
      }

      // Nettoyer le sessionStorage après restauration
      sessionStorage.removeItem("retraiteTableParams")
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
      // Obtenir le nombre total d'employés
      const { count } = await supabase
        .from("employees")
        .select("*", { count: 'exact', head: true })

      if (count && count > 0) {
        const pageSize = 1000
        const totalPages = Math.ceil(count / pageSize)
        const allEmployees: RawEmployeeData[] = []

        // Récupérer toutes les pages en parallèle
        const fetchPromises = []
        for (let page = 0; page < totalPages; page++) {
          const from = page * pageSize
          const to = from + pageSize - 1
          fetchPromises.push(
            supabase
              .from("employees")
              .select(EMPLOYEE_SELECT_QUERY)
              .range(from, to)
          )
        }

        const results = await Promise.all(fetchPromises)

        // Vérifier les erreurs
        const hasErrors = results.some(r => r.error)
        if (hasErrors) {
          console.error("Erreur rechargement employés")
          return
        }

        // Combiner toutes les données
        results.forEach(result => {
          if (result.data) {
            allEmployees.push(...(result.data as RawEmployeeData[]))
          }
        })

        const processedEmployees = allEmployees.map(processEmployeeData)
        setEmployees(processedEmployees)
        console.log(`${processedEmployees.length} employés rechargés`)
      }
    } catch (error) {
      console.error("Erreur refresh employés:", error)
    }
  }, [supabase])

  // Simple realtime setup
  useEffect(() => {
    if (!supabase || !mounted) return

    console.log("Initialisation realtime simple...")

    const channel = supabase
      .channel("retraite_employees_changes")
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
      // Normaliser les différentes formes de Alif en arabe
      .replace(/[أإآا]/g, 'ا')
      // Normaliser les autres lettres arabes similaires
      .replace(/[ى]/g, 'ي')
      .replace(/[ة]/g, 'ه')
      // NFD pour les autres langues
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let filtered: DisplayEmployee[]

    if (showRetired) {
      // Si le checkbox est coché, afficher uniquement les employés avec actif = "متقاعد"
      filtered = employees.filter((employee) => employee.actif === "متقاعد")
    } else {
      // Sinon, filtrer les employés qui n'ont pas encore atteint la retraite
      filtered = employees.filter((employee) => {
        if (!employee.dateRetraite) return false // Exclure ceux sans date de retraite
        const retraiteDate = new Date(employee.dateRetraite)
        return retraiteDate > today // Garder seulement ceux dont la date de retraite est dans le futur
      })
    }

    // Filtrage par année de retraite
    if (selectedYear !== "") {
      const year = parseInt(selectedYear)
      filtered = filtered.filter((employee) => {
        if (!employee.dateRetraite) return false
        const retraiteYear = new Date(employee.dateRetraite).getFullYear()
        return retraiteYear === year
      })
    }

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

    return filtered
  }, [employees, searchTerm, matriculeSearchTerm, selectedYear, showRetired, normalize])

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

        if (typeof valA === "string" && typeof valB === "string") {
          comparison = valA.localeCompare(valB, "fr", { sensitivity: "base" })
        } else if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB
        } else if (typeof valA === "boolean" && typeof valB === "boolean") {
          comparison = valA === valB ? 0 : valA ? -1 : 1
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison
      })
    }

    // Par défaut, trier par date de retraite du plus proche au plus lointain (chronologique)
    return [...filteredEmployees].sort((a, b) => {
      const dateA = a.dateRetraite ? new Date(a.dateRetraite).getTime() : Infinity
      const dateB = b.dateRetraite ? new Date(b.dateRetraite).getTime() : Infinity
      return dateA - dateB // Plus proche en premier
    })
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
  }, [searchTerm, matriculeSearchTerm, selectedYear])

  // Réinitialiser le filtre d'année quand le checkbox change
  useEffect(() => {
    setSelectedYear("")
    setCurrentPage(1)
  }, [showRetired])

  // Fonction pour sauvegarder les paramètres actuels
  const saveCurrentParams = useCallback(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams()
    if (searchTerm) urlParams.set("search", searchTerm)
    if (matriculeSearchTerm) urlParams.set("matricule", matriculeSearchTerm)
    if (sortConfig.key && sortConfig.key !== null) {
      urlParams.set("sortKey", sortConfig.key)
      urlParams.set("sortDirection", sortConfig.direction)
    }
    if (currentPage > 1) urlParams.set("page", currentPage.toString())

    // Sauvegarder la position de scroll
    sessionStorage.setItem("scrollPosition", window.scrollY.toString())
    sessionStorage.setItem("retraiteTableParams", urlParams.toString())
    // Sauvegarder la page d'origine pour le retour depuis les détails
    sessionStorage.setItem("returnToPage", "retraite")
  }, [searchTerm, matriculeSearchTerm, sortConfig, currentPage])

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
    setSelectedYear("")
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
      selectedYear !== "" ||
      sortConfig.key !== null ||
      sortConfig.direction !== "ascending"
    )
  }, [searchTerm, matriculeSearchTerm, selectedYear, sortConfig])


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
        .channel("retraite_employees_changes_" + Date.now()) // Nouveau nom pour forcer la reconnexion
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

  // Fonctions d'exportation
  const exportToExcel = useCallback(() => {
    const dataToExport = sortedEmployees.map((emp, index) => ({
      "N°": index + 1,
      "Prénom": emp.prenom || "",
      "Nom": emp.nom || "",
      "Matricule": emp.matricule || "",
      "ID Unique": emp.identifiant_unique || "",
      "Grade": emp.latestGrade || "",
      ...(showRetired
        ? {
            "CIN": emp.cin || "",
            "Date de naissance": emp.date_naissance ? formatDateForLTR(emp.date_naissance) : "",
          }
        : {
            "Unité": emp.latestUnite || "",
            "Responsabilité": emp.latestResponsibility || "",
          }),
      "Date retraite": emp.dateRetraite ? formatDateForLTR(emp.dateRetraite) : "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Retraites")
    XLSX.writeFile(workbook, `retraites_${new Date().toISOString().split("T")[0]}.xlsx`)
  }, [sortedEmployees, showRetired])

  const exportToCSV = useCallback(() => {
    const dataToExport = sortedEmployees.map((emp, index) => ({
      "N°": index + 1,
      "Prénom": emp.prenom || "",
      "Nom": emp.nom || "",
      "Matricule": emp.matricule || "",
      "ID Unique": emp.identifiant_unique || "",
      "Grade": emp.latestGrade || "",
      ...(showRetired
        ? {
            "CIN": emp.cin || "",
            "Date de naissance": emp.date_naissance ? formatDateForLTR(emp.date_naissance) : "",
          }
        : {
            "Unité": emp.latestUnite || "",
            "Responsabilité": emp.latestResponsibility || "",
          }),
      "Date retraite": emp.dateRetraite ? formatDateForLTR(emp.dateRetraite) : "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `retraites_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [sortedEmployees, showRetired])

  const exportToJSON = useCallback(() => {
    const dataToExport = sortedEmployees.map((emp, index) => ({
      numero: index + 1,
      prenom: emp.prenom || "",
      nom: emp.nom || "",
      matricule: emp.matricule || "",
      id_unique: emp.identifiant_unique || "",
      grade: emp.latestGrade || "",
      ...(showRetired
        ? {
            cin: emp.cin || "",
            date_naissance: emp.date_naissance || "",
          }
        : {
            unite: emp.latestUnite || "",
            responsabilite: emp.latestResponsibility || "",
          }),
      date_retraite: emp.dateRetraite || "",
    }))

    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `retraites_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [sortedEmployees, showRetired])

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
            {isRTL ? "لا يوجد موظفين" : "Aucun employé"}
          </h3>
          <p className={`text-gray-500 dark:text-gray-400 mb-6 ${isRTL ? titleFontClass : ""}`}>
            {isRTL ? "لا توجد بيانات للعرض" : "Aucune donnée à afficher"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl ${mainTitleFontClass} text-foreground`}>
              {isRTL ? "بـــــاب التـقـاعـــد" : "Gestion des retraites"}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`${isRTL ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 ${
                  isRTL ? titleFontClass : ""
                }`}
              >
                {sortedEmployees.length} {isRTL ? (
                  // En arabe: موظفيـن pour 0-10, 100-110, 200-210, etc. Sinon مـوظـف
                  (() => {
                    const remainder = sortedEmployees.length % 100
                    return remainder >= 0 && remainder <= 10 ? "موظفيـن" : "مـوظــف"
                  })()
                ) : "employés"}
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

      {/* Checkbox for retired employees */}
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id="show-retired"
          className="cursor-pointer border-gray-400 bg-gray-50 mr-1"
          checked={showRetired}
          onCheckedChange={(checked) => setShowRetired(checked as boolean)}
        />
        <label
          htmlFor="show-retired"
          className={`text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none ${
            isRTL ? titleFontClass : ''
          }`}
        >
          {isRTL ? 'المتقـاعـديــن' : 'Retraités'}
        </label>
      </div>

      <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41] min-h-150 flex flex-col">
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
            <div className="w-36">
              <Select
                dir={isRTL ? "rtl" : "ltr"}
                value={selectedYear}
                onValueChange={(value) => {
                  setSelectedYear(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger
                  className={`w-full h-8.5! px-2 py-1.5 text-sm border border-gray-300 dark:border-[#565656] rounded bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[rgb(7,103,132)] data-[state=open]:border-[rgb(7,103,132)] data-placeholder:text-gray-400 dark:data-placeholder:text-[#959594] dark:hover:bg-transparent ${
                    isRTL ? titleFontClass : ""
                  }`}
                >
                  <SelectValue placeholder={isRTL ? "إختر السنة" : "Sélectionner l'année"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50">
                  {yearOptions.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className={`px-2 py-1.5 text-sm hover:bg-[rgb(236,243,245)] dark:hover:bg-[#363C44] cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-[rgb(236,243,245)] dark:focus:bg-[#363C44] focus:text-[rgb(14,102,129)] dark:focus:text-white ${
                        isRTL ? titleFontClass : ""
                      }`}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-gray-500"
              title={isRTL ? t("employeesList.buttons.clearFilters") : "Réinitialiser les filtres"}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Export button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-white dark:bg-card border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-[14px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 rounded cursor-pointer"
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
            <table className="w-full table-fixed h-full">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-gray-200 dark:border-[#393A41]">
                <tr>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-14 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "العــدد" : "N°"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-48 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("nom")}
                  >
                    <div className="flex items-center ml-1">
                      {isRTL ? "هــويــــة المــوظــــف" : "Identité"}
                      {getSortIcon("nom")}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-24 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "الــرقــــم" : "Matricule"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-36 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "الــرقم الموحد" : "ID Unique"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-56 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {showRetired
                      ? isRTL ? "بطاقة التعريف الوطنية" : "CIN"
                      : isRTL ? "الــــــــوحــــــــــــــــدة" : "Unité"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-40 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {showRetired
                      ? isRTL ? "تــاريــخ الـــولادة" : "Date de naissance"
                      : isRTL ? "المســــؤوليــــــة" : "Responsabilité"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-28 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                  >
                    {isRTL ? "تاريخ التقاعد" : "Date retraite"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Search className="text-gray-400 dark:text-gray-500 w-8 h-8 mb-4 mx-auto" />
                      <p className={`text-gray-500 dark:text-gray-400 pt-6 ${isRTL ? titleFontClass : ""}`}>
                        {searchTerm.trim() || matriculeSearchTerm.trim()
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
                            <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-transparent shrink-0 overflow-hidden flex items-center justify-center relative">
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
                        <td className="px-6 py-2.5 w-36">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                          >
                            {employee.identifiant_unique || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-56">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                            title={showRetired ? (employee.cin || "-") : (employee.latestUnite || "-")}
                          >
                            {showRetired ? (employee.cin || "-") : (employee.latestUnite || "-")}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-40">
                          {(() => {
                            const displayValue = showRetired
                              ? employee.date_naissance
                                ? isRTL
                                  ? formatDateForRTL(employee.date_naissance)
                                  : formatDateForLTR(employee.date_naissance)
                                : "-"
                              : employee.latestResponsibility || "-"

                            return (
                              <span
                                className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                                  isRTL ? tableCellNotoFont : ""
                                } ${isRTL ? "text-[15px]" : ""}`}
                                title={displayValue}
                              >
                                {displayValue}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-2.5 w-28">
                          <span
                            className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                              isRTL ? tableCellNotoFont : ""
                            } ${isRTL ? "text-[15px]" : ""}`}
                          >
                            {employee.dateRetraite
                              ? isRTL
                                ? formatDateForRTL(employee.dateRetraite)
                                : formatDateForLTR(employee.dateRetraite)
                              : "-"}
                          </span>
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
            <div className={`flex w-30 items-center justify-center font-medium ${isRTL ? titleFontClass : ""}`}>
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
