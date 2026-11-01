'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconFolders,
  IconLayoutDashboard,
  IconTrashX,
  IconUsers,
  type Icon,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: Icon; soon?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: "Vue d'ensemble", icon: IconLayoutDashboard },
  { href: '/accounts', label: 'Comptes', icon: IconUsers, soon: true },
  { href: '/trips', label: 'Dossiers', icon: IconFolders, soon: true },
  { href: '/orphans', label: 'Orphelins', icon: IconTrashX, soon: true },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation principale">
      {NAV_ITEMS.map(({ href, label, icon: ItemIcon, soon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        const classes = cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-base',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-muted',
          soon && 'pointer-events-none text-muted-foreground'
        )

        if (soon) {
          return (
            <span key={href} className={classes} aria-disabled="true">
              <ItemIcon className="h-5 w-5" />
              {label}
              <span className="ml-auto text-xs">bientôt</span>
            </span>
          )
        }

        return (
          <Link key={href} href={href} className={classes} aria-current={isActive ? 'page' : undefined}>
            <ItemIcon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
