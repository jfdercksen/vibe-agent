import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/publish/[type] — Trigger publishing for content
// type = 'social' | 'blog' | 'email'
// Body: { postId, clientId, platform? }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const body = await request.json()
    const { postId, clientId, platform } = body

    if (!postId || !clientId) {
      return NextResponse.json(
        { error: 'Missing postId or clientId' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Map content type to table
    const tableMap: Record<string, string> = {
      social: 'social_posts',
      blog: 'blog_posts',
      email: 'emails',
    }

    const table = tableMap[type]
    if (!table) {
      return NextResponse.json(
        { error: `Invalid content type: ${type}` },
        { status: 400 }
      )
    }

    // Verify the record exists and belongs to the client
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', postId)
      .eq('client_id', clientId)
      .single()

    if (fetchError || !record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    // Check if record is in a publishable state
    const publishableStatuses = ['approved', 'scheduled']
    if (!publishableStatuses.includes(record.status)) {
      return NextResponse.json(
        { error: `Cannot publish content with status "${record.status}". Must be approved or scheduled.` },
        { status: 400 }
      )
    }

    // Update status to published
    const updateData: Record<string, unknown> = {
      status: 'published',
      published_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', postId)

    if (updateError) throw updateError

    // TODO: In Phase 3, this is where we trigger the n8n webhook
    // for actual publishing to social platforms / WordPress / Mailchimp
    // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    // await fetch(n8nWebhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type, postId, clientId, platform, record })
    // })

    return NextResponse.json({
      success: true,
      message: `${type} published successfully`,
      postId,
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
