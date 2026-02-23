'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import {
  Zap, Clock, ArrowRight, Target, ExternalLink,
  Copy, Check, Pencil, Info, Plus, X, FileText,
  Monitor, Globe, Code2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { LeadMagnet, LeadMagnetStatus } from '@/lib/types/database'

interface LeadMagnetsListProps {
  magnets: LeadMagnet[]
  clientId: string
}

const frameworkConfig: Record<string, { label: string; description: string }> = {
  quick_win:   { label: 'Quick Win',   description: 'Fast result that builds trust' },
  roadmap:     { label: 'Roadmap',     description: 'Step-by-step plan or guide' },
  toolkit:     { label: 'Toolkit',     description: 'Collection of resources/templates' },
  case_study:  { label: 'Case Study',  description: 'Proof via a real story' },
  assessment:  { label: 'Assessment',  description: 'Quiz or audit tool' },
  checklist:   { label: 'Checklist',   description: 'Action checklist' },
  template:    { label: 'Template',    description: 'Fill-in-the-blank resource' },
  webinar:     { label: 'Webinar',     description: 'Video training' },
  challenge:   { label: 'Challenge',   description: 'Multi-day challenge' },
  mini_course: { label: 'Mini Course', description: 'Short email course' },
}

const formatOptions = ['PDF', 'Video', 'Email Course', 'Checklist', 'Template', 'Quiz', 'Webinar', 'Spreadsheet', 'Swipe File']

const statusOptions: LeadMagnetStatus[] = ['concept', 'drafting', 'review', 'live', 'retired']

// ── Edit Modal ────────────────────────────────────────────────────────────────
function LeadMagnetEditModal({
  magnet,
  open,
  onClose,
  onSaved,
}: {
  magnet: LeadMagnet
  open: boolean
  onClose: () => void
  onSaved: (patch: Partial<LeadMagnet>) => void
}) {
  const [title,            setTitle]           = useState(magnet.title)
  const [framework,        setFramework]        = useState(magnet.framework || '')
  const [format,           setFormat]           = useState(magnet.format || '')
  const [status,           setStatus]           = useState<LeadMagnetStatus>(magnet.status)
  const [corePromise,      setCorePromise]      = useState(magnet.core_promise || '')
  const [timeToConsume,    setTimeToConsume]    = useState(magnet.time_to_consume || '')
  const [bridgeToOffer,    setBridgeToOffer]    = useState(magnet.bridge_to_offer || '')
  const [optInHeadline,    setOptInHeadline]    = useState(magnet.opt_in_headline || '')
  const [optInSubheadline, setOptInSubheadline] = useState(magnet.opt_in_subheadline || '')
  const [optInCta,         setOptInCta]         = useState(magnet.opt_in_cta || '')
  const [optInBullets,     setOptInBullets]     = useState<string[]>(magnet.opt_in_bullets || [])
  const [documentUrl,      setDocumentUrl]      = useState(magnet.document_url || '')
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const addBullet   = () => setOptInBullets((b) => [...b, ''])
  const removeBullet = (i: number) => setOptInBullets((b) => b.filter((_, idx) => idx !== i))
  const updateBullet = (i: number, val: string) =>
    setOptInBullets((b) => b.map((x, idx) => (idx === i ? val : x)))

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    const patch = {
      title: title.trim(),
      framework:          framework || null,
      format:             format || null,
      status,
      core_promise:       corePromise.trim() || null,
      time_to_consume:    timeToConsume.trim() || null,
      bridge_to_offer:    bridgeToOffer.trim() || null,
      opt_in_headline:    optInHeadline.trim() || null,
      opt_in_subheadline: optInSubheadline.trim() || null,
      opt_in_cta:         optInCta.trim() || null,
      opt_in_bullets:     optInBullets.filter(Boolean),
      document_url:       documentUrl.trim() || null,
    }
    try {
      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'lead_magnets', id: magnet.id, data: patch }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Save failed') }
      onSaved(patch)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead Magnet</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}

          {/* Title */}
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your lead magnet title" />
          </div>

          {/* Framework + Format + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Framework</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(frameworkConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {formatOptions.map((f) => (
                    <SelectItem key={f} value={f.toLowerCase().replace(' ', '_')}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LeadMagnetStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Core Promise */}
          <div className="space-y-1">
            <Label>Core Promise</Label>
            <p className="text-xs text-muted-foreground">The specific transformation or result the user gets</p>
            <Textarea
              value={corePromise}
              onChange={(e) => setCorePromise(e.target.value)}
              placeholder="e.g. Get 10 qualified leads in 30 days without paid ads"
              rows={2}
            />
          </div>

          {/* Opt-in headline / subheadline */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Opt-in Page Copy</p>
            <div className="space-y-1">
              <Label>Headline</Label>
              <Input value={optInHeadline} onChange={(e) => setOptInHeadline(e.target.value)} placeholder="FREE: The 5-Step Framework to..." />
            </div>
            <div className="space-y-1">
              <Label>Subheadline</Label>
              <Input value={optInSubheadline} onChange={(e) => setOptInSubheadline(e.target.value)} placeholder="Download the free guide and..." />
            </div>

            {/* Bullets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Benefit Bullets</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addBullet} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add bullet
                </Button>
              </div>
              {optInBullets.map((bullet, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    placeholder={`Benefit ${i + 1}`}
                    className="h-8 text-sm"
                  />
                  <button onClick={() => removeBullet(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <Label>CTA Button Text</Label>
              <Input value={optInCta} onChange={(e) => setOptInCta(e.target.value)} placeholder="Get Instant Access →" />
            </div>
          </div>

          {/* Time + Bridge */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Time to Consume</Label>
              <Input value={timeToConsume} onChange={(e) => setTimeToConsume(e.target.value)} placeholder="e.g. 15 min read" />
            </div>
            <div className="space-y-1">
              <Label>Bridge to Offer</Label>
              <Input value={bridgeToOffer} onChange={(e) => setBridgeToOffer(e.target.value)} placeholder="e.g. Book a strategy call" />
            </div>
          </div>

          {/* Document URL */}
          <div className="space-y-1">
            <Label>Document URL</Label>
            <p className="text-xs text-muted-foreground">Link to the actual PDF, video, or hosted resource</p>
            <Input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Expand / View Modal ───────────────────────────────────────────────────────
function LeadMagnetViewModal({
  magnet,
  open,
  onClose,
  onEdit,
  onStatusChange,
}: {
  magnet: LeadMagnet | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [copied,      setCopied]      = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [previewTab,  setPreviewTab]  = useState<'details' | 'interactive' | 'optin_page'>('details')

  if (!magnet) return null

  const fw = frameworkConfig[magnet.framework || '']

  const hasInteractive = !!magnet.interactive_url
  const hasOptinPage   = !!magnet.optin_page_url
  const showTabs       = hasInteractive || hasOptinPage

  const copyText = [
    `# ${magnet.title}`,
    magnet.core_promise ? `Promise: ${magnet.core_promise}` : '',
    magnet.opt_in_headline ? `\nHeadline: ${magnet.opt_in_headline}` : '',
    magnet.opt_in_subheadline ? `Subheadline: ${magnet.opt_in_subheadline}` : '',
    magnet.opt_in_bullets.length ? `\nBullets:\n${magnet.opt_in_bullets.map((b) => `• ${b}`).join('\n')}` : '',
    magnet.opt_in_cta ? `\nCTA: ${magnet.opt_in_cta}` : '',
    magnet.bridge_to_offer ? `\nBridge: ${magnet.bridge_to_offer}` : '',
  ].filter(Boolean).join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEmbedCopy = () => {
    if (!magnet.interactive_url) return
    const embedCode = `<iframe\n  src="${magnet.interactive_url}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  scrolling="no"\n  title="${magnet.title}"\n  sandbox="allow-scripts allow-same-origin allow-forms"\n></iframe>`
    navigator.clipboard.writeText(embedCode)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {magnet.framework && fw && (
                  <Badge variant="outline" className="text-xs">{fw.label}</Badge>
                )}
                {magnet.format && (
                  <Badge variant="secondary" className="text-xs uppercase">{magnet.format}</Badge>
                )}
              </div>
              <DialogTitle className="text-lg">{magnet.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Bar — only shown when at least one HTML asset exists */}
        {showTabs && (
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setPreviewTab('details')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                previewTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Details
            </button>
            {hasInteractive && (
              <button
                onClick={() => setPreviewTab('interactive')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  previewTab === 'interactive'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Interactive Tool
              </button>
            )}
            {hasOptinPage && (
              <button
                onClick={() => setPreviewTab('optin_page')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  previewTab === 'optin_page'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> Opt-in Page
              </button>
            )}
          </div>
        )}

        <div className="space-y-5 pt-2">

          {/* ── DETAILS TAB ── */}
          {previewTab === 'details' && (
            <>
              {/* Status row */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={magnet.status} />
                {magnet.time_to_consume && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {magnet.time_to_consume}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(magnet.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Core Promise */}
              {magnet.core_promise && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Core Promise</p>
                  <p className="text-sm font-medium">{magnet.core_promise}</p>
                </div>
              )}

              {/* Opt-in copy preview */}
              {magnet.opt_in_headline && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Opt-in Page Preview</p>
                  <p className="font-semibold">{magnet.opt_in_headline}</p>
                  {magnet.opt_in_subheadline && (
                    <p className="text-sm text-muted-foreground">{magnet.opt_in_subheadline}</p>
                  )}
                  {magnet.opt_in_bullets.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {magnet.opt_in_bullets.map((bullet, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Target className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  {magnet.opt_in_cta && (
                    <div className="pt-2">
                      <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
                        {magnet.opt_in_cta}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bridge to offer */}
              {magnet.bridge_to_offer && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bridge to Paid Offer</p>
                  <p className="text-sm flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    {magnet.bridge_to_offer}
                  </p>
                </div>
              )}

              {/* Conversion rate */}
              {magnet.conversion_rate !== null && magnet.conversion_rate !== undefined && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{magnet.conversion_rate}% conversion rate</span>
                </div>
              )}

              {/* Document link */}
              {magnet.document_url && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document</p>
                  <a
                    href={magnet.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View / Download
                  </a>
                </div>
              )}

              {/* HTML Asset Status */}
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTML Assets</p>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">Interactive Tool:</span>
                  {magnet.interactive_url
                    ? <span className="text-xs text-green-600 font-medium">Ready — view in Interactive Tool tab</span>
                    : <span className="text-xs text-muted-foreground">Ask Vibe Chat to generate a quiz, scorecard, or calculator</span>
                  }
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">Opt-in Page:</span>
                  {magnet.optin_page_url
                    ? <span className="text-xs text-green-600 font-medium">Ready — view in Opt-in Page tab</span>
                    : <span className="text-xs text-muted-foreground">Ask Vibe Chat to generate the opt-in landing page</span>
                  }
                </div>
              </div>

              {/* Next step hint */}
              <div className="rounded-md border border-dashed p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Next step
                </p>
                <p className="text-xs text-muted-foreground">
                  Ask Vibe Chat: &quot;Create the interactive quiz for this lead magnet&quot; or &quot;Generate the opt-in page HTML&quot;
                </p>
              </div>
            </>
          )}

          {/* ── INTERACTIVE TOOL TAB ── */}
          {previewTab === 'interactive' && (
            <div className="space-y-3">
              {magnet.interactive_url ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-muted-foreground">Live preview of the interactive tool</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEmbedCopy}>
                        {embedCopied
                          ? <><Check className="h-4 w-4 mr-1 text-green-500" /> Copied</>
                          : <><Code2 className="h-4 w-4 mr-1" /> Copy Embed Code</>
                        }
                      </Button>
                      <a href={magnet.interactive_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" /> Full Screen
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-white">
                    <iframe
                      src={magnet.interactive_url}
                      className="w-full"
                      style={{ height: '520px', border: 'none' }}
                      title={`Interactive tool: ${magnet.title}`}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sandboxed preview — popups and navigation are blocked. Use &quot;Copy Embed Code&quot; to place this tool on any webpage.
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center space-y-2">
                  <Monitor className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-medium text-sm">No interactive tool generated yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Ask Vibe Chat: &quot;Create an interactive quiz for this lead magnet&quot; or &quot;Build a scorecard tool for [topic]&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── OPT-IN PAGE TAB ── */}
          {previewTab === 'optin_page' && (
            <div className="space-y-3">
              {magnet.optin_page_url ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm text-muted-foreground">Live preview of the opt-in landing page</p>
                    <a href={magnet.optin_page_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" /> Full Screen
                      </Button>
                    </a>
                  </div>
                  <div className="rounded-lg border overflow-hidden bg-white">
                    <iframe
                      src={magnet.optin_page_url}
                      className="w-full"
                      style={{ height: '520px', border: 'none' }}
                      title={`Opt-in page: ${magnet.title}`}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sandboxed preview — form submissions do not trigger in preview mode.
                  </p>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center space-y-2">
                  <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="font-medium text-sm">No opt-in page generated yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Ask Vibe Chat: &quot;Generate the HTML opt-in page for this lead magnet&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions — always shown at bottom */}
          <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
            <ApprovalButtons
              table="lead_magnets"
              recordId={magnet.id}
              currentStatus={magnet.status}
              approveStatus="live"
              rejectStatus="retired"
              onStatusChange={(s) => onStatusChange(magnet.id, s)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main List ─────────────────────────────────────────────────────────────────
export function LeadMagnetsList({ magnets }: LeadMagnetsListProps) {
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<LeadMagnet>>>({})
  const [viewing,  setViewing]  = useState<LeadMagnet | null>(null)
  const [editing,  setEditing]  = useState<LeadMagnet | null>(null)

  const applyLocalUpdate = (id: string, patch: Partial<LeadMagnet>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
    if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, ...patch } : prev)
    if (editing?.id  === id) setEditing((prev)  => prev  ? { ...prev, ...patch }  : prev)
  }

  const merged = useMemo(
    () => magnets.map((m) => localUpdates[m.id] ? { ...m, ...localUpdates[m.id] } : m),
    [magnets, localUpdates]
  )

  const openView = (m: LeadMagnet) => { setViewing(m); setEditing(null) }
  const openEdit = (m: LeadMagnet) => { setEditing(m); setViewing(null) }

  if (magnets.length === 0) {
    return (
      <Card className="py-14 text-center">
        <CardContent>
          <Zap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium mb-1">No lead magnets yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ask Vibe Chat to design a lead magnet opt-in offer for this client.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Create a lead magnet concept for this client',
              'Design a free guide opt-in offer',
              'Build a 5-day email challenge lead magnet',
            ].map((prompt) => (
              <span key={prompt} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />{prompt}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Lead Magnets</span> are your opt-in offers — free resources that turn visitors
          into subscribers. Click any card to view the full copy, edit the details, or approve it for production.
          Each magnet should deliver a quick win and bridge naturally to your paid offer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {merged.map((magnet) => {
          const fw = frameworkConfig[magnet.framework || '']
          return (
            <Card
              key={magnet.id}
              className="flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
              onClick={() => openView(magnet as LeadMagnet)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {magnet.framework && fw && (
                        <Badge variant="outline" className="text-xs">{fw.label}</Badge>
                      )}
                      {magnet.format && (
                        <Badge variant="secondary" className="text-xs uppercase">{magnet.format}</Badge>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={magnet.status} />
                </div>
                <CardTitle className="text-base leading-snug mt-2 group-hover:text-primary transition-colors">
                  {magnet.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {magnet.core_promise && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{magnet.core_promise}</p>
                )}

                {magnet.opt_in_headline && (
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-xs font-medium line-clamp-1">{magnet.opt_in_headline}</p>
                    {magnet.opt_in_bullets.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {magnet.opt_in_bullets.length} benefit bullet{magnet.opt_in_bullets.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {magnet.time_to_consume && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {magnet.time_to_consume}
                      </span>
                    )}
                    {magnet.conversion_rate !== null && magnet.conversion_rate !== undefined && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Zap className="h-3 w-3" /> {magnet.conversion_rate}%
                      </span>
                    )}
                    {magnet.document_url && (
                      <a
                        href={magnet.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View doc
                      </a>
                    )}
                    {magnet.interactive_url && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Monitor className="h-3 w-3" /> Quiz ready
                      </span>
                    )}
                    {magnet.optin_page_url && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Globe className="h-3 w-3" /> Page ready
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); openEdit(magnet as LeadMagnet) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ApprovalButtons
                      table="lead_magnets"
                      recordId={magnet.id}
                      currentStatus={magnet.status}
                      compact
                      approveStatus="live"
                      rejectStatus="retired"
                      onStatusChange={(s) => applyLocalUpdate(magnet.id, { status: s as LeadMagnetStatus })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* View Modal */}
      <LeadMagnetViewModal
        magnet={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(viewing); setViewing(null) }}
        onStatusChange={(id, status) => applyLocalUpdate(id, { status: status as LeadMagnetStatus })}
      />

      {/* Edit Modal */}
      {editing && (
        <LeadMagnetEditModal
          magnet={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={(patch) => { applyLocalUpdate(editing.id, patch as Partial<LeadMagnet>) }}
        />
      )}
    </div>
  )
}
