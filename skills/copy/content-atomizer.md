# Skill: Content Atomizer

## Purpose
Transform one core content piece into 15+ platform-specific assets. Multiply reach without multiplying effort. Feed the Traffic Flywheel: Create → Atomize → Distribute → Capture → Convert.

## When This Activates
After creating any core content (blog post, podcast episode, video, case study, newsletter), or when building the Traffic or Nurture Stack.

## Inputs Required
- Core content piece (the source material)
- Brand voice profile
- Target platforms (LinkedIn, Twitter/X, Instagram, email, YouTube)
- Positioning angle (for consistency)

## The Atomization Matrix

From ONE core piece, generate:

### LinkedIn (4 pieces)
1. **Long-form post:** Key insight expanded with a personal angle (1,200-1,500 chars)
2. **Carousel:** 6-10 slides breaking down the framework or process
3. **Poll:** Controversial or opinion-splitting question from the content
4. **Comment-bait post:** Hot take or contrarian view in 2-3 sentences

### Twitter/X (3 pieces)
5. **Thread:** 5-8 tweets breaking down the core argument
6. **Standalone tweet:** One quotable insight (under 280 chars)
7. **Quote tweet angle:** Reaction format — "Most people think X. The data says Y."

### Instagram (3 pieces)
8. **Carousel:** Visual breakdown (different format than LinkedIn — more visual, less text)
9. **Reel script:** 30-60 second video script hitting one key point
10. **Story series:** 3-5 stories with polls/questions for engagement

### Email (2 pieces)
11. **Newsletter section:** Condensed insight with CTA to full content
12. **Broadcast teaser:** Short email driving traffic to the core piece

### Video (2 pieces)
13. **Short-form script:** 60-90 second script for TikTok/Reels/Shorts
14. **Long-form outline:** 5-10 minute video expanding on the core topic

### Bonus
15. **Quote graphic:** One key sentence designed for sharing
16. **Infographic outline:** Visual summary of the framework/process

## Process

### Step 1: Extract the Atoms
From the core content, identify:
- **Key insight:** The ONE thing someone should remember
- **Supporting data:** Any stats, results, or proof points
- **Framework/process:** Any step-by-step or mental model
- **Story/example:** Any narrative element
- **Contrarian take:** Any opinion that challenges convention
- **Quote-worthy lines:** Sentences designed for sharing

### Step 2: Adapt Per Platform
Each platform has different rules:

| Platform | Tone | Length | Format | Hook Style |
|----------|------|--------|--------|------------|
| LinkedIn | Professional-personal | 1,200-1,500 chars | Text + carousels | Personal story or data |
| Twitter/X | Punchy, opinionated | 280 chars / threads | Text + images | Hot take or stat |
| Instagram | Visual-first | Short captions | Carousels + Reels | Visual hook or question |
| Email | Conversational | 200-500 words | Plain text | Curiosity or benefit |
| YouTube | Detailed, searchable | 5-15 min | Video | Question or promise |

### Step 3: Write Each Asset
For every atomized piece:
- Adapt the voice for the platform (same brand, different energy)
- Lead with a platform-appropriate hook
- One idea per asset (don't try to cram the whole article into a tweet)
- Include a CTA appropriate to the platform
- Tag with the content pillar for tracking

### Step 4: Create a Distribution Schedule
Don't post everything at once. Spread across 1-2 weeks:
```
Day 1: Core content publishes
Day 1: Email broadcast teaser
Day 2: LinkedIn long-form post
Day 3: Twitter thread
Day 4: Instagram carousel
Day 5: LinkedIn carousel
Day 7: Short-form video
Day 8: Newsletter section
Day 10: LinkedIn poll
Day 12: Quote graphic
Day 14: Standalone tweet
```

## The Traffic Flywheel
```
Create (core content)
  → Atomize (15+ assets)
    → Distribute (platform-specific posting)
      → Capture (CTAs drive to lead magnet/email)
        → Convert (email sequences drive to offer)
          → Learn (what worked? double down)
            → Repeat
```

## Quality Gates
- [ ] Minimum 15 assets generated from one core piece
- [ ] Each asset stands alone (doesn't require reading the original)
- [ ] Platform-specific formatting applied (not copy-paste across platforms)
- [ ] Brand voice maintained across all assets
- [ ] Distribution schedule spreads content across 1-2 weeks
- [ ] Each asset has a clear CTA
- [ ] No AI artifacts in any piece

## Database Save Protocol (Non-Negotiable)
When saving Content Atomizer output to Supabase, follow the two-step batch save so all posts from this run are grouped together in the dashboard for campaign review.

**Step 1 — Start the batch ONCE before saving any posts:**
Call `start_batch({ label: '<core content title — max 60 chars>' })` → receives back `{ batch_id, batch_label }`

**Step 2 — Include batch_id + batch_label in EVERY post save:**
Call `save_content('social_posts', { client_id, platform, post_type, hook, body, cta, hashtags, character_count, image_prompt, status: 'draft', batch_id, batch_label })` for each post.

**Rules:**
- Call `start_batch` ONCE per atomizer run — not once per post
- Use the SAME `batch_id` for ALL 15+ posts in the run
- Generate a NEW `batch_id` for each new atomizer run — never reuse
- NEVER save atomized posts without `batch_id` — they become ungroupable orphans in the dashboard
