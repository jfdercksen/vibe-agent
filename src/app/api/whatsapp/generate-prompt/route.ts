import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { firecrawlCrawl, firecrawlScrape } from '@/lib/tools/firecrawl'
import type { IntegrationConfig } from '@/lib/types/database'

// Allow up to 5 minutes — website crawl + 2 Claude calls can take a while
export const maxDuration = 300

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey, timeout: 280000 })
}

// POST /api/whatsapp/generate-prompt
// Body: { clientId }
// Crawls the client website, structures the knowledge, generates a comprehensive
// WhatsApp agent system prompt, and saves it to integrations->whatsapp->agent_prompt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId } = body as { clientId: string }

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── 1. Load client data ───────────────────────────────────────────────────
    const [clientRes, brandVoiceRes, anglesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('brand_voices').select('*').eq('client_id', clientId).eq('is_active', true).limit(1),
      supabase.from('positioning_angles').select('*').eq('client_id', clientId).order('angle_number', { ascending: true }),
    ])

    if (clientRes.error || !clientRes.data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientRes.data
    const brandVoice = brandVoiceRes.data?.[0] || null
    const angles = anglesRes.data || []
    const selectedAngle = angles.find(a => a.is_selected) || angles[0] || null

    const clientName = (client.display_name as string) || (client.name as string)
    const websiteUrl = (client.website as string | null) || null

    // ── 2. Crawl & structure website ─────────────────────────────────────────
    let websiteKnowledge = ''
    let pagesCrawled = 0

    if (websiteUrl) {
      console.log(`[generate-prompt] Crawling ${websiteUrl}...`)
      try {
        const crawlResult = await firecrawlCrawl(websiteUrl, 8)
        // Filter out thin pages (nav-only, footers, etc.)
        const contentPages = crawlResult.pages.filter(p => p.metadata.wordCount > 50)
        pagesCrawled = contentPages.length

        if (contentPages.length > 0) {
          // Cap each page at 3000 chars to keep the structuring call lean
          const rawContent = contentPages
            .map(p => `## ${p.title || p.url}\n${p.markdown.slice(0, 3000)}`)
            .join('\n\n---\n\n')

          // Structure pass — extract only what a customer service agent needs
          const anthropic = getAnthropic()
          const structureRes = await anthropic.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: `You are a knowledge base curator. Extract and organise the most important information from this website content for a customer service AI chatbot.

Focus ONLY on:
1. What the business does (core offering, services/products)
2. How the service works (process, steps, timeline)
3. Pricing and packages (if mentioned)
4. Key benefits and value propositions
5. Who they serve (ideal customer, industries)
6. Frequently asked questions and their answers
7. Contact information, locations, hours of operation
8. Any important policies, guarantees, or credentials

FORMAT: Clean organised markdown with headers. Be specific and factual — use the actual names, numbers, and details from the content. Skip generic marketing language, navigation menus, cookie notices, and footer boilerplate.

WEBSITE CONTENT:
${rawContent}`,
            }],
          })

          websiteKnowledge = (structureRes.content[0] as { type: 'text'; text: string }).text
        }
      } catch (crawlErr) {
        console.warn('[generate-prompt] Full crawl failed, trying single page:', crawlErr)
        try {
          const scrapeResult = await firecrawlScrape(websiteUrl)
          websiteKnowledge = scrapeResult.markdown.slice(0, 6000)
          pagesCrawled = 1
        } catch {
          console.warn('[generate-prompt] Single page scrape also failed — proceeding without website data')
        }
      }
    }

    // ── 3. Build context sections ─────────────────────────────────────────────
    const industry = (client.industry as string) || 'business'
    const targetAudience = (client.target_audience as string) || 'customers'
    const primaryGoal = (client.primary_goal as string) || 'provide excellent customer service'
    const businessType = (client.business_type as string) || 'business'

    const brandVoiceSection = brandVoice
      ? `BRAND VOICE & TONE:
- Personality traits: ${Array.isArray(brandVoice.personality_traits) ? brandVoice.personality_traits.join(', ') : brandVoice.personality_traits || 'professional, friendly'}
- Communication style: ${(brandVoice.channel_notes as Record<string, string>)?.whatsapp || (brandVoice.channel_notes as Record<string, string>)?.general || 'conversational and clear'}
- Words/phrases to embrace: ${Array.isArray(brandVoice.vocabulary_embrace) ? brandVoice.vocabulary_embrace.slice(0, 10).join(', ') : 'N/A'}
- Words/phrases to avoid: ${Array.isArray(brandVoice.vocabulary_avoid) ? brandVoice.vocabulary_avoid.slice(0, 10).join(', ') : 'N/A'}
- Anti-positioning (what we are NOT): ${brandVoice.anti_positioning || 'N/A'}`
      : ''

    const positioningSection = selectedAngle
      ? `CORE VALUE PROPOSITION:
- Core message: ${selectedAngle.core_hook || ''}
- Key differentiator: ${selectedAngle.psychology || ''}
- Primary angle: ${selectedAngle.framework || ''}`
      : ''

    const websiteSection = websiteKnowledge
      ? `\nBUSINESS KNOWLEDGE BASE (scraped from ${websiteUrl}):\n${websiteKnowledge}`
      : websiteUrl
        ? '\n(Website could not be scraped — base the knowledge section on the business info provided above.)'
        : '\n(No website URL configured — base the knowledge section on the business info provided above.)'

    // ── 4. Generate the comprehensive agent prompt ────────────────────────────
    const anthropic = getAnthropic()

    const generationPrompt = `You are creating a comprehensive WhatsApp AI agent system prompt for a business. This will be the complete instructions for an AI assistant that handles ALL incoming customer WhatsApp messages autonomously.

BUSINESS INFORMATION:
- Business name: ${clientName}
- Industry: ${industry}
- Business type: ${businessType}
- Target audience: ${targetAudience}
- Primary goal: ${primaryGoal}
- Website: ${websiteUrl || 'Not provided'}

${brandVoiceSection}

${positioningSection}
${websiteSection}

---

Generate a comprehensive, ready-to-use WhatsApp AI agent system prompt. Write it in second person ("You are..."). It MUST include ALL of these sections:

## 1. IDENTITY & ROLE
Who this agent is, the business name, what the business does, and the agent's purpose. Make it specific — not generic boilerplate.

## 2. KNOWLEDGE BASE
Everything the agent knows about the business — use ALL the website data above. Include:
- Complete list of services/products with descriptions
- How the service works (step-by-step if applicable)
- Pricing (if available from website, otherwise note to refer to a consultant)
- Key benefits and differentiators
- Frequently asked questions with specific answers
- Business hours, location, contact details

This section should be the longest and most detailed — the better the knowledge base, the fewer escalations needed.

## 3. TONE & COMMUNICATION STYLE
- How to communicate on WhatsApp (appropriate informality level, use of emojis, message length)
- Language style based on the brand voice above
- Response formatting rules (short paragraphs, use of bullet points, etc.)
- What makes communication feel authentic for this specific brand

## 4. CUSTOMER HANDLING
- **New customers**: How to greet, what info to collect, how to understand their needs
- **Returning customers**: When CRM context is provided, personalise the greeting using their name and history
- **Warm leads**: How to nurture interest without being pushy
- **Unhappy customers**: De-escalation approach specific to this business

## 5. LEAD QUALIFICATION
Step-by-step questions to ask in a natural conversational way to qualify prospects:
- What information to collect (name, contact details, specific need, urgency, budget if relevant)
- How to prioritise leads (hot/warm/cold signals for this industry)
- When to offer to have someone call them back

## 6. WHAT YOU CAN HELP WITH
Specific list of everything this agent can assist with (mapped to actual services from knowledge base).

## 7. WHAT YOU CANNOT HELP WITH
Clear guardrails — topics outside scope, decisions requiring human judgement, anything that should never be discussed.

## 8. HANDOVER TRIGGERS
Specific situations requiring escalation to a human agent:
- Complex complaints or disputes
- Final pricing negotiations or custom quotes
- Legal, financial, or sensitive matters
- When a customer is very frustrated after 2+ exchanges
- Any other situation specific to this business type

When handing over: always collect their name and preferred contact method first, then say "I'm going to have [specific person/team] reach out to you within [timeframe]. Is that okay?"

## 9. CRM INTEGRATION INSTRUCTIONS
You have access to these CRM tools — use them on EVERY conversation:

**ALWAYS at conversation start:**
- Search CRM using the customer's phone number: crm_search(phone: "their_number")
- If found: personalise your greeting using their name and any relevant history from their notes
- If not found: they may be a new prospect — gather their info naturally during conversation

**During conversation:**
- crm_create_lead: Create a new lead when a new prospect shows genuine interest (get firstname, lastname, and what they need)
- crm_update_record: Update lead status when qualification stage changes (e.g., "Hot", "In Progress", "Converted")
- crm_add_note: Log a brief summary of every meaningful conversation exchange

**Lead source for new leads created via WhatsApp:** "WhatsApp"

---

IMPORTANT: Make this prompt SPECIFIC to ${clientName} — use real service names, actual processes, and genuine brand personality. Avoid generic customer service language. The agent should feel like a knowledgeable team member at ${clientName}, not a generic bot.

Length: This should be detailed and comprehensive — 800 to 1500 words is appropriate for a good agent prompt.`

    const promptRes = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: generationPrompt }],
    })

    const generatedPrompt = (promptRes.content[0] as { type: 'text'; text: string }).text

    // ── 5. Save to integrations ───────────────────────────────────────────────
    const existingIntegrations = (client.integrations as IntegrationConfig) || {}
    const existingWhatsApp = existingIntegrations.whatsapp || {
      access_token: '',
      phone_number_id: '',
      verify_token: '',
      agent_prompt: '',
    }

    const updatedIntegrations: IntegrationConfig = {
      ...existingIntegrations,
      whatsapp: {
        ...existingWhatsApp,
        agent_prompt: generatedPrompt,
      },
    }

    const { error: saveError } = await supabase
      .from('clients')
      .update({
        integrations: updatedIntegrations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (saveError) {
      console.error('[generate-prompt] Save error:', saveError)
      return NextResponse.json({ error: 'Prompt generated but failed to save — try again' }, { status: 500 })
    }

    console.log(`[generate-prompt] ✅ Generated and saved agent prompt for client ${clientId} (${pagesCrawled} pages crawled)`)

    return NextResponse.json({
      success: true,
      agent_prompt: generatedPrompt,
      pages_crawled: pagesCrawled,
      had_website: !!websiteUrl,
      had_brand_voice: !!brandVoice,
      had_positioning: !!selectedAngle,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prompt generation failed'
    console.error('[generate-prompt]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
