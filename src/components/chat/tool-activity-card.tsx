'use client'

import { TOOL_LABELS, ToolName } from '@/lib/tools/tool-definitions'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface ToolActivity {
  id: string
  toolName: ToolName
  status: 'running' | 'done' | 'error'
  summary?: string
  error?: string
}

interface ToolActivityCardProps {
  activity: ToolActivity
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
}

export function ToolActivityCard({ activity }: ToolActivityCardProps) {
  const meta = TOOL_LABELS[activity.toolName] || {
    icon: '⚙️',
    label: activity.toolName,
    color: 'gray',
  }
  const colorClass = colorMap[meta.color] || colorMap.gray

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-3 py-2 text-sm my-1', colorClass)}>
      <span className="text-base leading-5">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{meta.label}</span>
          {activity.status === 'running' && (
            <Loader2 className="h-3 w-3 animate-spin opacity-70" />
          )}
          {activity.status === 'done' && (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          )}
          {activity.status === 'error' && (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
        </div>
        {activity.summary && (
          <p className="text-xs opacity-75 mt-0.5 truncate">{activity.summary}</p>
        )}
        {activity.error && (
          <p className="text-xs text-red-600 mt-0.5">{activity.error}</p>
        )}
      </div>
    </div>
  )
}

export type { ToolActivity }
