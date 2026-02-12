第二大脑系统设计任务文档（TASK.md）
项目目标
构建一个名为“第二大脑”的 Next.js 应用，实现以下核心能力：
● 自动记录每日对话日志，并支持近实时更新（每分钟检测新增内容）
● 将重要主题由大模型自动提炼为结构优雅、命名得体的概念文档
● 所有内容以 Markdown 文件形式存储于本地 content 目录，支持前端完整的增删查改（CRUD）
● 提供融合 Obsidian（自由链接、知识图谱感）与 Linear（清晰结构、任务流）的浏览体验
● 界面极简、美观、响应式，聚焦内容本身，无干扰元素

核心原则
1. 内容驱动：所有数据 = 文件系统中的 Markdown + YAML frontmatter
2. 近实时性：后台每 60 秒扫描对话记忆源，若有新增内容则更新日志或生成新笔记
3. AI 赋能组织：文件命名、标题、标签、摘要均由大模型生成，确保语义优雅、一致
4. 全功能前端编辑：用户可在网页上创建、编辑、删除、查看任意日志或笔记
5. 安全写入：所有文件操作通过受控 API 路由执行，防止路径遍历或意外覆盖

文件组织结构
second-brain/
├── app/
│ ├── api/
│ │ ├── sync/route.ts # 每分钟调用：检测新对话 → 更新 content/
│ │ ├── notes/
│ │ │ ├── [slug]/route.ts # GET/PUT/DELETE 单篇笔记
│ │ │ └── route.ts # POST 创建新笔记
│ │ └── logs/
│ │ ├── [date]/route.ts # GET/PUT/DELETE 单篇日志
│ │ └── route.ts # POST 创建新日志（通常由 sync 触发）
│ ├── page.tsx # 主页：混合展示日志 + 笔记
│ ├── notes/[slug]/page.tsx # 笔记详情页（含编辑模式）
│ ├── logs/[date]/page.tsx # 日志详情页（含编辑模式）
│ └── layout.tsx
├── content/
│ ├── logs/ # 命名格式：YYYY-MM-DD.md
│ └── notes/ # 命名格式：kebab-case 语义化 slug（如 "knowledge-graph-design".md）
├── lib/
│ ├── memory-source.ts # 抽象接口：获取外部对话记忆（如从向量库或缓存）
│ ├── content-manager.ts # 读写 content/ 目录的安全封装
│ └── ai-organizer.ts # 调用大模型生成标题、slug、摘要、标签
├── public/
└── styles/
所有用户可见内容仅来自 content/。AI 不直接修改代码，只通过 API 写入 content。

内容格式规范
日志文件（content/logs/YYYY-MM-DD.md）
---
date: 2026-02-05
type: daily-log
summary: "讨论了第二大脑的实时同步机制与前端编辑能力。"
topics:
  - real-time-sync
  - crm-for-knowledge
ai_generated: true
---

# 2026-02-05

## 新增讨论
- 需要每分钟检测对话是否有更新
- 前端必须支持对所有文档的完整编辑
- 文件命名和结构应由 AI 保证优雅性

> 此日志由系统自动更新。

笔记文件（content/notes/semantic-slug.md）
---
title: 近实时知识同步机制
created: 2026-02-05
updated: 2026-02-05
tags: [real-time, knowledge-sync, second-brain]
related_logs:
  - 2026-02-05
ai_refined: true
---

# 近实时知识同步机制

通过定时轮询（60s）检测对话记忆增量，由大模型判断是否需：
1. 更新当日日志摘要
2. 提炼新概念并生成独立笔记

## 设计要点
- **优雅命名**：slug 采用 kebab-case，如 `real-time-knowledge-sync`
- **语义摘要**：由模型生成 1–2 句高层概括
- **自动关联**：记录来源日志 ID

> 本文档由 Clawdbot 在对话中自动生成并命名。

功能需求 
核心功能
● 实时检测服务：部署一个后台任务（可通过 Vercel Cron 或本地 setInterval），每 60 秒调用 /api/sync
● sync API 逻辑：

    ○ 从记忆源（如 Redis / 向量数据库 / 模拟缓存）拉取自上次以来的新对话片段
    ○ 若今日无日志，创建空日志模板
    ○ 将新内容追加至当日日志正文，并调用大模型重写 summary
    ○ 分析新内容是否包含可提炼主题（如重复关键词、深度讨论），若满足阈值，生成新笔记（含 title/slug/tags）
● 前端 CRUD：

    ○ 所有页面提供“编辑”按钮，进入富文本/Markdown 编辑器
    ○ 支持新建笔记（输入标题 → AI 生成 slug 和初始结构）
    ○ 删除时二次确认，物理删除文件
● 优雅内容生成：

    ○ 所有 AI 生成的标题、slug、摘要需符合以下标准：

        ■ 标题：名词短语，首字母大写，无冗余词（如“关于...”）
        ■ Slug：全小写，kebab-case，语义清晰（如 second-brain-architecture）
        ■ 摘要：1–2 句，信息密集，无第一人称
UI/UX 要求
● 使用 Tailwind CSS 实现极简设计：最大宽度 768px，行高 1.6，字体系统优先使用 system-ui
● 深色/浅色模式自动适配
● 编辑器使用 react-markdown-editor-lite 或类似轻量方案
● 所有操作（保存、删除）有即时反馈（toast 提示）
AI Agent 行为规范
● 仅通过 API 操作文件

    ○ 所有写入必须经由 /api/notes 或 /api/logs 路由
    ○ 禁止直接调用 fs.writeFile 或修改非 content/ 目录
● 内容生成责任

    ○ 当创建新笔记时，必须调用 
        ■ title（人类可读）
        ■ slug（URL 安全、语义化）
        ■ tags（数组，小写，无特殊字符）
        ■ 初始 content（含定义、要点、来源）
● 实时同步触发

    ○ 每次对话结束时，将新内容暂存至记忆源（如内存缓存或临时 DB）
    ○ /api/sync 负责消费这些增量并持久化到文件
● 禁止行为

    ○ 不得硬编码日期、路径或文件名
    ○ 不得在前端暴露原始文件路径
    ○ 不得在未授权情况下删除用户手动创建的文档
验收标准
● ✅ 应用启动后，每 60 秒自动检测并更新内容
● ✅ 用户可在网页上创建、编辑、删除任意日志或笔记，操作立即反映在文件系统
● ✅ 所有 AI 生成的文件命名和内容结构语义清晰、无技术术语污染
● ✅ 主页加载所有文档元数据（标题、日期、标签）无卡顿
● ✅ 界面在移动端可流畅编辑
交付物
● 完整 Next.js 项目（App Router）
● content/ 初始示例（1 日志 + 1 笔记，由 AI 生成）
● 实现 /api/sync 的模拟逻辑（开发阶段可读取本地 mock 对话）
● 本 TASK.md
● README.md 说明运行方式、API 设计、扩展点
注意：AI Agent 必须首先输出此 TASK.md，后续所有操作严格按此文档执行。
