import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Handles Supabase Auth callbacks — used for email confirmation links and
// magic links. Even if only password auth is used now, this route is required
// so that Supabase-generated email links don't return a 404.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Code missing or exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
