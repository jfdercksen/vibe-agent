import { getBlogPosts, getClient } from '@/lib/data'
import { BlogPostsList } from '@/components/content/blog-posts-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'
import type { IntegrationConfig } from '@/lib/types/database'

interface BlogPageProps {
  params: Promise<{ clientId: string }>
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { clientId } = await params
  const [posts, client] = await Promise.all([
    getBlogPosts(clientId),
    getClient(clientId),
  ])

  const integrations = (client?.integrations || {}) as IntegrationConfig
  const n8nConfigured = !!(integrations.n8n?.base_url || process.env.N8N_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="blog_posts" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
        <p className="text-muted-foreground">
          SEO content and long-form articles
        </p>
      </div>
      <BlogPostsList posts={posts} clientId={clientId} n8nConfigured={n8nConfigured} />
    </div>
  )
}
