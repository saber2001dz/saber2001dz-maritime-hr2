import { createBrowserClient } from "@supabase/ssr"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

let clientInstance: ReturnType<typeof createBrowserClient> | null = null
let authListenerUnsubscribe: (() => void) | null = null

export function createClient() {
  // Singleton pattern pour éviter les multiples instances
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Configuration Realtime synchrone améliorée
  if (typeof window !== "undefined") {
    const initializeRealtime = async () => {
      try {
        const { data: { session } } = await clientInstance!.auth.getSession()
        if (session?.access_token) {
          await clientInstance!.realtime.setAuth(session.access_token)
        }
      } catch (error) {
        console.warn('Failed to initialize Realtime auth:', error)
      }
    }

    // Initialisation immédiate
    initializeRealtime()

    // Nettoyer l'ancien listener s'il existe
    if (authListenerUnsubscribe) {
      authListenerUnsubscribe()
      authListenerUnsubscribe = null
    }

    // Mise à jour lors des changements d'auth avec gestion du cleanup
    const authStateHandler = async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        try {
          await clientInstance!.realtime.setAuth(session.access_token)
        } catch (error) {
          console.warn('Failed to update Realtime auth:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        try {
          await clientInstance!.realtime.setAuth(null)
        } catch (error) {
          console.warn('Failed to clear Realtime auth:', error)
        }
      }
    }

    const { data: { subscription } } = clientInstance.auth.onAuthStateChange(authStateHandler)
    
    // Stocker la fonction de nettoyage
    authListenerUnsubscribe = () => {
      subscription?.unsubscribe()
    }
  }

  return clientInstance
}

// Fonction de nettoyage pour les cas edge ou les hot reloads en développement
export function cleanupClient() {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe()
    authListenerUnsubscribe = null
  }
  
  if (clientInstance) {
    // Fermer les connexions realtime
    clientInstance.realtime.disconnect()
  }
  
  clientInstance = null
}

// Auto-cleanup en développement lors du hot reload
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // @ts-expect-error - Window global augmentation for development cleanup
  if (window.__supabaseClientCleanup) {
    // @ts-expect-error - Window global augmentation for development cleanup
    window.__supabaseClientCleanup()
  }
  
  // @ts-expect-error - Window global augmentation for development cleanup
  window.__supabaseClientCleanup = cleanupClient
}