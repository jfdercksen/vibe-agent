import { notFound } from 'next/navigation'
import { getWhatsAppConversations } from '@/lib/data'
import { WhatsAppDashboard } from '@/components/whatsapp/whatsapp-dashboard'
import { getClient } from '@/lib/data'

export const dynamic = 'force-dynamic'

interface WhatsAppPageProps {
  params: Promise<{ clientId: string }>
}

export default async function WhatsAppPage({ params }: WhatsAppPageProps) {
  const { clientId } = await params

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
          Real-time customer conversations — Vibe auto-replies on your behalf
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
