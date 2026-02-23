'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ApprovalButtonsProps {
  table: string
  recordId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
  showPublish?: boolean
  compact?: boolean
  approveStatus?: string   // override default 'approved' — e.g. 'live' for lead magnets
  rejectStatus?: string    // override: 'retired' (lead magnets), 'paused' (sequences), 'archived' (blog/ideas)
}

// ── Label helpers ──────────────────────────────────────────────────────────────
function rejectLabel(rejectStatus: string): string {
  switch (rejectStatus) {
    case 'retired':  return 'Retire'
    case 'paused':   return 'Pause'
    case 'archived': return 'Archive'
    default:         return 'Reject'
  }
}

function rejectDialogTitle(rejectStatus: string): string {
  switch (rejectStatus) {
    case 'retired':  return 'Retire Lead Magnet'
    case 'paused':   return 'Pause Sequence'
    case 'archived': return 'Archive'
    default:         return 'Reject with Feedback'
  }
}

function rejectDialogDesc(rejectStatus: string): string {
  switch (rejectStatus) {
    case 'retired':  return 'This will mark it as retired. You can reactivate it later.'
    case 'paused':   return 'This will pause the email sequence. You can reactivate it later.'
    case 'archived': return 'This will archive it. You can restore it later.'
    default:         return 'Add notes so Claude knows what to fix when revising.'
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ApprovalButtons({
  table,
  recordId,
  currentStatus,
  onStatusChange,
  showPublish = false,
  compact = false,
  approveStatus = 'approved',
  rejectStatus = 'rejected',
}: ApprovalButtonsProps) {
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Route ALL updates through the service-role API — anon key has no UPDATE perms via RLS
  const updateStatus = async (newStatus: string, notes?: string) => {
    setIsLoading(true)
    try {
      const fields: Record<string, unknown> = { status: newStatus }

      // Store rejection notes where the schema supports it
      if (notes && table === 'blog_posts') fields.fact_check_notes = notes

      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id: recordId, fields }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Update failed' }))
        throw new Error(err.error || 'Update failed')
      }

      toast.success(`Status updated to ${newStatus}`)
      onStatusChange?.(newStatus)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
      console.error('ApprovalButtons error:', err)
    } finally {
      setIsLoading(false)
      setIsRejecting(false)
      setRejectNotes('')
    }
  }

  // Statuses from which you can approve / reject — covers all tables
  const approvableStatuses = [
    'draft', 'review', 'outline', 'drafting', 'concept', 'planned',
    'created', 'idea', 'researching', 'paused', 'archived',
  ]
  const rejectableStatuses = [
    'draft', 'review', 'outline', 'drafting', 'approved', 'concept',
    'live', 'created', 'idea', 'active', 'published',
  ]

  const canApprove  = approvableStatuses.includes(currentStatus) && currentStatus !== approveStatus
  const canReject   = rejectableStatuses.includes(currentStatus) && currentStatus !== rejectStatus
  const canSchedule = currentStatus === 'approved' && approveStatus === 'approved'
  const canPublish  = ['approved', 'scheduled'].includes(currentStatus) && showPublish

  // ── Reject Dialog (shared) ─────────────────────────────────────────────────
  const RejectDialog = (
    <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rejectDialogTitle(rejectStatus)}</DialogTitle>
          <DialogDescription>{rejectDialogDesc(rejectStatus)}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={
            rejectStatus === 'rejected'
              ? 'What needs to change? Be specific so Claude can revise it.'
              : 'Reason (optional)'
          }
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRejecting(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => updateStatus(rejectStatus, rejectNotes)}
            disabled={isLoading}
          >
            {rejectStatus === 'rejected' ? 'Reject with Notes' : `${rejectLabel(rejectStatus)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // ── Compact variant (icon buttons) ────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {canApprove && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => updateStatus(approveStatus)}
            disabled={isLoading}
            title={approveStatus === 'live' ? 'Mark as Live' : 'Approve'}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsRejecting(true)}
            disabled={isLoading}
            title={rejectLabel(rejectStatus)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {RejectDialog}
      </div>
    )
  }

  // ── Full variant ───────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      {canApprove && (
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => updateStatus(approveStatus)}
          disabled={isLoading}
        >
          <Check className="mr-1 h-4 w-4" />
          {approveStatus === 'live' ? 'Mark Live' : 'Approve'}
        </Button>
      )}
      {canReject && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setIsRejecting(true)}
          disabled={isLoading}
        >
          <X className="mr-1 h-4 w-4" />
          {rejectLabel(rejectStatus)}
        </Button>
      )}
      {canSchedule && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus('scheduled')}
          disabled={isLoading}
        >
          <Clock className="mr-1 h-4 w-4" />
          Schedule
        </Button>
      )}
      {canPublish && (
        <Button
          size="sm"
          onClick={() => updateStatus('published')}
          disabled={isLoading}
        >
          <Send className="mr-1 h-4 w-4" />
          Publish
        </Button>
      )}
      {RejectDialog}
    </div>
  )
}
