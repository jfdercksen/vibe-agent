'use client'

import { useState } from 'react'
import {
  SKILLS_LIBRARY,
  getSkillById,
  getSkillCategory,
  getTotalSkillCount,
} from '@/lib/skills-library'
import type { SkillItem, SkillCategory } from '@/lib/skills-library'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  ArrowLeft,
  Zap,
  Clock,
  Database,
  ListChecks,
  GitBranch,
  Layers,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SkillsPanelProps {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}

export function SkillsPanel({ onSelectPrompt, disabled }: SkillsPanelProps) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [openCategory, setOpenCategory] = useState<string | null>('strategy')
  const [search, setSearch] = useState('')

  const searchLower = search.toLowerCase().trim()

  // Flatten for search results
  const searchResults = searchLower
    ? SKILLS_LIBRARY.flatMap((cat) =>
        cat.skills
          .filter(
            (s) =>
              s.name.toLowerCase().includes(searchLower) ||
              s.description.toLowerCase().includes(searchLower) ||
              s.whenToUse.toLowerCase().includes(searchLower)
          )
          .map((s) => ({ ...s, categoryLabel: cat.label, categoryIcon: cat.icon, categoryColor: cat.color }))
      )
    : []

  // If a skill is selected, show the detail view
  if (selectedSkillId) {
    const skill = getSkillById(selectedSkillId)
    const category = getSkillCategory(selectedSkillId)
    if (skill && category) {
      return (
        <SkillDetail
          skill={skill}
          category={category}
          onBack={() => setSelectedSkillId(null)}
          onSelectPrompt={onSelectPrompt}
          onNavigateToSkill={(id) => setSelectedSkillId(id)}
          disabled={disabled}
        />
      )
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">Skills</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {getTotalSkillCount()}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
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
              {searchResults.map((item) => (
                <SkillRow
                  key={item.id}
                  skill={item}
                  meta={`${item.categoryIcon} ${item.categoryLabel}`}
                  onSelect={() => setSelectedSkillId(item.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No skills match &ldquo;{search}&rdquo;
            </p>
          )
        ) : (
          /* Category accordion */
          SKILLS_LIBRARY.map((category) => {
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
                      {category.skills.length}
                    </span>
                  </span>
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  }
                </button>

                {/* Skills list */}
                {isOpen && (
                  <div className="mt-1 px-2 space-y-1 pb-2">
                    {category.skills.map((skill) => (
                      <SkillRow
                        key={skill.id}
                        skill={skill}
                        onSelect={() => setSelectedSkillId(skill.id)}
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
          Click any skill to learn how to use it
        </p>
      </div>
    </div>
  )
}

// ─── Skill Row (list item) ────────────────────────────────────

function SkillRow({
  skill,
  meta,
  onSelect,
  disabled,
}: {
  skill: SkillItem
  meta?: string
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors group',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-primary/10 hover:text-primary cursor-pointer'
      )}
    >
      <div className="flex items-start gap-1.5">
        <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="min-w-0">
          <span className="font-medium leading-snug">{skill.name}</span>
          <span className="block text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {skill.description}
          </span>
          {meta && (
            <span className="block text-[10px] text-muted-foreground/60 mt-0.5">{meta}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Skill Detail View ────────────────────────────────────────

function SkillDetail({
  skill,
  category,
  onBack,
  onSelectPrompt,
  onNavigateToSkill,
  disabled,
}: {
  skill: SkillItem
  category: SkillCategory
  onBack: () => void
  onSelectPrompt: (prompt: string) => void
  onNavigateToSkill: (skillId: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Back button */}
      <div className="px-3 pt-3 pb-2 border-b">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Skills</span>
        </button>
      </div>

      {/* Scrollable detail content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Skill name + badges */}
        <div>
          <h3 className="text-sm font-semibold leading-tight">{skill.name}</h3>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', category.color)}>
              {category.icon} {category.label}
            </span>
            {skill.skillStack !== 'Any' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                <Layers className="h-2.5 w-2.5 inline mr-0.5 -mt-px" />
                {skill.skillStack} Stack
              </span>
            )}
          </div>
        </div>

        {/* What It Does */}
        <DetailSection icon={BookOpen} title="What It Does">
          <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
        </DetailSection>

        {/* When to Use */}
        <DetailSection icon={Clock} title="When to Use">
          <p className="text-xs text-muted-foreground leading-relaxed">{skill.whenToUse}</p>
        </DetailSection>

        {/* What You Need */}
        <DetailSection icon={ListChecks} title="What You Need">
          <ul className="space-y-1">
            {skill.inputs.map((input, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <span className="text-muted-foreground/50 shrink-0 mt-0.5">•</span>
                <span>{input}</span>
              </li>
            ))}
          </ul>
        </DetailSection>

        {/* Prerequisites */}
        {skill.prerequisites.length > 0 && (
          <DetailSection icon={GitBranch} title="Run First">
            <div className="flex flex-wrap gap-1.5">
              {skill.prerequisites.map((preReqId) => {
                const preReq = getSkillById(preReqId)
                if (!preReq) return null
                return (
                  <button
                    key={preReqId}
                    onClick={() => onNavigateToSkill(preReqId)}
                    className="text-[10px] px-2 py-1 rounded-md border bg-background hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors font-medium"
                  >
                    {preReq.name}
                  </button>
                )
              })}
            </div>
          </DetailSection>
        )}

        {/* Saves To */}
        <DetailSection icon={Database} title="Saves To">
          <p className="text-xs text-muted-foreground font-mono">{skill.outputs}</p>
        </DetailSection>
      </div>

      {/* Use This Skill button */}
      <div className="px-3 py-3 border-t">
        <Button
          className="w-full gap-2"
          size="sm"
          disabled={disabled}
          onClick={() => onSelectPrompt(skill.primaryPrompt)}
        >
          <Zap className="h-3.5 w-3.5" />
          Use This Skill
        </Button>
      </div>
    </div>
  )
}

// ─── Detail Section wrapper ───────────────────────────────────

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}
