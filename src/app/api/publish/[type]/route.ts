import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/publish/[type] — Trigger publishing for content via n8n
// type = 'social' | 'blog' | 'email'
// Body: { postId, clientId, platform? }
//
// Flow:
//  1. Verify record exists + belongs to client + status is publishable
//  2. Mark status as 'publishing' in DB (intermediate state)
//  3. Fire n8n webhook with full record data
//  4. n8n publishes to platform, then calls back /api/webhooks/n8n to set status = 'published'
//
// If N8N_WEBHOOK_URL is not configured, falls back to immediately marking as 'published'
// (manual mode — useful while n8n is being set up).

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL  // e.g. https://your.n8n.cloud/webhook/
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET

// Map content type → Supabase table
const TABLE_MAP: Record<string, string> = {
  social: 'social_posts',
  blog:   'blog_posts',
  email:  'emails',
}

// Map content type → n8n webhook path suffix
// n8n workflows listen on these sub-paths under your N8N_WEBHOOK_URL base
const WEBHOOK_PATH_MAP: Record<string, string> = {
  social: 'social-publisher',
  blog:   'blog-publisher',
  email:  'email-publisher',
}

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

    const table = TABLE_MAP[type]
    if (!table) {
      return NextResponse.json(
        { error: `Invalid content type: ${type}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch record + client integrations in parallel
    const [recordResult, clientResult] = await Promise.all([
      supabase.from(table).select('*').eq('id', postId).eq('client_id', clientId).single(),
      supabase.from('clients').select('integrations').eq('id', clientId).single(),
    ])

    if (recordResult.error || !recordResult.data) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const record = recordResult.data
    const integrations = clientResult.data?.integrations || {}

    // Only approved or scheduled posts can be published
    const publishableStatuses = ['approved', 'scheduled']
    if (!publishableStatuses.includes(record.status)) {
      return NextResponse.json(
        { error: `Cannot publish content with status "${record.status}". Must be approved or scheduled.` },
        { status: 400 }
      )
    }

    // Determine n8n webhook URL
    const n8nBase = N8N_WEBHOOK_URL || (integrations as Record<string, Record<string, string>>)?.n8n?.base_url
    const webhookPath = WEBHOOK_PATH_MAP[type]
    const n8nUrl = n8nBase ? `${n8nBase.replace(/\/$/, '')}/${webhookPath}` : null

    if (n8nUrl) {
      // Phase 3: Fire n8n webhook — n8n will publish and call back to update status
      // Mark as 'publishing' immediately so the UI shows in-progress state
      await supabase.from(table).update({ status: 'publishing' }).eq('id', postId)

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (N8N_WEBHOOK_SECRET) {
        headers['X-N8N-Webhook-Secret'] = N8N_WEBHOOK_SECRET
      }

      // Fire and forget — n8n is async, callback will update status
      fetch(n8nUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          postId,
          clientId,
          platform: platform || record.platform,
          record,
          integrations,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/n8n`,
        }),
      }).catch((err) => {
        console.error('[publish] n8n webhook fire failed:', err)
      })

      return NextResponse.json({
        success: true,
        status: 'publishing',
        message: `Publishing ${type} via n8n — check your dashboard for the updated status.`,
        postId,
      })
    } else {
      // No n8n configured — mark directly as published (manual mode)
      console.warn(`[publish] N8N_WEBHOOK_URL not set — marking ${type} as published directly`)
      await supabase.from(table).update({
        status: 'published',
        published_at: new Date().toISOString(),
      }).eq('id', postId)

      return NextResponse.json({
        success: true,
        status: 'published',
        message: `${type} marked as published. (Connect n8n to enable actual platform publishing.)`,
        postId,
      })
    }
  } catch (error) {
    console.error('[publish] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
