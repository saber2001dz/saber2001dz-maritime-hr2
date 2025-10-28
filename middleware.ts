import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'

const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar'],
  defaultLocale: 'ar',
  localeDetection: false // Désactiver la détection automatique de la locale basée sur le navigateur
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Force login page to always use /fr/auth/login
  if (pathname === '/auth/login' || pathname === '/ar/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/fr/auth/login'
    return NextResponse.redirect(url)
  }

  // First handle internationalization
  const intlResponse = intlMiddleware(request)
  
  // If intl middleware redirects, return it immediately
  if (intlResponse.status === 302 || intlResponse.status === 307) {
    return intlResponse
  }
  
  // Then handle Supabase session with the intl-processed request
  const sessionResponse = await updateSession(request)
  
  // Return the session response (which may be the original response or a redirect)
  return sessionResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|xml|txt)$).*)',
  ],
}