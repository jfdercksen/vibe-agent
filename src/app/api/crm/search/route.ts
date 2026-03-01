import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { searchByPhone, searchByEmail } from '@/lib/crm/vtiger'
import type { VtigerConfig } from '@/lib/crm/vtiger'
import type { IntegrationConfig } from '@/lib/types/database'

// POST /api/crm/search
// Body: { clientId, phone? } | { clientId, email? }
// Returns: VtigerContact | null
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, phone, email } = body as {
      clientId: string
      phone?: string
      email?: string
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }
    if (!phone && !email) {
      return NextResponse.json({ error: 'Provide phone or email to search' }, { status: 400 })
    }

    // Load client's Vtiger config
    const supabase = createAdminClient()
    const { data: client, error } = await supabase
      .from('clients')
      .select('integrations')
      .eq('id', clientId)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const vtigerConfig = (client.integrations as IntegrationConfig)?.vtiger as VtigerConfig | undefined

    if (!vtigerConfig?.instance_url || !vtigerConfig?.username || !vtigerConfig?.access_key) {
      return NextResponse.json(
        { error: 'Vtiger CRM is not configured for this client. Add credentials in Settings → CRM.' },
        { status: 422 }
      )
    }

    const contact = phone
      ? await searchByPhone(vtigerConfig, phone)
      : await searchByEmail(vtigerConfig, email!)

    return NextResponse.json({ contact })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CRM search failed'
    console.error('[/api/crm/search]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
