import { Badge } from '@/components/ui/badge'
import {
  Sparkles, Camera, Type, Palette, Zap, Film,
  Scissors, ArrowUpCircle, Image as ImageIcon,
} from 'lucide-react'

// ── Model data ────────────────────────────────────────────────────────────────
interface ModelInfo {
  name: string
  description: string
  useCases: string[]
  speed: 1 | 2 | 3
  quality: 1 | 2 | 3 | 4 | 5
  defaultFor?: string
}

interface ModelGroup {
  title: string
  description: string
  icon: React.ElementType
  models: ModelInfo[]
}

const MODEL_GROUPS: ModelGroup[] = [
  {
    title: 'Image Generation',
    description: 'Text-to-image models for creating product photos, social graphics, and marketing visuals',
    icon: ImageIcon,
    models: [
      {
        name: 'Flux-2 Pro',
        description: 'Photorealistic image generation with excellent consistency. Best for clean product shots, hero images, and editorial photography.',
        useCases: ['Product photos', 'Hero images', 'Blog headers', 'Editorial'],
        speed: 2,
        quality: 5,
        defaultFor: 'General, Product Photo, Blog Header',
      },
      {
        name: 'Nano Banana 2',
        description: 'Fast lifestyle and UGC-style image generation. Produces natural-looking, authentic imagery perfect for ads and social content.',
        useCases: ['Ad creative', 'UGC-style shots', 'Lifestyle photos', 'Quick drafts'],
        speed: 3,
        quality: 4,
        defaultFor: 'Ad Creative',
      },
      {
        name: 'GPT Image 1.5',
        description: 'The best model for text-on-image accuracy. When your graphic needs headlines, labels, or data — this model renders text correctly.',
        useCases: ['Social graphics', 'Quote cards', 'Infographics', 'Carousel slides'],
        speed: 2,
        quality: 5,
        defaultFor: 'Social Graphics',
      },
      {
        name: 'Seedream 4.5',
        description: 'Specialised in fashion, beauty, and skin-forward content. Exceptional detail rendering for lifestyle and beauty campaigns.',
        useCases: ['Fashion content', 'Beauty campaigns', 'Skin-forward lifestyle'],
        speed: 2,
        quality: 5,
      },
      {
        name: 'Flux-2 Flex',
        description: 'A faster, more affordable version of Flux-2 Pro. Use for draft iterations and variant testing before committing to final production.',
        useCases: ['Quick drafts', 'Variant testing', 'Concept exploration'],
        speed: 3,
        quality: 4,
      },
      {
        name: 'Nano Banana Pro',
        description: 'Premium image generation for when you need the highest possible quality. Best-in-class detail and photorealism.',
        useCases: ['Premium product shots', 'High-end campaigns', 'Print-ready assets'],
        speed: 1,
        quality: 5,
      },
    ],
  },
  {
    title: 'Logos & Vectors',
    description: 'Specialised models for brand marks, icons, and scalable vector graphics',
    icon: Palette,
    models: [
      {
        name: 'Recraft V4',
        description: 'Purpose-built for logos, brand marks, and icon design. Produces clean, scalable graphics suitable for brand identity work.',
        useCases: ['Logos', 'Brand marks', 'Icons', 'Monograms'],
        speed: 2,
        quality: 5,
        defaultFor: 'Logo',
      },
      {
        name: 'Recraft V4 SVG',
        description: 'Generates production-ready SVG vector files. Perfect when you need scalable vector output for print or web.',
        useCases: ['SVG logos', 'Vector icons', 'Scalable graphics'],
        speed: 2,
        quality: 5,
      },
    ],
  },
  {
    title: 'Image Editing',
    description: 'Transform existing images — new backgrounds, style transfers, and targeted edits',
    icon: Scissors,
    models: [
      {
        name: 'Flux-2 Pro (Image-to-Image)',
        description: 'Transform existing product photos into new scenes and backgrounds. Maintains product accuracy while changing context.',
        useCases: ['Background swaps', 'Scene changes', 'Style transfer'],
        speed: 2,
        quality: 5,
      },
      {
        name: 'Nano Banana Pro (Edit)',
        description: 'Semantic image editing with strong understanding of instructions. Best for conceptual changes to existing images.',
        useCases: ['Conceptual edits', 'Style changes', 'Creative remixing'],
        speed: 2,
        quality: 5,
      },
      {
        name: 'FLUX Kontext',
        description: 'Precise object-level editing. Best when you need specific elements changed without affecting the rest of the image.',
        useCases: ['Object replacement', 'Targeted edits', 'Detail changes'],
        speed: 2,
        quality: 4,
      },
    ],
  },
  {
    title: 'Video Generation',
    description: 'Create motion content for ads, social media, and product reveals',
    icon: Film,
    models: [
      {
        name: 'Kling 2.6',
        description: 'High-quality video generation for polished brand content. Supports both text-to-video and image-to-video workflows.',
        useCases: ['Product reveals', 'Brand videos', 'Animated product photos'],
        speed: 1,
        quality: 5,
      },
      {
        name: 'ByteDance V1 Pro',
        description: 'Naturalistic motion generation. Produces organic-feeling footage perfect for UGC-style and testimonial content.',
        useCases: ['UGC-style videos', 'Lifestyle motion', 'Organic content'],
        speed: 2,
        quality: 4,
      },
      {
        name: 'Wan 2.6',
        description: 'Motion graphic and abstract style video generation. Good for explainer content and concept visualisation.',
        useCases: ['Motion graphics', 'Explainers', 'Abstract concepts'],
        speed: 2,
        quality: 4,
      },
    ],
  },
  {
    title: 'Post-Production',
    description: 'Finishing tools for production-ready assets',
    icon: ArrowUpCircle,
    models: [
      {
        name: 'Background Removal',
        description: 'Clean background removal for e-commerce product shots. Produces transparent or white backgrounds ready for Shopify/Amazon.',
        useCases: ['E-commerce clean cuts', 'Product on white', 'Transparent backgrounds'],
        speed: 3,
        quality: 5,
      },
      {
        name: 'Topaz Image Upscale',
        description: 'AI upscaling to print and large-format ad resolution. Takes 1K/2K images to 4K+ quality.',
        useCases: ['Print-ready upscaling', 'Large-format ads', 'High-res production'],
        speed: 2,
        quality: 5,
      },
    ],
  },
]

function SpeedDots({ speed }: { speed: number }) {
  return (
    <div className="flex items-center gap-0.5" title={speed === 3 ? 'Fast' : speed === 2 ? 'Medium' : 'Slow'}>
      <Zap className="h-3 w-3 text-muted-foreground mr-0.5" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= speed ? 'bg-yellow-500' : 'bg-muted-foreground/20'}`}
        />
      ))}
    </div>
  )
}

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Quality: ${quality}/5`}>
      <Sparkles className="h-3 w-3 text-muted-foreground mr-0.5" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= quality ? 'bg-purple-500' : 'bg-muted-foreground/20'}`}
        />
      ))}
    </div>
  )
}

export default function ModelsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          AI Models
        </h1>
        <p className="text-muted-foreground mt-1">
          All available AI models for image generation, video creation, and post-production.
          Models are automatically selected based on use case — or pick manually in the image generator.
        </p>
      </div>

      {/* Model groups */}
      {MODEL_GROUPS.map((group) => {
        const Icon = group.icon
        return (
          <div key={group.title} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.models.map((model) => (
                <div
                  key={model.name}
                  className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow"
                >
                  {/* Model name + default badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{model.name}</h3>
                    {model.defaultFor && (
                      <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 shrink-0">
                        Default
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">{model.description}</p>

                  {/* Default for info */}
                  {model.defaultFor && (
                    <p className="text-[10px] text-primary font-medium">
                      Default for: {model.defaultFor}
                    </p>
                  )}

                  {/* Use cases */}
                  <div className="flex flex-wrap gap-1">
                    {model.useCases.map((uc) => (
                      <Badge key={uc} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {uc}
                      </Badge>
                    ))}
                  </div>

                  {/* Speed & Quality */}
                  <div className="flex items-center gap-4 pt-1">
                    <SpeedDots speed={model.speed} />
                    <QualityDots quality={model.quality} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Footer note */}
      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How models are selected</p>
        <p>When you generate images through the AI chat or the Media Library, the system automatically picks the best model for your use case. You can override this in the image generator&apos;s model picker.</p>
        <p>Video models are used through the Vibe Chat when you request video content for a client.</p>
      </div>
    </div>
  )
}
