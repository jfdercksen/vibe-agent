import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { addNote } from '@/lib/crm/vtiger'
import type { VtigerConfig } from '@/lib/crm/vtiger'
import type { IntegrationConfig } from '@/lib/types/database'

// POST /api/crm/add-note
// Body: { clientId, recordId, note }
// recordId is the full Vtiger ID e.g. "4x123"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, recordId, note } = body as {
      clientId: string
      recordId: string
      note: string
    }

    if (!clientId || !recordId || !note?.trim()) {
      return NextResponse.json(
        { error: 'Missing clientId, recordId, or note' },
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

    const result = await addNote(vtigerConfig, recordId, note.trim())
    return NextResponse.json({ success: true, comment_id: result.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Add note failed'
    console.error('[/api/crm/add-note]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
