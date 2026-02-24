// ─────────────────────────────────────────────────────────────────────────────
// Skills Library — structured data for all marketing skills
//
// Source of truth: /skills/**/*.md files (loaded into system prompt at runtime)
// This file provides UI metadata + activation prompts for the Skills Panel sidebar.
// The full skill methodology is already in Claude's system prompt — primaryPrompt
// strings here are activation triggers, not instructions. Keep them short and direct.
// ─────────────────────────────────────────────────────────────────────────────

export type SkillCategoryId = 'strategy' | 'copy' | 'creative'

export interface SkillItem {
  id: string              // Unique slug, e.g., "brand-voice"
  name: string            // Display name, e.g., "Brand Voice"
  description: string     // One-line summary from ## Purpose
  whenToUse: string       // When to activate this skill
  inputs: string[]        // Required inputs
  outputs: string         // Supabase table(s) this writes to
  prerequisites: string[] // Skill IDs that should run first
  skillStack: string      // Foundation | Conversion | Traffic | Nurture | Any
  primaryPrompt: string   // Full prompt loaded on "Use This Skill" click
}

export interface SkillCategory {
  id: SkillCategoryId
  label: string
  icon: string
  color: string
  skills: SkillItem[]
}

export const SKILLS_LIBRARY: SkillCategory[] = [
  // ─────────────────────────────────────────────────────────────
  // STRATEGY — planning, routing, and foundational strategy
  // ─────────────────────────────────────────────────────────────
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '🗺️',
    color: 'bg-violet-100 text-violet-700',
    skills: [
      {
        id: 'orchestrator',
        name: 'Orchestrator',
        description: 'Route marketing objectives to the correct skill sequence. Eliminate blank-page syndrome by providing a clear execution path from goal to deliverable.',
        whenToUse: 'When you state a marketing goal, ask "where do I start?", or need help choosing the right skill sequence for a project.',
        inputs: [
          'Marketing goal (traffic, conversions, brand awareness, nurture, launch)',
          'Target audience description',
          'Business type (info/education, consulting/agency, e-commerce, SaaS)',
          'Existing assets (brand voice doc, positioning, existing copy, website)',
        ],
        outputs: 'content_ideas',
        prerequisites: [],
        skillStack: 'Any',
        primaryPrompt: 'Run the Orchestrator skill now. Use the full Orchestrator methodology from your skill library — ask about my marketing goal and existing assets, then map out the correct skill stack and execution sequence for this client.',
      },
      {
        id: 'brand-voice',
        name: 'Brand Voice',
        description: 'Extract and define a brand\'s authentic personality, tone, and vocabulary. Produces a reusable voice profile that guides all future copy and creative work.',
        whenToUse: 'When starting with a new client, when brand messaging feels inconsistent, or when you need voice/tone definition.',
        inputs: [
          'Existing brand content (website, social posts, emails, ads)',
          'Company values and mission statement',
          'Target audience description',
          'Competitor examples (what you\'re NOT)',
        ],
        outputs: 'brand_voices',
        prerequisites: [],
        skillStack: 'Foundation',
        primaryPrompt: 'Run the Brand Voice skill now using the full Brand Voice methodology from your skill library. Research this client\'s industry and existing content, ask the guided discovery questions, build the complete voice profile across all 5 dimensions, and save the finished record to Supabase brand_voices.',
      },
      {
        id: 'positioning-angles',
        name: 'Positioning Angles',
        description: 'Generate 3-5 differentiation angles using psychology-driven frameworks. Move beyond feature-based positioning to find the hook that makes a brand impossible to ignore.',
        whenToUse: 'After Brand Voice is defined, when launching a new product/service, when current positioning feels generic, or when entering a crowded market.',
        inputs: [
          'Brand Voice profile',
          'Market research (competitors, gaps, audience language)',
          'Product/service description and key transformation',
          'Target audience (who they are, what they want, what they fear)',
        ],
        outputs: 'positioning_angles',
        prerequisites: ['brand-voice'],
        skillStack: 'Foundation',
        primaryPrompt: 'Run the Positioning Angles skill now using the full Positioning Angles methodology from your skill library. Research the competitive landscape with Perplexity and Firecrawl, apply the 8 positioning frameworks to find the 3-5 strongest angles for this client, evaluate each against the quality gates, and save each angle as a separate record to Supabase positioning_angles.',
      },
      {
        id: 'keyword-research',
        name: 'Keyword Research',
        description: 'Identify SEO opportunities competitors miss using the 6 Circles comparative gap analysis. Produce a prioritized keyword strategy with quick-win targets for 60-90 day results.',
        whenToUse: 'When building a Traffic Stack, when starting SEO for a new client, or when existing content isn\'t ranking.',
        inputs: [
          'Business type and niche',
          'Target audience description',
          '3-5 competitor websites',
          'Current website (if exists)',
        ],
        outputs: 'keyword_research, content_calendar',
        prerequisites: ['positioning-angles'],
        skillStack: 'Traffic',
        primaryPrompt: 'Run the Keyword Research skill now using the full 6 Circles methodology from your skill library. Use DataForSEO to find the top 50 keyword opportunities — high-priority gaps, unserved questions, and blue ocean terms. Build 3-5 content pillars and identify quick wins. Save all to Supabase keyword_research.',
      },
      {
        id: 'lead-magnet',
        name: 'Lead Magnet',
        description: 'Develop high-converting opt-in concepts that bridge awareness to paid offerings. Create lead magnets that demonstrate expertise, solve an immediate problem, and lead to the core offer.',
        whenToUse: 'When building a Conversion Stack, when a client needs to grow their email list, or when there\'s no bridge between content and sales.',
        inputs: [
          'Target audience pain points (from research)',
          'Core product/service offering',
          'Positioning angles',
          'Brand voice profile',
          'Conversion goal (what happens after opt-in)',
        ],
        outputs: 'lead_magnets',
        prerequisites: ['positioning-angles', 'brand-voice'],
        skillStack: 'Conversion',
        primaryPrompt: 'Run the Lead Magnet skill now using the full Lead Magnet methodology from your skill library. Research what converts best in this niche, apply the 5 lead magnet frameworks, create 3 strong concepts with titles, full outlines, and opt-in copy. Present options for selection, then save the chosen concept to Supabase lead_magnets.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // COPY — written content across all channels
  // ─────────────────────────────────────────────────────────────
  {
    id: 'copy',
    label: 'Copy',
    icon: '✍️',
    color: 'bg-emerald-100 text-emerald-700',
    skills: [
      {
        id: 'direct-response-copy',
        name: 'Direct Response Copy',
        description: 'Create landing pages and sales copy using 100+ years of proven copywriting methodology. Copy that sounds human, drives conversions, and is free of AI artifacts.',
        whenToUse: 'When building landing pages, sales pages, product pages, or any conversion-focused copy. Part of the Conversion Stack.',
        inputs: [
          'Positioning angle',
          'Brand voice profile',
          'Target audience research (pain points, desires, language)',
          'Product/service details and transformation offered',
          'Conversion goal (buy, book a call, sign up, download)',
        ],
        outputs: 'content_ideas, blog_posts',
        prerequisites: ['positioning-angles', 'brand-voice'],
        skillStack: 'Conversion',
        primaryPrompt: 'Run the Direct Response Copy skill now using the full methodology from your skill library. Apply the correct framework for this client\'s market sophistication level, write the complete 8-section page architecture, run the AI artifact removal checklist, and save the finished copy to Supabase.',
      },
      {
        id: 'email-sequences',
        name: 'Email Sequences',
        description: 'Design automated email flows that welcome, nurture, and convert subscribers. Sequences that feel personal, deliver real value, and naturally bridge to the core offer.',
        whenToUse: 'After a lead magnet is created, when setting up email automation, or when building the Nurture Stack.',
        inputs: [
          'Trigger event (lead magnet download, signup, purchase)',
          'Brand voice profile',
          'Positioning angle',
          'Core offer / conversion goal',
          'Audience pain points and desires',
        ],
        outputs: 'email_sequences, emails',
        prerequisites: ['brand-voice', 'positioning-angles'],
        skillStack: 'Nurture',
        primaryPrompt: 'Run the Email Sequences skill now using the full methodology from your skill library. Apply the DELIVER→CONNECT→VALUE→VALUE→BRIDGE→SOFT→DIRECT framework, write all 7 emails with one job and one CTA each, save the sequence record first then each email individually to Supabase — sequence_id required before saving emails.',
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        description: 'Create engagement-focused email content using 9 distinct formats. Newsletters people actually open, read, and share — not just another unread email.',
        whenToUse: 'When building recurring email content, part of the Nurture Stack, or when a client needs to maintain audience engagement between launches.',
        inputs: [
          'Brand voice profile',
          'Content pillars / topic areas',
          'Audience interests and pain points',
          'Send frequency (weekly, biweekly, monthly)',
        ],
        outputs: 'email_sequences, emails',
        prerequisites: ['brand-voice'],
        skillStack: 'Nurture',
        primaryPrompt: 'Run the Newsletter skill now using the full methodology from your skill library. Select the right format from the 9 newsletter formats, research current industry news with Perplexity, add the client\'s expert angle, write the complete newsletter under 400 words, and save to Supabase email_sequences and emails.',
      },
      {
        id: 'seo-content',
        name: 'SEO Content',
        description: 'Produce content that ranks in search AND reads like a human wrote it. Balance search optimization with genuine readability. Quality over volume.',
        whenToUse: 'Part of the Traffic Stack. When creating blog posts, guides, or pillar content targeting specific keywords.',
        inputs: [
          'Target keyword(s) from Keyword Research',
          'Search intent (informational, transactional, commercial)',
          'Brand voice profile',
          'Topic expertise / unique perspective',
          'Competitor content for the same keyword',
        ],
        outputs: 'blog_posts, keyword_research',
        prerequisites: ['keyword-research', 'brand-voice'],
        skillStack: 'Traffic',
        primaryPrompt: 'Run the SEO Content skill now using the full methodology from your skill library. Audit the top-ranking competitor content for this keyword, match search intent to the right content format, write the complete 1500-2000 word post using the opening/body/closing formulas, pass all quality gates, and save to Supabase blog_posts.',
      },
      {
        id: 'content-atomizer',
        name: 'Content Atomizer',
        description: 'Transform one core content piece into 15+ platform-specific assets. Multiply reach without multiplying effort.',
        whenToUse: 'After creating any core content (blog post, video, case study, newsletter), or when building the Traffic or Nurture Stack.',
        inputs: [
          'Core content piece (the source material)',
          'Brand voice profile',
          'Target platforms (LinkedIn, Twitter/X, Instagram, email)',
          'Positioning angle (for consistency)',
        ],
        outputs: 'social_posts',
        prerequisites: ['brand-voice'],
        skillStack: 'Traffic',
        primaryPrompt: 'Run the Content Atomizer skill now using the full atomization matrix from your skill library. Identify or ask for the core content piece, then produce all 15+ platform-native assets — LinkedIn (4), Twitter/X (3), Instagram (3), Email (2), Video (2), plus bonus graphics. Each piece native to its platform. Save all to Supabase social_posts.',
      },
      {
        id: 'landing-pages',
        name: 'Landing Pages',
        description: 'Create landing pages that rank on Google AND convert visitors into leads and customers. Conversion copywriting balanced with search optimization.',
        whenToUse: 'When the client asks to create a landing page for a keyword, service, location, or product.',
        inputs: [
          'Target keyword (if SEO landing page)',
          'Service/product description',
          'Target location (if local/programmatic)',
          'Brand voice and positioning',
          'Target audience and conversion goal',
        ],
        outputs: 'blog_posts',
        prerequisites: ['brand-voice', 'positioning-angles'],
        skillStack: 'Conversion',
        primaryPrompt: 'Run the Landing Pages skill now using the full methodology from your skill library. Ask which page type is needed (SEO, programmatic, or campaign), apply the correct page architecture and copy framework for that type, include all required sections, and save to Supabase landing_pages.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CREATIVE — visual, video, and design assets
  // ─────────────────────────────────────────────────────────────
  {
    id: 'creative',
    label: 'Creative',
    icon: '🎨',
    color: 'bg-pink-100 text-pink-700',
    skills: [
      {
        id: 'ai-creative-strategist',
        name: 'AI Creative Strategist',
        description: 'Combine market research with creative direction to produce strategic briefs that drive measurable results. Bridge strategy (what to say) and creative (how to show it).',
        whenToUse: 'Before creating any visual or video assets, when launching ad campaigns, or when creative output needs to be research-informed.',
        inputs: [
          'Market research (from Perplexity/Firecrawl)',
          'Competitor creative analysis',
          'Brand voice profile + positioning angles',
          'Campaign goal (awareness, traffic, conversion)',
          'Target audience segments',
        ],
        outputs: 'creative_briefs',
        prerequisites: ['brand-voice', 'positioning-angles'],
        skillStack: 'Any',
        primaryPrompt: 'Run the AI Creative Strategist skill now using the full methodology from your skill library. Audit the competitive creative landscape, define the creative strategy, produce 3-5 distinct concepts each with platform, format, hook, visual direction, and ready-to-use Facebook ad copy (primary_text, headline, description with character limits enforced), then save the complete brief to Supabase creative_briefs.',
      },
      {
        id: 'ai-product-photo',
        name: 'AI Product Photo',
        description: 'Generate e-commerce-ready product photography — hero shots and lifestyle imagery — using AI image generation. Professional assets without a physical photo shoot.',
        whenToUse: 'When creating product pages, ads, or social content for e-commerce clients. Requires a creative brief first.',
        inputs: [
          'Creative brief (from AI Creative Strategist)',
          'Product description and key features',
          'Brand aesthetic (colors, style, mood)',
          'Target platform and dimensions',
          'Shot type (hero, lifestyle, detail, scale)',
        ],
        outputs: 'media_assets',
        prerequisites: ['ai-creative-strategist'],
        skillStack: 'Any',
        primaryPrompt: 'Run the AI Product Photo skill now using the full methodology from your skill library. Define the shot list across hero, lifestyle, detail, and scale shot types, generate the complete set of AI-ready prompts with platform dimension specs, and save all assets and briefs to Supabase media_assets.',
      },
      {
        id: 'ai-product-video',
        name: 'AI Product Video',
        description: 'Create product-focused motion content for ads and social media — product reveals, motion graphics, and demo-style content without traditional video production.',
        whenToUse: 'When creating video ads, social video content, or product reveal animations. Requires a creative brief first.',
        inputs: [
          'Creative brief (from AI Creative Strategist)',
          'Product imagery (from AI Product Photo or existing)',
          'Script or key messaging points',
          'Brand guidelines (fonts, colors, logo)',
          'Platform specs and duration',
        ],
        outputs: 'media_assets',
        prerequisites: ['ai-creative-strategist'],
        skillStack: 'Any',
        primaryPrompt: 'Run the AI Product Video skill now using the full methodology from your skill library. Select the right video type for this campaign, write the complete script with timing markers and visual direction, specify platform aspect ratios and duration variants, and save to Supabase media_assets.',
      },
      {
        id: 'ai-social-graphics',
        name: 'AI Social Graphics',
        description: 'Produce platform-optimized static visuals — LinkedIn graphics, Instagram carousels, YouTube thumbnails, quote cards, and infographics.',
        whenToUse: 'When creating social media assets, when atomizing content into visual formats, or when building the creative set from AI Creative Strategist briefs.',
        inputs: [
          'Creative brief or content to visualize',
          'Brand guidelines (colors, fonts, logo)',
          'Platform and format specifications',
          'Key message / headline',
        ],
        outputs: 'media_assets',
        prerequisites: ['ai-creative-strategist'],
        skillStack: 'Any',
        primaryPrompt: 'Run the AI Social Graphics skill now using the full methodology from your skill library. Produce platform-optimised visual briefs across all required formats — carousel structure, quote cards, thumbnails — with exact dimensions, copy, and colour specs for each. Save to Supabase media_assets.',
      },
      {
        id: 'ai-talking-head',
        name: 'AI Talking Head',
        description: 'Produce UGC-style presenter videos with AI-generated lip-sync. Scale video testimonials, explainers, and social content without filming.',
        whenToUse: 'When creating social proof videos, UGC-style ad content, or talking-head explainers. For clients who need video presence but lack filming capability.',
        inputs: [
          'Script (from Direct Response Copy or Email Sequences)',
          'Presenter style direction (professional, casual, energetic)',
          'Brand voice profile',
          'Platform and duration requirements',
        ],
        outputs: 'media_assets',
        prerequisites: [],
        skillStack: 'Any',
        primaryPrompt: 'Run the AI Talking Head skill now using the full methodology from your skill library. Select the right video style for this use case, write the complete 60-90 second script with hook, value delivery, and CTA, add pacing and emphasis cues, and save to Supabase media_assets.',
      },
      {
        id: 'frontend-design',
        name: 'Frontend Design',
        description: 'Create production-grade web pages with clean HTML/CSS. No AI artifact markers. Pages that look like a professional designer built them.',
        whenToUse: 'Part of the Conversion Stack. After copy is written (Direct Response Copy skill), when a client needs a landing page or sales page.',
        inputs: [
          'Completed copy (from Direct Response Copy)',
          'Brand guidelines (colors, fonts, logo)',
          'Positioning angle',
          'Reference sites or design direction',
          'Conversion goal',
        ],
        outputs: 'Supabase Storage (documents)',
        prerequisites: ['direct-response-copy'],
        skillStack: 'Conversion',
        primaryPrompt: 'Run the Frontend Design skill now using the full methodology from your skill library. Retrieve the approved copy, establish the design system (colors, typography, spacing), build the complete production-grade HTML/CSS page responsive at all four breakpoints, and save to Supabase Storage documents bucket.',
      },
      {
        id: 'dtc-ads',
        name: 'DTC Ad Creative',
        description: 'Generate complete ad creative briefs — strategy, hooks, copy, and visual direction — ready for a media buyer or designer to take straight to production.',
        whenToUse: 'When the client needs Meta, TikTok, YouTube, or Pinterest ads. For paid advertising campaigns across any DTC channel.',
        inputs: [
          'Product details and transformation',
          'Price point',
          'Target avatar (age, pain, aspiration)',
          'Platform (Meta, TikTok, YouTube, Pinterest)',
          'Campaign objective (cold traffic, retargeting, loyalty)',
          'Existing evidence (reviews, UGC, testimonials)',
        ],
        outputs: 'creative_briefs',
        prerequisites: ['brand-voice'],
        skillStack: 'Any',
        primaryPrompt: 'Run the DTC Ad Creative skill now using the full DTC Ads methodology from your skill library. Research competitor ads with Perplexity, apply the 4 conversion levers and 6 hook archetypes, produce 5 complete concepts across the required formats (static, carousel, ugc_video, short_video, story) each with platform, hook, visual direction, primary_text (max 125 chars), headline (max 27 chars), and description (max 27 chars). Save the complete brief to Supabase creative_briefs.',
      },
      {
        id: 'interactive-lead-magnets',
        name: 'Interactive Lead Magnets',
        description: 'Generate self-contained HTML assets — interactive quizzes, scorecards, calculators, and opt-in landing pages — that preview live in the dashboard.',
        whenToUse: 'When a user asks for a quiz, scorecard, assessment, calculator, or opt-in page. Part of the Conversion Stack after the Lead Magnet concept is defined.',
        inputs: [
          'Existing lead magnet record (from get_existing_content)',
          'Brand colors from brand_voices',
          'Tool type (quiz, scorecard, calculator)',
          'Questions or criteria data',
        ],
        outputs: 'lead_magnets (HTML to Storage)',
        prerequisites: ['lead-magnet'],
        skillStack: 'Conversion',
        primaryPrompt: 'Run the Interactive Lead Magnets skill now using the full methodology from your skill library. Call get_existing_content(\'lead_magnets\') first to get the leadMagnetId, then build both the interactive HTML tool and the opt-in landing page — 100% self-contained, zero external CDN links, mobile-first at 375px — and save both via save_lead_magnet_html().',
      },
    ],
  },
]

// ─── Helper functions ────────────────────────────────────────

export function getSkillById(id: string): SkillItem | undefined {
  for (const category of SKILLS_LIBRARY) {
    const skill = category.skills.find(s => s.id === id)
    if (skill) return skill
  }
  return undefined
}

export function getSkillCategory(skillId: string): SkillCategory | undefined {
  return SKILLS_LIBRARY.find(cat => cat.skills.some(s => s.id === skillId))
}

export function getTotalSkillCount(): number {
  return SKILLS_LIBRARY.reduce((sum, cat) => sum + cat.skills.length, 0)
}
