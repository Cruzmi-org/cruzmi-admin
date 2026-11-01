'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IconLoader2, IconSearch } from '@tabler/icons-react'
import { Input } from '@/components/ui/input'

const DEBOUNCE_MS = 300

export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (value.trim() === current) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) params.set('q', value.trim())
      else params.delete('q')
      params.delete('page')
      const query = params.toString()
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname))
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, pathname, router, searchParams])

  return (
    <div className="relative w-full max-w-sm">
      {isPending ? (
        <IconLoader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  )
}
