//types/employeeTable.ts
import { Database } from "@/types/database.types"

export type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"]

export interface EmployeeGrade {
  grade: string | null
  date_grade?: string | null
}

export interface EmployeePhoto {
  photo_url: string | null
}

export interface EmployeeAffectation {
  unite: string | null
  responsibility: string | null
  date_debut: string | null
}

// Type pour la requête liste (EMPLOYEE_LIST_SELECT_QUERY)
export interface RawEmployeeData {
  id: string
  prenom: string | null
  nom: string | null
  sexe: string | null
  matricule: string | null
  actif: string
  identifiant_unique: string | null
  date_recrutement: string | null
  date_retraite: string | null
  cin: string | null
  date_naissance: string | null
  grade_actuel?: string | null
  date_grade?: string | null
  unite_actuelle?: string | null
  responsabilite_actuelle?: string | null
  date_affectation?: string | null
  hierarchy_level?: number | null
  employee_photos?: EmployeePhoto[] | null
}

// Type complet pour les détails d'un employé
export interface RawEmployeeFullData extends EmployeeRow {
  grade_actuel?: string | null
  date_grade?: string | null
  unite_actuelle?: string | null
  responsabilite_actuelle?: string | null
  date_affectation?: string | null
  hierarchy_level?: number | null
  employee_photos?: EmployeePhoto[] | null
}

export interface DisplayEmployee {
  id: string
  prenom: string | null
  nom: string | null
  sexe: string | null
  matricule: string | null
  actif: string
  identifiant_unique: string | null
  latestUnite: string | null
  latestResponsibility: string | null
  latestDateAffectation: string | null
  latestGrade: string
  latestGradeRaw: string | null
  displayImage: string
  currentGradeDate: string | null
  recruitmentDate: string | null
  hierarchyLevel: number | null
  dateRetraite: string | null
  cin: string | null
  date_naissance: string | null
}