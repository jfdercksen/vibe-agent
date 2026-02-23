// ─────────────────────────────────────────────────────────────────────────────
// Skills Library — structured data for all marketing skills
//
// Data sourced from /skills/**/*.md files. Update this file when skills change.
// Used by the Skills Panel (right sidebar) in the Chat interface.
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
        primaryPrompt: 'Run the Orchestrator skill. Ask me about my marketing goal, business type, and what assets already exist, then recommend the right skill stack and execution sequence for this client.',
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
        primaryPrompt: 'Run the Brand Voice skill for this client. Research their industry, ask me about their personality, values, and communication style, then create a complete brand voice profile with tone guide, vocabulary list, dos and don\'ts, and writing rules. Save to Supabase.',
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
        primaryPrompt: 'Run the Positioning Angles skill. Research the competitive landscape with Perplexity and Firecrawl, identify the 3-5 strongest positioning angles available to this client, and build out the hooks, messaging frameworks, and psychological triggers for each. Save to Supabase.',
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
        primaryPrompt: 'Run the Keyword Research skill using DataForSEO. Find the top 50 keyword opportunities for this client — a mix of high-volume informational, commercial intent, and local keywords. Identify quick wins (low difficulty, decent volume). Save all to Supabase keyword_research table.',
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
        primaryPrompt: 'Run the Lead Magnet skill. Research what lead magnets convert best in this client\'s industry, then create the 3 strongest lead magnet concepts with titles, outlines, and opt-in page copy. We\'ll pick the winner together. Save to Supabase.',
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
        primaryPrompt: 'Run the Direct Response Copy skill. Write a complete high-converting landing page using proven frameworks — headline, subheadline, above-the-fold hook, benefits section, social proof, objection handling, and CTA. Strip all AI artifacts. Save to Supabase.',
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
        primaryPrompt: 'Run the Email Sequences skill. Write a complete 7-email welcome sequence. Each email has a clear role: (1) Welcome + quick win, (2) Our story, (3) Core value delivery, (4) Social proof + case study, (5) Objection handling, (6) Main offer, (7) Long-term nurture. Save sequence and all emails to Supabase.',
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
        primaryPrompt: 'Run the Newsletter skill. Research 3-5 relevant industry news items with Perplexity, add the client\'s expert insight on each, include one actionable tip, and end with a soft CTA. Use one of the 9 newsletter formats. Keep it under 400 words. Save to Supabase.',
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
        primaryPrompt: 'Run the SEO Content skill. Pick the best keyword opportunity from our research and write a complete 1500-2000 word SEO-optimised blog post with H2/H3 structure, meta description, internal linking suggestions, and a clear CTA. Remove all AI artifacts. Save to Supabase.',
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
        primaryPrompt: 'Run the Content Atomizer skill. Take the most recent piece of core content for this client (blog post, idea, or email) and transform it into 15+ platform-specific assets: LinkedIn posts, Twitter/X threads, Instagram captions, Facebook posts, and TikTok scripts. Each piece native to its platform. Save all to Supabase.',
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
        primaryPrompt: 'Run the Landing Pages skill. Create a complete SEO landing page for this client\'s main service. Include optimized headline, service description, benefits, social proof, FAQs, and a strong CTA. Balance conversion copy with search intent. Save to Supabase.',
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
        primaryPrompt: 'Run the AI Creative Strategist skill. Research the market, analyse top-performing ads in this niche, and produce a full creative strategy brief — big idea, messaging angle, visual direction, platform strategy, and 4-week rollout plan. Save to Supabase creative_briefs.',
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
        primaryPrompt: 'Run the AI Product Photo skill. Generate a set of 10 professional product photography prompts for this client\'s main product/service. Vary the style: studio, lifestyle, hero shot, detail shot. Each prompt ready to use in Midjourney or DALL-E.',
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
        primaryPrompt: 'Run the AI Product Video skill. Create a product video concept for this client\'s main product. Include shot list, script, motion direction, and platform-specific format recommendations. Save to Supabase media_assets.',
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
        primaryPrompt: 'Run the AI Social Graphics skill. Create platform-optimised visual content briefs for LinkedIn graphics, Instagram carousel slides, and a quote card. Include exact dimensions, copy, visual direction, and colour specs. Save creative briefs to Supabase.',
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
        primaryPrompt: 'Run the AI Talking Head skill. Write a 60-90 second talking head video script for this client. Hook in first 3 seconds, clear value delivery, strong CTA at the end. Formatted with cues for pacing and emphasis. Save to Supabase.',
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
        primaryPrompt: 'Run the Frontend Design skill. Take the approved landing page copy and turn it into a production-grade HTML/CSS page. Clean layout, no AI artifact design patterns, mobile responsive, fast loading. Save the HTML file to Supabase Storage documents bucket.',
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
        primaryPrompt: 'Run the DTC Ad Creative skill. Research top-performing ads in this niche, then create 5 complete ad concepts for Meta/Instagram. For each: hook, primary text, headline, description, and visual direction. Include a mix of angles: fear-based, desire-based, curiosity-based, social proof, and direct offer. Save to Supabase.',
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
        primaryPrompt: 'Create an interactive quiz for this client\'s lead magnet. First get the existing lead magnet details, then generate a self-contained HTML quiz with 5-10 questions, result outcomes, progress bar, and lead capture form. Use brand colors and mobile-first design. Save both the interactive tool and opt-in page.',
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
