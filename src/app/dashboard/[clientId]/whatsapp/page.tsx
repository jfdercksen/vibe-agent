import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getWhatsAppConversations } from '@/lib/data'
import { WhatsAppDashboard } from '@/components/whatsapp/whatsapp-dashboard'
import { getClient } from '@/lib/data'

export const dynamic = 'force-dynamic'

interface WhatsAppPageProps {
  params: Promise<{ clientId: string }>
}

export default async function WhatsAppPage({ params }: WhatsAppPageProps) {
  const { clientId } = await params

  // Auth check — admin only
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined
  if (role !== 'admin') redirect(`/dashboard/${clientId}`)

  const [client, conversations] = await Promise.all([
    getClient(clientId),
    getWhatsAppConversations(clientId).catch(() => []),
  ])

  if (!client) notFound()

  const isConfigured = !!(client.integrations?.whatsapp?.access_token)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground">
          Real-time customer conversations — Claude auto-replies on your behalf
        </p>
      </div>

      <WhatsAppDashboard
        clientId={clientId}
        initialConversations={conversations}
        isConfigured={isConfigured}
      />
    </div>
  )
}
