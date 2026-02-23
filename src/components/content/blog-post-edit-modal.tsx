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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Eye, Code } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import type { BlogPost } from '@/lib/types/database'

interface BlogPostEditModalProps {
  post: BlogPost | null
  open: boolean
  onClose: () => void
  onSaved?: (updated: Partial<BlogPost>) => void
}

export function BlogPostEditModal({ post, open, onClose, onSaved }: BlogPostEditModalProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [metaDescription, setMetaDescription] = useState(post?.meta_description || '')
  const [targetKeyword, setTargetKeyword] = useState(post?.target_keyword || '')
  const [bodyMarkdown, setBodyMarkdown] = useState(post?.body_markdown || '')
  const [status, setStatus] = useState<BlogPost['status']>(post?.status || 'outline')
  const [isLoading, setIsLoading] = useState(false)
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')

  // Re-sync when post changes
  const [lastPostId, setLastPostId] = useState(post?.id)
  if (post?.id !== lastPostId) {
    setTitle(post?.title || '')
    setMetaDescription(post?.meta_description || '')
    setTargetKeyword(post?.target_keyword || '')
    setBodyMarkdown(post?.body_markdown || '')
    setStatus(post?.status || 'outline')
    setLastPostId(post?.id)
  }

  if (!post) return null

  const wordCount = bodyMarkdown
    ? bodyMarkdown.trim().split(/\s+/).filter(Boolean).length
    : 0

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty')
      return
    }

    setIsLoading(true)
    try {
      const fields: Partial<BlogPost> = {
        title: title.trim(),
        meta_description: metaDescription.trim() || null,
        target_keyword: targetKeyword.trim() || null,
        body_markdown: bodyMarkdown || null,
        word_count: wordCount || null,
        status: status as BlogPost['status'],
      }

      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'blog_posts', id: post.id, fields }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      toast.success('Blog post saved')
      onSaved?.(fields)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="blog-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="blog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog post title..."
              className="text-base font-medium"
            />
          </div>

          {/* Meta + Keyword row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="blog-keyword">Target Keyword</Label>
              <Input
                id="blog-keyword"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. content marketing strategy"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BlogPost['status'])}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="drafting">Drafting</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="blog-meta">Meta Description</Label>
              <span className={`text-xs ${metaDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {metaDescription.length}/160
              </span>
            </div>
            <Textarea
              id="blog-meta"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              placeholder="SEO meta description (max 160 characters)..."
            />
          </div>

          {/* Body — Edit / Preview tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Body (Markdown)</Label>
              <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</span>
            </div>
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="gap-1.5 text-xs">
                  <Code className="h-3.5 w-3.5" /> Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={bodyMarkdown}
                  onChange={(e) => setBodyMarkdown(e.target.value)}
                  rows={18}
                  className="resize-y font-mono text-sm leading-relaxed"
                  placeholder="Write in Markdown... # Heading, **bold**, _italic_, - list item"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[400px] max-h-[500px] overflow-y-auto rounded-md border bg-background p-4 prose prose-sm max-w-none dark:prose-invert">
                  {bodyMarkdown ? (
                    <ReactMarkdown>{bodyMarkdown}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Nothing to preview yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !title.trim()}>
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
