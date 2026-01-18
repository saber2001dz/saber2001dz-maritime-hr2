// utils/leave-status-checker.ts
import { createClient } from "@/lib/supabase/client"
import {
  updateEmployeeStatusBasedOnLeaves,
  dailyLeaveStatusUpdate,
  forceLeaveStatusUpdate
} from "./employee-status.utils"

/**
 * DEPRECATED: Utilise maintenant la fonction database
 * Fonction combinée pour vérifier et mettre à jour les statuts des employés
 * en fonction de leurs congés, sanctions, formations et absences expirés - maintenant délégué à la database
 */
export async function dailyStatusCheck() {
  console.log("Début de la vérification quotidienne des statuts (via database)...")

  try {
    // Utiliser la fonction database unifiée
    await dailyLeaveStatusUpdate()
    console.log("Vérification quotidienne des statuts terminée avec succès")
  } catch (error) {
    console.error("Erreur lors de la vérification quotidienne:", error)
    throw error
  }
}

/**
 * DEPRECATED: Utilise maintenant la fonction database globale
 * Fonction pour vérifier le statut d'un employé spécifique
 * Maintenant utilise la mise à jour globale de la database
 */
export async function checkEmployeeStatus(employeeId: string) {
  try {
    console.log(`Vérification du statut de l'employé ${employeeId} via database...`)

    // Utiliser la fonction database qui met à jour tous les employés
    const result = await updateEmployeeStatusBasedOnLeaves()

    console.log(`Mise à jour globale terminée: ${result.updated_employees} employés mis à jour`)
    return result

  } catch (error) {
    console.error(`Erreur lors de la vérification du statut de l'employé ${employeeId}:`, error)
    return null
  }
}

/**
 * Force une mise à jour complète des statuts via la database
 * Remplace les anciennes fonctions checkAndUpdateExpiredLeaves et markExpiredLeavesAsCompleted
 * Met à jour tous les statuts: congés, sanctions, formations et absences
 */
export async function forceStatusUpdate() {
  try {
    console.log("Début de la mise à jour forcée des statuts...")

    const result = await forceLeaveStatusUpdate()

    console.log("Mise à jour forcée terminée:", result)
    return result

  } catch (error) {
    console.error("Erreur lors de la mise à jour forcée:", error)
    throw error
  }
}