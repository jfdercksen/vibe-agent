import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/webhooks/n8n — Receive callbacks from n8n workflows
// Used by n8n to update record statuses after publishing, image generation, etc.
//
// Expected body format:
// {
//   action: 'update_status' | 'add_media' | 'update_field',
//   table: 'social_posts' | 'blog_posts' | 'emails' | 'media_assets',
//   record_id: 'uuid',
//   data: { ... }  // fields to update
// }

const VALID_TABLES = [
  'social_posts', 'blog_posts', 'emails', 'media_assets',
  'email_sequences', 'content_ideas', 'content_calendar',
  'keyword_research', 'lead_magnets', 'creative_briefs',
]

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional, configure in n8n)
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.N8N_WEBHOOK_SECRET && webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, table, record_id, data } = body

    if (!action || !table || !record_id) {
      return NextResponse.json(
        { error: 'Missing required fields: action, table, record_id' },
        { status: 400 }
      )
    }

    if (!VALID_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table: ${table}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    switch (action) {
      case 'update_status': {
        if (!data?.status) {
          return NextResponse.json({ error: 'Missing status in data' }, { status: 400 })
        }
        const { error } = await supabase
          .from(table)
          .update({ status: data.status, ...data })
          .eq('id', record_id)

        if (error) throw error
        break
      }

      case 'update_field': {
        if (!data || Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'Missing data fields' }, { status: 400 })
        }
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', record_id)

        if (error) throw error
        break
      }

      case 'add_media': {
        // Create a new media_assets record (e.g., after image generation)
        if (!data?.file_url || !data?.file_name || !data?.client_id) {
          return NextResponse.json(
            { error: 'Missing required media data: file_url, file_name, client_id' },
            { status: 400 }
          )
        }
        const { error } = await supabase
          .from('media_assets')
          .insert({
            client_id: data.client_id,
            file_name: data.file_name,
            file_url: data.file_url,
            asset_type: data.asset_type || 'image',
            source: data.source || 'ai_generated',
            ai_prompt: data.ai_prompt,
            alt_text: data.alt_text,
            mime_type: data.mime_type,
            file_size: data.file_size,
            tags: data.tags || [],
            reference_table: data.reference_table,
            reference_id: data.reference_id || record_id,
          })

        if (error) throw error

        // Optionally update the referenced record with the image URL
        if (data.reference_table && record_id) {
          const imageField = data.reference_table === 'blog_posts'
            ? 'featured_image_url'
            : 'image_url'

          await supabase
            .from(data.reference_table)
            .update({ [imageField]: data.file_url })
            .eq('id', record_id)
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Action "${action}" completed successfully`,
    })
  } catch (error) {
    console.error('n8n webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
