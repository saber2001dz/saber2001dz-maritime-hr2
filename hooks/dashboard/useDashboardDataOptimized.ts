"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EMPLOYEE_LIST_SELECT_QUERY } from '@/utils/employee.utils'

// Types pour les données du dashboard optimisées
export interface DashboardDataOptimized {
  // Statistiques principales (depuis vues matérialisées)
  dashboardStats: {
    total: number
    active: number
    inactive: number
    conges: number
  }
  
  // Statistiques des unités (depuis vues matérialisées)
  uniteStats: {
    total: number
    administrative: number
    operational: number
  }
  
  // Statistiques d'affectations (depuis vues matérialisées)
  employeeAffectationStats: {
    administrative: number
    operational: number
  }
  
  // Données des graphiques (optimisées)
  congesData: Array<{
    month: string
    previousYear: number
    currentYear: number
  }>
  
  officerGradesData: Array<{
    month: string
    desktop: number
  }>
  
  ncoGradesData: Array<{
    month: string
    desktop: number
  }>
  
  employeeStatistics: Array<{
    period_date: string
    total_employees: number
    period_type: string
  }>
  
  // Listes récentes
  recentUnites: Array<any>
  colonelMajorEmployees: Array<any>
}

export interface UseDashboardDataOptimizedReturn {
  dashboardData: DashboardDataOptimized | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

// Fetchers optimisés utilisant les vues matérialisées

const fetchDashboardStatsOptimized = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dashboard_employee_stats')
    .select('total, active, inactive, conges')
    .single()
  
  if (error) {
    throw error
  }
  
  return data || { total: 0, active: 0, inactive: 0, conges: 0 }
}

const fetchUniteStatsOptimized = async () => {
  const supabase = createClient()
  
  // Fallback vers la table unite directement car la vue matérialisée n'existe pas encore
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

const fetchEmployeeAffectationStatsOptimized = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dashboard_affectation_stats')
    .select('unite_type, employee_count')
  
  if (error) {
    throw error
  }
  
  // Transformer en format attendu
  let administrative = 0
  let operational = 0
  
  data?.forEach((item: any) => {
    if (item.unite_type === 'وحدة إدارية') {
      administrative = item.employee_count
    } else if (item.unite_type === 'وحدة نشيطة') {
      operational += item.employee_count
    }
  })
  
  return { administrative, operational }
}

const fetchCongesDataOptimized = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dashboard_conges_monthly')
    .select('year, month, total_days')
    .order('year', { ascending: true })
    .order('month', { ascending: true })
  
  if (error) {
    throw error
  }
  
  // Initialiser tous les mois
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December']
  
  const monthlyData = new Map<string, { year2024: number; year2025: number }>()
  months.forEach(month => {
    monthlyData.set(month, { year2024: 0, year2025: 0 })
  })
  
  // Remplir avec les données de la vue matérialisée
  data?.forEach((item: any) => {
    const monthName = months[item.month - 1] // Les mois en base sont 1-indexés
    const current = monthlyData.get(monthName)
    if (current && item.year === 2024) {
      monthlyData.set(monthName, { ...current, year2024: item.total_days || 0 })
    } else if (current && item.year === 2025) {
      monthlyData.set(monthName, { ...current, year2025: item.total_days || 0 })
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

const fetchGradesDistributionOptimized = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('dashboard_grades_distribution')
    .select('grade_category, grade, count')
  
  if (error) {
    throw error
  }
  
  // Séparer officiers et sous-officiers
  const officers = data?.filter((item: any) => item.grade_category === 'officer') || []
  const ncos = data?.filter((item: any) => item.grade_category === 'nco') || []
  
  // Ordre des grades d'officiers
  const officerOrder = [
    'Colonel Major', 'Colonel', 'Lieutenant Colonel', 'Commandant',
    'Capitaine', 'Lieutenant', 'Sous-Lieutenant'
  ]
  
  // Ordre des grades de sous-officiers
  const ncoOrder = [
    'Adjudant Chef', 'Adjudant', 'Sergent Chef', 'Sergent',
    'Caporal Chef', 'Caporal', 'Garde'
  ]
  
  const officerGradesData = officerOrder.map(grade => {
    const found = officers.find((item: any) => 
      item.grade === grade || 
      (grade === 'Lieutenant Colonel' && item.grade === 'Lieutenant-Colonel') ||
      (grade === 'Sous-Lieutenant' && item.grade === 'Sous Lieutenant')
    )
    return {
      month: grade,
      desktop: found?.count || 0
    }
  })
  
  const ncoGradesData = ncoOrder.map(grade => {
    const found = ncos.find((item: any) => item.grade === grade)
    return {
      month: grade,
      desktop: found?.count || 0
    }
  })
  
  return { officerGradesData, ncoGradesData }
}

const fetchEmployeeStatisticsOptimized = async (year: number, periodType: 'monthly' | 'yearly' = 'monthly') => {
  const supabase = createClient()
  
  // Garder la requête originale car employee_statistics semble être une table spécialisée
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

const fetchRecentUnitesOptimized = async (limit: number) => {
  const supabase = createClient()
  
  // Utiliser les index pour optimiser cette requête
  const { data, error } = await supabase
    .from("unite")
    .select("id, unite, unite_categorie, unite_type, niveau_1, navigante")
    .order("created_at", { ascending: false })
    .limit(limit)
  
  if (error) {
    throw error
  }
  
  return data
}

const fetchColonelMajorEmployeesOptimized = async (limit: number) => {
  const supabase = createClient()
  
  // Approche optimisée : utiliser la vue des grades avec jointure
  const { data, error } = await supabase
    .from('dashboard_grades_distribution')
    .select('*')
    .eq('grade', 'Colonel Major')
    .single()
  
  // Si il y a des Colonel Major, récupérer leurs détails
  if (data && data.count > 0) {
    const { data: employeesData, error: employeesError } = await supabase
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
        employee_grades!inner (
          grade,
          date_grade
        )
      `)
      .eq('employee_grades.grade', 'Colonel Major')
      .eq("actif", "مباشر")
      .order('employee_grades.date_grade', { ascending: true })
      .limit(limit)
    
    if (employeesError) {
      // Fallback vers la méthode originale si la jointure échoue
      return fetchColonelMajorEmployeesFallback(limit)
    }
    
    return employeesData?.map((emp: any) => ({
      ...emp,
      latest_colonel_major_grade: emp.employee_grades?.[0]
    })) || []
  }
  
  // Si pas de Colonel Major, retourner des employés actifs génériques
  return fetchColonelMajorEmployeesFallback(limit)
}

const fetchColonelMajorEmployeesFallback = async (limit: number) => {
  const supabase = createClient()
  
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
      )
    `)
    .eq("actif", "مباشر")
    .limit(limit)
  
  if (error) {
    throw error
  }
  
  return data || []
}

// Hook principal optimisé pour toutes les données du dashboard
export function useDashboardDataOptimized(): UseDashboardDataOptimizedReturn {
  const [dashboardData, setDashboardData] = useState<DashboardDataOptimized | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllDataOptimized = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Exécuter toutes les requêtes optimisées en parallèle avec Promise.all
      const [
        dashboardStats,
        uniteStats,
        employeeAffectationStats,
        congesData,
        { officerGradesData, ncoGradesData },
        employeeStatistics,
        recentUnites,
        colonelMajorEmployees,
      ] = await Promise.all([
        fetchDashboardStatsOptimized(),
        fetchUniteStatsOptimized(),
        fetchEmployeeAffectationStatsOptimized(),
        fetchCongesDataOptimized(),
        fetchGradesDistributionOptimized(),
        fetchEmployeeStatisticsOptimized(2025, 'monthly'),
        fetchRecentUnitesOptimized(3),
        fetchColonelMajorEmployeesOptimized(3),
      ])

      setDashboardData({
        dashboardStats,
        uniteStats,
        employeeAffectationStats,
        congesData,
        officerGradesData,
        ncoGradesData,
        employeeStatistics,
        recentUnites,
        colonelMajorEmployees,
      })

    } catch (err) {
      console.error('Erreur lors du chargement optimisé des données du dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    // Rafraîchir les vues matérialisées avant de recharger les données
    try {
      const supabase = createClient()
      await supabase.rpc('refresh_dashboard_materialized_views')
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement des vues matérialisées:', err)
    }
    
    await fetchAllDataOptimized()
  }

  useEffect(() => {
    fetchAllDataOptimized()
  }, [])

  return {
    dashboardData,
    isLoading,
    error,
    refresh
  }
}