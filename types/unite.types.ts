// Types pour la gestion des unités

export interface RawUniteData {
  id: string
  created_at: string
  unite: string | null
  unite_matricule: string | null
  unite_type: string | null
  niveau_1: "Direction Garde-Côtes" | "District Maritime Nord" | "District Maritime Sahel" | "District Maritime Centre" | "District Maritime Sud" | null
  niveau_2: string | null
  niveau_3: string | null
  niveau_4: string | null
  updated_at: string | null
  navigante: boolean | null
  unite_categorie: "Direction Garde-Cotes" | "District Maritime" | "Secteur Maritime" | "Sous Direction" | "Patrouilleur 35m" | "Brigade Maritime" | "Patrouilleur 23m" | "Patrouilleur 20m" | "Patrouilleur 17m" | "Poste Maritime" | "Tour Controle" | "Station Radar" | "Patrouilleur 15m" | "Patrouilleur 14m" | "Patrouilleur 12m" | "Patrouilleur Defender" | "Patrouilleur Saker" | "Service" | "Patrouilleur 16m" | null
  unite_rang: number | null
  unite_batiment: string | null
  unite_adresse: string | null
  unite_port: string | null
  unite_gps: string[] | null
  unite_telephone1: string | null
  unite_telephone2: string | null
  unite_telephone3: string | null
  unite_indicatif: string | null
  unite_email: string | null
  unite_description: string | null
  unite_responsable: string | null  // UUID de l'employé responsable de l'unité
  responsable?: {
    nom: string | null
    prenom: string | null
    grade_actuel: string | null
  } | null
}

export interface DisplayUnite {
  id: string
  unite: string
  unite_matricule: string
  unite_type: string
  niveau_1: string
  niveau_2: string
  niveau_3: string
  niveau_4: string
  navigante: boolean
  unite_categorie: string
  unite_rang: number
  unite_batiment: string
  unite_adresse: string
  unite_port: string
  unite_gps: string[]
  unite_telephone1: string
  unite_telephone2: string
  unite_telephone3: string
  unite_indicatif: string
  unite_email: string
  unite_description: string
  unite_responsable: string | null  // UUID de l'employé responsable
  responsable_nom: string  // Nom complet du responsable
  created_at: string
  updated_at: string | null
}

export interface UniteTableRealtimeProps {
  initialUnites: DisplayUnite[]
}

// Fonction utilitaire pour traiter les données d'unité
export const processUniteData = (rawData: RawUniteData): DisplayUnite => {
  // Construire le nom complet du responsable avec grade
  let responsableNom = "غير محدد"
  if (rawData.responsable) {
    const { nom, prenom, grade_actuel } = rawData.responsable
    if (nom && prenom) {
      // Format: grade + prenom + nom (les noms sont en arabe dans la DB)
      responsableNom = grade_actuel ? `${grade_actuel} ${prenom} ${nom}` : `${prenom} ${nom}`
    }
  }

  return {
    id: rawData.id,
    unite: rawData.unite || "غير محدد",
    unite_matricule: rawData.unite_matricule || "غير محدد",
    unite_type: rawData.unite_type || "غير محدد",
    niveau_1: rawData.niveau_1 || "غير محدد",
    niveau_2: rawData.niveau_2 || "غير محدد",
    niveau_3: rawData.niveau_3 || "غير محدد",
    niveau_4: rawData.niveau_4 || "غير محدد",
    navigante: rawData.navigante ?? false,
    unite_categorie: rawData.unite_categorie || "غير محدد",
    unite_rang: rawData.unite_rang || 999,
    unite_batiment: rawData.unite_batiment || "غير محدد",
    unite_adresse: rawData.unite_adresse || "غير محدد",
    unite_port: rawData.unite_port || "غير محدد",
    unite_gps: rawData.unite_gps || [],
    unite_telephone1: rawData.unite_telephone1 || "غير محدد",
    unite_telephone2: rawData.unite_telephone2 || "غير محدد",
    unite_telephone3: rawData.unite_telephone3 || "غير محدد",
    unite_indicatif: rawData.unite_indicatif || "غير محدد",
    unite_email: rawData.unite_email || "غير محدد",
    unite_description: rawData.unite_description || "لا يوجد وصف متاح",
    unite_responsable: rawData.unite_responsable || null,
    responsable_nom: responsableNom,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at
  }
}

// Requête SELECT pour récupérer les unités
export const UNITE_SELECT_QUERY = `
  id,
  created_at,
  unite,
  unite_matricule,
  unite_type,
  niveau_1,
  niveau_2,
  niveau_3,
  niveau_4,
  updated_at,
  navigante,
  unite_categorie,
  unite_rang,
  unite_batiment,
  unite_adresse,
  unite_port,
  unite_gps,
  unite_telephone1,
  unite_telephone2,
  unite_telephone3,
  unite_indicatif,
  unite_email,
  unite_description,
  unite_responsable
`

// Fonction pour convertir les coordonnées décimales en degrés, minutes, secondes
export const convertDecimalToDMS = (decimal: number): string => {
  const degrees = Math.floor(Math.abs(decimal))
  const minutesFloat = (Math.abs(decimal) - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = Math.floor((minutesFloat - minutes) * 60)
  
  // Forcer l'affichage sur 2 chiffres
  const degreesStr = degrees.toString().padStart(2, '0')
  const minutesStr = minutes.toString().padStart(2, '0')
  const secondsStr = seconds.toString().padStart(2, '0')
  
  return `${degreesStr}° ${minutesStr}' ${secondsStr}"`
}

// Fonction pour formater les coordonnées GPS
export const formatGPSCoordinates = (gpsArray: string[]): string => {
  if (!gpsArray || gpsArray.length < 2) {
    return "Coordonnées GPS: Coordonnées non définies"
  }
  
  const latitude = parseFloat(gpsArray[0])
  const longitude = parseFloat(gpsArray[1])
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return "Coordonnées GPS: Coordonnées invalides"
  }
  
  const latDMS = convertDecimalToDMS(latitude)
  const lonDMS = convertDecimalToDMS(longitude)
  
  return `Coordonnées GPS: ${latDMS} - ${lonDMS}`
}

// Fonction pour formater un numéro de téléphone au format XX XXX XXX
export const formatPhoneNumber = (phone: string): string => {
  // Supprimer tous les espaces et caractères non numériques
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Si le numéro fait 8 chiffres (format tunisien)
  if (cleanPhone.length === 8) {
    return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 5)} ${cleanPhone.slice(5, 8)}`
  }
  
  // Sinon retourner tel quel
  return phone
}

// Fonction pour formater les téléphones d'une unité
export const formatUnitePhones = (phone1: string, phone2: string, phone3: string): string => {
  // Collecter les téléphones valides (non vides et non "Non défini")
  const validPhones = [phone1, phone2, phone3]
    .filter(phone => phone && phone !== "Non défini" && phone.trim() !== "")
    .map(phone => formatPhoneNumber(phone))
  
  // Si aucun téléphone valide
  if (validPhones.length === 0) {
    return "Téléphone: Non Fournie"
  }
  
  // Si un seul téléphone
  if (validPhones.length === 1) {
    return `Téléphone: ${validPhones[0]}`
  }
  
  // Si plusieurs téléphones
  return `Téléphone: ${validPhones.join(' -- ')}`
}

