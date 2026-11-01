import Link from 'next/link'
import { IconArrowDown, IconArrowUp, IconArrowsSort } from '@tabler/icons-react'
import { buildHref, type RawSearchParams, type TableParams } from '@/lib/table'
import { cn } from '@/lib/utils'

/** Column header that toggles sorting through the URL (server-rendered). */
export function SortHeader({
  label,
  column,
  pathname,
  params,
  searchParams,
  align = 'left',
}: {
  label: string
  column: string
  pathname: string
  params: TableParams
  searchParams: RawSearchParams
  align?: 'left' | 'right'
}) {
  const isActive = params.sort === column
  const nextDir = isActive && params.dir === 'desc' ? 'asc' : 'desc'
  const href = buildHref(pathname, searchParams, { sort: column, dir: nextDir, page: null })
  const SortIcon = !isActive ? IconArrowsSort : params.dir === 'asc' ? IconArrowUp : IconArrowDown

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground',
        isActive && 'text-foreground',
        align === 'right' && 'flex-row-reverse'
      )}
      aria-label={`Trier par ${label}`}
    >
      {label}
      <SortIcon className={cn('h-3.5 w-3.5', !isActive && 'opacity-40')} />
    </Link>
  )
}
