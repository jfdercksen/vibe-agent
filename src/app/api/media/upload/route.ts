import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60 // allow up to 60s for large uploads

// Map mime types to Supabase buckets and asset_type values
function getBucketAndType(mimeType: string, isLogo: boolean): {
  bucket: string
  assetType: string
} {
  if (isLogo) return { bucket: 'brand-assets', assetType: 'logo' }
  if (mimeType.startsWith('image/')) return { bucket: 'images', assetType: 'image' }
  if (mimeType.startsWith('video/')) return { bucket: 'videos', assetType: 'video' }
  if (mimeType === 'application/pdf') return { bucket: 'documents', assetType: 'document' }
  if (mimeType.includes('word') || mimeType.includes('document')) return { bucket: 'documents', assetType: 'document' }
  return { bucket: 'documents', assetType: 'document' }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const clientId = formData.get('clientId') as string | null
    const isLogo = formData.get('isLogo') === 'true'
    const altText = formData.get('altText') as string | null
    const tags = formData.get('tags') as string | null

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Missing file or clientId' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { bucket, assetType } = getBucketAndType(file.type, isLogo)

    // Build a unique storage path: clientId/timestamp-filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${clientId}/${timestamp}-${safeName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[media/upload] Storage error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL (for public buckets: images, videos)
    // For private buckets (brand-assets, documents): create a signed URL
    let fileUrl = ''
    const publicBuckets = ['images', 'videos']
    if (publicBuckets.includes(bucket)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      fileUrl = data.publicUrl
    } else {
      // Signed URL valid for 10 years (brand assets / logos don't change often)
      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 10)
      if (signError || !data) {
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
      }
      fileUrl = data.signedUrl
    }

    // Save record to media_assets table
    const { data: asset, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        client_id: clientId,
        asset_type: assetType,
        file_name: file.name,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
        alt_text: altText || null,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        source: 'upload',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[media/upload] DB error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // If this is a logo, also update clients.branding.logo_url
    if (isLogo) {
      const { data: client } = await supabase
        .from('clients')
        .select('branding')
        .eq('id', clientId)
        .single()

      const existingBranding = (client?.branding as Record<string, unknown>) || {}
      await supabase
        .from('clients')
        .update({
          branding: { ...existingBranding, logo_url: fileUrl },
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
    }

    return NextResponse.json({ asset, fileUrl })
  } catch (err) {
    console.error('[media/upload] Error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
