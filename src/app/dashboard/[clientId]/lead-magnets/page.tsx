import { getLeadMagnets } from '@/lib/data'
import { LeadMagnetsList } from '@/components/content/lead-magnets-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'

interface LeadMagnetsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function LeadMagnetsPage({ params }: LeadMagnetsPageProps) {
  const { clientId } = await params
  const magnets = await getLeadMagnets(clientId)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="lead_magnets" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Magnets</h1>
        <p className="text-muted-foreground">
          Opt-in offers — free resources that convert visitors into subscribers
        </p>
      </div>
      <LeadMagnetsList magnets={magnets} clientId={clientId} />
    </div>
  )
}
