import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Create the next-intl middleware handler
const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Force login page to always use /fr/auth/login (LTR mode)
  if (pathname === '/auth/login' || pathname === '/ar/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/fr/auth/login'
    return NextResponse.redirect(url)
  }

  // First handle internationalization with next-intl
  const intlResponse = intlMiddleware(request)

  // If intl middleware redirects, return it immediately
  if (intlResponse.status === 302 || intlResponse.status === 307) {
    return intlResponse
  }

  // Then handle Supabase session authentication
  const sessionResponse = await updateSession(request)

  // Return the session response (which may be the original response or a redirect)
  return sessionResponse
}

export const config = {
  // Matcher configuration for Next.js 16 proxy
  // Excludes: API routes, Next.js internals, static files, and files with extensions
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|xml|txt)$).*)',
  ],
}