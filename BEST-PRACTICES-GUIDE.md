# Vibe Marketing System: Best Practices Guide

## How to Use This Guide
This is your reference for getting the most out of the Vibe Marketing system. It covers exact prompts to use, the correct order to run things, common mistakes, and pro tips for every skill and workflow.

> **Golden Rule:** You don't need to memorize any of this. Just open a Claude Code session in the `C:\Apps\Vibe Marketing` folder and tell Claude what you want. The skills auto-load and guide the process. This document helps you ask *better* questions to get *better* outputs.

---

## Table of Contents
1. [Quick Start: Your First 15 Minutes](#quick-start)
2. [The Non-Negotiable Sequence](#the-sequence)
3. [Prompts That Actually Work (By Skill)](#prompts-by-skill)
4. [Research Phase: Getting the Most From MCPs](#research-phase)
5. [Foundation Phase: Voice & Positioning](#foundation-phase)
6. [Structure Phase: Keywords & Content Planning](#structure-phase)
7. [Assets Phase: Copy, Design, Email, Creative](#assets-phase)
8. [Iteration Phase: Making It Actually Good](#iteration-phase)
9. [Client Onboarding Checklist](#client-onboarding)
10. [Common Mistakes to Avoid](#common-mistakes)
11. [Power User Tips](#power-user-tips)
12. [n8n Workflow Integration](#n8n-integration)
13. [Quick Reference: Prompt Cheat Sheet](#cheat-sheet)

---

## Quick Start: Your First 15 Minutes <a id="quick-start"></a>

### Step 1: Open the Project
Open Claude Code in the Vibe Marketing folder. All 16 skills auto-load.

### Step 2: Start With the Orchestrator
Tell Claude your goal. It will route you to the right skill stack.

**Say this:**
```
I have a new client: [name]. They're a [business type] in the [niche] space.
Their website is [URL]. Their main competitors are [URL 1], [URL 2], [URL 3].
Their goal is [what they want to achieve].
Run the Orchestrator and give me an execution plan.
```

### Step 3: Follow the Plan
Claude will give you a numbered sequence. Follow it in order. Don't skip steps.

---

## The Non-Negotiable Sequence <a id="the-sequence"></a>

Every project follows this exact order. No exceptions.

```
1. RESEARCH    → Gather deep context (30-60 min minimum)
2. FOUNDATION  → Brand voice + positioning angles
3. STRUCTURE   → Keywords + content pillars
4. ASSETS      → Copy, pages, emails, creative
5. ITERATION   → Reject, refine, repeat until quality gates pass
```

**Why this order matters:**
- Research feeds everything. Skip it and all outputs are generic.
- Positioning must exist before copy. Copy without positioning is noise.
- Copy must exist before design. Design without copy is decoration.
- Iteration is where good becomes great. First drafts are starting points.

---

## Prompts That Actually Work (By Skill) <a id="prompts-by-skill"></a>

### RESEARCH PHASE <a id="research-phase"></a>

#### Market Research (Perplexity MCP)

**Starting a new client:**
```
Research the [niche/industry] market for [client name].
I need:
1. Market landscape — who are the major players and what's their positioning?
2. Target audience pain points — what do [audience type] complain about?
3. Pricing landscape — what do competitors charge?
4. Content gaps — what questions does the audience ask that no one answers well?
5. Trends — what's changing in this space right now?

Their competitors are: [URL 1], [URL 2], [URL 3]
Their target audience is: [description]

Save the research to clients/[client-name]/research/market-research.md
```

**Deep audience research:**
```
Research what [target audience] actually says about [topic/problem].
Search Reddit, forums, Quora, and social media.
I want their exact language — the words they use to describe their frustrations,
what they've tried, and what they wish existed.
Focus on [specific pain point or topic area].
```

**Competitive intelligence:**
```
Analyze [competitor URL] using Firecrawl.
Extract:
- Their homepage messaging and positioning
- How they describe their product/service
- Their pricing structure
- Their calls to action
- Their social proof (testimonials, client logos, numbers)
- Their content strategy (blog topics, lead magnets)
Compare this to [another competitor URL] and identify the positioning gaps.
```

**Competitor visual audit:**
```
Use Playwright to screenshot these competitor pages:
- [URL 1] homepage
- [URL 1] pricing page
- [URL 2] homepage
- [URL 2] pricing page
- [URL 3] homepage

Analyze the screenshots for:
- Design patterns they all share
- Visual gaps (what no one is doing)
- How they use social proof visually
- CTA placement and styling
```

#### Pro Tips for Research
- **Cast a wide net first.** Don't narrow down too early. Let the data surprise you.
- **Save everything.** Even research that seems irrelevant now might matter for content later.
- **Look for exact phrases.** The audience's own words are gold for copy. "I'm so tired of [x]" is a headline waiting to happen.
- **Research competitors' weaknesses, not just strengths.** The gaps are where your client wins.

---

### FOUNDATION PHASE <a id="foundation-phase"></a>

#### Brand Voice

**For a new client with existing content:**
```
Run the Brand Voice skill for [client name].

Here's what I have:
- Website: [URL]
- Their about page says: [paste key content]
- Sample social posts: [paste 3-5 posts]
- Their values: [list values]
- Their audience is: [description]
- What they're NOT: [anti-positioning notes]

Scrape their website with Firecrawl to analyze their existing messaging patterns,
then build a complete brand voice profile with vocabulary guide.
Save to clients/[client-name]/foundation/brand-voice.md
```

**For a new brand with no existing content:**
```
I need to BUILD a brand voice from scratch for [client name].

About them:
- Business type: [type]
- What they sell: [product/service]
- Target audience: [who]
- How the founder talks: [casual? formal? funny? direct?]
- Brands they admire (tone-wise): [examples]
- Brands they want to sound NOTHING like: [examples]

Create a brand voice profile. Make it specific enough that a stranger
could write in this voice using only the document.
```

**Refining an existing voice profile:**
```
Here's our current brand voice profile for [client]:
[paste or reference file path]

It's too [generic/formal/casual/similar to competitors].
Sharpen it. I want:
- More specific vocabulary guides (at least 15 embrace + 15 avoid)
- Stronger anti-positioning (what we refuse to sound like)
- Better sample sentences that show the difference between on-brand and off-brand
- Channel-specific adjustments for [LinkedIn/email/ads/website]
```

#### Positioning Angles

**Generating angles for a new client:**
```
Run the Positioning Angles skill for [client name].

Context:
- Brand voice: [reference brand-voice.md or paste key traits]
- They sell: [product/service]
- Target audience: [who, what they want, what they fear]
- Main competitors and their positioning:
  - [Competitor 1]: positioned as [their angle]
  - [Competitor 2]: positioned as [their angle]
  - [Competitor 3]: positioned as [their angle]
- Key transformation they offer: [what changes for the customer]
- Business type: [info/education, consulting, e-commerce, SaaS]

Generate 5 positioning angles. For each one, give me:
- The core hook (one sentence)
- Why it works psychologically for this audience
- 3 headline directions
- What it rejects (anti-angle)
- The risk of using this angle

Then recommend your top 2 with reasoning. I'll pick the winner.
```

**When the first round of angles feels generic:**
```
These angles are too safe. Push harder.

Specifically:
- Angle [X] sounds like something any competitor could say. Make it impossible to copy.
- I want at least one angle that's genuinely contrarian — something that might make
  people uncomfortable but would stand out.
- Use more of the audience's actual language from the research.
- Every headline should pass the "would I stop scrolling?" test.

Regenerate with sharper differentiation.
```

**Comparing angles before choosing:**
```
I'm torn between Angle 2 (The Anti-Guru) and Angle 4 (The Methodology Transfer).

For each one, tell me:
1. How would the homepage hero section sound with this angle?
2. How would a Facebook ad sound?
3. How would an email subject line sound?
4. What's the 12-month risk? (will it age well?)
5. Can we actually deliver on this promise consistently?

Give me your honest recommendation.
```

---

### STRUCTURE PHASE <a id="structure-phase"></a>

#### Keyword Research

**Starting keyword research for a client:**
```
Run the Keyword Research skill (6 Circles Method) for [client name].

Their niche: [niche]
Their website: [URL]
Competitors:
- [Competitor 1 URL]
- [Competitor 2 URL]
- [Competitor 3 URL]
Target audience: [description]

Use Perplexity to research:
1. What topics competitors rank for that [client] doesn't
2. Questions the audience asks that no one answers well
3. Adjacent topics no one in the space covers

Prioritize for quick wins (60-90 days).
Build 3-5 content pillars.
Create a realistic publication calendar.
Save to clients/[client-name]/structure/keyword-research.md
```

**When you already have some content:**
```
Here's [client name]'s existing content inventory:
[list of blog posts/pages with URLs]

Run the 6 Circles analysis but focus on:
1. What they already rank for (don't duplicate)
2. Where they're close to ranking but need a boost (positions 5-20)
3. New topics that complement existing content
4. Internal linking opportunities between existing and new content
```

**Content pillar organization:**
```
Based on the keyword research, organize everything into content pillars.

For each pillar I need:
- The core hub page topic
- 5-8 supporting content pieces
- How they link together
- Which pieces are quick wins (publish first)
- Which pieces build authority (publish month 2-3)

Map each piece to a positioning angle so everything reinforces the brand message.
```

---

### ASSETS PHASE <a id="assets-phase"></a>

#### Direct Response Copy (Landing Pages & Sales Pages)

**Writing a landing page from scratch:**
```
Write landing page copy for [client name] using the Direct Response Copy skill.

Inputs:
- Positioning angle: [paste the chosen angle]
- Brand voice: [reference brand-voice.md]
- Product/service: [what they sell]
- Target audience: [who, awareness level]
- Conversion goal: [buy / book a call / sign up / download]
- Price: [if applicable]
- Key transformation: [what changes for the customer]
- Social proof available: [testimonials, numbers, logos]

I need:
1. 7-10 headline options (I'll pick the winner)
2. Full page copy following the correct structure for [awareness level] audience
3. CTA button text + micro-copy options
4. FAQ section addressing real objections

Run the AI artifact removal checklist when done.
Save to clients/[client-name]/assets/copy/landing-page.md
```

**Improving existing copy:**
```
Here's the current landing page copy for [client]:
[paste copy or URL]

Problems I see:
- [specific issues]

Rewrite it using the Direct Response Copy skill.
Keep what works, fix what doesn't.
Specifically:
- Sharpen the headline (give me 5 new options)
- Make the problem section more specific using audience research language
- Add specificity to all claims (numbers, timeframes, results)
- Remove all AI artifact phrases
- Strengthen the CTA with risk-reducing micro-copy
```

**Writing multiple page variations for testing:**
```
I have the approved landing page copy for [client].
Now create 3 variations for A/B testing:

Variation A: Same copy, different headline angle (use positioning angle [X] instead of [Y])
Variation B: Short-form version (for retargeting / most-aware traffic)
Variation C: Story-led version (open with a customer story before the pitch)

Keep the core offer and CTA consistent across all three.
```

#### Email Sequences

**Building a welcome sequence:**
```
Build a 7-email welcome sequence for [client name] using the Email Sequences skill.

Context:
- Trigger: [what triggers the sequence — lead magnet download, signup, etc.]
- Lead magnet: [what they just downloaded/signed for]
- Brand voice: [reference brand-voice.md]
- Positioning angle: [the chosen angle]
- Core offer: [what we ultimately want them to buy/do]
- Price point: [if applicable]
- Audience pain points: [top 3 from research]

Follow the DELIVER → CONNECT → VALUE → VALUE → BRIDGE → SOFT → DIRECT framework.

For each email give me:
- Subject line (+ 2 alternatives for A/B testing)
- Preview text
- Full body copy
- CTA
- Send timing
```

**Post-purchase nurture sequence:**
```
Build a 5-email post-purchase nurture sequence for [client name].

They just bought: [product/service]
Onboarding needs: [what does the customer need to do first?]
Common support questions: [what do new customers usually ask?]
Upsell opportunity: [related product/service, if any]
Community: [is there a group, forum, or social community?]

Follow the WELCOME → CHECK-IN → DEEPEN → SOCIAL → EXPAND framework.
```

#### Content Atomizer

**Atomizing a blog post:**
```
Atomize this blog post into 15+ platform-specific assets:

[paste the blog post or reference the file]

Target platforms: [LinkedIn, Twitter/X, Instagram, Email, YouTube — pick which ones]
Brand voice: [reference brand-voice.md]

For each asset, give me:
- The platform it's for
- The format (post, carousel, thread, reel script, etc.)
- The complete copy, ready to post
- The CTA
- Which day to post it (distribution schedule)
```

**Atomizing a podcast or video:**
```
Here's the transcript from [client]'s latest [podcast episode / video]:
[paste transcript]

Extract the atoms:
- Key insights (quotable moments)
- Frameworks or processes mentioned
- Stories or examples
- Contrarian takes
- Data points

Then atomize into 15+ assets across [platforms].
Create a 2-week distribution calendar.
```

#### Lead Magnet

**Creating a lead magnet concept:**
```
Design a lead magnet for [client name] using the Lead Magnet skill.

Context:
- Target audience: [who]
- Their biggest pain point: [from research]
- Core offer (what the lead magnet bridges to): [product/service]
- Positioning angle: [chosen angle]

Give me 3 lead magnet concepts using different frameworks
(Quick Win, Roadmap, Toolkit, Case Study, or Assessment).
For each concept: title, format, core promise, time to consume, and how it bridges to the paid offer.

Then write the opt-in copy (headline, subheadline, bullets, CTA) for the winner.
```

#### Frontend Design

**Building a landing page:**
```
Build a production-grade landing page for [client name] using the Frontend Design skill.

Inputs:
- Copy: [reference the landing-page.md file]
- Brand colors: [primary, secondary, accent]
- Fonts: [heading font, body font]
- Logo: [description or reference]
- Reference sites I like: [URLs for design direction]
- Conversion goal: [what the page should achieve]

Build it as clean HTML/CSS.
Mobile-first. Responsive at 375px, 768px, 1024px, 1440px.
No AI tells in the design.
Save to clients/[client-name]/assets/creative/web/landing-page.html
```

#### Newsletter

**Planning a newsletter:**
```
Plan a month of newsletters for [client name] using the Newsletter skill.

Brand voice: [reference brand-voice.md]
Content pillars: [from keyword research]
Frequency: [weekly / biweekly]
Audience interests: [from research]

Use a different format each week:
- Week 1: Teacher (actionable how-to)
- Week 2: Storyteller (narrative + lesson)
- Week 3: Curator (best resources)
- Week 4: Contrarian (challenge assumptions)

For each issue give me: subject line, opening hook, body outline, CTA.
```

#### SEO Content

**Writing an SEO article:**
```
Write an SEO content piece for [client name] using the SEO Content skill.

Target keyword: [keyword]
Search intent: [informational / transactional / commercial / navigational]
Brand voice: [reference brand-voice.md]
Unique angle: [what perspective can we add that competitors can't?]

Top 5 competitors for this keyword:
[list URLs currently ranking]

The piece should:
- Fill the gap that existing content misses
- Include our unique perspective as a [business type]
- Be comprehensive but not padded
- Target related PAA (People Also Ask) questions in an FAQ section
- Read like an expert wrote it, not an algorithm

IMPORTANT: Flag anything that needs human fact-checking before we publish.
```

#### Creative Skills

**Creative strategy brief:**
```
Run the AI Creative Strategist skill for [client name]'s [campaign type].

Goal: [awareness / traffic / conversion / retention]
Audience: [segment]
Platform(s): [where the creative will run]
Budget context: [rough range for paid, or organic only]

Use Playwright to screenshot competitor ads/creative from [URLs].
Identify visual gaps and messaging gaps.

Then generate 3-5 creative concepts. For each:
- The scroll-stopping hook
- Visual direction
- Copy direction
- Why it works for this audience
```

**Product photos:**
```
Generate product photo concepts for [product name] using the AI Product Photo skill.

Product: [description — shape, color, material]
Brand aesthetic: [style direction]
Shots needed:
1. Hero shot (clean, white background)
2. Lifestyle shot ([setting/context])
3. Detail shot ([specific feature to highlight])

Provide detailed image generation prompts for each shot.
Generate 3 variants per shot.
```

**Social graphics:**
```
Create social graphics for [client name] using the AI Social Graphics skill.

Content to visualize: [paste the post or key message]
Platform: [LinkedIn / Instagram / Twitter]
Brand colors: [colors]
Style: [minimalist / bold / photographic / illustrated]

I need:
- [Carousel / Quote card / Thumbnail] — specify which
- Complete copy for each slide (if carousel)
- Design direction detailed enough to generate or brief a designer
```

---

### ITERATION PHASE <a id="iteration-phase"></a>

#### Making First Drafts Better

**General rejection prompt (use this a lot):**
```
This is a good start but not ready to ship. Specifically:

1. [What's wrong with it]
2. [What's wrong with it]
3. [What's wrong with it]

Rewrite with these fixes. Keep [what works]. Change [what doesn't].
```

**Voice enforcement pass:**
```
Run a voice enforcement check on this copy against [client]'s brand voice profile.

Flag every instance of:
- Words from the "Avoid" list
- Sentences that could appear on 1,000 other websites
- AI artifact phrases
- Passive voice
- Claims without specificity
- Generic filler that doesn't earn its place

Then rewrite the flagged sections. Keep everything else.
```

**Expert review simulation:**
```
Review this [landing page / email sequence / content piece] from 3 expert perspectives:

1. A direct response copywriter with 20 years of experience
2. A [industry] insider who is part of the target audience
3. A conversion rate optimization specialist

For each expert:
- What do they think works well?
- What would they change?
- What's missing?
- Score it 1-10 with reasoning

Then synthesize their feedback into a priority-ranked revision list.
```

**The "Would I Pay For This?" Test:**
```
Be brutally honest: would a [target audience member] actually [convert/buy/sign up]
after reading this?

If not, why? What's the weakest link?
What's the single change that would have the biggest impact?
```

---

## Client Onboarding Checklist <a id="client-onboarding"></a>

### Before the First Session
```
1. Copy clients/_template/ → clients/[client-name]/
2. Fill out client-brief.md with everything you know
3. Gather: website URL, competitor URLs, existing brand assets, testimonials
4. Define the primary goal (what does the client need most right now?)
```

### Session 1: Research + Foundation (2-3 hours)
```
Prompt:
"I'm onboarding a new client. Here's their brief:
[paste or reference client-brief.md]

Run the full Foundation Stack:
1. Market research using Perplexity
2. Competitor analysis using Firecrawl (scrape [URLs])
3. Competitor screenshots using Playwright
4. Audience language mining
5. Brand voice profile
6. 5 positioning angles

Save everything to the client folder.
Give me an expert review checkpoint before we move to the next phase."
```

### Session 2: Structure (1-2 hours)
```
Prompt:
"Continue with [client name]. Foundation is approved.
Now run the Structure phase:
1. Keyword research using the 6 Circles Method
2. Build content pillars
3. Create a 60-90 day publication calendar
4. Identify quick wins

Save to clients/[client-name]/structure/"
```

### Session 3: Assets (2-4 hours)
```
Prompt:
"Continue with [client name]. Structure is approved.
Now build the assets. Based on their goal of [goal], start with:
1. [Landing page copy / Email sequence / SEO content / Lead magnet]
2. [Next priority asset]
3. [Next priority asset]

Use the approved brand voice and positioning angle [X].
Run voice enforcement and AI artifact removal on everything."
```

---

## Common Mistakes to Avoid <a id="common-mistakes"></a>

### 1. Skipping Research
**Wrong:** "Write me a landing page for a fitness coach"
**Right:** "Research the online fitness coaching market first. Then write the landing page."
*Without research, every output is generic and interchangeable.*

### 2. Jumping to Copy Without Positioning
**Wrong:** "Write email copy for my client"
**Right:** "We're using the Anti-Guru positioning angle. Write email copy that reinforces this angle."
*Copy without a positioning angle has no edge.*

### 3. Accepting the First Draft
**Wrong:** "Looks good, ship it."
**Right:** "This is a starting point. Run the voice enforcement pass and expert review."
*First drafts are raw material. Iteration is where quality lives.*

### 4. Using the Same Format Every Time
**Wrong:** Always asking for a "Teacher" newsletter or a "Quick Win" lead magnet.
**Right:** Rotating formats deliberately. Different problems need different frameworks.

### 5. Not Saving Outputs
**Wrong:** Generating great copy and losing it when the session ends.
**Right:** Always telling Claude where to save: `Save to clients/[name]/assets/copy/[filename].md`

### 6. Treating AI Output as Final
**Wrong:** Publishing AI-generated content without human review.
**Right:** Human fact-checks claims, adds unique perspective, reviews for voice consistency.

### 7. Running Skills Out of Order
**Wrong:** "Build me a landing page" (no voice, no positioning, no research)
**Right:** Research → Brand Voice → Positioning → Copy → Design (always in this order)

---

## Power User Tips <a id="power-user-tips"></a>

### 1. Chain Skills in One Session
```
"For [client], run the full Conversion Stack in sequence:
1. Direct Response Copy (landing page) using positioning angle [X]
2. Frontend Design (build the page from the copy)
3. Lead Magnet (create the opt-in offer for the page)
Save each output before moving to the next skill."
```

### 2. Use Multi-Perspective Review
```
"Spin up 3 expert reviewers for this landing page:
- A Eugene Schwartz-style direct response copywriter
- Someone who matches the target customer profile exactly
- A UX designer focused on conversion
Have them debate what needs to change."
```

### 3. Reference Previous Outputs
```
"Use the brand voice from clients/acme/foundation/brand-voice.md
and the positioning angle #3 from clients/acme/foundation/positioning-angles.md
to write this email sequence."
```
*Always point Claude to existing client files. Consistency comes from referencing the same source documents.*

### 4. Batch Similar Work
```
"I have 3 blog posts to atomize for [client].
Atomize all three using the same brand voice and distribution calendar.
Stagger the schedules so content from Post 1 runs week 1-2,
Post 2 runs week 3-4, Post 3 runs week 5-6."
```

### 5. Build Reusable Templates
After a successful project, save the structure:
```
"Take the landing page we just built for [client] and create a
template version — replace all client-specific content with
[PLACEHOLDER] markers. Save to clients/_template/assets/copy/landing-page-template.md"
```

### 6. Use the Orchestrator for New Situations
Whenever you're unsure where to start:
```
"I have [situation]. Run the Orchestrator and tell me the right skill stack and sequence."
```

### 7. Research Competitors in Batches
```
"Use Firecrawl to scrape and compare these 5 competitors side by side:
[URL 1], [URL 2], [URL 3], [URL 4], [URL 5]

For each, extract: positioning, pricing, CTA language, social proof strategy.
Put it in a comparison table so I can see the gaps."
```

---

## n8n Workflow Integration <a id="n8n-integration"></a>

### Available Workflow Blueprints
Your `workflows/n8n/` folder contains 4 ready-to-build blueprints:

| Blueprint | What It Automates | When to Use |
|-----------|-------------------|-------------|
| `client-onboarding-workflow.json` | Research → Brand Voice → Positioning | New client signup |
| `content-atomizer-workflow.json` | 1 blog post → 15+ social assets | After publishing any content |
| `email-sequence-workflow.json` | Brief → 7 welcome emails | After creating a lead magnet |
| `seo-research-workflow.json` | Keyword research → content briefs | Monthly SEO planning |

### Building Workflows
```
"Open the content-atomizer-workflow.json blueprint.
Help me build this as an actual n8n workflow.
I use [Claude/OpenAI] as my AI provider and [Google Sheets/Notion/Airtable] for content calendars.
Walk me through each node configuration."
```

### Connecting n8n to the System
```
"I want to trigger the content atomizer workflow whenever I publish a new blog post.
My blog is on [WordPress/Ghost/Webflow].
Set up a webhook trigger that catches new posts and feeds them into the atomizer."
```

---

## Quick Reference: Prompt Cheat Sheet <a id="cheat-sheet"></a>

### Starting a New Client
```
Run the Orchestrator for [client name]. They're a [business type] selling [product/service]
to [audience]. Their goal is [goal]. Competitors: [URLs]. Give me the full execution plan.
```

### Research
```
Research the [niche] market using Perplexity. Focus on [specific area].
Scrape [competitor URL] with Firecrawl — extract their messaging and positioning.
Screenshot [competitor URLs] with Playwright for visual audit.
```

### Brand Voice
```
Build a brand voice profile for [client]. Here's their existing content: [URLs/content].
They want to sound like [references] and nothing like [anti-references].
```

### Positioning
```
Generate 5 positioning angles for [client]. Their competitors position as [X, Y, Z].
Find the gap. Recommend your top 2. I'll pick the winner.
```

### Landing Page
```
Write landing page copy for [client] using positioning angle [X] and brand voice [reference].
The audience is [awareness level]. Conversion goal: [goal]. Give me 7+ headline options.
```

### Email Sequence
```
Build a 7-email welcome sequence. Trigger: [event]. Core offer: [offer].
Follow DELIVER → CONNECT → VALUE → VALUE → BRIDGE → SOFT → DIRECT.
```

### Content Atomizer
```
Atomize this [blog post / podcast / video] into 15+ assets for [platforms].
Create a 2-week distribution calendar.
```

### Iteration
```
Run voice enforcement on this copy. Flag AI artifacts and off-brand language.
Then run expert review from 3 perspectives. Give me a prioritized revision list.
```

### SEO Content
```
Write an SEO article targeting [keyword]. Search intent: [type].
Analyze top 5 ranking competitors. Fill the gap they all miss.
Add unique perspective. Flag anything that needs fact-checking.
```

### Quick Saves
Always end with:
```
Save to clients/[client-name]/[folder]/[filename].md
```

---

## Remember

> **AI generates options. Your taste picks winners. That's your advantage.**

The system does the heavy lifting. You make the decisions that matter:
- Which positioning angle to use
- Which headline wins
- When the voice sounds right
- What to publish and what to kill

That judgment is what makes a great marketer. The system just makes you 5x faster at everything else.
