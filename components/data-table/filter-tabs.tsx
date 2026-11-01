import Link from 'next/link'
import { buildHref, type RawSearchParams } from '@/lib/table'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export type FilterOption = { value: string; label: string; count: number }

/** Segmented filter driven by the `filter` URL param. */
export function FilterTabs({
  pathname,
  searchParams,
  current,
  options,
}: {
  pathname: string
  searchParams: RawSearchParams
  current: string
  options: FilterOption[]
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1" role="tablist">
      {options.map((option) => {
        const isActive = option.value === current
        return (
          <Link
            key={option.value}
            role="tab"
            aria-selected={isActive}
            href={buildHref(pathname, searchParams, {
              filter: option.value === 'all' ? null : option.value,
              page: null,
            })}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              isActive ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label} <span className="text-muted-foreground">({formatNumber(option.count)})</span>
          </Link>
        )
      })}
    </div>
  )
}
