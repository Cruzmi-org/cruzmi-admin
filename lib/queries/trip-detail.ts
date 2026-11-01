import 'server-only'
import { getAdminDb } from '@/lib/supabase/admin'
import { fullName } from '@/lib/format'

type Trip = {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  start_date: string | null
  end_date: string | null
  deleted_at: string | null
  is_hidden: boolean
  poi_ids: string[] | null
  client_first_name: string | null
  client_last_name: string | null
}

type Membership = {
  id: string
  account_id: string | null
  label: string | null
  role: string | null
  status: string | null
  invited_at: string | null
  joined_at: string | null
}

type Media = { id: string; file_size: number | null; created_at: string | null }
type Expense = {
  id: string
  title: string
  amount: number
  currency: string
  paid_by: string
  paid_at: string
}
type Activity = { id: string; title: string; type: string | null; start_date_time: string | null }
type Suggestion = { id: string; name: string; category: string | null }

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Lecture de ${what} impossible : ${result.error.message}`)
  return result.data as T
}

export async function getTripDetail(tripId: string) {
  const db = await getAdminDb()

  const tripResult = await db
    .from('trips')
    .select(
      'id, name, description, created_by, created_at, updated_at, start_date, end_date, deleted_at, is_hidden, poi_ids, client_first_name, client_last_name'
    )
    .eq('id', tripId)
    .maybeSingle()
  const trip = must<Trip | null>(tripResult, 'dossier')
  if (!trip) return null

  const poiIds = trip.poi_ids ?? []

  const [memberships, medias, expenses, activities, suggestions] = await Promise.all([
    db
      .from('trip_memberships')
      .select('id, account_id, label, role, status, invited_at, joined_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .then((r) => must<Membership[]>(r, 'participants')),
    db
      .from('medias')
      .select('id, file_size, created_at')
      .eq('trip_id', tripId)
      .then((r) => must<Media[]>(r, 'médias')),
    db
      .from('expenses')
      .select('id, title, amount, currency, paid_by, paid_at')
      .eq('trip_id', tripId)
      .order('paid_at', { ascending: false })
      .then((r) => must<Expense[]>(r, 'dépenses')),
    db
      .from('schedule_items')
      .select('id, title, type, start_date_time')
      .eq('trip_id', tripId)
      .order('start_date_time', { ascending: true, nullsFirst: false })
      .then((r) => must<Activity[]>(r, 'activités')),
    poiIds.length
      ? db
          .from('points_of_interest')
          .select('id, name, category')
          .in('id', poiIds)
          .order('name')
          .then((r) => must<Suggestion[]>(r, 'suggestions'))
      : Promise.resolve([] as Suggestion[]),
  ])

  // Resolve people (creator, members, payers) in one profiles query.
  const accountIds = [
    ...new Set(
      [trip.created_by, ...memberships.map((m) => m.account_id), ...expenses.map((e) => e.paid_by)]
        .filter((id): id is string => Boolean(id))
    ),
  ]
  const profiles = accountIds.length
    ? must<{ id: string; firstname: string | null; lastname: string | null }[]>(
        await db.from('profiles').select('id, firstname, lastname').in('id', accountIds),
        'profils'
      )
    : []
  const nameById = new Map(profiles.map((p) => [p.id, fullName(p.firstname, p.lastname)]))

  const emailById = new Map<string, string>()
  await Promise.all(
    accountIds.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id)
      if (data.user?.email) emailById.set(id, data.user.email)
    })
  )

  const person = (id: string | null) => ({
    id,
    name: (id && nameById.get(id)) || '',
    email: (id && emailById.get(id)) || '',
  })

  return {
    trip: {
      ...trip,
      creator: person(trip.created_by),
      clientName: fullName(trip.client_first_name, trip.client_last_name),
    },
    members: memberships.map((m) => ({ ...m, person: person(m.account_id) })),
    medias: {
      count: medias.length,
      totalSize: medias.reduce((sum, m) => sum + (m.file_size ?? 0), 0),
      lastAddedAt: medias.reduce<string | null>(
        (latest, m) => (m.created_at && (!latest || m.created_at > latest) ? m.created_at : latest),
        null
      ),
    },
    expenses: expenses.map((e) => ({ ...e, payer: person(e.paid_by) })),
    activities,
    suggestions,
    missingSuggestions: poiIds.length - suggestions.length,
  }
}

export type TripDetail = NonNullable<Awaited<ReturnType<typeof getTripDetail>>>
