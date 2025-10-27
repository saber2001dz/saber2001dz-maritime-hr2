// lib/details_employees.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types pour TypeScript
export interface Employee {
  id: string
  prenom: string
  nom: string
  matricule: string
  date_naissance: string
  prenom_pere: string
  prenom_grand_pere: string
  lieu_naissance: string
  sexe: string
  identifiant_unique: string
  prive: boolean
  mere: string
  actif: boolean
  cin: string
  matricule_mutuel: string
  groupe_sanguin: string
  passeport: string
  etat_civil: string
  date_recrutement: string
  prolongation_retraite: number
  unite_actuelle?: string
  affectation_actuel?: string
  grade_actuel?: string
  created_at: string
  updated_at: string
}

export interface EmployeeAffectation {
  id: string
  employee_id: string
  unite: string
  responsibility: string
  reference: string
  date_responsabilite: string
  telex_debut: string  
  date_fin: string
  created_at: string
  updated_at: string
}

export interface EmployeeContact {
  id: string
  employee_id: string
  email: string
  phone_1: string
  phone_2: string
  whatsapp: string
  adresse: string
  gouvernorat: string
  adresse_actuelle: string
  gouvernorat_actuel: string
  adresse_note: string
  adresse_actuelle_note: string
  created_at: string
  updated_at: string
}

export interface EmployeeEtatCivil {
  id: string
  employee_id: string
  etat_civil: string
  travail_conjoint: string
  identite_conjoint: string
  date_etat_civil: string
  created_at: string
  updated_at: string
}

export interface EmployeeEnfant {
  id: string
  prenom: string
  date_naissance: string
  sexe: string
  niveau_scolaire: string
  created_at: string
  updated_at: string
}

export interface EmployeeFormation {
  id: string
  employee_id: string
  lieu: string
  type_etablissement: string
  type_formation: string
  etablissement: string
  date_debut: string
  date_fin: string
  duree: number
  description_diplome: string
  progression: string
  resultat: string
  created_at: string
  updated_at: string
}

export interface EmployeeGrade {
  id: string
  employee_id: string
  grade: string
  date_grade: string
  date_fin: string
  reference: string
  created_at: string
  updated_at: string
}

export interface EmployeeConge {
  statut: string
  id: string
  employee_id: string
  type_conge: string
  date_debut: string
  date_fin: string
  duree: number
  created_at: string
  updated_at: string
}

export interface EmployeeSanctions {
  id: string
  employee_id: string
  type_sanction: string
  date_sanction: string
  autorite: string
  motif: string
  created_at: string
  updated_at: string
}

export interface EmployeeRecompenses {
  id: string
  employee_id: string
  type_recompense: string
  date_recompense: string
  autorite: string
  motif: string
  created_at: string
  updated_at: string
}

export interface EmployeePhotos {
  id: string
  photo_url: string
  created_at: string
  updated_at: string
}

export interface EmployeeFonctions {
  id: string
  fonction: string
  date_obtention_fonction: string
  date_fin: string
  reference: string
  created_at: string
  updated_at: string
}

export interface EmployeeBanque {
  id: string
  banque: string
  agence: string
  rib: string
  logo_url:string
  compte_statut: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeAbsence {
  id: string
  employee_id: string
  date_debut: string
  reference_debut: string
  date_fin: string
  reference_fin: string
  duree: number
  created_at: string
  updated_at: string
}

export interface EmployeeUrgentContacts {
  id: string
  prenom_nom: string
  relationship: string
  phone: string
  created_at: string
  updated_at: string
}

export interface EmployeeParcoursScolaire {
  id: string
  niveau_scolaire: string
  diplome: string
  annee_debut: string
  annee_fin: string
  lieu: string
  created_at: string
  updated_at: string
}

export interface EmployeeRendement {
  id: string
  employee_id: string
  annee: number
  trimestre: number
  rendement_note?: number // Propriété optionnelle car elle pourrait ne pas exister dans la base
  created_at: string
  updated_at: string
}

export interface EmployeeNoteAnnuelle {
  id: string
  employee_id: string
  annee: number
  note_annuelle: number // Seule propriété conservée dans la base de données
  created_at: string
  updated_at: string
}

export interface EmployeeCompleteData {
  selectedFormation: boolean
  employee: Employee
  absences: EmployeeAbsence[]
  affectations: EmployeeAffectation[]
  banque: EmployeeBanque[]
  conges: EmployeeConge[]
  contacts: EmployeeContact[]
  enfants: EmployeeEnfant[]  
  etat_civil: EmployeeEtatCivil[]
  fonctions: EmployeeFonctions[]  
  formations: EmployeeFormation[]  
  grades: EmployeeGrade[]
  notes_annuelles: EmployeeNoteAnnuelle[]
  parcours_scolaire: EmployeeParcoursScolaire[]
  photos: EmployeePhotos[]
  recompenses: EmployeeRecompenses[]
  rendements: EmployeeRendement[]
  sanctions: EmployeeSanctions[]  
  urgent_contacts: EmployeeUrgentContacts[]  
}