// hooks/use-leave-status-monitor.ts
import { useEffect, useRef } from 'react'
import { dailyStatusCheck, checkEmployeeStatus, forceStatusUpdate } from '@/utils/leave-status-checker'

/**
 * Hook pour surveiller et mettre à jour automatiquement les statuts des employés
 * basés sur leurs congés, sanctions, formations ET absences - utilise les fonctions database unifiées
 *
 * Gère automatiquement:
 * - Congés: إجازة, مرض → مباشر quand terminé
 * - Sanctions: موقوف → مباشر quand "إيقاف عن العمل" terminé
 * - Formations: تدريب → مباشر quand formation terminée
 * - Absences: متغيب → مباشر quand absence terminée
 */
export function useLeaveStatusMonitor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<string | null>(null)

  useEffect(() => {
    // Fonction pour vérifier si c'est un nouveau jour
    const isNewDay = () => {
      const today = new Date().toDateString()
      if (lastCheckRef.current !== today) {
        lastCheckRef.current = today
        return true
      }
      return false
    }

    // Vérification initiale si c'est un nouveau jour
    if (isNewDay()) {
      console.log("Nouveau jour détecté - Lancement de la vérification des statuts congés + sanctions + formations + absences (via database)")
      dailyStatusCheck()
    }

    // Vérifier toutes les 4 heures au lieu de chaque heure (la database gère l'automation)
    intervalRef.current = setInterval(() => {
      if (isNewDay()) {
        console.log("Nouveau jour détecté - Lancement de la vérification des statuts congés + sanctions + formations + absences (via database)")
        dailyStatusCheck()
      }
    }, 4 * 60 * 60 * 1000) // Toutes les 4 heures

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Fonction pour forcer une vérification manuelle
  const forceStatusCheck = async () => {
    console.log("Vérification manuelle des statuts lancée (via database)")
    return await forceStatusUpdate()
  }

  // Fonction pour vérifier un employé spécifique (maintenant globale)
  const checkSpecificEmployee = async (employeeId: string) => {
    console.log(`Vérification manuelle du statut de l'employé ${employeeId} (via database globale)`)
    return await checkEmployeeStatus(employeeId)
  }

  return {
    forceStatusCheck,
    checkSpecificEmployee
  }
}

/**
 * Hook simplifié pour les interactions avec les statuts des employés
 * N'effectue PLUS de mise à jour automatique au montage
 * Fournit des fonctions pour interagir avec le système unifié (congés + sanctions + formations + absences)
 *
 * Gère:
 * - Congés expirés → retour à "مباشر"
 * - Sanctions "إيقاف عن العمل" expirées → retour à "مباشر"
 * - Formations terminées → retour à "مباشر"
 * - Absences terminées → retour à "مباشر"
 */
export function useEmployeeStatusMonitor(employeeId?: string) {
  // Fonction pour déclencher une vérification globale des statuts (congés + sanctions + formations + absences)
  const checkStatus = async () => {
    console.log("Vérification globale des statuts (congés + sanctions + formations + absences) via database")
    return await checkEmployeeStatus("")
  }

  // Fonction pour forcer une mise à jour complète (congés + sanctions + formations + absences)
  const forceUpdate = async () => {
    console.log("Force une mise à jour complète des statuts (congés + sanctions + formations + absences)")
    return await forceStatusUpdate()
  }

  return {
    checkStatus,
    forceUpdate
  }
}