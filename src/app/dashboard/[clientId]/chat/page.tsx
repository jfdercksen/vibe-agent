import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'

export const dynamic = 'force-dynamic'

interface ChatPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { clientId } = await params

  // Auth check — verify session and role server-side.
  // The sidebar already hides the Chat link for client users, but a savvy
  // user could type the URL directly. This blocks that at the server level.
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.user_metadata?.role as string | undefined
  const isAdmin = role === 'admin'

  // Client users do not have access to Chat — redirect to their dashboard overview
  if (!isAdmin) {
    redirect(`/dashboard/${clientId}`)
  }

  // Admin only from here — fetch client record
  const adminClient = createAdminClient()
  const { data: client, error } = await adminClient
    .from('clients')
    .select('id, name, display_name, onboarding_stage, onboarding_completed')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full -m-6">
      <ChatInterface
        clientId={client.id}
        clientName={client.display_name || client.name}
        onboardingStage={client.onboarding_stage || 1}
        onboardingCompleted={client.onboarding_completed || false}
        isMarketer={true} // Only admins reach this point
      />
    </div>
  )
}
