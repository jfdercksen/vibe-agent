import { getSocialPosts, getClient } from '@/lib/data'
import { SocialPostsList } from '@/components/content/social-posts-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'
import type { IntegrationConfig } from '@/lib/types/database'

interface SocialPageProps {
  params: Promise<{ clientId: string }>
}

export default async function SocialPage({ params }: SocialPageProps) {
  const { clientId } = await params
  const [posts, client] = await Promise.all([
    getSocialPosts(clientId),
    getClient(clientId),
  ])

  const integrations = (client?.integrations || {}) as IntegrationConfig
  const n8nConfigured = !!(integrations.n8n?.base_url || process.env.N8N_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="social_posts" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social Posts</h1>
        <p className="text-muted-foreground">
          Platform-specific social media content — approve, schedule, and publish
        </p>
      </div>
      <SocialPostsList posts={posts} clientId={clientId} n8nConfigured={n8nConfigured} />
    </div>
  )
}
