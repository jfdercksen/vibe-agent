import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/crm/vtiger'
import type { VtigerConfig } from '@/lib/crm/vtiger'

// POST /api/crm/test-connection
// Body: { instance_url, username, access_key }
// Used from Settings UI before saving — no clientId needed
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { instance_url, username, access_key } = body as VtigerConfig

    if (!instance_url || !username || !access_key) {
      return NextResponse.json(
        { error: 'instance_url, username, and access_key are all required' },
        { status: 400 }
      )
    }

    const result = await testConnection({ instance_url, username, access_key })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection test failed'
    console.error('[/api/crm/test-connection]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
