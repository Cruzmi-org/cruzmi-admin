import type { NextRequest } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admins'
import { relativeRedirect } from '@/lib/http'

/**
 * OAuth (Google) return URL: exchanges the PKCE code for a session, then
 * applies the super-admin whitelist. Non-whitelisted accounts are signed out
 * immediately.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return relativeRedirect('/login?error=oauth')

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) return relativeRedirect('/login?error=oauth')

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut()
    return relativeRedirect('/login?error=forbidden')
  }

  return relativeRedirect('/')
}
