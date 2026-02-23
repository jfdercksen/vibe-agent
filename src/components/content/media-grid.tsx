'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Image as ImageIcon, Video, FileText, Wand2, Upload, Camera, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { MediaAsset } from '@/lib/types/database'

interface MediaGridProps {
  assets: MediaAsset[]
}

const typeFilters = ['all', 'image', 'video', 'document', 'graphic', 'logo'] as const

const sourceIcons: Record<string, typeof Upload> = {
  upload: Upload,
  ai_generated: Wand2,
  screenshot: Camera,
  scraped: Globe,
}

const sourceLabels: Record<string, string> = {
  upload: 'Uploaded',
  ai_generated: 'AI Generated',
  screenshot: 'Screenshot',
  scraped: 'Scraped',
}

export function MediaGrid({ assets }: MediaGridProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)

  const filtered = assets.filter((a) => {
    if (typeFilter === 'all') return true
    return a.asset_type === typeFilter
  })

  if (assets.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No media assets yet. Claude will create entries here when generating images or uploading files.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({assets.length})</TabsTrigger>
          {typeFilters.slice(1).map((t) => {
            const count = assets.filter((a) => a.asset_type === t).length
            if (count === 0) return null
            return (
              <TabsTrigger key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((asset) => {
          const isImage = asset.asset_type === 'image' || asset.asset_type === 'graphic' || asset.asset_type === 'logo'
          const isVideo = asset.asset_type === 'video'
          const SourceIcon = sourceIcons[asset.source || 'upload'] || Upload

          return (
            <Card
              key={asset.id}
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-md"
              onClick={() => setSelectedAsset(asset)}
            >
              {/* Preview */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {isImage && asset.file_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.file_url}
                    alt={asset.alt_text || asset.file_name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : isVideo ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}

                {/* Source badge overlay */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black/60 text-white text-[10px] hover:bg-black/60">
                    <SourceIcon className="mr-1 h-3 w-3" />
                    {sourceLabels[asset.source || ''] || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{asset.file_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                  </span>
                  {asset.file_size && (
                    <span className="text-xs text-muted-foreground">
                      {(asset.file_size / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        {selectedAsset && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAsset.file_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Preview */}
              {(selectedAsset.asset_type === 'image' || selectedAsset.asset_type === 'graphic') && selectedAsset.file_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.alt_text || selectedAsset.file_name}
                  className="w-full rounded-lg"
                />
              )}

              {/* Details */}
              <div className="grid gap-2 text-sm">
                {selectedAsset.alt_text && (
                  <div><span className="font-medium">Alt text:</span> {selectedAsset.alt_text}</div>
                )}
                {selectedAsset.mime_type && (
                  <div><span className="font-medium">Type:</span> {selectedAsset.mime_type}</div>
                )}
                {selectedAsset.ai_prompt && (
                  <div>
                    <span className="font-medium">AI Prompt:</span>
                    <p className="mt-1 text-muted-foreground bg-muted p-2 rounded text-xs">
                      {selectedAsset.ai_prompt}
                    </p>
                  </div>
                )}
                {selectedAsset.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Tags:</span>
                    {selectedAsset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
