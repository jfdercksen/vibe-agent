import { getClient } from '@/lib/data'
import { notFound, redirect } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntegrationsForm } from '@/components/settings/integrations-form'
import { ClientSettingsForm } from '@/components/settings/client-settings-form'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
        <h1 className="text-2xl font-bold tracking-tight">Client Settings</h1>
        <p className="text-muted-foreground">
          Update your client profile, branding, and integration settings
        </p>
      </div>

      <ClientSettingsForm client={client} />

      <Separator />

      {/* Integrations Section */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Integrations</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect external services for publishing and automation
        </p>
        <IntegrationsForm
          clientId={clientId}
          integrations={client.integrations || {}}
        />
      </div>
    </div>
  )
}
