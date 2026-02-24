import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/content/batch-update
// Updates all social_posts that share the same batch_id in a single DB call.
// Used by the "Approve All" / "Reject All" buttons in the Batches view.
//
// Body: { clientId, batch_id, fields: { status: 'approved' | 'rejected' | ... } }

const ALLOWED_FIELDS = new Set(['status', 'scheduled_for'])

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, batch_id, fields } = body as {
      clientId?: string
      batch_id?: string
      fields?: Record<string, unknown>
    }

    if (!clientId || !batch_id || !fields) {
      return NextResponse.json({ error: 'Missing clientId, batch_id, or fields' }, { status: 400 })
    }

    if (!batch_id.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid batch_id format' }, { status: 400 })
    }

    // Only allow safe, non-sensitive fields to be batch-updated
    const safeFields: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.has(key)) {
        safeFields[key] = value
      }
    }

    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json({ error: 'No allowed fields provided' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error, count } = await supabase
      .from('social_posts')
      .update({ ...safeFields, updated_at: new Date().toISOString() })
      .eq('client_id', clientId)   // security: client isolation
      .eq('batch_id', batch_id)
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('[batch-update] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: count ?? 0 })
  } catch (err) {
    console.error('[batch-update] route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
