import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { searchByPhone, addNote } from '@/lib/crm/vtiger'
import type { VtigerConfig, VtigerContact } from '@/lib/crm/vtiger'
import type { IntegrationConfig } from '@/lib/types/database'

// ── GET — Meta webhook verification ───────────────────────────────────────
// Meta sends a GET request with hub.mode, hub.verify_token, hub.challenge
// We look up the client by verify_token and echo back hub.challenge
export async function GET(request: NextRequest) {
  console.log('[WhatsApp Webhook] GET verification request received')

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (!mode || !token || !challenge) {
    console.error('[WhatsApp Webhook] Missing verification params', { mode, token: !!token, challenge: !!challenge })
    return new NextResponse('Missing parameters', { status: 400 })
  }

  if (mode !== 'subscribe') {
    console.error('[WhatsApp Webhook] Invalid mode:', mode)
    return new NextResponse('Invalid mode', { status: 403 })
  }

  // Look up client by verify_token stored in integrations JSONB
  const supabase = createAdminClient()
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name')
    .filter('integrations->whatsapp->>verify_token', 'eq', token)
    .limit(1)

  if (error) {
    console.error('[WhatsApp Webhook] DB error looking up verify_token:', error)
    return new NextResponse('Internal error', { status: 500 })
  }

  if (!clients || clients.length === 0) {
    console.error('[WhatsApp Webhook] No client found for verify_token:', token)
    return new NextResponse('Forbidden', { status: 403 })
  }

  console.log(`[WhatsApp Webhook] Verified for client: ${clients[0].name}`)
  return new NextResponse(challenge, { status: 200 })
}

// ── POST — Incoming WhatsApp message ──────────────────────────────────────
// Meta sends a POST for every incoming message
export async function POST(request: NextRequest) {
  console.log('[WhatsApp Webhook] POST message received')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    console.error('[WhatsApp Webhook] Failed to parse request body')
    return NextResponse.json({ ok: true }) // Always return 200 to Meta
  }

  // ── Parse Meta's deeply nested payload ──────────────────────────────────
  // Structure: body.entry[0].changes[0].value.messages[0]
  try {
    const entry = (body.entry as Record<string, unknown>[])?.[0]
    const changes = (entry?.changes as Record<string, unknown>[])?.[0]
    const value = changes?.value as Record<string, unknown>
    const messages = value?.messages as Record<string, unknown>[]
    const metadata = value?.metadata as Record<string, string>

    // Only process actual text messages
    if (!messages || messages.length === 0) {
      // Could be a status update (delivered/read) — ignore silently
      return NextResponse.json({ ok: true })
    }

    const msg = messages[0]
    if (msg.type !== 'text') {
      console.log('[WhatsApp Webhook] Non-text message type:', msg.type, '— skipping')
      return NextResponse.json({ ok: true })
    }

    const fromNumber = msg.from as string
    const messageText = (msg.text as Record<string, string>)?.body
    const phoneNumberId = metadata?.phone_number_id

    if (!fromNumber || !messageText || !phoneNumberId) {
      console.error('[WhatsApp Webhook] Missing required fields', { fromNumber, messageText: !!messageText, phoneNumberId })
      return NextResponse.json({ ok: true })
    }

    console.log(`[WhatsApp Webhook] Message from ${fromNumber} via phone_number_id ${phoneNumberId}: "${messageText.slice(0, 80)}"`)

    // ── Find client by phone_number_id ────────────────────────────────────
    const supabase = createAdminClient()
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, integrations')
      .filter('integrations->whatsapp->>phone_number_id', 'eq', phoneNumberId)
      .limit(1)

    if (clientError) {
      console.error('[WhatsApp Webhook] DB error finding client:', clientError)
      return NextResponse.json({ ok: true })
    }

    if (!clients || clients.length === 0) {
      console.error('[WhatsApp Webhook] No client configured for phone_number_id:', phoneNumberId)
      return NextResponse.json({ ok: true })
    }

    const client = clients[0]
    const whatsappConfig = (client.integrations as Record<string, unknown>)?.whatsapp as {
      access_token: string
      phone_number_id: string
      verify_token: string
      agent_prompt: string
    }

    if (!whatsappConfig?.access_token || !whatsappConfig?.agent_prompt) {
      console.error('[WhatsApp Webhook] Client missing WhatsApp config:', client.id)
      return NextResponse.json({ ok: true })
    }

    // ── CRM lookup (optional — skip gracefully if not configured) ──────────
    let crmContact: VtigerContact | null = null
    const vtigerConfig = (client.integrations as IntegrationConfig)?.vtiger as VtigerConfig | undefined

    if (vtigerConfig?.instance_url && vtigerConfig?.username && vtigerConfig?.access_key) {
      try {
        crmContact = await searchByPhone(vtigerConfig, fromNumber)
        if (crmContact) {
          console.log(`[WhatsApp Webhook] CRM match for ${fromNumber}: ${crmContact.vtiger_no} (${crmContact.customer_status})`)
        } else {
          console.log(`[WhatsApp Webhook] No CRM record for ${fromNumber} — new visitor`)
        }
      } catch (crmErr) {
        // Don't block the WhatsApp reply if CRM lookup fails
        console.warn('[WhatsApp Webhook] CRM lookup failed (non-blocking):', crmErr)
      }
    }

    // ── Upsert conversation ────────────────────────────────────────────────
    const { data: conv, error: convError } = await supabase
      .from('whatsapp_conversations')
      .upsert(
        {
          client_id: client.id,
          phone_number: fromNumber,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,phone_number' }
      )
      .select('id')
      .single()

    if (convError || !conv) {
      console.error('[WhatsApp Webhook] Failed to upsert conversation:', convError)
      return NextResponse.json({ ok: true })
    }

    const conversationId = conv.id

    // ── Save user message ──────────────────────────────────────────────────
    const { error: userMsgError } = await supabase
      .from('whatsapp_messages')
      .insert({ conversation_id: conversationId, role: 'user', content: messageText })

    if (userMsgError) {
      console.error('[WhatsApp Webhook] Failed to save user message:', userMsgError)
    }

    // ── Load conversation history for context ──────────────────────────────
    const { data: history } = await supabase
      .from('whatsapp_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = (history || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // ── Build system prompt with optional CRM context ─────────────────────
    const crmContext = crmContact
      ? `\n\n## Customer CRM Profile\n- Name: ${crmContact.firstname} ${crmContact.lastname}${crmContact.company ? ` (${crmContact.company})` : ''}\n- Status: ${crmContact.customer_status === 'existing_lead' ? 'Existing Lead' : 'Existing Contact'} — ${crmContact.vtiger_no}\n${crmContact.leadstatus ? `- Lead Status: ${crmContact.leadstatus}\n` : ''}${crmContact.description ? `- Notes: ${crmContact.description}\n` : ''}\nAddress them by name (${crmContact.firstname}) and use this context to personalize your response.`
      : vtigerConfig
        ? `\n\n## Customer CRM Profile\nThis customer is not yet in the CRM. If they provide contact details or express interest, the system will create a lead record automatically.`
        : ''

    const fullSystemPrompt = whatsappConfig.agent_prompt + crmContext

    // ── Generate AI reply with Claude ──────────────────────────────────────
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    let aiReply: string
    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: conversationHistory,
      })

      aiReply = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('')

      if (!aiReply) {
        throw new Error('Empty response from Claude')
      }
    } catch (aiError) {
      console.error('[WhatsApp Webhook] Claude API error:', aiError)
      aiReply = "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
    }

    console.log(`[WhatsApp Webhook] Claude reply for ${fromNumber}: "${aiReply.slice(0, 80)}"`)

    // ── Save assistant reply ───────────────────────────────────────────────
    const { error: assistantMsgError } = await supabase
      .from('whatsapp_messages')
      .insert({ conversation_id: conversationId, role: 'assistant', content: aiReply })

    if (assistantMsgError) {
      console.error('[WhatsApp Webhook] Failed to save assistant message:', assistantMsgError)
    }

    // ── Log conversation note to CRM (optional) ───────────────────────────
    if (crmContact && vtigerConfig) {
      try {
        const note = `[WhatsApp] Customer: "${messageText.slice(0, 200)}"\nAgent reply: "${aiReply.slice(0, 200)}"`
        await addNote(vtigerConfig, crmContact.id, note)
        console.log(`[WhatsApp Webhook] CRM note logged to ${crmContact.vtiger_no}`)
      } catch (noteErr) {
        console.warn('[WhatsApp Webhook] CRM note logging failed (non-blocking):', noteErr)
      }
    }

    // ── Send reply via Meta WhatsApp Cloud API ─────────────────────────────
    const metaUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`
    const metaRes = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: fromNumber,
        type: 'text',
        text: { body: aiReply },
      }),
    })

    if (!metaRes.ok) {
      const metaError = await metaRes.text()
      console.error('[WhatsApp Webhook] Meta API error sending reply:', metaError)
    } else {
      console.log(`[WhatsApp Webhook] Reply sent to ${fromNumber} ✓`)
    }

  } catch (err) {
    console.error('[WhatsApp Webhook] Unexpected error:', err)
  }

  // Always return 200 to Meta — if we return anything else Meta will retry
  return NextResponse.json({ ok: true })
}
