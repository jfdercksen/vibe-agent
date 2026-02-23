'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

const STAGES = [
  { number: 1, label: 'Discovery', description: 'Business info & goals' },
  { number: 2, label: 'Research', description: 'Market & competitor analysis' },
  { number: 3, label: 'Brand Voice', description: 'Tone & vocabulary guide' },
  { number: 4, label: 'Positioning', description: 'Market angle selection' },
  { number: 5, label: 'Content Kickoff', description: 'First 30 days of content' },
]

interface OnboardingProgressProps {
  currentStage: number
  completed: boolean
  isLoading?: boolean
}

export function OnboardingProgress({ currentStage, completed, isLoading }: OnboardingProgressProps) {
  if (completed) return null

  const progressPct = Math.round(((currentStage - 1) / 5) * 100)

  return (
    <div className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Onboarding — Stage {currentStage} of 5
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{progressPct}% complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stage pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {STAGES.map((stage) => {
          const isDone = stage.number < currentStage
          const isCurrent = stage.number === currentStage
          const isPending = stage.number > currentStage

          return (
            <div
              key={stage.number}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap border',
                isDone && 'bg-emerald-50 border-emerald-200 text-emerald-700',
                isCurrent && 'bg-primary/10 border-primary/30 text-primary font-medium',
                isPending && 'bg-muted/50 border-transparent text-muted-foreground'
              )}
            >
              {isDone && <CheckCircle2 className="h-3 w-3" />}
              {isCurrent && (
                isLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Circle className="h-3 w-3 fill-primary/20" />
              )}
              {isPending && <Circle className="h-3 w-3" />}
              <span>{stage.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
