export interface PromptItem {
  label: string      // Short label shown on the button
  prompt: string     // Full prompt sent to the AI
}

export interface PromptCategory {
  id: string
  label: string
  icon: string       // Emoji icon
  color: string      // Tailwind bg class for the category chip
  prompts: PromptItem[]
}

// Build the prompt library with the actual client name injected.
// Called from the UI component with the current client's display name.
export function buildPromptLibrary(clientName: string): PromptCategory[] {
  const c = clientName // shorthand for readability

  return [
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
        prompt: `Run the Orchestrator skill. Ask me about ${c}'s marketing goal, business type, and what assets already exist, then recommend the right skill stack and execution sequence.`,
      },
      {
        label: 'Foundation Stack',
        prompt: `Run the Foundation Stack for ${c} in sequence: (1) Research the market and competitors using Perplexity and Firecrawl, (2) Build the brand voice profile, (3) Define the positioning angles. Save every output to the dashboard. Take me through each stage.`,
      },
      {
        label: 'Conversion Stack',
        prompt: `Run the Conversion Stack for ${c}: (1) Write direct response landing page copy, (2) Design the frontend HTML/CSS page, (3) Create a lead magnet offer. Copy before design, always. Save all outputs to the dashboard.`,
      },
      {
        label: 'Traffic Stack',
        prompt: `Run the Traffic Stack for ${c}: (1) Run keyword research with DataForSEO, (2) Write SEO-optimised blog content for the best keyword, (3) Atomize that content into 15+ social assets. Save everything to the dashboard.`,
      },
      {
        label: 'Nurture Stack',
        prompt: `Run the Nurture Stack for ${c}: (1) Write a full email sequence, (2) Create a newsletter edition, (3) Atomize both into social content. Save all emails and posts to the dashboard.`,
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
        prompt: `Run the Brand Voice skill for ${c}. Research their industry, ask me about their personality, values, and communication style, then create a complete brand voice profile with tone guide, vocabulary list, dos and don'ts, and writing rules. Save to the dashboard.`,
      },
      {
        label: 'Positioning angles',
        prompt: `Run the Positioning Angles skill. Research the competitive landscape with Perplexity and Firecrawl, identify the 3-5 strongest positioning angles available to ${c}, and build out the hooks, messaging frameworks, and psychological triggers for each. Save to the dashboard.`,
      },
      {
        label: 'Competitor deep dive',
        prompt: `Use Firecrawl to scrape the websites of the top 5 competitors for ${c}. Analyse their messaging, offers, pricing, content strategy, and brand voice. Use Perplexity to find their social engagement. Give me a full gap analysis with opportunities we can exploit.`,
      },
      {
        label: 'Target audience research',
        prompt: `Research and define the ideal customer profile for ${c} using Perplexity. Find demographics, psychographics, pain points, desires, objections, and where they spend time online. Create 2-3 detailed buyer personas. Save insights to the dashboard.`,
      },
      {
        label: 'Market trends report',
        prompt: `Use Perplexity to research the top 5 trends shaping ${c}'s industry right now. For each trend, explain what it means for ${c} and suggest 2-3 content angles they can use to capitalise on it immediately.`,
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
        prompt: `Run the Content Atomizer skill. Take the most recent piece of core content for ${c} (blog post, idea, or email) and transform it into 15+ platform-specific assets: LinkedIn posts, Twitter/X threads, Instagram captions, Facebook posts, and TikTok scripts. Each piece native to its platform. Save all to the dashboard.`,
      },
      {
        label: '10 LinkedIn posts',
        prompt: `Write 10 high-performing LinkedIn posts for ${c}. Mix formats: thought leadership, how-to, story, statistics, contrarian take, and personal insight. Use the brand voice and positioning angles. Each post needs a hook, body, and CTA. Save all to the dashboard.`,
      },
      {
        label: 'Twitter/X thread',
        prompt: `Write a high-engagement Twitter/X thread (8-12 tweets) on the most relevant topic for ${c}. Start with a scroll-stopping hook tweet, build the argument tweet by tweet, finish with a CTA. Save to the dashboard.`,
      },
      {
        label: 'Instagram captions × 5',
        prompt: `Write 5 Instagram captions for ${c} — one educational carousel, one behind-the-scenes, one testimonial-style, one product/service highlight, and one motivational post. Include a full hashtag set for each. Save to the dashboard.`,
      },
      {
        label: 'Facebook posts × 5',
        prompt: `Write 5 Facebook posts for ${c} optimised for the Facebook algorithm — conversational tone, community-building focus, question-style or story format. Mix organic reach tactics with clear CTAs. Save to the dashboard.`,
      },
      {
        label: '30-day content calendar',
        prompt: `Create a full 30-day social media content calendar for ${c} across LinkedIn, Instagram, and Facebook. Plan the topics, post types, themes, and publishing schedule. Ensure variety: educational, entertaining, promotional, and community content. Save to the dashboard.`,
      },
      {
        label: '20 viral hook ideas',
        prompt: `Generate 20 viral-worthy content hook ideas for ${c} based on their positioning angles and audience pain points. Each hook must stop the scroll in the first 2 seconds. Categorise by platform and post type. Save to the dashboard.`,
      },
      {
        label: 'AI social graphics brief',
        prompt: `Run the AI Social Graphics skill. Create platform-optimised visual content briefs for ${c}: LinkedIn graphics, Instagram carousel slides, and a quote card. Include exact dimensions, copy, visual direction, and colour specs. Save to the dashboard.`,
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
        prompt: `Run the Keyword Research skill using DataForSEO. Find the top 50 keyword opportunities for ${c} — a mix of high-volume informational, commercial intent, and local keywords. Identify quick wins (low difficulty, decent volume). Save all to the dashboard.`,
      },
      {
        label: 'Write full SEO blog post',
        prompt: `Run the SEO Content skill. Pick the best keyword opportunity from our research and write a complete 1500-2000 word SEO-optimised blog post for ${c} with H2/H3 structure, meta description, internal linking suggestions, and a clear CTA. Remove all AI artifacts. Save to the dashboard.`,
      },
      {
        label: '3-month blog plan',
        prompt: `Create a 3-month blog content plan for ${c} with 12 article titles, target keywords, search intent classification, word count targets, and brief outlines for each. Prioritise by traffic potential and business relevance. Save to the dashboard.`,
      },
      {
        label: 'Pillar page outline',
        prompt: `Create a comprehensive pillar page outline for the most important topic cluster in ${c}'s niche. Include all main sections, sub-topics, supporting pages to link to, and a full keyword map. Save to the dashboard.`,
      },
      {
        label: 'Content gap analysis',
        prompt: `Use DataForSEO and Firecrawl to analyse what content the top 3 competitors rank for that ${c} doesn't. Identify the top 10 content gaps with the highest traffic potential. Rank by opportunity score.`,
      },
      {
        label: 'SERP analysis',
        prompt: `Use DataForSEO to analyse the top 10 Google results for ${c}'s 5 most important keywords. What content type ranks? What are the common topics, word counts, and structures? What gaps exist that we can beat them on?`,
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
        prompt: `Run the Email Sequences skill. Write a complete 7-email welcome sequence for ${c}. Each email has a clear role: (1) Welcome + quick win, (2) Our story, (3) Core value delivery, (4) Social proof + case study, (5) Objection handling, (6) Main offer, (7) Long-term nurture. Save sequence and all emails to the dashboard.`,
      },
      {
        label: '5-email nurture sequence',
        prompt: `Write a 5-email nurture sequence for ${c} leads who haven't converted yet. Address the main objections, provide genuine value, share a case study, build urgency, and make a compelling offer. Save the full sequence to the dashboard.`,
      },
      {
        label: 'Re-engagement sequence',
        prompt: `Write a 3-email re-engagement sequence for ${c}'s cold subscribers or past customers who haven't interacted in 90+ days. Be honest and human — acknowledge the silence, provide unexpected value, and give them a clear reason to come back. Save to the dashboard.`,
      },
      {
        label: 'Weekly newsletter',
        prompt: `Run the Newsletter skill for ${c}. Research 3-5 relevant industry news items with Perplexity, add expert insight on each, include one actionable tip, and end with a soft CTA. Use one of the 9 newsletter formats. Keep it under 400 words. Save to the dashboard.`,
      },
      {
        label: '5-email launch sequence',
        prompt: `Create a 5-email product or service launch sequence for ${c}: (1) Anticipation teaser, (2) Launch announcement, (3) Value/benefits deep dive, (4) Social proof + urgency, (5) Last chance. Save the full sequence to the dashboard.`,
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
        prompt: `Run the Direct Response Copy skill for ${c}. Write a complete high-converting landing page using proven frameworks — headline, subheadline, above-the-fold hook, benefits section, social proof, objection handling, and CTA. Strip all AI artifacts. Save to the dashboard.`,
      },
      {
        label: 'Lead magnet concept',
        prompt: `Run the Lead Magnet skill. Research what lead magnets convert best in ${c}'s industry, then create the 3 strongest lead magnet concepts with titles, outlines, and opt-in page copy. We'll pick the winner together. Save to the dashboard.`,
      },
      {
        label: 'Design the landing page',
        prompt: `Run the Frontend Design skill for ${c}. Take the approved landing page copy and turn it into a production-grade HTML/CSS page. Clean layout, no AI artifact design patterns, mobile responsive, fast loading. Save the HTML file to the dashboard.`,
      },
      {
        label: 'Ad copy × 5 variants',
        prompt: `Write 5 ad copy variants for ${c}'s main offer — fear-based, desire-based, curiosity-based, social proof-based, and direct offer. Write for Facebook/Instagram format with primary text, headline, and description. Save to the dashboard.`,
      },
      {
        label: 'Sales email',
        prompt: `Write a single high-converting sales email for ${c}'s main offer. Use a story opening, connect to the reader's pain, introduce the solution, stack the value, handle objections, and close with a clear CTA. Under 600 words. Save to the dashboard.`,
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
        prompt: `Run the AI Creative Strategist skill for ${c}. Research the market, analyse top-performing ads in this niche, and produce a full creative strategy brief — big idea, messaging angle, visual direction, platform strategy, and 4-week rollout plan. Save to the dashboard.`,
      },
      {
        label: 'Social graphics brief',
        prompt: `Run the AI Social Graphics skill for ${c}. Create detailed visual content briefs for LinkedIn banners, Instagram carousel slides, quote cards, and story templates. Include exact dimensions, copy, colour palette, and visual direction for each. Save to the dashboard.`,
      },
      {
        label: 'Product photo prompts',
        prompt: `Run the AI Product Photo skill. Generate a set of 10 professional product photography prompts for ${c}'s main product/service. Vary the style: studio, lifestyle, hero shot, detail shot. Each prompt ready to use in Midjourney or DALL-E.`,
      },
      {
        label: 'Video script (talking head)',
        prompt: `Run the AI Talking Head skill. Write a 60-90 second talking head video script for ${c}. Hook in first 3 seconds, clear value delivery, strong CTA at the end. Formatted with cues for pacing and emphasis. Save to the dashboard.`,
      },
      {
        label: 'Campaign concept',
        prompt: `Develop a full integrated campaign concept for ${c}. Include the big creative idea, campaign name, tagline, messaging across channels, content formats, platform breakdown, and a 4-week activation timeline. Save the creative brief to the dashboard.`,
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
        prompt: `Create a comprehensive 90-day marketing plan for ${c}. Break it into three 30-day phases with specific goals, skill stacks to run, content output targets, and KPIs for each phase. Prioritise highest ROI activities first.`,
      },
      {
        label: 'Review all content',
        prompt: `Review everything we've created for ${c} so far — pull the brand voice, positioning angles, social posts, blog posts, and email sequences from the dashboard. Give me a quality assessment: what's strong, what needs work, and what's missing. Then give me a prioritised next-steps list.`,
      },
      {
        label: 'Content audit',
        prompt: `Pull all content for ${c} and audit it. Check: Is the brand voice consistent? Are the positioning angles reflected? Are there any AI artifacts that need removing? Give me specific edits for any content that needs fixing.`,
      },
      {
        label: 'Quick wins list',
        prompt: `Looking at ${c}'s current situation, identify the 5 highest-impact marketing actions we could take in the next 7 days. Prioritise by effort vs impact. For each, tell me exactly which skill to run and what the expected outcome is.`,
      },
    ],
  },
]
}
