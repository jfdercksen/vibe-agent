import { getClientStats, getRecentActivity, getClient, getCalendarEvents } from '@/lib/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/content/status-badge'
import { PlatformBadge } from '@/components/content/platform-icon'
import { CalendarView } from '@/components/content/calendar-view'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'
import { Share2, FileText, Mail, Search, Lightbulb, CheckCircle2, Clock, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface OverviewPageProps {
  params: Promise<{ clientId: string }>
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { clientId } = await params
  const [stats, activity, client, calendarEvents] = await Promise.all([
    getClientStats(clientId),
    getRecentActivity(clientId),
    getClient(clientId),
    getCalendarEvents(clientId),
  ])

  const statCards = [
    { label: 'Social Posts', value: stats.totalPosts, icon: Share2, color: 'text-blue-600' },
    { label: 'Blog Posts', value: stats.totalBlogs, icon: FileText, color: 'text-purple-600' },
    { label: 'Email Sequences', value: stats.totalEmails, icon: Mail, color: 'text-green-600' },
    { label: 'Keywords', value: stats.totalKeywords, icon: Search, color: 'text-amber-600' },
    { label: 'Content Ideas', value: stats.totalIdeas, icon: Lightbulb, color: 'text-pink-600' },
    { label: 'In Review', value: stats.postsInReview, icon: Eye, color: 'text-purple-600' },
    { label: 'Approved', value: stats.postsApproved, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Published', value: stats.postsPublished, icon: Clock, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {client?.display_name || client?.name || 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Overview of all marketing activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Calendar */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Content Calendar</h2>
        <CalendarView events={calendarEvents} clientId={clientId} />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest content created by Claude</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {item.type === 'social' && <Share2 className="h-4 w-4 text-blue-600" />}
                      {item.type === 'blog' && <FileText className="h-4 w-4 text-purple-600" />}
                      {item.type === 'idea' && <Lightbulb className="h-4 w-4 text-pink-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.platform && <PlatformBadge platform={item.platform} />}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Lightbulb className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p>No activity yet. Use Claude Code to start creating content for this client.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Realtime subscriptions */}
      <RealtimeRefresh table="social_posts" clientId={clientId} />
      <RealtimeRefresh table="blog_posts" clientId={clientId} />
      <RealtimeRefresh table="content_calendar" clientId={clientId} />
    </div>
  )
}
