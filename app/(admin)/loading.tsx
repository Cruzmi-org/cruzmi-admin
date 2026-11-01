import { IconLoader2 } from '@tabler/icons-react'

export default function Loading() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground" role="status">
      <IconLoader2 className="h-5 w-5 animate-spin" />
      Chargement des données…
    </div>
  )
}
