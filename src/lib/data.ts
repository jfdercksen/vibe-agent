import { createAdminClient } from '@/lib/supabase/server'
import type {
  Client, BrandVoice, PositioningAngle, ContentIdea,
  SocialPost, BlogPost, EmailSequence, Email,
  KeywordResearch, ContentCalendar, LeadMagnet,
  CreativeBrief, MediaAsset, ClientStats, LandingPage
} from '@/lib/types/database'

// ---- Clients ----

export async function getClients(): Promise<Client[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// ---- Client Stats — all counts done DB-side, no JS filtering ----

export async function getClientStats(clientId: string): Promise<ClientStats> {
  const supabase = createAdminClient()

  const [total, review, approved, published, blogs, sequences, keywords, ideas] = await Promise.all([
    supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'review'),
    supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'approved'),
    supabase.from('social_posts').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'published'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('email_sequences').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('keyword_research').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('content_ideas').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
  ])

  return {
    totalPosts: total.count || 0,
    postsInReview: review.count || 0,
    postsApproved: approved.count || 0,
    postsPublished: published.count || 0,
    totalBlogs: blogs.count || 0,
    totalEmails: sequences.count || 0,
    totalKeywords: keywords.count || 0,
    totalIdeas: ideas.count || 0,
  }
}

// ---- Brand Voice ----

export async function getBrandVoice(clientId: string): Promise<BrandVoice | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('brand_voices')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

// ---- Positioning Angles ----

export async function getPositioningAngles(clientId: string): Promise<PositioningAngle[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('positioning_angles')
    .select('*')
    .eq('client_id', clientId)
    .order('angle_number')
    .limit(10)

  if (error) throw error
  return data || []
}

// ---- Content Ideas — capped at 100 most recent ----

export async function getContentIdeas(clientId: string): Promise<ContentIdea[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('content_ideas')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

// ---- Social Posts — capped at 100 most recent ----

export async function getSocialPosts(clientId: string, platform?: string, status?: string): Promise<SocialPost[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('client_id', clientId)

  if (platform) query = query.eq('platform', platform)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

// ---- Blog Posts — capped at 50 most recent ----

export async function getBlogPosts(clientId: string): Promise<BlogPost[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// ---- Email Sequences — single query with embedded emails (no N+1) ----

export type EmailSequenceWithEmails = EmailSequence & { emails: Email[] }

export async function getEmailSequencesWithEmails(clientId: string): Promise<EmailSequenceWithEmails[]> {
  const supabase = createAdminClient()

  // Single query fetching sequences + their emails via Supabase nested select
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*, emails(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error

  return (data || []).map(seq => ({
    ...seq,
    emails: (seq.emails || []).sort((a: Email, b: Email) => a.email_number - b.email_number),
  }))
}

// Keep for backward compat
export async function getEmailSequences(clientId: string): Promise<EmailSequence[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function getSequenceEmails(sequenceId: string): Promise<Email[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('email_number')

  if (error) throw error
  return data || []
}

// ---- Keyword Research — capped at 200 ----

export async function getKeywords(clientId: string): Promise<KeywordResearch[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('keyword_research')
    .select('*')
    .eq('client_id', clientId)
    .order('priority', { ascending: true })
    .limit(200)

  if (error) throw error
  return data || []
}

// ---- Content Calendar — 3 months back + 6 months forward ----

export async function getCalendarEvents(clientId: string, startDate?: string, endDate?: string): Promise<ContentCalendar[]> {
  const supabase = createAdminClient()

  // Wide window: 3 months back → 6 months forward so all scheduled content is visible
  const defaultStart = new Date()
  defaultStart.setMonth(defaultStart.getMonth() - 3)
  const defaultEnd = new Date()
  defaultEnd.setMonth(defaultEnd.getMonth() + 6)

  const start = startDate || defaultStart.toISOString().split('T')[0]
  const end = endDate || defaultEnd.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('client_id', clientId)
    .gte('scheduled_date', start)
    .lte('scheduled_date', end)
    .order('scheduled_date')
    .limit(200)

  if (error) throw error
  return data || []
}

// ---- Lead Magnets — capped at 20 ----

export async function getLeadMagnets(clientId: string): Promise<LeadMagnet[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

// ---- Creative Briefs — capped at 20 ----

export async function getCreativeBriefs(clientId: string): Promise<CreativeBrief[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('creative_briefs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

// ---- Landing Pages — capped at 50 ----

export async function getLandingPages(clientId: string): Promise<LandingPage[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

// ---- Media Assets — capped at 50 ----

export async function getMediaAssets(clientId: string, assetType?: string): Promise<MediaAsset[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('media_assets')
    .select('*')
    .eq('client_id', clientId)

  if (assetType) query = query.eq('asset_type', assetType)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(500) // media library handles large sets client-side

  if (error) throw error
  return data || []
}

// ---- Recent Activity — lean column selection, hard limit ----

export async function getRecentActivity(clientId: string, limit = 10) {
  const supabase = createAdminClient()

  const [posts, blogs, ideas] = await Promise.all([
    supabase
      .from('social_posts')
      .select('id, body, platform, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('blog_posts')
      .select('id, title, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('content_ideas')
      .select('id, title, idea_type, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  type ActivityItem = {
    id: string
    type: 'social' | 'blog' | 'idea'
    title: string
    status: string
    created_at: string
    platform?: string
  }

  const activities: ActivityItem[] = [
    ...(posts.data || []).map(p => ({
      id: p.id,
      type: 'social' as const,
      title: p.body.substring(0, 80) + (p.body.length > 80 ? '...' : ''),
      status: p.status,
      created_at: p.created_at,
      platform: p.platform,
    })),
    ...(blogs.data || []).map(b => ({
      id: b.id,
      type: 'blog' as const,
      title: b.title,
      status: b.status,
      created_at: b.created_at,
    })),
    ...(ideas.data || []).map(i => ({
      id: i.id,
      type: 'idea' as const,
      title: i.title,
      status: i.status,
      created_at: i.created_at,
    })),
  ]

  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}
