import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/whatsapp/send
// Sends a manual reply from the dashboard operator to a WhatsApp conversation.
// Uses the client's stored Meta access token + phone_number_id.
export async function POST(request: NextRequest) {
  let body: { conversationId: string; message: string; clientId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { conversationId, message, clientId } = body

  if (!conversationId || !message?.trim() || !clientId) {
    return NextResponse.json({ error: 'conversationId, clientId and message are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch conversation (for phone number) + client integrations in parallel
  const [convResult, clientResult] = await Promise.all([
    supabase
      .from('whatsapp_conversations')
      .select('phone_number')
      .eq('id', conversationId)
      .single(),
    supabase
      .from('clients')
      .select('integrations')
      .eq('id', clientId)
      .single(),
  ])

  if (convResult.error || !convResult.data) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  if (clientResult.error || !clientResult.data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const whatsapp = (clientResult.data.integrations as Record<string, unknown>)?.whatsapp as {
    access_token: string
    phone_number_id: string
  } | undefined

  if (!whatsapp?.access_token || !whatsapp?.phone_number_id) {
    return NextResponse.json({ error: 'WhatsApp not configured for this client' }, { status: 400 })
  }

  const toNumber = convResult.data.phone_number
  const trimmedMessage = message.trim()

  // Send via Meta WhatsApp Cloud API
  const metaRes = await fetch(
    `https://graph.facebook.com/v19.0/${whatsapp.phone_number_id}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsapp.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'text',
        text: { body: trimmedMessage },
      }),
    }
  )

  if (!metaRes.ok) {
    const metaError = await metaRes.text()
    console.error('[WhatsApp Send] Meta API error:', metaError)
    return NextResponse.json({ error: 'Failed to send via Meta API', detail: metaError }, { status: 502 })
  }

  // Save as assistant message in DB (role: 'assistant', same as bot — shown in green)
  const { data: savedMsg, error: saveError } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: trimmedMessage,
    })
    .select()
    .single()

  if (saveError) {
    console.error('[WhatsApp Send] Failed to save message to DB:', saveError)
    // Don't fail the response — message was already sent via Meta
  }

  // Update conversation last_message_at
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return NextResponse.json({ success: true, message: savedMsg ?? null })
}
