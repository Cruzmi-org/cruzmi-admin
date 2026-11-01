import Link from 'next/link'
import {
  IconCalendarEvent,
  IconBook,
  IconBulb,
  IconFolders,
  IconPhoto,
  IconReceipt,
  IconUsers,
  type Icon,
} from '@tabler/icons-react'
import { getOverview } from '@/lib/queries/overview'
import { formatNumber } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
export const metadata = { title: "Vue d'ensemble · Cruzmi Admin" }

const ICONS: Record<string, Icon> = {
  accounts: IconUsers,
  trips: IconFolders,
  medias: IconPhoto,
  expenses: IconReceipt,
  suggestions: IconBulb,
  activities: IconCalendarEvent,
  albums: IconBook,
}

const LINKS: Record<string, string> = {
  accounts: '/accounts',
  trips: '/trips',
}

export default async function OverviewPage() {
  const metrics = await getOverview()

  return (
    <div className="space-y-6">
      <PageHeader title="Vue d'ensemble" description="Chiffres de toute la plateforme Cruzmi, en temps réel." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = ICONS[metric.key] ?? IconFolders
          const href = LINKS[metric.key]
          const card = (
            <Card className={href ? 'h-full transition-colors hover:border-primary' : 'h-full'}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-base font-semibold text-muted-foreground">{metric.label}</CardTitle>
                <MetricIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-4xl font-bold">{formatNumber(metric.total)}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">+{formatNumber(metric.last7)}</span> sur 7 jours ·{' '}
                  <span className="font-semibold text-foreground">+{formatNumber(metric.last30)}</span> sur 30 jours
                </p>
                {metric.note && <p className="text-sm text-muted-foreground">{metric.note}</p>}
              </CardContent>
            </Card>
          )

          return href ? (
            <Link key={metric.key} href={href} className="rounded-xl focus-visible:outline-2">
              {card}
            </Link>
          ) : (
            <div key={metric.key}>{card}</div>
          )
        })}
      </div>
    </div>
  )
}
