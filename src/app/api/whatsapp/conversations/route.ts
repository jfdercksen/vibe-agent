import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppConversations } from '@/lib/data'

// GET /api/whatsapp/conversations?clientId=xxx
// Used by the WhatsApp dashboard to poll for new messages.
// Uses the admin client server-side so RLS/anon key issues don't affect the browser.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 })
  }

  try {
    const conversations = await getWhatsAppConversations(clientId)
    return NextResponse.json(conversations)
  } catch (err) {
    console.error('[WhatsApp API] Failed to fetch conversations:', err)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}
