import Link from 'next/link'
import { getTrips, type TripRow } from '@/lib/queries/trips'
import { applyTable, parseTableParams, type RawSearchParams } from '@/lib/table'
import { formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/data-table/search-input'
import { SortHeader } from '@/components/data-table/sort-header'
import { Pagination } from '@/components/data-table/pagination'
import { FilterTabs } from '@/components/data-table/filter-tabs'
import { TripStatusBadge } from '@/components/trip-status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dossiers · Cruzmi Admin' }

const PATHNAME = '/trips'

const FILTERS: Record<string, (t: TripRow) => boolean> = {
  all: () => true,
  active: (t) => !t.deletedAt,
  deleted: (t) => Boolean(t.deletedAt),
  empty: (t) => !t.deletedAt && t.medias + t.expenses + t.activities + t.suggestions === 0,
}

const COUNT_COLUMNS = [
  { key: 'participants', label: 'Participants' },
  { key: 'medias', label: 'Photos' },
  { key: 'expenses', label: 'Dépenses' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'activities', label: 'Activités' },
] as const

export default async function TripsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams
  const params = parseTableParams(raw, { sort: 'createdAt', dir: 'desc' })
  const trips = await getTrips()

  const filter = FILTERS[params.filter] ? params.filter : 'all'
  const { rows, total, page, totalPages } = applyTable(trips.filter(FILTERS[filter]), params, {
    searchText: (t) => `${t.name} ${t.creatorEmail} ${t.creatorName} ${t.clientName}`,
    sorters: {
      name: (t) => t.name,
      creator: (t) => t.creatorEmail,
      createdAt: (t) => t.createdAt,
      startDate: (t) => t.startDate,
      participants: (t) => t.participants,
      medias: (t) => t.medias,
      expenses: (t) => t.expenses,
      suggestions: (t) => t.suggestions,
      activities: (t) => t.activities,
    },
  })

  const header = (label: string, column: string, align?: 'right') => (
    <SortHeader label={label} column={column} pathname={PATHNAME} params={params} searchParams={raw} align={align} />
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Dossiers" description={`${formatNumber(trips.length)} dossiers au total`} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          pathname={PATHNAME}
          searchParams={raw}
          current={filter}
          options={[
            { value: 'all', label: 'Tous', count: trips.length },
            { value: 'active', label: 'Actifs', count: trips.filter(FILTERS.active).length },
            { value: 'deleted', label: 'Supprimés', count: trips.filter(FILTERS.deleted).length },
            { value: 'empty', label: 'Vides', count: trips.filter(FILTERS.empty).length },
          ]}
        />
        <SearchInput placeholder="Rechercher un dossier, un créateur, un client…" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{header('Dossier', 'name')}</TableHead>
              <TableHead>{header('Créateur', 'creator')}</TableHead>
              <TableHead>{header('Créé le', 'createdAt')}</TableHead>
              <TableHead>{header('Dates du voyage', 'startDate')}</TableHead>
              {COUNT_COLUMNS.map(({ key, label }) => (
                <TableHead key={key} className="text-right">
                  {header(label, key, 'right')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4 + COUNT_COLUMNS.length} className="py-10 text-center text-muted-foreground">
                  Aucun dossier ne correspond à ces critères.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                        {trip.name}
                      </Link>
                      <TripStatusBadge deletedAt={trip.deletedAt} isHidden={trip.isHidden} />
                    </div>
                    {trip.clientName && <p className="text-sm text-muted-foreground">Client : {trip.clientName}</p>}
                  </TableCell>
                  <TableCell>
                    <p>{trip.creatorName || '—'}</p>
                    <p className="text-sm text-muted-foreground">{trip.creatorEmail}</p>
                  </TableCell>
                  <TableCell>{formatDate(trip.createdAt)}</TableCell>
                  <TableCell>
                    {trip.startDate ? `${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(trip.participants)}
                    {trip.pendingInvitations > 0 && (
                      <span className="text-sm text-muted-foreground"> (+{trip.pendingInvitations})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(trip.medias)}</TableCell>
                  <TableCell className="text-right">{formatNumber(trip.expenses)}</TableCell>
                  <TableCell className="text-right">{formatNumber(trip.suggestions)}</TableCell>
                  <TableCell className="text-right">{formatNumber(trip.activities)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Participants : membres ayant accepté, (+ n) invitations en attente.
      </p>

      <Pagination pathname={PATHNAME} searchParams={raw} page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
