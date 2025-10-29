import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Sign out on the server side
  await supabase.auth.signOut()

  // Create response that redirects to login
  const redirectUrl = new URL('/fr/auth/login', request.url)
  const response = NextResponse.redirect(redirectUrl)

  // Clear all auth cookies explicitly
  response.cookies.delete('sb-gvhhuosgnhjmwivavwfp-auth-token')
  response.cookies.delete('sb-gvhhuosgnhjmwivavwfp-auth-token-code-verifier')

  // Set cache headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
