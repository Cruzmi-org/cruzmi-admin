import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSessionClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admins'

/**
 * Returns the signed-in super-admin, or redirects to /login.
 * getUser() validates the token with Supabase Auth (unlike getSession(),
 * which only decodes the cookie). Cached per request.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createSessionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!isAdminEmail(user.email)) redirect('/logout?error=forbidden')

  return user
})
