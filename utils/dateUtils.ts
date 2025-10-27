// Utility functions for date handling and calculations

/**
 * Format date for input field (YYYY-MM-DD)
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

/**
 * Calculate duration in days between two dates (inclusive)
 * Optimized version with proper error handling
 */
export const calculateDuration = (dateDebut: string, dateFin: string): number => {
  if (!dateDebut || !dateFin) return 0

  const debut = new Date(dateDebut)
  const fin = new Date(dateFin)

  // Validate dates
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0
  if (fin < debut) return 0

  // Calculate difference in days (inclusive)
  const diffTime = fin.getTime() - debut.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  return diffDays
}

/**
 * Format date for display in French locale
 */
export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return "Non définie"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "Non définie"
  return date.toLocaleDateString("fr-FR")
}

/**
 * Check if a date string is valid
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0]
}

/**
 * Compare two dates (returns -1, 0, or 1)
 */
export const compareDates = (date1: string, date2: string): number => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
  
  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

/**
 * Get the latest date from an array of date strings
 */
export const getLatestDate = (dates: string[]): string | null => {
  const validDates = dates.filter(isValidDate)
  if (validDates.length === 0) return null
  
  return validDates.reduce((latest, current) => 
    compareDates(current, latest) > 0 ? current : latest
  )
}

/**
 * Format date for RTL display (YYYY-MM-DD)
 */
export const formatDateForRTL = (dateStr: string): string => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  
  return date.toLocaleDateString("en-CA") // en-CA gives YYYY-MM-DD format
}

/**
 * Format date for LTR display (DD-MM-YYYY)
 */
export const formatDateForLTR = (dateStr: string): string => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return "-"
  
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit", 
    day: "2-digit",
  }).split("/").join("-")
}