# Skill: SEO Content

## Purpose
Produce content that ranks in search AND reads like a human wrote it. Balance search optimization with genuine readability. Quality over volume — one excellent piece beats five mediocre ones.

## When This Activates
Part of the Traffic Stack, when creating blog posts, guides, or pillar content targeting specific keywords.

## Inputs Required
- Target keyword(s) from Keyword Research skill
- Search intent (informational, transactional, navigational, commercial)
- Brand voice profile
- Topic expertise / unique perspective
- Competitor content for the same keyword (what exists already)

## Process

### Step 1: Search Intent Analysis
Before writing a single word, determine:

| Intent Type | What They Want | Content Format |
|-------------|---------------|----------------|
| Informational | Learn something | Guide, how-to, explainer |
| Transactional | Buy something | Product page, comparison, review |
| Navigational | Find a specific site/page | Landing page, brand page |
| Commercial | Research before buying | Comparison, best-of, review |

**Rule:** If your content format doesn't match the search intent, it won't rank regardless of quality.

### Step 2: Competitive Content Audit
Analyze the top 5 results for the target keyword:
- What format do they use?
- What do they cover well?
- What do they miss? (this is your opportunity)
- What's their content depth? (word count isn't the goal — completeness is)
- What unique perspective can you add that they can't?

### Step 3: Content Architecture
```markdown
## Title: [Keyword-optimized + compelling for humans]

### H2: [Section 1 — address primary intent]
### H2: [Section 2 — expand on the topic]
### H2: [Section 3 — unique perspective / what competitors miss]
### H2: [Section 4 — practical application]
### H2: [FAQ — target "People Also Ask" queries]
```

**Rules for structure:**
- Title includes target keyword naturally (not forced)
- H2s address subtopics and related keywords
- Each section answers a specific question
- FAQ section targets PAA (People Also Ask) queries

### Step 4: Write Key Takeaways (MANDATORY)
Before writing the full article, generate a Key Takeaways section. This appears at the top of every blog post and gives readers immediate value.

**Format:**
1. **Intro paragraph** (2-3 sentences) — sets context for the takeaways
2. **5-8 bullet points** — each formatted as:
   `* **Action-driven bold heading:** Concise explanation with specific detail.`
3. **Outro paragraph** (1-2 sentences) — bridges into the main article

**Rules for Key Takeaways:**
- Each heading must be action-driven and specific (NOT generic like "Important consideration")
- Each bullet must deliver standalone value — a reader who only scans these should learn something
- Incorporate the hidden insight / unique angle if one exists
- Include specific numbers, data, or actionable advice where possible
- Save the key_takeaways field separately AND include as ## Key Takeaways at the top of body_markdown

**Example:**
```markdown
AI automation is transforming small businesses by optimizing workflows and enhancing decision-making. Below are the key takeaways.

* **AI enables true autonomy through adaptive learning:** Unlike traditional systems, AI learns and evolves over time, reducing human supervision by refining its decision-making independently.
* **Beyond fixed rules — AI adapts in real time:** AI-driven automation dynamically adjusts to changing environments, solving complex tasks without constant reprogramming.
* **AI minimizes decision fatigue, maximizing human focus:** By handling routine decisions autonomously, AI reduces cognitive load, allowing teams to focus on high-value work.

AI-driven automation offers a new frontier for workflow innovation. In the sections ahead, we'll explore its core components and strategies for seamless integration.
```

### Step 5: Write the Content
Follow these principles:

**Opening (First 100 words):**
- Hook the reader immediately (no "In this article, we'll explore...")
- Address the reader's intent directly
- Establish credibility (why should they listen to you?)

**Body:**
- One idea per section
- Use examples, data, and specifics
- Write at the audience's level (don't talk down, don't over-jargon)
- Short paragraphs (2-4 sentences)
- Use subheadings every 200-300 words
- Include original insights the reader can't get elsewhere

**Closing:**
- Summarize the key takeaway (one sentence)
- Clear next step / CTA
- No "In conclusion..." (just conclude)

### Step 6: SEO Optimization Pass
- [ ] Target keyword in title, H1, first 100 words, and 1-2 H2s
- [ ] Related keywords appear naturally throughout
- [ ] Meta description: 150-160 chars, includes keyword, compelling to click
- [ ] Internal links to related content (if available)
- [ ] Image alt text is descriptive and keyword-relevant
- [ ] URL slug is short and keyword-focused

### Step 7: Self-Assessment Scores
After writing, self-assess the content and provide scores:

**SEO Score (0-100):** Rate based on:
- Keyword placement (title, H1, first 100 words, H2s, meta description)
- Related keyword coverage throughout the content
- URL slug optimization
- Image alt text quality
- Internal/external linking

**Readability Score (0-100):** Rate based on:
- Sentence length variety (mix of short and long)
- Paragraph length (2-4 sentences ideal)
- Jargon level appropriate for audience
- Subheading frequency (every 200-300 words)
- Active voice usage
- Transition quality

Save both scores with brief analysis text explaining strengths and areas for improvement.

### Step 8: Human Quality Pass
**CRITICAL: Human checkpoint required before publishing.**
- [ ] Fact-check ALL claims, statistics, and data points
- [ ] Verify all links work and point to reputable sources
- [ ] Add unique perspective that only a human expert could provide
- [ ] Read aloud — does it sound natural?
- [ ] Remove all AI artifacts (see Direct Response Copy skill checklist)

## AI Artifact Removal for SEO Content
Kill these on sight:
- "In today's digital landscape..."
- "When it comes to [topic]..."
- "It's important to note that..."
- "In this comprehensive guide..."
- Any paragraph that says nothing specific
- Transition phrases that pad word count without adding value

## Quality Gates
- [ ] Search intent matched to content format
- [ ] Competitive gap identified and addressed
- [ ] Target keyword appears naturally (not stuffed)
- [ ] Content adds unique value beyond what already ranks
- [ ] Human has fact-checked all claims
- [ ] Zero AI artifacts remain
- [ ] Reads like an expert wrote it, not an algorithm
