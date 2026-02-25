'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PublishButtonProps {
  postId: string
  clientId: string
  contentType: 'social' | 'blog' | 'email'
  platform?: string
  status: string
  n8nConfigured: boolean
  onPublished?: (newStatus: string) => void
  compact?: boolean
}

export function PublishButton({
  postId,
  clientId,
  contentType,
  platform,
  status,
  n8nConfigured,
  onPublished,
  compact = false,
}: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [localStatus, setLocalStatus] = useState(status)

  // Only show for approved or scheduled posts
  if (!['approved', 'scheduled'].includes(localStatus)) return null

  const handlePublish = async () => {
    if (isPublishing) return
    setIsPublishing(true)

    try {
      const res = await fetch(`/api/publish/${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, clientId, platform }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to publish')
        return
      }

      const newStatus = data.status as string
      setLocalStatus(newStatus)
      onPublished?.(newStatus)

      if (newStatus === 'publishing') {
        toast.success(
          n8nConfigured
            ? 'Sent to n8n — publishing in progress. Status will update automatically.'
            : 'Publishing triggered — check your n8n dashboard.',
          { duration: 5000 }
        )
      } else {
        toast.success('Published successfully!')
      }
    } catch (err) {
      console.error('[publish-button] error:', err)
      toast.error('Network error — please try again')
    } finally {
      setIsPublishing(false)
    }
  }

  if (localStatus === 'publishing') {
    return (
      <Button variant="outline" size={compact ? 'sm' : 'default'} disabled className="gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {!compact && 'Publishing...'}
      </Button>
    )
  }

  if (localStatus === 'published') {
    return (
      <Button variant="outline" size={compact ? 'sm' : 'default'} disabled className="gap-1.5 text-green-600 border-green-200">
        <CheckCircle className="h-3.5 w-3.5" />
        {!compact && 'Published'}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'default'}
      onClick={handlePublish}
      disabled={isPublishing}
      className="gap-1.5"
      title={n8nConfigured ? `Publish via n8n` : 'Mark as published (connect n8n to publish to platforms)'}
    >
      {isPublishing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {!compact && (isPublishing ? 'Publishing...' : 'Publish')}
    </Button>
  )
}
