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
  responsable_agent: string | null
  avis_niveau1: string | null
  avis_niveau2: string | null
  avis_niveau3: string | null
  avis_niveau4: string | null
  avis_directeur: string | null
  avis_direction_generale: string | null
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
  responsable_agent: string | null
  created_at: string
  avis_niveau1: string | null
  avis_niveau2: string | null
  avis_niveau3: string | null
  avis_niveau4: string | null
  avis_directeur: string | null
  avis_direction_generale: string | null
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
    responsable_agent: raw.responsable_agent,
    created_at: raw.created_at,
    avis_niveau1: raw.avis_niveau1,
    avis_niveau2: raw.avis_niveau2,
    avis_niveau3: raw.avis_niveau3,
    avis_niveau4: raw.avis_niveau4,
    avis_directeur: raw.avis_directeur,
    avis_direction_generale: raw.avis_direction_generale,
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
  responsable_agent,
  created_at,
  avis_niveau1,
  avis_niveau2,
  avis_niveau3,
  avis_niveau4,
  avis_directeur,
  avis_direction_generale
`
