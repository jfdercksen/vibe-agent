'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import {
  Megaphone, Target, Copy, Check, ChevronRight,
  ImageIcon, Play, LayoutGrid, BookOpen, Layers,
  Info, Lightbulb, ExternalLink, RefreshCw, Type,
  AlignLeft, Captions,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { CreativeBrief, BriefStatus } from '@/lib/types/database'
import { ImageGeneratorPanel } from '@/components/images/image-generator-panel'

interface AdBriefsListProps {
  briefs: CreativeBrief[]
  clientId: string
}

// ── Format icon mapping ───────────────────────────────────────────────────────
function FormatIcon({ format }: { format: string }) {
  const f = format?.toLowerCase() || ''
  if (f.includes('video') || f.includes('ugc'))    return <Play className="h-3.5 w-3.5" />
  if (f.includes('carousel') || f.includes('multi')) return <LayoutGrid className="h-3.5 w-3.5" />
  if (f.includes('story'))                           return <Layers className="h-3.5 w-3.5" />
  if (f.includes('static') || f.includes('image'))  return <ImageIcon className="h-3.5 w-3.5" />
  return <BookOpen className="h-3.5 w-3.5" />
}

// ── Format display label ──────────────────────────────────────────────────────
function formatLabel(format: string): string {
  const map: Record<string, string> = {
    static:       'Static',
    carousel:     'Carousel',
    ugc_video:    'UGC Video',
    short_video:  'Short-Form Video',
    story:        'Story',
  }
  return map[format?.toLowerCase()] || format || 'Unknown'
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  draft:         'bg-slate-100 text-slate-700',
  review:        'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  in_production: 'bg-blue-100 text-blue-700',
  complete:      'bg-emerald-100 text-emerald-700',
}

// ── Concept Card ──────────────────────────────────────────────────────────────
const isVideoFormat = (format: string) => {
  const f = format?.toLowerCase() || ''
  return f.includes('video') || f.includes('ugc')
}

function CharCount({ value, max }: { value: string | null; max: number }) {
  const len = value?.length ?? 0
  const over = len > max
  return (
    <span className={`text-[10px] tabular-nums ${over ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
      {len}/{max}
    </span>
  )
}

function ConceptCard({
  concept,
  index,
  isSelected,
  onSelect,
  onImageSaved,
  clientId,
}: {
  concept: CreativeBrief['concepts'][number]
  index: number
  isSelected: boolean
  onSelect: () => void
  onImageSaved: (idx: number, url: string) => void
  clientId: string
}) {
  const [copied, setCopied] = useState(false)
  const [showImageGen, setShowImageGen] = useState(false)
  const isVideo = isVideoFormat(concept.format)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const lines = [
      `## ${concept.name}`,
      concept.platform ? `Platform: ${concept.platform}` : '',
      `Format: ${concept.format}`,
      `Hook: ${concept.hook}`,
      concept.visual_direction ? `\nVisual Direction:\n${concept.visual_direction}` : '',
      concept.primary_text ? `\nPrimary Text:\n${concept.primary_text}` : '',
      concept.headline ? `Headline: ${concept.headline}` : '',
      concept.description ? `Description: ${concept.description}` : '',
      isVideo && concept.copy_direction ? `\nScript:\n${concept.copy_direction}` : '',
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`rounded-lg border transition-all overflow-hidden ${
        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:border-primary/40'
      }`}
    >
      {/* ── Header row — click to select ── */}
      <div
        className="flex items-start justify-between gap-2 p-4 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
          <span className="font-medium text-sm break-words [overflow-wrap:anywhere]">{concept.name}</span>
          {isSelected && (
            <Badge className="text-[10px] h-4 bg-primary text-primary-foreground px-1.5">Selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {concept.platform && (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
              {concept.platform}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
            <FormatIcon format={concept.format} />
            {formatLabel(concept.format)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy concept"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="px-4 pb-4 space-y-3">

        {/* Hook */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Hook</p>
          <p className="text-sm italic text-foreground/80 leading-snug break-words [overflow-wrap:anywhere]">&ldquo;{concept.hook}&rdquo;</p>
        </div>

        {/* Visual direction */}
        {concept.visual_direction && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Visual Direction</p>
            <p className="text-xs text-muted-foreground line-clamp-2 break-words [overflow-wrap:anywhere]">{concept.visual_direction}</p>
          </div>
        )}

        {/* Facebook ad copy — Primary Text, Headline, Description */}
        {(concept.primary_text || concept.headline || concept.description) && (
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1 flex items-center gap-1">
              <Megaphone className="h-3 w-3" /> Facebook Ad Copy
            </p>
            {concept.primary_text && (
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <AlignLeft className="h-3 w-3" /> Primary Text
                  </span>
                </div>
                <p className="text-xs text-foreground break-words [overflow-wrap:anywhere] whitespace-pre-line">{concept.primary_text}</p>
              </div>
            )}
            {(concept.headline || concept.description) && (
              <div className="grid grid-cols-2 gap-2 min-w-0">
                {concept.headline && (
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Type className="h-3 w-3" /> Headline
                      </span>
                      <CharCount value={concept.headline} max={27} />
                    </div>
                    <p className="text-xs font-medium text-foreground break-words [overflow-wrap:anywhere]">{concept.headline}</p>
                  </div>
                )}
                {concept.description && (
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Captions className="h-3 w-3" /> Description
                      </span>
                      <CharCount value={concept.description} max={27} />
                    </div>
                    <p className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">{concept.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Script — video formats only */}
        {isVideo && concept.copy_direction && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Script</p>
            <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line break-words [overflow-wrap:anywhere]">{concept.copy_direction}</p>
          </div>
        )}

        {/* Per-concept image */}
        <div className="border rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {concept.image_url ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={concept.image_url} alt={`${concept.name} creative`} className="w-full object-cover max-h-48" />
              <div className="p-2 bg-muted/30 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Saved to Media Library
                </span>
                <div className="flex items-center gap-1">
                  <a href={concept.image_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Open full image">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => setShowImageGen((v) => !v)}>
                    <RefreshCw className="h-2.5 w-2.5" />
                    {showImageGen ? 'Hide' : 'Regenerate'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2 flex items-center justify-between gap-2 bg-muted/20">
              <span className="text-[10px] text-muted-foreground">No image generated</span>
              <Button variant="outline" size="sm" className="h-6 gap-1 text-[10px]" onClick={() => setShowImageGen((v) => !v)}>
                <ImageIcon className="h-2.5 w-2.5" />
                {showImageGen ? 'Hide' : 'Generate Image'}
              </Button>
            </div>
          )}
          {showImageGen && (
            <div className="border-t p-3">
              <ImageGeneratorPanel
                clientId={clientId}
                defaultUseCase="ad_creative"
                defaultPrompt={[
                  `Ad creative concept: "${concept.name}"`,
                  concept.visual_direction ? `Visual direction: ${concept.visual_direction}` : '',
                  concept.hook ? `Hook: ${concept.hook}` : '',
                  concept.platform ? `Platform: ${concept.platform}` : '',
                  concept.format ? `Format: ${concept.format}` : '',
                ].filter(Boolean).join(' — ')}
                referenceTable="creative_briefs"
                referenceId={clientId}
                compact
                onImageSaved={async (asset) => {
                  const url = 'file_url' in asset ? asset.file_url : ''
                  if (url) {
                    onImageSaved(index, url)
                    setShowImageGen(false)
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── View Modal ────────────────────────────────────────────────────────────────
function AdBriefViewModal({
  brief,
  open,
  onClose,
  onStatusChange,
  onSelectConcept,
  onConceptImageSaved,
  clientId,
}: {
  brief: CreativeBrief | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  onSelectConcept: (briefId: string, idx: number) => void
  onConceptImageSaved: (briefId: string, conceptIdx: number, url: string) => void
  clientId: string
}) {
  const [copied, setCopied] = useState(false)
  if (!brief) return null

  const handleCopy = () => {
    const lines = [
      `# ${brief.brief_name}`,
      brief.campaign_goal ? `Goal: ${brief.campaign_goal}` : '',
      brief.target_audience ? `Audience: ${brief.target_audience}` : '',
      brief.key_message ? `\nKey Message: ${brief.key_message}` : '',
      brief.tone_and_mood ? `Tone: ${brief.tone_and_mood}` : '',
      brief.mandatory_elements.length ? `\nMust Include: ${brief.mandatory_elements.join(', ')}` : '',
      brief.avoid_elements.length ? `Avoid: ${brief.avoid_elements.join(', ')}` : '',
      ...(brief.concepts || []).map((c, i) => [
        `\n## Concept ${i + 1}: ${c.name}`,
        c.platform ? `Platform: ${c.platform}` : '',
        `Format: ${c.format}`,
        `Hook: ${c.hook}`,
        c.visual_direction ? `Visual Direction: ${c.visual_direction}` : '',
        c.primary_text ? `Primary Text: ${c.primary_text}` : '',
        c.headline ? `Headline: ${c.headline}` : '',
        c.description ? `Description: ${c.description}` : '',
        isVideoFormat(c.format) && c.copy_direction ? `Script:\n${c.copy_direction}` : '',
      ].filter(Boolean).join('\n')),
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const concepts = brief.concepts || []
  const selectedIdx = brief.selected_concept ?? null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 shrink-0">
              <Megaphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge status={brief.status} />
                {brief.campaign_goal && (
                  <Badge variant="outline" className="text-xs truncate max-w-[200px]">{brief.campaign_goal}</Badge>
                )}
              </div>
              <DialogTitle className="text-lg leading-snug break-words">{brief.brief_name}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Ad creative brief details and concepts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 overflow-y-auto overflow-x-hidden min-w-0 flex-1 pr-1">

          {/* Meta strip */}
          <div className="grid grid-cols-2 gap-3 text-sm min-w-0">
            {brief.target_audience && (
              <div className="rounded-lg bg-muted/50 p-3 overflow-hidden min-w-0 w-full">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Target Audience</p>
                <p className="text-sm leading-snug break-words [overflow-wrap:anywhere]">{brief.target_audience}</p>
              </div>
            )}
            {brief.tone_and_mood && (
              <div className="rounded-lg bg-muted/50 p-3 overflow-hidden min-w-0 w-full">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tone & Mood</p>
                <p className="text-sm break-words [overflow-wrap:anywhere]">{brief.tone_and_mood}</p>
              </div>
            )}
          </div>

          {/* Key message */}
          {brief.key_message && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 overflow-hidden min-w-0 w-full">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Key Message</p>
              <p className="text-sm font-medium break-words [overflow-wrap:anywhere]">{brief.key_message}</p>
            </div>
          )}

          {/* Mandatory / Avoid */}
          {(brief.mandatory_elements.length > 0 || brief.avoid_elements.length > 0) && (
            <div className="grid grid-cols-2 gap-3 overflow-hidden min-w-0">
              {brief.mandatory_elements.length > 0 && (
                <div className="overflow-hidden min-w-0 w-full">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Must Include</p>
                  <div className="flex flex-wrap gap-1">
                    {brief.mandatory_elements.map((el) => (
                      <Badge key={el} variant="secondary" className="text-xs font-normal max-w-full break-words [overflow-wrap:anywhere]">{el}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {brief.avoid_elements.length > 0 && (
                <div className="overflow-hidden min-w-0 w-full">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Avoid</p>
                  <div className="flex flex-wrap gap-1">
                    {brief.avoid_elements.map((el) => (
                      <Badge key={el} variant="outline" className="text-xs font-normal text-destructive border-destructive/30 max-w-full break-words [overflow-wrap:anywhere]">{el}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Concepts */}
          {concepts.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                Ad Concepts ({concepts.length})
              </p>
              <div className="space-y-3">
                {concepts.map((concept, idx) => (
                  <ConceptCard
                    key={idx}
                    concept={concept}
                    index={idx}
                    isSelected={selectedIdx === idx}
                    onSelect={() => onSelectConcept(brief.id, idx)}
                    onImageSaved={(conceptIdx, url) => onConceptImageSaved(brief.id, conceptIdx, url)}
                    clientId={clientId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Production specs */}
          {Array.isArray(brief.production_specs) && brief.production_specs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Production Specs</p>
              <div className="space-y-1.5">
                {(brief.production_specs as Array<Record<string, string>>).map((spec, i) => (
                  <div key={i} className="rounded-md bg-muted/50 px-3 py-2 text-xs break-words [overflow-wrap:anywhere]">
                    <span className="font-medium">{spec.format || spec.name}</span>
                    {spec.dimensions && <span className="text-muted-foreground"> — {spec.dimensions}</span>}
                    {spec.file_type && <span className="text-muted-foreground"> · {spec.file_type}</span>}
                    {spec.notes && <span className="text-muted-foreground"> · {spec.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t gap-2 flex-wrap">
            <ApprovalButtons
              table="creative_briefs"
              recordId={brief.id}
              currentStatus={brief.status}
              approveStatus="approved"
              rejectStatus="draft"
              onStatusChange={(s) => onStatusChange(brief.id, s)}
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy Brief'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main List ──────────────────────────────────────────────────────────────────
export function AdBriefsList({ briefs, clientId }: AdBriefsListProps) {
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<CreativeBrief>>>({})
  const [viewing, setViewing] = useState<CreativeBrief | null>(null)

  const applyLocalUpdate = (id: string, patch: Partial<CreativeBrief>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
    if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, ...patch } : prev)
  }

  const merged = useMemo(
    () => briefs.map((b) => localUpdates[b.id] ? { ...b, ...localUpdates[b.id] } : b),
    [briefs, localUpdates]
  )

  // Select a concept — optimistic update + API call
  const handleSelectConcept = async (briefId: string, idx: number) => {
    applyLocalUpdate(briefId, { selected_concept: idx })
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'creative_briefs', id: briefId, fields: { selected_concept: idx } }),
    })
  }

  // Save image to a specific concept — updates concept JSONB in-place + syncs brief image_url if it's the selected concept
  const handleConceptImageSaved = async (briefId: string, conceptIdx: number, url: string) => {
    const brief = merged.find((b) => b.id === briefId)
    if (!brief) return
    const updatedConcepts = (brief.concepts || []).map((c, i) =>
      i === conceptIdx ? { ...c, image_url: url } : c
    )
    // If this concept is the selected one, also update brief-level image_url for card view
    const isSelectedConcept = brief.selected_concept === conceptIdx
    const patch: Partial<CreativeBrief> = { concepts: updatedConcepts }
    if (isSelectedConcept) patch.image_url = url
    applyLocalUpdate(briefId, patch)
    // Persist both concepts array and optionally image_url
    const fields: Record<string, unknown> = { concepts: updatedConcepts }
    if (isSelectedConcept) fields.image_url = url
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'creative_briefs', id: briefId, fields }),
    })
  }

  if (briefs.length === 0) {
    return (
      <Card className="py-14 text-center">
        <CardContent>
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium mb-1">No ad briefs yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Ask Vibe Chat to create a DTC ad creative brief for this client.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Create Meta ads for my product launch',
              'Write 3 ad concepts for our best-selling product',
              'Build a TikTok ad campaign for this offer',
            ].map((prompt) => (
              <span
                key={prompt}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground"
              >
                <Megaphone className="h-3 w-3" />{prompt}
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
          <span className="font-medium text-foreground">Ad Creative Briefs</span> contain your campaign strategy
          and multiple ad concepts. Click any card to view the full brief, read the ad copy, and select the
          winning concept to send to production.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {merged.map((brief) => {
          const concepts = brief.concepts || []
          const selectedConcept = brief.selected_concept !== null && brief.selected_concept !== undefined
            ? concepts[brief.selected_concept]
            : null
          const cardImageUrl = selectedConcept?.image_url ?? brief.image_url ?? null

          return (
            <Card
              key={brief.id}
              className="flex flex-col overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
              onClick={() => setViewing(brief as CreativeBrief)}
            >
              {/* Selected concept image thumbnail */}
              {cardImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cardImageUrl}
                  alt={selectedConcept?.name ?? 'Ad creative'}
                  className="w-full object-cover h-36"
                />
              )}
              <CardHeader className="pb-3 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors shrink-0">
                      <Megaphone className="h-4 w-4 text-orange-600" />
                    </div>
                    {brief.campaign_goal && (
                      <Badge variant="outline" className="text-xs">{brief.campaign_goal}</Badge>
                    )}
                  </div>
                  <StatusBadge status={brief.status} />
                </div>
                <CardTitle className="text-base leading-snug mt-2 group-hover:text-primary transition-colors break-words [overflow-wrap:anywhere]">
                  {brief.brief_name}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 space-y-3 min-w-0">

                {/* Key message */}
                {brief.key_message && (
                  <p className="text-sm text-muted-foreground line-clamp-2 break-words [overflow-wrap:anywhere]">{brief.key_message}</p>
                )}

                {/* Concepts summary */}
                {concepts.length > 0 && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5 min-w-0 gap-2">
                      <p className="text-xs font-medium text-muted-foreground truncate min-w-0 flex-1">
                        {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
                        {selectedConcept && (
                          <span className="text-primary ml-2">· &ldquo;{selectedConcept.name}&rdquo; selected</span>
                        )}
                      </p>
                      <div className="flex gap-1">
                        {concepts.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <FormatIcon format={c.format} />
                          </span>
                        ))}
                        {concepts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{concepts.length - 3}</span>
                        )}
                      </div>
                    </div>
                    {/* First hook preview */}
                    <p className="text-xs italic text-muted-foreground line-clamp-1">
                      &ldquo;{concepts[0]?.hook}&rdquo;
                    </p>
                  </div>
                )}

                {/* Audience */}
                {brief.target_audience && (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground min-w-0">
                    <Target className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1 break-words [overflow-wrap:anywhere] min-w-0">{brief.target_audience}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(brief.created_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1">
                    <ApprovalButtons
                      table="creative_briefs"
                      recordId={brief.id}
                      currentStatus={brief.status}
                      compact
                      approveStatus="approved"
                      rejectStatus="draft"
                      onStatusChange={(s) => applyLocalUpdate(brief.id, { status: s as BriefStatus })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setViewing(brief as CreativeBrief)}
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
      <AdBriefViewModal
        brief={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onStatusChange={(id, status) => applyLocalUpdate(id, { status: status as BriefStatus })}
        onSelectConcept={handleSelectConcept}
        onConceptImageSaved={handleConceptImageSaved}
        clientId={clientId}
      />
    </div>
  )
}
