import { IconBrandApple, IconBrandGoogle, IconMail } from '@tabler/icons-react'
import { getAccounts, type AccountRow } from '@/lib/queries/accounts'
import { applyTable, parseTableParams, type RawSearchParams } from '@/lib/table'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/data-table/search-input'
import { SortHeader } from '@/components/data-table/sort-header'
import { Pagination } from '@/components/data-table/pagination'
import { FilterTabs } from '@/components/data-table/filter-tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Comptes · Cruzmi Admin' }

const PATHNAME = '/accounts'

const FILTERS: Record<string, (a: AccountRow) => boolean> = {
  all: () => true,
  confirmed: (a) => a.confirmed,
  pending: (a) => !a.confirmed,
  'no-profile': (a) => !a.hasProfile,
}

const PROVIDER_ICONS = { google: IconBrandGoogle, apple: IconBrandApple, email: IconMail } as const

export default async function AccountsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams
  const params = parseTableParams(raw, { sort: 'createdAt', dir: 'desc' })
  const accounts = await getAccounts()

  const filter = FILTERS[params.filter] ? params.filter : 'all'
  const { rows, total, page, totalPages } = applyTable(accounts.filter(FILTERS[filter]), params, {
    searchText: (a) => `${a.email} ${a.name}`,
    sorters: {
      email: (a) => a.email,
      name: (a) => a.name,
      createdAt: (a) => a.createdAt,
      lastSignInAt: (a) => a.lastSignInAt,
      tripsCreated: (a) => a.tripsCreated,
      tripsJoined: (a) => a.tripsJoined,
    },
  })

  const header = (label: string, column: string, align?: 'right') => (
    <SortHeader label={label} column={column} pathname={PATHNAME} params={params} searchParams={raw} align={align} />
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Comptes" description={`${formatNumber(accounts.length)} comptes inscrits sur Cruzmi`} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          pathname={PATHNAME}
          searchParams={raw}
          current={filter}
          options={[
            { value: 'all', label: 'Tous', count: accounts.length },
            { value: 'confirmed', label: 'Confirmés', count: accounts.filter(FILTERS.confirmed).length },
            { value: 'pending', label: 'En attente', count: accounts.filter(FILTERS.pending).length },
            { value: 'no-profile', label: 'Sans profil', count: accounts.filter(FILTERS['no-profile']).length },
          ]}
        />
        <SearchInput placeholder="Rechercher un email ou un nom…" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{header('Email', 'email')}</TableHead>
              <TableHead>{header('Nom', 'name')}</TableHead>
              <TableHead>Connexion via</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>{header('Inscription', 'createdAt')}</TableHead>
              <TableHead>{header('Dernière connexion', 'lastSignInAt')}</TableHead>
              <TableHead className="text-right">{header('Dossiers créés', 'tripsCreated', 'right')}</TableHead>
              <TableHead className="text-right">{header('Participations', 'tripsJoined', 'right')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Aucun compte ne correspond à ces critères.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.email}</TableCell>
                  <TableCell>
                    {account.name || (
                      <span className="text-muted-foreground">{account.hasProfile ? '—' : 'pas de profil'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {account.providers.map((provider) => {
                        const ProviderIcon = PROVIDER_ICONS[provider as keyof typeof PROVIDER_ICONS]
                        return ProviderIcon ? (
                          <ProviderIcon key={provider} className="h-4 w-4 text-muted-foreground" aria-label={provider} />
                        ) : (
                          <span key={provider} className="text-xs text-muted-foreground">
                            {provider}
                          </span>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {account.confirmed ? (
                      <Badge variant="secondary">Confirmé</Badge>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(account.lastSignInAt)}</TableCell>
                  <TableCell className="text-right">{formatNumber(account.tripsCreated)}</TableCell>
                  <TableCell className="text-right">{formatNumber(account.tripsJoined)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination pathname={PATHNAME} searchParams={raw} page={page} totalPages={totalPages} total={total} />
    </div>
  )
}
