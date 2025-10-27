// lib/schemas.ts
import { z } from 'zod';

// Extraire les valeurs des options pour les schemas Zod
const grades = [
  "Colonel Major", "Colonel", "Lieutenant-Colonel", "Commandant", "Capitaine", 
  "Lieutenant", "Sous-Lieutenant", "Adjudant Chef", "Adjudant", "Sergent Chef", 
  "Sergent", "Caporal Chef", "Caporal"
] as const;

const sexes = ["ذكر", "أنثى"] as const;
const etatsCivils = ["Célibataire", "Marié", "Divorcé", "Veuf"] as const;
const gouvernorats = [
  "تونس", "أريانة", "بن عروس", "منوبة", "نابل", "زغوان", "بنزرت",
  "باجة", "جندوبة", "الكاف", "سليانة", "سوسة", "المنستير", "المهدية", "صفاقس",
  "القيروان", "القصرين", "سيدي بوزيد", "قابس", "مدنين", "تطاوين",
  "قفصة", "توزر", "قبلي"
] as const;

const statusOptions = [
  "مباشر", "غير مباشر", "إجازة", "مرض", "تكوين", "في مهمة", "متغيب"
] as const;

export const agentSchema = z.object({
  // Étape 1: Données Basiques
  prenom: z.string().min(1, "Le prénom est requis."),
  prenomPere: z.string().optional().or(z.literal('')), 
  prenomGrandPere: z.string().optional().or(z.literal('')),
  mere: z.string().optional().or(z.literal('')),
  nom: z.string().min(1, "Le nom est requis."),
  matricule: z.string().min(1, "Le matricule est requis."),
  dateNaissance: z.string().min(1, "La date de naissance est requise."), 
  lieuNaissance: z.string().optional().or(z.literal('')), 
  sexe: z.enum(sexes, { errorMap: () => ({ message: "Le sexe est requis." }) }),
  actif: z.enum(statusOptions, { errorMap: () => ({ message: "Statut non valide." }) }).default("مباشر"),
  isPrivate: z.boolean().default(false),
  photo: z.instanceof(File).optional()
         .refine(file => !file || file.size <= 5 * 1024 * 1024, `L'image doit faire moins de 5MB.`)
         .refine(file => !file || ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type), ".jpg, .jpeg, .png, .webp ou .gif uniquement."),


  // Étape 2: Données Familiales
  matriculemutuel: z.string().optional().or(z.literal('')),
  identiteConjoint: z.string().optional().or(z.literal('')), 
  travailConjoint: z.string().optional().or(z.literal('')), 
  nombreEnfants: z.coerce.number().int().min(0).optional(),
   

  // Étape 3: Données Professionnelles
  identifiantUnique: z.string().optional().or(z.literal('')),
  cin: z.string().optional().or(z.literal('')),
  passeport: z.string().optional().or(z.literal('')),
  dateRecrutement: z.string().optional().or(z.literal('')),

  // Étape 4: Coordonnées Personnelles
  adresse: z.string().optional().or(z.literal('')),
  gouvernorat: z.enum(gouvernorats, {
  errorMap: () => ({ message: "Gouvernorat non valide." }),
}).optional().or(z.literal("")),

  adresse_actuelle: z.string().optional().or(z.literal('')),
  gouvernorat_actuel: z.enum(gouvernorats, {
  errorMap: () => ({ message: "Gouvernorat non valide." }),
}).optional().or(z.literal("")),

  telephoneMobile: z.string()
  .optional()
  .or(z.literal(""))
  .refine(val => !val || val.replace(/\D/g, "").length === 8, {
    message: "Doit contenir exactement 8 chiffres ou être vide"
  }),
  whatsapp: z.string()
    .refine(val => !val || val.replace(/\D/g, "").length === 0 || val.replace(/\D/g, "").length === 8, {
      message: "Doit contenir 8 chiffres ou être vide"
    })
    .optional()
    .or(z.literal("")),
  emailPersonnel: z.string().optional().or(z.literal('')),
});

export type AgentSchemaType = z.infer<typeof agentSchema>;

// Export the status options for use in components
export { statusOptions };