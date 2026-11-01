import { Badge } from '@/components/ui/badge'

export function TripStatusBadge({ deletedAt, isHidden }: { deletedAt: string | null; isHidden: boolean }) {
  if (deletedAt) return <Badge variant="destructive">Supprimé</Badge>
  if (isHidden) return <Badge variant="outline">Masqué</Badge>
  return null
}
