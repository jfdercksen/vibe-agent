'use client'

import { useState } from 'react'
import { PROMPT_LIBRARY } from '@/lib/prompt-library'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Sparkles, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}

export function PromptLibrary({ onSelectPrompt, disabled }: PromptLibraryProps) {
  const [openCategory, setOpenCategory] = useState<string | null>('social')
  const [search, setSearch] = useState('')

  const searchLower = search.toLowerCase().trim()

  // Flatten for search results
  const searchResults = searchLower
    ? PROMPT_LIBRARY.flatMap((cat) =>
        cat.prompts
          .filter(
            (p) =>
              p.label.toLowerCase().includes(searchLower) ||
              p.prompt.toLowerCase().includes(searchLower)
          )
          .map((p) => ({ ...p, categoryLabel: cat.label, categoryIcon: cat.icon }))
      )
    : []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">Prompt Library</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="h-8 pl-8 pr-8 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Search results */}
        {searchLower ? (
          searchResults.length > 0 ? (
            <div className="px-2 space-y-1">
              {searchResults.map((item, i) => (
                <PromptButton
                  key={i}
                  label={item.label}
                  prompt={item.prompt}
                  meta={`${item.categoryIcon} ${item.categoryLabel}`}
                  onSelect={onSelectPrompt}
                  disabled={disabled}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No prompts match "{search}"
            </p>
          )
        ) : (
          /* Category accordion */
          PROMPT_LIBRARY.map((category) => {
            const isOpen = openCategory === category.id
            return (
              <div key={category.id} className="mb-1">
                {/* Category header */}
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md mx-2 transition-colors',
                    isOpen
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-normal', category.color)}>
                      {category.prompts.length}
                    </span>
                  </span>
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  }
                </button>

                {/* Prompts list */}
                {isOpen && (
                  <div className="mt-1 px-2 space-y-1 pb-2">
                    {category.prompts.map((item, i) => (
                      <PromptButton
                        key={i}
                        label={item.label}
                        prompt={item.prompt}
                        onSelect={onSelectPrompt}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Click any prompt to send it instantly, or customise it first in the chat box
        </p>
      </div>
    </div>
  )
}

function PromptButton({
  label,
  prompt,
  meta,
  onSelect,
  disabled,
}: {
  label: string
  prompt: string
  meta?: string
  onSelect: (p: string) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onSelect(prompt)}
      disabled={disabled}
      title={prompt}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors group',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-primary/10 hover:text-primary cursor-pointer'
      )}
    >
      <div className="flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <div>
          <span className="font-medium leading-snug">{label}</span>
          {meta && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">{meta}</span>
          )}
        </div>
      </div>
    </button>
  )
}
