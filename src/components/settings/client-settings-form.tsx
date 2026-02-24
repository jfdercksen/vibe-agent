'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Globe, Users, Palette, Save, Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Client, BusinessType } from '@/lib/types/database'

interface ClientSettingsFormProps {
  client: Client
}

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'info_education', label: 'Info / Education' },
  { value: 'consulting_agency', label: 'Consulting / Agency' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Other' },
]

export function ClientSettingsForm({ client }: ClientSettingsFormProps) {
  // ── Form state ───────────────────────────────────────────────
  const [name, setName] = useState(client.name || '')
  const [displayName, setDisplayName] = useState(client.display_name || '')
  const [businessType, setBusinessType] = useState<string>(client.business_type || '')
  const [industry, setIndustry] = useState(client.industry || '')
  const [website, setWebsite] = useState(client.website || '')
  const [targetAudience, setTargetAudience] = useState(client.target_audience || '')
  const [primaryGoal, setPrimaryGoal] = useState(client.primary_goal || '')
  const [competitors, setCompetitors] = useState<string[]>(
    Array.isArray(client.competitors) ? client.competitors.map(c => typeof c === 'string' ? c : JSON.stringify(c)) : []
  )
  const [newCompetitor, setNewCompetitor] = useState('')
  const [primaryColor, setPrimaryColor] = useState(client.branding?.primaryColor || '')
  const [secondaryColor, setSecondaryColor] = useState(client.branding?.secondaryColor || '')
  const [logoUrl, setLogoUrl] = useState(client.branding?.logo_url || '')

  const [saving, setSaving] = useState(false)

  // ── Save handler ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Client name is required')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        display_name: displayName.trim() || null,
        business_type: businessType || null,
        industry: industry.trim() || null,
        website: website.trim() || null,
        target_audience: targetAudience.trim() || null,
        primary_goal: primaryGoal.trim() || null,
        competitors: competitors.filter(Boolean),
        branding: {
          ...(primaryColor ? { primaryColor } : {}),
          ...(secondaryColor ? { secondaryColor } : {}),
          ...(logoUrl.trim() ? { logo_url: logoUrl.trim() } : {}),
        },
      }

      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.success('Client settings saved')
    } catch (err) {
      toast.error(`Failed to save: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Competitor helpers ───────────────────────────────────────
  const addCompetitor = () => {
    const val = newCompetitor.trim()
    if (val && !competitors.includes(val)) {
      setCompetitors([...competitors, val])
      setNewCompetitor('')
    }
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Business Profile ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How the name appears on content"
              />
            </div>
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((bt) => (
                    <SelectItem key={bt.value} value={bt.value}>
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. IT Support, Fashion, SaaS"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Digital Presence ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Digital Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Competitors</Label>
              <div className="space-y-2">
                {competitors.map((comp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={comp}
                      onChange={(e) => {
                        const updated = [...competitors]
                        updated[i] = e.target.value
                        setCompetitors(updated)
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCompetitor(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder="Add a competitor"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCompetitor()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={addCompetitor}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Audience & Goals ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audience & Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Textarea
                id="target_audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Describe your ideal customer"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_goal">Primary Goal</Label>
              <Input
                id="primary_goal"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="e.g. Generate leads, Increase brand awareness"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Branding ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor || '#000000'}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5"
                />
                <Input
                  id="primary_color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#FF6600"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor || '#000000'}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5"
                />
                <Input
                  id="secondary_color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#333333"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {logoUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 object-contain rounded border p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Save button ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
