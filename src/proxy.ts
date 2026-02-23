import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that are accessible without an authenticated session
const PUBLIC_PATHS = ['/login', '/api/auth/callback', '/api/auth/logout', '/api/auth/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through immediately — no session required
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Create a mutable response — the SSR client attaches refreshed session
  // cookies to this response on every request (handles token refresh automatically).
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Apply cookies to both the request (for downstream server components)
          // and the response (so the browser receives updated tokens).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getUser() — not getSession().
  // getUser() verifies the JWT cryptographically with Supabase Auth server.
  // getSession() only reads the local cookie without server verification.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // No valid session — redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated — return the response with refreshed cookies attached.
  // CRITICAL: always return supabaseResponse (not a new NextResponse.next()) so
  // the mutated cookie headers are preserved for token refresh to work.
  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
