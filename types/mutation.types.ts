// Types pour la table employee_mutations

export interface RawMutationData {
  id: string
  created_at: string
  updated_at: string | null
  employee_id: string
  grade: string | null
  prenom_nom: string | null
  matricule: string | null
  unite_actuelle: string | null
  date_affectation: string | null
  causes: string | null
  type_demande: string | null
  direction: string | null
}

export interface DisplayMutation {
  id: string
  employee_id: string
  grade: string | null
  prenom_nom: string | null
  matricule: string | null
  unite_actuelle: string | null
  date_affectation: string | null
  causes: string | null
  type_demande: string | null
  direction: string | null
  created_at: string
}

// Fonction pour traiter les données brutes en données d'affichage
export function processMutationData(raw: RawMutationData): DisplayMutation {
  return {
    id: raw.id,
    employee_id: raw.employee_id,
    grade: raw.grade,
    prenom_nom: raw.prenom_nom,
    matricule: raw.matricule,
    unite_actuelle: raw.unite_actuelle,
    date_affectation: raw.date_affectation,
    causes: raw.causes,
    type_demande: raw.type_demande,
    direction: raw.direction,
    created_at: raw.created_at,
  }
}

// Query de sélection pour Supabase
export const MUTATION_SELECT_QUERY = `
  id,
  employee_id,
  grade,
  prenom_nom,
  matricule,
  unite_actuelle,
  date_affectation,
  causes,
  type_demande,
  direction,
  created_at
`
