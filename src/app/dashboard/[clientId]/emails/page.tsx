import { getEmailSequencesWithEmails } from '@/lib/data'
import { EmailSequencesList } from '@/components/content/email-sequences-list'

interface EmailsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function EmailsPage({ params }: EmailsPageProps) {
  const { clientId } = await params
  // Single query — no N+1. Sequences + emails fetched in one round-trip.
  const sequences = await getEmailSequencesWithEmails(clientId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Sequences</h1>
        <p className="text-muted-foreground">
          Automated email flows — welcome, nurture, post-purchase, and more
        </p>
      </div>
      <EmailSequencesList sequences={sequences} clientId={clientId} />
    </div>
  )
}
