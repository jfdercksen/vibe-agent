import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 300  // 5 minutes — high-res generation can be slow

// ── Model Router ──────────────────────────────────────────────────────────────
type ImageUseCase = 'product_photo' | 'social_graphic' | 'logo' | 'blog_header' | 'ad_creative' | 'general'
type Provider = 'fal' | 'replicate'

interface ModelConfig {
  modelId: string
  label: string
  description: string
  provider: Provider
  isNanoBanana?: boolean   // Nano Banana uses different fal.ai schema
  aspectRatio?: string     // for Nano Banana
}

// ── All available models (for UI model picker) ─────────────────────────────────
export const ALL_MODELS: Array<{
  id: string; label: string; description: string; provider: Provider;
  useCases: ImageUseCase[]; isNanoBanana?: boolean; aspectRatio?: string
}> = [
  // Nano Banana Pro (DEFAULT — Google Gemini 3 Pro Image)
  {
    id: 'fal-ai/nano-banana-pro',
    label: 'Nano Banana Pro',
    description: 'Google Gemini 3 Pro Image — highest quality, best all-round ⭐ DEFAULT',
    provider: 'fal',
    isNanoBanana: true,
    aspectRatio: '1:1',
    useCases: ['general', 'product_photo', 'blog_header', 'ad_creative'],
  },
  // Google Imagen 4 Ultra (via Replicate)
  {
    id: 'google/imagen-4-ultra',
    label: 'Imagen 4 Ultra',
    description: 'Google Imagen 4 Ultra — flagship quality, exceptional detail',
    provider: 'replicate',
    useCases: ['product_photo', 'ad_creative', 'general'],
  },
  // Google Imagen 4 (via Replicate) — faster/cheaper than Ultra
  {
    id: 'google/imagen-4',
    label: 'Imagen 4',
    description: 'Google Imagen 4 — great quality, faster than Ultra',
    provider: 'replicate',
    useCases: ['general', 'product_photo', 'blog_header'],
  },
  // FLUX 2 Pro (via Replicate)
  {
    id: 'black-forest-labs/flux-2-pro',
    label: 'FLUX 2 Pro',
    description: 'FLUX 2 Pro — photorealistic, excellent for people & products',
    provider: 'replicate',
    useCases: ['product_photo', 'ad_creative', 'blog_header'],
  },
  // Ideogram V3 Quality (via Replicate) — text-on-image king
  {
    id: 'ideogram-ai/ideogram-v3-quality',
    label: 'Ideogram V3 Quality',
    description: 'Ideogram V3 — #1 for text-on-image, social graphics with headlines',
    provider: 'replicate',
    useCases: ['social_graphic'],
  },
  // Ideogram V3 Turbo (via Replicate) — cheaper text-on-image
  {
    id: 'ideogram-ai/ideogram-v3-turbo',
    label: 'Ideogram V3 Turbo',
    description: 'Ideogram V3 Turbo — fast text-on-image ($0.03/img)',
    provider: 'replicate',
    useCases: ['social_graphic'],
  },
  // Recraft V4 (via Replicate) — best for logos/vectors
  {
    id: 'recraft-ai/recraft-v4',
    label: 'Recraft V4',
    description: 'Recraft V4 — best for logos, brand marks, vector-style images',
    provider: 'replicate',
    useCases: ['logo'],
  },
  // Recraft V4 SVG (via Replicate) — actual SVG output
  {
    id: 'recraft-ai/recraft-v4-svg',
    label: 'Recraft V4 SVG',
    description: 'Recraft V4 SVG — generates production-ready SVG vector files',
    provider: 'replicate',
    useCases: ['logo'],
  },
]

// Nano Banana Pro is the DEFAULT for all use cases — best quality overall.
// Only route to specialist models when Nano Banana isn't ideal for the task.
const MODEL_MAP: Record<ImageUseCase, ModelConfig> = {
  general:        { modelId: 'fal-ai/nano-banana-pro',  label: 'Nano Banana Pro',        description: 'Google Gemini 3 Pro — best all-round quality',          provider: 'fal',       isNanoBanana: true, aspectRatio: '1:1'  },
  product_photo:  { modelId: 'fal-ai/nano-banana-pro',  label: 'Nano Banana Pro',        description: 'Google Gemini 3 Pro — photorealistic studio shots',      provider: 'fal',       isNanoBanana: true, aspectRatio: '1:1'  },
  social_graphic: { modelId: 'ideogram-ai/ideogram-v3-turbo', label: 'Ideogram V3 Turbo', description: 'Best for text-on-image & social graphics',             provider: 'replicate'                                        },
  logo:           { modelId: 'recraft-ai/recraft-v4',   label: 'Recraft V4',             description: 'Logos, brand marks, icons, vectors',                    provider: 'replicate'                                        },
  blog_header:    { modelId: 'fal-ai/nano-banana-pro',  label: 'Nano Banana Pro',        description: 'Google Gemini 3 Pro — wide editorial imagery',           provider: 'fal',       isNanoBanana: true, aspectRatio: '16:9' },
  ad_creative:    { modelId: 'fal-ai/nano-banana-pro',  label: 'Nano Banana Pro',        description: 'Google Gemini 3 Pro — premium ad creative',              provider: 'fal',       isNanoBanana: true, aspectRatio: '4:5'  },
}

// Aspect ratios for non-Nano-Banana models (width x height)
const SIZE_MAP: Record<ImageUseCase, { width: number; height: number }> = {
  general:        { width: 1024, height: 1024 },
  product_photo:  { width: 1024, height: 1024 },
  social_graphic: { width: 1080, height: 1080 },
  logo:           { width: 1024, height: 1024 },
  blog_header:    { width: 1792, height: 1024 },
  ad_creative:    { width: 1080, height: 1350 },
}

// ── Replicate API Call ────────────────────────────────────────────────────────
// Handles any model on Replicate via their predictions REST API
async function callReplicateApi(
  modelId: string,
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  numImages: number
): Promise<{ images: Array<{ url: string; content_type?: string }> }> {
  const replicateKey = process.env.REPLICATE_API_KEY
  if (!replicateKey) throw new Error('REPLICATE_API_KEY not configured')

  // Submit prediction with Prefer: wait for synchronous response (up to 60s)
  const submitRes = await fetch(`https://api.replicate.com/v1/models/${modelId}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${replicateKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt,
        negative_prompt: negativePrompt || undefined,
        width,
        height,
        num_outputs: Math.min(numImages, 4),
        // Common params that most models support
        output_format: 'jpg',
        output_quality: 90,
      },
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    throw new Error(`Replicate submit failed (${submitRes.status}): ${errText}`)
  }

  const prediction = await submitRes.json()

  // If synchronous (Prefer: wait) — may already be succeeded
  if (prediction.status === 'succeeded' && prediction.output) {
    const urls = Array.isArray(prediction.output) ? prediction.output : [prediction.output]
    return { images: urls.map((url: string) => ({ url })) }
  }

  // Otherwise poll
  const predictionId = prediction.id
  const startTime = Date.now()
  const maxMs = 240_000  // 4 minutes

  while (Date.now() - startTime < maxMs) {
    const elapsed = Date.now() - startTime
    const delay = elapsed < 30_000 ? 3000 : elapsed < 90_000 ? 5000 : 8000
    await new Promise(r => setTimeout(r, delay))

    const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${replicateKey}` },
    })

    if (!statusRes.ok) continue
    const status = await statusRes.json()

    if (status.status === 'succeeded' && status.output) {
      const urls = Array.isArray(status.output) ? status.output : [status.output]
      return { images: urls.map((url: string) => ({ url })) }
    } else if (status.status === 'failed') {
      throw new Error(`Replicate generation failed: ${status.error || 'Unknown error'}`)
    }
  }

  throw new Error('Replicate generation timed out')
}

// ── Nano Banana Pro API Call (fal.ai queue) ────────────────────────────────────
async function callNanoBanana(
  prompt: string,
  aspectRatio: string,
  numImages: number,
  resolution: string,
  seed?: number
): Promise<{ images: Array<{ url: string; width?: number; height?: number; content_type?: string }> }> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  const modelId = 'fal-ai/nano-banana-pro'

  const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      num_images: numImages,
      aspect_ratio: aspectRatio,
      resolution,          // '1K' | '2K' | '4K'
      output_format: 'jpeg',
      safety_tolerance: '4', // must be string per fal.ai schema
      ...(seed ? { seed } : {}),
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    console.warn(`Nano Banana submit failed (${submitRes.status}): ${errText}`)
    throw new Error(`Nano Banana generation failed: ${errText}`)
  }

  // Use status_url/response_url from submit response — don't construct from model ID
  const queue = await submitRes.json()
  return await pollFalResult(queue.status_url, queue.response_url, falKey)
}

// ── Generic fal.ai API Call ────────────────────────────────────────────────────
async function callFalApi(
  modelId: string,
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  numImages: number,
  seed?: number
): Promise<{ images: Array<{ url: string; width?: number; height?: number }> }> {
  const falKey = process.env.FAL_API_KEY
  if (!falKey) throw new Error('FAL_API_KEY not configured')

  const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt || undefined,
      image_size: { width, height },
      num_images: numImages,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
      ...(seed ? { seed } : {}),
    }),
  })

  if (!submitRes.ok) {
    const errText = await submitRes.text()
    throw new Error(`fal.ai submit failed (${submitRes.status}): ${errText}`)
  }

  // Use status_url/response_url from submit response — don't construct from model ID
  const queue = await submitRes.json()
  return await pollFalResult(queue.status_url, queue.response_url, falKey)
}

// ── Poll fal.ai queue using exact URLs from the submit response ────────────────
// IMPORTANT: Always use status_url and response_url returned by the submit call.
// Constructing URLs from model IDs can fail (e.g. /edit endpoints return base paths).
async function pollFalResult(
  statusUrl: string,
  responseUrl: string,
  falKey: string
): Promise<{ images: Array<{ url: string; width?: number; height?: number }> }> {
  const startTime = Date.now()
  const maxMs = 240_000  // 4 min — generation typically takes 5-30s

  while (Date.now() - startTime < maxMs) {
    // Adaptive delay: poll fast early, slow down over time
    const elapsed = Date.now() - startTime
    const delay = elapsed < 30_000 ? 3000 : elapsed < 90_000 ? 5000 : 8000
    await new Promise(r => setTimeout(r, delay))

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })

    if (!statusRes.ok) {
      console.warn('[fal poll] status check failed:', statusRes.status)
      continue
    }
    const status = await statusRes.json()

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      })
      if (!resultRes.ok) throw new Error('Failed to fetch result')
      return await resultRes.json()
    } else if (status.status === 'FAILED') {
      throw new Error(`Generation failed: ${status.error || 'Unknown error'}`)
    }
    // IN_QUEUE or IN_PROGRESS — keep polling
  }

  throw new Error('Generation timed out — please try again')
}

// ── Upload Generated Image to Supabase Storage ─────────────────────────────────
async function uploadToSupabase(
  imageUrl: string,
  clientId: string,
  fileName: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  const supabase = createAdminClient()

  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error('Failed to fetch generated image from fal.ai')
  const buffer = await res.arrayBuffer()
  const blob = new Uint8Array(buffer)

  const ext = mimeType === 'image/png' ? 'png' : 'jpg'
  const path = `${clientId}/ai-generated/${Date.now()}-${fileName}.${ext}`
  const { error } = await supabase.storage
    .from('images')
    .upload(path, blob, { contentType: mimeType, upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
  return publicUrl
}

// ── Main Route ─────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      useCase = 'general' as ImageUseCase,
      model,              // optional model override
      negativePrompt = 'blurry, low quality, distorted, watermark, ugly, deformed',
      numImages = 2,
      resolution = '1K',  // for Nano Banana: '1K' | '2K' | '4K'
      clientId,
      saveToLibrary = true,
      altText = '',
      tags = [] as string[],
      referenceTable = null,
      referenceId = null,
      seed,
    } = body

    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    if (!clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })

    const useCaseKey = useCase as ImageUseCase
    const modelConfig = MODEL_MAP[useCaseKey] || MODEL_MAP.general
    const selectedModelId = model || modelConfig.modelId
    const size = SIZE_MAP[useCaseKey] || SIZE_MAP.general
    const count = Math.min(numImages, 4)

    // Determine provider and model type
    // Check if the selected model (override or default) is Nano Banana
    const isNanoBanana = selectedModelId === 'fal-ai/nano-banana-pro'
    // Check if the selected model is a Replicate model
    const selectedModelInfo = ALL_MODELS.find(m => m.id === selectedModelId)
    const isReplicate = selectedModelInfo?.provider === 'replicate' ||
      (!isNanoBanana && model && !model.startsWith('fal-ai/'))

    // Generate images
    let result: { images: Array<{ url: string; width?: number; height?: number; content_type?: string }> }

    if (isNanoBanana) {
      // Nano Banana Pro — fal.ai with its own schema
      const nbAspectRatio = model ? '1:1' : (modelConfig.aspectRatio || '1:1')
      result = await callNanoBanana(prompt, nbAspectRatio, count, resolution, seed)
    } else if (isReplicate || modelConfig.provider === 'replicate') {
      // Replicate model
      result = await callReplicateApi(
        selectedModelId,
        prompt,
        negativePrompt,
        size.width,
        size.height,
        count
      )
    } else {
      // Generic fal.ai model
      result = await callFalApi(
        selectedModelId,
        prompt,
        negativePrompt,
        size.width,
        size.height,
        count,
        seed
      )
    }

    const generatedImages = result.images || []

    // Upload to Supabase + save media_assets records
    const savedAssets = []
    if (saveToLibrary && generatedImages.length > 0) {
      const supabase = createAdminClient()

      for (let i = 0; i < generatedImages.length; i++) {
        const img = generatedImages[i]
        try {
          const mimeType = img.content_type || 'image/jpeg'
          const publicUrl = await uploadToSupabase(img.url, clientId, `gen-${i + 1}`, mimeType)

          const { data: asset } = await supabase.from('media_assets').insert({
            client_id: clientId,
            asset_type: 'image',
            file_name: `ai-gen-${useCaseKey}-${i + 1}.jpg`,
            file_url: publicUrl,
            mime_type: mimeType,
            alt_text: altText || prompt.slice(0, 120),
            tags: [...tags, 'ai-generated', useCaseKey.replace('_', '-'),
              isNanoBanana ? 'nano-banana' :
              (selectedModelId.includes('ideogram') ? 'ideogram' :
              (selectedModelId.includes('recraft') ? 'recraft' :
              (selectedModelId.includes('imagen') ? 'imagen' : 'flux')))
            ],
            source: 'ai_generated',
            ai_prompt: prompt,
            reference_table: referenceTable,
            reference_id: referenceId,
          }).select().single()

          savedAssets.push(asset)
        } catch (err) {
          console.error(`Failed to save image ${i}:`, err)
          // Return raw URL as fallback
          savedAssets.push({ file_url: img.url, id: null })
        }
      }
    }

    return NextResponse.json({
      success: true,
      model: selectedModelId,
      modelLabel: modelConfig.label,
      useCase: useCaseKey,
      isNanoBanana,
      images: savedAssets.length > 0 ? savedAssets : generatedImages.map(img => ({ file_url: img.url })),
      count: generatedImages.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Image generation failed'
    console.error('[images/generate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── GET: return available models ───────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    defaultModel: 'Nano Banana Pro (Google Gemini 3 Pro)',
    allModels: ALL_MODELS,
    routing: Object.entries(MODEL_MAP).map(([useCase, config]) => ({
      useCase,
      modelId: config.modelId,
      label: config.label,
      description: config.description,
      provider: config.provider,
      isDefault: config.isNanoBanana === true,
      size: SIZE_MAP[useCase as ImageUseCase],
    })),
  })
}
