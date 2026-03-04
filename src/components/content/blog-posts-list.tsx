'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import { ScheduleModal } from '@/components/content/schedule-modal'
import { BlogPostEditModal } from '@/components/content/blog-post-edit-modal'
import { ImageGeneratorTrigger, ImageGeneratorPanel } from '@/components/images/image-generator-panel'
import { PublishButton } from '@/components/content/publish-button'
import { FileText, Search, Calendar, Eye, Copy, Check, Expand, ExternalLink, Pencil, RefreshCw, Image as ImageIcon, BarChart3, Tag, ChevronDown, ChevronUp, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import type { BlogPost } from '@/lib/types/database'

interface BlogPostsListProps {
  posts: BlogPost[]
  clientId: string
  n8nConfigured?: boolean
}

const PAGE_SIZE = 9

const statusFilters = ['all', 'outline', 'drafting', 'review', 'approved', 'published'] as const

const intentConfig: Record<string, { label: string; className: string }> = {
  informational: { label: 'Informational', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  transactional: { label: 'Transactional', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  navigational: { label: 'Navigational', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  commercial: { label: 'Commercial', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const colorClass = score >= 70
    ? 'bg-green-100 text-green-700 border-green-200'
    : score >= 40
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-red-100 text-red-700 border-red-200'
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${colorClass}`}
      title={`${label}: ${score}/100`}
    >
      <BarChart3 className="h-2.5 w-2.5" />
      {score}
    </span>
  )
}

function ProcessingLogSection({ log }: { log: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Processing Log
      </button>
      {open && (
        <pre className="mt-2 bg-muted/30 rounded-lg p-3 text-xs whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">
          {log}
        </pre>
      )}
    </div>
  )
}

function BlogExpandModal({ post, open, onClose, clientId, onImageSaved, onRemoveImage }: { post: BlogPost | null; open: boolean; onClose: () => void; clientId: string; onImageSaved: (postId: string, imageUrl: string) => void; onRemoveImage: (postId: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'preview' | 'raw'>('preview')
  const [showImageGen, setShowImageGen] = useState(false)

  if (!post) return null

  // Build readable content from available fields
  const outlineText = Array.isArray(post.outline) && post.outline.length > 0
    ? post.outline.map((section: { h2: string; points: string[] }) =>
        `## ${section.h2}\n${(section.points || []).map((p: string) => `- ${p}`).join('\n')}`
      ).join('\n\n')
    : ''
  const content = post.body_markdown || post.body_html || outlineText || ''

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug pr-8">{post.title}</DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge status={post.status} />
            {post.search_intent && intentConfig[post.search_intent] && (
              <Badge variant="secondary" className={intentConfig[post.search_intent].className}>
                {intentConfig[post.search_intent].label}
              </Badge>
            )}
            {post.target_keyword && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Search className="h-3 w-3" />
                {post.target_keyword}
              </span>
            )}
            {post.seo_score !== null && post.seo_score !== undefined && (
              <ScoreBadge score={post.seo_score} label="SEO" />
            )}
            {post.readability_score !== null && post.readability_score !== undefined && (
              <ScoreBadge score={post.readability_score} label="Readability" />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta description */}
          {post.meta_description && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground italic">
              {post.meta_description}
            </div>
          )}

          {/* Key Takeaways */}
          {post.key_takeaways && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Takeaways</p>
              <div className="prose prose-sm dark:prose-invert max-w-none bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-4">
                <ReactMarkdown>{post.key_takeaways}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Content tabs */}
          {content && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <Button
                    variant={tab === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTab('preview')}
                  >
                    Preview
                  </Button>
                  <Button
                    variant={tab === 'raw' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTab('raw')}
                  >
                    Raw
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {tab === 'preview' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono">
                  {content}
                </pre>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {post.word_count ? <span>{post.word_count.toLocaleString()} words</span> : null}
            {post.word_count ? <span>~{Math.ceil(post.word_count / 200)} min read</span> : null}
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>

          {/* SEO Analysis */}
          {(post.seo_score !== null || post.seo_analysis) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SEO Analysis</p>
                {post.seo_score !== null && post.seo_score !== undefined && <ScoreBadge score={post.seo_score} label="SEO" />}
              </div>
              {post.seo_analysis && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{post.seo_analysis}</p>
              )}
            </div>
          )}

          {/* Readability */}
          {(post.readability_score !== null || post.readability_analysis) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Readability</p>
                {post.readability_score !== null && post.readability_score !== undefined && <ScoreBadge score={post.readability_score} label="Readability" />}
              </div>
              {post.readability_analysis && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{post.readability_analysis}</p>
              )}
            </div>
          )}

          {/* Details grid */}
          {(post.category || (post.tags && post.tags.length > 0) || post.alt_text || post.external_sources) && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</p>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                {post.category && (
                  <div>
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p className="font-medium">{post.category}</p>
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal gap-0.5">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {post.alt_text && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Image Alt Text</span>
                    <p>{post.alt_text}</p>
                  </div>
                )}
                {post.external_sources && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground">External Sources</span>
                    <p className="whitespace-pre-wrap">{post.external_sources}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Log */}
          {post.processing_log && (
            <ProcessingLogSection log={post.processing_log} />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {post.published_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={post.published_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live
                </a>
              </Button>
            )}
            <div className="ml-auto">
              <ApprovalButtons
                table="blog_posts"
                recordId={post.id}
                currentStatus={post.status}
                rejectStatus="archived"
                showPublish
              />
            </div>
          </div>

          {/* ── Header image section ── */}
          <div className="border rounded-lg overflow-hidden">
            {post.featured_image_url ? (
              <div>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.featured_image_url}
                    alt={post.alt_text || post.title}
                    className="w-full object-cover max-h-56"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      onClick={() => onRemoveImage(post.id)}
                      className="rounded bg-black/50 p-1.5 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                    <a
                      href={post.featured_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-black/50 p-1.5 hover:bg-black/70 transition-colors"
                      title="Open full image"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-white" />
                    </a>
                  </div>
                </div>
                <div className="p-3 bg-muted/30 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Header image attached
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setShowImageGen((v) => !v)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    {showImageGen ? 'Hide Generator' : 'Change Image'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 flex items-center justify-between gap-2 bg-muted/20">
                <span className="text-xs text-muted-foreground">No header image</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setShowImageGen((v) => !v)}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {showImageGen ? 'Hide Generator' : 'Generate Header Image'}
                </Button>
              </div>
            )}
            {showImageGen && (
              <div className="border-t p-3">
                <ImageGeneratorPanel
                  clientId={clientId}
                  defaultUseCase="blog_header"
                  defaultPrompt={[
                    `Blog header image for: "${post.title}"`,
                    post.meta_description ? `Context: ${post.meta_description.slice(0, 150)}` : '',
                    post.target_keyword ? `Topic: ${post.target_keyword}` : '',
                  ].filter(Boolean).join(' — ')}
                  referenceTable="blog_posts"
                  referenceId={post.id}
                  compact
                  onImageSaved={(asset) => {
                    const url = 'file_url' in asset ? asset.file_url : ''
                    if (url) {
                      onImageSaved(post.id, url)
                      setShowImageGen(false)
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function BlogPostsList({ posts, clientId, n8nConfigured = false }: BlogPostsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [expandedPost, setExpandedPost] = useState<BlogPost | null>(null)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [schedulePost, setSchedulePost] = useState<BlogPost | null>(null)
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<BlogPost>>>({})

  const applyLocalUpdate = (id: string, fields: Partial<BlogPost>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...fields } }))
    setExpandedPost((prev) => prev?.id === id ? { ...prev, ...fields } : prev)
  }

  const handleImageSaved = async (postId: string, imageUrl: string) => {
    applyLocalUpdate(postId, { featured_image_url: imageUrl })
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'blog_posts', id: postId, fields: { featured_image_url: imageUrl } }),
    })
  }

  const handleRemoveImage = async (postId: string) => {
    applyLocalUpdate(postId, { featured_image_url: null })
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'blog_posts', id: postId, fields: { featured_image_url: null } }),
    })
  }

  const mergedPosts = useMemo(
    () => posts.map((p) => localUpdates[p.id] ? { ...p, ...localUpdates[p.id] } : p),
    [posts, localUpdates]
  )

  const { filtered, statusCounts } = useMemo(() => {
    const filtered = mergedPosts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false
      return true
    })
    const statusCounts: Record<string, number> = {}
    for (const p of mergedPosts) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
    }
    return { filtered, statusCounts }
  }, [mergedPosts, statusFilter])

  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1) }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
          <TabsList>
            <TabsTrigger value="all">All ({posts.length})</TabsTrigger>
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
        {/* Per-post image generation is available inside each post's expand view */}
      </div>

      {/* Blog Posts Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => (
              <Card key={post.id} className="flex flex-col group">
                {post.featured_image_url && (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={post.featured_image_url}
                      alt={post.alt_text || post.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(post.id) }}
                      className="absolute top-2 right-2 rounded bg-black/50 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      {post.search_intent && intentConfig[post.search_intent] && (
                        <Badge variant="secondary" className={intentConfig[post.search_intent].className}>
                          {intentConfig[post.search_intent].label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={post.status} />
                      {post.seo_score !== null && post.seo_score !== undefined && (
                        <ScoreBadge score={post.seo_score} label="SEO" />
                      )}
                      {post.readability_score !== null && post.readability_score !== undefined && (
                        <ScoreBadge score={post.readability_score} label="Read" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setExpandedPost(post)}
                        title="Read full post"
                      >
                        <Expand className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle
                    className="text-base leading-snug mt-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setExpandedPost(post)}
                  >
                    {post.title}
                  </CardTitle>
                  {post.category && (
                    <span className="text-xs text-muted-foreground font-medium">{post.category}</span>
                  )}
                  {post.meta_description && (
                    <CardDescription className="line-clamp-2 mt-1">{post.meta_description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {post.target_keyword && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Search className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">{post.target_keyword}</span>
                    </div>
                  )}

                  {post.secondary_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.secondary_keywords.slice(0, 3).map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs font-normal">{kw}</Badge>
                      ))}
                      {post.secondary_keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                          +{post.secondary_keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal gap-0.5">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.word_count !== null && post.word_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.word_count.toLocaleString()} words
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setEditPost(post)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setSchedulePost(post)}
                        >
                          <Calendar className="h-3 w-3" /> Schedule
                        </Button>
                      </div>
                      <ApprovalButtons
                        table="blog_posts"
                        recordId={post.id}
                        currentStatus={post.status}
                        rejectStatus="archived"
                        showPublish
                        compact
                        onStatusChange={(s) => applyLocalUpdate(post.id, { status: s as BlogPost['status'] })}
                      />
                      <PublishButton
                        postId={post.id}
                        clientId={clientId}
                        contentType="blog"
                        status={post.status}
                        n8nConfigured={n8nConfigured}
                        compact
                        onPublished={(s) => applyLocalUpdate(post.id, { status: s as BlogPost['status'] })}
                      />
                    </div>
                  </div>

                  {post.published_url && (
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <a href={post.published_url} target="_blank" rel="noopener noreferrer">
                        View Published Post
                      </a>
                    </Button>
                  )}

                  {/* Per-post header image generator */}
                  <ImageGeneratorTrigger
                    clientId={clientId}
                    defaultUseCase="blog_header"
                    defaultPrompt={[
                      `Blog header image for: "${post.title}"`,
                      post.meta_description ? `Context: ${post.meta_description.slice(0, 120)}` : '',
                      post.target_keyword ? `Topic: ${post.target_keyword}` : '',
                    ].filter(Boolean).join(' — ')}
                    referenceTable="blog_posts"
                    referenceId={post.id}
                    label={post.featured_image_url ? 'Change Header Image' : 'Generate Header Image'}
                    onImageSaved={(asset) => {
                      const url = 'file_url' in asset ? asset.file_url : ''
                      if (url) handleImageSaved(post.id, url)
                    }}
                  />
                </CardContent>
              </Card>
            ))}
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
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {posts.length === 0
                ? 'No blog posts yet. Ask Vibe to create SEO content for this client.'
                : 'No posts match your current filter.'}
            </p>
          </CardContent>
        </Card>
      )}

      <BlogExpandModal
        post={expandedPost}
        open={!!expandedPost}
        onClose={() => setExpandedPost(null)}
        clientId={clientId}
        onImageSaved={handleImageSaved}
        onRemoveImage={handleRemoveImage}
      />

      {/* Edit Modal */}
      <BlogPostEditModal
        post={editPost}
        open={!!editPost}
        onClose={() => setEditPost(null)}
        onSaved={(fields) => {
          if (editPost) applyLocalUpdate(editPost.id, fields)
        }}
      />

      {/* Schedule Modal */}
      {schedulePost && (
        <ScheduleModal
          open={!!schedulePost}
          onClose={() => setSchedulePost(null)}
          clientId={clientId}
          table="blog_posts"
          recordId={schedulePost.id}
          contentType="blog"
          title={schedulePost.title}
          onScheduled={(date) => {
            applyLocalUpdate(schedulePost.id, { status: 'approved' })
            void date
          }}
        />
      )}
    </div>
  )
}
