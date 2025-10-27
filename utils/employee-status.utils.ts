// utils/employee-status.utils.ts
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"

type EmployeeStatus = Database["public"]["Enums"]["employee_status"]

type AbsenceData = {
  date_debut: string
  date_fin: string | null
  reference_debut: string
  reference_fin?: string | null
  duree?: number | null
}

type CongeData = {
  type_conge: string
  date_debut: string
  date_fin: string
  duree: number
  statut: string
}

/**
 * Appelle la fonction database pour mettre à jour les statuts des employés basés sur leurs congés
 * Cette fonction utilise directement la logique PostgreSQL au lieu de la logique côté client
 * @param supabaseClient - Client Supabase (optionnel, créé automatiquement si non fourni)
 * @returns Le résultat de la mise à jour
 */
export async function updateEmployeeStatusBasedOnLeaves(
  employeeId?: string,
  conges?: any[],
  supabaseClient?: any
): Promise<{ updated_employees: number; message: string }> {
  const supabase = supabaseClient || createClient()

  try {
    // Appeler la fonction PostgreSQL qui gère toute la logique
    const { data, error } = await supabase.rpc('update_employee_status_based_on_leaves')

    if (error) {
      console.error("Erreur lors de la mise à jour des statuts via database:", error)
      throw error
    }

    console.log(`Mise à jour des statuts terminée: ${data?.[0]?.updated_employees || 0} employés mis à jour`)
    return data?.[0] || { updated_employees: 0, message: "Aucune mise à jour" }
  } catch (error) {
    console.error("Erreur lors de l'appel à la fonction database:", error)
    throw error
  }
}

/**
 * Force une mise à jour complète des statuts via la fonction database
 * @param supabaseClient - Client Supabase (optionnel)
 * @returns Le résultat détaillé de la mise à jour
 */
export async function forceLeaveStatusUpdate(supabaseClient?: any): Promise<any> {
  const supabase = supabaseClient || createClient()

  try {
    const { data, error } = await supabase.rpc('force_leave_status_update')

    if (error) {
      console.error("Erreur lors de la mise à jour forcée:", error)
      throw error
    }

    console.log("Mise à jour forcée terminée:", data)
    return data
  } catch (error) {
    console.error("Erreur lors de la mise à jour forcée:", error)
    throw error
  }
}

/**
 * Exécute la mise à jour quotidienne complète des congés et statuts
 * Version simplifiée sans logging
 * @param supabaseClient - Client Supabase (optionnel)
 * @returns Résultat de la mise à jour avec compteurs
 */
export async function dailyLeaveStatusUpdate(supabaseClient?: any): Promise<any> {
  const supabase = supabaseClient || createClient()

  try {
    const { data, error } = await supabase.rpc('daily_leave_status_update')

    if (error) {
      console.error("Erreur lors de la mise à jour quotidienne:", error)
      throw error
    }

    const result = data?.[0] || { leaves_updated: 0, employees_updated: 0, message: "Aucune mise à jour" }
    console.log("Mise à jour quotidienne terminée:", result.message)
    return result
  } catch (error) {
    console.error("Erreur lors de la mise à jour quotidienne:", error)
    throw error
  }
}

/**
 * Détermine le statut de l'employé basé sur ses congés actifs
 * @param conges - Liste des congés de l'employé
 * @param currentStatus - Statut actuel de l'employé
 * @returns Le statut à appliquer selon les règles de congé
 */
export function determineEmployeeStatus(conges: CongeData[], currentStatus: EmployeeStatus = "مباشر"): EmployeeStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Trouver les congés actifs (en cours)
  const activeLeaves = conges.filter(conge => {
    if (!conge.date_debut || !conge.date_fin) return false

    const startDate = new Date(conge.date_debut)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(conge.date_fin)
    endDate.setHours(23, 59, 59, 999)

    return today >= startDate && today <= endDate
  })

  // Si aucun congé actif, retourner "مباشر"
  if (activeLeaves.length === 0) {
    return "مباشر"
  }

  // Déterminer le statut basé sur le type de congé actif
  // Priorité: Maladie > Autres types de congés
  const hasActiveIllness = activeLeaves.some(leave => leave.type_conge === "Maladie")
  if (hasActiveIllness) {
    return "Maladie"
  }

  // Pour tout autre type de congé actif
  return "في إجازة"
}

/**
 * Détermine le statut de l'employé basé sur ses absences actives
 * @param absences - Liste des absences de l'employé
 * @returns Le statut à appliquer selon les règles d'absence
 */
export function determineEmployeeStatusBasedOnAbsences(absences: AbsenceData[]): EmployeeStatus | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Trouver les absences actives
  const activeAbsences = absences.filter(absence => {
    if (!absence.date_debut) return false
    
    const startDate = new Date(absence.date_debut)
    startDate.setHours(0, 0, 0, 0)
    
    // Absence sans date de fin = absence active
    if (!absence.date_fin) {
      return today >= startDate
    }
    
    const endDate = new Date(absence.date_fin)
    endDate.setHours(23, 59, 59, 999)
    
    // Absence avec date de fin dans le futur ou aujourd'hui = absence active
    return today >= startDate && today <= endDate
  })

  // Si aucune absence active, ne pas changer le statut
  if (activeAbsences.length === 0) {
    return null
  }

  // Si il y a des absences actives, l'employé est "متغيب"
  return "متغيب"
}

/**
 * Détermine le statut global de l'employé en combinant congés et absences
 * @param conges - Liste des congés de l'employé  
 * @param absences - Liste des absences de l'employé
 * @param currentStatus - Statut actuel de l'employé
 * @returns Le nouveau statut à appliquer
 */
export function determineEmployeeStatusWithAbsences(
  conges: CongeData[],
  absences: AbsenceData[],
  currentStatus: EmployeeStatus = "مباشر"
): EmployeeStatus {
  // Priorité 1: Vérifier les absences (priorité la plus haute)
  const absenceStatus = determineEmployeeStatusBasedOnAbsences(absences)
  if (absenceStatus) {
    return absenceStatus
  }

  // Priorité 2: Vérifier les congés
  return determineEmployeeStatus(conges, currentStatus)
}

/**
 * Met à jour automatiquement le statut d'un employé basé sur ses absences et congés
 * @param employeeId - ID de l'employé
 * @param absences - Liste des absences de l'employé
 * @param conges - Liste des congés de l'employé (optionnel)
 * @param supabaseClient - Client Supabase
 * @returns Le nouveau statut appliqué
 */
export async function updateEmployeeStatusBasedOnAbsences(
  employeeId: string,
  absences: AbsenceData[],
  supabaseClient: any,
  conges?: CongeData[]
): Promise<EmployeeStatus> {
  // Récupérer le statut actuel de l'employé
  const { data: employee, error: fetchError } = await supabaseClient
    .from("employees")
    .select("actif")
    .eq("id", employeeId)
    .single()

  if (fetchError) {
    console.error("Erreur lors de la récupération du statut actuel:", fetchError)
    throw fetchError
  }

  const currentStatus = employee?.actif || "مباشر"

  // Si des congés sont fournis, utiliser la fonction combinée
  let newStatus: EmployeeStatus
  if (conges) {
    newStatus = determineEmployeeStatusWithAbsences(conges, absences, currentStatus)
  } else {
    // Sinon, juste vérifier les absences
    const absenceStatus = determineEmployeeStatusBasedOnAbsences(absences)
    newStatus = absenceStatus || currentStatus
  }
  
  // Ne mettre à jour que si le statut a changé
  if (newStatus === currentStatus) {
    console.log(`Statut de l'employé ${employeeId} inchangé: ${currentStatus}`)
    return currentStatus
  }
  
  try {
    const { error } = await supabaseClient
      .from("employees")
      .update({ actif: newStatus })
      .eq("id", employeeId)

    if (error) {
      console.error("Erreur lors de la mise à jour du statut de l'employé:", error)
      throw error
    }

    console.log(`Statut de l'employé ${employeeId} mis à jour: ${currentStatus} → ${newStatus}`)
    return newStatus
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    throw error
  }
}