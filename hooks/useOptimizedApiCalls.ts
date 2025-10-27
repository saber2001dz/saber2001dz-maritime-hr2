import { useCallback, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { isClient } from "@/utils/idUtils"

interface UseOptimizedApiCallsReturn {
  fetchBanquesList: () => Promise<{ banque_nom: string; banque_logo: string }[]>
  fetchUnitesList: () => Promise<{ id: string; unite: string; unite_categorie: string }[]>
  fetchResponsibilities: (uniteCategorie: string) => Promise<string[]>
  fetchAllListsParallel: () => Promise<{
    banques: { banque_nom: string; banque_logo: string }[]
    unites: { id: string; unite: string; unite_categorie: string }[]
  }>
  cancelAllRequests: () => void
}

// Cache simple pour éviter les appels répétés
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData<T>(key: string): T | null {
  // Skip cache during SSR to avoid hydration issues
  if (!isClient) return null
  
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any): void {
  // Only cache on client side
  if (isClient) {
    cache.set(key, { data, timestamp: Date.now() })
  }
}

// Fonction de retry avec backoff exponentiel
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Backoff exponentiel avec jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

export function useOptimizedApiCalls(): UseOptimizedApiCallsReturn {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())
  
  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort())
      abortControllersRef.current.clear()
    }
  }, [])

  const createAbortController = useCallback((key: string): AbortController => {
    // Annuler la requête précédente si elle existe
    const existingController = abortControllersRef.current.get(key)
    if (existingController) {
      existingController.abort()
    }
    
    const controller = new AbortController()
    abortControllersRef.current.set(key, controller)
    return controller
  }, [])

  const removeAbortController = useCallback((key: string) => {
    abortControllersRef.current.delete(key)
  }, [])

  const fetchBanquesList = useCallback(async (): Promise<{ banque_nom: string; banque_logo: string }[]> => {
    const cacheKey = "banques_list"
    
    // Vérifier le cache
    const cachedData = getCachedData<{ banque_nom: string; banque_logo: string }[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    const controller = createAbortController("fetchBanquesList")
    
    try {
      const result = await retryWithBackoff(async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("banque")
          .select("banque_nom, banque_logo")
          .order("banque_nom", { ascending: true })
          .abortSignal(controller.signal)

        if (error) throw error
        return data || []
      })

      setCachedData(cacheKey, result)
      return result
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch banques cancelled')
        return []
      }
      console.error("Erreur lors du chargement de la liste des banques:", error)
      throw error
    } finally {
      removeAbortController("fetchBanquesList")
    }
  }, [createAbortController, removeAbortController])

  const fetchUnitesList = useCallback(async (): Promise<{ id: string; unite: string; unite_categorie: string }[]> => {
    const cacheKey = "unites_list"
    
    // Vérifier le cache
    const cachedData = getCachedData<{ id: string; unite: string; unite_categorie: string }[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    const controller = createAbortController("fetchUnitesList")
    
    try {
      const result = await retryWithBackoff(async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("unite")
          .select("id, unite, unite_categorie")
          .order("unite", { ascending: true })
          .abortSignal(controller.signal)

        if (error) throw error
        return data || []
      })

      setCachedData(cacheKey, result)
      return result
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch unites cancelled')
        return []
      }
      console.error("Erreur lors du chargement de la liste des unités:", error)
      throw error
    } finally {
      removeAbortController("fetchUnitesList")
    }
  }, [createAbortController, removeAbortController])

  const fetchResponsibilities = useCallback(async (uniteCategorie: string): Promise<string[]> => {
    if (!uniteCategorie || uniteCategorie.trim() === '') return []
    
    const cacheKey = `responsibilities_${uniteCategorie}`
    
    // Vérifier le cache
    const cachedData = getCachedData<string[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }

    const controller = createAbortController("fetchResponsibilities")
    
    try {
      const result = await retryWithBackoff(async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("unite_category_responsibilities")
          .select("available_responsibilities")
          .eq("unite_categorie", uniteCategorie)
          .single()
          .abortSignal(controller.signal)

        if (error) throw error
        return data?.available_responsibilities || []
      })

      setCachedData(cacheKey, result)
      return result
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch responsibilities cancelled')
        return []
      }
      console.error("Erreur lors du chargement des responsabilités:", error)
      return []
    } finally {
      removeAbortController("fetchResponsibilities")
    }
  }, [createAbortController, removeAbortController])

  const fetchAllListsParallel = useCallback(async () => {
    try {
      // Exécuter les requêtes en parallèle
      const [banques, unites] = await Promise.all([
        fetchBanquesList(),
        fetchUnitesList()
      ])

      return { banques, unites }
    } catch (error) {
      console.error("Erreur lors du chargement parallèle des listes:", error)
      throw error
    }
  }, [fetchBanquesList, fetchUnitesList])

  const cancelAllRequests = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort())
    abortControllersRef.current.clear()
  }, [])

  return {
    fetchBanquesList,
    fetchUnitesList,
    fetchResponsibilities,
    fetchAllListsParallel,
    cancelAllRequests
  }
}