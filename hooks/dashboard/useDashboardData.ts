"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EMPLOYEE_LIST_SELECT_QUERY, processEmployeeData } from '@/utils/employee.utils'
import { useRealtimeStore } from '@/stores/realtime-store'
import { 
  getPreviousMonthDate, 
  calculateEmployeeTrends
} from '@/utils/dashboard/trend-calculator.utils'
import type { EmployeeTrends } from '@/types/dashboard'
import type {
  DashboardData,
  UseDashboardDataReturn,
  UseDashboardDataParams,
  GenderStatistics
} from '@/types/dashboard/dashboard.types'

// Fetchers pour chaque type de données
const fetchDashboardStats = async () => {
  const supabase = createClient()
  
  const [activeEmployees, inactiveEmployees] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('actif', 'مباشر'),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('actif', 'غير مباشر'),
  ])
  
  return {
    active: activeEmployees.count || 0,
    inactive: inactiveEmployees.count || 0,
  }
}

const fetchUniteStats = async () => {
  const supabase = createClient()
  
  const [totalUnites, administrativeUnites, operationalUnites] = await Promise.all([
    supabase.from('unite').select('id', { count: 'exact', head: true }),
    supabase.from('unite').select('id', { count: 'exact', head: true }).eq('unite_type', 'وحدة إدارية'),
    supabase.from('unite').select('id', { count: 'exact', head: true }).eq('unite_type', 'وحدة نشيطة'),
  ])
  
  return {
    total: totalUnites.count || 0,
    administrative: administrativeUnites.count || 0,
    operational: operationalUnites.count || 0,
  }
}

const fetchEmployeeStatistics = async () => {
  const supabase = createClient()
  
  try {
    // Récupérer toutes les statistiques depuis employee_statistics
    const { data, error } = await supabase
      .from('employee_statistics')
      .select('total_employees, total_conges, total_administration, total_operationnel, period_date')
      .eq('period_type', 'daily')
      .order('period_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // Si aucune statistique n'existe, essayer de générer les statistiques automatiquement
      console.warn('Aucune statistique trouvée, tentative de génération automatique:', error.message)
      
      // Appeler la fonction de génération des statistiques
      const { error: generateError } = await supabase.rpc('generate_employee_statistics')
      
      if (generateError) {
        console.error('Erreur lors de la génération des statistiques:', generateError)
        throw generateError
      }
      
      // Réessayer la récupération après génération
      const { data: retryData, error: retryError } = await supabase
        .from('employee_statistics')
        .select('total_employees, total_conges, total_administration, total_operationnel')
        .eq('period_type', 'daily')
        .order('period_date', { ascending: false })
        .limit(1)
        .single()
      
      if (retryError) {
        console.error('Impossible de récupérer les statistiques après génération:', retryError)
        // Fallback: retourner des valeurs par défaut
        return {
          total: 0,
          conges: 0,
          administrative: 0,
          operational: 0,
        }
      }
      
      return {
        total: retryData?.total_employees || 0,
        conges: retryData?.total_conges || 0,
        administrative: retryData?.total_administration || 0,
        operational: retryData?.total_operationnel || 0,
      }
    }
    
    return {
      total: data?.total_employees || 0,
      conges: data?.total_conges || 0,
      administrative: data?.total_administration || 0,
      operational: data?.total_operationnel || 0,
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques employés:', error)
    
    // Fallback en cas d'erreur critique: retourner des valeurs par défaut
    return {
      total: 0,
      conges: 0,
      administrative: 0,
      operational: 0,
    }
  }
}

const fetchCongesData = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('employee_conges')
    .select('date_debut, duree')
    .not('date_debut', 'is', null)
    .not('duree', 'is', null)
  
  if (error) {
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
      previousYear: data.year2024,
      currentYear: data.year2025
    }
  })
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
const fetchGenderStatistics = async (): Promise<GenderStatistics> => {
  const supabase = createClient()
  
  try {
    // Récupérer tous les employés avec sexe, date de naissance et état civil
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select(`
        id,
        sexe,
        date_naissance,
        actif,
        employee_etat_civil(
          etat_civil,
          identite_conjoint
        )
      `)
    
    if (employeesError) {
      console.error('Erreur lors de la récupération des employés:', employeesError)
      throw employeesError
    }
    
    // Initialiser les compteurs et accumulateurs
    let masculinCount = 0
    let femininCount = 0
    let masculinAgeSum = 0
    let femininAgeSum = 0
    let masculinMariedCount = 0
    let femininMariedCount = 0
    let masculinWithAge = 0
    let femininWithAge = 0
    
    const currentDate = new Date()
    
    // Traiter chaque employé
    employeesData?.forEach((employee: any) => {
      const sexe = employee.sexe
      
      // Ignorer si le sexe n'est pas défini
      if (!sexe || (sexe !== 'ذكر' && sexe !== 'أنثى')) {
        return
      }
      
      // Compter par genre
      if (sexe === 'ذكر') {
        masculinCount++
      } else if (sexe === 'أنثى') {
        femininCount++
      }
      
      // Calculer l'âge si date de naissance disponible
      if (employee.date_naissance) {
        const birthDate = new Date(employee.date_naissance)
        const age = currentDate.getFullYear() - birthDate.getFullYear()
        const monthDiff = currentDate.getMonth() - birthDate.getMonth()
        
        // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
        const finalAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age
        
        if (sexe === 'ذكر') {
          masculinAgeSum += finalAge
          masculinWithAge++
        } else if (sexe === 'أنثى') {
          femininAgeSum += finalAge
          femininWithAge++
        }
      }
      
      // Vérifier le statut matrimonial
      const etatCivil = employee.employee_etat_civil?.[0]
      const isMarie = etatCivil && (
        etatCivil.etat_civil?.includes('متزوج') || 
        etatCivil.etat_civil?.includes('marié') ||
        etatCivil.identite_conjoint !== null
      )
      
      if (isMarie) {
        if (sexe === 'ذكر') {
          masculinMariedCount++
        } else if (sexe === 'أنثى') {
          femininMariedCount++
        }
      }
    })
    
    // Calculer les âges moyens
    const masculinAgeMoyen = masculinWithAge > 0 ? Math.round(masculinAgeSum / masculinWithAge) : 0
    const femininAgeMoyen = femininWithAge > 0 ? Math.round(femininAgeSum / femininWithAge) : 0
    
    // Calculer les pourcentages de mariés
    const masculinMariePourcent = masculinCount > 0 ? Math.round((masculinMariedCount / masculinCount) * 100) : 0
    const femininMariePourcent = femininCount > 0 ? Math.round((femininMariedCount / femininCount) * 100) : 0
    
    return {
      chartData: [{
        month: "total",
        masculin: masculinCount,
        feminin: femininCount
      }],
      statsData: {
        masculin: {
          ageMoyen: masculinAgeMoyen,
          mariePourcent: masculinMariePourcent
        },
        feminin: {
          ageMoyen: femininAgeMoyen,
          mariePourcent: femininMariePourcent
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur dans fetchGenderStatistics:', error)
    
    // Retourner des données par défaut en cas d'erreur
    return {
      chartData: [{
        month: "total",
        masculin: 0,
        feminin: 0
      }],
      statsData: {
        masculin: {
          ageMoyen: 0,
          mariePourcent: 0
        },
        feminin: {
          ageMoyen: 0,
          mariePourcent: 0
        }
      }
    }
  }
}

const fetchEmployeeMonthlyStatistics = async (monthsLimit?: number, periodType: 'monthly' | 'yearly' = 'monthly') => {
  const supabase = createClient()

  // Si monthsLimit est spécifié, récupérer seulement les N derniers mois
  if (monthsLimit && periodType === 'monthly') {
    const { data, error } = await supabase
      .from("employee_statistics")
      .select("period_date, total_employees, period_type")
      .eq("period_type", periodType)
      .order("period_date", { ascending: false })
      .limit(monthsLimit)

    if (error) {
      throw error
    }

    // Retourner les données dans l'ordre chronologique (du plus ancien au plus récent)
    return (data || []).reverse()
  }

  // Comportement original : récupérer tous les mois d'une année
  // Si aucune année n'est spécifiée, récupérer l'année la plus récente avec des données
  const { data: latestData, error: latestError } = await supabase
    .from("employee_statistics")
    .select("period_date")
    .eq("period_type", periodType)
    .order("period_date", { ascending: false })
    .limit(1)
    .single()

  if (latestError || !latestData) {
    return []
  }

  const year = new Date(latestData.period_date).getFullYear()

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
    throw error
  }

  return data || []
}

const fetchRecentUnites = async (limit: number) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("unite")
    .select("id, unite, unite_categorie, unite_type, niveau_1, navigante, unite_rang")

  if (error) {
    throw error
  }

  // Appliquer le même tri que la table des unités (par unite_rang + nom alphabétique)
  const sortedData = data?.sort((a: any, b: any) => {
    // Tri primaire : par unite_rang (ordre croissant)
    const rankA = a.unite_rang ?? 999
    const rankB = b.unite_rang ?? 999

    if (rankA !== rankB) {
      return rankA - rankB
    }

    // Tri secondaire : par nom d'unité (alphabétique)
    const nameA = a.unite || ""
    const nameB = b.unite || ""
    return nameA.localeCompare(nameB, "fr", { sensitivity: "base" })
  })

  return sortedData?.slice(0, limit) || []
}

const fetchRecentEmployees = async (limit: number) => {
  const supabase = createClient()

  // Utiliser la même requête que la liste des employés pour assurer la cohérence du tri
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_LIST_SELECT_QUERY)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  // Traiter les données avec la même fonction que la liste des employés
  const processedEmployees = data.map(processEmployeeData)

  // Retourner tous les employés traités (le tri sera appliqué plus tard dans DashboardContent)
  return processedEmployees
}

const fetchEmployeeTrends = async (isRTL: boolean, t: (key: string) => string) => {
  const supabase = createClient()
  
  try {
    const currentDate = new Date()
    const previousMonthDate = getPreviousMonthDate(currentDate)
    
    // Format des dates pour la requête (YYYY-MM-DD)
    const currentDateStr = currentDate.toISOString().split('T')[0]
    const previousDateStr = previousMonthDate.toISOString().split('T')[0]
    
    // Récupérer les statistiques actuelles et du mois précédent
    const [currentResult, previousResult] = await Promise.all([
      // Statistiques actuelles (aujourd'hui ou la plus récente)
      supabase
        .from('employee_statistics')
        .select('total_administration, total_operationnel, total_conges, period_date')
        .eq('period_type', 'daily')
        .lte('period_date', currentDateStr)
        .order('period_date', { ascending: false })
        .limit(1)
        .single(),
      
      // Statistiques du mois précédent (même jour ou le plus proche)
      supabase
        .from('employee_statistics')
        .select('total_administration, total_operationnel, total_conges, period_date')
        .eq('period_type', 'daily')
        .lte('period_date', previousDateStr)
        .order('period_date', { ascending: false })
        .limit(1)
        .single()
    ])
    
    // Préparer les données actuelles
    const currentStats = currentResult.error ? null : {
      conges: currentResult.data.total_conges || 0,
      administrative: currentResult.data.total_administration || 0,
      operational: currentResult.data.total_operationnel || 0
    }
    
    // Préparer les données du mois précédent
    const previousStats = previousResult.error ? null : {
      conges: previousResult.data.total_conges || 0,
      administrative: previousResult.data.total_administration || 0,
      operational: previousResult.data.total_operationnel || 0
    }
    
    // Si pas de données actuelles, retourner des tendances par défaut
    if (!currentStats) {
      console.warn('Aucune statistique actuelle trouvée pour calculer les tendances')
      return {
        conges: {
          changeType: 'no_data' as const,
          changeValue: '',
          changeText: isRTL ? 'بيانات جديدة متاحة' : 'Nouvelles données disponibles',
          hasData: false,
          currentValue: 0,
          previousValue: null
        },
        administrative: {
          changeType: 'no_data' as const,
          changeValue: '',
          changeText: isRTL ? 'بيانات جديدة متاحة' : 'Nouvelles données disponibles',
          hasData: false,
          currentValue: 0,
          previousValue: null
        },
        operational: {
          changeType: 'no_data' as const,
          changeValue: '',
          changeText: isRTL ? 'بيانات جديدة متاحة' : 'Nouvelles données disponibles',
          hasData: false,
          currentValue: 0,
          previousValue: null
        }
      }
    }
    
    // Calculer les tendances
    const trends = calculateEmployeeTrends(currentStats, previousStats, isRTL)
    
    console.log('📊 Tendances calculées:', {
      currentDate: currentDateStr,
      previousDate: previousDateStr,
      currentStats,
      previousStats,
      trends
    })
    
    return trends
    
  } catch (error) {
    console.error('Erreur lors du calcul des tendances:', error)
    
    // Fallback en cas d'erreur
    return {
      conges: {
        changeType: 'no_data' as const,
        changeValue: '',
        changeText: isRTL ? 'خطأ في البيانات' : 'Erreur de données',
        hasData: false,
        currentValue: 0,
        previousValue: null
      },
      administrative: {
        changeType: 'no_data' as const,
        changeValue: '',
        changeText: isRTL ? 'خطأ في البيانات' : 'Erreur de données',
        hasData: false,
        currentValue: 0,
        previousValue: null
      },
      operational: {
        changeType: 'no_data' as const,
        changeValue: '',
        changeText: isRTL ? 'خطأ في البيانات' : 'Erreur de données',
        hasData: false,
        currentValue: 0,
        previousValue: null
      }
    }
  }
}

// Hook principal pour toutes les données du dashboard
export function useDashboardData(params: UseDashboardDataParams = {}): UseDashboardDataReturn {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addDashboardRefreshCallback, removeDashboardRefreshCallback } = useRealtimeStore()

  // Paramètres par défaut
  const { isRTL = false, t = (key: string) => key, monthsLimit } = params

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Exécuter toutes les requêtes en parallèle avec Promise.all
      const [
        dashboardStats,
        uniteStats,
        employeeStatistics,
        congesData,
        officerGradesData,
        ncoGradesData,
        employeeMonthlyStatistics,
        recentUnites,
        recentEmployees,
        employeeTrends,
        genderStatistics,
      ] = await Promise.all([
        fetchDashboardStats(),
        fetchUniteStats(),
        fetchEmployeeStatistics(),
        fetchCongesData(),
        fetchOfficerGradesDistribution(),
        fetchNCOGradesDistribution(),
        fetchEmployeeMonthlyStatistics(monthsLimit, 'monthly'),
        fetchRecentUnites(3),
        fetchRecentEmployees(3),
        fetchEmployeeTrends(isRTL, t),
        fetchGenderStatistics(),
      ])

      setDashboardData({
        dashboardStats: {
          total: employeeStatistics.total,
          active: dashboardStats.active,
          inactive: dashboardStats.inactive,
          conges: employeeStatistics.conges,
        },
        uniteStats,
        employeeStatistics,
        congesData,
        officerGradesData,
        ncoGradesData,
        employeeMonthlyStatistics,
        recentUnites,
        colonelMajorEmployees: recentEmployees,
        employeeTrends,
        genderStatistics,
      })

    } catch (err) {
      console.error('Erreur lors du chargement des données du dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }, [isRTL, t, monthsLimit])

  const refresh = useCallback(() => {
    fetchAllData()
  }, [fetchAllData])

  // Enregistrer le callback de refresh pour les mises à jour real-time
  useEffect(() => {
    addDashboardRefreshCallback(refresh)
    
    return () => {
      removeDashboardRefreshCallback(refresh)
    }
  }, [addDashboardRefreshCallback, removeDashboardRefreshCallback, refresh])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    dashboardData,
    isLoading,
    error,
    refresh
  }
}