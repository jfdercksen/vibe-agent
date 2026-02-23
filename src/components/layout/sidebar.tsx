'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Lightbulb,
  Share2,
  FileText,
  Mail,
  Calendar,
  Search,
  Image,
  Compass,
  Settings,
  Zap,
  MessageSquare,
  Megaphone,
  Globe,
  X,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  highlight?: boolean
  adminOnly?: boolean
}

interface SidebarProps {
  clientId: string
  isAdmin: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const navigation: NavItem[] = [
  { name: 'Chat with Vibe', href: '/chat', icon: MessageSquare, highlight: true, adminOnly: true },
  { name: 'Overview', href: '', icon: LayoutDashboard },
  { name: 'Content Ideas', href: '/content', icon: Lightbulb },
  { name: 'Social Posts', href: '/social', icon: Share2 },
  { name: 'Blog Posts', href: '/blog', icon: FileText },
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'SEO & Keywords', href: '/seo', icon: Search },
  { name: 'Media Library', href: '/assets', icon: Image },
  { name: 'Strategy', href: '/strategy', icon: Compass },
  { name: 'Lead Magnets', href: '/lead-magnets', icon: Zap },
  { name: 'Ad Creatives', href: '/ads', icon: Megaphone },
  { name: 'Landing Pages', href: '/pages', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function SidebarContent({
  clientId,
  isAdmin,
  onNavClick,
}: {
  clientId: string
  isAdmin: boolean
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  const basePath = `/dashboard/${clientId}`

  const visibleNavigation = navigation.filter(
    (item) => isAdmin || !item.adminOnly
  )

  return (
    <ScrollArea className="flex-1 py-2">
      <nav className="flex flex-col gap-1 px-2">
        {visibleNavigation.map((item) => {
          const fullPath = `${basePath}${item.href}`
          const isActive =
            item.href === ''
              ? pathname === basePath
              : pathname.startsWith(fullPath)

          return (
            <Link
              key={item.name}
              href={fullPath}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.highlight && !isActive
                  ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20'
                  : ''
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
              {item.highlight && (
                <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                  AI
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </ScrollArea>
  )
}

export function Sidebar({ clientId, isAdmin, open, onOpenChange }: SidebarProps) {
  return (
    <>
      {/* ── Desktop sidebar (always visible on md+) ── */}
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              VA
            </div>
            <span className="text-lg">Vibe Agent</span>
          </Link>
        </div>
        <SidebarContent clientId={clientId} isAdmin={isAdmin} />
      </div>

      {/* ── Mobile sidebar drawer (overlay on < md) ── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => onOpenChange?.(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold"
                onClick={() => onOpenChange?.(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  VA
                </div>
                <span className="text-lg">Vibe Agent</span>
              </Link>
              <button
                onClick={() => onOpenChange?.(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              clientId={clientId}
              isAdmin={isAdmin}
              onNavClick={() => onOpenChange?.(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
