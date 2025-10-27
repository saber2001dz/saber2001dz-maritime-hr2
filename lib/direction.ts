import type { Locale } from './types';

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getFont(locale: Locale): string {
  return locale === 'ar' ? 'font-poppins' : 'font-geist-sans';
}

export function getTitleFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic font-medium' : 'font-medium';
}

export function getMainTitleFont(locale: Locale): string {
  return locale === 'ar' ? 'font-jazeera-bold' : 'font-medium';
}

export function getCardTitleFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic text-[18px] text-gray-700 dark:text-gray-300' : 'text-[18px] text-gray-700 dark:text-gray-300';
}

export function getSelectFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic font-medium text-sm' : 'font-medium text-sm';
}

export function getCardFooterFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic' : '';
}

export function getCardSubtitleFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic' : '';
}

export function getTableCellFont(locale: Locale): string {
  return locale === 'ar' ? 'font-jazeera-bold text-sm' : '';
}

export function getTableCellNotoFont(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic' : '';
}

export function getTableCellPoppinsFont(locale: Locale): string {
  return locale === 'ar' ? 'font-poppins' : '';
}

export function getJazzeraFontDetailsEmployee(locale: Locale): string {
  return locale === 'ar' ? 'font-jazeera-bold' : '';
}

export function getNotoFontSelect(locale: Locale): string {
  return locale === 'ar' ? 'font-noto-naskh-arabic' : '';
}

export function getGeistFont(locale: Locale): string {
  return locale === 'ar' ? 'font-geist-sans' : '';
}
