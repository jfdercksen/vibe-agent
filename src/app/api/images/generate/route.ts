import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { kieAiGenerate } from '@/lib/kieai'

export const maxDuration = 300  // 5 minutes — high-res generation can be slow

// ── Model Router ──────────────────────────────────────────────────────────────
type ImageUseCase = 'product_photo' | 'social_graphic' | 'logo' | 'blog_header' | 'ad_creative' | 'general'
type Provider = 'fal' | 'replicate' | 'kieai'

interface ModelConfig {
  modelId: string
  label: string
  description: string
  provider: Provider
  isNanoBanana?: boolean   // Nano Banana uses different fal.ai schema
  aspectRatio?: string     // aspect ratio override for this use case
}

// ── All available models (for UI model picker) ─────────────────────────────────
export const ALL_MODELS: Array<{
  id: string; label: string; description: string; provider: Provider;
  useCases: ImageUseCase[]; isNanoBanana?: boolean; aspectRatio?: string
}> = [
  // ── Kie.ai models (DEFAULT routing — cheaper, high quality) ──────────────────

  // Flux-2 Pro via Kie.ai — DEFAULT for product, blog, general
  {
    id: 'flux-2/pro-text-to-image',
    label: 'Flux-2 Pro (Kie.ai)',
    description: 'Flux-2 Pro — photorealistic, great for products & lifestyle ⭐ DEFAULT',
    provider: 'kieai',
    useCases: ['general', 'product_photo', 'blog_header'],
  },
  // Nano Banana 2 via Kie.ai — DEFAULT for ad creative (Gemini Flash, UGC-style)
  {
    id: 'nano-banana-2',
    label: 'Nano Banana 2 (Kie.ai)',
    description: 'Gemini Flash Image — fast, UGC-style lifestyle shots, ad creative ⭐ DEFAULT ad',
    provider: 'kieai',
    aspectRatio: '4:5',
    useCases: ['ad_creative', 'product_photo'],
  },
  // GPT Image 1.5 via Kie.ai — DEFAULT for social graphics (best text rendering)
  {
    id: 'gpt-image/1.5-text-to-image',
    label: 'GPT Image 1.5 (Kie.ai)',
    description: 'GPT-4o Image — #1 for text-on-image, social graphics with headlines ⭐ DEFAULT social',
    provider: 'kieai',
    useCases: ['social_graphic'],
  },
  // Seedream 4.5 via Kie.ai — fashion, beauty, skin-forward lifestyle
  {
    id: 'seedream/4.5-text-to-image',
    label: 'Seedream 4.5 (Kie.ai)',
    description: 'Seedream 4.5 — fashion, beauty, high-detail skin rendering',
    provider: 'kieai',
    useCases: ['product_photo', 'ad_creative'],
  },
  // Flux-2 Flex via Kie.ai — cheaper draft option
  {
    id: 'flux-2/flex-text-to-image',
    label: 'Flux-2 Flex (Kie.ai)',
    description: 'Flux-2 Flex — fast drafts and variants (cheaper than Pro)',
    provider: 'kieai',
    useCases: ['general', 'product_photo'],
  },

  // ── fal.ai models (premium, highest quality) ─────────────────────────────────
  // Nano Banana Pro (fal.ai — Google Gemini 3 Pro — highest quality option)
  {
    id: 'fal-ai/nano-banana-pro',
    label: 'Nano Banana Pro (fal.ai)',
    description: 'Google Gemini 3 Pro Image — premium quality when you need the best',
    provider: 'fal',
    isNanoBanana: true,
    aspectRatio: '1:1',
    useCases: ['general', 'product_photo', 'blog_header', 'ad_creative'],
  },

  // ── Replicate models ─────────────────────────────────────────────────────────
  // Recraft V4 — logos/vectors (no Kie.ai equivalent yet)
  {
    id: 'recraft-ai/recraft-v4',
    label: 'Recraft V4',
    description: 'Recraft V4 — best for logos, brand marks, vector-style images',
    provider: 'replicate',
    useCases: ['logo'],
  },
  {
    id: 'recraft-ai/recraft-v4-svg',
    label: 'Recraft V4 SVG',
    description: 'Recraft V4 SVG — generates production-ready SVG vector files',
    provider: 'replicate',
    useCases: ['logo'],
  },
]

// ── Default model routing ─────────────────────────────────────────────────────
// Kie.ai as default (cheaper) — fal.ai only used as explicit override
const MODEL_MAP: Record<ImageUseCase, ModelConfig> = {
  general:        { modelId: 'flux-2/pro-text-to-image',         label: 'Flux-2 Pro',      description: 'Flux-2 Pro via Kie.ai — photorealistic, general use',      provider: 'kieai', aspectRatio: '1:1'  },
  product_photo:  { modelId: 'flux-2/pro-text-to-image',         label: 'Flux-2 Pro',      description: 'Flux-2 Pro via Kie.ai — clean product shots',               provider: 'kieai', aspectRatio: '1:1'  },
  social_graphic: { modelId: 'gpt-image/1.5-text-to-image',      label: 'GPT Image 1.5',   description: 'GPT-4o Image via Kie.ai — best text-on-image accuracy',      provider: 'kieai', aspectRatio: '1:1'  },
  logo:           { modelId: 'recraft-ai/recraft-v4',            label: 'Recraft V4',      description: 'Logos, brand marks, icons, vectors',                         provider: 'replicate'                  },
  blog_header:    { modelId: 'flux-2/pro-text-to-image',         label: 'Flux-2 Pro',      description: 'Flux-2 Pro via Kie.ai — wide editorial imagery',             provider: 'kieai', aspectRatio: '16:9' },
  ad_creative:    { modelId: 'nano-banana-2',                    label: 'Nano Banana 2',   description: 'Gemini Flash via Kie.ai — UGC-style ad creative',            provider: 'kieai', aspectRatio: '4:5'  },
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
    const selectedModelInfo = ALL_MODELS.find(m => m.id === selectedModelId)
    const isNanoBanana = selectedModelId === 'fal-ai/nano-banana-pro'
    const isKieAi = selectedModelInfo?.provider === 'kieai' ||
      (!isNanoBanana && modelConfig.provider === 'kieai' && !model)
    const isReplicate = selectedModelInfo?.provider === 'replicate' ||
      (!isNanoBanana && !isKieAi && model && !model.startsWith('fal-ai/'))

    // Generate images
    let result: { images: Array<{ url: string; width?: number; height?: number; content_type?: string }> }

    if (isKieAi || selectedModelInfo?.provider === 'kieai') {
      // Kie.ai model — use unified createTask API
      const kieAspectRatio = modelConfig.aspectRatio || '1:1'
      result = await kieAiGenerate({
        model: selectedModelId,
        prompt,
        negativePrompt,
        aspectRatio: kieAspectRatio,
        resolution,
        numImages: count,
      })
    } else if (isNanoBanana) {
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
              isNanoBanana ? 'nano-banana-pro' :
              selectedModelId.includes('nano-banana-2') ? 'nano-banana-2' :
              selectedModelId.includes('gpt-image') ? 'gpt-image' :
              selectedModelId.includes('seedream') ? 'seedream' :
              selectedModelId.includes('flux-2') ? 'flux-2' :
              selectedModelId.includes('ideogram') ? 'ideogram' :
              selectedModelId.includes('recraft') ? 'recraft' :
              selectedModelId.includes('imagen') ? 'imagen' : 'ai',
              // Provider tag for cost tracking
              isKieAi || selectedModelInfo?.provider === 'kieai' ? 'kieai' : isNanoBanana ? 'falai' : isReplicate ? 'replicate' : 'falai',
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
      provider: isKieAi || selectedModelInfo?.provider === 'kieai' ? 'kieai' : isNanoBanana ? 'falai' : isReplicate ? 'replicate' : 'falai',
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
