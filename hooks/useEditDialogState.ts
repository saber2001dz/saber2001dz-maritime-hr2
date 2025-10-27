import { useReducer, useCallback, useMemo } from "react"
import {
  EmployeeCompleteData,
  EmployeeGrade,
  EmployeeFonctions,
  EmployeeAffectation,
  EmployeeBanque,
  EmployeeAbsence,
} from "@/types/details_employees"

// Types pour les actions du reducer
type EditDialogAction =
  | { type: "SYNC_DATA"; payload: EmployeeCompleteData }
  | { type: "SET_CONTRACT_DATA"; payload: Partial<ContractData> }
  | { type: "SET_SITUATION_DATA"; payload: Partial<SituationData> }
  | { type: "SET_GRADES"; payload: EmployeeGrade[] }
  | { type: "SET_FONCTIONS"; payload: EmployeeFonctions[] }
  | { type: "SET_AFFECTATIONS"; payload: EmployeeAffectation[] }
  | { type: "SET_BANQUES"; payload: EmployeeBanque[] }
  | { type: "SET_ABSENCES"; payload: EmployeeAbsence[] }
  | { type: "SET_BANQUES_LIST"; payload: { banque_nom: string; banque_logo: string }[] }
  | { type: "SET_UNITES_LIST"; payload: { id: string; unite: string; unite_categorie: string }[] }
  | { type: "SET_RESPONSIBILITIES_LIST"; payload: string[] }
  | { type: "SET_SELECTED_UNITE_CATEGORY"; payload: string }
  | { type: "SET_EDITING_GRADE_INDEX"; payload: number | null }
  | { type: "SET_EDITING_FONCTION_INDEX"; payload: number | null }
  | { type: "SET_EDITING_AFFECTATION_INDEX"; payload: number | null }
  | { type: "SET_EDITING_BANQUE_INDEX"; payload: number | null }
  | { type: "SET_EDITING_ABSENCE_INDEX"; payload: number | null }
  | { type: "RESET_FORM_DATA" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CLOSING"; payload: boolean }

// Types pour les données
interface ContractData {
  date_recrutement: string
}

interface SituationData {
  matricule: string
  identifiant_unique: string
  prive: boolean
}

// État du reducer
interface EditDialogState {
  // Données de base
  contractData: ContractData
  situationData: SituationData
  
  // Listes d'entités
  grades: EmployeeGrade[]
  fonctions: EmployeeFonctions[]
  affectations: EmployeeAffectation[]
  banques: EmployeeBanque[]
  absences: EmployeeAbsence[]
  
  // Listes originales pour le reset
  originalGradesList: EmployeeGrade[]
  originalFonctionsList: EmployeeFonctions[]
  originalAffectationsList: EmployeeAffectation[]
  originalBanquesList: EmployeeBanque[]
  originalAbsencesList: EmployeeAbsence[]
  
  // Listes de référence
  banquesList: { banque_nom: string; banque_logo: string }[]
  unitesList: { id: string; unite: string; unite_categorie: string }[]
  responsibilitiesList: string[]
  selectedUniteCategory: string
  
  // Indices d'édition
  editingGradeIndex: number | null
  editingFonctionIndex: number | null
  editingAffectationIndex: number | null
  editingBanqueIndex: number | null
  editingAbsenceIndex: number | null
  
  // États de contrôle
  isLoading: boolean
  isClosing: boolean
}

// Fonction pour créer l'état initial
function createInitialState(data: EmployeeCompleteData): EditDialogState {
  const initialContractData = {
    date_recrutement: data.employee.date_recrutement || "",
  }

  const initialSituationData = {
    matricule: data.employee.matricule || "",
    identifiant_unique: data.employee.identifiant_unique || "",
    prive: data.employee.prive || false,
  }

  return {
    contractData: initialContractData,
    situationData: initialSituationData,
    grades: data.grades || [],
    fonctions: data.fonctions || [],
    affectations: data.affectations || [],
    banques: data.banque || [],
    absences: data.absences || [],
    originalGradesList: data.grades || [],
    originalFonctionsList: data.fonctions || [],
    originalAffectationsList: data.affectations || [],
    originalBanquesList: data.banque || [],
    originalAbsencesList: data.absences || [],
    banquesList: [],
    unitesList: [],
    responsibilitiesList: [],
    selectedUniteCategory: "",
    editingGradeIndex: null,
    editingFonctionIndex: null,
    editingAffectationIndex: null,
    editingBanqueIndex: null,
    editingAbsenceIndex: null,
    isLoading: false,
    isClosing: false,
  }
}

// Reducer function
function editDialogReducer(state: EditDialogState, action: EditDialogAction): EditDialogState {
  switch (action.type) {
    case "SYNC_DATA":
      return {
        ...state,
        grades: action.payload.grades || [],
        fonctions: action.payload.fonctions || [],
        affectations: action.payload.affectations || [],
        banques: action.payload.banque || [],
        absences: action.payload.absences || [],
        originalGradesList: action.payload.grades || [],
        originalFonctionsList: action.payload.fonctions || [],
        originalAffectationsList: action.payload.affectations || [],
        originalBanquesList: action.payload.banque || [],
        originalAbsencesList: action.payload.absences || [],
      }
    
    case "SET_CONTRACT_DATA":
      return {
        ...state,
        contractData: { ...state.contractData, ...action.payload },
      }
    
    case "SET_SITUATION_DATA":
      return {
        ...state,
        situationData: { ...state.situationData, ...action.payload },
      }
    
    case "SET_GRADES":
      return { ...state, grades: action.payload }
    
    case "SET_FONCTIONS":
      return { ...state, fonctions: action.payload }
    
    case "SET_AFFECTATIONS":
      return { ...state, affectations: action.payload }
    
    case "SET_BANQUES":
      return { ...state, banques: action.payload }
    
    case "SET_ABSENCES":
      return { ...state, absences: action.payload }
    
    case "SET_BANQUES_LIST":
      return { ...state, banquesList: action.payload }
    
    case "SET_UNITES_LIST":
      return { ...state, unitesList: action.payload }
    
    case "SET_RESPONSIBILITIES_LIST":
      return { ...state, responsibilitiesList: action.payload }
    
    case "SET_SELECTED_UNITE_CATEGORY":
      return { ...state, selectedUniteCategory: action.payload }
    
    case "SET_EDITING_GRADE_INDEX":
      return { ...state, editingGradeIndex: action.payload }
    
    case "SET_EDITING_FONCTION_INDEX":
      return { ...state, editingFonctionIndex: action.payload }
    
    case "SET_EDITING_AFFECTATION_INDEX":
      return { ...state, editingAffectationIndex: action.payload }
    
    case "SET_EDITING_BANQUE_INDEX":
      return { ...state, editingBanqueIndex: action.payload }
    
    case "SET_EDITING_ABSENCE_INDEX":
      return { ...state, editingAbsenceIndex: action.payload }
    
    case "RESET_FORM_DATA":
      return {
        ...state,
        contractData: createInitialState({ employee: state.contractData } as any).contractData,
        situationData: createInitialState({ employee: state.situationData } as any).situationData,
        grades: state.originalGradesList,
        fonctions: state.originalFonctionsList,
        affectations: state.originalAffectationsList,
        banques: state.originalBanquesList,
        absences: state.originalAbsencesList,
        editingGradeIndex: null,
        editingFonctionIndex: null,
        editingAffectationIndex: null,
        editingBanqueIndex: null,
        editingAbsenceIndex: null,
      }
    
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    
    case "SET_CLOSING":
      return { ...state, isClosing: action.payload }
    
    default:
      return state
  }
}

// Hook personnalisé
export function useEditDialogState(data: EmployeeCompleteData) {
  const [state, dispatch] = useReducer(
    editDialogReducer,
    data,
    createInitialState
  )

  // Actions mémorisées
  const actions = useMemo(() => ({
    syncData: (data: EmployeeCompleteData) => 
      dispatch({ type: "SYNC_DATA", payload: data }),
    
    setContractData: (data: Partial<ContractData>) => 
      dispatch({ type: "SET_CONTRACT_DATA", payload: data }),
    
    setSituationData: (data: Partial<SituationData>) => 
      dispatch({ type: "SET_SITUATION_DATA", payload: data }),
    
    setGrades: (grades: EmployeeGrade[]) => 
      dispatch({ type: "SET_GRADES", payload: grades }),
    
    setFonctions: (fonctions: EmployeeFonctions[]) => 
      dispatch({ type: "SET_FONCTIONS", payload: fonctions }),
    
    setAffectations: (affectations: EmployeeAffectation[]) => 
      dispatch({ type: "SET_AFFECTATIONS", payload: affectations }),
    
    setBanques: (banques: EmployeeBanque[]) => 
      dispatch({ type: "SET_BANQUES", payload: banques }),
    
    setAbsences: (absences: EmployeeAbsence[]) => 
      dispatch({ type: "SET_ABSENCES", payload: absences }),
    
    setBanquesList: (banques: { banque_nom: string; banque_logo: string }[]) => 
      dispatch({ type: "SET_BANQUES_LIST", payload: banques }),
    
    setUnitesList: (unites: { id: string; unite: string; unite_categorie: string }[]) => 
      dispatch({ type: "SET_UNITES_LIST", payload: unites }),
    
    setResponsibilitiesList: (responsibilities: string[]) => 
      dispatch({ type: "SET_RESPONSIBILITIES_LIST", payload: responsibilities }),
    
    setSelectedUniteCategory: (category: string) => 
      dispatch({ type: "SET_SELECTED_UNITE_CATEGORY", payload: category }),
    
    setEditingGradeIndex: (index: number | null) => 
      dispatch({ type: "SET_EDITING_GRADE_INDEX", payload: index }),
    
    setEditingFonctionIndex: (index: number | null) => 
      dispatch({ type: "SET_EDITING_FONCTION_INDEX", payload: index }),
    
    setEditingAffectationIndex: (index: number | null) => 
      dispatch({ type: "SET_EDITING_AFFECTATION_INDEX", payload: index }),
    
    setEditingBanqueIndex: (index: number | null) => 
      dispatch({ type: "SET_EDITING_BANQUE_INDEX", payload: index }),
    
    setEditingAbsenceIndex: (index: number | null) => 
      dispatch({ type: "SET_EDITING_ABSENCE_INDEX", payload: index }),
    
    resetFormData: () => 
      dispatch({ type: "RESET_FORM_DATA" }),
    
    setLoading: (loading: boolean) => 
      dispatch({ type: "SET_LOADING", payload: loading }),
    
    setClosing: (closing: boolean) => 
      dispatch({ type: "SET_CLOSING", payload: closing }),
  }), [])

  return { state, actions }
}

// Types exportés
export type { ContractData, SituationData, EditDialogState }