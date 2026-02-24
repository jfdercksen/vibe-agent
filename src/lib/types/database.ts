// Database types matching Supabase schema

export type BusinessType = 'info_education' | 'consulting_agency' | 'ecommerce' | 'saas' | 'other'

export type ContentStatus = 'idea' | 'researching' | 'drafting' | 'review' | 'approved' | 'published' | 'archived'
export type PostStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'rejected'
export type BlogStatus = 'outline' | 'drafting' | 'review' | 'approved' | 'published' | 'archived'
export type SequenceStatus = 'draft' | 'review' | 'approved' | 'active' | 'paused'
export type EmailStatus = 'draft' | 'review' | 'approved' | 'sent'
export type LeadMagnetStatus = 'concept' | 'drafting' | 'review' | 'live' | 'retired'
export type BriefStatus = 'draft' | 'review' | 'approved' | 'in_production' | 'complete'
export type CalendarStatus = 'planned' | 'created' | 'scheduled' | 'published' | 'missed'
export type KeywordStatus = 'identified' | 'planned' | 'in_progress' | 'published'
export type LandingPageStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'
export type LandingPageType = 'seo' | 'programmatic' | 'campaign'

export type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'youtube' | 'reddit'
export type PostType = 'text' | 'image' | 'carousel' | 'reel' | 'story' | 'thread' | 'poll' | 'video' | 'quote_card'
export type IdeaType = 'social' | 'blog' | 'email' | 'video' | 'lead_magnet' | 'ad' | 'other'
export type SourceType = 'prompt' | 'voice_note' | 'research' | 'atomized' | 'manual'
export type SearchIntent = 'informational' | 'transactional' | 'navigational' | 'commercial'
export type Difficulty = 'low' | 'medium' | 'high'
export type Priority = 'high' | 'medium' | 'low'
export type AssetType = 'image' | 'video' | 'voice_note' | 'document' | 'logo' | 'font' | 'graphic'
export type AssetSource = 'upload' | 'ai_generated' | 'screenshot' | 'scraped'

export interface IntegrationConfig {
  wordpress?: {
    url: string
    username: string
    app_password: string
  }
  mailchimp?: {
    api_key: string
    server_prefix: string
    list_id?: string
  }
  meta?: {
    access_token: string
    facebook_page_id?: string
    instagram_account_id?: string
  }
  linkedin?: {
    org_id: string
  }
  n8n?: {
    base_url: string
    webhook_secret?: string
  }
  whatsapp?: {
    access_token: string        // Permanent Meta system user token
    phone_number_id: string     // Meta Phone Number ID
    verify_token: string        // Secret string for webhook verification
    agent_prompt: string        // Claude's persona/instructions for this client
  }
}

export interface WhatsAppConversation {
  id: string
  client_id: string
  phone_number: string
  contact_name: string | null
  last_message_at: string
  created_at: string
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WhatsAppConversationWithMessages extends WhatsAppConversation {
  whatsapp_messages: WhatsAppMessage[]
}

export interface Client {
  id: string
  name: string
  display_name: string | null
  business_type: BusinessType | null
  industry: string | null
  website: string | null
  target_audience: string | null
  primary_goal: string | null
  competitors: string[]
  branding: {
    primaryColor?: string
    secondaryColor?: string
    logo_url?: string
    fonts?: string[]
  }
  integrations: IntegrationConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BrandVoice {
  id: string
  client_id: string
  personality_traits: string[]
  voice_dimensions: Record<string, number>
  vocabulary_embrace: string[]
  vocabulary_avoid: string[]
  anti_positioning: string | null
  channel_notes: Record<string, string>
  sample_on_brand: string[]
  sample_off_brand: string[]
  full_document: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PositioningAngle {
  id: string
  client_id: string
  angle_number: number | null
  framework: string | null
  core_hook: string | null
  psychology: string | null
  headline_directions: string[]
  anti_angle: string | null
  risk: string | null
  is_selected: boolean
  score: Record<string, number>
  full_document: string | null
  created_at: string
}

export interface ContentIdea {
  id: string
  client_id: string
  title: string
  description: string | null
  idea_type: IdeaType | null
  source_type: SourceType | null
  source_content: string | null
  platforms: string[]
  priority: Priority
  status: ContentStatus
  positioning_angle_id: string | null
  tags: string[]
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  client_id: string
  content_idea_id: string | null
  batch_id: string | null       // Groups posts from one Content Atomizer run
  batch_label: string | null    // Human-readable batch name e.g. "Blog: How to scale revenue"
  platform: Platform
  post_type: PostType | null
  hook: string | null
  body: string
  cta: string | null
  hashtags: string[]
  character_count: number | null
  image_prompt: string | null
  image_url: string | null
  video_url: string | null
  status: PostStatus
  scheduled_for: string | null
  published_at: string | null
  engagement_data: Record<string, number>
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  client_id: string
  content_idea_id: string | null
  title: string
  slug: string | null
  target_keyword: string | null
  secondary_keywords: string[]
  search_intent: SearchIntent | null
  meta_description: string | null
  outline: Array<{ h2: string; points: string[] }>
  body_markdown: string | null
  body_html: string | null
  word_count: number | null
  featured_image_url: string | null
  featured_image_prompt: string | null
  status: BlogStatus
  wordpress_post_id: number | null
  published_url: string | null
  published_at: string | null
  fact_check_notes: string | null
  created_at: string
  updated_at: string
}

export interface EmailSequence {
  id: string
  client_id: string
  sequence_name: string
  sequence_type: 'welcome' | 'nurture' | 'post_purchase' | 're_engagement' | 'launch' | 'custom' | null
  trigger_event: string | null
  total_emails: number | null
  status: SequenceStatus
  full_document: string | null
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  sequence_id: string
  client_id: string
  email_number: number
  email_role: string | null
  subject_line: string
  subject_line_alternatives: string[]
  preview_text: string | null
  body_text: string | null
  body_html: string | null
  cta_text: string | null
  cta_url: string | null
  send_day: number | null
  mailchimp_campaign_id: string | null
  image_url: string | null
  status: EmailStatus
  created_at: string
}

export interface KeywordResearch {
  id: string
  client_id: string
  keyword: string
  search_volume: number | null
  cpc: number | null
  difficulty: Difficulty | null
  search_intent: SearchIntent | null
  competitor_ranking: string | null
  content_pillar: string | null
  priority: number | null
  is_quick_win: boolean
  status: KeywordStatus
  blog_post_id: string | null
  data_source: string
  raw_data: Record<string, unknown>
  created_at: string
}

export interface ContentCalendar {
  id: string
  client_id: string
  content_type: string
  reference_id: string | null
  reference_table: string | null
  title: string | null
  platform: string | null
  scheduled_date: string
  scheduled_time: string | null
  status: CalendarStatus
  notes: string | null
  created_at: string
}

export interface LeadMagnet {
  id: string
  client_id: string
  title: string
  framework: string | null
  format: string | null
  core_promise: string | null
  time_to_consume: string | null
  bridge_to_offer: string | null
  opt_in_headline: string | null
  opt_in_subheadline: string | null
  opt_in_bullets: string[]
  opt_in_cta: string | null
  document_url: string | null
  interactive_url: string | null
  optin_page_url: string | null
  status: LeadMagnetStatus
  conversion_rate: number | null
  created_at: string
  updated_at: string
}

export interface CreativeBrief {
  id: string
  client_id: string
  brief_name: string
  campaign_goal: string | null
  target_audience: string | null
  key_message: string | null
  positioning_angle_id: string | null
  tone_and_mood: string | null
  mandatory_elements: string[]
  avoid_elements: string[]
  concepts: Array<{
    name: string
    hook: string
    format: string
    platform: string | null
    visual_direction: string
    copy_direction: string        // script for video formats; general copy direction for others
    primary_text: string | null   // Facebook primary text (body above image, ~125 chars ideal)
    headline: string | null       // Facebook headline (below image, max 27 chars)
    description: string | null    // Facebook description (below headline, max 27 chars)
    image_url: string | null      // per-concept generated image
  }>
  selected_concept: number | null
  production_specs: unknown[]
  image_url: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  client_id: string
  asset_type: AssetType | null
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  alt_text: string | null
  tags: string[]
  ai_prompt: string | null
  source: AssetSource | null
  reference_table: string | null
  reference_id: string | null
  created_at: string
}

export interface LandingPageSection {
  type: 'hero' | 'social_proof' | 'features' | 'benefits' | 'faq' | 'testimonials' | 'cta' | 'custom'
  headline?: string
  body?: string
  bullets?: string[]
  cta_text?: string
  cta_url?: string
  image_url?: string
  items?: Array<Record<string, string>>
}

export interface LandingPage {
  id: string
  client_id: string
  page_type: LandingPageType
  title: string
  slug: string | null
  headline: string | null
  subheadline: string | null
  hero_body: string | null
  sections: LandingPageSection[]
  cta_primary_text: string | null
  cta_primary_url: string | null
  cta_secondary_text: string | null
  target_keyword: string | null
  secondary_keywords: string[]
  meta_title: string | null
  meta_description: string | null
  template_vars: Record<string, string>
  featured_image_url: string | null
  published_url: string | null
  status: LandingPageStatus
  created_at: string
  updated_at: string
}

// Dashboard stats type
export interface ClientStats {
  totalPosts: number
  postsInReview: number
  postsApproved: number
  postsPublished: number
  totalBlogs: number
  totalEmails: number
  totalKeywords: number
  totalIdeas: number
}
