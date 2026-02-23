'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { AddClientDialog } from './add-client-dialog'

export function AddClientCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Card
        className="group cursor-pointer transition-all hover:shadow-md border-dashed border-2 hover:border-primary/40"
        onClick={() => setOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground group-hover:text-primary transition-colors">
          <Plus className="h-8 w-8 mb-2" />
          <span className="text-sm font-medium">Add Client</span>
        </CardContent>
      </Card>

      <AddClientDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function AddClientButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Your First Client
      </button>

      <AddClientDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
