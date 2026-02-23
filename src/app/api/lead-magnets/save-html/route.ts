import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

// POST /api/lead-magnets/save-html
// Body: { clientId, leadMagnetId, htmlContent, htmlType: 'interactive' | 'optin_page' }
// Uploads a self-contained HTML file to Supabase Storage (documents bucket)
// and updates the lead_magnets record with the signed URL.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, leadMagnetId, htmlContent, htmlType } = body as {
      clientId: string
      leadMagnetId: string
      htmlContent: string
      htmlType: 'interactive' | 'optin_page'
    }

    // Validate required fields
    if (!clientId || !leadMagnetId || !htmlContent || !htmlType) {
      return NextResponse.json(
        { error: 'Missing clientId, leadMagnetId, htmlContent, or htmlType' },
        { status: 400 }
      )
    }

    if (htmlType !== 'interactive' && htmlType !== 'optin_page') {
      return NextResponse.json(
        { error: 'htmlType must be "interactive" or "optin_page"' },
        { status: 400 }
      )
    }

    if (!/^[0-9a-f-]{36}$/i.test(leadMagnetId)) {
      return NextResponse.json({ error: 'Invalid leadMagnetId format' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Build storage path: {clientId}/lead-magnets/{type}-{timestamp}.html
    // Mirrors the convention in /api/media/upload/route.ts
    const timestamp = Date.now()
    const typePrefix = htmlType === 'interactive' ? 'interactive' : 'optin-page'
    const storagePath = `${clientId}/lead-magnets/${typePrefix}-${timestamp}.html`

    // Convert HTML string → Uint8Array for upload
    const encoder = new TextEncoder()
    const buffer = encoder.encode(htmlContent)

    // Upload to documents bucket (private)
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'text/html',
        upsert: false,
      })

    if (uploadError) {
      console.error('[lead-magnets/save-html] Storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Generate signed URL valid for 10 years (matches /api/media/upload pattern)
    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10)

    if (signError || !signedData) {
      console.error('[lead-magnets/save-html] Sign URL error:', signError)
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    const fileUrl = signedData.signedUrl

    // Determine which column to update
    const columnName = htmlType === 'interactive' ? 'interactive_url' : 'optin_page_url'

    // Update the lead_magnets record — scoped to client for security
    const { data: updatedRecord, error: dbError } = await supabase
      .from('lead_magnets')
      .update({
        [columnName]: fileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadMagnetId)
      .eq('client_id', clientId)
      .select('id, interactive_url, optin_page_url, status')
      .single()

    if (dbError) {
      console.error('[lead-magnets/save-html] DB error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      url: fileUrl,
      leadMagnetId,
      htmlType,
      record: updatedRecord,
    })
  } catch (err) {
    console.error('[lead-magnets/save-html] Error:', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
