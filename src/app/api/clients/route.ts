import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client: clientData, user: userData } = body

    // ── Validate required fields ────────────────────────────────────────────
    if (!clientData?.name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    if (userData) {
      if (!userData.email?.trim()) {
        return NextResponse.json({ error: 'User email is required' }, { status: 400 })
      }
      if (!userData.password || userData.password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }
    }

    // ── Step 1: Create the client record ────────────────────────────────────
    const supabase = createAdminClient()
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: clientData.name.trim(),
        display_name: clientData.display_name?.trim() || null,
        business_type: clientData.business_type || null,
        industry: clientData.industry?.trim() || null,
        website: clientData.website?.trim() || null,
      })
      .select()
      .single()

    if (clientError) {
      console.error('Failed to create client:', clientError)
      return NextResponse.json(
        { error: `Failed to create client: ${clientError.message}` },
        { status: 500 }
      )
    }

    // ── Step 2: Create the user account (optional) ──────────────────────────
    if (userData) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email.trim(),
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            role: 'client',
            client_id: client.id,
          },
        }),
      })

      const userResult = await userResponse.json()

      if (!userResponse.ok) {
        // Client was created but user failed — return client with warning
        console.error('Failed to create user:', userResult)
        return NextResponse.json(
          {
            client,
            userError: userResult.message || userResult.msg || 'Failed to create user account',
          },
          { status: 207 }
        )
      }

      return NextResponse.json({
        client,
        user: {
          id: userResult.id,
          email: userResult.email,
          role: userResult.user_metadata?.role,
          client_id: userResult.user_metadata?.client_id,
        },
      })
    }

    // No user requested — return client only
    return NextResponse.json({ client })
  } catch (err) {
    console.error('Client creation error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
