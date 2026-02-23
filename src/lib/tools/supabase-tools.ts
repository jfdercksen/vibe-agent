// Supabase Tool Bridge — server-side only
// Claude uses these to read/write the database during chat

import { createAdminClient } from '@/lib/supabase/server'

export type ContentTable =
  | 'social_posts'
  | 'blog_posts'
  | 'email_sequences'
  | 'emails'
  | 'content_ideas'
  | 'brand_voices'
  | 'positioning_angles'
  | 'keyword_research'
  | 'content_calendar'
  | 'lead_magnets'
  | 'creative_briefs'
  | 'media_assets'
  | 'clients'

export async function saveContent(
  table: ContentTable,
  data: Record<string, unknown>
): Promise<{ id: string; success: boolean }> {
  const supabase = createAdminClient()
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save to ${table}: ${error.message}`)
  return { id: result.id, success: true }
}

// Tables that have an updated_at column
const TABLES_WITH_UPDATED_AT = new Set([
  'social_posts', 'blog_posts', 'content_ideas', 'email_sequences',
  'brand_voices', 'positioning_angles', 'keyword_research',
  'content_calendar', 'lead_magnets', 'creative_briefs', 'clients',
])

export async function updateContent(
  table: ContentTable,
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  const supabase = createAdminClient()
  // Only inject updated_at if the table has that column (emails table does NOT)
  const payload = TABLES_WITH_UPDATED_AT.has(table)
    ? { ...data, updated_at: new Date().toISOString() }
    : { ...data }
  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(`Failed to update ${table}: ${error.message}`)
  return { success: true }
}

export async function getClientContext(clientId: string): Promise<Record<string, unknown>> {
  const supabase = createAdminClient()

  const [client, brandVoice, angles, recentPosts, recentIdeas] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('brand_voices').select('*').eq('client_id', clientId).eq('is_active', true).maybeSingle(),
    supabase.from('positioning_angles').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
    supabase.from('social_posts').select('id,platform,hook,body,status,created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(10),
    supabase.from('content_ideas').select('id,title,idea_type,status,created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(10),
  ])

  return {
    client: client.data,
    brandVoice: brandVoice.data,
    positioningAngles: angles.data || [],
    recentPosts: recentPosts.data || [],
    recentIdeas: recentIdeas.data || [],
  }
}

export async function getExistingContent(
  clientId: string,
  table: ContentTable,
  limit = 20
): Promise<Record<string, unknown>[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

export async function updateClientOnboardingStage(
  clientId: string,
  stage: number,
  completed = false
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('clients')
      .update({
        onboarding_stage: stage,
        onboarding_completed: completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)
    if (error) console.error('[updateClientOnboardingStage] Failed:', error.message)
  } catch (err) {
    console.error('[updateClientOnboardingStage] Exception:', err)
  }
}

export async function saveChatMessage(
  clientId: string,
  role: 'user' | 'assistant' | 'tool',
  content: string,
  toolData?: {
    toolName?: string
    toolInput?: Record<string, unknown>
    toolOutput?: Record<string, unknown>
    onboardingStage?: number
  }
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('chat_messages').insert({
      client_id: clientId,
      role,
      content,
      tool_name: toolData?.toolName,
      tool_input: toolData?.toolInput,
      tool_output: toolData?.toolOutput,
      onboarding_stage: toolData?.onboardingStage,
    })
    if (error) console.error(`[saveChatMessage] Failed to save ${role} message:`, error.message)
  } catch (err) {
    console.error('[saveChatMessage] Exception:', err)
  }
}

export async function getChatHistory(
  clientId: string,
  limit = 50
): Promise<Array<{ role: string; content: string; tool_name?: string; created_at: string }>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, tool_name, tool_input, tool_output, onboarding_stage, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch chat history: ${error.message}`)
  return data || []
}
