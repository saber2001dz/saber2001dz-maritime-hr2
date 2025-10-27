/**
 * Utilitaires pour le calcul des tendances des statistiques d'employés
 * Comparaison avec le même jour du mois précédent
 */

import type {
  TrendData,
  EmployeeTrends,
  TrendChangeType,
  TrendTextFormat,
  CurrentEmployeeStats,
  PreviousEmployeeStats
} from '@/types/dashboard'

/**
 * Calcule la date du mois précédent en gérant les cas spéciaux
 * Gère les mois avec 30/31 jours et février
 */
export function getPreviousMonthDate(currentDate: Date): Date {
  const previousMonth = new Date(currentDate)
  
  // Reculer d'un mois
  previousMonth.setMonth(currentDate.getMonth() - 1)
  
  // Gérer le cas où le jour n'existe pas dans le mois précédent
  // Par exemple: 31 janvier → 28/29 février
  if (previousMonth.getDate() !== currentDate.getDate()) {
    // Le jour n'existe pas dans le mois précédent, utiliser le dernier jour du mois
    previousMonth.setMonth(currentDate.getMonth()) // Revenir au mois actuel
    previousMonth.setDate(0) // Aller au dernier jour du mois précédent
  }
  
  return previousMonth
}

/**
 * Calcule le pourcentage de changement entre deux valeurs
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Détermine le type de tendance basé sur le pourcentage de changement
 */
export function determineTrendType(percentageChange: number, hasData: boolean): TrendChangeType {
  if (!hasData) return 'no_data'
  
  const absChange = Math.abs(percentageChange)
  
  // Considérer comme stable si le changement est inférieur à 1%
  if (absChange < 1) return 'stable'
  
  return percentageChange > 0 ? 'increase' : 'decrease'
}

/**
 * Formate le texte de changement selon la langue et le type de tendance
 */
export function formatTrendText(
  changeType: TrendChangeType, 
  isRTL: boolean,
  t: (key: string) => string
): TrendTextFormat {
  switch (changeType) {
    case 'increase':
      return {
        changeText: isRTL 
          ? `${t("dashboard.employeeStatistics.increase")} ${t("dashboard.employeeStatistics.vsLastMonth")}`
          : "Augmentation de",
        changeTextEnd: isRTL ? "" : "vs mois dernier"
      }
    
    case 'decrease':
      return {
        changeText: isRTL
          ? `${t("dashboard.employeeStatistics.decrease")} ${t("dashboard.employeeStatistics.vsLastMonth")}`
          : "Diminution de",
        changeTextEnd: isRTL ? "" : "vs mois dernier"
      }
    
    case 'stable':
      return {
        changeText: isRTL
          ? t("dashboard.employeeStatistics.stableVsLastMonth")
          : "Stable par rapport",
        changeTextEnd: isRTL ? "" : "au mois dernier"
      }
    
    case 'no_data':
      return {
        changeText: isRTL
          ? t("dashboard.employeeStatistics.newDataAvailable")
          : "Nouvelles données",
        changeTextEnd: isRTL ? "" : "disponibles"
      }
    
    default:
      return { changeText: "", changeTextEnd: "" }
  }
}

/**
 * Calcule les données de tendance pour une métrique spécifique
 */
export function calculateTrendData(
  currentValue: number, 
  previousValue: number | null,
  isRTL: boolean,
  t: (key: string) => string
): TrendData {
  const hasData = previousValue !== null
  
  if (!hasData) {
    const { changeText, changeTextEnd } = formatTrendText('no_data', isRTL, t)
    return {
      changeType: 'no_data',
      changeValue: '',
      changeText,
      hasData: false,
      currentValue,
      previousValue: null
    }
  }
  
  const percentageChange = calculatePercentageChange(currentValue, previousValue!)
  const changeType = determineTrendType(percentageChange, hasData)
  const { changeText, changeTextEnd } = formatTrendText(changeType, isRTL, t)
  
  return {
    changeType,
    changeValue: changeType === 'stable' ? '' : `${Math.abs(percentageChange).toFixed(1)}%`,
    changeText: changeText + (changeType === 'stable' ? changeTextEnd : ''),
    hasData,
    currentValue,
    previousValue
  }
}

/**
 * Calcule toutes les tendances des employés
 */
export function calculateEmployeeTrends(
  currentStats: CurrentEmployeeStats,
  previousStats: PreviousEmployeeStats | null,
  isRTL: boolean,
  t: (key: string) => string
): EmployeeTrends {
  return {
    conges: calculateTrendData(
      currentStats.conges,
      previousStats?.conges || null,
      isRTL,
      t
    ),
    administrative: calculateTrendData(
      currentStats.administrative,
      previousStats?.administrative || null,
      isRTL,
      t
    ),
    operational: calculateTrendData(
      currentStats.operational,
      previousStats?.operational || null,
      isRTL,
      t
    )
  }
}

/**
 * Valide et ajuste une date pour s'assurer qu'elle est valide
 */
export function validateAndAdjustDate(date: Date): Date {
  // Si la date est invalide, retourner la date actuelle
  if (isNaN(date.getTime())) {
    return new Date()
  }
  
  return date
}

/**
 * Utilitaire pour déboguer les calculs de dates
 */
export function debugDateCalculation(currentDate: Date) {
  const previousDate = getPreviousMonthDate(currentDate)
  
  console.log('📅 Debug Date Calculation:')
  console.log(`Current Date: ${currentDate.toISOString().split('T')[0]}`)
  console.log(`Previous Month Date: ${previousDate.toISOString().split('T')[0]}`)
  console.log(`Days difference: ${Math.abs(currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)}`)
  
  return { currentDate, previousDate }
}