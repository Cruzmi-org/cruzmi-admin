import 'server-only'
import type { User } from '@supabase/supabase-js'
import { getAdminDb } from '@/lib/supabase/admin'

export type AdminDb = Awaited<ReturnType<typeof getAdminDb>>

/** PostgREST returns at most 1000 rows per request: page through the table. */
export async function fetchAllRows<T>(db: AdminDb, table: string, columns: string): Promise<T[]> {
  const pageSize = 1000
  const rows: T[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`Lecture de ${table} impossible : ${error.message}`)
    rows.push(...(data as T[]))
    if (!data || data.length < pageSize) return rows
  }
}

/** All Supabase Auth users (paged by 1000). */
export async function fetchAllAuthUsers(db: AdminDb): Promise<User[]> {
  const perPage = 1000
  const users: User[] = []

  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Lecture des comptes impossible : ${error.message}`)
    users.push(...data.users)
    if (data.users.length < perPage) return users
  }
}

/** Counts occurrences of a key (e.g. trip_id) across rows. */
export function countBy<T>(rows: T[], key: (row: T) => string | null | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const k = key(row)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return counts
}
