import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST — using POST (not GET) prevents CSRF logout-via-link attacks.
// The header logout button sends a fetch POST to this route.
export async function POST() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  return NextResponse.redirect(`${appUrl}/login`, { status: 302 })
}
