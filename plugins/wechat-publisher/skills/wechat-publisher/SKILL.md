---
name: wechat-publisher
description: Run the legal WeChat publishing workflow in this repository. Use when the user wants to rewrite a legal article for clients, generate a no-text atmosphere cover, and publish the result to the WeChat Official Account draft box.
---

# WeChat Publisher

This plugin skill is a thin entrypoint to the repository's existing workflow.

## What It Uses

- Main writing skill: `/Users/yangzhuofei/Desktop/ai律师团队/legal-wechat-for-clients`
- Image generation: `/Users/yangzhuofei/Desktop/ai律师团队/baoyu-image-gen`
- WeChat draft publishing: `/Users/yangzhuofei/Desktop/ai律师团队/baoyu-post-to-wechat`

## Default Behavior

- Rewrite legal content for clients, family members, and business owners
- Keep the tone professional but easy to understand
- Default cover style is a no-text atmosphere image
- Default draft target is the configured `羊捕头` WeChat account

## Daily Use

When the user provides a source article, follow this order:

1. Rewrite the article according to the `legal-wechat-for-clients` rules
2. Save the final markdown article in a dated output directory
3. Generate a no-text cover image
4. Publish to WeChat draft when the user wants the full workflow

## One-Click Script

For already-prepared markdown articles, use:

```bash
bun /Users/yangzhuofei/Desktop/ai律师团队/legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts run --article <article.md> --publish
```

To scaffold a dated working directory from source material, use:

```bash
bun /Users/yangzhuofei/Desktop/ai律师团队/legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts prepare --source <source-file>
```

## Important Rule

Do not ask the user to repeat the workflow details if this repository is available. Read the existing project skills and use the repository defaults.
