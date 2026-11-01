'use client'

import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl space-y-4 rounded-lg border border-destructive/40 p-6" role="alert">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <IconAlertTriangle className="h-5 w-5 text-destructive" />
        Impossible de charger cette page
      </h2>
      <p className="text-muted-foreground">
        Une erreur est survenue en lisant la base de données.
        {error.digest && <span className="block text-xs">Référence : {error.digest}</span>}
      </p>
      <Button variant="outline" onClick={reset}>
        <IconRefresh className="h-4 w-4" />
        Réessayer
      </Button>
    </div>
  )
}
