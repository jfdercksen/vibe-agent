'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Globe, Mail, Share2, Workflow, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { IntegrationConfig } from '@/lib/types/database'

interface IntegrationsFormProps {
  clientId: string
  integrations: IntegrationConfig
}

export function IntegrationsForm({ clientId, integrations: initial }: IntegrationsFormProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig>(initial || {})

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <WordPressCard
        clientId={clientId}
        config={integrations.wordpress}
        onSaved={(wp) => setIntegrations(prev => ({ ...prev, wordpress: wp }))}
      />
      <MailchimpCard
        clientId={clientId}
        config={integrations.mailchimp}
        onSaved={(mc) => setIntegrations(prev => ({ ...prev, mailchimp: mc }))}
      />
      <SocialMediaCard
        clientId={clientId}
        meta={integrations.meta}
        linkedin={integrations.linkedin}
        onSaved={(meta, linkedin) => setIntegrations(prev => ({ ...prev, meta, linkedin }))}
      />
      <N8nCard
        clientId={clientId}
        config={integrations.n8n}
        onSaved={(n8n) => setIntegrations(prev => ({ ...prev, n8n }))}
      />
    </div>
  )
}

// ─── Shared save helper ───────────────────────────────────────

async function saveIntegration(
  clientId: string,
  key: keyof IntegrationConfig,
  value: IntegrationConfig[keyof IntegrationConfig]
): Promise<boolean> {
  try {
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, integrations: { [key]: value } }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save')
    }
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} settings saved`)
    return true
  } catch (err) {
    toast.error(`Failed to save: ${(err as Error).message}`)
    return false
  }
}

// ─── Password input with show/hide ────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Connection status dot ────────────────────────────────────

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className="text-xs text-muted-foreground">
        {connected ? 'Connected' : 'Not configured'}
      </span>
    </div>
  )
}

// ─── WordPress Card ───────────────────────────────────────────

function WordPressCard({
  clientId,
  config,
  onSaved,
}: {
  clientId: string
  config?: IntegrationConfig['wordpress']
  onSaved: (wp: IntegrationConfig['wordpress']) => void
}) {
  const [url, setUrl] = useState(config?.url || '')
  const [username, setUsername] = useState(config?.username || '')
  const [appPassword, setAppPassword] = useState(config?.app_password || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!url.trim()) { toast.error('WordPress URL is required'); return }
    setSaving(true)
    const wp = { url: url.trim(), username: username.trim(), app_password: appPassword.trim() }
    const ok = await saveIntegration(clientId, 'wordpress', wp)
    if (ok) onSaved(wp)
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5" />
            WordPress
          </CardTitle>
          <StatusDot connected={!!config?.url} />
        </div>
        <CardDescription>Publish blog posts directly to WordPress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wp-url">Site URL</Label>
          <Input id="wp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wp-user">Username</Label>
          <Input id="wp-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wp-pass">Application Password</Label>
          <PasswordInput id="wp-pass" value={appPassword} onChange={setAppPassword} placeholder="xxxx xxxx xxxx xxxx" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Save WordPress Settings
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Mailchimp Card ───────────────────────────────────────────

function MailchimpCard({
  clientId,
  config,
  onSaved,
}: {
  clientId: string
  config?: IntegrationConfig['mailchimp']
  onSaved: (mc: IntegrationConfig['mailchimp']) => void
}) {
  const [apiKey, setApiKey] = useState(config?.api_key || '')
  const [serverPrefix, setServerPrefix] = useState(config?.server_prefix || '')
  const [listId, setListId] = useState(config?.list_id || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) { toast.error('Mailchimp API key is required'); return }
    if (!serverPrefix.trim()) { toast.error('Server prefix is required'); return }
    setSaving(true)
    const mc = {
      api_key: apiKey.trim(),
      server_prefix: serverPrefix.trim(),
      ...(listId.trim() ? { list_id: listId.trim() } : {}),
    }
    const ok = await saveIntegration(clientId, 'mailchimp', mc)
    if (ok) onSaved(mc)
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            Mailchimp
          </CardTitle>
          <StatusDot connected={!!config?.api_key} />
        </div>
        <CardDescription>Send email sequences and newsletters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mc-key">API Key</Label>
          <PasswordInput id="mc-key" value={apiKey} onChange={setApiKey} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mc-prefix">Server Prefix</Label>
          <Input id="mc-prefix" value={serverPrefix} onChange={(e) => setServerPrefix(e.target.value)} placeholder="us21" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mc-list">List / Audience ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="mc-list" value={listId} onChange={(e) => setListId(e.target.value)} placeholder="abc123def4" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Save Mailchimp Settings
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Social Media Card ────────────────────────────────────────

function SocialMediaCard({
  clientId,
  meta,
  linkedin,
  onSaved,
}: {
  clientId: string
  meta?: IntegrationConfig['meta']
  linkedin?: IntegrationConfig['linkedin']
  onSaved: (meta: IntegrationConfig['meta'], linkedin: IntegrationConfig['linkedin']) => void
}) {
  const [accessToken, setAccessToken] = useState(meta?.access_token || '')
  const [fbPageId, setFbPageId] = useState(meta?.facebook_page_id || '')
  const [igAccountId, setIgAccountId] = useState(meta?.instagram_account_id || '')
  const [linkedinOrgId, setLinkedinOrgId] = useState(linkedin?.org_id || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const metaConfig = accessToken.trim()
      ? {
          access_token: accessToken.trim(),
          ...(fbPageId.trim() ? { facebook_page_id: fbPageId.trim() } : {}),
          ...(igAccountId.trim() ? { instagram_account_id: igAccountId.trim() } : {}),
        }
      : undefined

    const linkedinConfig = linkedinOrgId.trim()
      ? { org_id: linkedinOrgId.trim() }
      : undefined

    // Save both in one call
    const res = await fetch('/api/settings/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        integrations: {
          ...(metaConfig !== undefined ? { meta: metaConfig } : {}),
          ...(linkedinConfig !== undefined ? { linkedin: linkedinConfig } : {}),
        },
      }),
    })

    if (res.ok) {
      toast.success('Social media settings saved')
      onSaved(metaConfig, linkedinConfig)
    } else {
      const data = await res.json()
      toast.error(`Failed to save: ${data.error}`)
    }
    setSaving(false)
  }

  const isConnected = !!meta?.access_token || !!linkedin?.org_id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-5 w-5" />
            Social Media
          </CardTitle>
          <StatusDot connected={isConnected} />
        </div>
        <CardDescription>Publish to Facebook, Instagram, and LinkedIn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meta-token">Meta Access Token</Label>
          <PasswordInput id="meta-token" value={accessToken} onChange={setAccessToken} placeholder="EAAxxxxxxxx..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fb-page">Facebook Page ID</Label>
            <Input id="fb-page" value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="123456789" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ig-account">Instagram Account ID</Label>
            <Input id="ig-account" value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} placeholder="987654321" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="li-org">LinkedIn Organization ID</Label>
          <Input id="li-org" value={linkedinOrgId} onChange={(e) => setLinkedinOrgId(e.target.value)} placeholder="12345678" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Save Social Media Settings
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── n8n Card ─────────────────────────────────────────────────

function N8nCard({
  clientId,
  config,
  onSaved,
}: {
  clientId: string
  config?: IntegrationConfig['n8n']
  onSaved: (n8n: IntegrationConfig['n8n']) => void
}) {
  const [baseUrl, setBaseUrl] = useState(config?.base_url || '')
  const [webhookSecret, setWebhookSecret] = useState(config?.webhook_secret || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!baseUrl.trim()) { toast.error('n8n Base URL is required'); return }
    setSaving(true)
    const n8n = {
      base_url: baseUrl.trim(),
      ...(webhookSecret.trim() ? { webhook_secret: webhookSecret.trim() } : {}),
    }
    const ok = await saveIntegration(clientId, 'n8n', n8n)
    if (ok) onSaved(n8n)
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-5 w-5" />
            n8n Automation
          </CardTitle>
          <StatusDot connected={!!config?.base_url} />
        </div>
        <CardDescription>Connect to n8n for automated publishing workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="n8n-url">Base URL</Label>
          <Input id="n8n-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://n8n.yoursite.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n8n-secret">Webhook Secret <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <PasswordInput id="n8n-secret" value={webhookSecret} onChange={setWebhookSecret} placeholder="your-webhook-secret" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          Save n8n Settings
        </Button>
      </CardContent>
    </Card>
  )
}
