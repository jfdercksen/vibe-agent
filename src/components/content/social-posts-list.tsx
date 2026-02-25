'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/content/status-badge'
import { PlatformBadge } from '@/components/content/platform-icon'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import { ScheduleModal } from '@/components/content/schedule-modal'
import { SocialPostEditModal } from '@/components/content/social-post-edit-modal'
import { ImageGeneratorTrigger, ImageGeneratorPanel } from '@/components/images/image-generator-panel'
import { BatchGroupView } from '@/components/content/batch-group-view'
import { PublishButton } from '@/components/content/publish-button'
import {
  Share2,
  Calendar,
  Hash,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Clock,
  Type,
  Expand,
  Copy,
  Check,
  Pencil,
  RefreshCw,
  ExternalLink,
  LayoutGrid,
  Layers,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { SocialPost } from '@/lib/types/database'

interface SocialPostsListProps {
  posts: SocialPost[]
  clientId: string
  n8nConfigured?: boolean
}

const PAGE_SIZE = 12

const PLATFORMS = [
  { value: 'all', label: 'All' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
] as const

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
] as const

const postTypeIcons: Record<string, typeof Share2> = {
  text: Type,
  image: ImageIcon,
  carousel: ImageIcon,
  reel: Video,
  story: Video,
  thread: MessageSquare,
  poll: MessageSquare,
  video: Video,
  quote_card: MessageSquare,
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

function PostExpandModal({
  post,
  open,
  onClose,
  clientId,
  onImageSaved,
}: {
  post: SocialPost | null
  open: boolean
  onClose: () => void
  clientId: string
  onImageSaved: (postId: string, imageUrl: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [showImageGen, setShowImageGen] = useState(false)

  if (!post) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(post.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build a context-aware prompt from the post content
  const imagePrompt = [
    post.hook ? `Social graphic for: "${post.hook}"` : '',
    post.body ? `Post: ${post.body.slice(0, 200)}` : '',
    `Platform: ${post.platform}`,
  ].filter(Boolean).join(' — ')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformBadge platform={post.platform} />
            <StatusBadge status={post.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hook */}
          {post.hook && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Hook</p>
              <p className="font-semibold text-base">{post.hook}</p>
            </div>
          )}

          {/* Full body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Post Body</p>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {post.body}
            </div>
          </div>

          {/* CTA */}
          {post.cta && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Call to Action</p>
              <p className="text-sm font-medium text-primary">{post.cta}</p>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Hash className="h-3 w-3" />
                    {tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {post.character_count && <span>{post.character_count.toLocaleString()} characters</span>}
            {post.post_type && <span>{post.post_type.replace('_', ' ')}</span>}
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>

          {/* ── Image section ── */}
          <div className="border rounded-lg overflow-hidden">
            {/* If post already has an image — show it */}
            {post.image_url ? (
              <div>
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full object-cover max-h-64"
                  />
                  <a
                    href={post.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 rounded bg-black/50 p-1.5 hover:bg-black/70 transition-colors"
                    title="Open full image"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-white" />
                  </a>
                </div>
                <div className="p-3 bg-muted/30 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Post image attached
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
              /* No image yet — show generate button */
              <div className="p-3 flex items-center justify-between gap-2 bg-muted/20">
                <span className="text-xs text-muted-foreground">No image attached</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setShowImageGen((v) => !v)}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {showImageGen ? 'Hide Generator' : 'Generate Image'}
                </Button>
              </div>
            )}

            {/* Inline image generator — expands when toggled */}
            {showImageGen && (
              <div className="border-t p-3">
                <ImageGeneratorPanel
                  clientId={clientId}
                  defaultUseCase="social_graphic"
                  defaultPrompt={imagePrompt}
                  referenceTable="social_posts"
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

          {/* Approval actions */}
          <div className="flex justify-end pt-2">
            <ApprovalButtons
              table="social_posts"
              recordId={post.id}
              currentStatus={post.status}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SocialPostsList({ posts, clientId, n8nConfigured = false }: SocialPostsListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'batches'>('grid')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [expandedPost, setExpandedPost] = useState<SocialPost | null>(null)
  const [editPost, setEditPost] = useState<SocialPost | null>(null)
  const [schedulePost, setSchedulePost] = useState<SocialPost | null>(null)
  // Local overrides so UI updates instantly without a full page reload
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<SocialPost>>>({})

  const applyLocalUpdate = (id: string, fields: Partial<SocialPost>) => {
    setLocalUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...fields } }))
    // Also keep expandedPost in sync
    setExpandedPost((prev) => prev?.id === id ? { ...prev, ...fields } : prev)
  }

  // Called when a new image is selected — persist to DB + update UI instantly
  const handleImageSaved = async (postId: string, imageUrl: string) => {
    applyLocalUpdate(postId, { image_url: imageUrl })
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'social_posts', id: postId, fields: { image_url: imageUrl } }),
    })
  }

  const mergedPosts = useMemo(
    () => posts.map((p) => localUpdates[p.id] ? { ...p, ...localUpdates[p.id] } : p),
    [posts, localUpdates]
  )

  const { filtered, platformCounts, statusCounts } = useMemo(() => {
    const filtered = mergedPosts.filter((post) => {
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false
      if (statusFilter !== 'all' && post.status !== statusFilter) return false
      return true
    })
    const platformCounts: Record<string, number> = { all: mergedPosts.length }
    const statusCounts: Record<string, number> = { all: mergedPosts.length }
    for (const post of mergedPosts) {
      platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1
      statusCounts[post.status] = (statusCounts[post.status] || 0) + 1
    }
    return { filtered, platformCounts, statusCounts }
  }, [mergedPosts, platformFilter, statusFilter])

  // Reset to page 1 when filters change
  const handlePlatformChange = (val: string) => { setPlatformFilter(val); setPage(1) }
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1) }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Platform Tabs */}
        <Tabs value={platformFilter} onValueChange={handlePlatformChange}>
          <TabsList>
            {PLATFORMS.map((p) => {
              const count = platformCounts[p.value] || 0
              if (p.value !== 'all' && count === 0) return null
              return (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* Status Filter + View Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => {
                const count = statusCounts[s.value] || 0
                return (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}{count > 0 ? ` (${count})` : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {(platformFilter !== 'all' || statusFilter !== 'all') && (
            <span className="text-sm text-muted-foreground">
              {filtered.length} of {posts.length} posts
            </span>
          )}

          {/* View mode toggle */}
          <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="All Posts (grid)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              All Posts
            </button>
            <button
              onClick={() => setViewMode('batches')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'batches'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Batches view"
            >
              <Layers className="h-3.5 w-3.5" />
              Batches
            </button>
          </div>
        </div>
      </div>

      {/* Batches View */}
      {viewMode === 'batches' && (
        <BatchGroupView
          posts={mergedPosts}
          clientId={clientId}
          onApplyLocalUpdate={applyLocalUpdate}
          onExpandPost={(post) => setExpandedPost(post)}
        />
      )}

      {/* Posts Grid (only in grid view) */}
      {viewMode === 'grid' && (paginated.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((post) => {
              const PostTypeIcon = postTypeIcons[post.post_type || 'text'] || Share2
              return (
                <Card key={post.id} className="flex flex-col group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={post.platform} />
                        {post.post_type && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <PostTypeIcon className="h-3 w-3" />
                            {post.post_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={post.status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setExpandedPost(post)}
                          title="View full post"
                        >
                          <Expand className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {post.hook && (
                      <CardTitle className="text-base leading-snug mt-3">{post.hook}</CardTitle>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <p
                      className="text-sm text-muted-foreground line-clamp-4 cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => setExpandedPost(post)}
                      title="Click to read full post"
                    >
                      {truncateText(post.body, 200)}
                    </p>

                    {post.cta && (
                      <p className="text-sm font-medium text-primary">{post.cta}</p>
                    )}

                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.hashtags.slice(0, 4).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            {tag.replace(/^#/, '')}
                          </span>
                        ))}
                        {post.hashtags.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{post.hashtags.length - 4}</span>
                        )}
                      </div>
                    )}

                    {post.image_url && (
                      <div className="rounded-lg overflow-hidden border relative group/img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.image_url}
                          alt="Post image"
                          className="w-full object-cover h-32"
                          loading="lazy"
                        />
                        <a
                          href={post.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1.5 right-1.5 rounded bg-black/50 p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                          title="Open full image"
                        >
                          <ExternalLink className="h-3 w-3 text-white" />
                        </a>
                      </div>
                    )}
                    {post.video_url && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    )}

                    {post.character_count && (
                      <span className="text-xs text-muted-foreground">
                        {post.character_count.toLocaleString()} chars
                      </span>
                    )}
                  </CardContent>

                  <CardFooter className="border-t pt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {post.scheduled_for ? (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {format(new Date(post.scheduled_for), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setEditPost(post)}
                          title="Edit post"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setSchedulePost(post)}
                          title="Schedule post"
                        >
                          <Calendar className="h-3 w-3" /> Schedule
                        </Button>
                        <ApprovalButtons
                          table="social_posts"
                          recordId={post.id}
                          currentStatus={post.status}
                          compact
                          onStatusChange={(s) => applyLocalUpdate(post.id, { status: s as SocialPost['status'] })}
                        />
                        <PublishButton
                          postId={post.id}
                          clientId={clientId}
                          contentType="social"
                          platform={post.platform}
                          status={post.status}
                          n8nConfigured={n8nConfigured}
                          compact
                          onPublished={(s) => applyLocalUpdate(post.id, { status: s as SocialPost['status'] })}
                        />
                      </div>
                    </div>
                    {/* Per-post image generator */}
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                      <ImageGeneratorTrigger
                        clientId={clientId}
                        defaultUseCase="social_graphic"
                        defaultPrompt={[
                          post.hook ? `Social graphic for: "${post.hook}"` : '',
                          post.body ? `Post: ${post.body.slice(0, 180)}` : '',
                          `Platform: ${post.platform}`,
                        ].filter(Boolean).join(' — ')}
                        referenceTable="social_posts"
                        referenceId={post.id}
                        label={post.image_url ? 'Change Image' : 'Generate Image'}
                        onImageSaved={(asset) => {
                          const url = 'file_url' in asset ? asset.file_url : ''
                          if (url) handleImageSaved(post.id, url)
                        }}
                      />
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
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
            <Share2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {posts.length === 0
                ? 'No social posts yet. Use Claude to generate posts for this client.'
                : 'No posts match your current filters.'}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Expand Modal */}
      <PostExpandModal
        post={expandedPost}
        open={!!expandedPost}
        onClose={() => setExpandedPost(null)}
        clientId={clientId}
        onImageSaved={handleImageSaved}
      />

      {/* Edit Modal */}
      <SocialPostEditModal
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
          table="social_posts"
          recordId={schedulePost.id}
          contentType="social"
          title={schedulePost.hook || schedulePost.body.substring(0, 60)}
          platform={schedulePost.platform}
          currentScheduledFor={schedulePost.scheduled_for}
          onScheduled={(date, time) => {
            const scheduledFor = time ? `${date}T${time}:00` : `${date}T09:00:00`
            applyLocalUpdate(schedulePost.id, { scheduled_for: scheduledFor, status: 'scheduled' })
          }}
        />
      )}
    </div>
  )
}
