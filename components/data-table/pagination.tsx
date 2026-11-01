import Link from 'next/link'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { buildHref, PAGE_SIZE, type RawSearchParams } from '@/lib/table'
import { formatNumber } from '@/lib/format'

export function Pagination({
  pathname,
  searchParams,
  page,
  totalPages,
  total,
}: {
  pathname: string
  searchParams: RawSearchParams
  page: number
  totalPages: number
  total: number
}) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <nav className="flex items-center justify-between gap-4 text-sm" aria-label="Pagination">
      <p className="text-muted-foreground">
        {formatNumber(from)}–{formatNumber(to)} sur {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <PageLink href={buildHref(pathname, searchParams, { page: page - 1 })} disabled={page <= 1} label="Page précédente">
          <IconChevronLeft className="h-4 w-4" />
        </PageLink>
        <span className="text-muted-foreground">
          {page} / {totalPages}
        </span>
        <PageLink href={buildHref(pathname, searchParams, { page: page + 1 })} disabled={page >= totalPages} label="Page suivante">
          <IconChevronRight className="h-4 w-4" />
        </PageLink>
      </div>
    </nav>
  )
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    )
  }
  return (
    <Button variant="outline" size="icon" asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  )
}
