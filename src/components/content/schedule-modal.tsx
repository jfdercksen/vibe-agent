'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'

interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  onScheduled?: (date: string, time: string) => void
  clientId: string
  table: 'social_posts' | 'blog_posts'
  recordId: string
  contentType: 'social' | 'blog' | 'email' | 'video'
  title: string
  platform?: string
  currentScheduledFor?: string | null
}

export function ScheduleModal({
  open,
  onClose,
  onScheduled,
  clientId,
  table,
  recordId,
  contentType,
  title,
  platform,
  currentScheduledFor,
}: ScheduleModalProps) {
  // Default to tomorrow at 9am if no current date
  const defaultDate = currentScheduledFor
    ? currentScheduledFor.split('T')[0]
    : format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const defaultTime = currentScheduledFor
    ? currentScheduledFor.split('T')[1]?.substring(0, 5) || '09:00'
    : '09:00'

  const [scheduledDate, setScheduledDate] = useState(defaultDate)
  const [scheduledTime, setScheduledTime] = useState(defaultTime)
  const [isLoading, setIsLoading] = useState(false)

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error('Please select a date')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/content/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          table,
          id: recordId,
          contentType,
          title,
          platform,
          scheduledDate,
          scheduledTime: scheduledTime || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to schedule')
      }

      toast.success(`Scheduled for ${format(new Date(scheduledDate), 'MMMM d, yyyy')} at ${scheduledTime || '09:00'}`)
      onScheduled?.(scheduledDate, scheduledTime)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Schedule Content
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm">
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-date" className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Date
            </Label>
            <Input
              id="schedule-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-time" className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Time <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="schedule-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {scheduledDate && (
            <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
              Will appear on the calendar on{' '}
              <strong>{format(new Date(scheduledDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</strong>
              {scheduledTime && <> at <strong>{scheduledTime}</strong></>}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading || !scheduledDate}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
            ) : (
              <><CalendarIcon className="mr-2 h-4 w-4" /> Schedule</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
