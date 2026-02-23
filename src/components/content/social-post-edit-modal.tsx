'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { SocialPost } from '@/lib/types/database'

interface SocialPostEditModalProps {
  post: SocialPost | null
  open: boolean
  onClose: () => void
  onSaved?: (updated: Partial<SocialPost>) => void
}

export function SocialPostEditModal({ post, open, onClose, onSaved }: SocialPostEditModalProps) {
  const [platform, setPlatform] = useState<SocialPost['platform']>(post?.platform || 'linkedin')
  const [postType, setPostType] = useState<NonNullable<SocialPost['post_type']>>(post?.post_type || 'text')
  const [hook, setHook] = useState(post?.hook || '')
  const [body, setBody] = useState(post?.body || '')
  const [cta, setCta] = useState(post?.cta || '')
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '')
  const [status, setStatus] = useState<SocialPost['status']>(post?.status || 'draft')
  const [isLoading, setIsLoading] = useState(false)

  // Re-sync local state when a different post is opened
  const [lastPostId, setLastPostId] = useState(post?.id)
  if (post?.id !== lastPostId) {
    setPlatform(post?.platform || 'linkedin')
    setPostType(post?.post_type || 'text')
    setHook(post?.hook || '')
    setBody(post?.body || '')
    setCta(post?.cta || '')
    setHashtags(post?.hashtags?.join(' ') || '')
    setStatus(post?.status || 'draft')
    setLastPostId(post?.id)
  }

  if (!post) return null

  const handleSave = async () => {
    if (!body.trim()) {
      toast.error('Post body cannot be empty')
      return
    }
    setIsLoading(true)
    try {
      const parsedHashtags = hashtags
        .split(/[\s,]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)

      const fields: Partial<SocialPost> = {
        platform,
        post_type: postType as SocialPost['post_type'],
        hook: hook.trim() || null,
        body: body.trim(),
        cta: cta.trim() || null,
        hashtags: parsedHashtags,
        status,
        character_count: body.trim().length,
      }

      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'social_posts', id: post.id, fields }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      toast.success('Post saved')
      onSaved?.(fields)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const charCount = body.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Social Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Platform + Post Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPost['platform'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select value={postType || 'text'} onValueChange={(v) => setPostType(v as NonNullable<SocialPost['post_type']>)}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="thread">Thread</SelectItem>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quote_card">Quote Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SocialPost['status'])}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hook */}
          <div className="space-y-2">
            <Label htmlFor="edit-hook">
              Hook <span className="text-muted-foreground font-normal">(opening line)</span>
            </Label>
            <Input
              id="edit-hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Attention-grabbing opening..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-body">
                Post Body <span className="text-destructive">*</span>
              </Label>
              <span className={`text-xs ${charCount > 3000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount.toLocaleString()} characters
              </span>
            </div>
            <Textarea
              id="edit-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="resize-y font-mono text-sm leading-relaxed"
              placeholder="Write your post..."
            />
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <Label htmlFor="edit-cta">Call to Action</Label>
            <Input
              id="edit-cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Click the link below to learn more"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="edit-hashtags">
              Hashtags{' '}
              <span className="text-muted-foreground font-normal">
                (space or comma separated, # optional)
              </span>
            </Label>
            <Input
              id="edit-hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#marketing #content branding socialmedia"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !body.trim()}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
