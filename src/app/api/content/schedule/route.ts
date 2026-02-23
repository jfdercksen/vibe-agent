import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/content/schedule
// Creates/updates a content_calendar row AND updates the source record status to 'scheduled'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clientId,
      table,         // 'social_posts' | 'blog_posts'
      id,            // UUID of the content record
      contentType,   // 'social' | 'blog' | 'email' | 'video'
      title,
      platform,
      scheduledDate, // 'YYYY-MM-DD'
      scheduledTime, // 'HH:MM' or null/undefined
    } = body as {
      clientId: string
      table: string
      id: string
      contentType: string
      title: string
      platform?: string
      scheduledDate: string
      scheduledTime?: string
    }

    if (!clientId || !table || !id || !contentType || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: 'Invalid date format — use YYYY-MM-DD' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── 1. Upsert the content_calendar row ─────────────────────────────────
    // Try upsert first; if the unique constraint on (reference_id, reference_table) doesn't
    // exist in the DB, fall back to delete-then-insert.
    const calendarPayload = {
      client_id: clientId,
      content_type: contentType,
      reference_id: id,
      reference_table: table,
      title: title || null,
      platform: platform || null,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || null,
      status: 'scheduled' as const,
    }

    // Try update existing calendar entry first
    const { data: existing } = await supabase
      .from('content_calendar')
      .select('id')
      .eq('reference_id', id)
      .eq('reference_table', table)
      .maybeSingle()

    let calRow
    if (existing) {
      const { data, error } = await supabase
        .from('content_calendar')
        .update({
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime || null,
          title: title || null,
          platform: platform || null,
          status: 'scheduled',
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) {
        console.error('Calendar update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      calRow = data
    } else {
      const { data, error } = await supabase
        .from('content_calendar')
        .insert(calendarPayload)
        .select()
        .single()
      if (error) {
        console.error('Calendar insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      calRow = data
    }

    // ── 2. Update the source record status + scheduled date ─────────────────
    const scheduledFor = scheduledTime
      ? `${scheduledDate}T${scheduledTime}:00`
      : `${scheduledDate}T09:00:00`

    if (table === 'social_posts') {
      const { error } = await supabase
        .from('social_posts')
        .update({
          scheduled_for: scheduledFor,
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) console.error('social_posts update error:', error)
    }

    if (table === 'blog_posts') {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'approved', // blog uses 'approved' before publishing, not 'scheduled'
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) console.error('blog_posts update error:', error)
    }

    return NextResponse.json({ calendar: calRow, scheduledFor })
  } catch (err) {
    console.error('Schedule route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
