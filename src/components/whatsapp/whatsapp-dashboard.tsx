'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WhatsAppConversationWithMessages, WhatsAppMessage } from '@/lib/types/database'
import { MessageCircle, Phone, Clock, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface WhatsAppDashboardProps {
  clientId: string
  initialConversations: WhatsAppConversationWithMessages[]
  isConfigured: boolean
}

export function WhatsAppDashboard({
  clientId,
  initialConversations,
  isConfigured,
}: WhatsAppDashboardProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selected, setSelected] = useState<WhatsAppConversationWithMessages | null>(
    initialConversations[0] ?? null
  )
  const [refreshing, setRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.whatsapp_messages.length])

  // Refresh conversations from the server
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('*, whatsapp_messages(*)')
        .eq('client_id', clientId)
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (data) {
        const sorted = data.map(conv => ({
          ...conv,
          whatsapp_messages: (conv.whatsapp_messages || []).sort(
            (a: WhatsAppMessage, b: WhatsAppMessage) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
        }))
        setConversations(sorted)

        // Update selected conversation if it's in the new data
        if (selected) {
          const updated = sorted.find(c => c.id === selected.id)
          if (updated) setSelected(updated)
        }
      }
    } finally {
      setRefreshing(false)
    }
  }, [clientId, selected, supabase])

  // Poll every 10 seconds for new messages
  useEffect(() => {
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">WhatsApp not configured</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Add your Meta WhatsApp credentials in Settings to start receiving and auto-replying to customer messages.
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${clientId}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
          </Link>
        </Button>
      </div>
    )
  }

  // Empty state — configured but no conversations yet
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <MessageCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Waiting for messages</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            WhatsApp is connected. Once a customer messages your WhatsApp number, the conversation will appear here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-xl overflow-hidden bg-background">

      {/* ── Left: Conversation List ── */}
      <div className="w-72 shrink-0 border-r flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="text-sm font-semibold">Conversations</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh} disabled={refreshing} title="Refresh">
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const lastMsg = conv.whatsapp_messages[conv.whatsapp_messages.length - 1]
            const isSelected = selected?.id === conv.id

            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b hover:bg-accent/50 transition-colors',
                  isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                )}
              >
                {/* Phone number + time */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {conv.contact_name || conv.phone_number}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Phone number if contact name is shown */}
                {conv.contact_name && (
                  <p className="text-[10px] text-muted-foreground mb-1">{conv.phone_number}</p>
                )}

                {/* Last message preview */}
                {lastMsg && (
                  <p className="text-xs text-muted-foreground truncate">
                    <span className={cn('font-medium', lastMsg.role === 'assistant' && 'text-primary/70')}>
                      {lastMsg.role === 'user' ? '↙' : '↗ AI:'}
                    </span>{' '}
                    {lastMsg.content}
                  </p>
                )}

                {/* Message count badge */}
                <div className="mt-1.5">
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {conv.whatsapp_messages.length} message{conv.whatsapp_messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: Message Thread ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Thread header */}
        {selected ? (
          <>
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold">{selected.contact_name || selected.phone_number}</p>
                {selected.contact_name && (
                  <p className="text-xs text-muted-foreground">{selected.phone_number}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Claude is responding</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selected.whatsapp_messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-muted text-foreground rounded-tl-sm'
            : 'bg-green-600 text-white rounded-tr-sm'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isUser ? 'text-muted-foreground' : 'text-green-100'
        )}>
          {isUser ? '👤 Customer' : '🤖 Claude'} ·{' '}
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
