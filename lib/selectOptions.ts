export interface SelectOption {
  value: string;
  label: string;
  labelAr?: string; // Label arabe optionnel
}

// Fonction utilitaire pour obtenir les options traduites
export const getTranslatedOptions = (options: SelectOption[], isRTL: boolean): SelectOption[] => {
  return options.map(option => ({
    ...option,
    label: isRTL && option.labelAr ? option.labelAr : option.label
  }));
};

// Options communes pour les informations personnelles
export const genderOptions: SelectOption[] = [
  { value: "ذكر", label: "Masculin", labelAr: "ذكر" },
  { value: "أنثى", label: "Féminin", labelAr: "أنثى" },
];

// Options pour le statut marital selon le genre
export const getEtatCivilOptions = (gender?: string): SelectOption[] => {
  const isFeminine = gender === "Féminin";
  
  return [
    { value: "Célibataire", label: "Célibataire" },
    { value: isFeminine ? "Mariée" : "Marié", label: isFeminine ? "Mariée" : "Marié" },
    { value: isFeminine ? "Divorcée" : "Divorcé", label: isFeminine ? "Divorcée" : "Divorcé" },
    { value: isFeminine ? "Veuve" : "Veuf", label: isFeminine ? "Veuve" : "Veuf" },
  ];
};

// Options par défaut (masculin) pour compatibilité
export const etatCivilOptions: SelectOption[] = [
  { value: "Célibataire", label: "Célibataire" },
  { value: "Marié", label: "Marié" },
  { value: "Divorcé", label: "Divorcé" },
  { value: "Veuf", label: "Veuf" },
];

export const groupeSanguinOptions: SelectOption[] = [
  { value: "A+", label: "A+", labelAr: "A+" },
  { value: "A-", label: "A-", labelAr: "A-" },
  { value: "B+", label: "B+", labelAr: "B+" },
  { value: "B-", label: "B-", labelAr: "B-" },
  { value: "AB+", label: "AB+", labelAr: "AB+" },
  { value: "AB-", label: "AB-", labelAr: "AB-" },
  { value: "O+", label: "O+", labelAr: "O+" },
  { value: "O-", label: "O-", labelAr: "O-" },
];

export const gouvernoratOptions: SelectOption[] = [
  { value: "تونس", label: "Tunis", labelAr: "تونس" },
  { value: "أريانة", label: "Ariana", labelAr: "أريانة" },
  { value: "بن عروس", label: "Ben Arous", labelAr: "بن عروس" },
  { value: "منوبة", label: "Manouba", labelAr: "منوبة" },
  { value: "نابل", label: "Nabeul", labelAr: "نابل" },
  { value: "زغوان", label: "Zaghouan", labelAr: "زغوان" },
  { value: "بنزرت", label: "Bizerte", labelAr: "بنزرت" },
  { value: "باجة", label: "Béja", labelAr: "باجة" },
  { value: "جندوبة", label: "Jendouba", labelAr: "جندوبة" },
  { value: "الكاف", label: "Kef", labelAr: "الكاف" },
  { value: "سليانة", label: "Siliana", labelAr: "سليانة" },
  { value: "سوسة", label: "Sousse", labelAr: "سوسة" },
  { value: "المنستير", label: "Monastir", labelAr: "المنستير" },
  { value: "المهدية", label: "Mahdia", labelAr: "المهدية" },
  { value: "صفاقس", label: "Sfax", labelAr: "صفاقس" },
  { value: "القيروان", label: "Kairouan", labelAr: "القيروان" },
  { value: "القصرين", label: "Kasserine", labelAr: "القصرين" },
  { value: "سيدي بوزيد", label: "Sidi Bouzid", labelAr: "سيدي بوزيد" },
  { value: "قابس", label: "Gabès", labelAr: "قابس" },
  { value: "مدنين", label: "Médenine", labelAr: "مدنين" },
  { value: "تطاوين", label: "Tataouine", labelAr: "تطاوين" },
  { value: "قفصة", label: "Gafsa", labelAr: "قفصة" },
  { value: "توزر", label: "Tozeur", labelAr: "توزر" },
  { value: "قبلي", label: "Kébili", labelAr: "قبلي" },
];

// Options pour les informations professionnelles
export const gradeOptions: SelectOption[] = [
  { value: "عميد", label: "عـمـيـــد" },
  { value: "عقيد", label: "عـقيــــد" },
  { value: "مقدم", label: "مقــــدم" },
  { value: "رائد", label: "رائــــد" },
  { value: "نقيب", label: "نقيـــب" },
  { value: "ملازم أول", label: "مـلازم أول" },
  { value: "ملازم", label: "مـلازم" },
  { value: "وكيل أول", label: "وكيــل أول" },
  { value: "وكيل", label: "وكيــل" },
  { value: "رقيب أول", label: "رقيــب أول" },
  { value: "رقيب", label: "رقيــب" },
  { value: "عريف أول", label: "عـريـف أول" },
  { value: "عريف", label: "عـريـف" },
  { value: "حرس", label: "حـــرس" },
];

export const fonctionOptions: SelectOption[] = [
  { value: "Directeur", label: "Directeur" },
  { value: "Sous-Directeur", label: "Sous-Directeur" },
  { value: "Chef de Service", label: "Chef de Service" },
  { value: "Chef de Section", label: "Chef de Section" },
  { value: "Chef de Bureau", label: "Chef de Bureau" },
  { value: "Agent", label: "Agent" },
];

export const banqueOptions: SelectOption[] = [
  { value: "Banque Nationale Agricole", label: "Banque Nationale Agricole" },
  { value: "Banque Internationale Arabe de Tunisie", label: "Banque Internationale Arabe de Tunisie" },
  { value: "Société Tunisienne de Banque", label: "Société Tunisienne de Banque" },
  { value: "Banque de Tunisie", label: "Banque de Tunisie" },
  { value: "Attijari Bank", label: "Attijari Bank" },
];

// Options pour les informations familiales - forme générique (valeurs en arabe)
export const etatCivilFamilyOptions: SelectOption[] = [
  { value: "أعزب", label: "Célibataire", labelAr: "أعزب" },
  { value: "متزوج", label: "Marié(e)", labelAr: "متزوج" },
  { value: "مطلق", label: "Divorcé(e)", labelAr: "مطلق" },
  { value: "أرمل", label: "Veuf/Veuve", labelAr: "أرمل" },
];

// Fonction pour obtenir le libellé correct selon le genre
export const getMaritalStatusLabel = (status: string, gender?: string): string => {
  const isFeminine = gender === "Féminin";
  const normalizedStatus = status?.toLowerCase().replace(/é/g, "e");
  
  switch (normalizedStatus) {
    case "marie":
    case "mariee":
      return isFeminine ? "Mariée" : "Marié";
    case "divorce":
    case "divorcee":
      return isFeminine ? "Divorcée" : "Divorcé";
    case "veuf":
    case "veuve":
      return isFeminine ? "Veuve" : "Veuf";
    case "celibataire":
      return "Célibataire";
    default:
      // Capitaliser la première lettre si nécessaire
      if (status && status.length > 0) {
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
      return "Non défini";
  }
};

// Fonction pour formater le statut marital avec la date
export const formatMaritalStatusWithDate = (status: string, gender?: string, date?: string): string => {
  if (!status) return "غير محدد";
  
  if (!date) return status;
  
  const year = new Date(date).getFullYear();
  
  // Gérer les valeurs arabes directement de la base de données
  switch (status) {
    case "متزوج":
    case "متزوجة":
      return `${status} (منذ ${year})`;
    case "مطلق":
    case "مطلقة":
      return `${status} (منذ ${year})`;
    case "أرمل":
    case "أرملة":
      return `${status} (منذ ${year})`;
    case "أعزب":
    case "عزباء":
      return status; // Pas de date pour célibataire
    default:
      // Fallback pour les anciennes valeurs françaises si elles existent encore
      const baseLabel = getMaritalStatusLabel(status, gender);
      const normalizedStatus = status?.toLowerCase().replace(/é/g, "e");
      
      switch (normalizedStatus) {
        case "marie":
        case "mariee":
          return `${baseLabel} (depuis ${year})`;
        case "divorce":
        case "divorcee":
          return `${baseLabel} (depuis ${year})`;
        case "veuf":
        case "veuve":
          return `${baseLabel} (depuis ${year})`;
        default:
          return baseLabel;
      }
  }
};

export const sexeOptions: SelectOption[] = [
  { value: "masculin", label: "Masculin" },
  { value: "feminin", label: "Féminin" },
];

// Fonction utilitaire pour normaliser le genre
export const normalizeGender = (gender?: string): string => {
  if (!gender) return "Masculin";
  const normalized = gender.toLowerCase();
  return normalized === "feminin" || normalized === "féminin" || normalized === "f" || normalized === "أنثى" ? "Féminin" : "Masculin";
};

// Fonction pour convertir le statut marital selon le nouveau genre
export const convertMaritalStatusToGender = (currentStatus: string, newGender: string): string => {
  const normalizedGender = normalizeGender(newGender);
  return getMaritalStatusLabel(currentStatus, normalizedGender);
};

export const relationshipOptions: SelectOption[] = [
  { value: "conjoint", label: "Conjoint(e)" },
  { value: "pere", label: "Père" },
  { value: "mere", label: "Mère" },
  { value: "frere", label: "Frère" },
  { value: "soeur", label: "Sœur" },
  { value: "ami", label: "Ami(e)" },
  { value: "autre", label: "Autre" },
];

export const niveauScolaireOptions: SelectOption[] = [
  { value: "Maternelle", label: "Maternelle" },
  { value: "Primaire", label: "Primaire" },
  { value: "Collège", label: "Collège" },
  { value: "Lycée", label: "Lycée" },
  { value: "Supérieur", label: "Supérieur" },
  { value: "Non scolarisé", label: "Non scolarisé" },
];

// Options pour les formations
export const typeFormationOptions: SelectOption[] = [
  { value: "Formation Continue", label: "Formation Continue" },
  { value: "Spécialisation", label: "Spécialisation" },
  { value: "Certification", label: "Certification" },
  { value: "Stage", label: "Stage" },
];

export const typeEtablissementOptions: SelectOption[] = [
  { value: "Militaire", label: "Militaire" },
  { value: "Civil", label: "Civil" },
  { value: "Sécuritaire", label: "Sécuritaire" },
  { value: "Universitaire", label: "Universitaire" },
];

export const lieuOptions: SelectOption[] = [
  { value: "Tunisie", label: "Tunisie" },
  { value: "Étranger", label: "Étranger" },
];

export const statutOptions: SelectOption[] = [
  { value: "En cours", label: "En cours" },
  { value: "Terminé", label: "Terminé" },
  { value: "Suspendu", label: "Suspendu" },
  { value: "Annulé", label: "Annulé" },
];

export const niveauScolaireParcourOptions: SelectOption[] = [
  { value: "Primaire", label: "Primaire" },
  { value: "Secondaire", label: "Secondaire" },
  { value: "Baccalauréat", label: "Baccalauréat" },
  { value: "Licence", label: "Licence" },
  { value: "Master", label: "Master" },
  { value: "Doctorat", label: "Doctorat" },
];

// Options pour les sanctions et récompenses
export const sanctionOptions: SelectOption[] = [
  { value: "لفت نظر", label: "لفت نظر", labelAr: "لفت نظر" },
  { value: "إنذار", label: "إنذار", labelAr: "إنذار" },
  { value: "توبيخ", label: "توبيخ", labelAr: "توبيخ" },
  { value: "إيقاف بسيط", label: "إيقاف بسيط", labelAr: "إيقاف بسيط" },
  { value: "إيقاف شديد", label: "إيقاف شديد", labelAr: "إيقاف شديد" },
  { value: "إيقاف عن العمل", label: "إيقاف عن العمل", labelAr: "إيقاف عن العمل" },
  { value: "الحط من الرتبة", label: "الحط من الرتبة", labelAr: "الحط من الرتبة" },
  { value: "العزل", label: "العزل", labelAr: "العزل" },
];

export const recompenseOptions: SelectOption[] = [
  { value: "معلقة شرف", label: "معلقة شرف", labelAr: "معلقة شرف" },
  { value: "شهادة رضا", label: "شهادة رضا", labelAr: "شهادة رضا" },
  { value: "رسالة تشجيع", label: "رسالة تشجيع", labelAr: "رسالة تشجيع" },
  { value: "رسالة استحسان", label: "رسالة استحسان", labelAr: "رسالة استحسان" },
];

// Options pour les congés (basées sur l'ENUM type_conge_enum de la base de données)
export const congeOptions: SelectOption[] = [
  { value: "سنوية", label: "Annuel", labelAr: "سنوية" },
  { value: "طارئة", label: "Exceptionnel", labelAr: "طارئة" },
  { value: "مرض", label: "Maladie", labelAr: "مرض" },
  { value: "زواج", label: "Mariage", labelAr: "زواج" },
  { value: "أمومة", label: "Maternité", labelAr: "أمومة" },
  { value: "بدون راتب", label: "Sans Solde", labelAr: "بدون راتب" },
  { value: "إجازة تقاعد", label: "Retraite", labelAr: "إجازة تقاعد" },
];

// Fonction pour obtenir les options de congés filtrées selon le genre
export const getCongeOptions = (gender?: string): SelectOption[] => {
  const normalizedGender = normalizeGender(gender);
  
  // Filtrer "Maternité" pour les employés masculins
  if (normalizedGender === "Masculin") {
    return congeOptions.filter(option => option.value !== "أمومة");
  }
  
  return congeOptions;
};

export const statutCongeOptions: SelectOption[] = [
  { value: "قيد التنفيذ", label: "En cours", labelAr: "قيد التنفيذ" },
  { value: "منتهية", label: "Terminé", labelAr: "منتهية" },
];

// Options pour les directions (niveau_1_enum)
export const directionValues: string[] = [
  "إدارة حرس السواحل",
  "إقليم الحرس البحري بالشمال",
  "إفليم الحرس البحري بالساحل",
  "إقليم الحرس البحري بالوسط",
  "إفليم الحرس البحري بالجنوب"
];

// Options pour le statut des employés (basées sur l'ENUM employee_status de la base de données)
export const employeeStatusOptions: SelectOption[] = [
  { value: "مباشر", label: "مباشر" },
  { value: "غير مباشر", label: "غير مباشر" },
  { value: "إجازة", label: "إجازة" },
  { value: "مرض", label: "مرض" },
  { value: "تدريب", label: "تدريب" },
  { value: "مهمة", label: "مهمة" },
  { value: "متغيب", label: "متغيب" },
  { value: "موقوف", label: "موقوف" },
];

// Fonction pour obtenir le label formaté d'un grade à partir de sa valeur
export const getGradeLabel = (gradeValue?: string): string => {
  if (!gradeValue) return '';
  const grade = gradeOptions.find(option => option.value === gradeValue);
  return grade?.label || gradeValue; // Fallback sur la valeur si pas de correspondance
};

// Fonction pour calculer automatiquement le statut d'un congé
export const getAutomaticLeaveStatus = (dateDebut?: string, dateFin?: string): string => {
  if (!dateDebut || !dateFin) return "منتهية";
  
  const today = new Date();
  const startDate = new Date(dateDebut);
  const endDate = new Date(dateFin);
  
  // Normaliser les dates à 00:00:00 pour la comparaison
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  if (today <= endDate && today >= startDate) {
    return "قيد التنفيذ";
  } else {
    return "منتهية"; // Le congé est terminé ou n'a pas encore commencé
  }
};

// Fonction pour obtenir le statut traduit selon la langue
export const getTranslatedLeaveStatus = (status: string, isRTL: boolean): string => {
  const statusOption = statutCongeOptions.find(option => option.value === status);
  return statusOption 
    ? (isRTL && statusOption.labelAr ? statusOption.labelAr : statusOption.label)
    : status;
};