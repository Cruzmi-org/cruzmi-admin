import type { NextRequest } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'
import { relativeRedirect } from '@/lib/http'

/**
 * Signs the visitor out and returns to /login.
 * Also used by requireAdmin() for signed-in users who are not on the whitelist
 * (?error=forbidden), so their useless session does not linger.
 */
async function handle(request: NextRequest) {
  const supabase = await createSessionClient()
  await supabase.auth.signOut()

  const forbidden = request.nextUrl.searchParams.get('error') === 'forbidden'
  return relativeRedirect(forbidden ? '/login?error=forbidden' : '/login')
}

export const GET = handle
export const POST = handle
