"use client"

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { EMPLOYEE_LIST_SELECT_QUERY } from '@/utils/employee.utils'

// Configuration SWR optimisée pour de meilleures performances
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 10 * 1000, // Réduit à 10 secondes pour améliorer la réactivité
  errorRetryCount: 2, // Limite les tentatives en cas d'erreur
  errorRetryInterval: 1000, // Intervalle court entre les retries
  focusThrottleInterval: 5000, // Throttle les revalidations sur focus
}

// Fetcher pour les statistiques d'employés
const fetchEmployeeStatistics = async (year: number, periodType: 'monthly' | 'yearly' = 'monthly') => {
  const supabase = createClient()
  
  let query = supabase
    .from("employee_statistics")
    .select("period_date, total_employees, period_type")
    .eq("period_type", periodType)
    .order("period_date", { ascending: true })
  
  if (periodType === 'monthly') {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    query = query.gte("period_date", startDate).lte("period_date", endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error("Erreur récupération statistiques employés:", error)
    throw error
  }
  
  return data || []
}

// Fetchers spécifiques pour chaque type de données
const fetchRecentUnites = async (limit: number) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("unite")
    .select("id, unite, unite_categorie, unite_type, niveau_1, navigante")
    .order("created_at", { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error("Erreur récupération unités:", error)
    throw error
  }
  
  return data
}

const fetchColonelMajorEmployees = async (limit: number) => {
  const supabase = createClient()
  
  try {
    // D'abord, vérifions s'il y a des employés avec grade "Colonel Major"
    console.log("Tentative de récupération des employés Colonel Major...")
    
    // Approche simplifiée : récupérer les employés actifs avec leurs grades
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        matricule,
        nom,
        prenom,
        actif,
        identifiant_unique,
        sexe,
        employee_photos (
          photo_url
        ),
        employee_grades (
          grade,
          date_grade
        )
      `)
      .eq("actif", "مباشر")
      .limit(50) // Plus large pour filtrer côté client
    
    if (error) {
      console.error("Erreur Supabase brute:", error)
      throw error
    }
    
    if (!data || data.length === 0) {
      console.log("Aucun employé actif trouvé")
      return []
    }
    
    console.log(`${data.length} employés actifs trouvés`)
    
    // Filtrer côté client pour les Colonel Major
    const colonelMajorEmployees = data
      .filter(emp => {
        const hasColonelMajorGrade = emp.employee_grades?.some(
          (grade: any) => grade.grade === "Colonel Major"
        )
        return hasColonelMajorGrade
      })
      .map(emp => {
        // Trouver le grade Colonel Major le plus récent
        const colonelMajorGrades = emp.employee_grades?.filter(
          (grade: any) => grade.grade === "Colonel Major"
        ) || []
        
        const latestGrade = colonelMajorGrades.sort(
          (a: any, b: any) => new Date(a.date_grade).getTime() - new Date(b.date_grade).getTime()
        )[0]
        
        return {
          ...emp,
          latest_colonel_major_grade: latestGrade
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.latest_colonel_major_grade?.date_grade || 0)
        const dateB = new Date(b.latest_colonel_major_grade?.date_grade || 0)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, limit)
    
    console.log(`${colonelMajorEmployees.length} employés Colonel Major trouvés`)
    return colonelMajorEmployees
    
  } catch (error) {
    console.error("Erreur dans fetchColonelMajorEmployees:", error)
    
    // Fallback : retourner des employés actifs quelconques si Colonel Major échoue
    console.log("Fallback: récupération d'employés actifs génériques...")
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("employees")
        .select(`
          id,
          matricule,
          nom,
          prenom,
          actif,
          identifiant_unique,
          sexe,
          employee_photos (
            photo_url
          )
        `)
        .eq("actif", "مباشر")
        .limit(limit)
      
      if (fallbackError) {
        console.error("Erreur fallback:", fallbackError)
        return []
      }
      
      return fallbackData || []
    } catch (fallbackErr) {
      console.error("Erreur critique:", fallbackErr)
      return []
    }
  }
}

const fetchEmployeesList = async (page: number, pageSize: number) => {
  const supabase = createClient()
  const offset = (page - 1) * pageSize
  
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_LIST_SELECT_QUERY)
    .order("nom", { ascending: true })
    .range(offset, offset + pageSize - 1)
  
  if (error) {
    console.error("Erreur récupération liste employés:", error)
    throw error
  }
  
  return data
}

// Hook pour récupérer les unités récentes
export const useRecentUnites = (limit: number = 3) => {
  return useSWR(
    `recent-unites-${limit}`,
    () => fetchRecentUnites(limit),
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les unités
    }
  )
}

// Hook pour récupérer les employés Colonel Major
export const useColonelMajorEmployees = (limit: number = 3) => {
  return useSWR(
    `colonel-major-employees-${limit}`,
    () => fetchColonelMajorEmployees(limit),
    {
      ...SWR_CONFIG,
      refreshInterval: 2 * 60 * 1000, // 2 minutes pour les données d'employés
    }
  )
}

// Hook pour récupérer la liste des employés avec pagination
export const useEmployeesList = (page: number = 1, pageSize: number = 10) => {
  return useSWR(
    `employees-list-${page}-${pageSize}`,
    () => fetchEmployeesList(page, pageSize),
    {
      ...SWR_CONFIG,
      refreshInterval: 1 * 60 * 1000, // 1 minute pour la liste
    }
  )
}

const fetchCongesData = async () => {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('employee_conges')
      .select('date_debut, duree')
      .not('date_debut', 'is', null)
      .not('duree', 'is', null)
    
    if (error) {
      console.error("Erreur récupération données congés:", error)
      throw error
    }
    
    // Traiter les données pour les grouper par année et mois
    const monthlyData = new Map<string, { year2024: number; year2025: number }>()
    
    // Initialiser tous les mois
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    months.forEach(month => {
      monthlyData.set(month, { year2024: 0, year2025: 0 })
    })
    
    // Traiter les données
    data?.forEach((conge: { date_debut: string; duree: number }) => {
      const date = new Date(conge.date_debut)
      const year = date.getFullYear()
      const month = months[date.getMonth()]
      const duration = conge.duree || 0
      
      if (year === 2024) {
        const current = monthlyData.get(month)
        if (current) {
          monthlyData.set(month, { ...current, year2024: current.year2024 + duration })
        }
      } else if (year === 2025) {
        const current = monthlyData.get(month)
        if (current) {
          monthlyData.set(month, { ...current, year2025: current.year2025 + duration })
        }
      }
    })
    
    // Convertir en format attendu par le graphique
    return months.map(month => {
      const data = monthlyData.get(month)!
      return {
        month,
        desktop: data.year2024,
        mobile: data.year2025
      }
    })
    
  } catch (error) {
    console.error("Erreur dans fetchCongesData:", error)
    throw error
  }
}

const fetchOfficerGradesDistribution = async () => {
  const supabase = createClient()
  
  try {
    // Définir l'ordre des grades d'officier pour l'affichage (grades en arabe de la DB)
    const displayGrades = [
      'عميد', // Colonel Major
      'عقيد', // Colonel
      'مقدم', // Lieutenant Colonel
      'رائد', // Commandant
      'نقيب', // Capitaine
      'ملازم أول', // Lieutenant
      'ملازم' // Sous-Lieutenant
    ]
    
    // Récupérer tous les employés avec leur grade actuel
    const { data, error } = await supabase
      .from('employees')
      .select('grade_actuel')
      .in('grade_actuel', displayGrades)
      .not('grade_actuel', 'is', null)
    
    if (error) {
      console.error("Erreur récupération grades officiers:", error)
      throw error
    }
    
    // Initialiser les compteurs
    const gradeCounts = new Map<string, number>()
    displayGrades.forEach(grade => gradeCounts.set(grade, 0))
    
    // Compter chaque grade
    data?.forEach((employee: { grade_actuel: string }) => {
      if (employee.grade_actuel && gradeCounts.has(employee.grade_actuel)) {
        gradeCounts.set(employee.grade_actuel, gradeCounts.get(employee.grade_actuel)! + 1)
      }
    })
    
    // Convertir en format pour le graphique radar
    return displayGrades.map(grade => ({
      month: grade,
      count: gradeCounts.get(grade) || 0
    }))
    
  } catch (error) {
    console.error("Erreur dans fetchOfficerGradesDistribution:", error)
    throw error
  }
}

const fetchNCOGradesDistribution = async () => {
  const supabase = createClient()
  
  try {
    // Définir l'ordre des grades de sous-officier (grades en arabe de la DB)
    const ncoGrades = [
      'وكيل أول', // Adjudant Chef
      'وكيل', // Adjudant
      'رقيب أول', // Sergent Chef
      'رقيب', // Sergent
      'عريف أول', // Caporal Chef
      'عريف', // Caporal
      'حارس' // Garde (à vérifier si existe)
    ]
    
    // Récupérer tous les employés avec leur grade actuel de sous-officier
    const { data, error } = await supabase
      .from('employees')
      .select('grade_actuel')
      .in('grade_actuel', ncoGrades)
      .not('grade_actuel', 'is', null)
    
    if (error) {
      console.error("Erreur récupération grades sous-officiers:", error)
      throw error
    }
    
    // Initialiser les compteurs
    const gradeCounts = new Map<string, number>()
    ncoGrades.forEach(grade => gradeCounts.set(grade, 0))
    
    // Compter chaque grade
    data?.forEach((employee: { grade_actuel: string }) => {
      if (employee.grade_actuel && gradeCounts.has(employee.grade_actuel)) {
        gradeCounts.set(employee.grade_actuel, gradeCounts.get(employee.grade_actuel)! + 1)
      }
    })
    
    // Convertir en format pour le graphique radar
    return ncoGrades.map(grade => ({
      month: grade,
      count: gradeCounts.get(grade) || 0
    }))
    
  } catch (error) {
    console.error("Erreur dans fetchNCOGradesDistribution:", error)
    throw error
  }
}

const fetchDashboardStats = async () => {
  const supabase = createClient()
  
  try {
    // Exécuter toutes les requêtes de stats en parallèle
    const [totalEmployees, activeEmployees, inactiveEmployees, congesEmployees] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('actif', 'مباشر'),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('actif', 'غير مباشر'),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('actif', 'إجازة'),
    ])
    
    return {
      total: totalEmployees.count || 0,
      active: activeEmployees.count || 0,
      inactive: inactiveEmployees.count || 0,
      conges: congesEmployees.count || 0,
    }
  } catch (error) {
    console.error("Erreur récupération statistiques:", error)
    throw error
  }
}

// Hook pour récupérer les données de congés
export const useCongesData = () => {
  return useSWR(
    'conges-data',
    fetchCongesData,
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les données de congés
    }
  )
}

// Hook pour récupérer la distribution des grades d'officiers
export const useOfficerGradesDistribution = () => {
  return useSWR(
    'officer-grades-distribution',
    fetchOfficerGradesDistribution,
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les grades
    }
  )
}

// Hook pour récupérer la distribution des grades de sous-officiers
export const useNCOGradesDistribution = () => {
  return useSWR(
    'nco-grades-distribution',
    fetchNCOGradesDistribution,
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les grades
    }
  )
}

// Hook pour récupérer les statistiques du dashboard
export const useDashboardStats = () => {
  return useSWR(
    'dashboard-stats',
    fetchDashboardStats,
    {
      ...SWR_CONFIG,
      refreshInterval: 15 * 60 * 1000, // 15 minutes pour les stats
    }
  )
}

// Fetcher pour les statistiques d'unités
const fetchUniteStats = async () => {
  const supabase = createClient()
  
  try {
    // Exécuter toutes les requêtes de stats en parallèle
    const [totalUnites, administrativeUnites, operationalUnites] = await Promise.all([
      supabase.from('unite').select('id', { count: 'exact', head: true }),
      supabase.from('unite').select('id', { count: 'exact', head: true }).eq('unite_type', 'Administrative'),
      supabase.from('unite').select('id', { count: 'exact', head: true }).or('unite_type.eq.Operationnelle,unite_type.eq.Opérationnelle'),
    ])
    
    return {
      total: totalUnites.count || 0,
      administrative: administrativeUnites.count || 0,
      operational: operationalUnites.count || 0,
    }
  } catch (error) {
    console.error("Erreur récupération statistiques unités:", error)
    throw error
  }
}

// Hook pour récupérer les statistiques d'unités
export const useUniteStats = () => {
  return useSWR(
    'unite-stats',
    fetchUniteStats,
    {
      ...SWR_CONFIG,
      refreshInterval: 15 * 60 * 1000, // 15 minutes pour les stats
    }
  )
}

// Fetcher pour les statistiques d'employés par type d'affectation
const fetchEmployeeAffectationStats = async () => {
  const supabase = createClient()
  
  try {
    // D'abord, récupérer toutes les unités avec leurs types
    const { data: unitesData, error: unitesError } = await supabase
      .from('unite')
      .select('unite, unite_type')
    
    if (unitesError) {
      console.error("Erreur récupération unités:", unitesError)
      throw unitesError
    }
    
    // Créer un map pour les types d'unités
    const uniteTypeMap = new Map()
    unitesData?.forEach(unite => {
      uniteTypeMap.set(unite.unite, unite.unite_type)
    })
    
    // Récupérer les affectations actives
    const { data: affectationsData, error: affectationsError } = await supabase
      .from('employee_affectations')
      .select(`
        employee_id,
        unite,
        date_debut,
        date_fin
      `)
      .or('date_fin.is.null,date_fin.gt.' + new Date().toISOString().split('T')[0])
    
    if (affectationsError) {
      console.error("Erreur récupération affectations:", affectationsError)
      throw affectationsError
    }
    
    // Grouper par employé pour obtenir l'affectation la plus récente
    const employeeLatestAffectations = new Map()
    
    affectationsData?.forEach((affectation: any) => {
      const employeeId = affectation.employee_id
      const currentAffectation = employeeLatestAffectations.get(employeeId)
      
      if (!currentAffectation ||
          new Date(affectation.date_debut) > new Date(currentAffectation.date_debut)) {
        employeeLatestAffectations.set(employeeId, affectation)
      }
    })
    
    // Compter par type d'unité
    let administrativeCount = 0
    let operationalCount = 0
    
    employeeLatestAffectations.forEach((affectation) => {
      const uniteType = uniteTypeMap.get(affectation.unite)
      if (uniteType === 'Administrative') {
        administrativeCount++
      } else if (uniteType === 'Operationnelle' || uniteType === 'Opérationnelle') {
        operationalCount++
      }
    })
    
    return {
      administrative: administrativeCount,
      operational: operationalCount,
    }
  } catch (error) {
    console.error("Erreur dans fetchEmployeeAffectationStats:", error)
    throw error
  }
}

// Hook pour récupérer les statistiques d'affectations d'employés
export const useEmployeeAffectationStats = () => {
  return useSWR(
    'employee-affectation-stats',
    fetchEmployeeAffectationStats,
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les affectations
    }
  )
}

// Hook pour récupérer les statistiques d'employés
export const useEmployeeStatistics = (year: number = 2025, periodType: 'monthly' | 'yearly' = 'monthly') => {
  return useSWR(
    `employee-statistics-${year}-${periodType}`,
    () => fetchEmployeeStatistics(year, periodType),
    {
      ...SWR_CONFIG,
      refreshInterval: 10 * 60 * 1000, // 10 minutes pour les statistiques
    }
  )
}