import { cn } from '@/lib/utils'

const platformConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  linkedin: { label: 'LinkedIn', color: 'text-[#0077B5]', bgColor: 'bg-[#0077B5]/10' },
  twitter: { label: 'X / Twitter', color: 'text-[#1DA1F2]', bgColor: 'bg-[#1DA1F2]/10' },
  instagram: { label: 'Instagram', color: 'text-[#E4405F]', bgColor: 'bg-[#E4405F]/10' },
  facebook: { label: 'Facebook', color: 'text-[#1877F2]', bgColor: 'bg-[#1877F2]/10' },
  pinterest: { label: 'Pinterest', color: 'text-[#E60023]', bgColor: 'bg-[#E60023]/10' },
  tiktok: { label: 'TikTok', color: 'text-[#000000]', bgColor: 'bg-[#000000]/10' },
  youtube: { label: 'YouTube', color: 'text-[#FF0000]', bgColor: 'bg-[#FF0000]/10' },
  reddit: { label: 'Reddit', color: 'text-[#FF4500]', bgColor: 'bg-[#FF4500]/10' },
}

interface PlatformBadgeProps {
  platform: string
  className?: string
  showLabel?: boolean
}

export function PlatformBadge({ platform, className, showLabel = true }: PlatformBadgeProps) {
  const config = platformConfig[platform] || { label: platform, color: 'text-gray-600', bgColor: 'bg-gray-100' }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {showLabel && config.label}
    </span>
  )
}

export function getPlatformLabel(platform: string): string {
  return platformConfig[platform]?.label || platform
}

export function getPlatformColor(platform: string): string {
  return platformConfig[platform]?.color || 'text-gray-600'
}
