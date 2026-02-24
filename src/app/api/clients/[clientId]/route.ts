import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = new Set([
  'name',
  'display_name',
  'business_type',
  'industry',
  'website',
  'target_audience',
  'primary_goal',
  'competitors',
  'branding',
  'integrations',
  'is_active',
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params

    if (!clientId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid clientId format' }, { status: 400 })
    }

    const body = await req.json()

    // Only keep allowed fields
    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        payload[key] = value
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // Name is required if provided
    if ('name' in payload && (!payload.name || typeof payload.name !== 'string' || !(payload.name as string).trim())) {
      return NextResponse.json({ error: 'Client name cannot be empty' }, { status: 400 })
    }

    // Auto-set updated_at
    payload.updated_at = new Date().toISOString()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('[clients PATCH] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[clients PATCH] route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
