'use client'

import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ToolActivityCard, ToolActivity } from './tool-activity-card'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolActivities?: ToolActivity[]
  isStreaming?: boolean
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3 mb-6', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-1.5 max-w-[80%]', isUser && 'items-end')}>
        {/* Tool activity cards (above the text for assistant) */}
        {!isUser && message.toolActivities && message.toolActivities.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            {message.toolActivities.map((activity) => (
              <ToolActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}

        {/* Message text */}
        {message.content && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-background border shadow-sm rounded-tl-sm'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-xs">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

export type { Message }
