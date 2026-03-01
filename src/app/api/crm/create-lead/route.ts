import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createLead } from '@/lib/crm/vtiger'
import type { VtigerConfig, CreateLeadInput } from '@/lib/crm/vtiger'
import type { IntegrationConfig } from '@/lib/types/database'

// POST /api/crm/create-lead
// Body: { clientId, data: CreateLeadInput }
// Returns: { id, lead_no }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, data } = body as {
      clientId: string
      data: CreateLeadInput
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }
    if (!data?.firstname || !data?.lastname) {
      return NextResponse.json({ error: 'firstname and lastname are required' }, { status: 400 })
    }

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
        { error: 'Vtiger CRM is not configured for this client.' },
        { status: 422 }
      )
    }

    const result = await createLead(vtigerConfig, data)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create lead failed'
    console.error('[/api/crm/create-lead]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
