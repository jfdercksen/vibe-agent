# Skill: AI Creative Strategist

## Purpose
Combine market research with creative direction to produce strategic briefs that drive measurable results. Bridge the gap between strategy (what to say) and creative (how to show it).

## When This Activates
Before creating any visual or video assets, when launching ad campaigns, or when creative output needs to be research-informed rather than guesswork.

## Inputs Required
- Market research (from Perplexity/Firecrawl MCPs)
- Competitor creative analysis (from Playwright MCP screenshots)
- Brand voice profile + positioning angles
- Campaign goal (awareness, traffic, conversion, retention)
- Target audience segments
- Platform(s) for distribution

## Process

### Step 1: Creative Landscape Audit
Using research and competitor screenshots, analyze:
- **Visual patterns:** What do competitors' ads/pages look like?
- **Messaging themes:** What claims/hooks dominate the space?
- **Format trends:** What content formats get engagement?
- **Gaps:** What visual/messaging territory is unclaimed?
- **Fatigue signals:** What has the audience seen too many times?

### Step 2: Define Creative Strategy
```markdown
## Creative Brief: [Campaign/Project Name]

### Objective
[One sentence: what this creative needs to achieve]

### Target Audience
[Specific segment with psychographic details]

### Key Message
[One sentence the audience should take away]

### Positioning Angle
[Which angle from Positioning Angles skill]

### Tone & Mood
[Visual and verbal tone — e.g., "confident but not arrogant, modern but not trendy"]

### Mandatory Elements
- [ ] [Brand elements that must appear]
- [ ] [Key claims or proof points]
- [ ] [CTA specifics]

### Avoid
- [ ] [Visual cliches in this market]
- [ ] [Messaging competitors overuse]
- [ ] [Tones that conflict with brand]
```

### Step 3: Generate Creative Concepts
Produce 3-5 distinct creative concepts. For each concept, write the actual ready-to-use Facebook ad copy — not direction notes. Character limits are hard constraints.

```markdown
### Concept [N]: [Name]
**Platform:** [meta / tiktok / youtube / instagram / pinterest]
**Format:** [static / carousel / ugc_video / short_video / story]
**Hook:** [The visual or verbal hook that stops the scroll — first 3 seconds]
**Visual Direction:** [Exact visual description — colors, composition, style, what's in frame]

**Facebook Ad Copy:**
- Primary Text: [Body copy above the image. Conversational, problem-aware. 125 chars or less ideal. No hashtags.]
- Headline: [Bold text below the image. Benefit-led or curiosity-driven. MAX 27 characters.]
- Description: [Supporting line below headline. Reinforces headline. MAX 27 characters.]

**Script:** [For ugc_video / short_video only — full spoken script with scene notes. Skip for static/carousel/story.]

**Why This Works:** [Psychology / research backing]
```

**Copy rules:**
- Primary Text: write actual copy, not a description of what to write. Max 125 chars before "see more" truncation.
- Headline: hard max 27 chars — count every character including spaces.
- Description: hard max 27 chars — count every character including spaces.
- For video formats: Primary Text + Headline + Description still apply (shown in feed). Script is additional.
- For carousel: Primary Text applies to the whole ad. Each card gets its own Headline (27 char max).

### Step 4: Variant Planning
For the selected concept, plan 5-10 variants:
- Headline variations (different angles on the same concept)
- Visual variations (different imagery, same message)
- Format variations (static, carousel, video versions)
- Platform adaptations (resize, reformat for each channel)

### Step 5: Production Specs
For each asset, define:
```markdown
### Asset: [Name]
- **Dimensions:** [e.g., 1080x1080, 1200x628, 9:16]
- **Format:** [PNG, MP4, GIF]
- **Duration:** [if video — 15s, 30s, 60s]
- **Copy:** [Headline, body, CTA]
- **Visual notes:** [Specific direction for image/video creation]
- **Skill to execute:** [AI Product Photo / AI Social Graphics / AI Product Video / Frontend Design]
```

## Supabase Output Format
After completing all steps, write the brief to the `creative_briefs` table using this exact JSON structure:

```json
{
  "brief_name": "[Campaign Name]",
  "campaign_goal": "[awareness | traffic | conversion | retention]",
  "target_audience": "[Avatar description — 2-3 sentences]",
  "key_message": "[One sentence the audience should take away]",
  "tone_and_mood": "[Visual and verbal tone description]",
  "mandatory_elements": ["element1", "element2"],
  "avoid_elements": ["avoid1", "avoid2"],
  "concepts": [
    {
      "name": "[Concept name]",
      "platform": "[meta | tiktok | youtube | instagram | pinterest]",
      "format": "[static | carousel | ugc_video | short_video | story]",
      "hook": "[Scroll-stopping hook — visual or verbal, first 3 seconds]",
      "visual_direction": "[Exact visual description for production]",
      "primary_text": "[Ready-to-use Facebook body copy, max 125 chars]",
      "headline": "[Ready-to-use headline, MAX 27 chars]",
      "description": "[Ready-to-use description, MAX 27 chars]",
      "copy_direction": "[Full script for video formats. For static/carousel: leave empty string.]",
      "image_url": null
    }
  ],
  "selected_concept": null,
  "production_specs": []
}
```

## Quality Gates
- [ ] Brief is informed by actual research (not assumptions)
- [ ] Creative gaps identified in competitor landscape
- [ ] 3-5 distinct concepts generated (not variations of one idea)
- [ ] Each concept has a clear psychological hook
- [ ] Human selects winning concept(s) — AI does not decide
- [ ] Production specs are complete enough for execution skills
