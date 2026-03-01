import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Allow up to 5 minutes for long agentic loops (Stage 2 research, Stage 4 positioning)
export const maxDuration = 300
import { buildSystemPrompt } from '@/lib/tools/system-prompt'
import { ALL_TOOLS, ToolName } from '@/lib/tools/tool-definitions'
import { perplexitySearch } from '@/lib/tools/perplexity'
import { firecrawlScrape, firecrawlCrawl } from '@/lib/tools/firecrawl'
import { getKeywordData, getSerpResults, getKeywordSuggestions } from '@/lib/tools/dataforseo'
import {
  startBatch,
  saveContent,
  updateContent,
  getClientContext,
  getExistingContent,
  updateClientOnboardingStage,
  saveChatMessage,
  getChatHistory,
  checkKeywordsExist,
  ContentTable,
} from '@/lib/tools/supabase-tools'

// Instantiate inside request handler — not at module level — so env vars are loaded
function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  return new Anthropic({
    apiKey,
    timeout: 280000, // 280 seconds — just under our 300s maxDuration
  })
}

// Retry wrapper for Anthropic API calls — handles overloaded_error with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 2000
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isOverloaded =
        (err instanceof Error && err.message.includes('overloaded')) ||
        (typeof err === 'object' && err !== null && 'error' in err &&
          typeof (err as Record<string, unknown>).error === 'object' &&
          (err as { error: { type?: string } }).error?.type === 'overloaded_error')

      if (!isOverloaded || attempt === maxAttempts) throw err

      const delay = baseDelayMs * Math.pow(2, attempt - 1) // 2s, 4s, 8s
      console.warn(`[chat] Anthropic overloaded (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// Execute a tool call from Claude
async function executeTool(
  toolName: ToolName,
  toolInput: Record<string, unknown>,
  clientId: string
): Promise<unknown> {
  switch (toolName) {
    case 'perplexity_search':
      return await perplexitySearch(
        toolInput.query as string,
        (toolInput.focus as 'web' | 'news' | 'finance' | 'academic') || 'web'
      )

    case 'firecrawl_scrape':
      return await firecrawlScrape(toolInput.url as string)

    case 'firecrawl_crawl':
      return await firecrawlCrawl(
        toolInput.url as string,
        (toolInput.maxPages as number) || 5
      )

    case 'dataforseo_keywords':
      return await getKeywordData(
        toolInput.keywords as string[],
        (toolInput.locationCode as number) || 2840
      )

    case 'dataforseo_serp':
      return await getSerpResults(
        toolInput.keyword as string,
        (toolInput.locationCode as number) || 2840
      )

    case 'dataforseo_keyword_suggestions':
      return await getKeywordSuggestions(
        toolInput.seedKeyword as string,
        (toolInput.locationCode as number) || 2840,
        (toolInput.limit as number) || 20
      )

    case 'start_batch':
      return startBatch(toolInput.label as string)

    case 'save_content': {
      const data = { ...(toolInput.data as Record<string, unknown>), client_id: clientId }
      const result = await saveContent(toolInput.table as ContentTable, data)
      // For email_sequences, make the returned ID extra explicit so Claude can use it for the emails step
      if (toolInput.table === 'email_sequences') {
        return {
          ...result,
          sequence_id: result.id,
          message: `Email sequence saved. Use sequence_id="${result.id}" when saving individual emails to the 'emails' table.`,
        }
      }
      return result
    }

    case 'update_client':
      return await updateContent(
        'clients' as ContentTable,
        clientId,
        toolInput.data as Record<string, unknown>
      )

    case 'update_content':
      return await updateContent(
        toolInput.table as ContentTable,
        toolInput.id as string,
        toolInput.data as Record<string, unknown>
      )

    case 'get_existing_content':
      return await getExistingContent(
        clientId,
        toolInput.table as ContentTable,
        (toolInput.limit as number) || 20
      )

    case 'generate_image': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: toolInput.prompt,
          useCase: toolInput.useCase || 'general',
          negativePrompt: toolInput.negativePrompt || 'blurry, low quality, distorted, watermark, text overlay',
          numImages: toolInput.numImages || 2,
          clientId,
          saveToLibrary: true,
          altText: toolInput.altText || '',
          tags: toolInput.tags || [],
          referenceTable: toolInput.referenceTable || null,
          referenceId: toolInput.referenceId || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Image generation failed')
      }
      const result = await res.json()
      return {
        ...result,
        message: `Generated ${result.count} image(s) using ${result.modelLabel}. Images saved to Media Library. URLs: ${result.images.map((i: { file_url: string }) => i.file_url).join(', ')}`,
      }
    }

    case 'unsplash_search': {
      // If importing a specific photo
      if (toolInput.importPhotoId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
        const res = await fetch(`${baseUrl}/api/images/unsplash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoId: toolInput.importPhotoId,
            downloadLocation: toolInput.importDownloadLocation,
            regularUrl: toolInput.importPhotoUrl,
            description: toolInput.importDescription || '',
            clientId: toolInput.clientId || clientId,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Unsplash import failed')
        }
        const result = await res.json()
        return { ...result, message: `Photo imported to Media Library. URL: ${result.asset?.file_url}` }
      }

      // Search Unsplash
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const params = new URLSearchParams({
        q: toolInput.query as string,
        per_page: '12',
        ...(toolInput.orientation ? { orientation: toolInput.orientation as string } : {}),
      })
      const res = await fetch(`${baseUrl}/api/images/unsplash?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Unsplash search failed')
      }
      const result = await res.json()
      return {
        ...result,
        message: `Found ${result.total} photos on Unsplash for "${toolInput.query}". Showing first ${result.photos?.length || 0}. To import a photo, call unsplash_search again with importPhotoId, importPhotoUrl, and importDownloadLocation.`,
      }
    }

    case 'edit_image': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/images/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: toolInput.imageUrl,
          instruction: toolInput.instruction,
          editModel: toolInput.editModel || 'nano_banana',
          resolution: toolInput.resolution || '1K',
          numImages: toolInput.numImages || 2,
          clientId,
          saveToLibrary: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Image editing failed')
      }
      const result = await res.json()
      return {
        ...result,
        message: `Edited image with ${result.modelLabel}. ${result.count} variation(s) saved to Media Library. URLs: ${result.images.map((i: { file_url: string }) => i.file_url).join(', ')}`,
      }
    }

    case 'crm_search': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/crm/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          phone: toolInput.phone || undefined,
          email: toolInput.email || undefined,
        }),
      })
      const rawText = await res.text()
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(rawText)
      } catch {
        throw new Error(`CRM search: unexpected response from server (HTTP ${res.status}): "${rawText.slice(0, 120)}"`)
      }
      if (!res.ok) {
        throw new Error((parsed.error as string) || `CRM search failed (HTTP ${res.status})`)
      }
      return parsed.contact
        ? { found: true, contact: parsed.contact }
        : { found: false, message: 'No matching lead or contact found in CRM' }
    }

    case 'crm_create_lead': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/crm/create-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          data: toolInput,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Create lead failed')
      }
      const result = await res.json()
      return { success: true, id: result.id, lead_no: result.lead_no, message: `Lead created: ${result.lead_no}` }
    }

    case 'crm_update_record': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/crm/update-record`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          recordId: toolInput.record_id,
          updates: toolInput.updates,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Update record failed')
      }
      return { success: true, message: 'Record updated successfully' }
    }

    case 'crm_add_note': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/crm/add-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          recordId: toolInput.record_id,
          note: toolInput.note,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Add note failed')
      }
      const result = await res.json()
      return { success: true, comment_id: result.comment_id, message: 'Note added to CRM record' }
    }

    case 'generate_whatsapp_prompt': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/whatsapp/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'WhatsApp prompt generation failed')
      }
      const result = await res.json() as {
        success: boolean
        agent_prompt: string
        pages_crawled: number
        had_website: boolean
        had_brand_voice: boolean
        had_positioning: boolean
      }
      return {
        success: true,
        pages_crawled: result.pages_crawled,
        had_website: result.had_website,
        had_brand_voice: result.had_brand_voice,
        had_positioning: result.had_positioning,
        prompt_length: result.agent_prompt?.length || 0,
        message: `WhatsApp agent prompt generated and saved to Settings → Integrations → WhatsApp. It's ready to use immediately. ${result.pages_crawled > 0 ? `${result.pages_crawled} website pages were crawled and baked into the knowledge base.` : ''} ${!result.had_brand_voice ? 'Note: No brand voice found — the tone section is based on general business info. Run Brand Voice skill for a more accurate persona.' : ''} ${!result.had_positioning ? 'Note: No positioning angles found — the value proposition section is generic. Run Positioning Angles skill to strengthen it.' : ''}`,
      }
    }

    case 'update_onboarding_stage':
      await updateClientOnboardingStage(
        clientId,
        toolInput.stage as number,
        (toolInput.completed as boolean) || false
      )
      return { success: true, stage: toolInput.stage, completed: toolInput.completed || false }

    case 'save_lead_magnet_html': {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      const res = await fetch(`${baseUrl}/api/lead-magnets/save-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          leadMagnetId: toolInput.leadMagnetId,
          htmlContent: toolInput.htmlContent,
          htmlType: toolInput.htmlType,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'HTML save failed')
      }
      const result = await res.json()
      const typeLabel = toolInput.htmlType === 'interactive' ? 'interactive tool' : 'opt-in page'
      return {
        ...result,
        message: `HTML ${typeLabel} saved to Supabase Storage. Signed URL: ${result.url}. The ${typeLabel} preview tab is now active in the Lead Magnets dashboard.`,
      }
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

// Truncate large tool results to avoid bloating the context window
function truncateToolResult(result: unknown, maxChars = 6000): string {
  const str = JSON.stringify(result, null, 2)
  if (str.length <= maxChars) return str
  return str.substring(0, maxChars) + '\n\n... [truncated for context window] ...'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, message, isMarketer = false } = body

    if (!clientId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Load client context + chat history + keyword check in parallel
    const [clientContext, chatHistory, hasKeywords] = await Promise.all([
      getClientContext(clientId),
      getChatHistory(clientId, 40),
      checkKeywordsExist(clientId),
    ])

    if (!clientContext.client) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Save the user message
    await saveChatMessage(clientId, 'user', message)

    // Determine mode
    const onboardingCompleted = (clientContext.client as Record<string, unknown>).onboarding_completed as boolean
    const mode = onboardingCompleted ? 'freeform' : 'onboarding'

    // Build system prompt with full client context + prerequisite flags + user message for skill selection
    const systemPrompt = buildSystemPrompt({
      clientContext: clientContext as unknown as Parameters<typeof buildSystemPrompt>[0]['clientContext'],
      isMarketer,
      mode,
      userMessage: message,
      hasKeywords,
    })

    // Build message history for Claude (last 40 messages)
    const messages: Anthropic.MessageParam[] = [
      ...chatHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content || '',
        })),
      { role: 'user' as const, content: message },
    ]

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        // Keep-alive ping every 20s to prevent browser SSE timeout during long tool chains
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'))
          } catch { /* stream may be closed */ }
        }, 20000)

        try {
          const anthropic = getAnthropic()
          let fullAssistantText = ''
          // Agentic loop — Claude can call tools multiple times
          let continueLoop = true
          let currentMessages = messages
          const failedTools: Array<{ toolName: string; error: string }> = []

          while (continueLoop) {
            const response = await withRetry(() => anthropic.messages.create({
              model: 'claude-opus-4-5',
              max_tokens: 8096,
              system: systemPrompt,
              tools: ALL_TOOLS,
              messages: currentMessages,
              stream: true,
            }))

            let currentToolUseId = ''
            let currentToolName = ''
            let currentToolInputRaw = ''
            let stopReason = ''
            let assistantMessage: Anthropic.MessageParam | null = null
            // Use a looser type so we can build blocks incrementally
            const contentBlocks: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> = []

            for await (const event of response) {
              if (event.type === 'message_start') {
                // nothing needed
              } else if (event.type === 'content_block_start') {
                if (event.content_block.type === 'text') {
                  contentBlocks.push({ type: 'text', text: '' })
                } else if (event.content_block.type === 'tool_use') {
                  currentToolUseId = event.content_block.id
                  currentToolName = event.content_block.name
                  currentToolInputRaw = ''
                  contentBlocks.push({
                    type: 'tool_use',
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: {},
                  })
                  // Tell the UI a tool is starting
                  send({
                    type: 'tool_start',
                    toolName: currentToolName,
                    toolId: currentToolUseId,
                  })
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  const text = event.delta.text
                  fullAssistantText += text
                  // Stream text to UI
                  send({ type: 'text', content: text })
                  // Update the last text block
                  const lastBlock = contentBlocks[contentBlocks.length - 1]
                  if (lastBlock?.type === 'text') {
                    lastBlock.text += text
                  }
                } else if (event.delta.type === 'input_json_delta') {
                  currentToolInputRaw += event.delta.partial_json
                }
              } else if (event.type === 'content_block_stop') {
                // If we just finished a tool_use block, parse its input
                const lastBlock = contentBlocks[contentBlocks.length - 1]
                if (lastBlock?.type === 'tool_use' && currentToolInputRaw) {
                  try {
                    lastBlock.input = JSON.parse(currentToolInputRaw)
                  } catch {
                    lastBlock.input = {}
                  }
                  currentToolInputRaw = ''
                }
              } else if (event.type === 'message_delta') {
                stopReason = event.delta.stop_reason || ''
              } else if (event.type === 'message_stop') {
                // Build the assistant message for the next loop iteration
                // Cast to any to avoid SDK internal type restrictions on incremental blocks
                assistantMessage = {
                  role: 'assistant',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content: contentBlocks as any,
                }
              }
            }

            // Process tool calls if stop_reason is tool_use
            if (stopReason === 'tool_use' && assistantMessage) {
              const toolUseBlocks = contentBlocks.filter(
                (b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
                  b.type === 'tool_use'
              )

              const toolResults: Anthropic.ToolResultBlockParam[] = []

              for (const toolBlock of toolUseBlocks) {
                const toolName = toolBlock.name as ToolName
                const toolInput = toolBlock.input as Record<string, unknown>

                try {
                  // Execute the tool
                  const result = await executeTool(toolName, toolInput, clientId)

                  // Truncate for context window
                  const resultStr = truncateToolResult(result)

                  // Notify UI of tool completion
                  send({
                    type: 'tool_result',
                    toolName,
                    toolId: toolBlock.id,
                    summary: getToolSummary(toolName, toolInput, result),
                  })

                  // Save tool call to chat history
                  await saveChatMessage(clientId, 'tool', `Tool: ${toolName}`, {
                    toolName,
                    toolInput,
                    toolOutput: { summary: getToolSummary(toolName, toolInput, result) },
                  })

                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: resultStr,
                  })
                } catch (err) {
                  const errorMsg = err instanceof Error ? err.message : 'Tool execution failed'
                  console.error(`[chat] Tool ${toolName} failed:`, errorMsg)
                  failedTools.push({ toolName, error: errorMsg })
                  send({
                    type: 'tool_error',
                    toolName,
                    toolId: toolBlock.id,
                    error: errorMsg,
                  })
                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolBlock.id,
                    content: `Error: ${errorMsg}`,
                    is_error: true,
                  })
                }
              }

              // Add assistant message + tool results to the conversation
              currentMessages = [
                ...currentMessages,
                assistantMessage,
                { role: 'user', content: toolResults },
              ]

              // Continue the loop — Claude will process tool results
              continueLoop = true
            } else {
              // No more tool calls — done
              continueLoop = false
            }
          }

          // If any tools failed during the agentic loop, append a warning
          if (failedTools.length > 0) {
            const failureSummary = failedTools
              .map(f => `• ${f.toolName}: ${f.error}`)
              .join('\n')
            const warningText = `\n\n⚠️ **Some actions failed:**\n${failureSummary}\n\nPlease try again or check the dashboard to verify what was saved.`
            fullAssistantText += warningText
            send({ type: 'text', content: warningText })
          }

          // Save final assistant message
          if (fullAssistantText) {
            await saveChatMessage(clientId, 'assistant', fullAssistantText)
          }

          clearInterval(keepAlive)
          send({ type: 'done' })
          controller.close()
        } catch (err) {
          clearInterval(keepAlive)
          const rawMsg = err instanceof Error ? err.message : String(err)
          const isOverloaded = rawMsg.includes('overloaded')
          const errorMsg = isOverloaded
            ? 'Vibe is experiencing high demand right now. Please try your message again in a moment.'
            : rawMsg
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Generate a human-readable summary of what a tool did
function getToolSummary(
  toolName: ToolName,
  input: Record<string, unknown>,
  result: unknown
): string {
  switch (toolName) {
    case 'perplexity_search':
      return `Searched: "${input.query}"`
    case 'firecrawl_scrape': {
      const r = result as { metadata?: { wordCount?: number }; title?: string }
      return `Scraped ${input.url} — ${r?.metadata?.wordCount || 0} words extracted`
    }
    case 'firecrawl_crawl': {
      const r = result as { pagesScraped?: number }
      return `Crawled ${input.url} — ${r?.pagesScraped || 0} pages scraped`
    }
    case 'dataforseo_keywords': {
      const r = result as unknown[]
      return `Fetched data for ${r?.length || 0} keywords`
    }
    case 'dataforseo_serp':
      return `Checked rankings for "${input.keyword}"`
    case 'dataforseo_keyword_suggestions': {
      const r = result as unknown[]
      return `Found ${r?.length || 0} keyword suggestions for "${input.seedKeyword}"`
    }
    case 'start_batch':
      return `Batch started: "${input.label}"`
    case 'save_content':
      return `Saved to ${input.table}`
    case 'update_client': {
      const fields = Object.keys((input.data as Record<string, unknown>) || {}).join(', ')
      return `Updated client profile: ${fields}`
    }
    case 'update_content':
      return `Updated record in ${input.table}`
    case 'get_existing_content': {
      const r = result as unknown[]
      return `Loaded ${r?.length || 0} records from ${input.table}`
    }
    case 'generate_image': {
      const r = result as { count?: number; modelLabel?: string; useCase?: string }
      return `Generated ${r?.count || 0} image(s) with ${r?.modelLabel || 'AI'} for ${r?.useCase || 'general'} use`
    }
    case 'unsplash_search': {
      const r = result as { total?: number; photos?: unknown[]; asset?: { file_url?: string } }
      if (r?.asset) return `Imported Unsplash photo to Media Library`
      return `Found ${r?.total || 0} Unsplash photos for "${input.query}"`
    }
    case 'edit_image': {
      const r = result as { count?: number; modelLabel?: string }
      return `Edited image with ${r?.modelLabel || 'AI'} — ${r?.count || 0} variation(s) saved to Media Library`
    }
    case 'crm_search': {
      const r = result as { found?: boolean; contact?: { firstname?: string; lastname?: string; vtiger_no?: string } }
      return r?.found
        ? `Found CRM record: ${r.contact?.firstname} ${r.contact?.lastname} (${r.contact?.vtiger_no})`
        : 'No matching record found in CRM'
    }
    case 'crm_create_lead': {
      const r = result as { lead_no?: string }
      return `Created CRM lead: ${r?.lead_no || 'new record'}`
    }
    case 'crm_update_record':
      return `Updated CRM record: ${input.record_id}`
    case 'crm_add_note':
      return `Note added to CRM record: ${input.record_id}`
    case 'generate_whatsapp_prompt': {
      const r = result as { pages_crawled?: number; prompt_length?: number }
      return `WhatsApp agent prompt generated — ${r?.pages_crawled || 0} pages crawled, ${r?.prompt_length || 0} chars. Saved to Settings.`
    }
    case 'update_onboarding_stage':
      return `Advanced to Stage ${input.stage}${input.completed ? ' — Onboarding Complete!' : ''}`
    case 'save_lead_magnet_html': {
      const r = result as { htmlType?: string }
      const label = r?.htmlType === 'interactive' ? 'Interactive tool' : 'Opt-in page'
      return `${label} HTML uploaded to Supabase Storage — preview tab now active in dashboard`
    }
    default:
      return `Executed ${toolName}`
  }
}
