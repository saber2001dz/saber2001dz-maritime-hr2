import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { 
  OrgChartData, 
  OrgChartEmployee, 
  groupByHierarchy,
  transformToOrgChart,
  type OrgChartNode
} from '@/utils/orgchart.utils'
import type { Database } from '@/types/database.types'

type UniteRow = Database['public']['Tables']['unite']['Row']

interface OrgChartFilters {
  niveau1?: string
  uniteCategorie?: string
  searchTerm?: string
}

const supabase = createClient()

/**
 * Fetcher pour récupérer les données de l'organigramme
 */
const fetcher = async (): Promise<{ 
  unites: UniteRow[], 
  employees: OrgChartEmployee[] 
}> => {
  // Récupérer toutes les unités
  const { data: unites, error: unitesError } = await supabase
    .from('unite')
    .select(`
      id,
      unite,
      unite_categorie,
      niveau_1,
      niveau_2,
      niveau_3,
      parent_id,
      unite_responsable,
      unite_rang,
      navigante,
      created_at,
      updated_at
    `)
    .order('unite_rang', { ascending: true, nullsFirst: false })

  if (unitesError) {
    throw new Error(`Erreur lors de la récupération des unités: ${unitesError.message}`)
  }

  // Récupérer les employés avec leurs affectations actives
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select(`
      id,
      nom,
      prenom,
      grade_actuel,
      employee_affectations!inner(
        unite,
        responsibility,
        hierarchy_level,
        date_debut
      ),
      employee_photos(
        photo_url
      )
    `)
    .is('employee_affectations.date_fin', null)
    .not('employee_affectations.responsibility', 'is', null)

  if (employeesError) {
    throw new Error(`Erreur lors de la récupération des employés: ${employeesError.message}`)
  }

  // Transformer les données des employés
  const transformedEmployees: OrgChartEmployee[] = (employees || []).map(emp => ({
    id: emp.id,
    nom: emp.nom || '',
    prenom: emp.prenom || '',
    grade_actuel: emp.grade_actuel,
    unite: emp.employee_affectations?.[0]?.unite || null,
    responsibility: emp.employee_affectations?.[0]?.responsibility || null,
    hierarchy_level: emp.employee_affectations?.[0]?.hierarchy_level || null,
    photo_url: emp.employee_photos?.[0]?.photo_url || undefined
  }))

  return {
    unites: unites || [],
    employees: transformedEmployees
  }
}

/**
 * Hook pour récupérer et transformer les données de l'organigramme
 */
export function useOrgChartData(filters: OrgChartFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['orgchart-data', JSON.stringify(filters)],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh toutes les 5 minutes
      dedupingInterval: 30000, // Éviter les requêtes dupliquées pendant 30s
    }
  )

  // Transformer les données en format organigramme
  const orgChartData = React.useMemo(() => {
    if (!data) return null

    try {
      // Grouper par hiérarchie
      const grouped = groupByHierarchy(data.unites, data.employees)
      
      // Appliquer les filtres si nécessaire
      let filtered = grouped
      if (filters.niveau1 || filters.uniteCategorie || filters.searchTerm) {
        filtered = applyFilters(grouped, filters)
      }

      // Si pas de données après filtrage, retourner null
      if (filtered.length === 0) return null

      // Transformer en format react-org-chart (prendre le premier élément racine)
      return transformToOrgChart(filtered)
    } catch (transformError) {
      console.error('Erreur lors de la transformation des données:', transformError)
      return null
    }
  }, [data, filters])

  // Statistiques de l'organigramme
  const stats = React.useMemo(() => {
    if (!data) return null

    return {
      totalUnites: data.unites.length,
      totalEmployees: data.employees.length,
      totalWithResponsibilities: data.employees.filter(emp => emp.responsibility).length,
      byNiveau1: data.unites.reduce((acc, unite) => {
        const niveau1 = unite.niveau_1 || 'Non défini'
        acc[niveau1] = (acc[niveau1] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byCategorie: data.unites.reduce((acc, unite) => {
        const categorie = unite.unite_categorie || 'Non défini'
        acc[categorie] = (acc[categorie] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [data])

  return {
    orgChartData,
    rawData: data,
    stats,
    isLoading,
    error: error?.message || null,
    refresh: mutate
  }
}

/**
 * Applique les filtres aux données groupées
 */
function applyFilters(data: OrgChartData[], filters: OrgChartFilters): OrgChartData[] {
  return data.filter(item => {
    let matches = true

    if (filters.niveau1 && item.unite.niveau_1 !== filters.niveau1) {
      matches = false
    }

    if (filters.uniteCategorie && item.unite.unite_categorie !== filters.uniteCategorie) {
      matches = false
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const uniteName = item.unite.unite?.toLowerCase() || ''
      const employeeNames = item.employees.map(emp => 
        `${emp.prenom} ${emp.nom}`.toLowerCase()
      ).join(' ')
      
      if (!uniteName.includes(searchLower) && !employeeNames.includes(searchLower)) {
        matches = false
      }
    }

    return matches
  }).map(item => ({
    ...item,
    // Appliquer les filtres récursivement aux enfants
    children: item.children ? applyFilters(item.children, filters) : undefined
  })).filter(item => 
    // Garder les items qui matchent ou qui ont des enfants qui matchent
    item.children === undefined || item.children.length > 0
  )
}

/**
 * Hook pour les options de filtre
 */
export function useOrgChartFilters() {
  const { rawData } = useOrgChartData()

  const filterOptions = React.useMemo(() => {
    if (!rawData) return { niveau1Options: [], categorieOptions: [] }

    const niveau1Options = Array.from(
      new Set(rawData.unites.map(u => u.niveau_1).filter(v => v && v.trim() !== ''))
    ).sort()

    const categorieOptions = Array.from(
      new Set(rawData.unites.map(u => u.unite_categorie).filter(v => v && v.trim() !== ''))
    ).sort()

    return {
      niveau1Options,
      categorieOptions
    }
  }, [rawData])

  return filterOptions
}

// Import React pour useMemo
import React from 'react'