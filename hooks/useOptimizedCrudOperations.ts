import { useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  EmployeeGrade,
  EmployeeFonctions,
  EmployeeAffectation,
  EmployeeBanque,
  EmployeeAbsence,
} from "@/types/details_employees"

interface CrudOperationConfig {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  showToast?: (variant: "success" | "error", title: string, message: string) => void
}

// Fonction générique pour les opérations CRUD avec retry
async function executeCrudOperation<T>(
  operation: () => Promise<T>,
  config: CrudOperationConfig = {}
): Promise<T | null> {
  try {
    const result = await operation()
    config.onSuccess?.(result)
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.error("Erreur CRUD:", error)
    config.onError?.(error as Error)
    config.showToast?.("error", "Erreur de sauvegarde", errorMessage)
    return null
  }
}

// Fonctions de validation
const isEmptyGrade = (grade: any): boolean => !grade.grade && !grade.date_grade
const isEmptyFonction = (fonction: any): boolean => !fonction.fonction && !fonction.date_obtention_fonction
const isEmptyAffectation = (affectation: any): boolean => !affectation.unite && !affectation.responsibility && !affectation.date_debut
const isEmptyBanque = (banque: any): boolean => !banque.banque && !banque.agence && !banque.rib
const isEmptyAbsence = (absence: any): boolean => !absence.date_debut && !absence.reference_debut

export function useOptimizedCrudOperations(employeeId: string) {
  const supabase = createClient()

  // Grades Operations
  const saveGrade = useCallback(async (
    grade: EmployeeGrade,
    isNew: boolean,
    config: CrudOperationConfig = {}
  ): Promise<EmployeeGrade | null> => {
    if (isEmptyGrade(grade) && isNew) {
      return null // Ignorer les grades vides
    }

    if (!grade.grade || !grade.date_grade) {
      config.showToast?.("error", "Validation", "Grade et date d'obtention sont obligatoires")
      return null
    }

    return executeCrudOperation(async () => {
      if (isNew) {
        const { data, error } = await supabase
          .from("employee_grades")
          .insert({
            employee_id: employeeId,
            grade: grade.grade,
            date_grade: grade.date_grade,
            date_fin: grade.date_fin || null,
            reference: grade.reference || null,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { error } = await supabase
          .from("employee_grades")
          .update({
            grade: grade.grade,
            date_grade: grade.date_grade,
            date_fin: grade.date_fin || null,
            reference: grade.reference || null,
          })
          .eq("id", grade.id)

        if (error) throw error
        return grade
      }
    }, config)
  }, [employeeId, supabase])

  const deleteGrade = useCallback(async (
    gradeId: string,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    if (gradeId.toString().startsWith("temp-")) {
      return true // Pas besoin de supprimer en base
    }

    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employee_grades")
        .delete()
        .eq("id", gradeId)

      if (error) throw error
      return true
    }, config) !== null
  }, [supabase])

  // Fonctions Operations
  const saveFonction = useCallback(async (
    fonction: EmployeeFonctions,
    isNew: boolean,
    config: CrudOperationConfig = {}
  ): Promise<EmployeeFonctions | null> => {
    if (isEmptyFonction(fonction) && isNew) {
      return null
    }

    if (!fonction.fonction || !fonction.date_obtention_fonction) {
      config.showToast?.("error", "Validation", "Fonction et date d'obtention sont obligatoires")
      return null
    }

    return executeCrudOperation(async () => {
      if (isNew) {
        const { data, error } = await supabase
          .from("employee_fonctions")
          .insert({
            employee_id: employeeId,
            fonction: fonction.fonction,
            date_obtention_fonction: fonction.date_obtention_fonction,
            date_fin: fonction.date_fin || null,
            reference: fonction.reference || null,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { error } = await supabase
          .from("employee_fonctions")
          .update({
            fonction: fonction.fonction,
            date_obtention_fonction: fonction.date_obtention_fonction,
            date_fin: fonction.date_fin || null,
            reference: fonction.reference || null,
          })
          .eq("id", fonction.id)

        if (error) throw error
        return fonction
      }
    }, config)
  }, [employeeId, supabase])

  const deleteFonction = useCallback(async (
    fonctionId: string,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    if (fonctionId.toString().startsWith("temp-")) {
      return true
    }

    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employee_fonctions")
        .delete()
        .eq("id", fonctionId)

      if (error) throw error
      return true
    }, config) !== null
  }, [supabase])

  // Affectations Operations
  const saveAffectation = useCallback(async (
    affectation: EmployeeAffectation,
    isNew: boolean,
    config: CrudOperationConfig = {}
  ): Promise<EmployeeAffectation | null> => {
    if (isEmptyAffectation(affectation) && isNew) {
      return null
    }

    if (!affectation.unite || !affectation.responsibility || !affectation.date_debut) {
      config.showToast?.("error", "Validation", "Unité, responsabilité et date sont obligatoires")
      return null
    }

    return executeCrudOperation(async () => {
      if (isNew) {
        const { data, error } = await supabase
          .from("employee_affectations")
          .insert({
            employee_id: employeeId,
            unite: affectation.unite,
            responsibility: affectation.responsibility,
            date_debut: affectation.date_debut,
            date_fin: affectation.date_fin || null,
            telex_debut: affectation.telex_debut || null,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { error } = await supabase
          .from("employee_affectations")
          .update({
            unite: affectation.unite,
            responsibility: affectation.responsibility,
            date_debut: affectation.date_debut,
            date_fin: affectation.date_fin || null,
            telex_debut: affectation.telex_debut || null,
          })
          .eq("id", affectation.id)

        if (error) throw error
        return affectation
      }
    }, config)
  }, [employeeId, supabase])

  const deleteAffectation = useCallback(async (
    affectationId: string,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    if (affectationId.toString().startsWith("temp-")) {
      return true
    }

    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employee_affectations")
        .delete()
        .eq("id", affectationId)

      if (error) throw error
      return true
    }, config) !== null
  }, [supabase])

  // Banques Operations
  const saveBanque = useCallback(async (
    banque: EmployeeBanque,
    isNew: boolean,
    banquesList: { banque_nom: string; banque_logo: string }[],
    config: CrudOperationConfig = {}
  ): Promise<EmployeeBanque | null> => {
    if (isEmptyBanque(banque) && isNew) {
      return null
    }

    if (!banque.banque || !banque.agence || !banque.rib) {
      config.showToast?.("error", "Validation", "Banque, agence et RIB sont obligatoires")
      return null
    }

    return executeCrudOperation(async () => {
      const selectedBank = banquesList.find((bank) => bank.banque_nom === banque.banque)
      const logoUrl = selectedBank ? selectedBank.banque_logo : banque.logo_url

      if (isNew) {
        const { data, error } = await supabase
          .from("employee_banque")
          .insert({
            employee_id: employeeId,
            banque: banque.banque,
            agence: banque.agence,
            rib: banque.rib,
            logo_url: logoUrl || null,
            compte_statut: banque.compte_statut,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { error } = await supabase
          .from("employee_banque")
          .update({
            banque: banque.banque,
            agence: banque.agence,
            rib: banque.rib,
            logo_url: logoUrl || null,
            compte_statut: banque.compte_statut,
          })
          .eq("id", banque.id)

        if (error) throw error
        return banque
      }
    }, config)
  }, [employeeId, supabase])

  const deleteBanque = useCallback(async (
    banqueId: string,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    if (banqueId.toString().startsWith("temp-")) {
      return true
    }

    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employee_banque")
        .delete()
        .eq("id", banqueId)

      if (error) throw error
      return true
    }, config) !== null
  }, [supabase])

  // Absences Operations
  const saveAbsence = useCallback(async (
    absence: EmployeeAbsence,
    isNew: boolean,
    config: CrudOperationConfig = {}
  ): Promise<EmployeeAbsence | null> => {
    if (isEmptyAbsence(absence) && isNew) {
      return null
    }

    if (!absence.date_debut || !absence.reference_debut) {
      config.showToast?.("error", "Validation", "Date de début et référence sont obligatoires")
      return null
    }

    return executeCrudOperation(async () => {
      if (isNew) {
        const { data, error } = await supabase
          .from("employee_absence")
          .insert({
            employee_id: employeeId,
            date_debut: absence.date_debut,
            reference_debut: absence.reference_debut,
            date_fin: absence.date_fin || null,
            reference_fin: absence.reference_fin || null,
            duree: absence.duree || null,
          })
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { error } = await supabase
          .from("employee_absence")
          .update({
            date_debut: absence.date_debut,
            reference_debut: absence.reference_debut,
            date_fin: absence.date_fin || null,
            reference_fin: absence.reference_fin || null,
            duree: absence.duree || null,
          })
          .eq("id", absence.id)

        if (error) throw error
        return absence
      }
    }, config)
  }, [employeeId, supabase])

  const deleteAbsence = useCallback(async (
    absenceId: string,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    if (absenceId.toString().startsWith("temp-")) {
      return true
    }

    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employee_absence")
        .delete()
        .eq("id", absenceId)

      if (error) throw error
      return true
    }, config) !== null
  }, [supabase])

  // Employee data operations
  const saveEmployeeData = useCallback(async (
    updateData: Record<string, any>,
    config: CrudOperationConfig = {}
  ): Promise<boolean> => {
    return executeCrudOperation(async () => {
      const { error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employeeId)

      if (error) throw error
      return true
    }, config) !== null
  }, [employeeId, supabase])

  return {
    // Grades
    saveGrade,
    deleteGrade,
    // Fonctions
    saveFonction,
    deleteFonction,
    // Affectations
    saveAffectation,
    deleteAffectation,
    // Banques
    saveBanque,
    deleteBanque,
    // Absences
    saveAbsence,
    deleteAbsence,
    // Employee
    saveEmployeeData,
  }
}