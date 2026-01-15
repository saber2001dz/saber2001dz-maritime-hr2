export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      banque: {
        Row: {
          banque_logo: string | null
          banque_nom: string | null
          created_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          banque_logo?: string | null
          banque_nom?: string | null
          created_at?: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          banque_logo?: string | null
          banque_nom?: string | null
          created_at?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_affectations: {
        Row: {
          created_at: string | null
          date_fin: string | null
          date_responsabilite: string | null
          employee_id: string
          hierarchy_level: number | null
          id: string
          responsibility: string | null
          responsibility_ref_id: string | null
          telex_debut: string | null
          unite: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_fin?: string | null
          date_responsabilite?: string | null
          employee_id: string
          hierarchy_level?: number | null
          id?: string
          responsibility?: string | null
          responsibility_ref_id?: string | null
          telex_debut?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_fin?: string | null
          date_responsabilite?: string | null
          employee_id?: string
          hierarchy_level?: number | null
          id?: string
          responsibility?: string | null
          responsibility_ref_id?: string | null
          telex_debut?: string | null
          unite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_affectations_responsibility_ref_id_fkey"
            columns: ["responsibility_ref_id"]
            isOneToOne: false
            referencedRelation: "responsibilities_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_positions_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_banque: {
        Row: {
          agence: string | null
          banque: string | null
          compte_statut: boolean | null
          created_at: string
          employee_id: string
          id: string
          logo_url: string | null
          rib: string | null
          updated_at: string | null
        }
        Insert: {
          agence?: string | null
          banque?: string | null
          compte_statut?: boolean | null
          created_at?: string
          employee_id: string
          id?: string
          logo_url?: string | null
          rib?: string | null
          updated_at?: string | null
        }
        Update: {
          agence?: string | null
          banque?: string | null
          compte_statut?: boolean | null
          created_at?: string
          employee_id?: string
          id?: string
          logo_url?: string | null
          rib?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_banque_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_conges: {
        Row: {
          created_at: string
          date_debut: string | null
          date_fin: string | null
          duree: number | null
          employee_id: string
          id: string
          statut: string | null
          type_conge: Database["public"]["Enums"]["type_conge_enum"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          duree?: number | null
          employee_id: string
          id?: string
          statut?: string | null
          type_conge?: Database["public"]["Enums"]["type_conge_enum"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          duree?: number | null
          employee_id?: string
          id?: string
          statut?: string | null
          type_conge?: Database["public"]["Enums"]["type_conge_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_conges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contacts: {
        Row: {
          adresse: string | null
          adresse_actuelle: string | null
          adresse_actuelle_note: string | null
          adresse_note: string | null
          created_at: string
          email: string | null
          employee_id: string
          gouvernorat: string | null
          gouvernorat_actuel: string | null
          id: string
          phone_1: string | null
          phone_2: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          adresse?: string | null
          adresse_actuelle?: string | null
          adresse_actuelle_note?: string | null
          adresse_note?: string | null
          created_at?: string
          email?: string | null
          employee_id: string
          gouvernorat?: string | null
          gouvernorat_actuel?: string | null
          id?: string
          phone_1?: string | null
          phone_2?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          adresse?: string | null
          adresse_actuelle?: string | null
          adresse_actuelle_note?: string | null
          adresse_note?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string
          gouvernorat?: string | null
          gouvernorat_actuel?: string | null
          id?: string
          phone_1?: string | null
          phone_2?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_enfants: {
        Row: {
          created_at: string
          date_naissance: string | null
          employee_id: string
          id: string
          niveau_scolaire: string | null
          prenom: string
          sexe: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          employee_id: string
          id?: string
          niveau_scolaire?: string | null
          prenom: string
          sexe?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          employee_id?: string
          id?: string
          niveau_scolaire?: string | null
          prenom?: string
          sexe?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_enfants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_etat_civil: {
        Row: {
          created_at: string
          date_etat_civil: string | null
          employee_id: string
          etat_civil: string | null
          id: string
          identite_conjoint: string | null
          travail_conjoint: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_etat_civil?: string | null
          employee_id: string
          etat_civil?: string | null
          id?: string
          identite_conjoint?: string | null
          travail_conjoint?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_etat_civil?: string | null
          employee_id?: string
          etat_civil?: string | null
          id?: string
          identite_conjoint?: string | null
          travail_conjoint?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_etat_civil_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_fonctions: {
        Row: {
          created_at: string
          date_fin: string | null
          date_obtention_fonction: string | null
          employee_id: string
          fonction: string
          id: string
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_fin?: string | null
          date_obtention_fonction?: string | null
          employee_id: string
          fonction: string
          id?: string
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_fin?: string | null
          date_obtention_fonction?: string | null
          employee_id?: string
          fonction?: string
          id?: string
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_fonctions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_formations: {
        Row: {
          created_at: string
          date_debut: string | null
          date_fin: string | null
          description_diplome: string | null
          duree: number | null
          employee_id: string
          etablissement: string | null
          id: string
          lieu: string | null
          progression: string | null
          resultat: string | null
          type_etablissement: string | null
          type_formation: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description_diplome?: string | null
          duree?: number | null
          employee_id: string
          etablissement?: string | null
          id?: string
          lieu?: string | null
          progression?: string | null
          resultat?: string | null
          type_etablissement?: string | null
          type_formation?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description_diplome?: string | null
          duree?: number | null
          employee_id?: string
          etablissement?: string | null
          id?: string
          lieu?: string | null
          progression?: string | null
          resultat?: string | null
          type_etablissement?: string | null
          type_formation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_formations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_grades: {
        Row: {
          created_at: string
          date_fin: string | null
          date_grade: string
          employee_id: string
          grade: string
          id: string
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_fin?: string | null
          date_grade: string
          employee_id: string
          grade: string
          id?: string
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_fin?: string | null
          date_grade?: string
          employee_id?: string
          grade?: string
          id?: string
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_grades_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_note_annuelle: {
        Row: {
          annee: number
          created_at: string | null
          employee_id: string
          id: string
          note: number | null
          updated_at: string | null
        }
        Insert: {
          annee: number
          created_at?: string | null
          employee_id: string
          id?: string
          note?: number | null
          updated_at?: string | null
        }
        Update: {
          annee?: number
          created_at?: string | null
          employee_id?: string
          id?: string
          note?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_note_annuelle_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_parcours_scolaire: {
        Row: {
          annee_debut: number | null
          annee_fin: number | null
          created_at: string
          diplome: string | null
          employee_id: string
          id: string
          lieu: string | null
          niveau_scolaire: string | null
          updated_at: string | null
        }
        Insert: {
          annee_debut?: number | null
          annee_fin?: number | null
          created_at?: string
          diplome?: string | null
          employee_id: string
          id?: string
          lieu?: string | null
          niveau_scolaire?: string | null
          updated_at?: string | null
        }
        Update: {
          annee_debut?: number | null
          annee_fin?: number | null
          created_at?: string
          diplome?: string | null
          employee_id?: string
          id?: string
          lieu?: string | null
          niveau_scolaire?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_parcours_scolaire_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_photos: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          photo_url: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          photo_url: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          photo_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_photos_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_recompenses: {
        Row: {
          autorite: string | null
          created_at: string | null
          date_recompense: string | null
          employee_id: string
          id: string
          motif: string | null
          type_recompense: string | null
          updated_at: string | null
        }
        Insert: {
          autorite?: string | null
          created_at?: string | null
          date_recompense?: string | null
          employee_id: string
          id?: string
          motif?: string | null
          type_recompense?: string | null
          updated_at?: string | null
        }
        Update: {
          autorite?: string | null
          created_at?: string | null
          date_recompense?: string | null
          employee_id?: string
          id?: string
          motif?: string | null
          type_recompense?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_decorations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rendement: {
        Row: {
          annee: number
          created_at: string | null
          employee_id: string
          id: string
          trimestre: number
          updated_at: string | null
        }
        Insert: {
          annee: number
          created_at?: string | null
          employee_id: string
          id?: string
          trimestre: number
          updated_at?: string | null
        }
        Update: {
          annee?: number
          created_at?: string | null
          employee_id?: string
          id?: string
          trimestre?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_rendement_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sanctions: {
        Row: {
          autorite: string | null
          created_at: string
          date_sanction: string | null
          employee_id: string
          id: string
          motif: string | null
          type_sanction: string | null
          updated_at: string | null
        }
        Insert: {
          autorite?: string | null
          created_at?: string
          date_sanction?: string | null
          employee_id: string
          id?: string
          motif?: string | null
          type_sanction?: string | null
          updated_at?: string | null
        }
        Update: {
          autorite?: string | null
          created_at?: string
          date_sanction?: string | null
          employee_id?: string
          id?: string
          motif?: string | null
          type_sanction?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_sanctions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_urgent_contacts: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          phone: string
          prenom_nom: string
          relationship: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          phone: string
          prenom_nom: string
          relationship: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          phone?: string
          prenom_nom?: string
          relationship?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_urgent_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          actif: Database["public"]["Enums"]["employee_status"]
          cin: string | null
          created_at: string
          date_naissance: string | null
          date_recrutement: string | null
          groupe_sanguin: string | null
          id: string
          identifiant_unique: string | null
          lieu_naissance: string | null
          matricule: string | null
          matricule_mutuel: string | null
          mere: string | null
          nom: string | null
          passeport: string | null
          prenom: string | null
          prenom_grand_pere: string | null
          prenom_pere: string | null
          prive: boolean
          prolongation_retraite: number | null
          sexe: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: Database["public"]["Enums"]["employee_status"]
          cin?: string | null
          created_at?: string
          date_naissance?: string | null
          date_recrutement?: string | null
          groupe_sanguin?: string | null
          id?: string
          identifiant_unique?: string | null
          lieu_naissance?: string | null
          matricule?: string | null
          matricule_mutuel?: string | null
          mere?: string | null
          nom?: string | null
          passeport?: string | null
          prenom?: string | null
          prenom_grand_pere?: string | null
          prenom_pere?: string | null
          prive?: boolean
          prolongation_retraite?: number | null
          sexe?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: Database["public"]["Enums"]["employee_status"]
          cin?: string | null
          created_at?: string
          date_naissance?: string | null
          date_recrutement?: string | null
          groupe_sanguin?: string | null
          id?: string
          identifiant_unique?: string | null
          lieu_naissance?: string | null
          matricule?: string | null
          matricule_mutuel?: string | null
          mere?: string | null
          nom?: string | null
          passeport?: string | null
          prenom?: string | null
          prenom_grand_pere?: string | null
          prenom_pere?: string | null
          prive?: boolean
          prolongation_retraite?: number | null
          sexe?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      responsibilities_hierarchy: {
        Row: {
          created_at: string
          hierarchy_level: number
          id: string
          is_active: boolean | null
          responsibility_name: string
          unite_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          hierarchy_level: number
          id?: string
          is_active?: boolean | null
          responsibility_name: string
          unite_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          responsibility_name?: string
          unite_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unite: {
        Row: {
          created_at: string
          id: string
          navigante: boolean | null
          niveau_1: Database["public"]["Enums"]["direction_enum"] | null
          niveau_2: string | null
          niveau_3: string | null
          unite: string | null
          unite_adresse: string | null
          unite_batiment: string | null
          unite_categorie:
            | Database["public"]["Enums"]["categorie_unite_enum"]
            | null
          unite_classe: string | null
          unite_description: string | null
          unite_email: string | null
          unite_gps: string[] | null
          unite_indicatif: string | null
          unite_matricule: string | null
          unite_port: string | null
          unite_telephone1: string | null
          unite_telephone2: string | null
          unite_telephone3: string | null
          unite_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          navigante?: boolean | null
          niveau_1?: Database["public"]["Enums"]["direction_enum"] | null
          niveau_2?: string | null
          niveau_3?: string | null
          unite?: string | null
          unite_adresse?: string | null
          unite_batiment?: string | null
          unite_categorie?:
            | Database["public"]["Enums"]["categorie_unite_enum"]
            | null
          unite_classe?: string | null
          unite_description?: string | null
          unite_email?: string | null
          unite_gps?: string[] | null
          unite_indicatif?: string | null
          unite_matricule?: string | null
          unite_port?: string | null
          unite_telephone1?: string | null
          unite_telephone2?: string | null
          unite_telephone3?: string | null
          unite_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          navigante?: boolean | null
          niveau_1?: Database["public"]["Enums"]["direction_enum"] | null
          niveau_2?: string | null
          niveau_3?: string | null
          unite?: string | null
          unite_adresse?: string | null
          unite_batiment?: string | null
          unite_categorie?:
            | Database["public"]["Enums"]["categorie_unite_enum"]
            | null
          unite_classe?: string | null
          unite_description?: string | null
          unite_email?: string | null
          unite_gps?: string[] | null
          unite_indicatif?: string | null
          unite_matricule?: string | null
          unite_port?: string | null
          unite_telephone1?: string | null
          unite_telephone2?: string | null
          unite_telephone3?: string | null
          unite_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      unite_category_responsibilities: {
        Row: {
          available_responsibilities: string[]
          created_at: string
          id: string
          unite_categorie: string
          updated_at: string | null
        }
        Insert: {
          available_responsibilities?: string[]
          created_at?: string
          id?: string
          unite_categorie: string
          updated_at?: string | null
        }
        Update: {
          available_responsibilities?: string[]
          created_at?: string
          id?: string
          unite_categorie?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unite_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          photo_url: string
          unite_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          photo_url: string
          unite_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string
          unite_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unite_photos_unite_id_fkey"
            columns: ["unite_id"]
            isOneToOne: false
            referencedRelation: "unite"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_employee_affectation: {
        Args: {
          p_employee_id: string
          p_unite: string
          p_responsibility: string
          p_date_responsabilite?: string
          p_telex_debut?: string
          p_auto_close_previous?: boolean
        }
        Returns: string
      }
      create_new_employee: {
        Args: {
          prenom_in: string
          nom_in: string
          matricule_in: string
          date_naissance_in: string
          sexe_in: string
          grade_in: string
          lieu_naissance_in?: string
          prenom_pere_in?: string
          prenom_grand_pere_in?: string
          mere_in?: string
          identifiant_unique_in?: string
          matricule_mutuel_in?: string
          etat_civil_in?: string
          prive_in?: boolean
          email_in?: string
          phone_1_in?: string
          phone_2_in?: string
          adresse_in?: string
          gouvernorat_in?: string
          adresse_actuelle_in?: string
          gouvernorat_actuel_in?: string
          whatsapp_in?: string
          nombre_enfants_in?: string
          travail_conjoint_in?: string
          date_recrutement_in?: string
          unite_in?: string
          fonction_admin_in?: string
          responsabilite_in?: string
          passeport_in?: string
          cin_in?: string
          photo_url_in?: string
        }
        Returns: string
      }
      create_new_employee_optimized: {
        Args: {
          prenom_in: string
          nom_in: string
          matricule_in: string
          date_naissance_in: string
          sexe_in: string
          grade_in: string
          lieu_naissance_in?: string
          prenom_pere_in?: string
          prenom_grand_pere_in?: string
          mere_in?: string
          identifiant_unique_in?: string
          matricule_mutuel_in?: string
          etat_civil_in?: string
          prive_in?: boolean
          email_in?: string
          phone_1_in?: string
          phone_2_in?: string
          adresse_in?: string
          gouvernorat_in?: string
          adresse_actuelle_in?: string
          gouvernorat_actuel_in?: string
          whatsapp_in?: string
          nombre_enfants_in?: string
          travail_conjoint_in?: string
          date_recrutement_in?: string
          unite_in?: string
          fonction_admin_in?: string
          responsabilite_in?: string
          passeport_in?: string
          cin_in?: string
          photo_url_in?: string
        }
        Returns: string
      }
      find_responsibility_by_alias: {
        Args: { responsibility_name_param: string }
        Returns: {
          created_at: string
          hierarchy_level: number
          id: string
          is_active: boolean | null
          responsibility_name: string
          unite_type: string | null
          updated_at: string | null
        }
      }
      get_current_employee_affectation: {
        Args: { employee_uuid: string }
        Returns: {
          unite: string
          responsibility: string
        }[]
      }
      get_current_employee_grade: {
        Args: { employee_uuid: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_responsibilities_by_unite_category: {
        Args: { unite_categorie_param: string }
        Returns: {
          id: string
          responsibility_name: string
          hierarchy_level: number
          created_at: string
          updated_at: string
        }[]
      }
      get_responsibilities_by_unite_type: {
        Args: { unite_type_param: string }
        Returns: {
          id: string
          responsibility_name: string
          hierarchy_level: number
          created_at: string
          updated_at: string
        }[]
      }
      get_unite_agents: {
        Args: { unite_name: string }
        Returns: {
          id: string
          prenom: string
          nom: string
          matricule: string
          responsibility: string
          date_responsabilite: string
          photo_url: string
          employee_grade: string
          phone_1: string
          sexe: string
          telex_debut: string
        }[]
      }
      get_unite_category_by_name: {
        Args: { unite_name_param: string }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
    }
    Enums: {
      categorie_unite_enum:
        | "Direction Garde-Cotes"
        | "District Maritime"
        | "Secteur Maritime"
        | "Sous Direction"
        | "Patrouilleur 35m"
        | "Brigade Maritime"
        | "Patrouilleur 23m"
        | "Patrouilleur 20m"
        | "Patrouilleur 17m"
        | "Poste Maritime"
        | "Tour Controle"
        | "Station Radar"
        | "Patrouilleur 16m"
        | "Patrouilleur 15m"
        | "Patrouilleur 14m"
        | "Patrouilleur 12m"
        | "Patrouilleur Defender"
        | "Patrouilleur Saker"
        | "Service"
      direction_enum:
        | "Direction Garde-Cotes"
        | "District Maritime Nord"
        | "District Maritime Sahel"
        | "District Maritime Centre"
        | "District Maritime Sud"
      employee_status:
        | "مباشر"
        | "غير مباشر"
        | "إجازة"
        | "مرض"
        | "تدريب"
        | "مهمة"
        | "متغيب"
        | "موقوف"
      type_conge_enum:
        | "Annuel"
        | "Maladie"
        | "Exceptionnel"
        | "Mariage"
        | "Maternite"
        | "Sans Solde"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categorie_unite_enum: [
        "Direction Garde-Cotes",
        "District Maritime",
        "Secteur Maritime",
        "Sous Direction",
        "Patrouilleur 35m",
        "Brigade Maritime",
        "Patrouilleur 23m",
        "Patrouilleur 20m",
        "Patrouilleur 17m",
        "Poste Maritime",
        "Tour Controle",
        "Station Radar",
        "Patrouilleur 16m",
        "Patrouilleur 15m",
        "Patrouilleur 14m",
        "Patrouilleur 12m",
        "Patrouilleur Defender",
        "Patrouilleur Saker",
        "Service",
      ],
      direction_enum: [
        "Direction Garde-Cotes",
        "District Maritime Nord",
        "District Maritime Sahel",
        "District Maritime Centre",
        "District Maritime Sud",
      ],
      employee_status: [
        "مباشر",
        "غير مباشر",
        "إجازة",
        "مرض",
        "تدريب",
        "مهمة",
        "متغيب",
        "موقوف",
      ],
      type_conge_enum: [
        "Annuel",
        "Maladie",
        "Exceptionnel",
        "Mariage",
        "Maternite",
        "Sans Solde",
      ],
    },
  },
} as const
