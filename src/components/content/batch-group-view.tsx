'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/content/status-badge'
import { PlatformBadge } from '@/components/content/platform-icon'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Layers,
  Package,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { SocialPost } from '@/lib/types/database'

interface BatchGroupViewProps {
  posts: SocialPost[]
  clientId: string
  onApplyLocalUpdate: (id: string, fields: Partial<SocialPost>) => void
  onExpandPost: (post: SocialPost) => void
}

interface BatchGroup {
  batch_id: string
  label: string
  posts: SocialPost[]
  createdAt: Date
}

// Count posts per platform in a batch
function platformCounts(posts: SocialPost[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of posts) {
    counts[p.platform] = (counts[p.platform] || 0) + 1
  }
  return counts
}

// Call the batch-update API and optimistically update all posts
async function batchUpdate(
  clientId: string,
  batch_id: string,
  batchPosts: SocialPost[],
  status: 'approved' | 'rejected',
  onApplyLocalUpdate: (id: string, fields: Partial<SocialPost>) => void
): Promise<void> {
  // Optimistic update — flip all posts instantly in the UI
  for (const post of batchPosts) {
    onApplyLocalUpdate(post.id, { status })
  }

  try {
    const res = await fetch('/api/content/batch-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, batch_id, fields: { status } }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to update batch')
    }

    const data = await res.json()
    toast.success(`${data.updated} posts ${status}`)
  } catch (err) {
    // Revert optimistic update on failure
    for (const post of batchPosts) {
      onApplyLocalUpdate(post.id, { status: post.status })
    }
    toast.error(`Failed: ${(err as Error).message}`)
  }
}

// ── Compact post card for the horizontal scroll row ────────────────────────

function BatchPostCard({
  post,
  onClick,
}: {
  post: SocialPost
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-64 shrink-0 text-left rounded-lg border bg-background p-3 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      {/* Platform + status row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <PlatformBadge platform={post.platform} />
        <StatusBadge status={post.status} />
      </div>

      {/* Post type */}
      {post.post_type && (
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
          {post.post_type.replace('_', ' ')}
        </p>
      )}

      {/* Hook or body preview */}
      <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {post.hook || post.body.slice(0, 80)}
      </p>

      {/* Body preview (if hook shown) */}
      {post.hook && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {post.body.slice(0, 100)}
        </p>
      )}

      {/* Image thumbnail */}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt="Post image"
          className="mt-2 w-full h-16 object-cover rounded-md"
        />
      )}
    </button>
  )
}

// ── Single batch section ────────────────────────────────────────────────────

function BatchSection({
  group,
  clientId,
  onApplyLocalUpdate,
  onExpandPost,
}: {
  group: BatchGroup
  clientId: string
  onApplyLocalUpdate: (id: string, fields: Partial<SocialPost>) => void
  onExpandPost: (post: SocialPost) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const platforms = platformCounts(group.posts)
  const statusSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of group.posts) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  }, [group.posts])

  const handleApproveAll = async () => {
    setApproving(true)
    await batchUpdate(clientId, group.batch_id, group.posts, 'approved', onApplyLocalUpdate)
    setApproving(false)
  }

  const handleRejectAll = async () => {
    setRejecting(true)
    await batchUpdate(clientId, group.batch_id, group.posts, 'rejected', onApplyLocalUpdate)
    setRejecting(false)
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      {/* Batch header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b flex-wrap">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
          }
        </button>

        {/* Batch icon + label */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Package className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="text-sm font-semibold truncate">{group.label}</span>
        </div>

        {/* Post count */}
        <Badge variant="secondary" className="shrink-0 text-xs">
          {group.posts.length} posts
        </Badge>

        {/* Platform distribution pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(platforms).map(([platform, count]) => (
            <span
              key={platform}
              className="text-[10px] bg-muted border rounded-full px-2 py-0.5 capitalize whitespace-nowrap"
            >
              {platform} ×{count}
            </span>
          ))}
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          {statusSummary.draft ? <span>{statusSummary.draft} draft</span> : null}
          {statusSummary.approved ? <span className="text-emerald-600">· {statusSummary.approved} ✓</span> : null}
          {statusSummary.rejected ? <span className="text-red-500">· {statusSummary.rejected} ✗</span> : null}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
          {formatDistanceToNow(group.createdAt, { addSuffix: true })}
        </span>

        {/* Batch actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            onClick={handleApproveAll}
            disabled={approving || rejecting}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {approving ? 'Approving…' : 'Approve All'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleRejectAll}
            disabled={approving || rejecting}
          >
            <XCircle className="h-3.5 w-3.5" />
            {rejecting ? 'Rejecting…' : 'Reject All'}
          </Button>
        </div>
      </div>

      {/* Post cards horizontal scroll */}
      {!collapsed && (
        <div className="overflow-x-auto px-4 py-3">
          <div className="flex gap-3 pb-1">
            {group.posts.map(post => (
              <BatchPostCard
                key={post.id}
                post={post}
                onClick={() => onExpandPost(post)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main BatchGroupView export ──────────────────────────────────────────────

export function BatchGroupView({
  posts,
  clientId,
  onApplyLocalUpdate,
  onExpandPost,
}: BatchGroupViewProps) {
  const [ungroupedCollapsed, setUngroupedCollapsed] = useState(true)

  const { batches, ungrouped } = useMemo(() => {
    const groupMap = new Map<string, BatchGroup>()
    const ungrouped: SocialPost[] = []

    for (const post of posts) {
      if (post.batch_id) {
        if (!groupMap.has(post.batch_id)) {
          groupMap.set(post.batch_id, {
            batch_id: post.batch_id,
            label: post.batch_label || 'Untitled Batch',
            posts: [],
            createdAt: new Date(post.created_at),
          })
        }
        groupMap.get(post.batch_id)!.posts.push(post)
      } else {
        ungrouped.push(post)
      }
    }

    // Sort batches newest first (by most recent post in each batch)
    const batches = [...groupMap.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return { batches, ungrouped }
  }, [posts])

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Layers className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  if (batches.length === 0 && ungrouped.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Package className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium">No batches yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Batches are created when you run the Content Atomizer in Vibe Chat. Your existing {ungrouped.length} posts show in the All Posts view.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Named batches */}
      {batches.map(group => (
        <BatchSection
          key={group.batch_id}
          group={group}
          clientId={clientId}
          onApplyLocalUpdate={onApplyLocalUpdate}
          onExpandPost={onExpandPost}
        />
      ))}

      {/* Ungrouped posts (individual saves, not from Content Atomizer) */}
      {ungrouped.length > 0 && (
        <div className="border rounded-xl overflow-hidden bg-background opacity-70">
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b">
            <button
              onClick={() => setUngroupedCollapsed(v => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {ungroupedCollapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </button>
            <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Individual Posts
            </span>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {ungrouped.length}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              — not part of a Content Atomizer batch
            </span>
          </div>

          {!ungroupedCollapsed && (
            <div className="overflow-x-auto px-4 py-3">
              <div className="flex gap-3 pb-1">
                {ungrouped.map(post => (
                  <BatchPostCard
                    key={post.id}
                    post={post}
                    onClick={() => onExpandPost(post)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
