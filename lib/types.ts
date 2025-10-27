export type Locale = 'fr' | 'ar';

// Type pour les fonctions de traduction next-intl
export interface TranslationFunction {
  (key: string): string;
  (key: string, values: Record<string, any>): string;
}

// Type pour l'objet de traductions sérialisable
export type TranslationsObject = Record<string, string>;