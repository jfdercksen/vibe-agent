import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// PATCH /api/media/update
// Body: { id, clientId, altText?, tags?, setAsLogo? }
export async function PATCH(req: NextRequest) {
  try {
    const { id, clientId, altText, tags, setAsLogo } = await req.json()
    if (!id || !clientId) {
      return NextResponse.json({ error: 'Missing id or clientId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Build update payload
    const updatePayload: Record<string, unknown> = {}
    if (altText !== undefined) updatePayload.alt_text = altText || null
    if (tags !== undefined) updatePayload.tags = Array.isArray(tags) ? tags : []

    // Update media_assets if there's anything to update
    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase
        .from('media_assets')
        .update(updatePayload)
        .eq('id', id)
        .eq('client_id', clientId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If setAsLogo, update the client's branding.logo_url
    if (setAsLogo) {
      const { data: asset } = await supabase
        .from('media_assets')
        .select('file_url')
        .eq('id', id)
        .single()

      if (asset) {
        const { data: client } = await supabase
          .from('clients')
          .select('branding')
          .eq('id', clientId)
          .single()

        const existingBranding = (client?.branding as Record<string, unknown>) || {}
        await supabase
          .from('clients')
          .update({
            branding: { ...existingBranding, logo_url: asset.file_url },
            updated_at: new Date().toISOString(),
          })
          .eq('id', clientId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[media/update] Error:', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
