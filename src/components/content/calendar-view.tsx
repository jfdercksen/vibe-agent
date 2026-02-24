'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/content/status-badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Share2, FileText, Mail, Video, GripVertical } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { toast } from 'sonner'
import type { ContentCalendar } from '@/lib/types/database'

interface CalendarViewProps {
  events: ContentCalendar[]
  clientId: string
}

const typeIcons: Record<string, typeof Share2> = {
  social: Share2,
  blog: FileText,
  email: Mail,
  video: Video,
}

const typeColors: Record<string, string> = {
  social: 'bg-blue-500',
  blog: 'bg-purple-500',
  email: 'bg-green-500',
  video: 'bg-red-500',
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // ── Local events for optimistic drag-and-drop ──────────────────
  const [localEvents, setLocalEvents] = useState<ContentCalendar[]>(events)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start of month to align with weekday headers
  const startPadding = getDay(monthStart)
  const paddedDays = [...Array(startPadding).fill(null), ...days]

  const eventsForDate = useMemo(() => {
    const map = new Map<string, ContentCalendar[]>()
    localEvents.forEach((event) => {
      const key = event.scheduled_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    return map
  }, [localEvents])

  const selectedEvents = selectedDate
    ? eventsForDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : []

  // ── Drag-and-drop handlers ────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(eventId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDropTarget(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(dateStr)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newDateStr: string) => {
    e.preventDefault()
    setDropTarget(null)
    setDraggingId(null)

    const eventId = e.dataTransfer.getData('text/plain')
    if (!eventId) return

    // Find the event
    const event = localEvents.find((ev) => ev.id === eventId)
    if (!event) return

    // Skip if same date
    if (event.scheduled_date === newDateStr) return

    const oldDateStr = event.scheduled_date
    const displayTitle = event.title || event.content_type

    // Optimistic update
    setLocalEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, scheduled_date: newDateStr } : ev
      )
    )

    // API call
    try {
      const res = await fetch('/api/calendar/reschedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId, scheduled_date: newDateStr }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reschedule')
      }

      toast.success(`Moved "${displayTitle}" to ${format(new Date(newDateStr + 'T12:00:00'), 'MMM d')}`)
    } catch (err) {
      // Revert optimistic update
      setLocalEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, scheduled_date: oldDateStr } : ev
        )
      )
      toast.error(`Failed to reschedule: ${(err as Error).message}`)
    }
  }, [localEvents])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Drag events between days to reschedule</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-px">
            {paddedDays.map((day, i) => {
              if (!day) {
                return <div key={`pad-${i}`} className="min-h-[80px]" />
              }

              const dateStr = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsForDate.get(dateStr) || []
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isDropping = dropTarget === dateStr

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`min-h-[80px] rounded-md border p-1.5 cursor-pointer transition-all ${
                    isDropping
                      ? 'ring-2 ring-primary bg-primary/10 border-primary'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted/50'
                  } ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isToday(day)
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          handleDragStart(e, event.id)
                        }}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-white cursor-grab active:cursor-grabbing select-none ${
                          typeColors[event.content_type] || 'bg-gray-500'
                        } ${draggingId === event.id ? 'opacity-40' : 'hover:brightness-110'}`}
                      >
                        <GripVertical className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        <span className="truncate">{event.title || event.content_type}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedEvents.map((event) => {
                const Icon = typeIcons[event.content_type] || CalendarIcon
                return (
                  <div key={event.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{event.content_type}</span>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    {event.title && (
                      <p className="text-sm">{event.title}</p>
                    )}
                    {event.platform && (
                      <Badge variant="outline" className="text-xs">{event.platform}</Badge>
                    )}
                    {event.scheduled_time && (
                      <p className="text-xs text-muted-foreground">
                        Time: {event.scheduled_time}
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-xs text-muted-foreground">{event.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {selectedDate ? 'Nothing scheduled for this day.' : 'Click a day to see scheduled content.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
