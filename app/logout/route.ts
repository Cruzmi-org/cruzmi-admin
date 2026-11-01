import { NextResponse, type NextRequest } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'

/**
 * Signs the visitor out and returns to /login.
 * Also used by requireAdmin() for signed-in users who are not on the whitelist
 * (?error=forbidden), so their useless session does not linger.
 */
async function handle(request: NextRequest) {
  const supabase = await createSessionClient()
  await supabase.auth.signOut()

  const target = new URL('/login', request.url)
  if (request.nextUrl.searchParams.get('error') === 'forbidden') {
    target.searchParams.set('error', 'forbidden')
  }
  return NextResponse.redirect(target, { status: 303 })
}

export const GET = handle
export const POST = handle
