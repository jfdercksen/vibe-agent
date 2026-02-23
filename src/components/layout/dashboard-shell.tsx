'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import type { Client } from '@/lib/types/database'

interface DashboardShellProps {
  clientId: string
  isAdmin: boolean
  clients: Client[]
  currentClient: Client
  userEmail?: string
  children: React.ReactNode
}

export function DashboardShell({
  clientId,
  isAdmin,
  clients,
  currentClient,
  userEmail,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        clientId={clientId}
        isAdmin={isAdmin}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          clients={clients}
          currentClient={currentClient}
          isAdmin={isAdmin}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
