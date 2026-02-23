import { getCalendarEvents } from '@/lib/data'
import { CalendarView } from '@/components/content/calendar-view'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'

interface CalendarPageProps {
  params: Promise<{ clientId: string }>
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { clientId } = await params
  // Use default wide window (3 months back → 6 months forward)
  const events = await getCalendarEvents(clientId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
        <p className="text-muted-foreground">
          Scheduled content across all platforms and types
        </p>
      </div>
      <CalendarView events={events} clientId={clientId} />
      <RealtimeRefresh table="content_calendar" clientId={clientId} />
    </div>
  )
}
