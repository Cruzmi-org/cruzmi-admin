import 'server-only'
import { getAdminDb } from '@/lib/supabase/admin'
import { countBy, fetchAllAuthUsers, fetchAllRows } from '@/lib/queries/shared'

/**
 * Read-only orphan inventory (lot C1). Nothing here deletes anything.
 *
 * Media rows and Storage files reuse the SQL functions shipped with the
 * cleanup Edge Function (cruzmi-supabase-conf), so the admin shows exactly
 * what `cleanup-orphan-medias` would remove:
 *   - find_orphan_medias(p_min_age): rows without trip that nothing uses
 *   - find_unreferenced_media_files(p_min_age): files of the `medias` bucket
 *     referenced by no row (neither as file nor as thumbnail)
 */

export const MIN_AGE_DAYS = 7

export type OrphanMediaRow = {
  id: string
  file_path: string
  thumbnail_path: string | null
  file_size: number | null
  created_at: string
  created_by: string | null
  is_google_import: boolean
  delete_file: boolean
}

export type UnreferencedFile = {
  name: string
  size: number | null
  created_at: string
  zone: string
}

type Trip = {
  id: string
  name: string
  deleted_at: string | null
  poi_ids: string[] | null
  asset_ids: string[] | null
}
type Poi = { id: string; name: string; created_at: string | null; created_by: string | null; image_ids: string[] | null }
type WithImages = { id: string; image_ids: string[] | null }
type PoiLink = { id: string; linked_point_of_interest_id: string | null }
type TripIdRow = { id: string; trip_id: string | null }

export type BrokenReference = {
  kind: string
  label: string
  count: number
  examples: { owner: string; tripId?: string }[]
}

export async function getOrphanInventory() {
  const db = await getAdminDb()
  const minAge = `${MIN_AGE_DAYS} days`

  const [
    orphanRowsResult,
    filesResult,
    trips,
    pois,
    sharedAssets,
    meals,
    scheduleLinks,
    pollLinks,
    memberships,
    medias,
    expenses,
    activities,
    profiles,
    users,
  ] = await Promise.all([
    db.rpc('find_orphan_medias', { p_min_age: minAge }),
    db.rpc('find_unreferenced_media_files', { p_min_age: minAge }),
    fetchAllRows<Trip>(db, 'trips', 'id, name, deleted_at, poi_ids, asset_ids'),
    fetchAllRows<Poi>(db, 'points_of_interest', 'id, name, created_at, created_by, image_ids'),
    fetchAllRows<WithImages & { name: string }>(db, 'shared_assets', 'id, name, image_ids'),
    fetchAllRows<WithImages & { name: string; trip_id: string }>(db, 'meals', 'id, name, trip_id, image_ids'),
    fetchAllRows<PoiLink>(db, 'schedule_items', 'id, linked_point_of_interest_id'),
    fetchAllRows<PoiLink>(db, 'polls', 'id, linked_point_of_interest_id'),
    fetchAllRows<TripIdRow>(db, 'trip_memberships', 'id, trip_id'),
    fetchAllRows<TripIdRow>(db, 'medias', 'id, trip_id'),
    fetchAllRows<TripIdRow>(db, 'expenses', 'id, trip_id'),
    fetchAllRows<TripIdRow>(db, 'schedule_items', 'id, trip_id'),
    fetchAllRows<{ id: string }>(db, 'profiles', 'id'),
    fetchAllAuthUsers(db),
  ])

  if (orphanRowsResult.error) throw new Error(`find_orphan_medias : ${orphanRowsResult.error.message}`)
  if (filesResult.error) throw new Error(`find_unreferenced_media_files : ${filesResult.error.message}`)

  const orphanRows = (orphanRowsResult.data ?? []) as OrphanMediaRow[]
  // Files are stored under trips/<trip id>/...: tell whether that trip still exists.
  const tripById = new Map(trips.map((t) => [t.id, t]))
  const unreferencedFiles = ((filesResult.data ?? []) as UnreferencedFile[])
    .map((file) => {
      const tripId = file.name.match(/^trips\/([0-9a-f-]{36})\//i)?.[1] ?? null
      const trip = tripId ? tripById.get(tripId) : undefined
      const tripStatus: 'none' | 'gone' | 'deleted' | 'active' = !tripId
        ? 'none'
        : !trip
          ? 'gone'
          : trip.deleted_at
            ? 'deleted'
            : 'active'
      return { ...file, tripId, tripName: trip?.name ?? null, tripStatus }
    })
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))

  // ---- Suggestions used by no trip ---------------------------------------
  const activeTrips = trips.filter((t) => !t.deleted_at)
  const poiInActiveTrip = new Set(activeTrips.flatMap((t) => t.poi_ids ?? []))
  const poiInDeletedTrip = new Set(trips.filter((t) => t.deleted_at).flatMap((t) => t.poi_ids ?? []))
  const poiLinked = new Set(
    [...scheduleLinks, ...pollLinks].map((l) => l.linked_point_of_interest_id).filter(Boolean) as string[]
  )
  const unusedSuggestions = pois
    .filter((p) => !poiInActiveTrip.has(p.id) && !poiLinked.has(p.id))
    .map((p) => ({ ...p, onlyInDeletedTrip: poiInDeletedTrip.has(p.id) }))
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

  // ---- Broken id references (arrays have no foreign key) ------------------
  const mediaIdSet = new Set(medias.map((m) => m.id))
  const poiIdSet = new Set(pois.map((p) => p.id))
  const assetIdSet = new Set(sharedAssets.map((a) => a.id))

  const broken = (
    kind: string,
    label: string,
    rows: { owner: string; tripId?: string; ids: string[] | null }[],
    exists: Set<string>
  ): BrokenReference => {
    const hits = rows.flatMap((row) =>
      (row.ids ?? []).filter((id) => !exists.has(id)).map(() => ({ owner: row.owner, tripId: row.tripId }))
    )
    return { kind, label, count: hits.length, examples: hits.slice(0, 10) }
  }

  const brokenReferences = [
    broken(
      'trip-poi',
      'Dossiers → suggestions supprimées',
      trips.map((t) => ({ owner: t.name, tripId: t.id, ids: t.poi_ids })),
      poiIdSet
    ),
    broken(
      'trip-asset',
      'Dossiers → hébergements / biens supprimés',
      trips.map((t) => ({ owner: t.name, tripId: t.id, ids: t.asset_ids })),
      assetIdSet
    ),
    broken(
      'poi-image',
      'Suggestions → photos supprimées',
      pois.map((p) => ({ owner: p.name, ids: p.image_ids })),
      mediaIdSet
    ),
    broken(
      'asset-image',
      'Biens partagés → photos supprimées',
      sharedAssets.map((a) => ({ owner: a.name, ids: a.image_ids })),
      mediaIdSet
    ),
    broken(
      'meal-image',
      'Repas → photos supprimées',
      meals.map((m) => ({ owner: m.name, tripId: m.trip_id, ids: m.image_ids })),
      mediaIdSet
    ),
  ]

  // ---- Soft-deleted trips still holding data ------------------------------
  const memberCount = countBy(memberships, (m) => m.trip_id)
  const mediaCount = countBy(medias, (m) => m.trip_id)
  const expenseCount = countBy(expenses, (e) => e.trip_id)
  const activityCount = countBy(activities, (a) => a.trip_id)
  const deletedTrips = trips
    .filter((t) => t.deleted_at)
    .map((t) => ({
      id: t.id,
      name: t.name,
      deletedAt: t.deleted_at as string,
      members: memberCount.get(t.id) ?? 0,
      medias: mediaCount.get(t.id) ?? 0,
      expenses: expenseCount.get(t.id) ?? 0,
      activities: activityCount.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))

  // ---- Accounts vs profiles -----------------------------------------------
  const userIds = new Set(users.map((u) => u.id))
  const profileIds = new Set(profiles.map((p) => p.id))
  const usersWithoutProfile = users
    .filter((u) => !profileIds.has(u.id))
    .map((u) => ({ id: u.id, email: u.email ?? u.phone ?? '—', createdAt: u.created_at, confirmed: Boolean(u.email_confirmed_at) }))
  const profilesWithoutUser = profiles.filter((p) => !userIds.has(p.id)).length

  return {
    orphanRows,
    unreferencedFiles,
    unusedSuggestions,
    brokenReferences,
    deletedTrips,
    usersWithoutProfile,
    profilesWithoutUser,
  }
}

export type OrphanInventory = Awaited<ReturnType<typeof getOrphanInventory>>
