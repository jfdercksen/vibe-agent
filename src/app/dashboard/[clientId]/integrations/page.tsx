import { getClient } from '@/lib/data'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntegrationsForm } from '@/components/settings/integrations-form'

export const dynamic = 'force-dynamic'

interface IntegrationsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { clientId } = await params

  // Auth check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const client = await getClient(clientId)

  if (!client) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services for publishing and automation
        </p>
      </div>
      <IntegrationsForm
        clientId={clientId}
        integrations={client.integrations || {}}
      />
    </div>
  )
}
