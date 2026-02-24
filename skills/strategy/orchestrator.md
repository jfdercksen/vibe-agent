# Skill: Orchestrator

## Purpose
Route marketing objectives to the correct skill sequence. Eliminate blank-page syndrome by providing a clear execution path from goal to deliverable.

## When This Activates
When the user states a marketing goal, asks "where do I start?", or needs help choosing the right skill sequence for a project.

## Process

### Step 1: Identify the Goal
Ask the user to clarify:
- **What** are you trying to achieve? (traffic, conversions, brand awareness, nurture, launch)
- **Who** is the target audience?
- **What** business type? (info/education, consulting/agency, e-commerce, SaaS)
- **What** assets already exist? (brand voice doc, positioning, existing copy, website)

### Step 2: Select the Skill Stack
Based on the goal, recommend one of four primary stacks:

| Goal | Stack | Skill Sequence |
|------|-------|----------------|
| Brand foundation / new client | **Foundation** | Research → Brand Voice → Positioning Angles |
| Landing pages / sales pages / conversions | **Conversion** | Direct Response Copy → Frontend Design → Lead Magnet |
| Organic traffic / SEO / content | **Traffic** | Keyword Research → SEO Content → Content Atomizer |
| Email / retention / relationships | **Nurture** | Email Sequences → Newsletter → Content Atomizer |

### Step 3: Business Type Priority Matrix

| Business Type | Primary Stack | Secondary Stack |
|---------------|--------------|-----------------|
| Info/Education (courses, coaching) | Foundation + Conversion | Nurture |
| Consulting/Agency | Foundation + Traffic | Conversion |
| E-commerce | Conversion + Traffic | Nurture |
| SaaS | Conversion + Nurture | Traffic |

### Step 4: Check Prerequisites
Before executing any stack, verify:
- [ ] Research completed (30-60 min minimum)? If not → start with Research phase
- [ ] Brand Voice document exists? If not → run Brand Voice skill first
- [ ] Positioning Angles defined? If not → run Positioning Angles skill first
- [ ] Copy must precede design. Design must follow copy.
- [ ] Expert review checkpoint after each major deliverable

### Step 5: Present the Execution Plan
Output a numbered sequence like:
```
PROJECT: [Client Name] - [Goal]
STACK: [Primary] + [Secondary]

1. Research (Perplexity MCP) → save as /research/[client]-market-research.md
2. Brand Voice → save as /clients/[client]/brand-voice.md
3. Positioning Angles → save as /clients/[client]/positioning.md
4. [Next skill...] → save as [path]
5. Expert Review Checkpoint
6. Iteration cycle
```

## Key Rules
- NEVER skip research. Minimum 30-60 minutes of context gathering.
- NEVER go straight to copy without positioning.
- ALWAYS checkpoint after major deliverables.
- The five-stage sequence is non-negotiable: Research → Foundation → Structure → Assets → Iteration.
