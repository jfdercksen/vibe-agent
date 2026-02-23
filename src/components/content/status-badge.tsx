import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  // Content statuses
  idea: { label: 'Idea', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  researching: { label: 'Researching', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  drafting: { label: 'Drafting', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  draft: { label: 'Draft', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  outline: { label: 'Outline', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  review: { label: 'In Review', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  scheduled: { label: 'Scheduled', className: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  paused: { label: 'Paused', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  sent: { label: 'Sent', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  concept: { label: 'Concept', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  live: { label: 'Live', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  retired: { label: 'Retired', className: 'bg-gray-100 text-gray-500 hover:bg-gray-100' },
  in_production: { label: 'In Production', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  complete: { label: 'Complete', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  // Calendar
  planned: { label: 'Planned', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  created: { label: 'Created', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  // Keywords
  identified: { label: 'Identified', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
