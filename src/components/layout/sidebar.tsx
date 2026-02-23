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

export function Sidebar({ clientId, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const basePath = `/dashboard/${clientId}`

  // Filter out admin-only items for client users (e.g. Chat with Vibe)
  const visibleNavigation = navigation.filter(
    (item) => isAdmin || !item.adminOnly
  )

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            VA
          </div>
          <span className="text-lg">Vibe Agent</span>
        </Link>
      </div>
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
    </div>
  )
}
