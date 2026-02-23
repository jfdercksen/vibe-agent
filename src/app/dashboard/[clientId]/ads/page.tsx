import { getCreativeBriefs } from '@/lib/data'
import { AdBriefsList } from '@/components/content/ad-briefs-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'

export const dynamic = 'force-dynamic'

interface AdsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function AdsPage({ params }: AdsPageProps) {
  const { clientId } = await params
  const briefs = await getCreativeBriefs(clientId)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="creative_briefs" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ad Creative Briefs</h1>
        <p className="text-muted-foreground">
          DTC ad concepts — strategy, hooks, copy, and visual direction ready for production
        </p>
      </div>
      <AdBriefsList briefs={briefs} clientId={clientId} />
    </div>
  )
}
