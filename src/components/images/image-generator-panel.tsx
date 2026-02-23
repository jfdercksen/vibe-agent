'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Wand2, Search, X, Check, Download, Copy, Loader2, ChevronDown,
  Image as ImageIcon, Sparkles, Camera, AlertCircle, ExternalLink,
  Import,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { MediaAsset } from '@/lib/types/database'

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = 'generate' | 'edit' | 'unsplash'
type UseCase = 'product_photo' | 'social_graphic' | 'logo' | 'blog_header' | 'ad_creative' | 'general'

interface GeneratedImage {
  id?: string
  file_url: string
  alt_text?: string
}

interface UnsplashPhoto {
  id: string
  description: string
  urls: { thumb: string; small: string; regular: string }
  photographer: string
  photographerUrl: string
  unsplashUrl: string
  downloadLocation: string
  width: number
  height: number
}

interface ImageGeneratorPanelProps {
  clientId: string
  onImageSaved?: (asset: MediaAsset | GeneratedImage) => void
  referenceTable?: string
  referenceId?: string
  defaultPrompt?: string
  defaultUseCase?: UseCase
  compact?: boolean  // Smaller variant for inline use in content pages
}

// ── Use case config ────────────────────────────────────────────────────────────
const USE_CASES: Array<{ value: UseCase; label: string; description: string; icon: string }> = [
  { value: 'general',        label: 'General',        description: 'Fast, versatile',          icon: '⚡' },
  { value: 'product_photo',  label: 'Product Photo',  description: 'Photorealistic shots',     icon: '📸' },
  { value: 'social_graphic', label: 'Social Graphic', description: 'Text & graphics',          icon: '📱' },
  { value: 'blog_header',    label: 'Blog Header',    description: 'Wide editorial images',    icon: '📰' },
  { value: 'ad_creative',    label: 'Ad Creative',    description: 'Premium ad imagery',       icon: '🎯' },
  { value: 'logo',           label: 'Logo/Icon',      description: 'Brand marks & icons',      icon: '✨' },
]

// Which use cases use Nano Banana Pro (Google Gemini 3 Pro) — show badge
const NANO_BANANA_CASES: Set<UseCase> = new Set(['general', 'product_photo', 'blog_header', 'ad_creative'])

// Default model per use case
const DEFAULT_MODEL: Record<UseCase, string> = {
  general:        'fal-ai/nano-banana-pro',
  product_photo:  'fal-ai/nano-banana-pro',
  social_graphic: 'ideogram-ai/ideogram-v3-turbo',
  blog_header:    'fal-ai/nano-banana-pro',
  ad_creative:    'fal-ai/nano-banana-pro',
  logo:           'recraft-ai/recraft-v4',
}

const MODEL_LABELS: Record<UseCase, string> = {
  general:        'Nano Banana Pro',
  product_photo:  'Nano Banana Pro',
  social_graphic: 'Ideogram V3 Turbo',
  blog_header:    'Nano Banana Pro',
  ad_creative:    'Nano Banana Pro',
  logo:           'Recraft V4',
}

const MODEL_DESCRIPTIONS: Record<UseCase, string> = {
  general:        'Google Gemini 3 Pro Image — highest quality, best all-round',
  product_photo:  'Google Gemini 3 Pro Image — photorealistic studio shots',
  social_graphic: 'Ideogram V3 Turbo — best for text-on-image & social graphics',
  blog_header:    'Google Gemini 3 Pro Image — wide editorial imagery (16:9)',
  ad_creative:    'Google Gemini 3 Pro Image — premium portrait ad creative (4:5)',
  logo:           'Recraft V4 — logos, brand marks & scalable vectors',
}

// Alternative models per use case for model picker
const ALTERNATIVE_MODELS: Record<UseCase, Array<{ id: string; label: string; provider: string }>> = {
  general: [
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro ⭐',  provider: 'fal.ai' },
    { id: 'google/imagen-4-ultra',             label: 'Imagen 4 Ultra',      provider: 'Replicate' },
    { id: 'google/imagen-4',                   label: 'Imagen 4',            provider: 'Replicate' },
    { id: 'black-forest-labs/flux-2-pro',      label: 'FLUX 2 Pro',          provider: 'Replicate' },
  ],
  product_photo: [
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro ⭐',  provider: 'fal.ai' },
    { id: 'google/imagen-4-ultra',             label: 'Imagen 4 Ultra',      provider: 'Replicate' },
    { id: 'black-forest-labs/flux-2-pro',      label: 'FLUX 2 Pro',          provider: 'Replicate' },
  ],
  social_graphic: [
    { id: 'ideogram-ai/ideogram-v3-turbo',    label: 'Ideogram V3 Turbo ⭐', provider: 'Replicate' },
    { id: 'ideogram-ai/ideogram-v3-quality',  label: 'Ideogram V3 Quality', provider: 'Replicate' },
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro',     provider: 'fal.ai' },
  ],
  logo: [
    { id: 'recraft-ai/recraft-v4',            label: 'Recraft V4 ⭐',       provider: 'Replicate' },
    { id: 'recraft-ai/recraft-v4-svg',        label: 'Recraft V4 SVG',      provider: 'Replicate' },
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro',     provider: 'fal.ai' },
  ],
  blog_header: [
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro ⭐',  provider: 'fal.ai' },
    { id: 'google/imagen-4',                   label: 'Imagen 4',            provider: 'Replicate' },
    { id: 'black-forest-labs/flux-2-pro',      label: 'FLUX 2 Pro',          provider: 'Replicate' },
  ],
  ad_creative: [
    { id: 'fal-ai/nano-banana-pro',           label: 'Nano Banana Pro ⭐',  provider: 'fal.ai' },
    { id: 'google/imagen-4-ultra',             label: 'Imagen 4 Ultra',      provider: 'Replicate' },
    { id: 'black-forest-labs/flux-2-pro',      label: 'FLUX 2 Pro',          provider: 'Replicate' },
  ],
}

// ── Quick prompt suggestions ───────────────────────────────────────────────────
const PROMPT_SUGGESTIONS: Record<UseCase, string[]> = {
  general: [
    'A vibrant abstract background with gradient colors',
    'Minimalist flat design with clean lines',
  ],
  product_photo: [
    'Professional product shot on white background, studio lighting, sharp focus',
    'Lifestyle product photography, natural light, wooden surface, shallow depth of field',
  ],
  social_graphic: [
    'Bold typography announcement graphic, modern design, high contrast',
    'Instagram quote card with elegant script font and soft pastel background',
  ],
  blog_header: [
    'Wide editorial photograph, cinematic lighting, moody atmosphere',
    'Clean conceptual image representing technology and innovation',
  ],
  ad_creative: [
    'Premium lifestyle advertisement, aspirational mood, luxury aesthetic',
    'Bold product advertisement with dramatic lighting and vibrant colors',
  ],
  logo: [
    'Minimalist logo mark, geometric shapes, professional, scalable vector style',
    'Modern monogram lettermark, clean lines, sophisticated brand identity',
  ],
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ImageGeneratorPanel({
  clientId,
  onImageSaved,
  referenceTable,
  referenceId,
  defaultPrompt = '',
  defaultUseCase = 'general',
  compact = false,
}: ImageGeneratorPanelProps) {
  const [tab, setTab]                 = useState<Tab>('generate')
  const [prompt, setPrompt]           = useState(defaultPrompt)
  const [negPrompt, setNegPrompt]     = useState('blurry, low quality, distorted, watermark, ugly, deformed')
  const [useCase, setUseCase]         = useState<UseCase>(defaultUseCase)
  const [modelOverride, setModelOverride] = useState<string>('')  // empty = use default
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [numImages, setNumImages]     = useState(2)
  const [resolution, setResolution]   = useState<'1K' | '2K' | '4K'>('1K')
  const [generating, setGenerating]   = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // Edit mode state
  const [editImageUrl, setEditImageUrl]     = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [editModel, setEditModel]           = useState<'nano_banana' | 'flux_kontext'>('nano_banana')
  const [editNumImages, setEditNumImages]   = useState(2)
  const [editResolution, setEditResolution] = useState<'1K' | '2K' | '4K'>('1K')
  const [editing, setEditing]               = useState(false)
  const [editedImages, setEditedImages]     = useState<GeneratedImage[]>([])
  const [editError, setEditError]           = useState<string | null>(null)

  // Unsplash state
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashOrientation, setUnsplashOrientation] = useState('')
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPhoto[]>([])
  const [unsplashTotal, setUnsplashTotal] = useState(0)
  const [searching, setSearching]     = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl]     = useState<string | null>(null)

  // ── AI Generation ────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    setGenerating(true)
    setError(null)
    setGeneratedImages([])
    setSelectedImage(null)

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          useCase,
          model: modelOverride || undefined,
          negativePrompt: negPrompt,
          numImages,
          resolution,
          clientId,
          saveToLibrary: true,
          referenceTable,
          referenceId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setGeneratedImages(data.images || [])
      toast.success(`Generated ${data.count} image${data.count > 1 ? 's' : ''} with ${data.modelLabel}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }, [prompt, useCase, negPrompt, numImages, clientId, referenceTable, referenceId])

  const handleSelectImage = (img: GeneratedImage) => {
    setSelectedImage(img)
    onImageSaved?.(img)
    toast.success('Image selected!')
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    toast.success('URL copied!')
  }

  // ── Image Edit ──────────────────────────────────────────────────────────────
  const handleEdit = useCallback(async () => {
    if (!editImageUrl.trim()) { toast.error('Enter the image URL to edit'); return }
    if (!editInstruction.trim()) { toast.error('Enter an edit instruction'); return }

    setEditing(true)
    setEditError(null)
    setEditedImages([])

    try {
      const res = await fetch('/api/images/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: editImageUrl.trim(),
          instruction: editInstruction.trim(),
          editModel,
          resolution: editResolution,
          numImages: editNumImages,
          clientId,
          saveToLibrary: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Edit failed')

      setEditedImages(data.images || [])
      toast.success(`Edited with ${data.modelLabel} — ${data.count} variation${data.count > 1 ? 's' : ''}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Edit failed'
      setEditError(msg)
      toast.error(msg)
    } finally {
      setEditing(false)
    }
  }, [editImageUrl, editInstruction, editModel, editResolution, editNumImages, clientId])

  // ── Unsplash Search ──────────────────────────────────────────────────────────
  const handleUnsplashSearch = useCallback(async () => {
    if (!unsplashQuery.trim()) { toast.error('Enter a search query'); return }
    setSearching(true)
    setUnsplashPhotos([])

    try {
      const params = new URLSearchParams({
        q: unsplashQuery.trim(),
        per_page: '20',
        ...(unsplashOrientation ? { orientation: unsplashOrientation } : {}),
      })
      const res = await fetch(`/api/images/unsplash?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')

      setUnsplashPhotos(data.photos || [])
      setUnsplashTotal(data.total || 0)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed'
      toast.error(msg)
    } finally {
      setSearching(false)
    }
  }, [unsplashQuery, unsplashOrientation])

  const handleImportPhoto = useCallback(async (photo: UnsplashPhoto) => {
    setImportingId(photo.id)
    try {
      const res = await fetch('/api/images/unsplash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: photo.id,
          downloadLocation: photo.downloadLocation,
          regularUrl: photo.urls.regular,
          description: photo.description || `Photo by ${photo.photographer} on Unsplash`,
          clientId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      onImageSaved?.(data.asset)
      toast.success('Photo imported to Media Library!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      toast.error(msg)
    } finally {
      setImportingId(null)
    }
  }, [clientId, onImageSaved])

  return (
    <div className={cn('rounded-lg border bg-card', compact ? 'p-4' : 'p-5')}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setTab('generate')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            tab === 'generate' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Generate
        </button>
        <button
          onClick={() => setTab('edit')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            tab === 'edit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Edit Image
        </button>
        <button
          onClick={() => setTab('unsplash')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            tab === 'unsplash' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Camera className="h-3.5 w-3.5" />
          Unsplash
        </button>
      </div>

      {/* ── AI Generate Tab ── */}
      {tab === 'generate' && (
        <div className="space-y-4">
          {/* Use Case Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Image Type</Label>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.value}
                  onClick={() => setUseCase(uc.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    useCase === uc.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  )}
                  title={uc.description}
                >
                  <span>{uc.icon}</span>
                  {uc.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] text-muted-foreground">
                Model:{' '}
                <span className="font-medium text-foreground">
                  {modelOverride
                    ? ALTERNATIVE_MODELS[useCase].find(m => m.id === modelOverride)?.label || modelOverride.split('/').pop()
                    : MODEL_LABELS[useCase]
                  }
                </span>
                {(modelOverride === 'fal-ai/nano-banana-pro' || (!modelOverride && NANO_BANANA_CASES.has(useCase))) && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    ✦ Google Gemini 3 Pro
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="text-[11px] text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                {showModelPicker ? 'Hide' : 'Change model'}
              </button>
            </div>

            {/* Model picker dropdown */}
            {showModelPicker && (
              <div className="rounded-lg border bg-muted/30 p-2 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1.5">Available models for {USE_CASES.find(u => u.value === useCase)?.label}:</p>
                {ALTERNATIVE_MODELS[useCase].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setModelOverride(m.id === DEFAULT_MODEL[useCase] ? '' : m.id); setShowModelPicker(false) }}
                    className={cn(
                      'w-full flex items-center justify-between rounded px-2 py-1.5 text-xs transition-colors text-left',
                      (modelOverride === m.id || (!modelOverride && m.id === DEFAULT_MODEL[useCase]))
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span>{m.label}</span>
                    <span className="text-[10px] opacity-70">{m.provider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create in detail..."
              rows={compact ? 3 : 4}
              className="text-sm resize-none"
            />
            {/* Quick suggestions */}
            {!prompt && PROMPT_SUGGESTIONS[useCase] && (
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS[useCase].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(sug)}
                    className="text-[11px] rounded-full border px-2 py-0.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {sug.slice(0, 45)}...
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings row */}
          <div className="flex items-end gap-3 flex-wrap">
            {/* Negative prompt — only for non-Nano Banana models */}
            {!NANO_BANANA_CASES.has(useCase) && (
              <div className="flex-1 min-w-40 space-y-1.5">
                <Label className="text-xs font-medium">Negative Prompt <span className="text-muted-foreground">(what to avoid)</span></Label>
                <Input
                  value={negPrompt}
                  onChange={(e) => setNegPrompt(e.target.value)}
                  placeholder="blurry, watermark..."
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Resolution — Nano Banana only */}
            {NANO_BANANA_CASES.has(useCase) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resolution</Label>
                <div className="flex items-center gap-1">
                  {(['1K', '2K', '4K'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={cn(
                        'h-8 px-3 rounded text-xs font-medium border transition-colors',
                        resolution === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                      )}
                      title={r === '4K' ? 'Charged at 2× rate' : ''}
                    >
                      {r}{r === '4K' ? ' ×2' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Variations</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumImages(n)}
                    className={cn(
                      'h-8 w-8 rounded text-sm font-medium border transition-colors',
                      numImages === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with {MODEL_LABELS[useCase]}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {numImages} Image{numImages > 1 ? 's' : ''} with {MODEL_LABELS[useCase]}
              </>
            )}
          </Button>

          {/* Results Grid */}
          {generatedImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Generated Images — click to select</p>
                <Badge variant="secondary" className="text-[10px]">Saved to Media Library</Badge>
              </div>
              <div className={cn('grid gap-2', numImages === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                {generatedImages.map((img, i) => (
                  <div
                    key={i}
                    className={cn(
                      'group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                      selectedImage?.file_url === img.file_url
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-primary/50'
                    )}
                    onClick={() => handleSelectImage(img)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.file_url}
                      alt={img.alt_text || `Generated image ${i + 1}`}
                      className="w-full object-cover aspect-square"
                    />

                    {/* Selected indicator */}
                    {selectedImage?.file_url === img.file_url && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary p-0.5">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(img.file_url) }}
                        className="rounded bg-white/20 p-1.5 hover:bg-white/40 transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === img.file_url
                          ? <Check className="h-3 w-3 text-green-400" />
                          : <Copy className="h-3 w-3 text-white" />
                        }
                      </button>
                      <a
                        href={img.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded bg-white/20 p-1.5 hover:bg-white/40 transition-colors"
                        title="Download"
                      >
                        <Download className="h-3 w-3 text-white" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {selectedImage && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-2.5 text-xs">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-primary font-medium">Image selected and saved to Media Library</span>
                </div>
              )}
            </div>
          )}

          {/* Generating placeholder */}
          {generating && (
            <div className={cn('grid gap-2', numImages === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
              {Array.from({ length: numImages }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Wand2 className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs">Generating...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Image Tab ── */}
      {tab === 'edit' && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-3 text-xs text-purple-800">
            <p className="font-semibold mb-0.5">✦ AI Image Editing powered by Nano Banana Pro</p>
            <p className="text-purple-600">Describe what to change in plain English — background, colors, objects, style, lighting, anything.</p>
          </div>

          {/* Source image */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Image to Edit</Label>
            <Input
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
              placeholder="Paste image URL here (from Media Library or any public URL)..."
              className="text-sm h-9"
            />
            {editImageUrl && (
              <div className="rounded-lg overflow-hidden border max-h-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editImageUrl} alt="Source" className="w-full max-h-32 object-contain bg-muted" />
              </div>
            )}
          </div>

          {/* Edit instruction */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Edit Instruction</Label>
            <Textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder={`Examples:\n• "Change the background to a tropical beach"\n• "Make the jacket red instead of blue"\n• "Add soft studio lighting"\n• "Remove the person on the right"\n• "Make it look like a watercolor painting"`}
              rows={4}
              className="text-sm resize-none"
            />
          </div>

          {/* Edit settings */}
          <div className="flex items-end gap-3 flex-wrap">
            {/* Model selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Edit Engine</Label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditModel('nano_banana')}
                  className={cn(
                    'rounded border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    editModel === 'nano_banana' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  )}
                >
                  Nano Banana Pro ⭐
                </button>
                <button
                  onClick={() => setEditModel('flux_kontext')}
                  className={cn(
                    'rounded border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    editModel === 'flux_kontext' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  )}
                >
                  FLUX Kontext Pro
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {editModel === 'nano_banana'
                  ? 'Google Gemini 3 Pro — best semantic understanding'
                  : 'FLUX Kontext — best for precise style/object changes'}
              </p>
            </div>

            {/* Resolution — Nano Banana only */}
            {editModel === 'nano_banana' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resolution</Label>
                <div className="flex items-center gap-1">
                  {(['1K', '2K', '4K'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setEditResolution(r)}
                      className={cn(
                        'h-8 px-3 rounded text-xs font-medium border transition-colors',
                        editResolution === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                      )}
                    >
                      {r}{r === '4K' ? ' ×2' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variations */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Variations</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEditNumImages(n)}
                    className={cn(
                      'h-8 w-8 rounded text-sm font-medium border transition-colors',
                      editNumImages === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {editError && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {editError}
            </div>
          )}

          {/* Edit button */}
          <Button
            onClick={handleEdit}
            disabled={editing || !editImageUrl.trim() || !editInstruction.trim()}
            className="w-full"
          >
            {editing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Editing with {editModel === 'nano_banana' ? 'Nano Banana Pro' : 'FLUX Kontext'}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Edit Image — {editNumImages} Variation{editNumImages > 1 ? 's' : ''}
              </>
            )}
          </Button>

          {/* Edit results */}
          {editedImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Edited Results — click to select</p>
                <Badge variant="secondary" className="text-[10px]">Saved to Media Library</Badge>
              </div>
              <div className={cn('grid gap-2', editNumImages === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                {editedImages.map((img, i) => (
                  <div
                    key={i}
                    className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => { onImageSaved?.(img); toast.success('Image selected!') }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.file_url}
                      alt={`Edited ${i + 1}`}
                      className="w-full object-cover aspect-square"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(img.file_url) }}
                        className="rounded bg-white/20 p-1.5 hover:bg-white/40 transition-colors"
                      >
                        {copiedUrl === img.file_url ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-white" />}
                      </button>
                      <a href={img.file_url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="rounded bg-white/20 p-1.5 hover:bg-white/40 transition-colors">
                        <Download className="h-3 w-3 text-white" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editing placeholder */}
          {editing && (
            <div className={cn('grid gap-2', editNumImages === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
              {Array.from({ length: editNumImages }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs">Editing...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Unsplash Tab ── */}
      {tab === 'unsplash' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Search Unsplash</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnsplashSearch()}
                  placeholder="coffee, business, abstract blue..."
                  className="pl-8 h-9"
                />
              </div>
              <select
                value={unsplashOrientation}
                onChange={(e) => setUnsplashOrientation(e.target.value)}
                className="h-9 rounded-md border text-sm px-2 bg-background"
              >
                <option value="">Any</option>
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
                <option value="squarish">Square</option>
              </select>
              <Button onClick={handleUnsplashSearch} disabled={searching} size="sm" className="h-9 shrink-0">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Results */}
          {unsplashPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {unsplashTotal.toLocaleString()} photos found · showing {unsplashPhotos.length}
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-[480px] overflow-y-auto">
                {unsplashPhotos.map((photo) => (
                  <div key={photo.id} className="group relative rounded-lg overflow-hidden border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.urls.small}
                      alt={photo.description || 'Unsplash photo'}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs w-full"
                        onClick={() => handleImportPhoto(photo)}
                        disabled={importingId === photo.id}
                      >
                        {importingId === photo.id
                          ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          : <Import className="h-3 w-3 mr-1" />
                        }
                        {importingId === photo.id ? 'Saving...' : 'Save'}
                      </Button>
                      <a
                        href={photo.unsplashUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-white/70 hover:text-white flex items-center gap-0.5"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        View on Unsplash
                      </a>
                    </div>

                    {/* Photographer credit */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white/80 truncate">by {photo.photographer}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Photos by{' '}
                <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Unsplash
                </a>
              </p>
            </div>
          )}

          {unsplashPhotos.length === 0 && !searching && (
            <div className="rounded-lg border-2 border-dashed p-10 text-center">
              <Camera className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Search for free stock photos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Access millions of high-quality photos from Unsplash photographers
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Trigger button + dropdown used inline on content pages ─────────────────────
interface ImageGeneratorTriggerProps {
  clientId: string
  onImageSaved?: (asset: MediaAsset | GeneratedImage) => void
  referenceTable?: string
  referenceId?: string
  defaultUseCase?: UseCase
  defaultPrompt?: string
  label?: string
}

export function ImageGeneratorTrigger({
  clientId,
  onImageSaved,
  referenceTable,
  referenceId,
  defaultUseCase = 'general',
  defaultPrompt = '',
  label = 'Add Image',
}: ImageGeneratorTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <ImageIcon className="h-4 w-4" />
        {label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-[480px] shadow-xl rounded-lg border bg-background">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Image Generator</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <ImageGeneratorPanel
                clientId={clientId}
                onImageSaved={(asset) => {
                  onImageSaved?.(asset)
                  setOpen(false)
                }}
                referenceTable={referenceTable}
                referenceId={referenceId}
                defaultUseCase={defaultUseCase}
                defaultPrompt={defaultPrompt}
                compact
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
