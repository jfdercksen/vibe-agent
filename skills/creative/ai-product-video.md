# Skill: AI Product Video

## Purpose
Create product-focused motion content for ads and social media. Produce video assets at scale — product reveals, motion graphics, demo-style content, and UGC-style clips — using Kie.ai video models without traditional video production.

## When This Activates
When creating video ads, social video content, or product reveal animations. Requires a creative brief from the AI Creative Strategist skill. Product imagery from AI Product Photo is preferred as input for image-to-video models.

> **Image execution:** See `ai-image-generation.md` for still image generation before animating.

---

## Video Model Library (Kie.ai)

All use `POST https://api.kie.ai/api/v1/jobs/createTask`.

### Recommended Models by Use Case

| Use Case | Model ID | Notes |
|----------|----------|-------|
| Product reveal / showcase (high quality) | `kling-2.6-text-to-video` | Best for polished brand content |
| Animate existing product photo | `kling-2.6-image-to-video` | Start from AI Product Photo output |
| UGC-style / organic looking | `bytedance-v1-pro-text-to-video` | More naturalistic motion |
| Animate lifestyle photo | `bytedance-v1-pro-image-to-video` | Subtle motion on lifestyle shots |
| Fast draft / quick preview | `bytedance-v1-lite-text-to-video` | Cheaper, for concept testing |
| Cinematic / high-end ads | `kling-v2.1-pro` | Premium motion quality |
| Text-to-video concept | `wan-2.6-text-to-video` | Good for abstract/motion graphic style |
| Image-to-video concept | `wan-2.6-image-to-video` | Animate stills with cinematic motion |

### API Payload (standard)
```json
{
  "model": "kling-2.6-image-to-video",
  "input": {
    "prompt": "Slow cinematic zoom on the product. Soft studio lighting. Gentle rotation revealing the label. Premium brand feel.",
    "image_url": "[URL of product still from AI Product Photo]",
    "duration": 5,
    "aspect_ratio": "9:16"
  }
}
```

---

## Video Types

### Product Reveal
**Purpose:** Introduce a product with visual impact.
**Duration:** 5–15 seconds
**Model:** `kling-2.6-image-to-video` (start from hero shot)
**Structure:** Still → Slow motion reveal → Feature highlight → Logo end card

### Feature Highlight
**Purpose:** Demonstrate a specific feature or benefit in motion.
**Duration:** 10–20 seconds
**Model:** `kling-2.6-text-to-video` or `bytedance-v1-pro-text-to-video`
**Structure:** Feature in action → Result → Brief brand moment

### UGC / Testimonial Style
**Purpose:** Organic-feeling social proof video.
**Duration:** 15–45 seconds
**Model:** `bytedance-v1-pro-text-to-video`
**Structure:** Person with problem → Using product → Clear result → Recommendation
**Key prompt note:** "Handheld camera, natural lighting, slightly imperfect framing, not studio."

### Lifestyle Motion
**Purpose:** Animate a lifestyle still to add depth and movement.
**Duration:** 3–8 seconds
**Model:** `kling-2.6-image-to-video` or `wan-2.6-image-to-video`
**Use case:** Turn a nano-banana-2 lifestyle photo into a short loop for Stories/Reels.

### Motion Graphic / Explainer
**Purpose:** Explain concept, process, or value proposition.
**Duration:** 15–60 seconds
**Model:** `wan-2.6-text-to-video`
**Structure:** Hook → Problem → Solution → How it works → CTA

---

## Process

### Step 1: Script the Video
```markdown
## Video Script: [Name]

**Duration:** [X seconds]
**Aspect Ratio:** [16:9 / 9:16 / 1:1]
**Model:** [Which Kie.ai video model]
**Input image:** [URL if using image-to-video]

| Time | Visual | Audio/Text Overlay | Notes |
|------|--------|-------------------|-------|
| 0–2s | [Hook visual] | [Hook text] | Must stop the scroll |
| 2–6s | [Problem or context] | [Copy] | |
| 6–12s | [Product in action] | [Key benefit] | |
| 12–18s | [Result or proof] | [Social proof / data] | |
| 18–20s | [CTA screen] | [CTA + URL] | Logo visible |
```

### Step 2: Start from a Strong Still
The best videos start from a great product photo. Recommended workflow:
1. Generate hero/lifestyle still with AI Product Photo skill
2. Upload to Supabase `images` bucket → get public URL
3. Use URL as `image_url` input for image-to-video model

### Step 3: Write the Video Prompt
Video prompts differ from image prompts — focus on **motion direction, camera behaviour, and atmosphere**:

**For product videos:**
```
Slow cinematic [push in / pull back / orbit] around [product description].
[Lighting description — soft studio / natural daylight / dramatic backlit].
[Specific motion — gentle rotation, surface ripple, steam rising, liquid pour].
[Speed — slow motion / real time / slightly sped up].
[Mood — premium, natural, clinical, playful].
No text overlays. No cuts. Single continuous motion. Professional brand quality.
```

**For UGC/lifestyle:**
```
Handheld smartphone footage. [Person] [action with product].
Natural environment: [specific setting]. Available light only.
Slightly imperfect framing — authentic, not directed.
Real-time speed. Candid energy, not acted.
```

### Step 4: Generate Variants
Create 2–3 variants per concept:
- **Motion variants:** Zoom in vs orbit vs pull back
- **Speed variants:** Slow motion vs real time
- **Duration variants:** 5s vs 10s cuts from same concept
- **Platform variants:** 9:16 (Reels/TikTok), 16:9 (YouTube ad), 1:1 (Feed)

### Step 5: Review
- [ ] First 2 seconds are scroll-stopping (no slow fades or empty frames)
- [ ] Key message is readable with sound off
- [ ] Motion feels natural — no AI glitching, warping, or flickering
- [ ] Brand elements visible at some point
- [ ] Duration appropriate for platform

### Step 6: Upload to Supabase
```json
POST /rest/v1/media_assets
{
  "client_id": "[uuid]",
  "asset_type": "video",
  "file_url": "[Supabase storage URL]",
  "file_name": "[product-name-video-type-v1.mp4]",
  "platform": "[instagram | tiktok | youtube | facebook]",
  "notes": "[Video type, model used, duration, aspect ratio]"
}
```

---

## Platform Specs Quick Reference
| Platform | Aspect Ratio | Duration | Notes |
|----------|-------------|---------|-------|
| Instagram Reels | 9:16 | 5–90s | Hook in first 1–2s |
| TikTok | 9:16 | 5–60s | Native-feeling, not polished |
| YouTube Shorts | 9:16 | 5–60s | Title card helpful |
| YouTube Ad | 16:9 | 6s, 15s, or 30s | Skip button at 5s |
| Facebook/Instagram Feed | 1:1 or 4:5 | 5–60s | Autoplay, sound off assumed |
| LinkedIn | 16:9 or 1:1 | 15–90s | Professional tone |

---

## Quality Gates
- [ ] Script follows hook → problem → solution → CTA arc
- [ ] First 2 seconds are scroll-stopping (no slow intros)
- [ ] Watchable with sound off (text overlays / captions present)
- [ ] No AI motion artifacts (warping, flickering, inconsistent objects)
- [ ] 2–3 variants generated for testing
- [ ] Platform specs met (aspect ratio, duration)
- [ ] Human approves before publishing
- [ ] Final URL saved to `media_assets` table with `asset_type: "video"`
