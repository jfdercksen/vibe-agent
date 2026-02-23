import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClients } from '@/lib/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, ArrowRight, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Auth check — middleware already blocked unauthenticated users, but we check
  // here too so we can branch on role without a separate API call.
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role as string | undefined
  const isAdmin = role === 'admin'

  // Client users bypass the grid entirely — go straight to their dashboard
  if (!isAdmin) {
    const clientId = user.user_metadata?.client_id as string | undefined
    if (clientId) {
      redirect(`/dashboard/${clientId}`)
    }
    // Client user with no client_id assigned — misconfigured account
    redirect('/login?error=no_client_assigned')
  }

  // Admin only from this point — fetch all clients for the selection grid
  const clients = await getClients()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            VA
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vibe Agent</h1>
          <p className="mt-2 text-muted-foreground">
            One marketer does the work of 5-7 people
          </p>
        </div>

        {/* Client Grid */}
        {clients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {clients.map((client) => (
              <Link key={client.id} href={`/dashboard/${client.id}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-semibold text-sm"
                          style={{
                            backgroundColor: client.branding?.primaryColor || '#6366f1',
                          }}
                        >
                          {(client.display_name || client.name).substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {client.display_name || client.name}
                          </CardTitle>
                          {client.industry && (
                            <CardDescription>{client.industry}</CardDescription>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {client.business_type && (
                        <Badge variant="secondary" className="text-xs">
                          {client.business_type.replace('_', ' ')}
                        </Badge>
                      )}
                      {client.website && (
                        <Badge variant="outline" className="text-xs">
                          {(() => {
                            try {
                              return new URL(client.website!).hostname
                            } catch {
                              return client.website
                            }
                          })()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h2 className="text-xl font-semibold mb-2">No clients yet</h2>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create your first client using Claude Code CLI. Just tell Claude about the business and it will set everything up.
              </p>
              <div className="mx-auto max-w-lg rounded-lg bg-muted p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Try this prompt in Claude Code:</span>
                </div>
                <code className="text-sm text-muted-foreground">
                  &quot;Create a new client: Acme Corp. They&apos;re a SaaS company selling project management tools to small teams. Website: acme.com&quot;
                </code>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
