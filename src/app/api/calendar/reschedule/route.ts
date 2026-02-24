import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/calendar/reschedule
// Moves a calendar entry to a new date, and syncs the source record if applicable
export async function PATCH(req: NextRequest) {
  try {
    const { id, scheduled_date } = (await req.json()) as {
      id: string
      scheduled_date: string
    }

    if (!id || !id.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid calendar entry id' }, { status: 400 })
    }

    if (!scheduled_date || !scheduled_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json({ error: 'Invalid date format — use YYYY-MM-DD' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── 1. Update the calendar entry ──────────────────────────────
    const { data: calRow, error: calError } = await supabase
      .from('content_calendar')
      .update({ scheduled_date })
      .eq('id', id)
      .select()
      .single()

    if (calError) {
      console.error('[reschedule] calendar update error:', calError)
      return NextResponse.json({ error: calError.message }, { status: 500 })
    }

    // ── 2. Sync the source record if it's a social post ───────────
    if (calRow.reference_id && calRow.reference_table === 'social_posts') {
      const scheduledFor = calRow.scheduled_time
        ? `${scheduled_date}T${calRow.scheduled_time}:00`
        : `${scheduled_date}T09:00:00`

      const { error: syncError } = await supabase
        .from('social_posts')
        .update({
          scheduled_for: scheduledFor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', calRow.reference_id)

      if (syncError) {
        console.error('[reschedule] social_posts sync error:', syncError)
      }
    }

    return NextResponse.json({ data: calRow })
  } catch (err) {
    console.error('[reschedule] route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
