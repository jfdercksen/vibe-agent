'use client'

/**
 * Invisible client component that activates a real-time Supabase
 * subscription for a given table. Drop this anywhere in a server page
 * to get live updates without converting the whole page to 'use client'.
 *
 * Usage:
 *   <RealtimeRefresh table="social_posts" clientId={clientId} />
 */

import { useRealtime } from '@/hooks/use-realtime'

type TableName =
  | 'social_posts'
  | 'blog_posts'
  | 'content_ideas'
  | 'email_sequences'
  | 'emails'
  | 'keyword_research'
  | 'content_calendar'
  | 'media_assets'
  | 'brand_voices'
  | 'positioning_angles'
  | 'lead_magnets'
  | 'creative_briefs'
  | 'landing_pages'

interface RealtimeRefreshProps {
  table: TableName
  clientId: string
}

export function RealtimeRefresh({ table, clientId }: RealtimeRefreshProps) {
  useRealtime({ table, clientId })
  return null
}
