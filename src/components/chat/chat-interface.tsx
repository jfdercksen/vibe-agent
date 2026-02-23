'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageBubble, Message } from './message-bubble'
import { OnboardingProgress } from './onboarding-progress'
import { ToolActivity } from './tool-activity-card'
import { ToolName } from '@/lib/tools/tool-definitions'
import { Send, Loader2, Sparkles, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptLibrary } from './prompt-library'
import { SkillsPanel } from './skills-panel'

interface ChatInterfaceProps {
  clientId: string
  clientName: string
  onboardingStage: number
  onboardingCompleted: boolean
  isMarketer?: boolean
}

interface SSEEvent {
  type: 'text' | 'tool_start' | 'tool_result' | 'tool_error' | 'done' | 'error'
  content?: string
  toolName?: ToolName
  toolId?: string
  summary?: string
  error?: string
}

const SUGGESTED_PROMPTS_ONBOARDING: Record<number, string[]> = {
  1: ["Let's get started with my business setup", "I'm ready to begin onboarding"],
  2: ["Please research my market and competitors", "Start the market research phase"],
  3: ["Let's build my brand voice", "Start the brand voice discovery"],
  4: ["Generate my positioning angles", "Let's find my market positioning"],
  5: ["Create my first 30 days of content", "Let's build the content calendar"],
}

const SUGGESTED_PROMPTS_FREEFORM = [
  "Write 10 LinkedIn posts for this week",
  "Research what my competitors posted recently",
  "Create a 7-email welcome sequence",
  "Find keyword opportunities for a new blog series",
  "Write a lead magnet outline",
]

export function ChatInterface({
  clientId,
  clientName,
  onboardingStage,
  onboardingCompleted,
  isMarketer = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [currentStage, setCurrentStage] = useState(onboardingStage)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(onboardingCompleted)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [skillsPanelOpen, setSkillsPanelOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  // Load chat history from Supabase on mount
  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true)
      try {
        const res = await fetch(`/api/chat/history?clientId=${clientId}`)
        const data = await res.json()
        const saved: Array<{ id: string; role: string; content: string; created_at: string }> = data.messages || []
        setHasMoreHistory(data.hasMore || false)

        if (saved.length > 0) {
          // Restore previous messages
          const restored: Message[] = saved.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content || '',
            toolActivities: [],
            timestamp: new Date(m.created_at),
          }))
          setMessages(restored)
          // Scroll to bottom instantly (no animation) on restore
          setTimeout(() => scrollToBottom(false), 50)
        } else {
          // No history — show welcome message
          const welcomeContent = isOnboardingCompleted
            ? `Welcome back! Your marketing foundation is fully set up for **${clientName}**.\n\nI'm ready to help with anything — writing content, researching trends, refining strategy, or building new campaigns.\n\n**What would you like to work on today?**`
            : `Welcome to Vibe Agent! I'm Vibe, your AI marketing strategist.\n\nI'm going to help build **${clientName}'s** complete marketing foundation — from brand voice to positioning to a full content calendar.\n\nWe'll work through 5 stages together. I'll research your market, analyze competitors, and create everything you need. You approve each stage before we move on.\n\n**Ready to start? Tell me a bit about your business** — what do you do, who do you serve, and what's your main goal right now?`

          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: welcomeContent,
            toolActivities: [],
            timestamp: new Date(),
          }])
        }
      } catch {
        // Fallback welcome on error
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm Vibe, your AI marketing strategist for **${clientName}**. What would you like to work on?`,
          toolActivities: [],
          timestamp: new Date(),
        }])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantId = `assistant-${Date.now()}`
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolActivities: [],
      isStreaming: true,
      timestamp: new Date(),
    }])

    const toolActivities: ToolActivity[] = []

    try {
      abortControllerRef.current = new AbortController()
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 280000)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, message: messageText.trim(), isMarketer }),
        signal: abortControllerRef.current.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event: SSEEvent = JSON.parse(jsonStr)

            if (event.type === 'text' && event.content) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + event.content } : m
              ))
            } else if (event.type === 'tool_start' && event.toolName && event.toolId) {
              toolActivities.push({ id: event.toolId, toolName: event.toolName, status: 'running' })
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolActivities: [...toolActivities] } : m
              ))
            } else if (event.type === 'tool_result' && event.toolId) {
              const idx = toolActivities.findIndex(a => a.id === event.toolId)
              if (idx >= 0) {
                toolActivities[idx] = { ...toolActivities[idx], status: 'done', summary: event.summary }
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, toolActivities: [...toolActivities] } : m
                ))
              }
              if (event.toolName === 'update_onboarding_stage' && event.summary) {
                const stageMatch = event.summary.match(/Stage (\d+)/)
                if (stageMatch) setCurrentStage(parseInt(stageMatch[1]))
                if (event.summary.includes('Onboarding Complete')) setIsOnboardingCompleted(true)
              }
            } else if (event.type === 'tool_error' && event.toolId) {
              const idx = toolActivities.findIndex(a => a.id === event.toolId)
              if (idx >= 0) {
                toolActivities[idx] = { ...toolActivities[idx], status: 'error', error: event.error }
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, toolActivities: [...toolActivities] } : m
                ))
              }
            } else if (event.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ))
            } else if (event.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content || `Sorry, something went wrong: ${event.error}`, isStreaming: false }
                  : m
              ))
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content || 'Sorry, I encountered an error. Please try again.', isStreaming: false }
            : m
        ))
      }
    } finally {
      setIsLoading(false)
    }
  }, [clientId, isMarketer, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const suggestedPrompts = isOnboardingCompleted
    ? SUGGESTED_PROMPTS_FREEFORM
    : (SUGGESTED_PROMPTS_ONBOARDING[currentStage] || [])

  // When a prompt is selected from the library — load it into the input box
  // so the user can read/edit it before sending
  const handlePromptSelect = useCallback((prompt: string) => {
    setInput(prompt)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  // Show history loading state
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full bg-muted/20 items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-muted/20 overflow-hidden">

      {/* ── Left sidebar: Prompt Library ── */}
      <div
        className={cn(
          'flex-shrink-0 border-r bg-background transition-all duration-200 overflow-hidden',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {sidebarOpen && (
          <PromptLibrary
            onSelectPrompt={handlePromptSelect}
            disabled={isLoading}
          />
        )}
      </div>

      {/* ── Main chat column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <OnboardingProgress
          currentStage={currentStage}
          completed={isOnboardingCompleted}
          isLoading={isLoading}
        />

        {/* Toggle left sidebar button */}
        <div className="absolute top-3 left-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Hide prompt library' : 'Show prompt library'}
          >
            {sidebarOpen
              ? <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />
            }
          </Button>
        </div>

        {/* Toggle right skills panel button */}
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setSkillsPanelOpen((v) => !v)}
            title={skillsPanelOpen ? 'Hide skills' : 'Show skills'}
          >
            {skillsPanelOpen
              ? <PanelRightClose className="h-4 w-4" />
              : <PanelRightOpen className="h-4 w-4" />
            }
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {hasMoreHistory && (
              <div className="text-center py-3 mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Showing recent messages — older history is available
                </span>
              </div>
            )}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested prompts — only show if few messages */}
        {!isLoading && suggestedPrompts.length > 0 && messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t bg-background px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 px-3 py-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isOnboardingCompleted
                    ? "Ask Vibe anything — use prompts or skills from the sidebars"
                    : `Stage ${currentStage}: ${getStageHint(currentStage)}`
                }
                className="min-h-[40px] max-h-[160px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
                rows={1}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className={cn('h-8 w-8 shrink-0 rounded-lg transition-all', input.trim() ? 'opacity-100' : 'opacity-40')}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Shift+Enter for new line · Enter to send · Vibe uses Perplexity, Firecrawl & DataForSEO for real-time research
            </p>
          </div>
        </div>
      </div>

      {/* ── Right sidebar: Skills Panel ── */}
      <div
        className={cn(
          'flex-shrink-0 border-l bg-background transition-all duration-200 overflow-hidden',
          skillsPanelOpen ? 'w-80' : 'w-0'
        )}
      >
        {skillsPanelOpen && (
          <SkillsPanel
            onSelectPrompt={handlePromptSelect}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  )
}

function getStageHint(stage: number): string {
  const hints: Record<number, string> = {
    1: 'Tell me about your business...',
    2: 'Ready to research your market?',
    3: "Let's build your brand voice...",
    4: 'Choose your positioning angle...',
    5: "Let's create your first content...",
  }
  return hints[stage] || 'Ask me anything...'
}
