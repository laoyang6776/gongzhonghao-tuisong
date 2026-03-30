# 公众号自动化工作流使用说明

这个项目是一个面向法律公众号的自动化工作流，目标是把原文整理成适合公众号发布的成稿，并自动生成首图、推送到公众号草稿箱。

## 这个项目现在能做什么

- 将原文改写成面向当事人的法律公众号文章
- 默认语言风格：专业但好懂
- 自动匿名化处理明显的公民个人信息
- 自动生成公众号首图
- 首图默认策略：无字氛围图
- 自动推送到公众号 `羊捕头` 的草稿箱

## 下次重新打开 Codex 怎么用

如果你关闭了当前窗口，不需要重新解释整套工作流。

你下次只要：

1. 打开 Codex
2. 把这个项目文件夹重新放进来
3. 直接对 Codex 说下面这句话

推荐开场话术：

```text
这是我做公众号自动化的项目，按项目里现有工作流处理。我发原文给你后，请改写成面向当事人的法律公众号文章，生成无字氛围首图，并推送到羊捕头草稿箱。
```

## 你平时最简单的使用方式

### 方式一：直接聊天，让 Codex 替你全程处理

这是最推荐的方式。

你只需要把文章原文发给 Codex，然后说：

```text
按项目里的公众号工作流处理这篇文章，直接推草稿。
```

Codex 会负责：

- 改写文章
- 生成无字首图
- 推送公众号草稿箱

### 方式二：你自己准备好文章文件，再让 Codex 执行

如果你以后把原文保存成文件，也可以对 Codex 说：

```text
按这个项目工作流处理 xxx.md，并直接推草稿。
```

## 默认规则

当前这套工作流默认按下面的规则执行：

- 公众号账号：`羊捕头`
- 发布方式：推送到草稿箱，不直接正式群发
- 目标读者：普通当事人、家属、企业负责人
- 写作风格：专业但好懂
- 首图风格：无字氛围图
- 首图要求：不要可读文字、不要 logo、不要水印、不要假界面

## 当前项目里的关键目录

- `legal-wechat-for-clients/`
  文章改写风格规则和一键入口脚本
- `baoyu-image-gen/`
  首图生成工作流
- `baoyu-post-to-wechat/`
  公众号草稿发布工作流

## 一键入口说明

项目里已经有一个一键入口脚本：

- `legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts`

它适合以后稳定日更时使用。

### `prepare` 模式

作用：
- 为一篇原始文章创建当天的工作目录
- 自动生成 `source.*`、`article.md`、`cover-prompt.md`

示例：

```bash
bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts prepare --source <原文文件>
```

### `run` 模式

作用：
- 基于已经写好的 `article.md` 生成首图
- 可选直接推送到公众号草稿箱

示例：

```bash
bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts run --article <article.md>
```

如果要直接推草稿：

```bash
bun legal-wechat-for-clients/scripts/wechat-daily-pipeline.ts run --article <article.md> --publish
```

## 最重要的一点

你现在不需要自己记住这些命令。

对你最简单的用法仍然是：

1. 打开 Codex
2. 把这个项目放进来
3. 把原文发给 Codex
4. 说一句：

```text
按项目里的公众号工作流处理，直接推草稿。
```

剩下的步骤由 Codex 来执行。
