'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/content/status-badge'
import { Search, TrendingUp, Zap, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KeywordResearch } from '@/lib/types/database'

interface KeywordsListProps {
  keywords: KeywordResearch[]
}

const intentColors: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-700',
  transactional: 'bg-green-100 text-green-700',
  navigational: 'bg-purple-100 text-purple-700',
  commercial: 'bg-amber-100 text-amber-700',
}

const difficultyColors: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
}

type SortField = 'keyword' | 'search_volume' | 'difficulty' | 'priority'
type SortDir = 'asc' | 'desc'

export function KeywordsList({ keywords }: KeywordsListProps) {
  const [filter, setFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Memoised — only recomputes when keywords, filter, sortField or sortDir changes
  const { filtered, quickWins, avgVolume, pillarCount } = useMemo(() => {
    const filtered = keywords
      .filter((kw) => {
        if (filter === 'all') return true
        if (filter === 'quick_win') return kw.is_quick_win
        return kw.search_intent === filter
      })
      .sort((a, b) => {
        let aVal: string | number = 0
        let bVal: string | number = 0
        switch (sortField) {
          case 'keyword':
            aVal = a.keyword.toLowerCase(); bVal = b.keyword.toLowerCase(); break
          case 'search_volume':
            aVal = a.search_volume || 0; bVal = b.search_volume || 0; break
          case 'difficulty':
            aVal = a.difficulty === 'low' ? 1 : a.difficulty === 'medium' ? 2 : 3
            bVal = b.difficulty === 'low' ? 1 : b.difficulty === 'medium' ? 2 : 3; break
          case 'priority':
            aVal = a.priority || 99; bVal = b.priority || 99; break
        }
        if (typeof aVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal)
        }
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      })

    const quickWins = keywords.filter((k) => k.is_quick_win).length
    const avgVolume = keywords.length > 0
      ? Math.round(keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0) / keywords.length)
      : 0
    const pillarCount = new Set(keywords.map(k => k.content_pillar).filter(Boolean)).size

    return { filtered, quickWins, avgVolume, pillarCount }
  }, [keywords, filter, sortField, sortDir])

  if (keywords.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No keyword research yet. Ask Claude to run keyword research using DataForSEO for this client.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{keywords.length}</div>
            <p className="text-xs text-muted-foreground">Total Keywords</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{quickWins}</div>
            <p className="text-xs text-muted-foreground">Quick Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{avgVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg. Volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{pillarCount}</div>
            <p className="text-xs text-muted-foreground">Content Pillars</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({keywords.length})</TabsTrigger>
          <TabsTrigger value="quick_win" className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> Quick Wins ({quickWins})
          </TabsTrigger>
          <TabsTrigger value="informational">Informational</TabsTrigger>
          <TabsTrigger value="transactional">Transactional</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Keywords Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleSort('keyword')}>
                  Keyword <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleSort('search_volume')}>
                  Volume <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleSort('difficulty')}>
                  Difficulty <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Pillar</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => toggleSort('priority')}>
                  Priority <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((kw) => (
              <TableRow key={kw.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {kw.keyword}
                    {kw.is_quick_win && (
                      <Zap className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    {kw.search_volume?.toLocaleString() || '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium capitalize ${difficultyColors[kw.difficulty || ''] || ''}`}>
                    {kw.difficulty || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  {kw.search_intent && (
                    <Badge className={`text-xs ${intentColors[kw.search_intent]}`}>
                      {kw.search_intent}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {kw.content_pillar && (
                    <Badge variant="outline" className="text-xs">
                      {kw.content_pillar}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {kw.priority && (
                    <span className="text-sm font-medium">P{kw.priority}</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={kw.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
