import { NextResponse, type NextRequest } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admins'

/**
 * OAuth (Google) return URL: exchanges the PKCE code for a session, then
 * applies the super-admin whitelist. Non-whitelisted accounts are signed out
 * immediately.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const loginUrl = new URL('/login', request.url)

  if (!code) {
    loginUrl.searchParams.set('error', 'oauth')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    loginUrl.searchParams.set('error', 'oauth')
    return NextResponse.redirect(loginUrl)
  }

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut()
    loginUrl.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL('/', request.url))
}
