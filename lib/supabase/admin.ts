import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Supabase client with the service_role key: bypasses RLS and sees ALL data.
 *
 * Security rules:
 * - Server-only (enforced by the 'server-only' import).
 * - The ONLY way to get it is getAdminDb(), which first checks that the
 *   visitor is a whitelisted super-admin. Never export the raw client.
 */
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service configuration is missing')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getAdminDb() {
  await requireAdmin()
  return createServiceClient()
}
