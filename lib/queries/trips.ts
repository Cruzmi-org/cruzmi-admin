import 'server-only'
import { getAdminDb } from '@/lib/supabase/admin'
import { countBy, fetchAllAuthUsers, fetchAllRows } from '@/lib/queries/shared'
import { fullName } from '@/lib/format'

export type TripRow = {
  id: string
  name: string
  creatorEmail: string
  creatorName: string
  clientName: string
  createdAt: string | null
  startDate: string | null
  endDate: string | null
  deletedAt: string | null
  isHidden: boolean
  participants: number
  pendingInvitations: number
  medias: number
  expenses: number
  suggestions: number
  activities: number
}

type RawTrip = {
  id: string
  name: string
  created_by: string | null
  created_at: string | null
  start_date: string | null
  end_date: string | null
  deleted_at: string | null
  is_hidden: boolean
  poi_ids: string[] | null
  client_first_name: string | null
  client_last_name: string | null
}
type TripIdRow = { id: string; trip_id: string | null }
type MembershipRow = { id: string; trip_id: string; status: string | null }
type ProfileRow = { id: string; firstname: string | null; lastname: string | null }

export async function getTrips(): Promise<TripRow[]> {
  const db = await getAdminDb()

  const [trips, users, profiles, memberships, medias, expenses, activities] = await Promise.all([
    fetchAllRows<RawTrip>(
      db,
      'trips',
      'id, name, created_by, created_at, start_date, end_date, deleted_at, is_hidden, poi_ids, client_first_name, client_last_name'
    ),
    fetchAllAuthUsers(db),
    fetchAllRows<ProfileRow>(db, 'profiles', 'id, firstname, lastname'),
    fetchAllRows<MembershipRow>(db, 'trip_memberships', 'id, trip_id, status'),
    fetchAllRows<TripIdRow>(db, 'medias', 'id, trip_id'),
    fetchAllRows<TripIdRow>(db, 'expenses', 'id, trip_id'),
    fetchAllRows<TripIdRow>(db, 'schedule_items', 'id, trip_id'),
  ])

  const emailById = new Map(users.map((u) => [u.id, u.email ?? '']))
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const accepted = countBy(memberships.filter((m) => m.status === 'accepted'), (m) => m.trip_id)
  const pending = countBy(memberships.filter((m) => m.status === 'pending'), (m) => m.trip_id)
  const mediaCount = countBy(medias, (m) => m.trip_id)
  const expenseCount = countBy(expenses, (e) => e.trip_id)
  const activityCount = countBy(activities, (a) => a.trip_id)

  return trips.map((trip) => {
    const creator = trip.created_by ? profileById.get(trip.created_by) : undefined
    return {
      id: trip.id,
      name: trip.name,
      creatorEmail: (trip.created_by && emailById.get(trip.created_by)) || '—',
      creatorName: fullName(creator?.firstname, creator?.lastname),
      clientName: fullName(trip.client_first_name, trip.client_last_name),
      createdAt: trip.created_at,
      startDate: trip.start_date,
      endDate: trip.end_date,
      deletedAt: trip.deleted_at,
      isHidden: trip.is_hidden,
      participants: accepted.get(trip.id) ?? 0,
      pendingInvitations: pending.get(trip.id) ?? 0,
      medias: mediaCount.get(trip.id) ?? 0,
      expenses: expenseCount.get(trip.id) ?? 0,
      suggestions: trip.poi_ids?.length ?? 0,
      activities: activityCount.get(trip.id) ?? 0,
    }
  })
}
