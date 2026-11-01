import 'server-only'
import { getAdminDb } from '@/lib/supabase/admin'
import { fetchAllAuthUsers, type AdminDb } from '@/lib/queries/shared'

export type OverviewMetric = {
  key: string
  label: string
  total: number
  last7: number
  last30: number
  note?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

const COUNTED_TABLES = [
  { key: 'trips', table: 'trips', label: 'Dossiers' },
  { key: 'medias', table: 'medias', label: 'Photos et médias' },
  { key: 'expenses', table: 'expenses', label: 'Dépenses' },
  { key: 'suggestions', table: 'points_of_interest', label: 'Suggestions' },
  { key: 'activities', table: 'schedule_items', label: 'Activités' },
  { key: 'albums', table: 'album_orders', label: 'Commandes d’albums' },
] as const

async function countRows(
  db: AdminDb,
  table: string,
  options: { since?: string; deletedOnly?: boolean } = {}
) {
  let query = db.from(table).select('id', { count: 'exact', head: true })
  if (options.since) query = query.gte('created_at', options.since)
  if (options.deletedOnly) query = query.not('deleted_at', 'is', null)

  const { count, error } = await query
  if (error) throw new Error(`Comptage de ${table} impossible : ${error.message}`)
  return count ?? 0
}

export async function getOverview(): Promise<OverviewMetric[]> {
  const db = await getAdminDb()
  const now = Date.now()
  const since7 = new Date(now - 7 * DAY_MS).toISOString()
  const since30 = new Date(now - 30 * DAY_MS).toISOString()

  const [users, deletedTrips, ...tableMetrics] = await Promise.all([
    fetchAllAuthUsers(db),
    countRows(db, 'trips', { deletedOnly: true }),
    ...COUNTED_TABLES.map(async ({ key, table, label }) => {
      const [total, last7, last30] = await Promise.all([
        countRows(db, table),
        countRows(db, table, { since: since7 }),
        countRows(db, table, { since: since30 }),
      ])
      const metric: OverviewMetric = { key, label, total, last7, last30 }
      return metric
    }),
  ])

  const pendingAccounts = users.filter((u) => !u.email_confirmed_at && !u.phone_confirmed_at).length
  const accounts: OverviewMetric = {
    key: 'accounts',
    label: 'Comptes',
    total: users.length,
    last7: users.filter((u) => u.created_at >= since7).length,
    last30: users.filter((u) => u.created_at >= since30).length,
    note: `${pendingAccounts} en attente de confirmation`,
  }

  const metrics = tableMetrics.map((m) =>
    m.key === 'trips' ? { ...m, note: `dont ${deletedTrips} supprimé(s)` } : m
  )

  return [accounts, ...metrics]
}
