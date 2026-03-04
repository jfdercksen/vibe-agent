// All tool definitions for the Claude API chat
// These replace CLI MCPs and skills in the web app context
// Claude calls these tools during chat — server executes them

import Anthropic from '@anthropic-ai/sdk'

export const ALL_TOOLS: Anthropic.Tool[] = [
  // ─── MCP BRIDGE TOOLS ─────────────────────────────────────────────────────

  {
    name: 'perplexity_search',
    description: `Search the web for real-time market research, trends, competitor intelligence, and audience insights using Perplexity AI.
Use this for:
- Market landscape research
- Competitor positioning analysis
- Audience pain point discovery
- Industry trends and news
- Pricing intelligence
Always use this BEFORE writing any copy or strategy to ground outputs in real data.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Detailed search query. Be specific — include industry, audience, geography as relevant.',
        },
        focus: {
          type: 'string',
          enum: ['web', 'news', 'finance', 'academic'],
          description: 'Search focus. Use "news" for recent events, "web" for general research.',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'firecrawl_scrape',
    description: `Scrape a single webpage and extract its full content as clean markdown.
Use this for:
- Scraping a competitor's homepage, pricing page, or about page
- Extracting copy from a sales page
- Reading content from a specific URL provided by the user
Returns title, full markdown content, and word count.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Full URL to scrape (must include https://)',
        },
      },
      required: ['url'],
    },
  },

  {
    name: 'firecrawl_crawl',
    description: `Crawl an entire website and scrape multiple pages at once.
Use this for:
- Deep competitor analysis (scrape their whole site)
- Understanding a client's full content library
- Mapping a competitor's content strategy
Returns all pages as markdown. Use sparingly — max 10 pages at a time.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Base URL of the website to crawl',
        },
        maxPages: {
          type: 'number',
          description: 'Maximum pages to crawl (default 5, max 10)',
        },
      },
      required: ['url'],
    },
  },

  {
    name: 'dataforseo_keywords',
    description: `Get keyword search volume, CPC, competition, and difficulty data from DataForSEO.
Use this for:
- Validating keyword opportunities before writing content
- Finding the best keyword variations to target
- Understanding search intent for content planning
Returns volume, CPC, difficulty (low/medium/high), and search intent.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of keywords to look up (max 20 at a time)',
        },
        locationCode: {
          type: 'number',
          description: 'Location code (default: 2840 = United States). South Africa = 2710.',
        },
      },
      required: ['keywords'],
    },
  },

  {
    name: 'dataforseo_serp',
    description: `Check Google search results for a specific keyword to see who is currently ranking.
Use this for:
- Competitor ranking analysis
- Understanding what content ranks for target keywords
- Finding content gaps and opportunities
Returns top 10 organic results with titles, URLs, and descriptions.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to check rankings for',
        },
        locationCode: {
          type: 'number',
          description: 'Location code (default: 2840 = United States)',
        },
      },
      required: ['keyword'],
    },
  },

  {
    name: 'dataforseo_keyword_suggestions',
    description: `Get keyword suggestions and related keywords based on a seed keyword.
Use this for:
- Expanding keyword research
- Finding long-tail variations
- Discovering content pillar topics
Returns up to 20 related keywords with volume and difficulty data.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        seedKeyword: {
          type: 'string',
          description: 'The main keyword to expand from',
        },
        limit: {
          type: 'number',
          description: 'Number of suggestions to return (default 20)',
        },
      },
      required: ['seedKeyword'],
    },
  },

  // ─── SUPABASE DATA TOOLS ──────────────────────────────────────────────────

  {
    name: 'start_batch',
    description: `Generate a batch ID before saving a set of atomized social posts.
CALL THIS ONCE at the very start of a Content Atomizer run, then pass the returned
batch_id and batch_label into EVERY save_content('social_posts', {...}) call in the batch.

This groups all posts from the same atomization run together so they can be
reviewed side-by-side in the dashboard as a cohesive campaign.

⚠️ NEVER save atomized posts without batch_id — they become ungroupable orphans.
⚠️ Use the SAME batch_id for ALL posts in one atomizer run.
⚠️ Generate a NEW batch_id for each new atomizer run — never reuse a previous one.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        label: {
          type: 'string',
          description: 'Short human-readable label for this batch, max 60 chars. E.g. "Blog: How to scale revenue" or "Podcast: EP42 – Growth hacks"',
        },
      },
      required: ['label'],
    },
  },

  {
    name: 'save_content',
    description: `Save generated content to the Supabase database.
Use this after creating any content asset to persist it for the client.
The content will immediately appear in the dashboard.

⚠️ EXACT COLUMN NAMES — you MUST use these exact field names. Do NOT invent columns that don't exist.

brand_voices columns: client_id, personality_traits (JSONB array of strings), voice_dimensions (JSONB object: {formal_casual, reserved_bold, serious_playful, technical_simple} — numeric 1-10), vocabulary_embrace (text[]), vocabulary_avoid (text[]), anti_positioning (text), channel_notes (JSONB: {website, email, phone, linkedin, ads}), sample_on_brand (text[]), sample_off_brand (text[]), full_document (text — the complete brand voice document), is_active (boolean default true)
⚠️ brand_voices does NOT have: name, voice_name, brand_name, tone_description, sample_content, is_primary, tone, style

content_ideas columns: client_id, title (required), description, idea_type ("social"|"blog"|"email"|"video"|"lead_magnet"|"ad"|"other"), source_type ("prompt"|"voice_note"|"research"|"atomized"|"manual"), source_content, platforms (text[]), priority ("high"|"medium"|"low"), status, positioning_angle_id (uuid), tags (text[]), due_date
⚠️ content_ideas does NOT have: content_type, idea_source, category, keyword, url

positioning_angles columns: client_id, angle_number (int 1-5), framework, core_hook, psychology, headline_directions (text[]), anti_angle, risk, is_selected (boolean), score (JSONB: {differentiation, risk, memorability}), full_document

keyword_research columns: client_id, keyword (required), search_volume (int), cpc (decimal), difficulty ("low"|"medium"|"high"), search_intent ("informational"|"transactional"|"navigational"|"commercial"), competitor_ranking, content_pillar, priority (1-5), is_quick_win (boolean), status, blog_post_id, data_source, raw_data (JSONB)

social_posts columns: client_id, content_idea_id (uuid, optional), platform (required: "linkedin"|"twitter"|"instagram"|"facebook"|"pinterest"|"tiktok"|"youtube"|"reddit"), post_type ("text"|"image"|"carousel"|"reel"|"story"|"thread"|"poll"|"video"|"quote_card"), hook (text — the opening line), body (text, required — the main post content), cta (text — call to action), hashtags (text[]), character_count (int), image_prompt (text), image_url (text — primary/first image), image_urls (text[] — multiple images for carousels; image_url should always equal image_urls[0]), video_url (text), status, scheduled_for (timestamptz), batch_id (uuid), batch_label (text)
⚠️ social_posts does NOT have: content, caption, cta_text, title, description, message, copy, post_content, text

⚠️ STATUS VALUES — each table has its own allowed values:
- blog_posts: "outline" | "drafting" | "review" | "approved" | "published" | "archived"
- keyword_research: "identified" | "planned" | "in_progress" | "published"
- social_posts: "draft" | "review" | "approved" | "scheduled" | "published" | "rejected"
- email_sequences: "draft" | "review" | "approved" | "active" | "paused"
- emails: "draft" | "review" | "approved" | "sent"
- content_ideas: "idea" | "researching" | "drafting" | "review" | "approved" | "published" | "archived"
- content_calendar: "planned" | "created" | "scheduled" | "published" | "missed"
- lead_magnets: "concept" | "drafting" | "review" | "live" | "retired"
- creative_briefs: "draft" | "review" | "approved" | "in_production" | "complete"

IMPORTANT — EMAIL SEQUENCES require a two-step save:
1. Save the sequence first: save_content('email_sequences', { client_id, sequence_name, sequence_type, trigger_event, total_emails, status: 'draft' })
   → The result contains { id: '<sequence_uuid>' } — capture this ID.
2. Save each email: save_content('emails', { sequence_id: '<id from step 1>', client_id, email_number, subject_line, preview_text, body_text, cta_text, cta_url, send_day, status: 'draft' })
   → NEVER save emails without sequence_id — it will fail with a foreign key error.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          enum: [
            'social_posts', 'blog_posts', 'email_sequences', 'emails',
            'content_ideas', 'brand_voices', 'positioning_angles',
            'keyword_research', 'content_calendar', 'lead_magnets',
            'creative_briefs', 'media_assets', 'landing_pages',
          ],
          description: 'Database table to save to',
        },
        data: {
          type: 'object',
          description: 'The record data to save. Must include client_id. Use the correct status value for the target table (see tool description).',
        },
      },
      required: ['table', 'data'],
    },
  },

  {
    name: 'update_client',
    description: `Update the current client's profile in the database.
Use this to save ANY information the client tells you about their business:
- name, display_name — update client name
- business_type — 'info_education', 'consulting_agency', 'ecommerce', 'saas', 'other'
- industry — their industry/niche
- website — their website URL
- target_audience — who they serve
- primary_goal — their main business goal
- competitors — array of competitor names or URLs
- branding — { primaryColor, secondaryColor, logo_url }

Call this as soon as the client shares any of this info during Stage 1.
Do NOT wait until the end of the conversation — save incrementally.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        data: {
          type: 'object',
          description: 'Fields to update on the client record. Only include fields that changed.',
        },
      },
      required: ['data'],
    },
  },

  {
    name: 'update_content',
    description: `Update an existing record in the database.
Use this to:
- Update status (draft → review → approved → published)
- Apply client-requested revisions
- Mark positioning angles as selected
- Update any content record

Valid tables: social_posts, blog_posts, email_sequences, emails, content_ideas,
brand_voices, positioning_angles, keyword_research, lead_magnets, creative_briefs`,
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          description: 'Database table to update',
        },
        id: {
          type: 'string',
          description: 'UUID of the record to update',
        },
        data: {
          type: 'object',
          description: 'Fields to update',
        },
      },
      required: ['table', 'id', 'data'],
    },
  },

  {
    name: 'get_existing_content',
    description: `Retrieve existing content from the database for a client.
Use this to:
- Check what content already exists before creating more
- Load existing brand voice or positioning when writing copy
- Review recent posts to avoid repetition
- Load email sequences to add to them`,
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          enum: [
            'social_posts', 'blog_posts', 'email_sequences', 'emails',
            'content_ideas', 'brand_voices', 'positioning_angles',
            'keyword_research', 'content_calendar', 'lead_magnets',
            'creative_briefs', 'landing_pages',
          ],
          description: 'Table to retrieve from',
        },
        limit: {
          type: 'number',
          description: 'Max records to return (default 20)',
        },
      },
      required: ['table'],
    },
  },

  // ─── IMAGE GENERATION TOOLS ───────────────────────────────────────────────

  {
    name: 'generate_image',
    description: `Generate AI images using the best model for the use case.
Images are automatically saved to the client's Media Library in Supabase Storage.

DEFAULT ROUTING — Kie.ai models (cheaper, high quality):
- general        → Flux-2 Pro via Kie.ai (photorealistic, great all-round)
- product_photo  → Flux-2 Pro via Kie.ai (clean studio-style product shots)
- blog_header    → Flux-2 Pro via Kie.ai (wide 16:9 editorial imagery)
- ad_creative    → Nano Banana 2 via Kie.ai (Gemini Flash, UGC-style, 4:5)
- social_graphic → GPT Image 1.5 via Kie.ai (BEST text rendering — use for any graphic with text)
- logo           → Recraft V4 via Replicate (vectors, brand marks, logos)

PROMPT ENGINEERING — always write Dense Narrative prompts:
- Camera math: "85mm lens, f/1.8, ISO 200"
- Material physics: "brushed anodized aluminum, directional grain, specular highlight at 30°"
- Inline negatives: "Do not beautify. No skin smoothing. No CGI."
- Specific imperfections for people: "visible pores, mild redness, light freckles"

ALWAYS call this when the user asks to:
- "Generate an image for..."
- "Create a visual for..."
- "Make a photo of..."
- "Design a graphic for..."
- "Add an image to this post/blog/email"

Write detailed Dense Narrative prompts. Include: subject, material physics, camera math, lighting behaviour, inline negative commands.
Always mention brand colors if known. Generate 2-4 variations so user can choose.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed image generation prompt. Be specific about subject, style, lighting, mood, colors, composition. 50-200 words for best results.',
        },
        useCase: {
          type: 'string',
          enum: ['product_photo', 'social_graphic', 'logo', 'blog_header', 'ad_creative', 'general'],
          description: 'The use case determines which AI model is selected. Choose the most specific match.',
        },
        negativePrompt: {
          type: 'string',
          description: 'Things to avoid in the image (e.g. "blurry, text, watermark, low quality, distorted")',
        },
        numImages: {
          type: 'number',
          description: 'Number of variations to generate (default 2, max 4)',
        },
        altText: {
          type: 'string',
          description: 'Alt text / accessibility description for the saved image',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the media library entry (e.g. ["hero", "product", "instagram"])',
        },
        referenceTable: {
          type: 'string',
          description: 'If generating for a specific content piece, the table name (e.g. "blog_posts", "social_posts")',
        },
        referenceId: {
          type: 'string',
          description: 'The UUID of the content piece this image is for',
        },
      },
      required: ['prompt', 'useCase'],
    },
  },

  {
    name: 'unsplash_search',
    description: `Search Unsplash for high-quality stock photos and optionally import them to the client's Media Library.
Use this when the user wants real photography rather than AI-generated images, or when you need a quick stock image.

Good for:
- Finding lifestyle/people photos
- Background images
- Nature, city, abstract photography
- When AI generation isn't needed

Always import the chosen photo to the Media Library after presenting options to the user.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for Unsplash (e.g. "coffee shop morning", "business meeting", "abstract blue")',
        },
        orientation: {
          type: 'string',
          enum: ['landscape', 'portrait', 'squarish'],
          description: 'Image orientation (landscape for blog headers, squarish for social, portrait for ads)',
        },
        importPhotoId: {
          type: 'string',
          description: 'If provided, import this specific photo ID to the media library',
        },
        importPhotoUrl: {
          type: 'string',
          description: 'Regular-size URL of the photo to import',
        },
        importDownloadLocation: {
          type: 'string',
          description: 'Download location URL for the photo (required for Unsplash API compliance)',
        },
        importDescription: {
          type: 'string',
          description: 'Alt text / description for the imported photo',
        },
        clientId: {
          type: 'string',
          description: 'Client ID for saving to media library',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'edit_image',
    description: `Edit an existing image using AI by giving plain-English instructions.
Uses Nano Banana Pro (Google Gemini 3 Pro Image) by default — the most powerful semantic image editor.
Alternatives: FLUX Kontext Pro for precise style/object changes, Recraft V4 for logo variations and vector-style edits.

Use this when the user wants to:
- Change the background ("make the background white", "put it on a beach")
- Change colors ("make the shirt red", "turn sky golden")
- Add or remove elements ("remove the person on the right", "add a coffee cup")
- Change style ("make it look like a watercolor painting", "add dramatic lighting")
- Adjust mood/atmosphere ("make it look more luxurious", "warmer lighting")
- Create logo or brand mark variations → use editModel: "recraft"

Always edit from an existing image URL (from Media Library or any public URL).
Edited images are automatically saved to the client's Media Library.
Generate 2 variations so the user can choose.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        imageUrl: {
          type: 'string',
          description: 'The URL of the image to edit (must be publicly accessible)',
        },
        instruction: {
          type: 'string',
          description: 'Plain-English edit instruction. Be specific: "Change the background to a white studio backdrop with soft shadows" is better than "change background".',
        },
        editModel: {
          type: 'string',
          enum: ['nano_banana', 'flux_kontext', 'kieai_flux', 'recraft'],
          description: 'Edit engine to use. nano_banana = Nano Banana Pro fal.ai (best semantic understanding, default). flux_kontext = FLUX Kontext Pro fal.ai (precise object/style changes). kieai_flux = Flux-2 Pro Kie.ai (cheaper style transfer and background swaps). recraft = Recraft V4 via Replicate (best for logo variations, style transfer, vector-style edits).',
        },
        resolution: {
          type: 'string',
          enum: ['1K', '2K', '4K'],
          description: 'Output resolution for Nano Banana (default 1K). 4K is charged at 2× rate.',
        },
        numImages: {
          type: 'number',
          description: 'Number of edit variations to generate (default 2, max 4)',
        },
      },
      required: ['imageUrl', 'instruction'],
    },
  },

  // ─── CRM TOOLS ────────────────────────────────────────────────────────────────

  {
    name: 'crm_search',
    description: `Search the client's Vtiger CRM for an existing lead or contact by phone number or email.
Use this when the user asks about a specific person, customer, or lead in their CRM.
Returns their name, company, status, lead number, and notes if found.
If not found, returns null — they are not yet in the CRM.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number to search (any format — +27, 027, or 27 prefix all work)',
        },
        email: {
          type: 'string',
          description: 'Email address to search',
        },
      },
    },
  },

  {
    name: 'crm_create_lead',
    description: `Create a new Lead record in the client's Vtiger CRM.
Use this when a new prospect is identified and needs to be captured in the CRM.
firstname and lastname are required. All other fields are optional.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        firstname: { type: 'string', description: 'First name (required)' },
        lastname: { type: 'string', description: 'Last name (required)' },
        company: { type: 'string', description: 'Company name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        mobile: { type: 'string', description: 'Mobile number' },
        description: { type: 'string', description: 'Notes or description about this lead' },
        leadsource: { type: 'string', description: 'Lead source e.g. "Web Site", "WhatsApp", "Referral"' },
        leadstatus: { type: 'string', description: 'Lead status e.g. "New", "Hot", "In Progress"' },
      },
      required: ['firstname', 'lastname'],
    },
  },

  {
    name: 'crm_update_record',
    description: `Update fields on an existing Lead or Contact in the client's Vtiger CRM.
Use this when the user asks to change a field on a CRM record — status, description, phone, etc.
You must have the recordId (full Vtiger ID e.g. "4x123") — get it first from crm_search if needed.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        record_id: {
          type: 'string',
          description: 'Full Vtiger record ID e.g. "4x123" — get from crm_search first',
        },
        updates: {
          type: 'object',
          description: 'Key-value pairs of fields to update e.g. { "leadstatus": "Converted", "description": "..." }',
        },
      },
      required: ['record_id', 'updates'],
    },
  },

  {
    name: 'crm_add_note',
    description: `Add a note or comment to an existing Lead or Contact in the client's Vtiger CRM.
Use this to log interactions, follow-up reminders, or any important information about a contact.
You must have the recordId — get it from crm_search if needed.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        record_id: {
          type: 'string',
          description: 'Full Vtiger record ID e.g. "4x123"',
        },
        note: {
          type: 'string',
          description: 'The note text to add to this record',
        },
      },
      required: ['record_id', 'note'],
    },
  },

  // ─── MODEL SWITCHING ──────────────────────────────────────────────────────────

  {
    name: 'switch_model',
    description: `Switch the AI model used for the remainder of this conversation.
Call this FIRST (before any other tool) whenever you can judge the task complexity.

Available models — choose based on what the task actually needs:

• claude-haiku-4-5 — Fast, cheap, accurate for simple tasks.
  Use for: CRM lookups, saving/updating records, quick Q&A, formatting output,
  loading existing content, onboarding stage updates, any single-step operation.

• claude-sonnet-4-5 — Balanced power and speed.
  Use for: moderate content tasks (single social post, short email, editing existing
  copy), multi-step pipelines that don't need heavy research.

• claude-opus-4-5 — Most capable. Use when quality matters most.
  Use for: deep market research, full brand voice creation, positioning angles,
  long-form SEO articles, email sequences, campaign strategy, complex multi-tool
  workflows, anything where nuance and creativity are critical.

RULES:
- Default is Opus. Only switch DOWN when you are confident the task is simple.
- Switch UP if you started on Haiku/Sonnet and realise the task is more complex.
- You can switch multiple times in one conversation.
- Always call switch_model as the VERY FIRST tool in your response when switching.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        model: {
          type: 'string',
          enum: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-opus-4-5'],
          description: 'The AI model to use for subsequent API calls in this session',
        },
        reason: {
          type: 'string',
          description: 'One-line reason for switching — shown in the UI (e.g. "Simple CRM lookup — using Haiku")',
        },
      },
      required: ['model', 'reason'],
    },
  },

  // ─── WHATSAPP TOOLS ───────────────────────────────────────────────────────────

  {
    name: 'generate_whatsapp_prompt',
    description: `Generate a comprehensive WhatsApp AI agent system prompt for the current client.
This crawls the client's website, uses their brand voice and positioning data, and generates
a complete, customised system prompt ready to use — knowledge base baked in.

Use this when the user says things like:
- "Build the WhatsApp agent prompt"
- "Generate the agent prompt"
- "Create the WhatsApp chatbot prompt"
- "Set up the WhatsApp agent"

The prompt will be automatically saved to the client's WhatsApp integration settings.
It includes: identity, knowledge base, tone, customer handling, lead qualification, guardrails, handover triggers, and CRM instructions.

This operation takes 1-3 minutes (website crawl + AI generation). Tell the user upfront.`,
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },

  {
    name: 'update_onboarding_stage',
    description: `Advance the client's onboarding to the next stage.
Call this when a stage is fully complete and approved by the client.
Stages: 1=Discovery, 2=Research, 3=Brand Voice, 4=Positioning, 5=Content Kickoff, complete=true`,
    input_schema: {
      type: 'object' as const,
      properties: {
        stage: {
          type: 'number',
          description: 'Stage number to advance to (1-5)',
        },
        completed: {
          type: 'boolean',
          description: 'Set to true when all 5 stages are done',
        },
      },
      required: ['stage'],
    },
  },

  {
    name: 'save_lead_magnet_html',
    description: `Upload a self-contained HTML file to Supabase Storage and link it to a lead magnet record.

Use this after generating a complete HTML interactive tool (quiz, scorecard, assessment, calculator)
OR a complete HTML opt-in/landing page for a lead magnet.

TWO VALID htmlType values:
- "interactive"  → the quiz, scorecard, assessment, or calculator HTML tool
- "optin_page"   → the opt-in landing page HTML (headline, bullets, form placeholder, CTA)

WORKFLOW:
1. Call get_existing_content('lead_magnets') FIRST to get the leadMagnetId and copy fields
2. Generate the complete, self-contained HTML as a string
3. Call this tool with the full HTML string, the lead magnet UUID, and the htmlType
4. This uploads the HTML to Supabase Storage (documents bucket) and updates the lead_magnets record
5. The returned signed URL is immediately previewable in the dashboard via iframe
6. Confirm: "Your [interactive tool / opt-in page] is live — view it in the Lead Magnets tab."

REQUIREMENTS for htmlContent:
- Must be a COMPLETE, valid HTML document (<!DOCTYPE html> through </html>)
- All CSS must be embedded in a <style> tag in the <head> — NO external stylesheets
- All JavaScript must be in <script> tags — NO external CDN links, NO jQuery, NO frameworks
- Vanilla JS only. Must work offline with zero external dependencies.
- Mobile-first responsive — works correctly at 375px width, no horizontal scroll
- Font: system-ui, -apple-system, sans-serif (avoids external font requests)
- Touch-friendly: minimum 44px button height

GENERATE BOTH assets in one conversation turn when possible:
1. Generate interactive tool HTML → call save_lead_magnet_html(htmlType: 'interactive')
2. Generate opt-in page HTML → call save_lead_magnet_html(htmlType: 'optin_page')`,
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: {
          type: 'string',
          description: 'The client UUID — must match the current client context',
        },
        leadMagnetId: {
          type: 'string',
          description: 'UUID of the lead_magnets record to link this HTML to. Get it from get_existing_content("lead_magnets") first.',
        },
        htmlContent: {
          type: 'string',
          description: 'The complete, self-contained HTML document as a string. Must include <!DOCTYPE html>, embedded CSS in <style>, and embedded JS in <script>. Zero external dependencies.',
        },
        htmlType: {
          type: 'string',
          enum: ['interactive', 'optin_page'],
          description: '"interactive" = quiz/scorecard/calculator/assessment tool. "optin_page" = opt-in landing page HTML.',
        },
      },
      required: ['clientId', 'leadMagnetId', 'htmlContent', 'htmlType'],
    },
  },
]

// Tool names for type safety
export type ToolName =
  | 'perplexity_search'
  | 'firecrawl_scrape'
  | 'firecrawl_crawl'
  | 'dataforseo_keywords'
  | 'dataforseo_serp'
  | 'dataforseo_keyword_suggestions'
  | 'start_batch'
  | 'save_content'
  | 'update_client'
  | 'update_content'
  | 'get_existing_content'
  | 'generate_image'
  | 'unsplash_search'
  | 'edit_image'
  | 'crm_search'
  | 'crm_create_lead'
  | 'crm_update_record'
  | 'crm_add_note'
  | 'switch_model'
  | 'generate_whatsapp_prompt'
  | 'update_onboarding_stage'
  | 'save_lead_magnet_html'

// Human-readable labels for tool activity display in the chat UI
export const TOOL_LABELS: Record<ToolName, { icon: string; label: string; color: string }> = {
  perplexity_search: { icon: '🔍', label: 'Searching with Perplexity', color: 'blue' },
  firecrawl_scrape: { icon: '🕷️', label: 'Scraping webpage', color: 'orange' },
  firecrawl_crawl: { icon: '🕸️', label: 'Crawling website', color: 'orange' },
  dataforseo_keywords: { icon: '📊', label: 'Fetching keyword data', color: 'green' },
  dataforseo_serp: { icon: '🏆', label: 'Checking search rankings', color: 'green' },
  dataforseo_keyword_suggestions: { icon: '💡', label: 'Finding keyword suggestions', color: 'green' },
  start_batch: { icon: '📦', label: 'Starting content batch', color: 'purple' },
  save_content: { icon: '💾', label: 'Saving to dashboard', color: 'purple' },
  update_client: { icon: '🏢', label: 'Updating client profile', color: 'purple' },
  update_content: { icon: '✏️', label: 'Updating record', color: 'purple' },
  get_existing_content: { icon: '📂', label: 'Loading existing content', color: 'gray' },
  generate_image: { icon: '🎨', label: 'Generating AI image', color: 'pink' },
  unsplash_search: { icon: '📷', label: 'Searching Unsplash photos', color: 'teal' },
  edit_image: { icon: '✨', label: 'Editing image with AI', color: 'violet' },
  crm_search: { icon: '🔎', label: 'Searching CRM', color: 'cyan' },
  crm_create_lead: { icon: '➕', label: 'Creating CRM lead', color: 'cyan' },
  crm_update_record: { icon: '✏️', label: 'Updating CRM record', color: 'cyan' },
  crm_add_note: { icon: '📝', label: 'Adding CRM note', color: 'cyan' },
  switch_model: { icon: '⚡', label: 'Switching model', color: 'violet' },
  generate_whatsapp_prompt: { icon: '🤖', label: 'Generating WhatsApp agent prompt', color: 'green' },
  update_onboarding_stage: { icon: '✅', label: 'Stage complete', color: 'emerald' },
  save_lead_magnet_html: { icon: '🧩', label: 'Saving HTML to Storage', color: 'indigo' },
}
