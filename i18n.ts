import {getRequestConfig} from 'next-intl/server';
 
export const locales = ['fr', 'ar'] as const;
export const defaultLocale = 'fr' as const;
 
export default getRequestConfig(async ({requestLocale}) => {
  // Cette fonction est appelée avec le locale résolu par le middleware
  let locale = await requestLocale;
  
  // Vérifier que le locale est supporté
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});