/**
 * Search / sort / pagination on server-side arrays, driven by URL search params.
 * Data volumes are small (hundreds to a few thousand rows), so rows are loaded
 * on the server and shaped here; nothing is sent to the browser but one page.
 */

export const PAGE_SIZE = 50

export type SortDir = 'asc' | 'desc'

export type TableParams = {
  q: string
  sort: string
  dir: SortDir
  page: number
  filter: string
}

export type RawSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseTableParams(
  raw: RawSearchParams,
  defaults: { sort: string; dir: SortDir; filter?: string }
): TableParams {
  const page = Number.parseInt(first(raw.page) ?? '1', 10)
  const dir = first(raw.dir)
  return {
    q: (first(raw.q) ?? '').trim(),
    sort: first(raw.sort) ?? defaults.sort,
    dir: dir === 'asc' || dir === 'desc' ? dir : defaults.dir,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    filter: first(raw.filter) ?? defaults.filter ?? 'all',
  }
}

type SortValue = string | number | null | undefined

export function applyTable<T>(
  rows: T[],
  params: TableParams,
  options: {
    searchText: (row: T) => string
    sorters: Record<string, (row: T) => SortValue>
  }
) {
  const needle = normalize(params.q)
  const filtered = needle
    ? rows.filter((row) => normalize(options.searchText(row)).includes(needle))
    : rows

  const getValue = options.sorters[params.sort]
  const sorted = getValue ? [...filtered].sort((a, b) => compare(getValue(a), getValue(b), params.dir)) : filtered

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(params.page, totalPages)
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { rows: pageRows, total: sorted.length, page, totalPages }
}

/** Null/empty values always go last, whatever the direction. */
function compare(a: SortValue, b: SortValue, dir: SortDir): number {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1

  const result =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' })
  return dir === 'asc' ? result : -result
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Builds a URL for the current page with some params changed (null removes a param). */
export function buildHref(
  pathname: string,
  current: RawSearchParams,
  changes: Record<string, string | number | null>
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(current)) {
    const v = first(value)
    if (v) params.set(key, v)
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') params.delete(key)
    else params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
