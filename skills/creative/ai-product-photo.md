# Skill: AI Product Photo

## Purpose
Generate e-commerce-ready product photography — hero shots, lifestyle imagery, detail shots, and background-removed clean cuts — using AI image generation via Kie.ai. Produce professional assets without a physical photo shoot.

## When This Activates
When creating product pages, ads, or social content for e-commerce clients. Requires a creative brief from the AI Creative Strategist skill.

> **Execution engine:** See `ai-image-generation.md` for the full Kie.ai model library, Dense Narrative prompt methodology, camera math reference, and API payload templates.

## Inputs Required
- Creative brief (from AI Creative Strategist)
- Product description and key features
- Brand aesthetic (colors, style, mood)
- Existing product photos if available (use as reference for `flux-2/pro-image-to-image`)
- Target platform and dimensions
- Shot type needed (hero, lifestyle, detail, scale)

---

## Shot Types & Model Routing

### Hero Shot
**Purpose:** Primary product image. Clean, focused, professional.
**Model:** `flux-2/pro-text-to-image`
**Characteristics:**
- Product centered, well-lit, on clean or branded background
- Shows the product at its best angle
- No distracting elements

**Prompt pattern:**
```
[Product name and exact category]. [Precise material description with physics — wall thickness, surface finish, texture].
[Color specification — use Pantone or hex if known]. [Key visual feature].
Shot on [focal length]mm lens, f/[aperture], ISO [value]. [Background — surface, color, material].
[Lighting — direction, quality, shadow description].
Product label perfectly legible. No floating. No shadow inconsistency.
No distortion. Commercial product photography, not CGI.
```

### Lifestyle Shot
**Purpose:** Show product in context. Help the buyer imagine using it.
**Model:** `nano-banana-2` (Dense Narrative method — fights AI beautification)
**Characteristics:**
- Product in a realistic, relatable setting
- Target audience represented naturally
- Candid, UGC energy — not posed or studio-perfect

**Prompt pattern:**
```
Ultra-realistic photo of [specific person description — age range, notable features, not generic].
[Exactly what they are doing with the product]. Natural skin: [specific imperfections — pores, redness, etc.].
[Outfit — specific materials and colors]. [Environment with specific details].
[Natural lighting behaviour — not studio]. Shot on 85mm lens, f/1.8, ISO [200–400].
Do not beautify. No skin smoothing. No makeup unless specified.
No posed stock photo energy. Candid documentary feel.
```

### Detail Shot
**Purpose:** Highlight specific features, materials, craftsmanship.
**Model:** `flux-2/pro-text-to-image`
**Characteristics:**
- Macro-style, extreme close-up
- Focus on texture, material physics, or unique feature
- Supports quality claims in copy

**Prompt pattern:**
```
Macro close-up of [specific product feature]. [Material description — scoring, texture, finish].
[Light scattering behaviour for this material].
Shot on 90mm macro lens, f/8, ISO 100. [Lighting direction — raking light to reveal texture].
No depth flattening. No over-sharpening. Photographic realism.
```

### Scale Shot
**Purpose:** Show relative size of the product.
**Model:** `flux-2/pro-text-to-image`
**Characteristics:**
- Product next to a familiar reference object
- Correct proportional rendering — no size distortion

### Background Removal (Clean Cut)
**Purpose:** Pure product on white/transparent background for e-commerce.
**Workflow:** Generate hero shot first → post-process with `recraft-remove-background`

---

## Process

### Step 1: Define Shot List
```markdown
## Shot List: [Product Name]

| Shot # | Type | Model | Description | Background | Aspect Ratio |
|--------|------|-------|-------------|------------|--------------|
| 1 | Hero | flux-2/pro-text-to-image | [details] | [color/material] | 1:1 |
| 2 | Lifestyle | nano-banana-2 | [details] | [setting] | 4:5 |
| 3 | Detail | flux-2/pro-text-to-image | [specific feature] | [minimal] | 1:1 |
| 4 | Clean cut | recraft-remove-background | Post-process from #1 | White/transparent | 1:1 |
```

### Step 2: Write Dense Narrative Prompts
For each shot, use the prompt patterns above. Key rules:
- **Camera math first** — always define focal length, aperture, ISO
- **Material physics** — never say "looks nice" — describe how light behaves on the surface
- **Inline negatives** — embed `Do not...` commands inside the positive prompt
- **Exact specs** — brand colors (hex/Pantone), exact dimensions if known, specific label text

### Step 3: Draft Phase (1K resolution)
Generate 3–5 variants at `1K` with `flux-2/flex-text-to-image` (cheaper) or `nano-banana-2`:
- Vary one element per variant: lighting angle, background tone, camera angle
- Speed over perfection at this stage

### Step 4: Selection
Human reviews all draft variants:
- [ ] Product shape and colour are accurate
- [ ] Lighting looks natural and professional
- [ ] Background supports (not competes with) the product
- [ ] Label/text is legible
- [ ] Consistent with brand aesthetic

### Step 5: Final Production (2K → 4K)
For the winning variant:
1. Regenerate at `2K` with `flux-2/pro-text-to-image` (same prompt)
2. If needed for print or large-format ads: upscale with `topaz-image-upscale`
3. If e-commerce clean cut needed: run through `recraft-remove-background`

### Step 6: Upload to Supabase
```json
POST /rest/v1/media_assets
{
  "client_id": "[uuid]",
  "asset_type": "image",
  "file_url": "[Supabase storage URL]",
  "file_name": "[product-name-shot-type-v1.jpg]",
  "platform": "[shopify | amazon | instagram | facebook]",
  "notes": "[Shot type, model used, prompt version]"
}
```

---

## Platform Specs Quick Reference
| Platform | Dimensions | Aspect Ratio | Notes |
|----------|-----------|--------------|-------|
| Shopify main | 2048×2048 | 1:1 | White background preferred |
| Amazon main | 1600×1600 min | 1:1 | Pure white background required |
| Instagram feed | 1080×1080 | 1:1 | Square, lifestyle preferred |
| Instagram portrait | 1080×1350 | 4:5 | Best performing feed format |
| Instagram Story | 1080×1920 | 9:16 | Vertical lifestyle |
| Facebook ad | 1200×628 | 16:9 | Landscape lifestyle |
| Pinterest | 1000×1500 | 2:3 | Vertical, lifestyle with text overlay |

---

## Reference Image Workflow (when client has existing photos)
When the client has existing product photos but needs new backgrounds, scenes, or styles:
```json
{
  "model": "flux-2/pro-image-to-image",
  "input": {
    "prompt": "Same product, new scene: [describe the new environment and lighting]",
    "negative_prompt": "shadow inconsistency, floating product, label distortion",
    "input_urls": ["[URL of client's existing product photo]"],
    "aspect_ratio": "1:1",
    "resolution": "2K"
  }
}
```

---

## Quality Gates
- [ ] Shot list aligns with creative brief
- [ ] Model selected per shot type (not one model for everything)
- [ ] Camera math specified in every prompt
- [ ] Material physics described specifically
- [ ] Anti-AI negative stack applied
- [ ] Product is accurately represented (no misleading imagery)
- [ ] Lighting and style consistent across the set
- [ ] Images meet platform dimension requirements
- [ ] Human has approved final selections
- [ ] Brand aesthetic maintained across all shots
- [ ] Final URLs saved to `media_assets` table
