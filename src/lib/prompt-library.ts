export interface PromptItem {
  label: string      // Short label shown on the button
  prompt: string     // Full prompt sent to Claude
}

export interface PromptCategory {
  id: string
  label: string
  icon: string       // Emoji icon
  color: string      // Tailwind bg class for the category chip
  prompts: PromptItem[]
}

export const PROMPT_LIBRARY: PromptCategory[] = [
  // ─────────────────────────────────────────────────────────────
  // ORCHESTRATOR — always first, routes to the right skill stack
  // ─────────────────────────────────────────────────────────────
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    icon: '🎯',
    color: 'bg-violet-100 text-violet-700',
    prompts: [
      {
        label: 'Where do I start?',
        prompt: 'Run the Orchestrator skill. Ask me about my marketing goal, business type, and what assets already exist, then recommend the right skill stack and execution sequence for this client.',
      },
      {
        label: 'Foundation Stack',
        prompt: 'Run the Foundation Stack for this client in sequence: (1) Research the market and competitors using Perplexity and Firecrawl, (2) Build the brand voice profile, (3) Define the positioning angles. Save every output to Supabase. Take me through each stage.',
      },
      {
        label: 'Conversion Stack',
        prompt: 'Run the Conversion Stack for this client: (1) Write direct response landing page copy, (2) Design the frontend HTML/CSS page, (3) Create a lead magnet offer. Copy before design, always. Save all outputs to Supabase.',
      },
      {
        label: 'Traffic Stack',
        prompt: 'Run the Traffic Stack for this client: (1) Run keyword research with DataForSEO, (2) Write SEO-optimised blog content for the best keyword, (3) Atomize that content into 15+ social assets. Save everything to Supabase.',
      },
      {
        label: 'Nurture Stack',
        prompt: 'Run the Nurture Stack for this client: (1) Write a full email sequence, (2) Create a newsletter edition, (3) Atomize both into social content. Save all emails and posts to Supabase.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // FOUNDATION — brand voice, positioning, research
  // ─────────────────────────────────────────────────────────────
  {
    id: 'foundation',
    label: 'Foundation',
    icon: '🏗️',
    color: 'bg-blue-100 text-blue-700',
    prompts: [
      {
        label: 'Build brand voice',
        prompt: 'Run the Brand Voice skill for this client. Research their industry, ask me about their personality, values, and communication style, then create a complete brand voice profile with tone guide, vocabulary list, dos and don\'ts, and writing rules. Save to Supabase.',
      },
      {
        label: 'Positioning angles',
        prompt: 'Run the Positioning Angles skill. Research the competitive landscape with Perplexity and Firecrawl, identify the 3-5 strongest positioning angles available to this client, and build out the hooks, messaging frameworks, and psychological triggers for each. Save to Supabase.',
      },
      {
        label: 'Competitor deep dive',
        prompt: 'Use Firecrawl to scrape the websites of the top 5 competitors for this client. Analyse their messaging, offers, pricing, content strategy, and brand voice. Use Perplexity to find their social engagement. Give me a full gap analysis with opportunities we can exploit.',
      },
      {
        label: 'Target audience research',
        prompt: 'Research and define the ideal customer profile for this client using Perplexity. Find demographics, psychographics, pain points, desires, objections, and where they spend time online. Create 2-3 detailed buyer personas. Save insights to Supabase.',
      },
      {
        label: 'Market trends report',
        prompt: 'Use Perplexity to research the top 5 trends shaping this client\'s industry right now. For each trend, explain what it means for the client and suggest 2-3 content angles they can use to capitalise on it immediately.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SOCIAL MEDIA — Content Atomizer + platform-specific posts
  // ─────────────────────────────────────────────────────────────
  {
    id: 'social',
    label: 'Social Media',
    icon: '📱',
    color: 'bg-sky-100 text-sky-700',
    prompts: [
      {
        label: 'Atomize content (15+ posts)',
        prompt: 'Run the Content Atomizer skill. Take the most recent piece of core content for this client (blog post, idea, or email) and transform it into 15+ platform-specific assets: LinkedIn posts, Twitter/X threads, Instagram captions, Facebook posts, and TikTok scripts. Each piece native to its platform. Save all to Supabase.',
      },
      {
        label: '10 LinkedIn posts',
        prompt: 'Write 10 high-performing LinkedIn posts for this client. Mix formats: thought leadership, how-to, story, statistics, contrarian take, and personal insight. Use the brand voice and positioning angles. Each post needs a hook, body, and CTA. Save all to Supabase.',
      },
      {
        label: 'Twitter/X thread',
        prompt: 'Write a high-engagement Twitter/X thread (8-12 tweets) on the most relevant topic for this client. Start with a scroll-stopping hook tweet, build the argument tweet by tweet, finish with a CTA. Save to Supabase.',
      },
      {
        label: 'Instagram captions × 5',
        prompt: 'Write 5 Instagram captions for this client — one educational carousel, one behind-the-scenes, one testimonial-style, one product/service highlight, and one motivational post. Include a full hashtag set for each. Save to Supabase.',
      },
      {
        label: 'Facebook posts × 5',
        prompt: 'Write 5 Facebook posts for this client optimised for the Facebook algorithm — conversational tone, community-building focus, question-style or story format. Mix organic reach tactics with clear CTAs. Save to Supabase.',
      },
      {
        label: '30-day content calendar',
        prompt: 'Create a full 30-day social media content calendar for this client across LinkedIn, Instagram, and Facebook. Plan the topics, post types, themes, and publishing schedule. Ensure variety: educational, entertaining, promotional, and community content. Save to Supabase content_calendar.',
      },
      {
        label: '20 viral hook ideas',
        prompt: 'Generate 20 viral-worthy content hook ideas for this client based on their positioning angles and audience pain points. Each hook must stop the scroll in the first 2 seconds. Categorise by platform and post type. Save as content_ideas to Supabase.',
      },
      {
        label: 'AI social graphics brief',
        prompt: 'Run the AI Social Graphics skill. Create platform-optimised visual content briefs for LinkedIn graphics, Instagram carousel slides, and a quote card. Include exact dimensions, copy, visual direction, and colour specs. Save creative briefs to Supabase.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // SEO & BLOG — Keyword Research + SEO Content skill
  // ─────────────────────────────────────────────────────────────
  {
    id: 'seo',
    label: 'SEO & Blog',
    icon: '✍️',
    color: 'bg-green-100 text-green-700',
    prompts: [
      {
        label: 'Keyword research (50 kws)',
        prompt: 'Run the Keyword Research skill using DataForSEO. Find the top 50 keyword opportunities for this client — a mix of high-volume informational, commercial intent, and local keywords. Identify quick wins (low difficulty, decent volume). Save all to Supabase keyword_research table.',
      },
      {
        label: 'Write full SEO blog post',
        prompt: 'Run the SEO Content skill. Pick the best keyword opportunity from our research and write a complete 1500-2000 word SEO-optimised blog post with H2/H3 structure, meta description, internal linking suggestions, and a clear CTA. Remove all AI artifacts. Save to Supabase.',
      },
      {
        label: '3-month blog plan',
        prompt: 'Create a 3-month blog content plan with 12 article titles, target keywords, search intent classification, word count targets, and brief outlines for each. Prioritise by traffic potential and business relevance. Save outlines to Supabase blog_posts.',
      },
      {
        label: 'Pillar page outline',
        prompt: 'Create a comprehensive pillar page outline for the most important topic cluster in this client\'s niche. Include all main sections, sub-topics, supporting pages to link to, and a full keyword map. Save to Supabase.',
      },
      {
        label: 'Content gap analysis',
        prompt: 'Use DataForSEO and Firecrawl to analyse what content the top 3 competitors rank for that this client doesn\'t. Identify the top 10 content gaps with the highest traffic potential. Rank by opportunity score.',
      },
      {
        label: 'SERP analysis',
        prompt: 'Use DataForSEO to analyse the top 10 Google results for this client\'s 5 most important keywords. What content type ranks? What are the common topics, word counts, and structures? What gaps exist that we can beat them on?',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // EMAIL — Email Sequences + Newsletter skill
  // ─────────────────────────────────────────────────────────────
  {
    id: 'email',
    label: 'Email',
    icon: '📧',
    color: 'bg-amber-100 text-amber-700',
    prompts: [
      {
        label: '7-email welcome sequence',
        prompt: 'Run the Email Sequences skill. Write a complete 7-email welcome sequence. Each email has a clear role: (1) Welcome + quick win, (2) Our story, (3) Core value delivery, (4) Social proof + case study, (5) Objection handling, (6) Main offer, (7) Long-term nurture. Save sequence and all emails to Supabase.',
      },
      {
        label: '5-email nurture sequence',
        prompt: 'Write a 5-email nurture sequence for leads who haven\'t converted yet. Address the main objections, provide genuine value, share a case study, build urgency, and make a compelling offer. Save the full sequence to Supabase.',
      },
      {
        label: 'Re-engagement sequence',
        prompt: 'Write a 3-email re-engagement sequence for cold subscribers or past customers who haven\'t interacted in 90+ days. Be honest and human — acknowledge the silence, provide unexpected value, and give them a clear reason to come back. Save to Supabase.',
      },
      {
        label: 'Weekly newsletter',
        prompt: 'Run the Newsletter skill. Research 3-5 relevant industry news items with Perplexity, add the client\'s expert insight on each, include one actionable tip, and end with a soft CTA. Use one of the 9 newsletter formats. Keep it under 400 words. Save to Supabase.',
      },
      {
        label: '5-email launch sequence',
        prompt: 'Create a 5-email product or service launch sequence: (1) Anticipation teaser, (2) Launch announcement, (3) Value/benefits deep dive, (4) Social proof + urgency, (5) Last chance. Save the full sequence to Supabase.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CONVERSION — Direct Response Copy + Lead Magnet + Design
  // ─────────────────────────────────────────────────────────────
  {
    id: 'conversion',
    label: 'Conversion',
    icon: '💰',
    color: 'bg-red-100 text-red-700',
    prompts: [
      {
        label: 'Landing page copy',
        prompt: 'Run the Direct Response Copy skill. Write a complete high-converting landing page using proven frameworks — headline, subheadline, above-the-fold hook, benefits section, social proof, objection handling, and CTA. Strip all AI artifacts. Save to Supabase.',
      },
      {
        label: 'Lead magnet concept',
        prompt: 'Run the Lead Magnet skill. Research what lead magnets convert best in this client\'s industry, then create the 3 strongest lead magnet concepts with titles, outlines, and opt-in page copy. We\'ll pick the winner together. Save to Supabase.',
      },
      {
        label: 'Design the landing page',
        prompt: 'Run the Frontend Design skill. Take the approved landing page copy and turn it into a production-grade HTML/CSS page. Clean layout, no AI artifact design patterns, mobile responsive, fast loading. Save the HTML file to Supabase Storage documents bucket.',
      },
      {
        label: 'Ad copy × 5 variants',
        prompt: 'Write 5 ad copy variants for this client\'s main offer — fear-based, desire-based, curiosity-based, social proof-based, and direct offer. Write for Facebook/Instagram format with primary text, headline, and description. Save as content_ideas to Supabase.',
      },
      {
        label: 'Sales email',
        prompt: 'Write a single high-converting sales email for this client\'s main offer. Use a story opening, connect to the reader\'s pain, introduce the solution, stack the value, handle objections, and close with a clear CTA. Under 600 words. Save to Supabase.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CREATIVE — AI Creative Strategist + visual/video assets
  // ─────────────────────────────────────────────────────────────
  {
    id: 'creative',
    label: 'Creative',
    icon: '🎨',
    color: 'bg-pink-100 text-pink-700',
    prompts: [
      {
        label: 'Creative strategy brief',
        prompt: 'Run the AI Creative Strategist skill. Research the market, analyse top-performing ads in this niche, and produce a full creative strategy brief — big idea, messaging angle, visual direction, platform strategy, and 4-week rollout plan. Save to Supabase creative_briefs.',
      },
      {
        label: 'Social graphics brief',
        prompt: 'Run the AI Social Graphics skill. Create detailed visual content briefs for LinkedIn banners, Instagram carousel slides, quote cards, and story templates. Include exact dimensions, copy, colour palette, and visual direction for each. Save to Supabase.',
      },
      {
        label: 'Product photo prompts',
        prompt: 'Run the AI Product Photo skill. Generate a set of 10 professional product photography prompts for this client\'s main product/service. Vary the style: studio, lifestyle, hero shot, detail shot. Each prompt ready to use in Midjourney or DALL-E.',
      },
      {
        label: 'Video script (talking head)',
        prompt: 'Run the AI Talking Head skill. Write a 60-90 second talking head video script for this client. Hook in first 3 seconds, clear value delivery, strong CTA at the end. Formatted with cues for pacing and emphasis. Save to Supabase.',
      },
      {
        label: 'Campaign concept',
        prompt: 'Develop a full integrated campaign concept for this client. Include the big creative idea, campaign name, tagline, messaging across channels, content formats, platform breakdown, and a 4-week activation timeline. Save the creative brief to Supabase.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // STRATEGY — planning, review, optimisation
  // ─────────────────────────────────────────────────────────────
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '🗺️',
    color: 'bg-orange-100 text-orange-700',
    prompts: [
      {
        label: '90-day marketing plan',
        prompt: 'Create a comprehensive 90-day marketing plan for this client. Break it into three 30-day phases with specific goals, skill stacks to run, content output targets, and KPIs for each phase. Prioritise highest ROI activities first.',
      },
      {
        label: 'Review all content',
        prompt: 'Review everything we\'ve created for this client so far — pull the brand voice, positioning angles, social posts, blog posts, and email sequences from Supabase. Give me a quality assessment: what\'s strong, what needs work, and what\'s missing. Then give me a prioritised next-steps list.',
      },
      {
        label: 'Content audit',
        prompt: 'Pull all content from Supabase for this client and audit it. Check: Is the brand voice consistent? Are the positioning angles reflected? Are there any AI artifacts that need removing? Give me specific edits for any content that needs fixing.',
      },
      {
        label: 'Quick wins list',
        prompt: 'Looking at this client\'s current situation, identify the 5 highest-impact marketing actions we could take in the next 7 days. Prioritise by effort vs impact. For each, tell me exactly which skill to run and what the expected outcome is.',
      },
    ],
  },
]
