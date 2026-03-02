# Skill: AI Social Graphics

## Purpose
Produce platform-optimized static visuals for social media — LinkedIn graphics, Instagram carousels, YouTube thumbnails, quote cards, and infographics.

## When This Activates
When creating social media assets, when atomizing content into visual formats, or when building the creative variant set from AI Creative Strategist briefs.

> **Execution engine:** See `ai-image-generation.md` for the full Kie.ai model library, Dense Narrative prompt methodology, and API payload templates.

## Inputs Required
- Creative brief or content to visualize
- Brand guidelines (colors, fonts, logo)
- Platform and format specifications
- Key message / headline
- Exact text strings that must appear on the graphic

---

## Graphic Types & Model Routing

### Quote Card / Single Message Graphic
**Model:** `gpt-image/1.5-text-to-image` — best text rendering accuracy
**Purpose:** Share one key insight as a shareable image.
**Platforms:** LinkedIn, Instagram, Twitter/X

### YouTube Thumbnail
**Model:** `gpt-image/1.5-text-to-image` (text accuracy critical) or `flux-2/pro-text-to-image` (photo-realistic face)
**Purpose:** Drive clicks from search/browse.
**Rules:** Readable at small size. High contrast. Bold text max 5 words. Emotion + curiosity gap.

### Hero Banner / Campaign Visual
**Model:** `flux-2/pro-text-to-image`
**Purpose:** Brand awareness visual, event promotion, product launch graphic.
**Rules:** Strong visual, minimal text, brand colours dominant.

### Infographic / Data Visual
**Model:** `gpt-image/1.5-text-to-image` — text labels must be accurate
**Purpose:** Visualize data, processes, or frameworks.
**Rules:** All numbers and labels must be exact. Use `gpt-image` for any graphic with data labels.

### Ad Creative (Static)
**Model:** `flux-2/pro-text-to-image` for visual, then add text via `gpt-image/1.5-text-to-image` for the text layer
**Purpose:** Stop the scroll, drive clicks.
**Rules:** One message. Clear CTA. Tested in variants.

### Carousel Slides
**Model:** `gpt-image/1.5-text-to-image` per slide (text accuracy required)
**Purpose:** Educational or storytelling content in swipeable format.

---

## Critical Rule: Model Choice for Text

| Has text overlay? | Model |
|-------------------|-------|
| Yes — any text, labels, numbers | `gpt-image/1.5-text-to-image` |
| No — pure visual, no text | `flux-2/pro-text-to-image` |
| Photorealistic face + text | Generate face with `flux-2/pro-text-to-image`, then regenerate with `gpt-image/1.5-image-to-image` to add text |

---

## Process

### Step 1: Define the Visual Brief
For each graphic:
```markdown
## Visual Brief: [Asset Name]

**Type:** [Quote card / Carousel / Thumbnail / Banner / Infographic / Ad]
**Platform:** [Where it will be posted]
**Dimensions:** [Width x Height]
**Model:** [Which Kie.ai model and why]
**Key Message:** [The one thing the viewer should take away]
**Exact Headline Text:** "[EXACT TEXT — spell it out, character-perfect]"
**Supporting Text:** "[Any subheading or CTA text]"
**Visual Style:** [Minimalist / Bold / Photographic / Illustrated]
**Color Palette:** [Hex codes or brand color names]
**Must Include:** [Logo position, URL, CTA button, specific imagery]
```

### Step 2: Write the Graphic Prompt

**For text-heavy graphics (`gpt-image/1.5-text-to-image`):**
```
[Layout description — single image, split, hero banner, card].
[Background — exact color hex, texture, gradient description].
[Visual element — product, abstract shape, illustration direction].
Headline text: "[EXACT HEADLINE]" — large, bold, [font style: sans-serif/serif/display], [exact color].
Supporting text: "[EXACT SUPPORTING COPY]" — smaller, [placement: bottom-left, centered, etc.].
Brand accent: [color element — stripe, dot, frame, shape].
[Overall mood: clean, bold, minimal, energetic].
Print-ready quality. Exact text rendering required — no letter substitutions or misspellings.
```

**For visual-dominant graphics (`flux-2/pro-text-to-image`):**
```
[Scene or visual concept]. [Exact composition — foreground, midground, background].
[Color palette — dominant, secondary, accent in hex].
[Lighting and mood]. [Style direction — photographic, graphic, illustrative].
Shot on [focal length]mm lens, f/[aperture], ISO [value] if photographic.
[Brand elements to include — logo area left blank, color blocks].
No text unless specified. Clean composition. High contrast.
```

### Step 3: Generate Variants (3–5 minimum)
Vary one element per variant:
- Background color or texture
- Text placement or size
- Visual element (different image or no image)
- Layout orientation

Start at `1K` resolution for speed.

### Step 4: Carousel Structure (if applicable)
```markdown
## Carousel: [Title]

Slide 1 (Cover): [Hook / Title — must earn the swipe]
Slide 2: [Context / Setup — why this matters]
Slide 3: [Key insight 1]
Slide 4: [Key insight 2]
Slide 5: [Key insight 3]
Slide 6: [Proof or example]
Slide 7: [Summary / takeaway]
Slide 8 (CTA): [What to do next — follow, link, DM]
```
Generate each slide separately with `gpt-image/1.5-text-to-image` using a consistent template prompt.

### Step 5: Quality Review
Zoom to 100% and check:
- [ ] All text is readable at actual display size (not just zoomed in)
- [ ] Every word is spelled correctly (triple-check — AI can hallucinate letters)
- [ ] Brand colors and style are consistent across the set
- [ ] One clear message per graphic — no visual clutter
- [ ] CTA is present where appropriate
- [ ] Dimensions match target platform

### Step 6: Final Production
- Winner: regenerate at `2K` with same model and prompt
- For print/large-format: upscale with `topaz-image-upscale`

### Step 7: Upload to Supabase
```json
POST /rest/v1/media_assets
{
  "client_id": "[uuid]",
  "asset_type": "image",
  "file_url": "[Supabase storage URL]",
  "file_name": "[asset-name-platform-v1.jpg]",
  "platform": "[instagram | linkedin | youtube | facebook | pinterest]",
  "notes": "[Graphic type, model used, slide number if carousel]"
}
```

---

## Platform Dimension Reference
| Platform | Format | Dimensions | Aspect Ratio | Notes |
|----------|--------|-----------|--------------|-------|
| LinkedIn post | Square | 1200×1200 | 1:1 | Text-friendly |
| LinkedIn carousel | PDF slides | 1080×1080 | 1:1 | Upload as PDF |
| Instagram feed | Square | 1080×1080 | 1:1 | Visual-first |
| Instagram portrait | Portrait | 1080×1350 | 4:5 | Best reach format |
| Instagram carousel | Square | 1080×1080 | 1:1 | 2–10 slides |
| Instagram Story | Vertical | 1080×1920 | 9:16 | Full-bleed |
| Twitter/X | Landscape | 1200×675 | 16:9 | Single image |
| YouTube thumbnail | Landscape | 1280×720 | 16:9 | High contrast, bold text |
| Pinterest | Vertical | 1000×1500 | 2:3 | Long-format |
| Facebook ad | Landscape | 1200×628 | 16:9 | Minimal text rule |

---

## Quality Gates
- [ ] Model matches text/visual decision (gpt-image for text, flux for pure visual)
- [ ] Exact headline text specified in quotes in the prompt
- [ ] All text verified correct at actual display size
- [ ] Dimensions match target platform
- [ ] Brand guidelines followed (colors, fonts, logo placement)
- [ ] One message per graphic — no clutter
- [ ] Carousel has a strong cover slide that earns the swipe
- [ ] Human approves before publishing
- [ ] Final URLs saved to `media_assets` table
