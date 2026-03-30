import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

type Mode = "prepare" | "run";

type CliArgs = {
  mode: Mode;
  articlePath: string | null;
  sourcePath: string | null;
  outputDir: string | null;
  date: string | null;
  slug: string | null;
  account: string | null;
  theme: string;
  publish: boolean;
  provider: string | null;
  model: string | null;
  help: boolean;
};

type FrontmatterMap = Record<string, string>;

function printUsage(): never {
  console.log(`Legal WeChat daily pipeline

Usage:
  bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts prepare --source <file> [options]
  bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts run --article <file> [options]

Modes:
  prepare   Create a dated working directory, copy the source article, and scaffold a publishable article file
  run       Generate a no-text cover prompt, create a cover image, and optionally publish to WeChat draft

Options:
  --source <file>      Source article path for prepare mode
  --article <file>     Rewritten markdown article path for run mode
  --output-dir <dir>   Explicit output directory
  --date <YYYY-MM-DD>  Output date folder (default: today)
  --slug <slug>        Output slug (default: inferred from title or source filename)
  --account <alias>    WeChat account alias (default: from publish config)
  --theme <name>       WeChat theme (default: default)
  --publish            Publish to WeChat draft after cover generation
  --provider <name>    Force image provider
  --model <id>         Force image model
  --help               Show help

Examples:
  bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts prepare --source ./raw/case.md
  bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts run --article ./outputs/2026-03-29/my-article/article.md --publish
`);
  process.exit(0);
}

function parseArgs(argv: string[]): CliArgs {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printUsage();
  }

  const mode = argv[0] === "prepare" || argv[0] === "run" ? (argv[0] as Mode) : null;
  if (!mode) {
    throw new Error("First argument must be 'prepare' or 'run'.");
  }

  const out: CliArgs = {
    mode,
    articlePath: null,
    sourcePath: null,
    outputDir: null,
    date: null,
    slug: null,
    account: null,
    theme: "default",
    publish: false,
    provider: null,
    model: null,
    help: false,
  };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--source" && argv[i + 1]) out.sourcePath = argv[++i]!;
    else if (arg === "--article" && argv[i + 1]) out.articlePath = argv[++i]!;
    else if (arg === "--output-dir" && argv[i + 1]) out.outputDir = argv[++i]!;
    else if (arg === "--date" && argv[i + 1]) out.date = argv[++i]!;
    else if (arg === "--slug" && argv[i + 1]) out.slug = argv[++i]!;
    else if (arg === "--account" && argv[i + 1]) out.account = argv[++i]!;
    else if (arg === "--theme" && argv[i + 1]) out.theme = argv[++i]!;
    else if (arg === "--provider" && argv[i + 1]) out.provider = argv[++i]!;
    else if (arg === "--model" && argv[i + 1]) out.model = argv[++i]!;
    else if (arg === "--publish") out.publish = true;
  }

  if (out.mode === "prepare" && !out.sourcePath) {
    throw new Error("--source is required in prepare mode.");
  }
  if (out.mode === "run" && !out.articlePath) {
    throw new Error("--article is required in run mode.");
  }

  return out;
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function slugify(input: string): string {
  const cleaned = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
  return cleaned || "article";
}

function parseFrontmatter(content: string): { frontmatter: FrontmatterMap; body: string } {
  const match = content.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: FrontmatterMap = {};
  for (const line of match[1]!.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: match[2]! };
}

function inferTitle(content: string, fallbackPath: string): string {
  const { frontmatter, body } = parseFrontmatter(content);
  if (frontmatter.title) return frontmatter.title;
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1]!.trim();
  return path.basename(fallbackPath, path.extname(fallbackPath));
}

function inferSummary(content: string): string {
  const { frontmatter, body } = parseFrontmatter(content);
  if (frontmatter.summary) return frontmatter.summary;
  if (frontmatter.description) return frontmatter.description;
  const paragraph = body
    .split(/\r?\n\r?\n/)
    .map((item) => item.replace(/^#+\s+/gm, "").trim())
    .find((item) => item.length > 0);
  if (!paragraph) return "";
  return paragraph.length > 120 ? `${paragraph.slice(0, 117)}...` : paragraph;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function resolveOutputDir(args: CliArgs, hintTitle: string, inputPath: string): string {
  if (args.outputDir) return path.resolve(args.outputDir);
  const date = args.date || todayString();
  const slug = args.slug || slugify(hintTitle || path.basename(inputPath, path.extname(inputPath)));
  return path.resolve("outputs", date, slug);
}

function buildArticleTemplate(title: string, summary: string, sourceContent: string): string {
  return `---
title: ${title}
summary: ${summary || "[TODO: 补摘要]"}
author: 羊捕头
audience: mixed
article_type: practical-interpretation
---

# ${title}

## 先说结论

[TODO: 用面向当事人的语言先给结论]

## 这件事为什么值得关注

[TODO: 解释背景和现实风险]

## 你最需要看懂的 3 到 5 个点

[TODO: 分点展开]

## 常见误区

[TODO: 纠正常见误解]

## 最后提醒

[TODO: 给出 2 到 4 条行动建议]

---

以下为原始素材备份，方便改写时参考：

${sourceContent.trim()}
`;
}

function buildNoTextCoverPrompt(title: string, summary: string): string {
  const escapedTitle = title.replace(/\s+/g, " ").trim();
  const escapedSummary = summary.replace(/\s+/g, " ").trim();
  return `为一篇中文法律公众号文章生成无字首图，主题是“${escapedTitle}”。

文章摘要参考：${escapedSummary || "这是一篇面向当事人的法律风险解读文章。"}

这次严格禁止所有容易出现文字的物体和场景元素：
- 不要站牌
- 不要电子屏
- 不要电脑屏幕
- 不要手机屏幕
- 不要纸张
- 不要车票
- 不要文件
- 不要招牌
- 不要海报
- 不要任何中文、英文、数字、logo、水印、按钮、界面文字

只保留纯场景和无字物体：
- 与主题相关的纪实氛围
- 冷静、克制、专业的法律评论头图感
- 可加入少量无字法律象征物，但不能出现可读内容

风格要求：
- realistic editorial photography
- cinematic but natural
- legal commentary atmosphere
- professional, restrained, credible
- no text anywhere
- no signage
- no UI
- no documents
- no poster style
- no illustration
- no cartoon

构图要求：
- 横版 16:9
- 适合作为微信公众号头图
- 画面干净，有空间感
- 不让人一眼看出是 AI 海报
`;
}

function runCommand(command: string, args: string[], options?: { cwd?: string; captureStdout?: boolean }): string {
  const result = spawnSync(command, args, {
    cwd: options?.cwd ?? process.cwd(),
    encoding: "utf8",
    stdio: options?.captureStdout ? ["inherit", "pipe", "inherit"] : "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }

  return result.stdout?.trim() || "";
}

function prepareMode(args: CliArgs): void {
  const sourcePath = path.resolve(args.sourcePath!);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const sourceContent = fs.readFileSync(sourcePath, "utf8");
  const title = inferTitle(sourceContent, sourcePath);
  const summary = inferSummary(sourceContent);
  const outDir = resolveOutputDir(args, title, sourcePath);

  ensureDir(outDir);
  const ext = path.extname(sourcePath) || ".md";
  const sourceOut = path.join(outDir, `source${ext}`);
  const articleOut = path.join(outDir, "article.md");
  const promptOut = path.join(outDir, "cover-prompt.md");

  fs.copyFileSync(sourcePath, sourceOut);
  writeFileSafe(articleOut, buildArticleTemplate(title, summary, sourceContent));
  writeFileSafe(promptOut, buildNoTextCoverPrompt(title, summary));

  console.log(JSON.stringify({
    success: true,
    mode: "prepare",
    outputDir: outDir,
    source: sourceOut,
    article: articleOut,
    coverPrompt: promptOut,
  }, null, 2));
}

function runMode(args: CliArgs): void {
  const articlePath = path.resolve(args.articlePath!);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Article file not found: ${articlePath}`);
  }

  const articleContent = fs.readFileSync(articlePath, "utf8");
  const title = inferTitle(articleContent, articlePath);
  const summary = inferSummary(articleContent);
  const outDir = path.dirname(articlePath);
  const coverPromptPath = path.join(outDir, "cover-prompt.md");
  const coverImagePath = path.join(outDir, "cover.png");
  const publishResultPath = path.join(outDir, "publish-result.json");

  if (!fs.existsSync(coverPromptPath)) {
    writeFileSafe(coverPromptPath, buildNoTextCoverPrompt(title, summary));
  }

  const imageArgs = [
    path.resolve("baoyu-image-gen/scripts/main.ts"),
    "--promptfiles",
    coverPromptPath,
    "--image",
    coverImagePath,
  ];
  if (args.provider) imageArgs.push("--provider", args.provider);
  if (args.model) imageArgs.push("--model", args.model);
  runCommand("bun", imageArgs);

  let publishOutput: string | null = null;
  if (args.publish) {
    const publishArgs = [
      path.resolve("baoyu-post-to-wechat/scripts/wechat-api.ts"),
      articlePath,
      "--theme",
      args.theme,
      "--cover",
      coverImagePath,
    ];
    if (args.account) publishArgs.push("--account", args.account);
    publishOutput = runCommand("bun", publishArgs, { captureStdout: true });
    writeFileSafe(publishResultPath, `${publishOutput}\n`);
  }

  console.log(JSON.stringify({
    success: true,
    mode: "run",
    article: articlePath,
    coverPrompt: coverPromptPath,
    coverImage: coverImagePath,
    published: args.publish,
    publishResultPath: args.publish ? publishResultPath : undefined,
  }, null, 2));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === "prepare") {
    prepareMode(args);
    return;
  }
  runMode(args);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
