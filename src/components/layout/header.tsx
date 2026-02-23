'use client'

import { ClientSwitcher } from './client-switcher'
import { Button } from '@/components/ui/button'
import { Building2, LogOut } from 'lucide-react'
import type { Client } from '@/lib/types/database'

interface HeaderProps {
  clients: Client[]
  currentClient: Client
  isAdmin: boolean
  userEmail?: string
}

export function Header({ clients, currentClient, isAdmin, userEmail }: HeaderProps) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Full navigation clears Next.js router cache so stale RSC data is gone
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {isAdmin ? (
          // Admin: full client switcher dropdown
          <ClientSwitcher clients={clients} currentClient={currentClient} />
        ) : (
          // Client user: static company name — no dropdown, no client list exposed
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{currentClient.display_name || currentClient.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Claude connected</span>
        </div>

        {userEmail && (
          <span className="hidden sm:block text-xs text-muted-foreground border-l pl-3">
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
