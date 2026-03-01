import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { updateRecord } from '@/lib/crm/vtiger'
import type { VtigerConfig } from '@/lib/crm/vtiger'
import type { IntegrationConfig } from '@/lib/types/database'

// PATCH /api/crm/update-record
// Body: { clientId, recordId, updates: Record<string, unknown> }
// recordId is the full Vtiger ID e.g. "4x123"
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, recordId, updates } = body as {
      clientId: string
      recordId: string
      updates: Record<string, unknown>
    }

    if (!clientId || !recordId || !updates) {
      return NextResponse.json(
        { error: 'Missing clientId, recordId, or updates' },
        { status: 400 }
      )
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

    const result = await updateRecord(vtigerConfig, recordId, updates)
    return NextResponse.json({ success: true, record: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update record failed'
    console.error('[/api/crm/update-record]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
