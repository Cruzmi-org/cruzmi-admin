import Image from 'next/image'
import { IconLogout } from '@tabler/icons-react'
import { requireAdmin } from '@/lib/auth/require-admin'
import { NavLinks } from '@/components/nav-links'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b bg-muted/40 p-4 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2">
          <Image
            src="/images/brand/Logo+nom-Cruzmi.svg"
            alt="Cruzmi"
            width={100}
            height={28}
            className="h-7 w-auto dark:invert"
          />
          <span className="rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-white">
            ADMIN
          </span>
        </div>

        <NavLinks />

        <div className="mt-auto space-y-2 border-t pt-4">
          <p className="truncate text-sm text-muted-foreground" title={user.email}>
            {user.email}
          </p>
          <form action="/logout" method="post">
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <IconLogout className="h-4 w-4" />
              Se déconnecter
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  )
}
