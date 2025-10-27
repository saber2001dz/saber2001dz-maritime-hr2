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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import React, { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import Link from "next/link"
import {
  RawUniteData,
  DisplayUnite,
  processUniteData,
  UNITE_SELECT_QUERY,
} from "@/types/unite.types"

interface OrganigrammeTableClientProps {
  initialUnites: DisplayUnite[]
}

const ITEMS_PER_PAGE = 10

type SortKey = keyof DisplayUnite | null
type SortDirection = "ascending" | "descending"

interface SortConfig {
  key: SortKey
  direction: SortDirection
}

// Composant récursif pour les lignes expansibles
interface ExpandableUniteRowProps {
  unite: DisplayUnite
  index: number
  depth: number
  expandedRows: Set<string>
  childUnites: Record<string, DisplayUnite[]>
  loadingChildren: Record<string, boolean>
  toggleRowExpansion: (id: string, uniteName: string) => void
  getUniteIcon: (navigante: boolean) => React.ReactElement
}

function ExpandableUniteRow({
  unite,
  index,
  depth,
  expandedRows,
  childUnites,
  loadingChildren,
  toggleRowExpansion,
  getUniteIcon,
}: ExpandableUniteRowProps) {
  const isExpanded = expandedRows.has(unite.id)

  // Styles basés sur la profondeur avec des couleurs plus distinctes
  const bgColor = depth === 0 ? 'bg-white dark:bg-[#1C1C1C]' :
                  depth === 1 ? 'bg-[#F0F7FA] dark:bg-[#1E2428]' :
                  depth === 2 ? 'bg-[#E6F2F7] dark:bg-[#232A30]' :
                  'bg-[#DCE9F0] dark:bg-[#283038]'

  const hoverColor = depth === 0 ? 'hover:bg-gray-50 dark:hover:bg-[#252A2E]' :
                     depth === 1 ? 'hover:bg-[#E6F2F7] dark:hover:bg-[#252D33]' :
                     depth === 2 ? 'hover:bg-[#DCE9F0] dark:hover:bg-[#2A333B]' :
                     'hover:bg-[#D2E3EB] dark:hover:bg-[#2F3943]'

  const borderColor = depth === 0 ? 'border-gray-200 dark:border-[#393A41]' :
                      depth === 1 ? 'border-[#B8D4E0] dark:border-[#3E4147]' :
                      depth === 2 ? 'border-[#9FC4D4] dark:border-[#43464D]' :
                      'border-[#86B4C8] dark:border-[#484B53]'

  return (
    <>
      <tr className={`${hoverColor} border-b ${borderColor}`}>
        <td className="px-4 py-2 w-16">
          <span className="text-xs text-gray-900 dark:text-white font-noto-naskh-arabic">{index + 1}</span>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
              {getUniteIcon(unite.navigante ?? false)}
            </div>
            <Link
              href={`/ar/dashboard/unite/details/${unite.id}`}
              className="text-xs font-medium text-gray-900 dark:text-white hover:text-[#076784] transition-colors truncate font-noto-naskh-arabic"
              title={unite.unite || "غير محدد"}
            >
              {unite.unite || "غير محدد"}
            </Link>
          </div>
        </td>
        <td className="px-4 py-2 w-24">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => toggleRowExpansion(unite.id, unite.unite)}
              className={`p-1 rounded transition-colors ${
                loadingChildren[unite.id] || (childUnites[unite.id] && childUnites[unite.id].length === 0)
                  ? 'cursor-not-allowed opacity-30'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              disabled={loadingChildren[unite.id] || (childUnites[unite.id] && childUnites[unite.id].length === 0)}
              title={childUnites[unite.id] && childUnites[unite.id].length === 0 ? 'لا توجد وحدات فرعية' : ''}
            >
              {loadingChildren[unite.id] ? (
                <RefreshCw className="w-3 h-3 text-gray-600 dark:text-gray-400 animate-spin" />
              ) : isExpanded ? (
                <ChevronUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <Link
              href={`/ar/dashboard/unite/details/${unite.id}`}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors inline-block"
            >
              <Edit className="w-3 h-3" style={{ color: "rgb(7, 103, 132)" }} />
            </Link>
          </div>
        </td>
      </tr>

      {/* Sub-row récursive */}
      {isExpanded && childUnites[unite.id] && childUnites[unite.id].length > 0 && (
        <tr>
          <td colSpan={3} className="px-4 py-3">
            <div className="max-w-3xl" style={{ marginLeft: `${depth * 24}px` }}>
              <div className={`${bgColor} border-2 ${borderColor} rounded-lg shadow-md border-r-6 ${
                depth === 0 ? 'border-r-[#076784]' :
                depth === 1 ? 'border-r-[#2B778F]' :
                depth === 2 ? 'border-r-[#5DADE2]' :
                'border-r-[#8FC9DD]'
              }`}>
                {/* Titre de la section */}
                <div className={`px-4 py-2.5 ${depth === 0 ? 'bg-[#E8F4F8] dark:bg-[#1A2831]' : depth === 1 ? 'bg-[#EFF6F9] dark:bg-[#1F2D35]' : 'bg-[#F5F9FB] dark:bg-[#242F37]'} border-b-2 ${borderColor} rounded-t-md`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      depth === 0 ? 'bg-[#076784]' :
                      depth === 1 ? 'bg-[#2B778F]' :
                      depth === 2 ? 'bg-[#5DADE2]' :
                      'bg-[#8FC9DD]'
                    }`}></div>
                    <h4 className="text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic">
                      الوحدات الفرعية ({childUnites[unite.id].length})
                    </h4>
                  </div>
                </div>

                <table className="w-full border-separate border-spacing-0">
                  <thead className={`${depth === 0 ? 'bg-[#EFF6F9] dark:bg-[#1F2D35]' : depth === 1 ? 'bg-[#F5F9FB] dark:bg-[#242F37]' : 'bg-[#F9FBFC] dark:bg-[#2A3038]'} border-b-2 ${borderColor}`}>
                    <tr>
                      <th className="px-4 py-2.5 text-start text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic w-16">ع/ر</th>
                      <th className="px-4 py-2.5 text-start text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic">اسم الوحدة</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic w-24">الإجـــــــراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childUnites[unite.id].map((childUnite, childIndex) => (
                      <ExpandableUniteRow
                        key={childUnite.id}
                        unite={childUnite}
                        index={childIndex}
                        depth={depth + 1}
                        expandedRows={expandedRows}
                        childUnites={childUnites}
                        loadingChildren={loadingChildren}
                        toggleRowExpansion={toggleRowExpansion}
                        getUniteIcon={getUniteIcon}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Afficher le loader ou message vide */}
      {isExpanded && loadingChildren[unite.id] && (
        <tr>
          <td colSpan={3} className="p-4">
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 text-[#076784] animate-spin" />
              <span className="mr-3 text-xs text-gray-600 dark:text-gray-400 font-noto-naskh-arabic">جاري تحميل...</span>
            </div>
          </td>
        </tr>
      )}

      {isExpanded && !loadingChildren[unite.id] && (!childUnites[unite.id] || childUnites[unite.id].length === 0) && (
        <tr>
          <td colSpan={3} className="p-4">
            <div className="flex flex-col items-center justify-center py-4">
              <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">لا توجد وحدات فرعية</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function OrganigrammeTableClient({ initialUnites }: OrganigrammeTableClientProps) {
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [childUnites, setChildUnites] = useState<Record<string, DisplayUnite[]>>({})
  const [loadingChildren, setLoadingChildren] = useState<Record<string, boolean>>({})

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

  // Simple realtime setup
  useEffect(() => {
    console.log("Initialisation realtime unités...")

    const channel = supabase
      .channel('unites_changes_test')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'unite' },
        (payload: RealtimePostgresChangesPayload<RawUniteData>) => {
          console.log("Changement détecté:", payload)
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
    if (!sortConfig.key) {
      return [...filteredUnites].sort((a, b) => {
        const rankA = a.unite_rang
        const rankB = b.unite_rang

        if (rankA !== rankB) {
          return rankA - rankB
        }

        const nameA = a.unite || ""
        const nameB = b.unite || ""
        return nameA.localeCompare(nameB, "fr", { sensitivity: "base" })
      })
    }

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

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortConfig])

  // Fonction pour actualiser les données et reconnecter le realtime
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    console.log("Actualisation manuelle déclenchée...")

    setIsRefreshing(true)

    try {
      setRealtimeConnected(false)
      await refreshData()

      supabase
        .channel("unites_changes_test_" + Date.now())
        .on("postgres_changes", { event: "*", schema: "public", table: "unite" }, (payload: RealtimePostgresChangesPayload<RawUniteData>) => {
          console.log("Changement détecté:", payload)
          refreshData()
        })
        .subscribe((status: string) => {
          console.log("Statut realtime après refresh:", status)
          setRealtimeConnected(status === "SUBSCRIBED")
        })
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }, [refreshData, isRefreshing])

  // Fetch child unites - Enfants directs uniquement selon la hiérarchie
  const fetchChildUnites = useCallback(async (parentUniteName: string, parentId: string) => {
    setLoadingChildren(prev => ({ ...prev, [parentId]: true }))

    try {
      // Récupérer toutes les unités et filtrer côté client pour la hiérarchie
      const { data, error } = await supabase
        .from("unite")
        .select(UNITE_SELECT_QUERY)
        .neq('id', parentId)

      if (error) {
        console.error("Erreur récupération sous-unités:", error)
        setChildUnites(prev => ({ ...prev, [parentId]: [] }))
      } else if (data) {
        // Filtrer pour obtenir uniquement les enfants directs
        const directChildren = data.filter((unite: RawUniteData) => {
          // Enfants de niveau_1 : niveau_2 est vide/null
          if (unite.niveau_1 === parentUniteName && (!unite.niveau_2 || unite.niveau_2 === '')) {
            return true
          }
          // Enfants de niveau_2 : niveau_3 est vide/null
          if (unite.niveau_2 === parentUniteName && (!unite.niveau_3 || unite.niveau_3 === '')) {
            return true
          }
          // Enfants de niveau_3 : niveau_4 est vide/null
          if (unite.niveau_3 === parentUniteName && (!unite.niveau_4 || unite.niveau_4 === '')) {
            return true
          }
          // Enfants de niveau_4 (dernier niveau)
          if (unite.niveau_4 === parentUniteName) {
            return true
          }
          return false
        })

        // Trier : d'abord par unite_rang, puis par nom
        const sortedChildren = directChildren.sort((a: RawUniteData, b: RawUniteData) => {
          const rankA = a.unite_rang ?? 9999
          const rankB = b.unite_rang ?? 9999

          if (rankA !== rankB) {
            return rankA - rankB
          }

          const nameA = a.unite || ""
          const nameB = b.unite || ""
          return nameA.localeCompare(nameB, "ar")
        })

        const processedChildren = sortedChildren.map(processUniteData)
        setChildUnites(prev => ({ ...prev, [parentId]: processedChildren }))
      }
    } catch (err) {
      console.error("Erreur fetch enfants:", err)
      setChildUnites(prev => ({ ...prev, [parentId]: [] }))
    } finally {
      setLoadingChildren(prev => ({ ...prev, [parentId]: false }))
    }
  }, [supabase])

  // Toggle row expansion
  const toggleRowExpansion = useCallback(async (id: string, uniteName: string) => {
    // Si on collapse, on supprime juste de la liste
    if (expandedRows.has(id)) {
      setExpandedRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      return
    }

    // Si on expand, vérifier d'abord s'il y a des enfants
    // Si les enfants sont déjà chargés et qu'il n'y en a pas, ne rien faire
    if (childUnites[id] && childUnites[id].length === 0) {
      return
    }

    // Si les enfants ne sont pas encore chargés, les charger d'abord
    if (!childUnites[id]) {
      setLoadingChildren(prev => ({ ...prev, [id]: true }))

      try {
        const { data, error } = await supabase
          .from("unite")
          .select(UNITE_SELECT_QUERY)
          .neq('id', id)

        if (!error && data) {
          const directChildren = data.filter((unite: RawUniteData) => {
            if (unite.niveau_1 === uniteName && (!unite.niveau_2 || unite.niveau_2 === '')) return true
            if (unite.niveau_2 === uniteName && (!unite.niveau_3 || unite.niveau_3 === '')) return true
            if (unite.niveau_3 === uniteName && (!unite.niveau_4 || unite.niveau_4 === '')) return true
            if (unite.niveau_4 === uniteName) return true
            return false
          })

          // Si aucun enfant, ne pas expand
          if (directChildren.length === 0) {
            setChildUnites(prev => ({ ...prev, [id]: [] }))
            setLoadingChildren(prev => ({ ...prev, [id]: false }))
            return
          }

          // Trier et sauvegarder les enfants
          const sortedChildren = directChildren.sort((a: RawUniteData, b: RawUniteData) => {
            const rankA = a.unite_rang ?? 9999
            const rankB = b.unite_rang ?? 9999
            if (rankA !== rankB) return rankA - rankB
            return (a.unite || "").localeCompare(b.unite || "", "ar")
          })

          const processedChildren = sortedChildren.map(processUniteData)
          setChildUnites(prev => ({ ...prev, [id]: processedChildren }))

          // Expand seulement s'il y a des enfants
          setExpandedRows((prev) => {
            const newSet = new Set(prev)
            newSet.add(id)
            return newSet
          })
        }
      } catch (err) {
        console.error("Erreur fetch enfants:", err)
        setChildUnites(prev => ({ ...prev, [id]: [] }))
      } finally {
        setLoadingChildren(prev => ({ ...prev, [id]: false }))
      }
    } else {
      // Les enfants sont déjà chargés et il y en a, on expand
      setExpandedRows((prev) => {
        const newSet = new Set(prev)
        newSet.add(id)
        return newSet
      })
    }
  }, [childUnites, expandedRows, supabase])

  // Icône de tri
  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="mr-2 h-4 w-4" />
    ) : (
      <ArrowDown className="mr-2 h-4 w-4" />
    )
  }

  // Cas où il n'y a pas d'unités
  if (unites.length === 0) {
    return (
      <div className="mb-6">
        <div className="bg-white dark:bg-card rounded-sm p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">○</div>
          <h3 className="text-lg font-noto-naskh-arabic font-medium text-gray-900 dark:text-white mb-2">لا توجد وحدات</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-noto-naskh-arabic">ابدأ بإضافة وحدة جديدة</p>
          <Link
            href="/ar/dashboard/unite/nouveau"
            className="inline-flex items-center gap-2 text-white px-5 py-2 rounded font-medium transition-colors hover:opacity-90 font-noto-naskh-arabic"
            style={{ backgroundColor: "rgb(14, 102, 129)" }}
          >
            <Plus className="w-4 h-4" />
            وحــدة جـديـدة
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
            <h1 className="text-2xl font-jazeera-bold text-foreground">
              الهيكل التنظيمي
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                {unites.length} وحدة
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    realtimeConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-noto-naskh-arabic">
                  {realtimeConnected ? "الربط المباشر نشط" : "الربط المباشر غير نشط"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2.5 text-md cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-noto-naskh-arabic"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-sm px-8 py-6 border border-gray-200 dark:border-[#393A41] min-h-[600px] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full sm:max-w-lg">
            <div className="relative">
              <input
                type="text"
                className="w-full px-2 py-1.5 rtl:pl-8 border border-gray-300 dark:border-[#565656] rounded focus:outline-none focus:border-[rgb(7,103,132)] text-sm bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#959594] font-noto-naskh-arabic"
                placeholder="البحث في الوحدات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute rtl:left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <Link
            href="/ar/dashboard/unite/nouveau"
            className="bg-[#076784] hover:bg-[#2B778F] text-white px-6 py-2.5 rounded text-[14px] font-medium flex items-center gap-2 transition-colors font-noto-naskh-arabic"
          >
            <Plus className="w-4 h-4" />
            وحــدة جـديـدة
          </Link>
        </div>

        <div className="overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full table-fixed h-full">
              <thead className="bg-[#D7E7EC] dark:bg-[#17272D] border-b border-gray-200 dark:border-[#393A41]">
                <tr>
                  <th className="px-6 py-4 text-start text-[15px] font-semibold w-14 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic">
                    ع/ر
                  </th>
                  <th
                    className="px-6 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-48 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic"
                    onClick={() => requestSort("unite")}
                  >
                    <div className="flex items-center ml-1">اسم الوحدة{getSortIcon("unite")}</div>
                  </th>
                  <th
                    className="px-6 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-32 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic"
                    onClick={() => requestSort("unite_type")}
                  >
                    <div className="flex items-center">النوع{getSortIcon("unite_type")}</div>
                  </th>
                  <th
                    className="px-6 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-40 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic"
                    onClick={() => requestSort("niveau_1")}
                  >
                    <div className="flex items-center">الإدارة{getSortIcon("niveau_1")}</div>
                  </th>
                  <th
                    className="px-6 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-32 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic"
                    onClick={() => requestSort("unite_categorie")}
                  >
                    <div className="flex items-center">الفئة{getSortIcon("unite_categorie")}</div>
                  </th>
                  <th
                    className="px-6 py-4 text-start text-[15px] font-semibold cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/30 w-28 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic"
                    onClick={() => requestSort("navigante")}
                  >
                    <div className="flex items-center">الطبيعة{getSortIcon("navigante")}</div>
                  </th>
                  <th className="px-6 py-4 text-center text-[15px] font-semibold w-20 text-[#076784] dark:text-[#076784] font-noto-naskh-arabic">
                    الإجـــــــراء
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-[#393A41]">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Search className="text-gray-400 dark:text-gray-500 w-8 h-8 mb-4 mx-auto" />
                      <p className="text-gray-500 dark:text-gray-400 pt-6 font-noto-naskh-arabic">
                        {searchTerm.trim() ? "لا توجد نتائج للبحث" : "لا توجد بيانات للعرض"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((unite, index) => {
                    const overallIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    const isExpanded = expandedRows.has(unite.id)
                    return (
                      <React.Fragment key={`row-${unite.id}`}>
                        <tr
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
                              href={`/ar/dashboard/unite/details/${unite.id}`}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              <div className="font-medium text-gray-900 dark:text-white hover:text-[#076784] transition-colors leading-tight truncate font-jazeera-bold text-sm" title={unite.unite || "غير محدد"}>
                                {unite.unite || "غير محدد"}
                              </div>
                              <div className="text-[14px] mt-1 text-gray-500 dark:text-gray-400 truncate font-noto-naskh-arabic" title={unite.niveau_2 || "غير محدد"}>{unite.niveau_2 || "غير محدد"}</div>
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-2.5 w-32">
                          <span className="text-sm text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic text-[15px]" title={unite.unite_type || "غ/م"}>{unite.unite_type || "غ/م"}</span>
                        </td>
                        <td className="px-6 py-2.5 w-40">
                          <span className="text-sm text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic text-[15px]" title={unite.niveau_1 || "غير محدد"}>{unite.niveau_1 || "غير محدد"}</span>
                        </td>
                        <td className="px-6 py-2.5 w-32">
                          <span className="text-sm text-gray-700 dark:text-gray-300 block truncate font-noto-naskh-arabic text-[15px]" title={unite.unite_categorie || "غير محدد"}>
                            {unite.unite_categorie || "غير محدد"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-28">
                          <span
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium font-jazeera-bold text-[10px] ${
                              unite.navigante ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 me-1.5 rounded-full ${
                                unite.navigante ? "bg-blue-500" : "bg-green-500"
                              }`}
                            />
                            {unite.navigante ? "بحرية" : "برية"}
                          </span>
                        </td>
                        <td className="px-6 py-2.5 w-24">
                          <div className="flex items-center justify-center gap-2 flex-row-reverse">
                            <button
                              onClick={() => toggleRowExpansion(unite.id, unite.unite)}
                              className={`p-1.5 rounded transition-colors ${
                                loadingChildren[unite.id] || (childUnites[unite.id] && childUnites[unite.id].length === 0)
                                  ? 'cursor-not-allowed opacity-30'
                                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                              disabled={loadingChildren[unite.id] || (childUnites[unite.id] && childUnites[unite.id].length === 0)}
                              title={childUnites[unite.id] && childUnites[unite.id].length === 0 ? 'لا توجد وحدات فرعية' : ''}
                            >
                              {loadingChildren[unite.id] ? (
                                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400 animate-spin" />
                              ) : isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            <Link
                              href={`/ar/dashboard/unite/details/${unite.id}`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors inline-block"
                            >
                              <Edit className="w-4 h-4" style={{ color: "rgb(7, 103, 132)" }} />
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-row expandable - Table des sous-unités avec composant récursif */}
                      {isExpanded && childUnites[unite.id] && childUnites[unite.id].length > 0 && (
                        <tr className="bg-gray-50 dark:bg-[#2A2B2F]">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="max-w-3xl">
                              <div className="bg-[#F8FAFB] dark:bg-[#232629] border-2 border-gray-200 dark:border-[#3E4147] rounded-lg shadow-sm border-r-4 border-r-[#076784]">
                                {/* Titre de la section */}
                                <div className="px-4 py-2.5 bg-[#E8F4F8] dark:bg-[#1A2831] border-b-2 border-gray-300 dark:border-[#3E4147] rounded-t-md">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#076784]"></div>
                                    <h4 className="text-sm font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic">
                                      الوحدات الفرعية ({childUnites[unite.id].length})
                                    </h4>
                                  </div>
                                </div>

                                <table className="w-full border-separate border-spacing-0">
                                  <thead className="bg-[#EFF6F9] dark:bg-[#1F2D35] border-b-2 border-gray-300 dark:border-[#3E4147]">
                                    <tr>
                                      <th className="px-4 py-2.5 text-start text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic w-16">ع/ر</th>
                                      <th className="px-4 py-2.5 text-start text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic">اسم الوحدة</th>
                                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-[#076784] dark:text-[#5DADE2] font-noto-naskh-arabic w-24">الإجـــــــراء</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {childUnites[unite.id].map((childUnite, childIndex) => (
                                      <ExpandableUniteRow
                                        key={childUnite.id}
                                        unite={childUnite}
                                        index={childIndex}
                                        depth={1}
                                        expandedRows={expandedRows}
                                        childUnites={childUnites}
                                        loadingChildren={loadingChildren}
                                        toggleRowExpansion={toggleRowExpansion}
                                        getUniteIcon={getUniteIcon}
                                      />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isExpanded && loadingChildren[unite.id] && (
                        <tr className="bg-gray-50 dark:bg-[#2A2B2F]">
                          <td colSpan={7} className="px-8 py-6">
                            <div className="flex items-center justify-center">
                              <RefreshCw className="w-6 h-6 text-[#076784] animate-spin" />
                              <span className="mr-3 text-sm text-gray-600 dark:text-gray-400 font-noto-naskh-arabic">جاري تحميل الوحدات الفرعية...</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isExpanded && !loadingChildren[unite.id] && (!childUnites[unite.id] || childUnites[unite.id].length === 0) && (
                        <tr className="bg-gray-50 dark:bg-[#2A2B2F]">
                          <td colSpan={7} className="px-8 py-6">
                            <div className="flex flex-col items-center justify-center font-noto-naskh-arabic">
                              <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد وحدات فرعية</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end rtl:space-x-reverse ltr:lg:space-x-8 rtl:lg:space-x-reverse px-2 py-2 mt-auto text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center rtl:space-x-reverse">
              <p className="font-medium font-noto-naskh-arabic ml-2">صفوف لكل صفحة</p>
              <div className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1C1C1C] font-noto-naskh-arabic">
                {ITEMS_PER_PAGE}
              </div>
            </div>
            <div className="flex w-[120px] items-center justify-center font-medium font-noto-naskh-arabic">
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
    </div>
  )
}
