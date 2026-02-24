'use client'

import { ClientSwitcher } from './client-switcher'
import { Button } from '@/components/ui/button'
import { Building2, LogOut, Menu } from 'lucide-react'
import type { Client } from '@/lib/types/database'

interface HeaderProps {
  clients: Client[]
  currentClient: Client
  isAdmin: boolean
  userEmail?: string
  onMenuClick?: () => void
}

export function Header({ clients, currentClient, isAdmin, userEmail, onMenuClick }: HeaderProps) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Full navigation clears Next.js router cache so stale RSC data is gone
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger menu — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isAdmin ? (
          // Admin: full client switcher dropdown
          <ClientSwitcher clients={clients} currentClient={currentClient} />
        ) : (
          // Client user: static company name — no dropdown, no client list exposed
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{currentClient.display_name || currentClient.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Vibe connected</span>
        </div>

        {userEmail && (
          <span className="hidden lg:block text-xs text-muted-foreground border-l pl-3">
            {userEmail}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          title="Sign out"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
