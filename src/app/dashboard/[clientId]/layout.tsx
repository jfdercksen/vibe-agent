import { notFound, redirect } from 'next/navigation'
import { getClient, getClients } from '@/lib/data'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { clientId } = await params

  // ── Auth check ─────────────────────────────────────────────────────────────
  // Always use getUser() — it verifies the JWT against Supabase Auth server.
  // getSession() only reads the local cookie and does NOT cryptographically
  // verify the token, making it unsafe for access control decisions.
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ── Role resolution ─────────────────────────────────────────────────────────
  const role = user.user_metadata?.role as string | undefined
  const isAdmin = role === 'admin'

  // ── Client-user isolation ──────────────────────────────────────────────────
  // Client users are hard-locked to their assigned client_id.
  // If they try to access any other client's URL (even if they know the UUID),
  // they are silently redirected back to their own dashboard.
  if (!isAdmin) {
    const allowedClientId = user.user_metadata?.client_id as string | undefined
    if (!allowedClientId) {
      // Misconfigured client account — no client_id assigned in user_metadata
      redirect('/login?error=no_client_assigned')
    }
    if (allowedClientId !== clientId) {
      redirect(`/dashboard/${allowedClientId}`)
    }
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  // Admin: fetch all clients for the switcher dropdown.
  // Client user: only fetch their single client — avoids leaking all other
  // client names in the response payload and is faster.
  const [client, clients] = await Promise.all([
    getClient(clientId),
    isAdmin ? getClients() : Promise.resolve([]),
  ])

  if (!client) {
    notFound()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar clientId={clientId} isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          clients={clients}
          currentClient={client}
          isAdmin={isAdmin}
          userEmail={user.email}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
