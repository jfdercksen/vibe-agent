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
  const [seoScore, setSeoScore] = useState(post?.seo_score?.toString() || '')
  const [seoAnalysis, setSeoAnalysis] = useState(post?.seo_analysis || '')
  const [readabilityScore, setReadabilityScore] = useState(post?.readability_score?.toString() || '')
  const [readabilityAnalysis, setReadabilityAnalysis] = useState(post?.readability_analysis || '')
  const [category, setCategory] = useState(post?.category || '')
  const [tags, setTags] = useState(post?.tags?.join(', ') || '')
  const [altText, setAltText] = useState(post?.alt_text || '')
  const [externalSources, setExternalSources] = useState(post?.external_sources || '')
  const [processingLog, setProcessingLog] = useState(post?.processing_log || '')

  // Re-sync when post changes
  const [lastPostId, setLastPostId] = useState(post?.id)
  if (post?.id !== lastPostId) {
    setTitle(post?.title || '')
    setMetaDescription(post?.meta_description || '')
    setTargetKeyword(post?.target_keyword || '')
    setBodyMarkdown(post?.body_markdown || '')
    setStatus(post?.status || 'outline')
    setSeoScore(post?.seo_score?.toString() || '')
    setSeoAnalysis(post?.seo_analysis || '')
    setReadabilityScore(post?.readability_score?.toString() || '')
    setReadabilityAnalysis(post?.readability_analysis || '')
    setCategory(post?.category || '')
    setTags(post?.tags?.join(', ') || '')
    setAltText(post?.alt_text || '')
    setExternalSources(post?.external_sources || '')
    setProcessingLog(post?.processing_log || '')
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
      const parsedTags = tags.split(/[,]+/).map((t) => t.trim()).filter(Boolean)
      const parsedSeoScore = seoScore.trim() ? parseInt(seoScore, 10) : null
      const parsedReadabilityScore = readabilityScore.trim() ? parseInt(readabilityScore, 10) : null

      const fields: Partial<BlogPost> = {
        title: title.trim(),
        meta_description: metaDescription.trim() || null,
        target_keyword: targetKeyword.trim() || null,
        body_markdown: bodyMarkdown || null,
        word_count: wordCount || null,
        status: status as BlogPost['status'],
        seo_score: parsedSeoScore !== null && !isNaN(parsedSeoScore) ? Math.max(0, Math.min(100, parsedSeoScore)) : null,
        seo_analysis: seoAnalysis.trim() || null,
        readability_score: parsedReadabilityScore !== null && !isNaN(parsedReadabilityScore) ? Math.max(0, Math.min(100, parsedReadabilityScore)) : null,
        readability_analysis: readabilityAnalysis.trim() || null,
        category: category.trim() || null,
        tags: parsedTags,
        alt_text: altText.trim() || null,
        external_sources: externalSources.trim() || null,
        processing_log: processingLog.trim() || null,
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
          {/* ── SEO Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">SEO</p>
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="blog-seo-score">Score</Label>
                <Input
                  id="blog-seo-score"
                  type="number"
                  min={0}
                  max={100}
                  value={seoScore}
                  onChange={(e) => setSeoScore(e.target.value)}
                  placeholder="0-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-seo-analysis">SEO Analysis</Label>
                <Textarea
                  id="blog-seo-analysis"
                  value={seoAnalysis}
                  onChange={(e) => setSeoAnalysis(e.target.value)}
                  rows={3}
                  placeholder="Explanation of the SEO score..."
                />
              </div>
            </div>
          </div>

          {/* ── Readability Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Readability</p>
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <div className="space-y-2">
                <Label htmlFor="blog-readability-score">Score</Label>
                <Input
                  id="blog-readability-score"
                  type="number"
                  min={0}
                  max={100}
                  value={readabilityScore}
                  onChange={(e) => setReadabilityScore(e.target.value)}
                  placeholder="0-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-readability-analysis">Readability Analysis</Label>
                <Textarea
                  id="blog-readability-analysis"
                  value={readabilityAnalysis}
                  onChange={(e) => setReadabilityAnalysis(e.target.value)}
                  rows={3}
                  placeholder="Explanation of the readability score..."
                />
              </div>
            </div>
          </div>

          {/* ── Categorization Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categorization</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="blog-category">Category</Label>
                <Input
                  id="blog-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Business Automation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-tags">
                  Tags <span className="text-muted-foreground font-normal">(comma separated)</span>
                </Label>
                <Input
                  id="blog-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="SEO, Workflow, Business"
                />
              </div>
            </div>
          </div>

          {/* ── Image Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Image</p>
            <div className="space-y-2">
              <Label htmlFor="blog-alt-text">Alt Text</Label>
              <Input
                id="blog-alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="SEO alt text for the featured image..."
              />
            </div>
          </div>

          {/* ── References Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">References</p>
            <div className="space-y-2">
              <Label htmlFor="blog-sources">External Sources</Label>
              <Textarea
                id="blog-sources"
                value={externalSources}
                onChange={(e) => setExternalSources(e.target.value)}
                rows={3}
                placeholder="Reference URLs or citations..."
              />
            </div>
          </div>

          {/* ── Processing Section ── */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Processing</p>
            <div className="space-y-2">
              <Label htmlFor="blog-processing-log">Processing Log</Label>
              <Textarea
                id="blog-processing-log"
                value={processingLog}
                onChange={(e) => setProcessingLog(e.target.value)}
                rows={4}
                className="font-mono text-xs"
                placeholder="Audit trail of how this post was generated..."
              />
            </div>
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
