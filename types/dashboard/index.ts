/**
 * Export central de tous les types dashboard
 */

// Types dashboard principaux
export type {
  DashboardData,
  UseDashboardDataReturn,
  UseDashboardDataParams,
  CongesDataItem,
  GradeDataItem,
  EmployeeStatisticItem,
  EmployeeStats,
  UniteStats,
  EmployeeAffectationStats,
} from './dashboard.types'

// Types de tendances
export type {
  TrendChangeType,
  TrendData,
  EmployeeTrends,
  CurrentEmployeeStats,
  PreviousEmployeeStats,
  TrendCalculationParams,
  TrendTextFormat,
  DateCalculationDebug,
  TrendFormatOptions,
} from './trends.types'