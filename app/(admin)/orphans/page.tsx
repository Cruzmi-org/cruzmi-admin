import Link from 'next/link'
import { IconInfoCircle } from '@tabler/icons-react'
import { getOrphanInventory, MIN_AGE_DAYS } from '@/lib/queries/orphans'
import { formatBytes, formatDate, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
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
export const metadata = { title: 'Orphelins · Cruzmi Admin' }

const LIST_LIMIT = 100

const TRIP_STATUS: Record<string, { label: string; variant: 'destructive' | 'outline' | 'secondary' }> = {
  gone: { label: 'dossier effacé', variant: 'destructive' },
  deleted: { label: 'dossier en corbeille', variant: 'outline' },
  active: { label: 'dossier actif', variant: 'secondary' },
  none: { label: 'hors dossier', variant: 'outline' },
}

export default async function OrphansPage() {
  const inv = await getOrphanInventory()

  const filesSize = inv.unreferencedFiles.reduce((s, f) => s + (f.size ?? 0), 0)
  const rowsWithFile = inv.orphanRows.filter((r) => r.delete_file)
  const rowsSize = rowsWithFile.reduce((s, r) => s + (r.file_size ?? 0), 0)
  const brokenTotal = inv.brokenReferences.reduce((s, b) => s + b.count, 0)
  const filesByStatus = inv.unreferencedFiles.reduce<Record<string, { count: number; size: number }>>((acc, f) => {
    const entry = (acc[f.tripStatus] ??= { count: 0, size: 0 })
    entry.count += 1
    entry.size += f.size ?? 0
    return acc
  }, {})

  const summary = [
    { href: '#files', label: 'Fichiers sans ligne en base', value: inv.unreferencedFiles.length, detail: formatBytes(filesSize) },
    { href: '#rows', label: 'Photos sans dossier inutilisées', value: inv.orphanRows.length, detail: formatBytes(rowsSize) },
    { href: '#suggestions', label: 'Suggestions sans dossier', value: inv.unusedSuggestions.length },
    { href: '#broken', label: 'Références cassées', value: brokenTotal },
    { href: '#deleted-trips', label: 'Dossiers en corbeille', value: inv.deletedTrips.length },
    { href: '#accounts', label: 'Comptes sans profil', value: inv.usersWithoutProfile.length },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Orphelins"
        description="Inventaire en lecture seule : rien n'est supprimé depuis cette page."
      />

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <IconInfoCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Les photos et fichiers de moins de {MIN_AGE_DAYS} jours sont ignorés, pour ne pas compter un envoi en cours.
        Photos et fichiers reprennent exactement les critères de la fonction de nettoyage{' '}
        <code className="font-mono text-xs">cleanup-orphan-medias</code>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map((item) => (
          <a key={item.href} href={item.href} className="rounded-xl">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{formatNumber(item.value)}</p>
                {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <Section
        id="files"
        title="Fichiers du stockage sans ligne en base"
        intro="Fichiers du bucket « medias » qu'aucune photo ne référence (ni comme image, ni comme vignette). Ils occupent de l'espace sans être visibles nulle part."
        count={inv.unreferencedFiles.length}
      >
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(filesByStatus).map(([status, { count, size }]) => (
            <Badge key={status} variant={TRIP_STATUS[status].variant}>
              {TRIP_STATUS[status].label} : {formatNumber(count)} · {formatBytes(size)}
            </Badge>
          ))}
        </div>
        <TableBox limit={LIST_LIMIT} total={inv.unreferencedFiles.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Fichier</TableHead>
              <TableHead>Dossier</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Taille</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.unreferencedFiles.slice(0, LIST_LIMIT).map((file) => (
              <TableRow key={file.name}>
                <TableCell className="max-w-md truncate font-mono text-xs" title={file.name}>
                  {file.name}
                </TableCell>
                <TableCell>
                  {file.tripName && file.tripId ? (
                    <Link href={`/trips/${file.tripId}`} className="mr-2 hover:underline">
                      {file.tripName}
                    </Link>
                  ) : null}
                  <Badge variant={TRIP_STATUS[file.tripStatus].variant}>{TRIP_STATUS[file.tripStatus].label}</Badge>
                </TableCell>
                <TableCell>{formatDate(file.created_at)}</TableCell>
                <TableCell className="text-right">{formatBytes(file.size)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>

      <Section
        id="rows"
        title="Photos sans dossier que plus rien n'utilise"
        intro="Lignes « medias » sans dossier, qui ne servent ni de couverture, ni de photo d'activité, de suggestion, de bien, de repas ou de justificatif. « Fichier partagé » : une autre photo conservée utilise le même fichier, seule la ligne serait supprimée."
        count={inv.orphanRows.length}
      >
        <TableBox limit={LIST_LIMIT} total={inv.orphanRows.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Fichier</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead className="text-right">Taille</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.orphanRows.slice(0, LIST_LIMIT).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-md truncate font-mono text-xs" title={row.file_path}>
                  {row.file_path}
                </TableCell>
                <TableCell className="space-x-1">
                  {row.is_google_import && <Badge variant="outline">import Google</Badge>}
                  {!row.delete_file && <Badge variant="secondary">fichier partagé</Badge>}
                </TableCell>
                <TableCell>{formatDate(row.created_at)}</TableCell>
                <TableCell className="text-right">{formatBytes(row.file_size)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>

      <Section
        id="suggestions"
        title="Suggestions qu'aucun dossier n'utilise"
        intro="Une suggestion n'est rattachée à un dossier que par la liste de suggestions du dossier : quand le dossier est supprimé, elle reste. Celles liées à une activité ou un sondage sont exclues."
        count={inv.unusedSuggestions.length}
      >
        <TableBox limit={LIST_LIMIT} total={inv.unusedSuggestions.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Suggestion</TableHead>
              <TableHead>Situation</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead className="text-right">Photos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.unusedSuggestions.slice(0, LIST_LIMIT).map((poi) => (
              <TableRow key={poi.id}>
                <TableCell className="font-medium">{poi.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {poi.onlyInDeletedTrip ? 'dossier en corbeille' : 'aucun dossier'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(poi.created_at)}</TableCell>
                <TableCell className="text-right">{formatNumber(poi.image_ids?.length ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>

      <Section
        id="broken"
        title="Références cassées"
        intro="Listes d'identifiants (sans contrôle de la base) qui pointent vers des éléments supprimés. Sans danger pour les données, mais l'application peut afficher un élément vide."
        count={brokenTotal}
      >
        <TableBox limit={LIST_LIMIT} total={inv.brokenReferences.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Nombre</TableHead>
              <TableHead>Exemples</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.brokenReferences.map((ref) => (
              <TableRow key={ref.kind}>
                <TableCell className="font-medium">{ref.label}</TableCell>
                <TableCell className="text-right">{formatNumber(ref.count)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ref.examples.length === 0
                    ? '—'
                    : [...new Map(ref.examples.map((e) => [e.owner + e.tripId, e])).values()].map((e, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {e.tripId ? (
                            <Link href={`/trips/${e.tripId}`} className="hover:underline">
                              {e.owner}
                            </Link>
                          ) : (
                            e.owner
                          )}
                        </span>
                      ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>

      <Section
        id="deleted-trips"
        title="Dossiers en corbeille"
        intro="Dossiers supprimés (suppression douce) : leur contenu est toujours en base et leurs photos dans le stockage."
        count={inv.deletedTrips.length}
      >
        <TableBox limit={LIST_LIMIT} total={inv.deletedTrips.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Dossier</TableHead>
              <TableHead>Supprimé le</TableHead>
              <TableHead className="text-right">Membres</TableHead>
              <TableHead className="text-right">Photos</TableHead>
              <TableHead className="text-right">Dépenses</TableHead>
              <TableHead className="text-right">Activités</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.deletedTrips.slice(0, LIST_LIMIT).map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>
                  <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                    {trip.name}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(trip.deletedAt)}</TableCell>
                <TableCell className="text-right">{formatNumber(trip.members)}</TableCell>
                <TableCell className="text-right">{formatNumber(trip.medias)}</TableCell>
                <TableCell className="text-right">{formatNumber(trip.expenses)}</TableCell>
                <TableCell className="text-right">{formatNumber(trip.activities)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>

      <Section
        id="accounts"
        title="Comptes sans profil"
        intro={`Comptes d'authentification sans fiche « profil » (inscription interrompue ou profil effacé à la main). Profils sans compte : ${formatNumber(inv.profilesWithoutUser)}.`}
        count={inv.usersWithoutProfile.length}
      >
        <TableBox limit={LIST_LIMIT} total={inv.usersWithoutProfile.length}>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inv.usersWithoutProfile.slice(0, LIST_LIMIT).map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.confirmed ? 'secondary' : 'outline'}>
                    {user.confirmed ? 'Confirmé' : 'En attente'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableBox>
      </Section>
    </div>
  )
}

function Section({
  id,
  title,
  intro,
  count,
  children,
}: {
  id: string
  title: string
  intro: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <div>
        <h2 className="text-xl font-semibold">
          {title} <span className="text-muted-foreground">({formatNumber(count)})</span>
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{intro}</p>
      </div>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Rien à signaler 🎉
        </p>
      ) : (
        children
      )}
    </section>
  )
}

function TableBox({ limit, total, children }: { limit: number; total: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border">
        <Table>{children}</Table>
      </div>
      {total > limit && (
        <p className="text-sm text-muted-foreground">
          {formatNumber(limit)} premiers affichés sur {formatNumber(total)}.
        </p>
      )}
    </div>
  )
}
