'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import {
  Lightbulb, Calendar, Tag, Mic, MessageSquare,
  Search as SearchIcon, Layers, Copy, Check,
  FileText, Mail, Video, Megaphone, BookOpen,
  ArrowRight, Info,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ContentIdea } from '@/lib/types/database'

interface ContentIdeasListProps {
  ideas: ContentIdea[]
  clientId: string
}

const PAGE_SIZE = 12

// Icons per idea type
const typeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  social:      { icon: MessageSquare, label: 'Social Post',   color: 'text-blue-500' },
  blog:        { icon: BookOpen,      label: 'Blog Post',     color: 'text-green-500' },
  email:       { icon: Mail,          label: 'Email',         color: 'text-purple-500' },
  video:       { icon: Video,         label: 'Video',         color: 'text-red-500' },
  lead_magnet: { icon: Megaphone,     label: 'Lead Magnet',   color: 'text-orange-500' },
  ad:          { icon: Megaphone,     label: 'Ad',            color: 'text-yellow-500' },
  other:       { icon: Lightbulb,     label: 'Idea',          color: 'text-muted-foreground' },
}

const sourceConfig: Record<string, { label: string; icon: typeof Lightbulb }> = {
  prompt:     { label: 'Prompt',     icon: MessageSquare },
  voice_note: { label: 'Voice Note', icon: Mic },
  research:   { label: 'Research',   icon: SearchIcon },
  atomized:   { label: 'Atomized',   icon: Layers },
  manual:     { label: 'Manual',     icon: Lightbulb },
}

const priorityColors: Record<string, string> = {
  low:      'bg-slate-100 text-slate-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-orange-100 text-orange-700',
  urgent:   'bg-red-100 text-red-700',
}

const statusFilters = ['all', 'idea', 'researching', 'drafting', 'review', 'approved', 'published'] as const
const typeFilters   = ['all', 'social', 'blog', 'email', 'video', 'lead_magnet'] as const

// ── Expand modal ──────────────────────────────────────────────────────────────
function IdeaModal({
  idea,
  open,
  onClose,
  onStatusChange,
}: {
  idea: ContentIdea | null
  open: boolean
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [copied, setCopied] = useState(false)

  if (!idea) return null

  const cfg = typeConfig[idea.idea_type || 'other'] || typeConfig.other
  const Icon = cfg.icon
  const source = sourceConfig[idea.source_type || 'manual']

  const copyText = [
    idea.title,
    idea.description || '',
    idea.tags.length ? `Tags: ${idea.tags.join(', ')}` : '',
    idea.platforms.length ? `Platforms: ${idea.platforms.join(', ')}` : '',
    idea.source_content || '',
  ].filter(Boolean).join('\n\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10`}>
                <Icon className={`h-5 w-5 ${cfg.color}`} />
              </div>
              <div>
                <Badge variant="outline" className="text-xs mb-1">{cfg.label}</Badge>
                <DialogTitle className="text-lg leading-snug">{idea.title}</DialogTitle>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={idea.status} />
            {idea.priority && idea.priority !== 'medium' && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[idea.priority] || ''}`}>
                {idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1)} priority
              </span>
            )}
            {source && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <source.icon className="h-3 w-3" />
                {source.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Description */}
          {idea.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{idea.description}</p>
            </div>
          )}

          {/* Source content (research notes, original prompt, etc.) */}
          {idea.source_content && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Source Content</p>
              <div className="rounded-md bg-muted p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {idea.source_content}
              </div>
            </div>
          )}

          {/* Platforms */}
          {idea.platforms.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Target Platforms</p>
              <div className="flex flex-wrap gap-1">
                {idea.platforms.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {idea.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Due date */}
          {idea.due_date && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Due Date</p>
              <p className="text-sm">{new Date(idea.due_date).toLocaleDateString()}</p>
            </div>
          )}

          {/* What to do next hint */}
          <div className="rounded-md border border-dashed p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium mb-1">
              <ArrowRight className="h-3 w-3" /> Next step
            </p>
            <p className="text-xs text-muted-foreground">
              {idea.idea_type === 'social' && 'Ask Vibe Chat: "Turn this idea into a LinkedIn post" or "Write 3 social posts from this idea"'}
              {idea.idea_type === 'blog'   && 'Ask Vibe Chat: "Write a full blog post from this idea" or "Create an SEO outline for this topic"'}
              {idea.idea_type === 'email'  && 'Ask Vibe Chat: "Write a nurture email from this idea" or "Turn this into a 3-email sequence"'}
              {idea.idea_type === 'video'  && 'Ask Vibe Chat: "Write a video script for this idea" or "Create a talking head brief"'}
              {idea.idea_type === 'lead_magnet' && 'Ask Vibe Chat: "Build out this lead magnet" or "Write the copy for this opt-in offer"'}
              {(!idea.idea_type || idea.idea_type === 'other' || idea.idea_type === 'ad') && 'Ask Vibe Chat to develop this idea into a specific content asset'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t gap-2">
            <ApprovalButtons
              table="content_ideas"
              recordId={idea.id}
              currentStatus={idea.status}
              rejectStatus="archived"
              onStatusChange={(s) => onStatusChange(idea.id, s)}
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────
export function ContentIdeasList({ ideas, clientId: _clientId }: ContentIdeasListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter,   setTypeFilter]   = useState<string>('all')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState<ContentIdea | null>(null)
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<ContentIdea>>>({})

  const applyLocalUpdate = (id: string, patch: Partial<ContentIdea>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
    // keep modal in sync too
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...patch } : prev)
  }

  const { filtered, statusCounts, typeCounts } = useMemo(() => {
    const merged = ideas.map((i) => localUpdates[i.id] ? { ...i, ...localUpdates[i.id] } : i)
    const filtered = merged.filter((idea) => {
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false
      if (typeFilter   !== 'all' && idea.idea_type !== typeFilter) return false
      return true
    })
    const statusCounts: Record<string, number> = {}
    const typeCounts:   Record<string, number> = {}
    for (const idea of merged) {
      statusCounts[idea.status] = (statusCounts[idea.status] || 0) + 1
      if (idea.idea_type) typeCounts[idea.idea_type] = (typeCounts[idea.idea_type] || 0) + 1
    }
    return { filtered, statusCounts, typeCounts }
  }, [ideas, localUpdates, statusFilter, typeFilter])

  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1) }
  const handleTypeChange   = (val: string) => { setTypeFilter(val);   setPage(1) }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">

      {/* What is this? info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Content Ideas</span> is your ideas inbox — a staging area for all content
          concepts generated from research, prompts, and voice notes. Click any card to view the full idea and get next-step
          suggestions. Approve ideas to move them into production, or ask Vibe Chat to develop them into full posts, emails, or blog articles.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="all">All ({ideas.length})</TabsTrigger>
            {statusFilters.slice(1).map((s) => {
              const count = statusCounts[s] || 0
              if (count === 0) return null
              return (
                <TabsTrigger key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        <Tabs value={typeFilter} onValueChange={handleTypeChange}>
          <TabsList>
            <TabsTrigger value="all">All Types</TabsTrigger>
            {typeFilters.slice(1).map((t) => {
              const count = typeCounts[t] || 0
              if (count === 0) return null
              return (
                <TabsTrigger key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Ideas Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((idea) => {
              const merged = localUpdates[idea.id] ? { ...idea, ...localUpdates[idea.id] } : idea
              const cfg    = typeConfig[merged.idea_type || 'other'] || typeConfig.other
              const Icon   = cfg.icon
              const source = sourceConfig[merged.source_type || 'manual']

              return (
                <Card
                  key={idea.id}
                  className="flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
                  onClick={() => setSelected(merged as ContentIdea)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs mb-1">{cfg.label}</Badge>
                        </div>
                      </div>
                      <StatusBadge status={merged.status} />
                    </div>
                    <CardTitle className="text-base leading-snug mt-2 group-hover:text-primary transition-colors">
                      {merged.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    {merged.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{merged.description}</p>
                    )}

                    {merged.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {merged.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                        {merged.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{merged.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {merged.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {merged.platforms.slice(0, 3).map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
                        ))}
                        {merged.platforms.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{merged.platforms.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {source && (
                          <span className="flex items-center gap-1">
                            <source.icon className="h-3 w-3" />
                            {source.label}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(merged.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <ApprovalButtons
                        table="content_ideas"
                        recordId={merged.id}
                        currentStatus={merged.status}
                        rejectStatus="archived"
                        compact
                        onStatusChange={(s) => applyLocalUpdate(idea.id, { status: s as ContentIdea['status'] })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <Lightbulb className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium mb-1">
              {ideas.length === 0 ? 'No content ideas yet' : 'No ideas match your filters'}
            </p>
            <p className="text-sm text-muted-foreground">
              {ideas.length === 0
                ? 'Ask Vibe Chat to research your market and brainstorm content ideas for this client.'
                : 'Try clearing your filters to see all ideas.'}
            </p>
            {ideas.length === 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  'Brainstorm 10 content ideas for this client',
                  'Research my market and save ideas',
                  'Create a 30-day content plan',
                ].map((prompt) => (
                  <span key={prompt} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {prompt}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expand Modal */}
      <IdeaModal
        idea={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onStatusChange={(id, status) => applyLocalUpdate(id, { status: status as ContentIdea['status'] })}
      />
    </div>
  )
}
