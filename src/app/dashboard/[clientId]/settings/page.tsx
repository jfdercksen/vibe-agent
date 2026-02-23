import { getClient } from '@/lib/data'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Globe, Target, Users, Palette } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { IntegrationsForm } from '@/components/settings/integrations-form'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { clientId } = await params

  // Auth check for role
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.user_metadata?.role as string | undefined
  const isAdmin = role === 'admin'

  const client = await getClient(clientId)

  if (!client) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client Settings</h1>
        <p className="text-muted-foreground">
          Client profile and configuration — managed through Claude Code
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{client.name}</p>
            </div>
            {client.display_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                <p className="text-sm">{client.display_name}</p>
              </div>
            )}
            {client.business_type && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                <Badge variant="outline">{client.business_type.replace(/_/g, ' ')}</Badge>
              </div>
            )}
            {client.industry && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="text-sm">{client.industry}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Digital Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Digital Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.website && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {client.website}
                </a>
              </div>
            )}
            {client.competitors && client.competitors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Competitors</p>
                <div className="space-y-1">
                  {client.competitors.map((comp, i) => (
                    <p key={i} className="text-sm">{typeof comp === 'string' ? comp : JSON.stringify(comp)}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audience & Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.target_audience && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Audience</p>
                <p className="text-sm">{client.target_audience}</p>
              </div>
            )}
            {client.primary_goal && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primary Goal</p>
                <p className="text-sm">{client.primary_goal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.branding?.primaryColor && (
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: client.branding.primaryColor }}
                />
                <div>
                  <p className="text-sm font-medium">Primary Color</p>
                  <p className="text-xs text-muted-foreground">{client.branding.primaryColor}</p>
                </div>
              </div>
            )}
            {client.branding?.secondaryColor && (
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: client.branding.secondaryColor }}
                />
                <div>
                  <p className="text-sm font-medium">Secondary Color</p>
                  <p className="text-xs text-muted-foreground">{client.branding.secondaryColor}</p>
                </div>
              </div>
            )}
            {client.branding?.logo_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logo</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={client.branding.logo_url}
                  alt="Logo"
                  className="mt-1 h-12 object-contain"
                />
              </div>
            )}
            {(!client.branding || Object.keys(client.branding).length === 0) && (
              <p className="text-sm text-muted-foreground">
                No branding defined yet. Tell Claude the brand colors and it will update the client profile.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Integrations Section */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Integrations</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {isAdmin
            ? 'Connect external services for publishing and automation'
            : 'Integration connection status'}
        </p>
        <IntegrationsForm
          clientId={clientId}
          integrations={client.integrations || {}}
          isAdmin={isAdmin}
        />
      </div>

      <Separator />

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Editing Client Settings</p>
              <p className="text-sm text-muted-foreground mt-1">
                To update this client&apos;s information, use Claude Code CLI. For example:
                <br />
                <code className="text-xs bg-background px-1.5 py-0.5 rounded mt-1 inline-block">
                  &quot;Update the client website to https://newsite.com and set the primary color to #FF6600&quot;
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
