'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Video from 'yet-another-react-lightbox/plugins/video'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/plugins/captions.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageGeneratorPanel } from '@/components/images/image-generator-panel'
import {
  LayoutGrid, List, Upload, Search, X, Copy, Check,
  Trash2, Info, Download, Star, Image as ImageIcon,
  Video as VideoIcon, FileText, Music, Wand2, Camera,
  Globe, Filter, ChevronDown, Loader2, AlertCircle,
  ImagePlus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { MediaAsset, AssetType } from '@/lib/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────
interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
  preview?: string
}

interface MediaLibraryProps {
  initialAssets: MediaAsset[]
  clientId: string
  clientLogoUrl?: string | null
}

// ── Config ─────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: typeof ImageIcon; color: string; accept: string }> = {
  image:      { label: 'Image',     icon: ImageIcon,  color: 'text-blue-500',   accept: 'image/*' },
  video:      { label: 'Video',     icon: VideoIcon,  color: 'text-red-500',    accept: 'video/*' },
  document:   { label: 'Document',  icon: FileText,   color: 'text-amber-500',  accept: '.pdf,.doc,.docx,.txt' },
  logo:       { label: 'Logo',      icon: Star,       color: 'text-yellow-500', accept: 'image/*' },
  graphic:    { label: 'Graphic',   icon: ImageIcon,  color: 'text-purple-500', accept: 'image/*' },
  voice_note: { label: 'Audio',     icon: Music,      color: 'text-green-500',  accept: 'audio/*' },
  font:       { label: 'Font',      icon: FileText,   color: 'text-gray-500',   accept: '.ttf,.otf,.woff,.woff2' },
}

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Upload }> = {
  upload:       { label: 'Uploaded',     icon: Upload },
  ai_generated: { label: 'AI Generated', icon: Wand2 },
  screenshot:   { label: 'Screenshot',   icon: Camera },
  scraped:      { label: 'Scraped',      icon: Globe },
}

const ACCEPT_ALL = {
  'image/*': [],
  'video/*': [],
  'audio/*': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  '.ttf': [], '.otf': [], '.woff': [], '.woff2': [],
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isVisualAsset(type: string | null): boolean {
  return ['image', 'graphic', 'logo'].includes(type || '')
}

// ── Upload Progress Card ───────────────────────────────────────────────────────
function UploadCard({ item }: { item: UploadingFile }) {
  return (
    <div className="relative rounded-lg border bg-muted/50 overflow-hidden aspect-square flex flex-col items-center justify-center gap-2 p-3">
      {item.preview && item.file.type.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.preview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      ) : null}
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        {item.status === 'uploading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="w-24 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-full">{item.file.name}</p>
          </>
        )}
        {item.status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-xs text-destructive">{item.error || 'Upload failed'}</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Asset Card (grid view) ─────────────────────────────────────────────────────
function AssetCard({
  asset,
  selected,
  onSelect,
  onOpenDetail,
  onOpenLightbox,
  isLogo,
}: {
  asset: MediaAsset
  selected: boolean
  onSelect: (id: string) => void
  onOpenDetail: (asset: MediaAsset) => void
  onOpenLightbox: (asset: MediaAsset) => void
  isLogo: boolean
}) {
  const cfg = TYPE_CONFIG[asset.asset_type || 'document'] || TYPE_CONFIG.document
  const Icon = cfg.icon
  const visual = isVisualAsset(asset.asset_type)

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        selected && 'ring-2 ring-primary border-primary'
      )}
      onClick={() => visual ? onOpenLightbox(asset) : onOpenDetail(asset)}
    >
      {/* Checkbox */}
      <div
        className="absolute top-2 left-2 z-20"
        onClick={(e) => { e.stopPropagation(); onSelect(asset.id) }}
      >
        <div className={cn(
          'h-5 w-5 rounded border-2 bg-background/80 backdrop-blur-sm transition-all flex items-center justify-center',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40 opacity-0 group-hover:opacity-100'
        )}>
          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>

      {/* Logo badge */}
      {isLogo && (
        <div className="absolute top-2 right-2 z-20">
          <Badge className="bg-yellow-500 text-yellow-950 text-[10px] px-1.5 py-0.5 gap-1">
            <Star className="h-2.5 w-2.5" /> Logo
          </Badge>
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-square bg-muted/50 relative overflow-hidden">
        {visual && asset.file_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.file_url}
            alt={asset.alt_text || asset.file_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : asset.asset_type === 'video' ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <VideoIcon className={cn('h-10 w-10', cfg.color)} />
            <span className="text-xs text-muted-foreground">Video</span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Icon className={cn('h-10 w-10', cfg.color)} />
            <span className="text-xs text-muted-foreground">{cfg.label}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(asset) }}
            className="rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/40 transition-colors"
            title="Details"
          >
            <Info className="h-4 w-4 text-white" />
          </button>
          {asset.file_url && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(asset.file_url)
                toast.success('URL copied!')
              }}
              className="rounded-full bg-white/20 backdrop-blur-sm p-2 hover:bg-white/40 transition-colors"
              title="Copy URL"
            >
              <Copy className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2.5">
        <p className="text-xs font-medium truncate">{asset.file_name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
          </span>
          {asset.file_size && (
            <span className="text-[10px] text-muted-foreground">{formatBytes(asset.file_size)}</span>
          )}
        </div>
        {asset.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {asset.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
            ))}
            {asset.tags.length > 2 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{asset.tags.length - 2}</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Asset Row (list view) ──────────────────────────────────────────────────────
function AssetRow({
  asset,
  selected,
  onSelect,
  onOpenDetail,
  isLogo,
}: {
  asset: MediaAsset
  selected: boolean
  onSelect: (id: string) => void
  onOpenDetail: (asset: MediaAsset) => void
  isLogo: boolean
}) {
  const cfg = TYPE_CONFIG[asset.asset_type || 'document'] || TYPE_CONFIG.document
  const Icon = cfg.icon
  const visual = isVisualAsset(asset.asset_type)
  const [copied, setCopied] = useState(false)

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
        selected && 'ring-2 ring-primary bg-primary/5'
      )}
      onClick={() => onOpenDetail(asset)}
    >
      {/* Checkbox */}
      <div onClick={(e) => { e.stopPropagation(); onSelect(asset.id) }}>
        <div className={cn(
          'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        )}>
          {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </div>
      </div>

      {/* Thumbnail / Icon */}
      <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {visual && asset.file_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.file_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Icon className={cn('h-5 w-5', cfg.color)} />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{asset.file_name}</p>
          {isLogo && <Badge className="bg-yellow-500 text-yellow-950 text-[10px] px-1.5 py-0 shrink-0"><Star className="h-2.5 w-2.5 mr-0.5" />Logo</Badge>}
        </div>
        {asset.alt_text && <p className="text-xs text-muted-foreground truncate">{asset.alt_text}</p>}
      </div>

      {/* Type badge */}
      <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">{cfg.label}</Badge>

      {/* Size */}
      <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
        {asset.file_size ? formatBytes(asset.file_size) : '—'}
      </span>

      {/* Date */}
      <span className="text-xs text-muted-foreground shrink-0 hidden lg:block">
        {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {asset.file_url && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(asset.file_url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
              toast.success('URL copied!')
            }}
            className="rounded p-1.5 hover:bg-muted transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          onClick={() => onOpenDetail(asset)}
          className="rounded p-1.5 hover:bg-muted transition-colors"
          title="Details"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function DetailDrawer({
  asset,
  clientId,
  isLogo,
  onClose,
  onUpdated,
  onDeleted,
  onSetAsLogo,
}: {
  asset: MediaAsset | null
  clientId: string
  isLogo: boolean
  onClose: () => void
  onUpdated: (patch: Partial<MediaAsset>) => void
  onDeleted: (id: string) => void
  onSetAsLogo: (id: string, url: string) => void
}) {
  const [altText, setAltText]     = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (asset) {
      setAltText(asset.alt_text || '')
      setTagsInput(asset.tags.join(', '))
      setConfirmDelete(false)
    }
  }, [asset])

  if (!asset) return null

  const cfg = TYPE_CONFIG[asset.asset_type || 'document'] || TYPE_CONFIG.document
  const Icon = cfg.icon
  const visual = isVisualAsset(asset.asset_type)
  const srcCfg = SOURCE_CONFIG[asset.source || 'upload'] || SOURCE_CONFIG.upload
  const SrcIcon = srcCfg.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch('/api/media/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id, clientId, altText, tags }),
      })
      if (!res.ok) throw new Error('Save failed')
      onUpdated({ alt_text: altText || null, tags })
      toast.success('Asset updated')
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleSetAsLogo = async () => {
    try {
      const res = await fetch('/api/media/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id, clientId, setAsLogo: true }),
      })
      if (!res.ok) throw new Error('Failed')
      onSetAsLogo(asset.id, asset.file_url)
      toast.success('Set as client logo!')
    } catch {
      toast.error('Failed to set as logo')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch('/api/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.id, clientId }),
      })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted(asset.id)
      onClose()
      toast.success('Asset deleted')
    } catch {
      toast.error('Failed to delete asset')
    } finally {
      setDeleting(false)
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(asset.file_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copied!')
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-background border-l shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Asset Details</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Preview */}
        <div className="rounded-lg overflow-hidden bg-muted/50 border">
          {visual && asset.file_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.file_url} alt={asset.alt_text || asset.file_name} className="w-full object-contain max-h-48" />
          ) : asset.asset_type === 'video' && asset.file_url ? (
            <video src={asset.file_url} className="w-full max-h-48" controls muted />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Icon className={cn('h-12 w-12', cfg.color)} />
              <span className="text-sm text-muted-foreground">{cfg.label}</span>
            </div>
          )}
        </div>

        {/* Filename + type */}
        <div>
          <p className="font-medium text-sm break-all">{asset.file_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <SrcIcon className="h-3 w-3" />{srcCfg.label}
            </span>
            {isLogo && <Badge className="bg-yellow-500 text-yellow-950 text-xs"><Star className="h-3 w-3 mr-1" />Client Logo</Badge>}
          </div>
        </div>

        {/* File info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {asset.file_size && (
            <div className="rounded bg-muted p-2">
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatBytes(asset.file_size)}</p>
            </div>
          )}
          {asset.mime_type && (
            <div className="rounded bg-muted p-2">
              <p className="text-muted-foreground">Format</p>
              <p className="font-medium truncate">{asset.mime_type.split('/')[1]?.toUpperCase() || asset.mime_type}</p>
            </div>
          )}
          <div className="rounded bg-muted p-2 col-span-2">
            <p className="text-muted-foreground">Uploaded</p>
            <p className="font-medium">{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</p>
          </div>
        </div>

        {/* AI prompt */}
        {asset.ai_prompt && (
          <div className="space-y-1">
            <Label className="text-xs">AI Generation Prompt</Label>
            <div className="rounded bg-muted p-2 text-xs text-muted-foreground">{asset.ai_prompt}</div>
          </div>
        )}

        {/* Edit: alt text */}
        <div className="space-y-1.5">
          <Label className="text-xs">Alt Text</Label>
          <Textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe this image for accessibility and SEO..."
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        {/* Edit: tags */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="logo, brand, hero..."
            className="text-sm h-8"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-4 space-y-2">
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
          <a href={asset.file_url} download={asset.file_name} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-3.5 w-3.5 mr-1" /> Download
            </Button>
          </a>
        </div>

        {isVisualAsset(asset.asset_type) && !isLogo && (
          <Button variant="outline" size="sm" className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50" onClick={handleSetAsLogo}>
            <Star className="h-3.5 w-3.5 mr-1" /> Set as Client Logo
          </Button>
        )}

        <Button
          variant={confirmDelete ? 'destructive' : 'ghost'}
          size="sm"
          className="w-full"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
          {confirmDelete ? 'Confirm Delete' : 'Delete Asset'}
        </Button>
        {confirmDelete && (
          <button onClick={() => setConfirmDelete(false)} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Media Library ─────────────────────────────────────────────────────────
export function MediaLibrary({ initialAssets, clientId, clientLogoUrl }: MediaLibraryProps) {
  const [assets, setAssets]           = useState<MediaAsset[]>(initialAssets)
  const [uploading, setUploading]     = useState<UploadingFile[]>([])
  const [view, setView]               = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('mediaView') as 'grid' | 'list') || 'grid'
    return 'grid'
  })
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailAsset, setDetailAsset] = useState<MediaAsset | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [logoAssetId, setLogoAssetId] = useState<string | null>(null)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [showGeneratePanel, setShowGeneratePanel] = useState(false)
  const [uploadIsLogo, setUploadIsLogo] = useState(false)
  const [uploadAltText, setUploadAltText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Find current logo asset
  useEffect(() => {
    if (clientLogoUrl) {
      const logoAsset = assets.find((a) => a.file_url === clientLogoUrl)
      if (logoAsset) setLogoAssetId(logoAsset.id)
    }
  }, [assets, clientLogoUrl])

  const setViewPersisted = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem('mediaView', v)
  }

  // ── Filtering ──
  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false
      if (sourceFilter !== 'all' && a.source !== sourceFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.file_name.toLowerCase().includes(q) &&
            !a.alt_text?.toLowerCase().includes(q) &&
            !a.tags.some((t) => t.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [assets, typeFilter, sourceFilter, search])

  // Visual assets for lightbox
  const lightboxSlides = useMemo(() =>
    filtered
      .filter((a) => isVisualAsset(a.asset_type) && a.file_url)
      .map((a) => ({ src: a.file_url, alt: a.alt_text || a.file_name, title: a.file_name })),
    [filtered]
  )

  const openLightbox = (asset: MediaAsset) => {
    const idx = lightboxSlides.findIndex((s) => s.src === asset.file_url)
    if (idx >= 0) setLightboxIndex(idx)
  }

  // ── Selection ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = () => setSelectedIds(new Set(filtered.map((a) => a.id)))
  const clearSelection = () => setSelectedIds(new Set())

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds)
    await Promise.all(ids.map((id) =>
      fetch('/api/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, clientId }),
      })
    ))
    setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)))
    clearSelection()
    toast.success(`${ids.length} asset${ids.length > 1 ? 's' : ''} deleted`)
  }

  // ── Upload ──
  const uploadFiles = useCallback(async (files: File[]) => {
    const newUploading: UploadingFile[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      progress: 0,
      status: 'uploading' as const,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))
    setUploading((prev) => [...prev, ...newUploading])
    setShowUploadPanel(false)

    await Promise.all(newUploading.map(async (item) => {
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('clientId', clientId)
        fd.append('isLogo', uploadIsLogo.toString())
        if (uploadAltText) fd.append('altText', uploadAltText)

        // Simulate progress (XHR would give real progress; fetch doesn't)
        const progressInterval = setInterval(() => {
          setUploading((prev) =>
            prev.map((u) => u.id === item.id && u.progress < 85
              ? { ...u, progress: u.progress + 15 }
              : u
            )
          )
        }, 300)

        const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
        clearInterval(progressInterval)

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        const { asset } = await res.json()
        setUploading((prev) => prev.map((u) => u.id === item.id ? { ...u, progress: 100, status: 'done' } : u))
        setAssets((prev) => [asset, ...prev])
        if (uploadIsLogo) setLogoAssetId(asset.id)

      } catch (err) {
        setUploading((prev) => prev.map((u) =>
          u.id === item.id
            ? { ...u, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
            : u
        ))
      }
    }))

    // Clean up done uploads after 2s
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.status !== 'done'))
    }, 2000)
    setUploadAltText('')
    setUploadIsLogo(false)
  }, [clientId, uploadIsLogo, uploadAltText])

  const { getRootProps, getInputProps, isDragActive, open: openDropzone } = useDropzone({
    onDrop: uploadFiles,
    accept: ACCEPT_ALL,
    noClick: true, // we control click ourselves
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  // ── Asset updates ──
  const handleUpdated = (id: string, patch: Partial<MediaAsset>) => {
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a))
    if (detailAsset?.id === id) setDetailAsset((prev) => prev ? { ...prev, ...patch } : prev)
  }

  const handleDeleted = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSetAsLogo = (id: string, url: string) => {
    setLogoAssetId(id)
    void url
  }

  // ── Type counts ──
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of assets) {
      const t = a.asset_type || 'document'
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [assets])

  const sourceTypes = useMemo(() => {
    const s = new Set(assets.map((a) => a.source || 'upload'))
    return Array.from(s)
  }, [assets])

  return (
    <div {...getRootProps()} className="relative min-h-screen">
      <input {...getInputProps()} />

      {/* Full-page drag overlay */}
      {isDragActive && (
        <div className="fixed inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload className="mx-auto h-16 w-16 text-primary mb-4" />
            <p className="text-2xl font-bold text-primary">Drop files to upload</p>
            <p className="text-muted-foreground mt-1">Images, videos, PDFs, and more</p>
          </div>
        </div>
      )}

      <div className="space-y-4">

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, alt text, or tag..."
              className="pl-8 h-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                typeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
            >
              All ({assets.length})
            </button>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const count = typeCounts[key] || 0
              if (count === 0) return null
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                  className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    typeFilter === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Source filter */}
          {sourceTypes.length > 1 && (
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-background"
              >
                <option value="all">All Sources</option>
                {sourceTypes.map((s) => (
                  <option key={s} value={s}>{SOURCE_CONFIG[s]?.label || s}</option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-muted-foreground -ml-5 pointer-events-none" />
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
            <button
              onClick={() => setViewPersisted('grid')}
              className={cn('rounded p-1.5 transition-colors', view === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewPersisted('list')}
              className={cn('rounded p-1.5 transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowGeneratePanel(!showGeneratePanel); setShowUploadPanel(false) }}
            >
              <Wand2 className="h-4 w-4 mr-2" /> AI Generate
            </Button>
            <Button onClick={() => { setShowUploadPanel(!showUploadPanel); setShowGeneratePanel(false) }} size="sm">
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </div>

        {/* ── AI Generate panel ── */}
        {showGeneratePanel && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">AI Image Generator</p>
              </div>
              <button onClick={() => setShowGeneratePanel(false)}><X className="h-4 w-4" /></button>
            </div>
            <ImageGeneratorPanel
              clientId={clientId}
              onImageSaved={(asset) => {
                if (asset && 'id' in asset && asset.id) {
                  setAssets((prev) => [asset as MediaAsset, ...prev])
                }
                setShowGeneratePanel(false)
              }}
              compact
            />
          </div>
        )}

        {/* ── Upload panel ── */}
        {showUploadPanel && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Upload Files</p>
              <button onClick={() => setShowUploadPanel(false)}><X className="h-4 w-4" /></button>
            </div>

            {/* Drop zone */}
            <div
              onClick={openDropzone}
              className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center cursor-pointer hover:border-primary/70 hover:bg-primary/10 transition-colors"
            >
              <ImagePlus className="mx-auto h-10 w-10 text-primary/60 mb-2" />
              <p className="text-sm font-medium">Click to browse or drag & drop files here</p>
              <p className="text-xs text-muted-foreground mt-1">Images, videos, PDFs, documents — up to 100MB each</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Alt Text (optional)</Label>
                <Input
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="Describe the image..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={uploadIsLogo}
                    onChange={(e) => setUploadIsLogo(e.target.checked)}
                    className="rounded"
                  />
                  <Star className="h-4 w-4 text-yellow-500" />
                  Set as client logo
                </label>
              </div>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" multiple onChange={(e) => {
              if (e.target.files) uploadFiles(Array.from(e.target.files))
            }} />
          </div>
        )}

        {/* ── Bulk action bar ── */}
        {selectedIds.size > 0 && (
          <div className="sticky top-4 z-30 flex items-center gap-3 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 shadow-lg">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <button onClick={selectAll} className="text-xs underline opacity-80 hover:opacity-100">Select all {filtered.length}</button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={bulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete {selectedIds.size}
              </Button>
              <button onClick={clearSelection} className="rounded p-1 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Grid / List ── */}
        {filtered.length === 0 && uploading.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-16 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium mb-1">
              {assets.length === 0 ? 'No assets yet' : 'No assets match your filters'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {assets.length === 0
                ? 'Upload your first file or ask Vibe Chat to generate images'
                : 'Try clearing your filters'}
            </p>
            {assets.length === 0 && (
              <Button onClick={() => setShowUploadPanel(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Upload Files
              </Button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {uploading.map((u) => <UploadCard key={u.id} item={u} />)}
            {filtered.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onSelect={toggleSelect}
                onOpenDetail={setDetailAsset}
                onOpenLightbox={openLightbox}
                isLogo={asset.id === logoAssetId}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {uploading.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm truncate">{u.file.name}</span>
                <div className="ml-auto w-24 h-1.5 rounded-full bg-muted">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${u.progress}%` }} />
                </div>
              </div>
            ))}
            {filtered.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onSelect={toggleSelect}
                onOpenDetail={setDetailAsset}
                isLogo={asset.id === logoAssetId}
              />
            ))}
          </div>
        )}

        {/* ── Results count ── */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filtered.length} of {assets.length} asset{assets.length !== 1 ? 's' : ''}
            {selectedIds.size > 0 ? ` — ${selectedIds.size} selected` : ''}
          </p>
        )}
      </div>

      {/* ── Lightbox ── */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Zoom, Captions, Video]}
        captions={{ showToggle: true }}
        zoom={{ maxZoomPixelRatio: 4 }}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.92)' } }}
      />

      {/* ── Detail drawer ── */}
      {detailAsset && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setDetailAsset(null)}
          />
          <DetailDrawer
            asset={detailAsset}
            clientId={clientId}
            isLogo={detailAsset.id === logoAssetId}
            onClose={() => setDetailAsset(null)}
            onUpdated={(patch) => handleUpdated(detailAsset.id, patch)}
            onDeleted={handleDeleted}
            onSetAsLogo={handleSetAsLogo}
          />
        </>
      )}
    </div>
  )
}
