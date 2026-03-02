// Kie.ai API client — image generation and image-to-image editing
// API: https://api.kie.ai/api/v1/jobs/createTask + recordInfo
//
// Confirmed working model IDs (tested against live API):
//   Text-to-image:       nano-banana-2, flux-2/pro-text-to-image, flux-2/flex-text-to-image,
//                        gpt-image/1.5-text-to-image, seedream/4.5-text-to-image,
//                        grok-imagine/text-to-image, qwen/text-to-image
//   Image-to-image:      flux-2/pro-image-to-image, flux-2/flex-image-to-image,
//                        qwen/image-to-image, qwen/image-edit

export interface KieAiGenerateParams {
  model: string
  prompt: string
  negativePrompt?: string
  aspectRatio?: string       // '1:1' | '4:5' | '9:16' | '16:9' | '3:4' | '2:3' | 'auto'
  resolution?: string        // '1K' | '2K' | '4K'
  inputUrls?: string[]       // for image-to-image models
  numImages?: number         // how many to generate (each is a separate task)
}

export interface KieAiImage {
  url: string
}

// ── Submit + poll one Kie.ai task ─────────────────────────────────────────────
// Returns the first result URL from the completed task
async function runSingleTask(
  kieKey: string,
  model: string,
  input: Record<string, unknown>
): Promise<string> {
  // Submit task
  const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${kieKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    throw new Error(`Kie.ai task creation failed (${createRes.status}): ${errText}`)
  }

  const createResult = await createRes.json()
  if (createResult.code !== 200) {
    throw new Error(`Kie.ai error: ${createResult.msg || JSON.stringify(createResult)}`)
  }

  const taskId = createResult.data?.taskId
  if (!taskId) throw new Error('Kie.ai: No taskId in response')

  // Poll for completion
  const startTime = Date.now()
  const maxMs = 240_000 // 4 minutes

  while (Date.now() - startTime < maxMs) {
    const elapsed = Date.now() - startTime
    // Adaptive delay: fast early, slow down to avoid hammering
    const delay = elapsed < 30_000 ? 4000 : elapsed < 90_000 ? 6000 : 10_000
    await new Promise(r => setTimeout(r, delay))

    const pollRes = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${kieKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!pollRes.ok) {
      console.warn(`[kieai] Poll failed (${pollRes.status}) for task ${taskId}`)
      continue
    }

    const pollResult = await pollRes.json()
    const data = pollResult.data || {}
    const state: string = data.state || ''

    if (state === 'success' || state === 'completed') {
      // Parse resultJson to get image URLs
      let resultJson: { resultUrls?: string[] } = {}
      try {
        resultJson = JSON.parse(data.resultJson || '{}')
      } catch {
        // ignore parse errors
      }
      const urls = resultJson.resultUrls || []
      if (urls.length === 0) {
        throw new Error(`Kie.ai task ${taskId} succeeded but returned no URLs`)
      }
      return urls[0]
    }

    if (state === 'failed' || state === 'error') {
      throw new Error(`Kie.ai task ${taskId} failed: ${JSON.stringify(data).slice(0, 200)}`)
    }

    // Still processing (queued / running) — keep polling
    console.log(`[kieai] Task ${taskId} state: ${state || 'pending'} (${Math.round(elapsed / 1000)}s)`)
  }

  throw new Error(`Kie.ai task ${taskId} timed out after 4 minutes`)
}

// ── Public: Generate image(s) ─────────────────────────────────────────────────
// Runs numImages parallel tasks (one task = one image on Kie.ai)
// Returns whichever tasks succeeded (at least one must succeed)
export async function kieAiGenerate(
  params: KieAiGenerateParams
): Promise<{ images: KieAiImage[] }> {
  const kieKey = process.env.KIE_API_KEY
  if (!kieKey) {
    throw new Error('KIE_API_KEY is not configured. Add it to environment variables.')
  }

  const {
    model,
    prompt,
    negativePrompt,
    aspectRatio = '1:1',
    resolution = '1K',
    inputUrls,
    numImages = 1,
  } = params

  // Build the input payload for this model
  const input: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    resolution,
    output_format: 'jpg',
  }
  if (negativePrompt) input.negative_prompt = negativePrompt
  // image-to-image models use input_urls
  if (inputUrls?.length) input.input_urls = inputUrls

  // Run tasks in parallel
  const count = Math.min(numImages, 4)
  const taskPromises = Array.from({ length: count }, () =>
    runSingleTask(kieKey, model, input)
  )

  const results = await Promise.allSettled(taskPromises)

  const images: KieAiImage[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') {
      images.push({ url: r.value })
    } else {
      console.error('[kieai] Task failed:', r.reason)
    }
  }

  if (images.length === 0) {
    throw new Error(`Kie.ai: All ${count} generation tasks failed`)
  }

  return { images }
}

// ── Public: Edit image (image-to-image) ───────────────────────────────────────
// Uses flux-2/pro-image-to-image for style transfer / background changes
export async function kieAiEdit(params: {
  imageUrl: string
  instruction: string
  aspectRatio?: string
  resolution?: string
  numImages?: number
}): Promise<{ images: KieAiImage[] }> {
  const { imageUrl, instruction, aspectRatio = 'auto', resolution = '1K', numImages = 1 } = params

  return kieAiGenerate({
    model: 'flux-2/pro-image-to-image',
    prompt: instruction,
    aspectRatio,
    resolution,
    inputUrls: [imageUrl],
    numImages,
  })
}
