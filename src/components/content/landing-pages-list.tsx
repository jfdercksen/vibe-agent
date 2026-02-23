'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import {
  Globe, Search, Target, Copy, Check, ChevronRight,
  ExternalLink, ArrowRight, Info, LayoutTemplate,
  MessageSquare, Layers, List, HelpCircle, Star, Pencil,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { LandingPage, LandingPageStatus, LandingPageSection } from '@/lib/types/database'

interface LandingPagesListProps {
  pages: LandingPage[]
  clientId: string
}

// ── Page type config ──────────────────────────────────────────────────────────
const PAGE_TYPE_CONFIG = {
  seo:           { label: 'SEO',           color: 'bg-blue-100 text-blue-700',   icon: Search },
  programmatic:  { label: 'Programmatic',  color: 'bg-purple-100 text-purple-700', icon: LayoutTemplate },
  campaign:      { label: 'Campaign',      color: 'bg-orange-100 text-orange-700', icon: Target },
}

// ── Section type icon ──────────────────────────────────────────────────────────
function SectionIcon({ type }: { type: string }) {
  switch (type) {
    case 'features':
    case 'benefits':     return <List className="h-3.5 w-3.5" />
    case 'testimonials': return <Star className="h-3.5 w-3.5" />
    case 'faq':          return <HelpCircle className="h-3.5 w-3.5" />
    case 'cta':          return <ArrowRight className="h-3.5 w-3.5" />
    case 'social_proof': return <Star className="h-3.5 w-3.5" />
    default:             return <Layers className="h-3.5 w-3.5" />
  }
}

// ── Section renderer ───────────────────────────────────────────────────────────
function SectionCard({ section }: { section: LandingPageSection }) {
  const typeLabel = section.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <SectionIcon type={section.type} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{typeLabel}</span>
      </div>
      {section.headline && (
        <p className="text-sm font-semibold leading-snug">{section.headline}</p>
      )}
      {section.body && (
        <p className="text-xs text-muted-foreground line-clamp-3">{section.body}</p>
      )}
      {section.bullets && section.bullets.length > 0 && (
        <ul className="space-y-0.5">
          {section.bullets.slice(0, 4).map((b, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {b}
            </li>
          ))}
          {section.bullets.length > 4 && (
            <li className="text-xs text-muted-foreground/60">+{section.bullets.length - 4} more…</li>
          )}
        </ul>
      )}
      {section.items && section.items.length > 0 && (
        <div className="space-y-1">
          {section.items.slice(0, 3).map((item, i) => (
            <div key={i} className="text-xs">
              {item.q && <p className="font-medium">{item.q}</p>}
              {item.a && <p className="text-muted-foreground line-clamp-1">{item.a}</p>}
              {item.quote && <p className="italic text-muted-foreground line-clamp-1">&ldquo;{item.quote}&rdquo;</p>}
              {item.author && <p className="text-muted-foreground/70">— {item.author}{item.role ? `, ${item.role}` : ''}</p>}
            </div>
          ))}
          {section.items.length > 3 && (
            <p className="text-xs text-muted-foreground/60">+{section.items.length - 3} more…</p>
          )}
        </div>
      )}
      {section.cta_text && (
        <div className="pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <ArrowRight className="h-2.5 w-2.5" /> {section.cta_text}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const statusOptions: LandingPageStatus[] = ['draft', 'review', 'approved', 'published', 'archived']

function LandingPageEditModal({
  page,
  open,
  onClose,
  onSaved,
}: {
  page: LandingPage
  open: boolean
  onClose: () => void
  onSaved: (patch: Partial<LandingPage>) => void
}) {
  const [title,           setTitle]           = useState(page.title)
  const [status,          setStatus]          = useState<LandingPageStatus>(page.status)
  const [headline,        setHeadline]        = useState(page.headline || '')
  const [subheadline,     setSubheadline]     = useState(page.subheadline || '')
  const [heroBody,        setHeroBody]        = useState(page.hero_body || '')
  const [ctaPrimaryText,  setCtaPrimaryText]  = useState(page.cta_primary_text || '')
  const [ctaPrimaryUrl,   setCtaPrimaryUrl]   = useState(page.cta_primary_url || '')
  const [slug,            setSlug]            = useState(page.slug || '')
  const [targetKeyword,   setTargetKeyword]   = useState(page.target_keyword || '')
  const [metaTitle,       setMetaTitle]       = useState(page.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(page.meta_description || '')
  const [publishedUrl,    setPublishedUrl]    = useState(page.published_url || '')
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    const patch: Partial<LandingPage> = {
      title:           title.trim(),
      status,
      headline:        headline.trim() || null,
      subheadline:     subheadline.trim() || null,
      hero_body:       heroBody.trim() || null,
      cta_primary_text: ctaPrimaryText.trim() || null,
      cta_primary_url:  ctaPrimaryUrl.trim() || null,
      slug:            slug.trim() || null,
      target_keyword:  targetKeyword.trim() || null,
      meta_title:      metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      published_url:   publishedUrl.trim() || null,
    }
    try {
      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'landing_pages', id: page.id, data: patch }),
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
          <DialogTitle>Edit Landing Page</DialogTitle>
          <DialogDescription className="sr-only">Edit landing page details</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}

          {/* Title + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LandingPageStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slug + Target Keyword */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>URL Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. web-design-london" />
            </div>
            <div className="space-y-1">
              <Label>Target Keyword</Label>
              <Input value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)} placeholder="e.g. web design london" />
            </div>
          </div>

          {/* Hero copy */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Hero Section</p>
            <div className="space-y-1">
              <Label>Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Main headline" />
            </div>
            <div className="space-y-1">
              <Label>Subheadline</Label>
              <Input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Supporting subheadline" />
            </div>
            <div className="space-y-1">
              <Label>Hero Body Copy</Label>
              <Textarea value={heroBody} onChange={(e) => setHeroBody(e.target.value)} placeholder="Hero paragraph copy" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>CTA Button Text</Label>
                <Input value={ctaPrimaryText} onChange={(e) => setCtaPrimaryText(e.target.value)} placeholder="Get Started" />
              </div>
              <div className="space-y-1">
                <Label>CTA URL</Label>
                <Input value={ctaPrimaryUrl} onChange={(e) => setCtaPrimaryUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* SEO meta */}
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">SEO Metadata</p>
            <div className="space-y-1">
              <Label>Meta Title <span className="text-muted-foreground text-xs">({metaTitle.length}/60)</span></Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO title tag" maxLength={60} />
            </div>
            <div className="space-y-1">
              <Label>Meta Description <span className="text-muted-foreground text-xs">({metaDescription.length}/155)</span></Label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO meta description" rows={2} maxLength={155} />
            </div>
          </div>

          {/* Published URL */}
          <div className="space-y-1">
            <Label>Published URL</Label>
            <p className="text-xs text-muted-foreground">The live URL once this page is published to your site</p>
            <Input value={publishedUrl} onChange={(e) => setPublishedUrl(e.target.value)} placeholder="https://yoursite.com/page-slug" />
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

// ── View Modal ─────────────────────────────────────────────────────────────────
function LandingPageViewModal({
  page,
  open,
  onClose,
  onEdit,
  onStatusChange,
}: {
  page: LandingPage | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [copied, setCopied] = useState(false)
  if (!page) return null

  const ptConfig = PAGE_TYPE_CONFIG[page.page_type] || PAGE_TYPE_CONFIG.seo

  const handleCopy = () => {
    const lines = [
      `# ${page.title}`,
      page.slug ? `URL: /${page.slug}` : '',
      page.target_keyword ? `Keyword: ${page.target_keyword}` : '',
      '',
      page.headline ? `## ${page.headline}` : '',
      page.subheadline ? page.subheadline : '',
      page.hero_body ? `\n${page.hero_body}` : '',
      page.cta_primary_text ? `\nCTA: ${page.cta_primary_text}` : '',
      '',
      ...(page.sections || []).map((s) => [
        `### ${s.type.replace(/_/g, ' ').toUpperCase()}`,
        s.headline || '',
        s.body || '',
        ...(s.bullets || []).map((b) => `• ${b}`),
      ].filter(Boolean).join('\n')),
      '',
      page.meta_title ? `Meta Title: ${page.meta_title}` : '',
      page.meta_description ? `Meta Description: ${page.meta_description}` : '',
    ].filter(l => l !== undefined).join('\n')

    navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sections = page.sections || []
  const templateVarsEntries = Object.entries(page.template_vars || {})

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ptConfig.color}`}>
                  <ptConfig.icon className="h-3 w-3" />
                  {ptConfig.label}
                </span>
                <StatusBadge status={page.status} />
                {page.target_keyword && (
                  <Badge variant="outline" className="text-xs">
                    <Search className="h-2.5 w-2.5 mr-1" />{page.target_keyword}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg leading-snug">{page.title}</DialogTitle>
              {page.slug && (
                <p className="text-xs text-muted-foreground mt-0.5">/{page.slug}</p>
              )}
            </div>
          </div>
          <DialogDescription className="sr-only">Landing page details and copy</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Hero section */}
          {(page.headline || page.subheadline || page.hero_body) && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Hero Section</p>
              {page.headline && <p className="text-xl font-bold leading-tight">{page.headline}</p>}
              {page.subheadline && <p className="text-sm text-muted-foreground">{page.subheadline}</p>}
              {page.hero_body && <p className="text-sm leading-relaxed">{page.hero_body}</p>}
              {page.cta_primary_text && (
                <div className="flex gap-2 flex-wrap pt-1">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
                    {page.cta_primary_text}
                  </span>
                  {page.cta_secondary_text && (
                    <span className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
                      {page.cta_secondary_text}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          {sections.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Page Sections ({sections.length})
              </p>
              <div className="space-y-2">
                {sections.map((section, i) => (
                  <SectionCard key={i} section={section} />
                ))}
              </div>
            </div>
          )}

          {/* Template vars (programmatic pages) */}
          {templateVarsEntries.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Template Variables</p>
              <div className="flex flex-wrap gap-2">
                {templateVarsEntries.map(([key, val]) => (
                  <div key={key} className="rounded-md bg-muted/50 border px-3 py-1 text-xs">
                    <span className="font-mono text-primary">{`{${key}}`}</span>
                    <span className="text-muted-foreground"> = {val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO meta */}
          {(page.meta_title || page.meta_description || page.target_keyword) && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SEO Metadata</p>
              {page.target_keyword && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Target Keyword</p>
                  <p className="text-sm font-medium">{page.target_keyword}</p>
                </div>
              )}
              {page.meta_title && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Meta Title</p>
                  <p className="text-sm">{page.meta_title}</p>
                </div>
              )}
              {page.meta_description && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Meta Description</p>
                  <p className="text-sm text-muted-foreground">{page.meta_description}</p>
                </div>
              )}
              {page.secondary_keywords && page.secondary_keywords.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Secondary Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {page.secondary_keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs font-normal">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Published URL */}
          {page.published_url && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Published URL</p>
              <a
                href={page.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {page.published_url}
              </a>
            </div>
          )}

          {/* Next steps */}
          <div className="rounded-md border border-dashed p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> Next steps
            </p>
            <p className="text-xs text-muted-foreground">
              Ask Vibe Chat: &quot;Generate hero images for this landing page&quot; or &quot;Write the email sequence for people who visit this page&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
            <ApprovalButtons
              table="landing_pages"
              recordId={page.id}
              currentStatus={page.status}
              approveStatus="approved"
              rejectStatus="archived"
              onStatusChange={(s) => onStatusChange(page.id, s)}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy Page'}
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

// ── Main List ──────────────────────────────────────────────────────────────────
export function LandingPagesList({ pages }: LandingPagesListProps) {
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<LandingPage>>>({})
  const [viewing, setViewing] = useState<LandingPage | null>(null)
  const [editing, setEditing] = useState<LandingPage | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'seo' | 'programmatic' | 'campaign'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const applyLocalUpdate = (id: string, patch: Partial<LandingPage>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
    if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, ...patch } : prev)
    if (editing?.id  === id) setEditing((prev)  => prev  ? { ...prev, ...patch }  : prev)
  }

  const merged = useMemo(
    () => pages.map((p) => localUpdates[p.id] ? { ...p, ...localUpdates[p.id] } : p),
    [pages, localUpdates]
  )

  const filtered = useMemo(() => merged.filter((p) => {
    if (typeFilter !== 'all' && p.page_type !== typeFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  }), [merged, typeFilter, statusFilter])

  if (pages.length === 0) {
    return (
      <Card className="py-14 text-center">
        <CardContent>
          <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium mb-1">No landing pages yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ask Vibe Chat to create SEO landing pages or programmatic page templates.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Create an SEO landing page for [keyword]',
              'Build programmatic location pages for my service',
              'Write a campaign landing page for this offer',
            ].map((prompt) => (
              <span
                key={prompt}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground"
              >
                <Globe className="h-3 w-3" />{prompt}
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
          <span className="font-medium text-foreground">Landing Pages</span> are conversion-optimised pages
          built for SEO rankings, programmatic location/service combinations, or campaign traffic.
          Click any card to view the full copy and approve it for production.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filter */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          {(['all', 'seo', 'programmatic', 'campaign'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'All Types' : PAGE_TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          {(['all', 'draft', 'review', 'approved', 'published'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {pages.length} page{pages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((page) => {
          const ptConfig = PAGE_TYPE_CONFIG[page.page_type] || PAGE_TYPE_CONFIG.seo
          const sections = page.sections || []
          const sectionTypes = [...new Set(sections.map((s) => s.type))]

          return (
            <Card
              key={page.id}
              className="flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
              onClick={() => setViewing(page as LandingPage)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors shrink-0">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ptConfig.color}`}>
                      <ptConfig.icon className="h-2.5 w-2.5" />
                      {ptConfig.label}
                    </span>
                  </div>
                  <StatusBadge status={page.status} />
                </div>
                <CardTitle className="text-base leading-snug mt-2 group-hover:text-primary transition-colors">
                  {page.title}
                </CardTitle>
                {page.slug && (
                  <p className="text-xs text-muted-foreground font-mono">/{page.slug}</p>
                )}
              </CardHeader>

              <CardContent className="flex-1 space-y-3">

                {/* Headline preview */}
                {page.headline && (
                  <p className="text-sm font-medium line-clamp-2">{page.headline}</p>
                )}

                {/* Keyword chip */}
                {page.target_keyword && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{page.target_keyword}</span>
                  </div>
                )}

                {/* Section preview */}
                {sectionTypes.length > 0 && (
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      {sections.length} section{sections.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sectionTypes.slice(0, 5).map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <SectionIcon type={type} />
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template vars (programmatic) */}
                {page.page_type === 'programmatic' && Object.keys(page.template_vars || {}).length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {Object.keys(page.template_vars).slice(0, 4).map((key) => (
                      <span key={key} className="text-[10px] font-mono text-purple-600 bg-purple-50 rounded px-1">{`{${key}}`}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(page.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1">
                    {page.published_url && (
                      <a
                        href={page.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    )}
                    <ApprovalButtons
                      table="landing_pages"
                      recordId={page.id}
                      currentStatus={page.status}
                      compact
                      approveStatus="approved"
                      rejectStatus="archived"
                      onStatusChange={(s) => applyLocalUpdate(page.id, { status: s as LandingPageStatus })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); setEditing(page as LandingPage) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setViewing(page as LandingPage)}
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* View Modal */}
      <LandingPageViewModal
        page={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onEdit={() => { setEditing(viewing); setViewing(null) }}
        onStatusChange={(id, status) => applyLocalUpdate(id, { status: status as LandingPageStatus })}
      />

      {/* Edit Modal */}
      {editing && (
        <LandingPageEditModal
          page={editing}
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={(patch) => { applyLocalUpdate(editing.id, patch) }}
        />
      )}
    </div>
  )
}
