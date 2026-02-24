# Skill: AI Product Photo

## Purpose
Generate e-commerce-ready product photography — both hero shots and lifestyle imagery — using AI image generation. Produce assets that look professional without a physical photo shoot.

## When This Activates
When creating product pages, ads, or social content for e-commerce clients. Requires a creative brief from the AI Creative Strategist skill.

## Inputs Required
- Creative brief (from AI Creative Strategist)
- Product description and key features
- Brand aesthetic (colors, style, mood)
- Existing product photos (if any, for reference)
- Target platform and dimensions
- Shot type needed (hero, lifestyle, detail, scale)

## Shot Types

### Hero Shot
**Purpose:** Primary product image. Clean, focused, professional.
**Characteristics:**
- Product centered, well-lit
- Neutral or branded background
- Shows the product at its best angle
- No distracting elements

### Lifestyle Shot
**Purpose:** Show the product in context. Help the buyer imagine using it.
**Characteristics:**
- Product in a realistic setting
- Target audience represented (or implied)
- Mood matches the brand positioning
- Tells a story about the product's place in life

### Detail Shot
**Purpose:** Highlight specific features, materials, or craftsmanship.
**Characteristics:**
- Close-up, macro-style
- Focuses on texture, material, or unique feature
- Supports quality claims in the copy

### Scale Shot
**Purpose:** Show relative size of the product.
**Characteristics:**
- Product next to a familiar reference object
- Answers "how big/small is this?"
- Useful for products where size is ambiguous online

## Process

### Step 1: Define Shot List
Based on the creative brief, specify:
```markdown
## Shot List: [Product Name]

| Shot # | Type | Description | Background | Mood | Dimensions |
|--------|------|-------------|------------|------|------------|
| 1 | Hero | [details] | [color/style] | [mood] | [size] |
| 2 | Lifestyle | [details] | [setting] | [mood] | [size] |
| 3 | Detail | [details] | [minimal] | [mood] | [size] |
```

### Step 2: Write Image Prompts
For each shot, craft a detailed generation prompt:
- Product description (shape, color, material, size)
- Lighting direction (soft natural, studio, dramatic, backlit)
- Camera angle (eye-level, overhead, 45-degree, low angle)
- Background/setting specifics
- Mood and color palette
- What to avoid (no text, no extra objects, no distortion)

### Step 3: Generate Variants
For each shot, generate 3-5 variants. Vary:
- Lighting angle
- Background color/setting
- Camera perspective
- Styling/props (for lifestyle shots)

### Step 4: Selection
Present all variants. Human selects winners based on:
- [ ] Product looks accurate and appealing
- [ ] Lighting is natural and professional
- [ ] Background supports (doesn't compete with) the product
- [ ] Image quality is sufficient for intended use
- [ ] Consistent with brand aesthetic across the set

### Step 5: Post-Processing Notes
Specify any needed adjustments:
- Color correction / brand color matching
- Background cleanup or extension
- Cropping for specific platforms
- Adding branded elements (logo, border)

## Platform Specs Quick Reference
| Platform | Dimensions | Notes |
|----------|-----------|-------|
| Shopify main | 2048x2048 | Square, white background preferred |
| Amazon main | 1600x1600 min | Pure white background required |
| Instagram feed | 1080x1080 | Square, lifestyle preferred |
| Instagram Story | 1080x1920 | Vertical, lifestyle |
| Facebook ad | 1200x628 | Landscape, lifestyle |
| Pinterest | 1000x1500 | Vertical, lifestyle with text overlay |

## Quality Gates
- [ ] Shot list aligns with creative brief
- [ ] Product is accurately represented (no misleading imagery)
- [ ] Lighting and style are consistent across the set
- [ ] Images meet platform dimension requirements
- [ ] Human has approved final selections
- [ ] Brand aesthetic is maintained
