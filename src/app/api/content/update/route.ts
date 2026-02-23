import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/content/update
// Body: { table, id, data } OR { table, id, fields }  (both accepted for backwards compatibility)
const ALLOWED_TABLES = [
  'social_posts',
  'blog_posts',
  'content_ideas',
  'emails',
  'email_sequences',
  'lead_magnets',
  'creative_briefs',
  'positioning_angles',
  'brand_voices',
  'landing_pages',
] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

// Tables that have an updated_at column
const HAS_UPDATED_AT = new Set([
  'social_posts', 'blog_posts', 'content_ideas', 'email_sequences',
  'lead_magnets', 'creative_briefs', 'positioning_angles', 'brand_voices',
  'landing_pages',
])

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { table, id } = body as { table: string; id: string }

    // Accept either 'data' or 'fields' — normalise to payload
    const payload = (body.data || body.fields) as Record<string, unknown> | undefined

    if (!table || !id || !payload) {
      return NextResponse.json({ error: 'Missing table, id, or data/fields' }, { status: 400 })
    }

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ error: `Table '${table}' not allowed` }, { status: 403 })
    }

    if (!id.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid id format' }, { status: 400 })
    }

    // Strip read-only fields — never let a client overwrite these
    const { id: _id, client_id: _cid, created_at: _ca, sequence_id: _sid, ...safeFields } =
      payload as Record<string, unknown>
    void _id; void _cid; void _ca; void _sid

    // Only add updated_at if the table has that column (emails does NOT)
    const updatePayload = HAS_UPDATED_AT.has(table)
      ? { ...safeFields, updated_at: new Date().toISOString() }
      : { ...safeFields }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`[update] ${table} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[update] route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
