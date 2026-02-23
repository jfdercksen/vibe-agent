import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/media/delete
// Body: { id: string, clientId: string }
export async function DELETE(req: NextRequest) {
  try {
    const { id, clientId } = await req.json()
    if (!id || !clientId) {
      return NextResponse.json({ error: 'Missing id or clientId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get the asset record first so we can delete from storage too
    const { data: asset, error: fetchErr } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId) // security: only delete assets owned by this client
      .single()

    if (fetchErr || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Try to delete from storage (best-effort — don't fail if already gone)
    try {
      const bucketMap: Record<string, string> = {
        image: 'images',
        graphic: 'images',
        video: 'videos',
        logo: 'brand-assets',
        font: 'brand-assets',
        document: 'documents',
        voice_note: 'voice-notes',
      }
      const bucket = bucketMap[asset.asset_type || 'document'] || 'documents'
      // Extract storage path from the URL
      const url = asset.file_url as string
      const pathMatch = url.match(/\/storage\/v1\/(?:object\/public|sign)\/.+?\/(.+?)(\?|$)/)
      if (pathMatch) {
        await supabase.storage.from(bucket).remove([pathMatch[1]])
      }
    } catch {
      // Non-fatal — still delete the DB record
    }

    // Delete the DB record
    const { error: deleteErr } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[media/delete] Error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
