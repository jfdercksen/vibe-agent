'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/content/status-badge'
import { ApprovalButtons } from '@/components/content/approval-buttons'
import { ImageGeneratorTrigger } from '@/components/images/image-generator-panel'
import {
  Mail,
  ChevronDown,
  ChevronRight,
  Send,
  Calendar,
  Pencil,
  Copy,
  Check,
  Loader2,
  Save,
  Clock,
  Eye,
  ImageIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { EmailSequence, Email } from '@/lib/types/database'
import type { EmailSequenceWithEmails } from '@/lib/data'

interface EmailSequencesListProps {
  sequences: EmailSequenceWithEmails[]
  clientId: string
}

// ─── Role colour config ────────────────────────────────────────────────────

const emailRoleLabels: Record<string, { label: string; color: string }> = {
  deliver:    { label: 'DELIVER',  color: 'bg-blue-100 text-blue-700' },
  connect:    { label: 'CONNECT',  color: 'bg-purple-100 text-purple-700' },
  value:      { label: 'VALUE',    color: 'bg-green-100 text-green-700' },
  bridge:     { label: 'BRIDGE',   color: 'bg-amber-100 text-amber-700' },
  soft:       { label: 'SOFT',     color: 'bg-orange-100 text-orange-700' },
  direct:     { label: 'DIRECT',   color: 'bg-red-100 text-red-700' },
}

const sequenceTypeLabels: Record<string, string> = {
  welcome:        'Welcome',
  nurture:        'Nurture',
  post_purchase:  'Post Purchase',
  re_engagement:  'Re-engagement',
  launch:         'Launch',
  custom:         'Custom',
}

// ─── Email Edit Modal ──────────────────────────────────────────────────────

interface EmailEditModalProps {
  email: Email | null
  open: boolean
  onClose: () => void
  onSaved?: (updated: Partial<Email>) => void
}

function EmailEditModal({ email, open, onClose, onSaved }: EmailEditModalProps) {
  const [subjectLine, setSubjectLine] = useState(email?.subject_line || '')
  const [previewText, setPreviewText]   = useState(email?.preview_text || '')
  const [bodyText, setBodyText]         = useState(email?.body_text || '')
  const [ctaText, setCtaText]           = useState(email?.cta_text || '')
  const [ctaUrl, setCtaUrl]             = useState(email?.cta_url || '')
  const [sendDay, setSendDay]           = useState(email?.send_day?.toString() || '')
  const [status, setStatus]             = useState<Email['status']>(email?.status || 'draft')
  const [isLoading, setIsLoading]       = useState(false)

  // Re-sync when a different email is opened
  const [lastId, setLastId] = useState(email?.id)
  if (email?.id !== lastId) {
    setSubjectLine(email?.subject_line || '')
    setPreviewText(email?.preview_text || '')
    setBodyText(email?.body_text || '')
    setCtaText(email?.cta_text || '')
    setCtaUrl(email?.cta_url || '')
    setSendDay(email?.send_day?.toString() || '')
    setStatus(email?.status || 'draft')
    setLastId(email?.id)
  }

  if (!email) return null

  const handleSave = async () => {
    if (!subjectLine.trim()) { toast.error('Subject line cannot be empty'); return }
    setIsLoading(true)
    try {
      const fields: Partial<Email> = {
        subject_line: subjectLine.trim(),
        preview_text: previewText.trim() || null,
        body_text:    bodyText.trim()    || null,
        cta_text:     ctaText.trim()     || null,
        cta_url:      ctaUrl.trim()      || null,
        send_day:     sendDay ? parseInt(sendDay, 10) : null,
        status,
      }

      const res = await fetch('/api/content/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'emails', id: email.id, fields }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      toast.success('Email saved')
      onSaved?.(fields)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Email #{email.email_number}</DialogTitle>
          {email.email_role && (
            <DialogDescription>{email.email_role}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="em-subject">Subject Line <span className="text-destructive">*</span></Label>
            <Input id="em-subject" value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="Your subject line..." />
          </div>

          {/* Preview text */}
          <div className="space-y-2">
            <Label htmlFor="em-preview">
              Preview Text <span className="text-muted-foreground font-normal">(inbox snippet)</span>
            </Label>
            <Input id="em-preview" value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="What shows after the subject in inbox..." />
          </div>

          {/* Send day + Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="em-day">
                Send Day <span className="text-muted-foreground font-normal">(days after trigger)</span>
              </Label>
              <Input id="em-day" type="number" min="0" value={sendDay}
                onChange={(e) => setSendDay(e.target.value)}
                placeholder="0, 1, 3, 7..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Email['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="em-body">Email Body</Label>
              <span className="text-xs text-muted-foreground">
                {bodyText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <Textarea id="em-body" value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={14} className="resize-y font-mono text-sm leading-relaxed"
              placeholder="Write your email body..." />
          </div>

          {/* CTA */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="em-cta-text">CTA Button Text</Label>
              <Input id="em-cta-text" value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Start Free Trial" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="em-cta-url">CTA URL</Label>
              <Input id="em-cta-url" value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://..." />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !subjectLine.trim()}>
            {isLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Single Email Row ──────────────────────────────────────────────────────

function EmailRow({
  email,
  localOverride,
  onEdit,
  onStatusChange,
  clientId,
  onImageSaved,
}: {
  email: Email
  localOverride?: Partial<Email>
  onEdit: (e: Email) => void
  onStatusChange: (id: string, status: string) => void
  clientId: string
  onImageSaved: (emailId: string, imageUrl: string) => void
}) {
  const merged  = localOverride ? { ...email, ...localOverride } : email
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied]     = useState(false)
  const roleConfig = emailRoleLabels[merged.email_role || '']

  const handleCopy = () => {
    navigator.clipboard.writeText(merged.body_text || merged.subject_line)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
            {merged.email_number}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{merged.subject_line}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {roleConfig && (
                <Badge className={`text-[10px] px-1.5 py-0 ${roleConfig.color}`}>
                  {roleConfig.label}
                </Badge>
              )}
              {merged.send_day !== null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Day {merged.send_day}
                </span>
              )}
              {merged.preview_text && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  {merged.preview_text}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StatusBadge status={merged.status} />
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t bg-muted/20 px-4 pb-4 space-y-3">
          {merged.body_text ? (
            <div className="pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Body
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 gap-1 text-xs">
                  {copied
                    ? <><Check className="h-3 w-3 text-green-500" /> Copied!</>
                    : <><Copy className="h-3 w-3" /> Copy</>}
                </Button>
              </div>
              <div className="bg-background rounded-md border p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {merged.body_text}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-3 italic">No body text yet — click Edit to add one.</p>
          )}

          {/* Image */}
          <div className="flex items-center gap-3 pt-1">
            {merged.image_url && (
              <a href={merged.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={merged.image_url}
                  alt="Email image"
                  className="h-16 w-24 rounded border object-cover hover:opacity-80 transition-opacity"
                  loading="lazy"
                />
              </a>
            )}
            <ImageGeneratorTrigger
              clientId={clientId}
              referenceTable="emails"
              referenceId={email.id}
              defaultUseCase="general"
              label={merged.image_url ? 'Change Image' : 'Add Image'}
              onImageSaved={(asset) => {
                const url = 'file_url' in asset ? asset.file_url : ''
                if (url) onImageSaved(email.id, url)
              }}
            />
          </div>

          {(merged.cta_text || merged.cta_url) && (
            <div className="flex items-center gap-3 flex-wrap">
              {merged.cta_text && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  <Send className="h-3 w-3" /> {merged.cta_text}
                </span>
              )}
              {merged.cta_url && (
                <a href={merged.cta_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary underline truncate max-w-[240px]">
                  {merged.cta_url}
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost" size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onEdit(email) }}
            >
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <ApprovalButtons
              table="emails"
              recordId={merged.id}
              currentStatus={merged.status}
              compact
              onStatusChange={(s) => onStatusChange(merged.id, s)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sequence Card ─────────────────────────────────────────────────────────

function SequenceCard({ sequence, clientId }: { sequence: EmailSequenceWithEmails; clientId: string }) {
  const [open, setOpen]         = useState(false)
  const [editEmail, setEditEmail] = useState<Email | null>(null)
  const [localEmailUpdates, setLocalEmailUpdates] = useState<Record<string, Partial<Email>>>({})
  const [seqStatus, setSeqStatus] = useState(sequence.status)

  const applyEmailUpdate = (id: string, fields: Partial<Email>) =>
    setLocalEmailUpdates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...fields } }))

  const handleEmailImageSaved = async (emailId: string, imageUrl: string) => {
    applyEmailUpdate(emailId, { image_url: imageUrl })
    await fetch('/api/content/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'emails', id: emailId, fields: { image_url: imageUrl } }),
    })
  }

  const approvedCount = sequence.emails.filter((e) => {
    const s = localEmailUpdates[e.id]?.status ?? e.status
    return s === 'approved' || s === 'sent'
  }).length

  const progress = sequence.emails.length
    ? Math.round((approvedCount / sequence.emails.length) * 100)
    : 0

  return (
    <>
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{sequence.sequence_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {sequence.sequence_type && (
                    <Badge variant="outline" className="text-xs">
                      {sequenceTypeLabels[sequence.sequence_type] || sequence.sequence_type}
                    </Badge>
                  )}
                  <span>{sequence.emails.length} emails</span>
                  {sequence.trigger_event && (
                    <span className="truncate text-xs">Trigger: {sequence.trigger_event}</span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress bar */}
              <div className="text-right text-xs text-muted-foreground hidden sm:block">
                <div className="font-medium">{approvedCount}/{sequence.emails.length} approved</div>
                <div className="w-24 bg-muted rounded-full h-1.5 mt-1">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                <StatusBadge status={seqStatus} />
                <ApprovalButtons
                  table="email_sequences"
                  recordId={sequence.id}
                  currentStatus={seqStatus}
                  compact
                  rejectStatus="paused"
                  onStatusChange={(s) => setSeqStatus(s as EmailSequence['status'])}
                />
              </div>
              {open
                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>

        {open && (
          <CardContent className="pt-0 space-y-2">
            {sequence.emails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No emails in this sequence yet.
              </p>
            ) : (
              sequence.emails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  localOverride={localEmailUpdates[email.id]}
                  onEdit={setEditEmail}
                  onStatusChange={(id, s) => applyEmailUpdate(id, { status: s as Email['status'] })}
                  clientId={clientId}
                  onImageSaved={handleEmailImageSaved}
                />
              ))
            )}
            <p className="text-xs text-muted-foreground pt-1">
              Created {formatDistanceToNow(new Date(sequence.created_at), { addSuffix: true })}
            </p>
          </CardContent>
        )}
      </Card>

      <EmailEditModal
        email={editEmail}
        open={!!editEmail}
        onClose={() => setEditEmail(null)}
        onSaved={(fields) => {
          if (editEmail) applyEmailUpdate(editEmail.id, fields)
        }}
      />
    </>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────

export function EmailSequencesList({ sequences, clientId }: EmailSequencesListProps) {
  if (sequences.length === 0) {
    return (
      <Card className="py-16 text-center">
        <CardContent>
          <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-1">No email sequences yet.</p>
          <p className="text-xs text-muted-foreground">
            Use Vibe Chat → Email Sequences to generate your first sequence.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ImageGeneratorTrigger
          clientId={clientId}
          defaultUseCase="general"
          label="Generate Email Image"
        />
      </div>
      {sequences.map((seq) => (
        <SequenceCard key={seq.id} sequence={seq} clientId={clientId} />
      ))}
    </div>
  )
}
