import 'server-only'
import { getAdminDb } from '@/lib/supabase/admin'
import { countBy, fetchAllAuthUsers, fetchAllRows } from '@/lib/queries/shared'
import { fullName } from '@/lib/format'

export type AccountRow = {
  id: string
  email: string
  name: string
  createdAt: string
  confirmed: boolean
  lastSignInAt: string | null
  providers: string[]
  tripsCreated: number
  tripsJoined: number
  hasProfile: boolean
}

type ProfileRow = { id: string; firstname: string | null; lastname: string | null }
type TripRow = { id: string; created_by: string | null; deleted_at: string | null }
type MembershipRow = { id: string; account_id: string | null; status: string | null }

export async function getAccounts(): Promise<AccountRow[]> {
  const db = await getAdminDb()

  const [users, profiles, trips, memberships] = await Promise.all([
    fetchAllAuthUsers(db),
    fetchAllRows<ProfileRow>(db, 'profiles', 'id, firstname, lastname'),
    fetchAllRows<TripRow>(db, 'trips', 'id, created_by, deleted_at'),
    fetchAllRows<MembershipRow>(db, 'trip_memberships', 'id, account_id, status'),
  ])

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const createdCount = countBy(
    trips.filter((t) => !t.deleted_at),
    (t) => t.created_by
  )
  const joinedCount = countBy(
    memberships.filter((m) => m.status === 'accepted'),
    (m) => m.account_id
  )

  return users.map((user) => {
    const profile = profileById.get(user.id)
    const providers = (user.app_metadata?.providers as string[] | undefined) ??
      (user.app_metadata?.provider ? [user.app_metadata.provider as string] : [])

    return {
      id: user.id,
      email: user.email ?? user.phone ?? '—',
      name: fullName(profile?.firstname, profile?.lastname),
      createdAt: user.created_at,
      confirmed: Boolean(user.email_confirmed_at || user.phone_confirmed_at),
      lastSignInAt: user.last_sign_in_at ?? null,
      providers,
      tripsCreated: createdCount.get(user.id) ?? 0,
      tripsJoined: joinedCount.get(user.id) ?? 0,
      hasProfile: Boolean(profile),
    }
  })
}
