import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { IntegrationConfig } from '@/lib/types/database'

// PATCH /api/settings/integrations
// Body: { clientId, integrations: Partial<IntegrationConfig> }
// Deep merges incoming integrations with existing — saving WordPress doesn't wipe Mailchimp
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, integrations } = body as {
      clientId: string
      integrations: Partial<IntegrationConfig>
    }

    if (!clientId || !integrations) {
      return NextResponse.json(
        { error: 'Missing clientId or integrations' },
        { status: 400 }
      )
    }

    if (!clientId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json(
        { error: 'Invalid clientId format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch existing integrations for deep merge
    const { data: existing, error: fetchError } = await supabase
      .from('clients')
      .select('integrations')
      .eq('id', clientId)
      .single()

    if (fetchError) {
      console.error('[settings/integrations] fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    // Deep merge: keep existing integration configs, override only what's sent
    const currentIntegrations = (existing?.integrations as IntegrationConfig) || {}
    const merged: IntegrationConfig = { ...currentIntegrations }

    // For each integration key sent, replace that entire section
    for (const key of Object.keys(integrations) as Array<keyof IntegrationConfig>) {
      const value = integrations[key]
      if (value === null) {
        // null = explicitly remove this integration
        delete merged[key]
      } else if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[key] = value
      }
    }

    // Update the client record
    const { data, error: updateError } = await supabase
      .from('clients')
      .update({
        integrations: merged,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
      .select('integrations')
      .single()

    if (updateError) {
      console.error('[settings/integrations] update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ integrations: data?.integrations })
  } catch (err) {
    console.error('[settings/integrations] route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
