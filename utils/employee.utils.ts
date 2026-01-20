
import { RawEmployeeData, DisplayEmployee } from "@/types/employeeTable.types"
import { getGradeLabel } from "@/lib/selectOptions"

// Hiérarchie des grades (du plus haut au plus bas) - Grades arabes de la base de données
const GRADE_HIERARCHY = [
  "عميد",           // Brigadier (équivalent Colonel Major)
  "عقيد",           // Colonel
  "مقدم",           // Lieutenant Colonel  
  "رائد",           // Commandant
  "نقيب",           // Capitaine
  "ملازم أول",      // Lieutenant
  "ملازم",          // Sous Lieutenant
  "وكيل أول",       // Adjudant Chef
  "وكيل",           // Adjudant
  "عريف أول",       // Caporal Chef
  "عريف",           // Caporal
  "رقيب أول",       // Sergent Chef
  "رقيب",           // Sergent
  "حرس"            // Garde
] as const

export const getGradeRank = (grade: string): number => {
  const index = GRADE_HIERARCHY.indexOf(grade as any)
  return index === -1 ? 999 : index // Les grades inconnus sont classés en dernier
}

// Hiérarchie des responsabilités basée sur la table responsibilities_hierarchy officielle
// Système de numérotation par dizaines pour permettre l'extension
const RESPONSIBILITY_HIERARCHY: { [key: string]: number } = {
  // Niveau 10-19 - Direction
  "مدير مركزي": 10,        // Directeur Central
  "مدير إفليم": 11,         // Directeur de District
  
  // Niveau 20-29 - Sous-Direction
  "رئيس منطقة": 20,         // Chef de Zone
  "آمر طوافة": 21,          // Commandant de Flottille
  "رئبس إدارة": 22,         // Chef d'Administration
  
  // Niveau 30-39 - Services/Brigades
  "رئيس فرقة": 30,          // Chef de Brigade
  "رئيس مصلحة": 31,         // Chef de Service
  "أمر خافرة": 32,          // Commandant de Patrouilleur
  
  // Niveau 40-49 - Postes/Techniques
  "رئيس مركز": 40,          // Chef de Poste
  "ربان أول": 41,           // Premier Patron
  "ميكانيكي أول": 42,       // Premier Mécanicien
  "رئيس قسم": 43,           // Chef de Section
  
  // Niveau 50-59 - Adjoints/Seconds
  "ربان ثاني": 50,          // Deuxième Patron
  
  // Niveau 100 - Agents
  "عون": 100                // Agent
}

export const getResponsibilityRank = (responsibility: string | null): number => {
  if (!responsibility) return 999 // Pas de responsabilité = classé en dernier
  return RESPONSIBILITY_HIERARCHY[responsibility] || 999 // Responsabilités inconnues = classées en dernier
}

export const processEmployeeData = (emp: RawEmployeeData): DisplayEmployee => {
  // Lecture directe du grade actuel - version brute pour le tri
  const latestGradeRaw = emp.grade_actuel || null
  // Version formatée pour l'affichage
  const latestGradeDisplay = getGradeLabel(emp.grade_actuel || undefined) || "sans grade"
  const currentGradeDate = emp.date_grade || null

  // Lecture directe de l'affectation actuelle
  const latestUnite = emp.unite_actuelle || null
  const latestResponsibility = emp.affectation_actuel || null
  const latestDateAffectation = emp.date_affectation || null
  const hierarchyLevel = emp.hierarchy_level || null

  // Traitement de l'image
  let imageToDisplay = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='12'%3E?%3C/text%3E%3C/svg%3E"

  // Vérifier si l'employé a une photo personnalisée
  if (emp.employee_photos && emp.employee_photos.length > 0 && emp.employee_photos[0]?.photo_url) {
    imageToDisplay = emp.employee_photos[0].photo_url
  } 
  // Sinon, utiliser l'image par défaut basée sur le sexe
  else if (emp.sexe) {
    if (emp.sexe === "ذكر") {
      imageToDisplay = "/images/homme.png"
    } else if (emp.sexe === "أنثى") {
      imageToDisplay = "/images/femme.png"
    }
  }
  // Si pas de sexe défini, garder l'image par défaut "?"

  return {
    id: emp.id,
    prenom: emp.prenom,
    nom: emp.nom,
    sexe: emp.sexe,
    matricule: emp.matricule,
    actif: emp.actif,
    identifiant_unique: emp.identifiant_unique,
    latestUnite: latestUnite,
    latestResponsibility: latestResponsibility,
    latestDateAffectation: latestDateAffectation,
    latestGrade: latestGradeDisplay,
    latestGradeRaw: latestGradeRaw,
    displayImage: imageToDisplay,
    currentGradeDate: currentGradeDate,
    recruitmentDate: emp.date_recrutement || null,
    hierarchyLevel: hierarchyLevel,
    dateRetraite: emp.date_retraite || null,
    cin: emp.cin || null,
    date_naissance: emp.date_naissance || null,
  }
}

// Requête complète pour les détails d'un employé
export const EMPLOYEE_FULL_SELECT_QUERY = `
  id, prenom, nom, sexe, matricule, actif, date_naissance, lieu_naissance, 
  identifiant_unique, cin, created_at, updated_at, prive, mere, prenom_pere, 
  prenom_grand_pere, groupe_sanguin, passeport, date_recrutement,
  employee_grades (grade, date_grade),
  employee_photos (photo_url)
`

// Requête optimisée pour la liste/table des employés (données essentielles seulement)
export const EMPLOYEE_LIST_SELECT_QUERY = `
  id, prenom, nom, sexe, matricule, actif, identifiant_unique, date_recrutement, date_retraite, cin, date_naissance,
  grade_actuel, date_grade, unite_actuelle, affectation_actuel, date_affectation, hierarchy_level,
  employee_photos (photo_url)
`

// Alias pour compatibilité (utilise la version liste par défaut)
export const EMPLOYEE_SELECT_QUERY = EMPLOYEE_LIST_SELECT_QUERY

// Interface pour les employés avec la structure de tri hiérarchique
interface SortableEmployee {
  hierarchyLevel: number | null
  latestGradeRaw: string | null
  currentGradeDate: string | null
  recruitmentDate: string | null
  nom: string | null
}

// Fonction centralisée de tri hiérarchique des employés selon les critères spécifiés
export const sortEmployeesByHierarchy = <T extends SortableEmployee>(employees: T[]): T[] => {
  return [...employees].sort((a, b) => {
    // 1. Tri par grade (du plus haut au plus bas)
    const gradeRankA = getGradeRank(a.latestGradeRaw || "")
    const gradeRankB = getGradeRank(b.latestGradeRaw || "")

    if (gradeRankA !== gradeRankB) {
      return gradeRankA - gradeRankB
    }

    // 2. Si même grade, tri croissant par hierarchy_level (plus petit = plus haut dans la hiérarchie)
    const hierarchyA = a.hierarchyLevel
    const hierarchyB = b.hierarchyLevel

    // Gérer les cas où hierarchy_level est null (les mettre à la fin)
    if (hierarchyA === null && hierarchyB === null) {
      // Les deux sont null, passer au critère suivant
    } else if (hierarchyA === null) {
      return 1 // A n'a pas de hierarchy_level, le mettre après B
    } else if (hierarchyB === null) {
      return -1 // B n'a pas de hierarchy_level, le mettre après A
    } else if (hierarchyA !== hierarchyB) {
      return hierarchyA - hierarchyB // Tri croissant : plus petit hierarchy_level en premier
    }

    // 3. Si même hierarchy_level, tri par ancienneté dans le grade (plus ancien en premier)
    if (a.currentGradeDate && b.currentGradeDate) {
      const dateA = new Date(a.currentGradeDate).getTime()
      const dateB = new Date(b.currentGradeDate).getTime()
      if (dateA !== dateB) {
        return dateA - dateB // Plus ancienne date en premier
      }
    } else if (a.currentGradeDate) {
      return -1 // A a une date, B n'en a pas - A en premier
    } else if (b.currentGradeDate) {
      return 1 // B a une date, A n'en a pas - B en premier
    }

    // 4. Si même ancienneté dans le grade, tri par ancienneté totale (plus ancien en premier)
    if (a.recruitmentDate && b.recruitmentDate) {
      const recruitA = new Date(a.recruitmentDate).getTime()
      const recruitB = new Date(b.recruitmentDate).getTime()
      if (recruitA !== recruitB) {
        return recruitA - recruitB // Plus ancienne date de recrutement en premier
      }
    } else if (a.recruitmentDate) {
      return -1 // A a une date de recrutement, B n'en a pas - A en premier
    } else if (b.recruitmentDate) {
      return 1 // B a une date de recrutement, A n'en a pas - B en premier
    }

    // 5. En dernier recours, tri alphabétique par nom
    const nomA = a.nom || ""
    const nomB = b.nom || ""
    return nomA.localeCompare(nomB, "fr", { sensitivity: "base" })
  })
}