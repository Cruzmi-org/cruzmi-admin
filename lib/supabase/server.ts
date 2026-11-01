import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client bound to the visitor's session (anon key + auth cookies).
 * Used ONLY for authentication (sign in, sign out, reading the current user).
 * Data access goes through getAdminDb() in lib/supabase/admin.ts.
 */
export async function createSessionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // The middleware refreshes the session, so this can be ignored.
          }
        },
      },
    }
  )
}
