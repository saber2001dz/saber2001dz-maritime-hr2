export interface AgentBase {
  id: string;
  prenom: string;
  nom: string;
  matricule: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  prenom_pere: string | null;
  prenom_grand_pere: string | null;
  identifiant_unique: string | null;
  date_recrutement: string | null;
  groupe_sanguin: string | null;
  etat_civil: string | null;
  actif: boolean | null;
}

export interface AgentWorkInfo {
  photo_url: string | null;
  unite: string | null;
  responsibility: string | null;
  grade: string | null;
}

export interface AgentAddress {
  adresse: string | null;
  gouvernorat: string | null;
  adresse_actuelle: string | null;
  gouvernorat_actuel: string | null;
}

export interface EmergencyContact {
  prenom_nom: string;
  relation: string;
  telephone: string;
}

export interface Education {
  description_diplome: string;
  type_formation: string;
  date_debut: string;
  date_fin: string;
}

export interface Assignment {
  unite: string;
  responsibility: string;
  date_debut: string | null;
}

export type Agent = AgentBase & AgentWorkInfo & AgentAddress & {
  contact_urgence: EmergencyContact | null;
  formations: Education[];
  affectations: Assignment[];
  educationHistory: EducationHistory[];
}

// Type pour les formations
export type Formation = {
  description_diplome: string;
  type_formation: string;
  date_debut: string;
  date_fin: string;
}

// Type pour les affectations
export type Affectation = {
  unite: string;
  responsibility: string;
  date_debut: string;
}

// Type pour le parcours scolaire
export type EducationHistory = {
  niveau_scolaire: string;
  diplome: string;
  lieu: string;
  annee_debut: number;
  annee_fin: number;
}