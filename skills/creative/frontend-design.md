# Skill: Frontend Design

## Purpose
Create production-grade web pages (landing pages, sales pages, opt-in pages) with clean HTML/CSS. No AI artifact markers. Pages that look like a professional designer built them.

## When This Activates
Part of the Conversion Stack, after copy is written (Direct Response Copy skill), when a client needs a landing page, sales page, or any web page that converts.

## Inputs Required
- Completed copy (from Direct Response Copy skill)
- Brand guidelines (colors, fonts, logo)
- Positioning angle
- Brand voice profile
- Reference sites or design direction
- Conversion goal (what the page should achieve)

## Design Principles

### 1. Hierarchy Drives Attention
- Largest element = most important
- Use size, weight, color, and spacing to guide the eye
- Every section has ONE job
- Nothing competes for attention with the CTA

### 2. Whitespace Is a Feature
- Generous padding between sections
- Let content breathe
- Cramped layouts feel cheap
- Whitespace signals confidence

### 3. Typography Over Decoration
- Max 2 fonts (heading + body)
- Clear size hierarchy (h1 > h2 > h3 > body)
- Line height: 1.5-1.7 for body text
- Max line width: 65-75 characters for readability

### 4. Mobile First
- Design for mobile, then expand for desktop
- Touch-friendly buttons (min 44x44px)
- No horizontal scrolling
- Test at 375px width (iPhone SE)

### 5. Speed Matters
- Optimize images (WebP, lazy loading)
- Minimal JavaScript
- System fonts or limited web fonts
- No unnecessary animations

## Process

### Step 1: Define Page Architecture
Map the copy to sections:
```markdown
## Page: [Name]

### Section 1: Hero
- Headline: [from copy]
- Subheadline: [from copy]
- CTA: [button text]
- Visual: [hero image / video / illustration]

### Section 2: Problem
- Content: [from copy]
- Visual treatment: [icons / illustration / before-after]

### Section 3: Solution
- Content: [from copy]
- Visual treatment: [product screenshots / diagram]

### Section 4: How It Works
- Steps: [from copy]
- Visual: [numbered steps / icons / process diagram]

### Section 5: Benefits/Features
- Content: [from copy]
- Layout: [grid / cards / alternating rows]

### Section 6: Social Proof
- Testimonials: [quotes + names + photos]
- Logos: [client/press logos]
- Numbers: [key metrics]

### Section 7: FAQ
- Questions: [from copy / objection handling]

### Section 8: Final CTA
- Headline: [urgency/reminder]
- CTA: [button text]
- Micro-copy: [risk reducer]
```

### Step 2: Design System
Define before building:
```css
/* Color Palette */
--primary: [brand primary];
--secondary: [brand secondary];
--accent: [CTA / highlight color];
--background: [page background];
--text: [body text color];
--text-light: [secondary text];

/* Typography */
--font-heading: [heading font];
--font-body: [body font];
--h1: 3rem;
--h2: 2rem;
--h3: 1.5rem;
--body: 1rem;
--small: 0.875rem;

/* Spacing */
--section-padding: 5rem 0;
--container-max: 1200px;
--container-narrow: 768px;
```

### Step 3: Build the Page
HTML/CSS requirements:
- Semantic HTML (header, main, section, footer)
- CSS Grid or Flexbox for layout (no floats)
- Responsive breakpoints: 375px, 768px, 1024px, 1440px
- Accessible: proper heading hierarchy, alt text, color contrast
- Fast: inline critical CSS, lazy load images, minimal JS

### Step 4: CTA Optimization
Button design:
- High contrast against background
- Large enough to tap on mobile (min 44px height)
- Clear, action-specific text
- Subtle hover/focus state
- Micro-copy below the button (risk reducer)

### Step 5: Quality Review

**Visual checklist:**
- [ ] Page looks professional at all breakpoints
- [ ] Consistent spacing and alignment
- [ ] Typography hierarchy is clear
- [ ] Colors match brand guidelines
- [ ] Images are optimized and properly sized
- [ ] CTA stands out visually

**Technical checklist:**
- [ ] Valid HTML (no errors in validator)
- [ ] Responsive at all breakpoints
- [ ] Page load under 3 seconds
- [ ] Accessible (contrast, alt text, keyboard nav)
- [ ] No horizontal scroll on mobile
- [ ] Forms work correctly

**AI Artifact checklist:**
- [ ] No generic stock photo feeling
- [ ] No "tech startup" default aesthetic
- [ ] Design matches the brand, not a template
- [ ] Layout feels intentional, not auto-generated
- [ ] Typography choices are deliberate

## Quality Gates
- [ ] Copy is finalized BEFORE design begins
- [ ] Design system defined (colors, fonts, spacing)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] CTA is the most prominent element on the page
- [ ] Page speed acceptable (under 3s load)
- [ ] No AI tells in the design
- [ ] Human approves before launch
