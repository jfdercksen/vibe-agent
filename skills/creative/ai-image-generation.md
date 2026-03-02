# Skill: AI Image Generation (Kie.ai)

## Purpose
Execute all AI image generation via the Kie.ai unified API. This skill contains the model routing guide, prompt engineering methodology, and API execution patterns used by every visual skill (Product Photo, Social Graphics, Product Video, Talking Head).

---

## Confirmed Model Library

All models use `POST https://api.kie.ai/api/v1/jobs/createTask` with `Authorization: Bearer {KIE_API_KEY}`.

### Image — Text-to-Image

| Model ID | Best For | Speed | Quality |
|----------|----------|-------|---------|
| `nano-banana-2` | Lifestyle shots, UGC-style, hyper-realistic people, quick drafts | ⚡ Fast | ★★★★ |
| `flux-2/pro-text-to-image` | Clean product shots, hero images, consistent renders | ⚡⚡ | ★★★★★ |
| `flux-2/flex-text-to-image` | Same as Pro but cheaper — use for drafts and variants | ⚡⚡ | ★★★★ |
| `gpt-image/1.5-text-to-image` | **Social graphics with text overlays** — best text accuracy | ⚡⚡ | ★★★★★ |
| `seedream/4.5-text-to-image` | Fashion, beauty, lifestyle — strong detail and skin rendering | ⚡⚡ | ★★★★★ |
| `seedream/5-lite-text-to-image` | Faster Seedream — good for lifestyle variants | ⚡⚡ | ★★★★ |
| `grok-imagine/text-to-image` | Stylized/editorial creative concepts | ⚡ | ★★★★ |
| `qwen/text-to-image` | Quick product context shots, infographics | ⚡⚡ | ★★★ |

### Image — Image-to-Image (requires reference image URL)

| Model ID | Best For |
|----------|----------|
| `flux-2/pro-image-to-image` | Style transfer — adapt existing product photos to new scenes/backgrounds |
| `flux-2/flex-image-to-image` | Draft-level style transfers, background swaps |
| `qwen/image-to-image` | Quick image remixing |
| `qwen/image-edit` | Targeted edits to specific areas of an image |
| `ideogram/character` | Character consistency — requires reference images |

### Post-Production

| Model ID | Best For |
|----------|----------|
| `recraft-remove-background` | Clean background removal for product shots |
| `topaz-image-upscale` | Upscale to print/ad resolution |

---

## Model Selection Decision Tree

```
What are you generating?
├── Product on clean/white background → flux-2/pro-text-to-image
├── Lifestyle shot with people → nano-banana-2 (Dense Narrative method)
├── Social graphic with headline/text → gpt-image/1.5-text-to-image
├── Fashion or beauty content → seedream/4.5-text-to-image
├── Remixing an existing photo → flux-2/pro-image-to-image
├── Quick draft / variant test → flux-2/flex-text-to-image or nano-banana-2
└── Creative/stylized concept → grok-imagine/text-to-image
```

---

## Prompt Engineering Methodology

### The Dense Narrative Format (Use for ALL realistic image requests)

Construct every prompt as a dense, physics-specific description — not a vague instruction. The model needs to "see" the scene, not be told what kind of image to make.

**Prompt structure:**
```
[Subject] + [Exact physical/material description] + [Lighting behaviour] + [Camera math] + [Environment] + [Inline negative commands]
```

**Example — product hero shot:**
```
A 250ml amber glass serum bottle with matte black aluminium pump cap.
Borosilicate glass 3mm wall, slight caustic refraction at base.
Label: clean sans-serif typography, cream paper stock, debossed logo.
Shot on 90mm macro lens, f/8, ISO 100.
Placed on a warm white marble surface with fine grey veining.
Directional soft-box lighting at 45° left, casting a soft shadow right.
No floating. No shadow inconsistency. Label perfectly legible.
No AI render artifacts. No synthetic reflections. Commercial product photography.
```

**Example — lifestyle shot with person:**
```
Ultra-realistic photo of a 28-year-old woman using a moisturiser after washing her face.
Natural skin: visible pores on nose and cheeks, slight redness around nostrils, one small
blemish on left jaw, light peach fuzz. No makeup. Hair damp, pulled loosely back.
Wearing an oversized grey linen shirt. Bathroom environment: white subway tile,
natural morning light from a side window creating soft cross-light with slight warm tint.
Shot on 85mm lens, f/1.8, ISO 400. Candid, not posed.
Do not beautify. Do not smooth skin. No filters. No studio lighting. UGC energy.
```

---

### Camera Mathematics

Always define focal length, aperture, and ISO. This forces the model to simulate optical physics instead of digital rendering.

| Shot Type | Lens | Aperture | ISO | Effect |
|-----------|------|----------|-----|--------|
| Product macro (detail) | 90mm | f/8 | 100 | Deep focus, clinical clarity |
| Product hero (clean) | 50mm | f/5.6 | 100 | Natural perspective, sharp |
| Lifestyle with context | 35mm | f/4 | 400 | Wide enough for setting, still sharp |
| Portrait / UGC person | 85mm | f/1.8 | 200–400 | Shallow DOF, natural bg blur |
| Smartphone UGC style | 24mm equiv. | f/2.2 | 800–1600 | Phone camera physics, grain, slight noise |
| Flat lay / overhead | 50mm | f/8 | 200 | Even, no distortion |

---

### Material Physics Language

Replace vague descriptions with physics-specific language. The model understands material science.

**Packaging & Products:**
- `matte kraft paper, 0.4mm thickness, micro-embossed logo, visible fibre texture`
- `clear PET bottle, 2mm wall, slight refraction at shoulders, clean seam line`
- `frosted glass jar, subsurface translucency, polished chrome lid with specular highlight`

**Metals:**
- `brushed anodized aluminum, directional grain at 45°, specular highlight streak at 30°`
- `polished stainless steel, sharp reflections, visible face micro-scratches`

**Fabric:**
- `280gsm French terry cotton, visible warp/weft, slight pilling at collar, soft shadow in folds`
- `silk charmeuse, wet-look sheen, drape shadows, micro-wrinkles at seams`

**Skin:**
- `visible pores on nose and cheeks, mild redness, subtle freckles, peach fuzz on jaw, natural asymmetry`
- `deep skin tone, visible pore texture, slight shine on forehead, natural lip colour variation`

---

### Negative Prompt Stacks

**Universal Anti-AI Stack (use every time):**
```
plastic skin, skin smoothing, airbrushed texture, anatomy normalization, body proportion averaging,
beauty filters, professional retouching, editorial fashion proportions, stylized realism,
CGI render, 3D render, digital art, illustration, depth flattening, perfect symmetry,
oversaturated colors, synthetic lighting, uncanny valley, dataset-average anatomy
```

**Product-Specific Additions:**
```
floating product, shadow inconsistency, label distortion, text warping, extra products,
background clutter, wrong brand colors, fake reflections, over-sharp edges
```

**Text/Graphics Additions (for social graphics):**
```
blurry text, distorted letters, misspelled words, font inconsistency, overlapping text,
illegible typography, garbled characters
```

**Lifestyle/People Additions:**
```
mirror selfie, reflections in background, overlit studio look, posed stock photo energy,
heavy makeup unless specified, false eyelashes, unnatural hair
```

---

### Inline Negative Commands (put these IN the positive prompt)

For maximum effect, embed refusals directly into the prompt text:
- `Do not beautify or alter facial features.`
- `No skin smoothing. No makeup enhancement.`
- `Label text must be perfectly legible.`
- `No synthetic lighting. Natural light only.`
- `No floating. Product must rest on surface with correct shadow.`

---

## API Payload Templates

### Text-to-Image (most models)
```json
{
  "model": "flux-2/pro-text-to-image",
  "input": {
    "prompt": "Your Dense Narrative prompt here",
    "negative_prompt": "plastic skin, skin smoothing, CGI, ...",
    "aspect_ratio": "4:5",
    "resolution": "2K",
    "output_format": "jpg"
  }
}
```

### Nano Banana 2 (accepts prompt only — no aspect_ratio/resolution in input)
```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "Your Dense Narrative prompt here",
    "aspect_ratio": "4:5",
    "resolution": "2K",
    "output_format": "jpg"
  }
}
```

### Image-to-Image (Flux-2)
```json
{
  "model": "flux-2/pro-image-to-image",
  "input": {
    "prompt": "Transform this product image: [description of desired output]",
    "negative_prompt": "...",
    "input_urls": ["https://your-reference-image-url.jpg"],
    "aspect_ratio": "1:1",
    "resolution": "2K"
  }
}
```

### GPT Image 1.5 (text-heavy graphics)
```json
{
  "model": "gpt-image/1.5-text-to-image",
  "input": {
    "prompt": "Your prompt with exact text strings in quotes",
    "aspect_ratio": "1:1",
    "resolution": "1K"
  }
}
```

### Poll for Completion
```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
Authorization: Bearer {KIE_API_KEY}
```
Response when done: `data.state === "success"` → `data.resultJson.resultUrls[0]`

---

## Resolution Guide

| Stage | Resolution | Use |
|-------|-----------|-----|
| Drafts & variants | `1K` | Speed and cost — iterate fast |
| Review selects | `2K` | Quality review before client approval |
| Final production | `4K` | Final approved assets for ads/print |

---

## Aspect Ratio Reference

| Platform | Ratio | Use |
|----------|-------|-----|
| Instagram feed / product | `1:1` | Square |
| Instagram feed portrait | `4:5` | Best performing feed format |
| Instagram / TikTok Story | `9:16` | Vertical full-screen |
| Facebook/LinkedIn ad | `16:9` | Landscape |
| Pinterest | `2:3` | Vertical |
| Shopify/Amazon hero | `1:1` | Square product image |
| YouTube thumbnail | `16:9` | Landscape |

---

## Workflow: Generate → Review → Upscale → Upload

1. **Draft at 1K** — generate 3–5 variants with `flux-2/flex-text-to-image` or `nano-banana-2`
2. **Select winner** — human reviews, picks the best composition
3. **Regenerate at 2K** with `flux-2/pro-text-to-image` (same prompt on winning model)
4. **Upscale to 4K** with `topaz-image-upscale` if needed for print/ads
5. **Background removal** with `recraft-remove-background` if needed for e-commerce
6. **Upload to Supabase** `images` bucket → save URL to `media_assets` table

---

## Quality Gates
- [ ] Model selected matches the use case (not defaulting to one model for everything)
- [ ] Camera math specified (focal length, aperture, ISO)
- [ ] Material physics described specifically (not vague)
- [ ] Anti-AI negative prompt stack applied
- [ ] Inline negative commands added to positive prompt
- [ ] 3 variants minimum before selection
- [ ] Resolution appropriate for stage (draft → select → final)
- [ ] For text graphics: exact text strings in quotes in prompt
- [ ] Human approves before uploading to Supabase
- [ ] Final URL saved to `media_assets` table with correct `client_id`
