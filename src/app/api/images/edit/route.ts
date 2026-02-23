import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 300  // 5 minutes — image editing is slow, especially at 2K/4K

// ── Image editing via fal.ai Nano Banana Pro (edit) ───────────────────────────
// Uses Google Gemini 3 Pro Image in image-to-image mode
// Takes an existing image URL + text instruction → returns edited image

async function editWithNanoBanana(
  imageUrl: string,
  instruction: string,
  aspectRatio: string,
  numImages: number,
  resolution: string,
  seed?: number
): Promise<{ images: Array<{ url: string; content_type?: string }> }> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  // Submit to the edit endpoint
  const submitRes = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro/edit', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: instruction,
      image_urls: [imageUrl],
      num_images: Math.min(numImages, 4),
      aspect_ratio: aspectRatio || 'auto',
      resolution,
      output_format: 'jpeg',
      safety_tolerance: '4',   // must be string per fal.ai schema
      ...(seed ? { seed } : {}),
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    throw new Error(`Nano Banana edit failed (${submitRes.status}): ${errText}`)
  }

  // Use status_url and response_url directly from the submit response
  // fal.ai returns these without /edit in the path — polling fal-ai/nano-banana-pro/edit/requests/...
  // would 404. Must use the exact URLs returned.
  const queue = await submitRes.json()
  return await pollFalQueue(queue.status_url, queue.response_url, falKey)
}

// ── FLUX Kontext Pro — alternative text-based image editor ────────────────────
// Best for precise text-based edits, style transfers, object changes
async function editWithFluxKontext(
  imageUrl: string,
  instruction: string,
  width: number,
  height: number,
  numImages: number
): Promise<{ images: Array<{ url: string; content_type?: string }> }> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  // FLUX Kontext Pro via fal.ai
  const modelId = 'fal-ai/flux-pro/kontext'

  const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: instruction,
      image_url: imageUrl,
      num_images: Math.min(numImages, 4),
      image_size: { width, height },
      num_inference_steps: 28,
      guidance_scale: 3.5,
      safety_tolerance: '4',
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    throw new Error(`FLUX Kontext edit failed (${submitRes.status}): ${errText}`)
  }

  const queue = await submitRes.json()
  return await pollFalQueue(queue.status_url, queue.response_url, falKey)
}

// ── Poll fal.ai queue using exact URLs from submit response ───────────────────
// IMPORTANT: fal.ai returns status_url and response_url that use the base model
// path (e.g. fal-ai/nano-banana-pro/requests/...) NOT the edit path. Always use
// these exact URLs — never construct them from the model ID.
async function pollFalQueue(
  statusUrl: string,
  responseUrl: string,
  falKey: string
): Promise<{ images: Array<{ url: string; content_type?: string }> }> {
  const startTime = Date.now()
  const maxMs = 240_000  // 4 minutes — image editing typically takes 10-30s

  while (Date.now() - startTime < maxMs) {
    // Adaptive delay: poll fast early, slow down over time
    const elapsed = Date.now() - startTime
    const delay = elapsed < 30_000 ? 3000 : elapsed < 90_000 ? 5000 : 8000
    await new Promise(r => setTimeout(r, delay))

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
    if (!statusRes.ok) {
      console.warn('[fal poll] status check failed:', statusRes.status, await statusRes.text())
      continue
    }

    const status = await statusRes.json()
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      })
      if (!resultRes.ok) throw new Error('Failed to fetch edit result')
      return await resultRes.json()
    } else if (status.status === 'FAILED') {
      throw new Error(`Edit failed: ${status.error || 'Unknown error'}`)
    }
    // IN_QUEUE or IN_PROGRESS — keep polling
  }

  throw new Error('Image edit timed out — please try again')
}

// ── Upload edited image to Supabase Storage ───────────────────────────────────
async function uploadToSupabase(
  imageUrl: string,
  clientId: string,
  label: string
): Promise<string> {
  const supabase = createAdminClient()

  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error('Failed to fetch edited image')
  const buffer = await res.arrayBuffer()
  const blob = new Uint8Array(buffer)

  const path = `${clientId}/ai-edited/${Date.now()}-${label}.jpg`
  const { error } = await supabase.storage
    .from('images')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
  return publicUrl
}

// ── Main Route ─────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      imageUrl,         // The source image URL to edit
      instruction,      // Text instruction: "make the background white", "change shirt to red"
      editModel = 'nano_banana',  // 'nano_banana' | 'flux_kontext'
      aspectRatio = 'auto',
      resolution = '1K',
      numImages = 2,
      width = 1024,
      height = 1024,
      clientId,
      saveToLibrary = true,
      originalAssetId = null,   // ID of the original media_asset being edited
      altText = '',
      tags = [] as string[],
      seed,
    } = body

    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    if (!instruction) return NextResponse.json({ error: 'instruction is required' }, { status: 400 })
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    let result: { images: Array<{ url: string; content_type?: string }> }
    let modelLabel: string

    if (editModel === 'flux_kontext') {
      result = await editWithFluxKontext(imageUrl, instruction, width, height, numImages)
      modelLabel = 'FLUX Kontext Pro'
    } else {
      // Default: Nano Banana Pro edit
      result = await editWithNanoBanana(imageUrl, instruction, aspectRatio, numImages, resolution, seed)
      modelLabel = 'Nano Banana Pro'
    }

    const editedImages = result.images || []
    const savedAssets = []

    if (saveToLibrary && editedImages.length > 0) {
      const supabase = createAdminClient()

      for (let i = 0; i < editedImages.length; i++) {
        const img = editedImages[i]
        try {
          const publicUrl = await uploadToSupabase(img.url, clientId, `edited-${i + 1}`)

          const { data: asset } = await supabase.from('media_assets').insert({
            client_id: clientId,
            asset_type: 'image',
            file_name: `ai-edited-${i + 1}.jpg`,
            file_url: publicUrl,
            mime_type: 'image/jpeg',
            alt_text: altText || `Edited: ${instruction.slice(0, 100)}`,
            tags: [...tags, 'ai-edited', editModel === 'flux_kontext' ? 'flux-kontext' : 'nano-banana'],
            source: 'ai_generated',
            ai_prompt: instruction,
            reference_id: originalAssetId,
            reference_table: originalAssetId ? 'media_assets' : null,
          }).select().single()

          savedAssets.push(asset)
        } catch (err) {
          console.error(`Failed to save edited image ${i}:`, err)
          savedAssets.push({ file_url: img.url, id: null })
        }
      }
    }

    return NextResponse.json({
      success: true,
      modelLabel,
      images: savedAssets.length > 0 ? savedAssets : editedImages.map(img => ({ file_url: img.url })),
      count: editedImages.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image editing failed'
    console.error('[images/edit]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
