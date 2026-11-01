'use server'

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
