'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { WhatsAppConversationWithMessages, WhatsAppMessage } from '@/lib/types/database'
import { MessageCircle, Phone, Clock, Settings, RefreshCw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

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
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.whatsapp_messages.length])

  // Refresh via API route — uses admin client server-side, no RLS/anon key issues
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/whatsapp/conversations?clientId=${clientId}`)
      if (!res.ok) return
      const data: WhatsAppConversationWithMessages[] = await res.json()

      setConversations(data)

      // Keep selected conversation in sync with latest messages
      if (selected) {
        const updated = data.find(c => c.id === selected.id)
        if (updated) setSelected(updated)
      }
    } finally {
      setRefreshing(false)
    }
  }, [clientId, selected])

  // Poll every 10 seconds for new messages
  useEffect(() => {
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  // Send a manual reply
  const handleSend = useCallback(async () => {
    if (!selected || !reply.trim() || sending) return

    const messageText = reply.trim()
    setSending(true)
    setReply('')

    // Optimistic update — show immediately in the thread
    const optimisticMsg: WhatsAppMessage = {
      id: `optimistic-${Date.now()}`,
      conversation_id: selected.id,
      role: 'assistant',
      content: messageText,
      created_at: new Date().toISOString(),
    }
    const updatedConv = {
      ...selected,
      whatsapp_messages: [...selected.whatsapp_messages, optimisticMsg],
      last_message_at: new Date().toISOString(),
    }
    setSelected(updatedConv)
    setConversations(prev =>
      prev.map(c => c.id === selected.id ? updatedConv : c)
    )

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selected.id,
          clientId,
          message: messageText,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        let errMsg = 'Failed to send'
        try { errMsg = JSON.parse(text)?.error || errMsg } catch { /* not JSON */ }
        toast.error(errMsg)
        // Revert optimistic update
        setSelected(selected)
        setConversations(prev =>
          prev.map(c => c.id === selected.id ? selected : c)
        )
        setReply(messageText) // Restore the typed message
      } else {
        // Refresh to replace optimistic ID with real DB record
        await refresh()
      }
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [selected, reply, sending, clientId, refresh])

  // Submit on Enter (Shift+Enter for newline)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ── Not configured ──────────────────────────────────────────────────────────
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

  // ── Empty state ─────────────────────────────────────────────────────────────
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

  // ── Main layout ─────────────────────────────────────────────────────────────
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
                onClick={() => { setSelected(conv); setReply('') }}
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

                {conv.contact_name && (
                  <p className="text-[10px] text-muted-foreground mb-1">{conv.phone_number}</p>
                )}

                {lastMsg && (
                  <p className="text-xs text-muted-foreground truncate">
                    <span className={cn('font-medium', lastMsg.role === 'assistant' && 'text-primary/70')}>
                      {lastMsg.role === 'user' ? '↙' : '↗'}
                    </span>{' '}
                    {lastMsg.content}
                  </p>
                )}

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
        {selected ? (
          <>
            {/* Thread header */}
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold">{selected.contact_name || selected.phone_number}</p>
                {selected.contact_name && (
                  <p className="text-xs text-muted-foreground">{selected.phone_number}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Claude is auto-replying</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selected.whatsapp_messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Reply input bar ── */}
            <div className="shrink-0 border-t bg-background px-4 py-3">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a manual reply… (Enter to send, Shift+Enter for newline)"
                  className="min-h-[42px] max-h-32 resize-none text-sm flex-1"
                  disabled={sending}
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={!reply.trim() || sending}
                  size="sm"
                  className="h-[42px] px-3 bg-green-600 hover:bg-green-700 text-white shrink-0"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                This sends directly from your WhatsApp Business number. Claude will still auto-reply to future customer messages.
              </p>
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
  const isOptimistic = message.id.startsWith('optimistic-')

  return (
    <div className={cn('flex', isUser ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm transition-opacity',
          isUser
            ? 'bg-muted text-foreground rounded-tl-sm'
            : 'bg-green-600 text-white rounded-tr-sm',
          isOptimistic && 'opacity-70'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isUser ? 'text-muted-foreground' : 'text-green-100'
        )}>
          {isUser ? '👤 Customer' : '🟢 You'} ·{' '}
          {isOptimistic ? 'sending…' : formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
