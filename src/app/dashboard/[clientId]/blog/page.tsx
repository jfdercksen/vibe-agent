import { getBlogPosts } from '@/lib/data'
import { BlogPostsList } from '@/components/content/blog-posts-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'

interface BlogPageProps {
  params: Promise<{ clientId: string }>
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { clientId } = await params
  const posts = await getBlogPosts(clientId)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="blog_posts" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog Posts</h1>
        <p className="text-muted-foreground">
          SEO content and long-form articles
        </p>
      </div>
      <BlogPostsList posts={posts} clientId={clientId} />
    </div>
  )
}
