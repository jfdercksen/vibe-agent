'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// NOTE: Supabase Realtime (WebSocket) requires the Realtime feature to be
// enabled in the Supabase project AND RLS policies for the anon role.
// Until those are configured, we use simple polling instead — router.refresh()
// every 15s achieves the same "live dashboard" UX without WebSocket failures.

const POLL_INTERVAL_MS = 15_000  // 15 seconds

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

interface UseRealtimeOptions {
  table: TableName
  clientId: string
  onInsert?: (record: Record<string, unknown>) => void
  onUpdate?: (record: Record<string, unknown>) => void
  onDelete?: (record: Record<string, unknown>) => void
}

/**
 * Keeps the page fresh by polling router.refresh() on an interval.
 * Replaces Supabase WebSocket realtime — identical UX, no WS failures.
 * When Supabase Realtime is enabled & RLS policies added, swap back to WS.
 */
export function useRealtime({
  table: _table,
  clientId: _clientId,
  onInsert: _onInsert,
  onUpdate: _onUpdate,
  onDelete: _onDelete,
}: UseRealtimeOptions) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    // Poll every 15 seconds to pick up any new content Claude has saved
    timerRef.current = setInterval(refresh, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [refresh])
}
