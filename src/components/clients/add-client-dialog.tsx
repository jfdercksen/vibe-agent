'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BUSINESS_TYPES = [
  { value: 'info_education', label: 'Info & Education' },
  { value: 'consulting_agency', label: 'Consulting / Agency' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Other' },
] as const

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const router = useRouter()

  // ── Company fields ────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')

  // ── User login fields ─────────────────────────────────────────────────────
  const [createUser, setCreateUser] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setName('')
    setDisplayName('')
    setBusinessType('')
    setIndustry('')
    setWebsite('')
    setCreateUser(false)
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Client name is required')
      return
    }

    if (createUser) {
      if (!email.trim()) {
        toast.error('Email is required when creating a login')
        return
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters')
        return
      }
    }

    setSaving(true)

    try {
      const payload: Record<string, unknown> = {
        client: {
          name: name.trim(),
          display_name: displayName.trim() || null,
          business_type: businessType || null,
          industry: industry.trim() || null,
          website: website.trim() || null,
        },
      }

      if (createUser) {
        payload.user = {
          email: email.trim(),
          password,
        }
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok && res.status !== 207) {
        toast.error(data.error || 'Failed to create client')
        return
      }

      // 207 = client created but user failed
      if (res.status === 207) {
        toast.warning(
          `Client created, but user account failed: ${data.userError}. You can create the user later.`
        )
      } else if (data.user) {
        toast.success(
          `Client and user account created! Login: ${data.user.email}`
        )
      } else {
        toast.success('Client created successfully!')
      }

      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new company profile and optionally set up a client login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Company Details ──────────────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Acme (optional short name)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. Technology"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Client Login (optional) ──────────────────────────────── */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createUser}
                onChange={(e) => setCreateUser(e.target.checked)}
                className="rounded border-input h-4 w-4 accent-primary"
              />
              <div className="flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Create a client login
                </span>
              </div>
            </label>

            {createUser && (
              <div className="space-y-3 pl-6 border-l-2 border-muted">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    The client will use this to log into their dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
