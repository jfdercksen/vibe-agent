import { getLandingPages } from '@/lib/data'
import { LandingPagesList } from '@/components/content/landing-pages-list'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'
import type { LandingPage } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

interface PagesPageProps {
  params: Promise<{ clientId: string }>
}

export default async function LandingPagesPage({ params }: PagesPageProps) {
  const { clientId } = await params

  let pages: LandingPage[] = []
  try {
    pages = await getLandingPages(clientId)
  } catch {
    // Table may not exist yet — show empty state
    pages = []
  }

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="landing_pages" clientId={clientId} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Landing Pages</h1>
        <p className="text-muted-foreground">
          SEO pages, programmatic location pages, and campaign landing pages
        </p>
      </div>
      <LandingPagesList pages={pages} clientId={clientId} />
    </div>
  )
}
