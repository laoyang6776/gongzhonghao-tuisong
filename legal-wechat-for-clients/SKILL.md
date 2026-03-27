---
name: legal-wechat-for-clients
description: Rewrite or draft Chinese legal WeChat Official Account articles for clients, family members, and business owners with a professional-but-clear tone. Use when the user wants legal公众号文章改写、法律类选题写作、面向当事人的刑事法律内容、首图提示词生成, or a full workflow that rewrites an article, creates a WeChat cover image, and prepares WeChat draft publishing.
---

# Legal WeChat Writing For Clients

This skill turns professional legal material into WeChat articles that ordinary clients can understand, trust, and act on.

## When To Use

Use this skill when the user wants any of the following:

- Rewrite a legal article for a WeChat Official Account
- Keep a serious legal style but make it readable for clients
- Write for criminal-defense prospects, family members, or business owners facing criminal risk
- Generate a WeChat-ready title, summary, body, and cover prompt
- Chain article writing with `baoyu-image-gen` and `baoyu-post-to-wechat`

Do not use this skill for:

- Pure academic papers
- Lawyer-to-lawyer research memos
- Casual marketing copy with aggressive sales language

## Default Goal

Preserve the source material's professional structure and legal rigor, but rewrite it so that a non-lawyer reader can quickly understand:

- What happened
- Why it matters
- What the legal risk is
- What the reader should do next

## Reader Model

Default audience is mixed. Write for all three unless the user specifies one primary group:

- Ordinary parties: care about whether the case is serious, whether filing/detention/prosecution is likely, and what to do next
- Family members: care about meeting, bail pending trial, restitution, procedure, and timing
- Business owners: care about criminal risk, asset seizure/freezing, cross-over civil-criminal disputes, business continuity, and compliance response

Default tone: `professional but easy to understand`.

## Non-Negotiable Writing Rules

1. Keep the conclusion first. Do not bury the answer.
2. Use clear heading hierarchy and stable logical progression.
3. Explain every legal term in plain language the first time it appears.
4. Translate institutional analysis into reader impact: `this rule means what for you`.
5. Avoid long abstract theory blocks without practical takeaway.
6. End with 2-4 concrete reminders, risk tips, or next steps.
7. Maintain legal precision. Do not over-promise outcomes or give false certainty.

## Style Source: How To Use The Reference Samples

The user's reference articles are style anchors for:

- Professional rigor
- Calm and authoritative tone
- Clear sectioning
- Boundary-aware legal reasoning
- Stable transitions and conclusion-first structure

They are **not** templates for direct phrasing. Do not copy sentence shapes too closely. Learn the structure, not the distance from ordinary readers.

Read these references before substantial drafting:

- [references/style-profile.md](references/style-profile.md)
- [references/article-templates.md](references/article-templates.md)
- [references/client-translation-rules.md](references/client-translation-rules.md)

## Workflow

### 1. Identify Article Type

Choose the closest template:

- `rules-impact`: explains how a rule or procedure affects the reader
- `issue-analysis`: explains a disputed or emerging legal issue and its real-world boundary
- `practical-interpretation`: explains a case release, policy, or authority signal and what readers should pay attention to

If multiple fit, prefer the one that best answers the reader's practical concern.

### 2. Extract Source Material

Before drafting, extract:

- Core issue
- Bottom-line conclusion
- 3-5 key judgment points
- Reader-facing risks
- Practical action items

### 3. Rewrite For Clients

Use this default structure unless the source strongly requires another:

1. Lead with the key answer or concern
2. Explain why that answer is likely right
3. Expand 3-5 key points in plain but professional language
4. Correct common misunderstandings
5. End with practical reminders or next steps

### 4. Deliverables

Default output should include:

- Title
- Summary
- Markdown article body
- Cover prompt

When the user wants the full workflow:

1. Draft the article with this skill
2. Use `baoyu-image-gen` to generate the cover image
3. Use `baoyu-post-to-wechat` to push the article to WeChat draft

## Cover Prompt Rules

When generating a cover prompt:

- Match the article's legal topic and target reader
- Prefer calm, credible, non-sensational visuals
- Avoid courtroom cliches unless the article truly needs them
- Prefer Chinese-title-friendly layouts when the image model supports strong text rendering
- Keep the visual direction suitable for a serious legal account, not a generic self-media poster

## Safety And Quality Checks

Before finalizing a draft, verify:

- The first 3 paragraphs already tell the reader what problem the article answers
- A non-lawyer can understand the core conclusion without reading the entire piece
- The article includes practical consequences, not only doctrine
- The tone remains professional and does not become colloquial fluff
- The ending contains actionable reminders

## Output Contract

Prefer this working structure during drafting:

```md
---
title: ...
summary: ...
author: ...
audience: ordinary-party | family | business-owner | mixed
article_type: rules-impact | issue-analysis | practical-interpretation
coverImage:
---

# Title

## Opening answer

## Key point one

## Key point two

## Common misunderstanding

## What you should do now
```

If the user asks for publication, keep the final article in markdown so `baoyu-post-to-wechat` can render and publish it directly.
