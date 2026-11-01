import { IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react'
import { requireAdmin } from '@/lib/auth/require-admin'
import { getAdminDb } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const COUNTED_TABLES = [
  { table: 'trips', label: 'Dossiers' },
  { table: 'medias', label: 'Photos et médias' },
  { table: 'expenses', label: 'Dépenses' },
] as const

async function getSanityCounts() {
  const db = await getAdminDb()

  const [{ data: authData, error: authError }, ...tableResults] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1 }),
    ...COUNTED_TABLES.map(({ table }) =>
      db.from(table).select('*', { count: 'exact', head: true })
    ),
  ])

  const counts = [
    { label: 'Comptes', value: authError ? null : (authData as { total?: number }).total ?? null },
    ...COUNTED_TABLES.map(({ label }, i) => ({
      label,
      value: tableResults[i].error ? null : tableResults[i].count,
    })),
  ]
  const hasError = counts.some((c) => c.value === null)

  return { counts, hasError }
}

export default async function OverviewPage() {
  const user = await requireAdmin()
  const { counts, hasError } = await getSanityCounts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bonjour 👋</h1>
        <p className="text-muted-foreground">Connecté en tant que {user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasError ? (
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <IconCircleCheck className="h-5 w-5 text-green-600" />
            )}
            Connexion à la base
          </CardTitle>
          <CardDescription>
            {hasError
              ? "Certaines données n'ont pas pu être lues : vérifiez la clé service_role."
              : 'Accès complet à la base opérationnel. Les tableaux détaillés arrivent au lot B.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {counts.map(({ label, value }) => (
              <div key={label} className="rounded-lg border p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-bold">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
