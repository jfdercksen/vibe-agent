import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/chat/history?clientId=xxx
// Returns last 60 user+assistant messages for a client (skips tool messages)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const limit = 200
  const { data, error, count } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at', { count: 'exact' })
    .eq('client_id', clientId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reverse to chronological order (we fetched desc to get the *latest* N)
  const messages = (data || []).reverse()
  const hasMore = (count || 0) > limit

  return NextResponse.json({ messages, hasMore })
}
