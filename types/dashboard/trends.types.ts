/**
 * Types pour les calculs de tendances des statistiques d'employés
 */

// Types de changement de tendance
export type TrendChangeType = 'increase' | 'decrease' | 'stable' | 'no_data'

// Interface pour les données de tendance d'une métrique spécifique
export interface TrendData {
  changeType: TrendChangeType
  changeValue: string // Pourcentage formaté (ex: "15.2%")
  changeText: string // Texte descriptif de la tendance
  hasData: boolean // Indique si des données historiques sont disponibles
  currentValue: number // Valeur actuelle
  previousValue: number | null // Valeur du mois précédent
}

// Interface pour toutes les tendances des employés
export interface EmployeeTrends {
  conges: TrendData
  administrative: TrendData
  operational: TrendData
}

// Interface pour les statistiques actuelles (pour calcul de tendances)
export interface CurrentEmployeeStats {
  conges: number
  administrative: number
  operational: number
}

// Interface pour les statistiques du mois précédent (pour calcul de tendances)
export interface PreviousEmployeeStats {
  conges: number
  administrative: number
  operational: number
}

// Interface pour les paramètres de calcul de tendances
export interface TrendCalculationParams {
  currentStats: CurrentEmployeeStats
  previousStats: PreviousEmployeeStats | null
  isRTL: boolean
  t: (key: string) => string
}

// Interface pour les données de formatage de texte de tendance
export interface TrendTextFormat {
  changeText: string
  changeTextEnd: string
}

// Types utilitaires pour la validation et debug
export interface DateCalculationDebug {
  currentDate: Date
  previousDate: Date
}

// Interface pour les options de formatage de tendance
export interface TrendFormatOptions {
  showPercentage: boolean
  showIcon: boolean
  compactMode: boolean
}