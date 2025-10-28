import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache in-memory pour éviter les appels répétés à Supabase
const authCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_DURATION = 60 * 1000 // Augmenté à 60 secondes pour de meilleures performances

// Fonction pour extraire une clé de cache unique basée sur les tokens
function getCacheKey(request: NextRequest): string {
  const accessToken = request.cookies.get('sb-gvhhuosgnhjmwivavwfp-auth-token')?.value
  const refreshToken = request.cookies.get('sb-gvhhuosgnhjmwivavwfp-auth-token-code-verifier')?.value
  return `${accessToken || 'no-access'}-${refreshToken || 'no-refresh'}`
}

// Fonction pour vérifier si le cache est encore valide
function isValidCache(cacheEntry: { user: any; timestamp: number }): boolean {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Optimisation 1: Skip auth check pour les assets statiques
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') // fichiers avec extension
  ) {
    return NextResponse.next({ request })
  }

  // Optimisation 2: Pages publiques qui n'ont pas besoin d'auth
  const publicPaths = ['/login', '/auth', '/signup', '/reset-password']
  const isPublicPath = publicPaths.some(path => pathname.includes(path))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Optimisation 3: Utiliser le cache pour éviter les appels répétés
  const cacheKey = getCacheKey(request)
  const cachedAuth = authCache.get(cacheKey)

  let user = null

  if (cachedAuth && isValidCache(cachedAuth)) {
    // Utiliser la version en cache
    user = cachedAuth.user
  } else {
    // Faire l'appel à Supabase uniquement si nécessaire
    try {
      const { data, error } = await supabase.auth.getUser()
      user = error ? null : data.user

      // Mettre en cache le résultat
      authCache.set(cacheKey, {
        user,
        timestamp: Date.now()
      })

      // Nettoyer le cache périodiquement (garder seulement les 200 dernières entrées)
      if (authCache.size > 200) {
        const entries = Array.from(authCache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        entries.slice(0, 100).forEach(([key]) => authCache.delete(key))
      }
    } catch (error) {
      console.error('Auth error in middleware:', error)
      user = null
    }
  }

  // Extract locale from pathname, default to 'ar'
  const localeMatch = pathname.match(/^\/([^\/]+)/)
  const locale = localeMatch && ['fr', 'ar'].includes(localeMatch[1]) ? localeMatch[1] : 'ar'

  // Optimisation 4: Logique de redirection simplifiée avec locale
  if (!user && !isPublicPath && pathname.includes('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/auth/login`
    return NextResponse.redirect(url)
  }

  // Optimisation 5: Si utilisateur connecté et sur page auth, rediriger vers dashboard
  if (user && isPublicPath && pathname !== `/${locale}/auth/logout`) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}