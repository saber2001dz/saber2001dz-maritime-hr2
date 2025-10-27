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
  Ship,
  Building2,
  Search,
} from "lucide-react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  RawUniteData,
  DisplayUnite,
  processUniteData,
  UNITE_SELECT_QUERY,
} from "@/types/unite.types"
import { useLocale } from "next-intl"
import { useParams } from "next/navigation"
import { getTableCellFont, getTitleFont, getCardSubtitleFont, getMainTitleFont, getTableCellNotoFont } from "@/lib/direction"
import type { Locale } from "@/lib/types"

interface SimpleUniteTableProps {
  initialUnites: DisplayUnite[]
}

const ITEMS_PER_PAGE = 10

type SortKey = keyof DisplayUnite | null
type SortDirection = "ascending" | "descending"

interface SortConfig {
  key: SortKey
  direction: SortDirection
}


export function SimpleUniteTable({ initialUnites }: SimpleUniteTableProps) {
  const locale = useLocale()
  const params = useParams()
  const isRTL = params.locale === "ar"
  const cardSubtitleFontClass = getCardSubtitleFont(params.locale as Locale)
  const mainTitleFontClass = getMainTitleFont(params.locale as Locale)
  const titleFontClass = getTitleFont(params.locale as Locale)
  const tableCellFontClass = getTableCellFont(params.locale as Locale)
  const tableCellNotoFont = getTableCellNotoFont(params.locale as Locale)
  const [unites, setUnites] = useState<DisplayUnite[]>(initialUnites)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "ascending",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createClient()

  // Fonction de refresh des données
  const refreshData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("unite")
        .select(UNITE_SELECT_QUERY)

      if (error) {
        console.error("Erreur rechargement unités:", error)
        return
      }

      if (data) {
        const processedUnites = data.map(processUniteData)
        setUnites(processedUnites)
      }
    } catch (error) {
      console.error("Erreur refresh unités:", error)
    }
  }, [supabase])

  // Restaurer l'état uniquement depuis sessionStorage (navigation depuis détails)
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const savedParams = sessionStorage.getItem("uniteTableParams")
    if (savedParams) {
      const urlParams = new URLSearchParams(savedParams)
      const urlSearchTerm = urlParams.get("search") || ""
      const urlSortKey = urlParams.get("sortKey") as SortKey
      const urlSortDirection = urlParams.get("sortDirection") as SortDirection
      const urlPage = parseInt(urlParams.get("page") || "1")

      setSearchTerm(urlSearchTerm)
      setCurrentPage(urlPage)

      if (urlSortKey && urlSortDirection) {
        setSortConfig({
          key: urlSortKey,
          direction: urlSortDirection,
        })
      }

      // Nettoyer le sessionStorage après restauration
      sessionStorage.removeItem("uniteTableParams")
    }
  }, [])

  // Vérifier si une unité doit être mise en évidence au chargement
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") return

    const highlightId = sessionStorage.getItem("highlightUniteId")
    if (highlightId) {
      setHighlightedId(highlightId)
      sessionStorage.removeItem("highlightUniteId")

      // Supprimer la mise en évidence après 3 secondes
      setTimeout(() => {
        setHighlightedId(null)
      }, 3000)
    }
  }, [])

  // Restaurer la position de scroll après la mise en évidence
  useEffect(() => {
    if (typeof window === "undefined") return

    const scrollPosition = sessionStorage.getItem("scrollPosition")
    if (scrollPosition && highlightedId) {
      // Utiliser setTimeout pour s'assurer que le DOM est mis à jour après la mise en évidence
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(scrollPosition),
          behavior: 'smooth'
        })
        sessionStorage.removeItem("scrollPosition")
      }, 100)
    }
  }, [highlightedId])

  // Simple realtime setup
  useEffect(() => {
    console.log("Initialisation realtime unités...")
    
    const channel = supabase
      .channel('unites_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'unite' }, 
        (payload: RealtimePostgresChangesPayload<RawUniteData>) => {
          console.log("Changement détecté:", payload)
          // Recharger les données complètement pour simplifier
          refreshData()
        }
      )
      .subscribe((status: string) => {
        console.log('Statut realtime unités:', status)
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => {
      channel.unsubscribe()
    }
  }, [refreshData])

  // Fonction de normalisation pour la recherche
  const normalize = useCallback((str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }, [])

  // Fonction de tri
  const requestSort = useCallback((key: SortKey) => {
    if (!key) return
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }))
  }, [])

  // Fonction pour obtenir l'icône selon le type d'unité
  const getUniteIcon = (navigante: boolean) => {
    return navigante ? (
      <Ship className="w-5 h-5" style={{ color: "#076784" }} />
    ) : (
      <Building2 className="w-5 h-5" style={{ color: "#076784" }} />
    )
  }

  // Filtrage des unités
  const filteredUnites = useMemo(() => {
    let filtered = unites

    if (searchTerm.trim()) {
      const normalizedSearchTerm = normalize(searchTerm)
      filtered = filtered.filter((unite) => {
        const normalizedUnite = normalize(unite.unite || "")
        const normalizedNiveau = normalize(unite.niveau_1 || "")
        const normalizedType = normalize(unite.unite_type || "")
        const normalizedCategorie = normalize(unite.unite_categorie || "")
        
        return (
          normalizedUnite.includes(normalizedSearchTerm) ||
          normalizedNiveau.includes(normalizedSearchTerm) ||
          normalizedType.includes(normalizedSearchTerm) ||
          normalizedCategorie.includes(normalizedSearchTerm)
        )
      })
    }

    return filtered
  }, [unites, searchTerm, normalize])

  // Tri des unités
  const sortedUnites = useMemo(() => {
    // Si aucune clé de tri sélectionnée, appliquer le tri par unite_rang par défaut
    if (!sortConfig.key) {
      return [...filteredUnites].sort((a, b) => {
        // Tri primaire : par unite_rang (ordre croissant)
        const rankA = a.unite_rang
        const rankB = b.unite_rang
        
        if (rankA !== rankB) {
          return rankA - rankB
        }
        
        // Tri secondaire : par nom d'unité (alphabétique)
        const nameA = a.unite || ""
        const nameB = b.unite || ""
        return nameA.localeCompare(nameB, "fr", { sensitivity: "base" })
      })
    }

    // Sinon appliquer le tri demandé par l'utilisateur
    return [...filteredUnites].sort((a, b) => {
      const valA = a[sortConfig.key as keyof DisplayUnite]
      const valB = b[sortConfig.key as keyof DisplayUnite]

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      let comparison = 0

      if (typeof valA === "string" && typeof valB === "string") {
        comparison = valA.localeCompare(valB, "fr", { sensitivity: "base" })
      } else if (typeof valA === "boolean" && typeof valB === "boolean") {
        comparison = valA === valB ? 0 : valA ? -1 : 1
      } else if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB
      }

      return sortConfig.direction === "ascending" ? comparison : -comparison
    })
  }, [filteredUnites, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedUnites.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedUnites, currentPage])

  const totalPages = Math.ceil(sortedUnites.length / ITEMS_PER_PAGE)

  // Ajuster la pagination pour afficher l'unité mise en évidence
  useEffect(() => {
    if (highlightedId && sortedUnites.length > 0) {
      const uniteIndex = sortedUnites.findIndex((unite) => unite.id === highlightedId)
      if (uniteIndex !== -1) {
        const targetPage = Math.floor(uniteIndex / ITEMS_PER_PAGE) + 1
        setCurrentPage(targetPage)
      }
    }
  }, [highlightedId, sortedUnites])

  // Sauvegarder automatiquement l'état de la table dans sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (sortConfig.key && sortConfig.key !== null) {
      params.set("sortKey", sortConfig.key)
      params.set("sortDirection", sortConfig.direction)
    }
    if (currentPage > 1) params.set("page", currentPage.toString())

    sessionStorage.setItem("uniteTableParams", params.toString())
  }, [searchTerm, sortConfig, currentPage])

  // Fonction pour sauvegarder l'état actuel avec position de scroll (pour les clics de navigation)
  const saveCurrentParams = useCallback(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (sortConfig.key && sortConfig.key !== null) {
      params.set("sortKey", sortConfig.key)
      params.set("sortDirection", sortConfig.direction)
    }
    if (currentPage > 1) params.set("page", currentPage.toString())

    // Sauvegarder la position de scroll
    sessionStorage.setItem("scrollPosition", window.scrollY.toString())
    sessionStorage.setItem("uniteTableParams", params.toString())
  }, [searchTerm, sortConfig, currentPage])

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortConfig])

  // Fonction pour actualiser les données et reconnecter le realtime
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
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
        .channel("unites_changes_" + Date.now()) // Nouveau nom pour forcer la reconnexion
        .on("postgres_changes", { event: "*", schema: "public", table: "unite" }, (payload: RealtimePostgresChangesPayload<RawUniteData>) => {
          console.log("Changement détecté:", payload)
          refreshData()
        })
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
  }, [refreshData, isRefreshing])

  // Icône de tri
  const getSortIcon = (columnKey: SortKey) => {
    const spacingClass = isRTL ? "mr-2" : "ml-2"
    if (sortConfig.key !== columnKey) return <ArrowUpDown className={`${spacingClass} h-4 w-4 text-gray-400 dark:text-gray-500`} />
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className={`${spacingClass} h-4 w-4`} />
    ) : (
      <ArrowDown className={`${spacingClass} h-4 w-4`} />
    )
  }

  // Cas où il n'y a pas d'unités
  if (unites.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-white dark:bg-card rounded-sm p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">○</div>
          <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 ${getTitleFont(locale as any)}`}>{isRTL ? "لا توجد وحدات" : "Aucune unité trouvée"}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{isRTL ? "ابدأ بإضافة وحدة جديدة" : "Commencez par ajouter une nouvelle unité"}</p>
          <Link
            href="/dashboard/unite/nouveau"
            className="inline-flex items-center gap-2 text-white px-5 py-2 rounded font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "rgb(14, 102, 129)" }}
          >
            <Plus className="w-4 h-4" />
            {isRTL ? "وحــدة جـديـدة" : "Nouvelle unité"}
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
              {isRTL ? "قائمة الوحدات" : "Liste des unités"}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`${isRTL ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 ${
                  isRTL ? titleFontClass : ""
                }`}
              >
                {unites.length} {unites.length === 1 ? (isRTL ? "وحدة" : "unité") : (isRTL ? "وحدة" : "unités")}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    realtimeConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`${isRTL ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 ${
                    isRTL ? titleFontClass : ""
                  }`}
                >
                  {realtimeConnected ? (isRTL ? "الربط المباشر نشط" : "Actif") : (isRTL ? "الربط المباشر غير نشط" : "Inactif")}
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
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRTL ? "تحديث" : "Actualiser"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41] min-h-[600px] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full sm:max-w-lg">
            <div className="relative">
              <input
                type="text"
                className={`w-full px-2 py-1.5 ltr:pr-8 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] ${
                  isRTL ? titleFontClass : ""
                }`}
                placeholder={isRTL ? "البحث في الوحدات..." : "Rechercher dans les unités..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute ltr:right-1.5 rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/unite/nouveau"
            className={`bg-[#076784] hover:bg-[#2B778F] text-white px-6 py-2.5 rounded text-[14px] font-medium flex items-center gap-2 transition-colors ${
              isRTL ? titleFontClass : ""
            }`}
          >
            <Plus className="w-4 h-4" />
            {isRTL ? "وحــدة جـديـدة" : "Nouvelle unité"}
          </Link>
        </div>

        <div className="overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full table-fixed h-full">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-gray-200 dark:border-[#393A41]">
                <tr>
                  <th className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-14 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}>
                    {isRTL ? "ع/ر" : "Ordre"}
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-48 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("unite")}
                  >
                    <div className="flex items-center ml-1">{isRTL ? "اسم الوحدة" : "Nom de l'unité"}{getSortIcon("unite")}</div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-32 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("unite_type")}
                  >
                    <div className="flex items-center">{isRTL ? "النوع" : "Type"}{getSortIcon("unite_type")}</div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-40 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("niveau_1")}
                  >
                    <div className="flex items-center">{isRTL ? "الإدارة" : "Direction"}{getSortIcon("niveau_1")}</div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-32 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("unite_categorie")}
                  >
                    <div className="flex items-center">{isRTL ? "الفئة" : "Catégorie"}{getSortIcon("unite_categorie")}</div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-28 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}
                    onClick={() => requestSort("navigante")}
                  >
                    <div className="flex items-center">{isRTL ? "الطبيعة" : "Nature"}{getSortIcon("navigante")}</div>
                  </th>
                  <th className={`px-6 py-4 text-start text-[15px] ${
                      isRTL ? "font-semibold" : "font-medium"
                    } w-16 text-[#076784] dark:text-[#076784] ${cardSubtitleFontClass}`}>
                    {isRTL ? "الإجراء" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Search className="text-gray-400 dark:text-gray-500 w-8 h-8 mb-4 mx-auto" />
                      <p className={`text-gray-500 dark:text-gray-400 pt-6 ${isRTL ? titleFontClass : ''}`}>
                        {searchTerm.trim()
                          ? (isRTL ? "لا توجد نتائج للبحث" : "Aucun résultat trouvé")
                          : (isRTL ? "لا توجد بيانات للعرض" : "Aucune donnée à afficher")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((unite, index) => {
                    const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    return (
                      <tr 
                        key={`data-${unite.id}`}
                        className={`${
                          highlightedId === unite.id ? 'animate-highlightBlink' : 'hover:bg-gray-50 dark:hover:bg-[#363C44]'
                        }`}
                      >
                        <td className="px-6 py-2.5 w-14">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{overallIndex}</span>
                        </td>
                        <td className="px-6 py-2.5 w-48">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-transparent flex-shrink-0 flex items-center justify-center">
                              {getUniteIcon(unite.navigante ?? false)}  
                            </div>
                            <Link
                              href={`/${params.locale}/dashboard/unite/details/${unite.id}`}
                              className="min-w-0 flex-1 cursor-pointer"
                              onClick={saveCurrentParams}
                            >
                              <div className={`text-base font-medium text-gray-900 dark:text-white hover:text-[#076784] transition-colors leading-tight truncate ${
                                isRTL ? tableCellFontClass : ""
                              }`} title={unite.unite || (isRTL ? "غير محدد" : "Non défini")}>
                                {unite.unite || (isRTL ? "غير محدد" : "Non défini")}
                              </div>
                              <div className={`text-[14px] mt-1 text-gray-500 dark:text-gray-400 truncate ${
                                isRTL ? tableCellNotoFont : ""
                              }`} title={unite.niveau_2 || (isRTL ? "غير محدد" : "Non défini")}>{unite.niveau_2 || (isRTL ? "غير محدد" : "Non défini")}</div>
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 w-32">
                          <span className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                            isRTL ? tableCellNotoFont : ""
                          } ${isRTL ? "text-[15px]" : ""}`} title={unite.unite_type || (isRTL ? "غ/م" : "N/A")}>{unite.unite_type || (isRTL ? "غ/م" : "N/A")}</span>
                        </td>
                        <td className="px-6 py-2.5 w-40">
                          <span className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                            isRTL ? tableCellNotoFont : ""
                          } ${isRTL ? "text-[15px]" : ""}`} title={unite.niveau_1 || (isRTL ? "غير محدد" : "Non défini")}>{unite.niveau_1 || (isRTL ? "غير محدد" : "Non défini")}</span>
                        </td>
                        <td className="px-6 py-2.5 w-32">
                          <span className={`text-sm text-gray-700 dark:text-gray-300 block truncate ${
                            isRTL ? tableCellNotoFont : ""
                          } ${isRTL ? "text-[15px]" : ""}`} title={unite.unite_categorie || (isRTL ? "غير محدد" : "Non défini")}>
                            {unite.unite_categorie || (isRTL ? "غير محدد" : "Non défini")}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-28">
                          <span
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                              isRTL ? tableCellFontClass : ""
                            } ${isRTL ? "text-[10px]" : ""} ${
                              unite.navigante ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 me-1.5 rounded-full ${
                                unite.navigante ? "bg-blue-500" : "bg-green-500"
                              }`}
                            />
                            {unite.navigante ? (isRTL ? "بحرية" : "Navigante") : (isRTL ? "برية" : "Terrestre")}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-16">
                          <Link
                            href={`/${params.locale}/dashboard/unite/details/${unite.id}`}
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
          <div className="flex items-center justify-end ltr:space-x-6 rtl:space-x-reverse ltr:lg:space-x-8 rtl:lg:space-x-reverse px-2 py-2 mt-auto text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center ltr:space-x-2 rtl:space-x-reverse">
              <p className={`font-medium ${isRTL ? `${titleFontClass} ml-2` : ''}`}>{isRTL ? "صفوف لكل صفحة" : "Lignes par page"}</p>
              <div className={`px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] ${isRTL ? titleFontClass : ''}`}>
                {ITEMS_PER_PAGE}
              </div>
            </div>
            <div className={`flex w-[120px] items-center justify-center font-medium ${isRTL ? titleFontClass : ''}`}>
              {isRTL ? "صفحة" : "Page"} {currentPage} {isRTL ? "من" : "sur"} {totalPages}
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