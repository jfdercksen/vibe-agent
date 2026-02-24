# Skill: Interactive Lead Magnets

## Purpose
Generate two self-contained HTML assets for each lead magnet:
1. **Interactive Tool** — a fully functional quiz, scorecard, assessment, or calculator (embeddable anywhere via iframe)
2. **Opt-in Landing Page** — a complete HTML opt-in page for lead magnet delivery

Both are stored in Supabase Storage (`documents` bucket) and previewed live in the dashboard via the Interactive Tool and Opt-in Page tabs.

## When This Activates
- User asks to "build a quiz", "create a scorecard", "make a calculator", "generate an assessment tool"
- User asks to "create the opt-in page HTML", "generate the landing page for this lead magnet"
- Part of the Conversion Stack — runs AFTER the Lead Magnet concept is defined and saved

---

## Pre-Requisites (Non-Negotiable)

Before generating any HTML:

1. Call `get_existing_content('lead_magnets')` to get:
   - `id` (required for `save_lead_magnet_html`)
   - `title`, `core_promise`, `opt_in_headline`, `opt_in_subheadline`, `opt_in_bullets`, `opt_in_cta`
   - `bridge_to_offer`, `framework`, `format`

2. If no lead magnet record exists yet, run the Lead Magnet strategy skill first to create one.

3. Retrieve brand colors from `brand_voices` record (primaryColor, secondaryColor, font preferences).

Generate BOTH the interactive tool AND the opt-in page in the same conversation turn whenever possible.

---

## Part 1: Interactive Tool Generator

### Supported Tool Types

#### A. Quiz / Assessment (Best for: diagnosis, readiness scores, personality types)
- 5–10 questions, each with 3–4 answer options
- Progress bar: "Question 3 of 7"
- Each answer maps to a point value or category tag
- 3–5 distinct result outcomes with personalised copy
- Results screen: outcome title + explanation + lead capture form placeholder
- Optional: simple branching (if answer X → skip to question Y)

#### B. Scorecard (Best for: audits, health checks, performance reviews)
- 6–12 criteria, each rated 1–5 or Yes/No
- Group criteria into 2–4 sections (e.g. "Marketing", "Sales", "Operations")
- Total score mapped to named bands (e.g. 0–20: "Needs Work", 21–40: "On Track", 41–60: "Thriving")
- Per-section subtotals shown in results
- Results in a clean card layout with brand colours

#### C. Calculator (Best for: ROI, savings, pricing, sizing)
- 2–6 labelled numeric input fields with units
- Formula computed in JS (no server calls, pure client-side)
- Output: formatted result + "What this means" explanation copy
- Example: "Your estimated monthly savings: £4,200 — that's £50,400 per year"
- Lead capture form placeholder follows the result

### HTML Requirements (Strict — no exceptions)

```
✅ Complete valid HTML document: <!DOCTYPE html> through </html>
✅ All CSS in <style> tag in <head> — NO external stylesheets or CDN links
✅ All JS in <script> tag before </body> — NO jQuery, NO frameworks, NO CDN links
✅ Vanilla JS only — zero external dependencies
✅ Works fully offline
✅ Mobile-first — no horizontal scroll at 375px width
✅ Touch-friendly — minimum 44px button height
✅ Font: system-ui, -apple-system, sans-serif (no Google Fonts — avoids external requests)
✅ Apply brand primaryColor and secondaryColor from client's brand_voices record
```

### Recommended JS Architecture

```javascript
// State machine pattern — always render from state, never manipulate DOM directly
const CONFIG = {
  questions: [
    { id: 1, text: 'Question text', options: [
      { label: 'Option A', value: 1 },
      { label: 'Option B', value: 2 },
    ]},
  ],
  results: [
    { minScore: 0,  maxScore: 5,  title: 'Beginner',    copy: '...' },
    { minScore: 6,  maxScore: 10, title: 'Intermediate', copy: '...' },
    { minScore: 11, maxScore: 15, title: 'Advanced',     copy: '...' },
  ],
}

const state = { screen: 'intro', currentQ: 0, answers: [], score: 0 }

function render() {
  // Clear and rebuild UI based on state.screen
  // 'intro' | 'question' | 'results'
}

function selectAnswer(value) {
  state.answers.push(value)
  state.score += value
  state.currentQ++
  if (state.currentQ >= CONFIG.questions.length) {
    state.screen = 'results'
  } else {
    // state.screen stays 'question'
  }
  render()
}

function start() { state.screen = 'question'; render() }
function restart() { Object.assign(state, { screen: 'intro', currentQ: 0, answers: [], score: 0 }); render() }

document.addEventListener('DOMContentLoaded', render)
```

### Lead Capture Form Placeholder

ALWAYS include at the end of the results screen. Mark clearly with HTML comments so the client knows where to insert their ESP embed:

```html
<!-- ══════════════════════════════════════════════════════
     LEAD CAPTURE FORM PLACEHOLDER
     Replace this section with your email service provider embed:
     Mailchimp, ConvertKit, ActiveCampaign, Klaviyo, etc.

     The form should collect: First Name + Email Address
     On submit: deliver the lead magnet + trigger welcome sequence

     Your bridge-to-offer copy goes below the form:
     "Ready to take the next step? [bridge_to_offer from lead magnet record]"
     ══════════════════════════════════════════════════════ -->
<div class="lm-optin-wrap">
  <h3 class="lm-optin-title">Get your personalised action plan</h3>
  <p class="lm-optin-sub">[Insert bridge_to_offer copy here]</p>
  <form class="lm-form" onsubmit="return false;">
    <input type="text"  class="lm-input" placeholder="First name" aria-label="First name" />
    <input type="email" class="lm-input" placeholder="Email address" aria-label="Email address" />
    <button type="submit" class="lm-btn">[opt_in_cta from lead magnet record]</button>
  </form>
  <p class="lm-privacy">No spam. Unsubscribe anytime.</p>
</div>
```

---

## Part 2: Opt-in Page Generator

### Required Page Sections (in order)

1. **Hero** — H1 (`opt_in_headline`), subheadline (`opt_in_subheadline`), primary CTA button, lead magnet visual placeholder
2. **What You Get** — `opt_in_bullets` as a styled benefit list with icons/checkmarks
3. **Form Section** — Lead capture form placeholder (same pattern as above)
4. **Social Proof** — Optional placeholder: one testimonial or trust statement
5. **Footer** — Privacy note, unsubscribe reminder, brand name

### Copy Source (pull directly from lead_magnets record)

| Page Element | Source Field |
|---|---|
| H1 | `opt_in_headline` |
| Subheadline | `opt_in_subheadline` |
| Benefit bullets | `opt_in_bullets` array |
| CTA button text | `opt_in_cta` |
| Core promise | `core_promise` (supporting hero copy) |
| Post-form copy | `bridge_to_offer` |

### Design Requirements

```
✅ Single-column layout, max-width 580px centred
✅ Above-the-fold CTA: primary button visible without scrolling on mobile (375px)
✅ High-contrast CTA button — use brand primaryColor
✅ Micro-copy below button: "Free instant access. No credit card required."
✅ Clean whitespace — do not over-design
✅ Lead magnet visual: use a styled placeholder div (e.g. "📄 [Title] PDF")
   — client will replace this with real mockup image later
✅ Same HTML requirements as the interactive tool (zero external deps, self-contained)
```

---

## Save Pattern (Mandatory — follow exactly)

After generating each HTML file:

### Step 1 — Write the HTML in your response
Show a brief code preview (first 20 lines) so the user can see what was generated.

### Step 2 — Call save_lead_magnet_html
```
save_lead_magnet_html({
  clientId: [current client ID from context],
  leadMagnetId: [id from get_existing_content('lead_magnets')],
  htmlContent: [the complete HTML string],
  htmlType: 'interactive'   // or 'optin_page'
})
```

### Step 3 — Confirm to the user
After the tool returns a URL:
> "Your [interactive quiz / opt-in page] is saved. Open the Lead Magnets tab in the dashboard and click the [Interactive Tool / Opt-in Page] preview tab to see it live."

### Full conversation turn sequence (both assets):
1. Get lead magnet record → `get_existing_content('lead_magnets')`
2. Generate interactive tool HTML → call `save_lead_magnet_html(htmlType: 'interactive')`
3. Generate opt-in page HTML → call `save_lead_magnet_html(htmlType: 'optin_page')`
4. Confirm both preview tabs are now active

---

## Quality Gate Checklist

Before finalising either HTML file, verify:

- [ ] HTML document is complete and valid (`<!DOCTYPE html>` → `</html>`)
- [ ] Zero external dependencies (no CDN links, no Google Fonts, no jQuery)
- [ ] Renders without horizontal scroll at 375px width
- [ ] All buttons are at least 44px tall (touch-friendly)
- [ ] Brand primaryColor and secondaryColor applied from client record
- [ ] CTA text matches `opt_in_cta` from the lead magnets record
- [ ] Lead capture form placeholder is present and clearly commented
- [ ] `bridge_to_offer` copy appears near or below the form
- [ ] Interactive tool: all questions/criteria/inputs render and function correctly
- [ ] Opt-in page: all five sections present (hero, bullets, form, social proof, footer)
- [ ] `save_lead_magnet_html` returned a URL (not an error) for each file
- [ ] Both tabs confirmed active in dashboard before ending the turn

---

## Platform Notes

**Where these HTML files live:**
- Stored in Supabase Storage `documents` bucket (private)
- Accessed via 10-year signed URL stored in `lead_magnets.interactive_url` and `lead_magnets.optin_page_url`
- Previewed in the dashboard Lead Magnets modal → Interactive Tool / Opt-in Page tabs
- The interactive tool can be embedded on any external page via the iframe embed code in the dashboard

**What the client does next:**
1. Review in the dashboard preview tabs
2. Replace the lead capture form placeholder with their ESP embed code
3. Replace the lead magnet visual placeholder with their real cover/mockup image
4. Publish the opt-in page via their website or a page builder
5. Embed the interactive tool on their website, blog posts, or ad landing pages
