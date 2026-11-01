import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconArrowLeft } from '@tabler/icons-react'
import { getTripDetail } from '@/lib/queries/trip-detail'
import { formatBytes, formatDate, formatDateTime, formatMoney, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { TripStatusBadge } from '@/components/trip-status-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepté',
  pending: 'En attente',
  declined: 'Refusé',
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const detail = await getTripDetail(id)
  if (!detail) notFound()

  const { trip, members, medias, expenses, activities, suggestions, missingSuggestions } = detail
  const expensesByCurrency = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Link href="/trips" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowLeft className="h-4 w-4" />
        Tous les dossiers
      </Link>

      <PageHeader
        title={trip.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Créé le {formatDate(trip.created_at)} par {trip.creator.name || trip.creator.email || 'inconnu'}
            {trip.creator.name && trip.creator.email && <span>({trip.creator.email})</span>}
            <TripStatusBadge deletedAt={trip.deleted_at} isHidden={trip.is_hidden} />
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Dates du voyage">
          {trip.start_date ? `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}` : '—'}
        </InfoCard>
        <InfoCard label="Client">{trip.clientName || '—'}</InfoCard>
        <InfoCard label="Photos et médias">
          {formatNumber(medias.count)} · {formatBytes(medias.totalSize)}
          {medias.lastAddedAt && (
            <span className="block text-sm text-muted-foreground">dernier ajout le {formatDate(medias.lastAddedAt)}</span>
          )}
        </InfoCard>
        <InfoCard label="Dernière modification">
          {formatDateTime(trip.updated_at)}
          {trip.deleted_at && (
            <span className="block text-sm text-destructive">supprimé le {formatDateTime(trip.deleted_at)}</span>
          )}
        </InfoCard>
      </div>

      {trip.description && (
        <Card>
          <CardContent className="whitespace-pre-line pt-6">{trip.description}</CardContent>
        </Card>
      )}

      <Section title="Participants" count={members.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Invité le</TableHead>
              <TableHead>A rejoint le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.person.name || m.label || '—'}</TableCell>
                <TableCell>{m.person.email || <span className="text-muted-foreground">pas de compte lié</span>}</TableCell>
                <TableCell>{m.role ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={m.status === 'accepted' ? 'secondary' : 'outline'}>
                    {STATUS_LABELS[m.status ?? ''] ?? m.status ?? '—'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(m.invited_at)}</TableCell>
                <TableCell>{formatDate(m.joined_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section
        title="Dépenses"
        count={expenses.length}
        extra={Object.entries(expensesByCurrency)
          .map(([currency, sum]) => formatMoney(sum, currency))
          .join(' + ')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Libellé</TableHead>
              <TableHead>Payé par</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{e.payer.name || e.payer.email || '—'}</TableCell>
                <TableCell>{formatDate(e.paid_at)}</TableCell>
                <TableCell className="text-right">{formatMoney(e.amount, e.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Activités" count={activities.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Début</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.type ?? '—'}</TableCell>
                  <TableCell>{formatDateTime(a.start_date_time)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section
          title="Suggestions"
          count={suggestions.length}
          extra={missingSuggestions > 0 ? `${missingSuggestions} référence(s) cassée(s)` : undefined}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.category ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>

      <p className="text-xs text-muted-foreground">Identifiant : {trip.id}</p>
    </div>
  )
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-lg font-semibold">{children}</CardContent>
    </Card>
  )
}

function Section({
  title,
  count,
  extra,
  children,
}: {
  title: string
  count: number
  extra?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex flex-wrap items-baseline gap-2 text-xl font-semibold">
        {title} <span className="text-muted-foreground">({formatNumber(count)})</span>
        {extra && <span className="text-sm font-normal text-muted-foreground">· {extra}</span>}
      </h2>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun élément.</p>
      ) : (
        <div className="rounded-lg border">{children}</div>
      )}
    </section>
  )
}
