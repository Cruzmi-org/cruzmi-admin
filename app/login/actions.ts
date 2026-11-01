'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSessionClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admins'

export type SignInState = { error: string | null }

const GENERIC_ERROR = 'Email ou mot de passe incorrect, ou accès non autorisé.'

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Renseignez votre email et votre mot de passe.' }

  // Refuse non-whitelisted emails before even contacting Supabase Auth.
  // Same message as a wrong password, so the whitelist cannot be probed.
  if (!isAdminEmail(email)) return { error: GENERIC_ERROR }

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) return { error: GENERIC_ERROR }

  // Defense in depth: re-check the email Supabase actually authenticated.
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut()
    return { error: GENERIC_ERROR }
  }

  redirect('/')
}

/**
 * Starts the Google OAuth flow (PKCE: the code verifier is stored in a cookie
 * by the server client). The whitelist is checked on return, in /auth/callback.
 */
export async function signInWithGoogle(): Promise<void> {
  const origin = (await headers()).get('origin')
  if (!origin) redirect('/login?error=oauth')

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect('/login?error=oauth')
  redirect(data.url)
}
