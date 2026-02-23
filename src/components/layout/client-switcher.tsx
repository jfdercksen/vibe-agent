'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, Check, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Client } from '@/lib/types/database'

interface ClientSwitcherProps {
  clients: Client[]
  currentClient: Client
}

export function ClientSwitcher({ clients, currentClient }: ClientSwitcherProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full max-w-[240px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate font-medium">
              {currentClient.display_name || currentClient.name}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start">
        <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {clients.map((client) => (
          <DropdownMenuItem
            key={client.id}
            onSelect={() => router.push(`/dashboard/${client.id}`)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                'mr-2 h-4 w-4',
                currentClient.id === client.id ? 'opacity-100' : 'opacity-0'
              )}
            />
            <span className="truncate">
              {client.display_name || client.name}
            </span>
            {client.industry && (
              <span className="ml-auto text-xs text-muted-foreground">
                {client.industry}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
