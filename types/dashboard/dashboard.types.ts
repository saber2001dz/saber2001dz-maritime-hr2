/**
 * Types pour les données et fonctionnalités du dashboard
 */

import type { EmployeeTrends } from './trends.types'

// Interface principale pour toutes les données du dashboard
export interface DashboardData {
  // Statistiques principales
  dashboardStats: {
    total: number
    active: number
    inactive: number
    conges: number
  }
  
  // Statistiques des unités
  uniteStats: {
    total: number
    administrative: number
    operational: number
  }
  
  // Statistiques employés unifiées depuis employee_statistics
  employeeStatistics: {
    total: number
    conges: number
    administrative: number
    operational: number
  }
  
  // Tendances des employés
  employeeTrends: EmployeeTrends
  
  // Données des graphiques
  congesData: Array<{
    month: string
    previousYear: number
    currentYear: number
  }>
  
  officerGradesData: Array<{
    month: string
    count: number
  }>
  
  ncoGradesData: Array<{
    month: string
    count: number
  }>
  
  employeeMonthlyStatistics: Array<{
    period_date: string
    total_employees: number
    period_type: string
  }>
  
  // Statistiques de genre
  genderStatistics: GenderStatistics
  
  // Listes récentes
  recentUnites: Array<any>
  colonelMajorEmployees: Array<any>
}

// Interface pour la valeur de retour du hook useDashboardData
export interface UseDashboardDataReturn {
  dashboardData: DashboardData | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

// Interface pour les paramètres du hook useDashboardData
export interface UseDashboardDataParams {
  isRTL?: boolean
  t?: (key: string) => string
  monthsLimit?: number  // Nombre de mois à récupérer (3, 6, 12)
}

// Types pour les données de graphiques spécifiques
export interface CongesDataItem {
  month: string
  previousYear: number
  currentYear: number
}

export interface GradeDataItem {
  month: string
  count: number
}

export interface EmployeeStatisticItem {
  period_date: string
  total_employees: number
  period_type: string
}

// Types pour les statistiques d'employés
export interface EmployeeStats {
  total: number
  active: number
  inactive: number
  conges: number
}

export interface UniteStats {
  total: number
  administrative: number
  operational: number
}

export interface EmployeeStatisticsData {
  total: number
  conges: number
  administrative: number
  operational: number
}

// Types pour les statistiques de genre
export interface GenderChartDataItem {
  month: string
  masculin: number
  feminin: number
}

export interface GenderStatsDataItem {
  ageMoyen: number
  mariePourcent: number
}

export interface GenderStatistics {
  chartData: GenderChartDataItem[]
  statsData: {
    masculin: GenderStatsDataItem
    feminin: GenderStatsDataItem
  }
}