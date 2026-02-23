import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/media?clientId=X&type=image
 * Returns media assets for the library picker in ImageGeneratorPanel.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const clientId = searchParams.get('clientId')
  const assetType = searchParams.get('type') // 'image', 'video', etc.
  const search = searchParams.get('search')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('media_assets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (assetType) {
    query = query.eq('asset_type', assetType)
  }

  if (search) {
    query = query.ilike('file_name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[media/list] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assets: data || [] })
}
