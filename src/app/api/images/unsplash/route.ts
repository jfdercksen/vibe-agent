import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Unsplash API — search + import photos
// https://unsplash.com/documentation

interface UnsplashPhoto {
  id: string
  description: string | null
  alt_description: string | null
  width: number
  height: number
  urls: { raw: string; full: string; regular: string; small: string; thumb: string }
  user: { name: string; username: string }
  links: { html: string; download_location: string }
}

// Trigger a download event (required by Unsplash API guidelines)
async function triggerDownload(downloadLocation: string, accessKey: string) {
  try {
    await fetch(`${downloadLocation}?client_id=${accessKey}`)
  } catch { /* non-critical */ }
}

// ── GET: search Unsplash ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const orientation = searchParams.get('orientation') || '' // landscape, portrait, squarish

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return NextResponse.json({ error: 'Unsplash not configured' }, { status: 500 })

  if (!query) return NextResponse.json({ error: 'q is required' }, { status: 400 })

  const params = new URLSearchParams({
    query,
    page: page.toString(),
    per_page: Math.min(perPage, 30).toString(),
    ...(orientation ? { orientation } : {}),
  })

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      'Authorization': `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Unsplash API error: ${err}` }, { status: res.status })
  }

  const data = await res.json()

  // Normalize response
  const photos = (data.results as UnsplashPhoto[]).map(photo => ({
    id: photo.id,
    description: photo.description || photo.alt_description || '',
    width: photo.width,
    height: photo.height,
    urls: {
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
    },
    photographer: photo.user.name,
    photographerUrl: `https://unsplash.com/@${photo.user.username}`,
    unsplashUrl: photo.links.html,
    downloadLocation: photo.links.download_location,
  }))

  return NextResponse.json({
    photos,
    total: data.total,
    totalPages: data.total_pages,
    page,
    perPage,
  })
}

// ── POST: import a photo to the media library ──────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { photoId, downloadLocation, regularUrl, description, clientId, tags = [] } = body

  if (!photoId || !clientId || !regularUrl) {
    return NextResponse.json({ error: 'photoId, clientId, regularUrl are required' }, { status: 400 })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return NextResponse.json({ error: 'Unsplash not configured' }, { status: 500 })

  try {
    // Per Unsplash guidelines — trigger download event
    if (downloadLocation) await triggerDownload(downloadLocation, accessKey)

    const supabase = createAdminClient()

    // Fetch the image and upload to our Supabase Storage
    const imgRes = await fetch(regularUrl)
    if (!imgRes.ok) throw new Error('Failed to fetch Unsplash image')
    const buffer = await imgRes.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    const path = `${clientId}/unsplash/${Date.now()}-${photoId}.jpg`
    const { error: storageError } = await supabase.storage
      .from('images')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false })

    if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`)

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)

    // Save to media_assets
    const { data: asset, error: dbError } = await supabase.from('media_assets').insert({
      client_id: clientId,
      asset_type: 'image',
      file_name: `unsplash-${photoId}.jpg`,
      file_url: publicUrl,
      mime_type: 'image/jpeg',
      alt_text: description || `Photo from Unsplash`,
      tags: [...tags, 'unsplash', 'stock-photo'],
      source: 'scraped', // closest available source type
      ai_prompt: null,
    }).select().single()

    if (dbError) throw new Error(`DB save failed: ${dbError.message}`)

    return NextResponse.json({ success: true, asset })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
