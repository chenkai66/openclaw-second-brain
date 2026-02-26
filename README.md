# 🧠 Second Brain

<div align="center">

**AI-Powered Personal Knowledge Management System**

*让思想永不遗忘 · 让知识自动生长*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## ✨ 核心特性

### 🤖 AI 自动化系统

- **Knowledge Agent** - 每小时自动同步对话，智能提取概念和知识点，生成Notes和Logs
- **Research Agent** - 每晚23:00从summary系统获取热门主题和关键词，自动生成研究查询词，生成个性化研究报告
- **Social Research** - 并行搜索Reddit和X，捕捉社区真实讨论

### 🔍 智能搜索与导航

- **全文搜索** - 毫秒级响应，实时高亮匹配内容
- **标签系统** - 多维度分类，快速定位相关内容
- **知识图谱** - D3.js可视化，探索知识之间的隐藏联系

### ✍️ 强大的编辑体验

- **Markdown编辑器** - 实时预览，语法高亮
- **代码块增强** - 一键复制，支持30+语言高亮
- **图片优化** - 自动转换AVIF/WebP，加载速度提升60%

### 📊 数据可视化

```
📈 知识增长曲线    🏷️ 标签云图    🕸️ 关系网络图
```

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm/yarn/pnpm
- OpenAI兼容的API Key（如阿里云DashScope）

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/openclaw-second-brain.git
cd openclaw-second-brain

# 安装依赖
npm install

# 配置环境变量（重要！）
export OPENAI_API_KEY="your-api-key-here"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENCLAW_SESSIONS_PATH="$HOME/.openclaw/agents/main/sessions"

# 初始化系统
npm run summary:init

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 🎉

### ⚠️ 常见问题

如果遇到以下问题，请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)：

- ❌ 系统只创建简单日志，没有真正的知识提取
- ❌ 环境变量在定时任务中不生效
- ❌ TypeScript导入错误
- ❌ 端口冲突（3000 vs 3001）
- ❌ 对话文件读取失败

**快速诊断**：
```bash
# 运行诊断脚本
curl -O https://raw.githubusercontent.com/yourusername/openclaw-second-brain/master/diagnose.sh
chmod +x diagnose.sh
./diagnose.sh
```

### 生产部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

---

## 📁 项目结构

```
openclaw-second-brain/
├── 📱 app/                      # Next.js App Router
│   ├── page.tsx                 # 首页（搜索+统计）
│   ├── notes/[slug]/            # 笔记详情页
│   ├── logs/[date]/             # 日志详情页
│   ├── research/[slug]/         # 研究报告页
│   └── graph/                   # 知识图谱页
│
├── 🧩 components/               # React组件
│   ├── SearchBar.tsx            # 智能搜索框
│   ├── MarkdownEditor.tsx       # Markdown编辑器
│   ├── MarkdownRenderer.tsx     # 内容渲染器
│   └── KnowledgeGraph.tsx       # 知识图谱
│
├── 📝 content/                  # 内容存储
│   ├── notes/                   # 结构化笔记
│   ├── logs/                    # 对话日志
│   └── reports/                 # 研究报告
│
├── 🤖 skills/                   # AI Agent技能
│   ├── knowledge-agent-skill/   # 知识同步Agent
│   ├── research-agent-skill/    # 研究报告Agent
│   └── social-research-skill/   # 社区研究Skill
│
├── 🔧 lib/                      # 工具库
│   ├── content-manager.ts       # 内容管理
│   ├── search.ts                # 搜索引擎
│   └── graph-builder.ts         # 图谱构建
│
└── 🎨 public/                   # 静态资源
```

---

## 🎯 使用场景

### 📚 个人学习

```
对话 → AI提取 → 结构化笔记 → 知识图谱 → 深度理解
```

**示例**：学习React性能优化
1. 与AI讨论React性能问题
2. Knowledge Agent自动创建笔记
3. 标签自动分类：`react`, `performance`, `optimization`
4. 知识图谱显示与其他React笔记的关联

### 🔬 技术研究

```
对话历史 → Summary系统 → 热门主题/关键词 → Research Agent → 生成查询词 → 多源搜索 → 综合报告
```

**示例**：研究AI编码工具
1. 频繁讨论Cursor、GitHub Copilot
2. Summary系统提取热门主题："AI Coding Tools"，关键词：["cursor", "copilot", "ai-coding"]
3. Research Agent获取数据，生成查询词："Cursor vs GitHub Copilot comparison"
4. 自动搜索最新文章、GitHub项目、HN讨论
5. 生成2500字深度报告，包含使用建议

### 💡 内容创作

```
话题 → Social Research → 社区讨论 → 内容建议 → 创作灵感
```

**示例**：写一篇关于Next.js 14的文章
1. 搜索"Next.js 14 features"
2. 并行分析Reddit和X的讨论
3. 识别热门话题：Server Actions、Partial Prerendering
4. 生成8个博客标题和5个视频脚本建议

---

## 🛠️ 技术栈

### 前端框架

- **Next.js 14** - App Router, Server Components, ISR
- **React 18** - Concurrent Features, Suspense
- **TypeScript 5** - 类型安全，开发体验

### UI & 样式

- **Tailwind CSS 3** - 原子化CSS，快速开发
- **Crimson Pro** - 优雅的衬线字体
- **react-syntax-highlighter** - 代码高亮

### 数据可视化

- **D3.js** - 知识图谱力导向布局
- **Force Simulation** - 动态交互效果

### 内容处理

- **gray-matter** - Frontmatter解析
- **react-markdown** - Markdown渲染
- **remark/rehype** - 内容转换管道

---

## ⚡ 性能优化

### 构建优化

```typescript
// next.config.js
{
  images: {
    formats: ['image/avif', 'image/webp'],  // 图片格式优化
  },
  compiler: {
    removeConsole: true,                     // 移除console
  },
  experimental: {
    optimizePackageImports: ['react-icons'], // 包导入优化
  }
}
```

### 运行时优化

- ✅ **ISR缓存** - 60秒重新验证，减少服务器负载
- ✅ **代码分割** - 按路由自动分割，首屏加载<100KB
- ✅ **图片懒加载** - Intersection Observer，节省带宽
- ✅ **搜索防抖** - 300ms延迟，减少API调用

### 性能指标

```
Lighthouse Score: 98/100
First Contentful Paint: 0.8s
Time to Interactive: 1.2s
Total Bundle Size: 87KB (gzipped)
```

---

## 🤖 AI Agent 系统

### 自动化部署（主Agent使用）

**你的任务**：为Second Brain系统创建定时任务，实现自动化知识管理和研究。

#### 步骤1：查找项目路径

```bash
# 自动查找项目路径
PROJECT_PATH=$(find ~ -type d -name "openclaw-second-brain" 2>/dev/null | head -1)

# 如果找不到，检查常见位置
[ -z "$PROJECT_PATH" ] && PROJECT_PATH=$(ls -d ~/openclaw/workspace/openclaw-second-brain 2>/dev/null || \
  ls -d /root/openclaw-second-brain 2>/dev/null || \
  ls -d ~/openclaw-second-brain 2>/dev/null)

echo "项目路径: $PROJECT_PATH"
```

#### 步骤2：创建两个定时任务

```bash
# 任务1: Knowledge Agent - 每小时同步对话到知识库
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd $PROJECT_PATH && npm run agent:knowledge" \
  --delivery none

# 任务2: Research Agent - 每晚23:00生成研究报告
openclaw cron add \
  --name "Daily Research" \
  --cron "0 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "cd $PROJECT_PATH && npm run agent:research" \
  --delivery none
```

#### 步骤3：验证任务创建

```bash
# 查看任务列表
openclaw cron list

# 手动测试
openclaw cron run --name "Knowledge Sync"
```

### 架构设计

```
定时任务调度器
    ↓
    ├─→ Knowledge Agent (每小时)
    │   └─→ 读取对话 → 生成摘要 → 更新Notes/Logs → 更新Summary数据
    │
    └─→ Research Agent (每天23:00)
        └─→ 获取热门主题/关键词 → 生成查询词 → 互联网搜索 → 生成Reports
```

### Knowledge Agent 工作流

```bash
npm run agent:knowledge
```

**自动完成**：
1. 读取未处理的对话历史（从 `~/.openclaw/agents/main/sessions/*.jsonl`）
2. 调用大模型生成摘要和关键词
3. 智能聚类到主题和领域
4. 转换为Markdown（Notes和Logs）
5. 更新Summary数据（供Research Agent使用）
6. 创建自动备份

**输出**：
- `content/notes/` - 知识笔记
- `content/logs/` - 对话日志
- `data/summaries/` - JSON数据（热门主题、关键词统计）

### Research Agent 工作流

```bash
npm run agent:research
```

**自动完成**：
1. 从Summary系统获取热门主题（`getTopTopics()`）
2. 获取热门关键词（`getTopKeywords()`）
3. 返回结构化数据供Agent分析

**返回数据示例**：
```json
{
  "top_topics": [
    {
      "name": "React Performance",
      "keywords": ["react", "performance", "optimization"],
      "conversation_count": 15,
      "score": 0.85
    }
  ],
  "top_keywords": [
    { "keyword": "react", "count": 45 },
    { "keyword": "typescript", "count": 38 }
  ]
}
```

**Agent使用数据**：
- 选择研究主题（例如："React Performance"）
- 生成查询词组合：
  - "React Performance optimization tutorial"
  - "React performance best practices 2024"
  - "React hooks performance tips"
- 使用搜索工具查找资料（Google、GitHub、HN）
- 生成研究报告保存到 `content/reports/`

### 管理定时任务

```bash
# 查看任务列表
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Knowledge Sync" --limit 10

# 手动触发
openclaw cron run --name "Knowledge Sync"

# 禁用/启用任务
openclaw cron edit <job-id> --enabled false
openclaw cron edit <job-id> --enabled true

# 删除任务
openclaw cron remove <job-id>
```

### 重要说明

**为什么使用 isolated 会话？**
- 每个任务在独立的 `cron:<jobId>` 会话中运行
- 子Agent只看到自己的SKILL.md，不会被主会话干扰
- 防止误操作，不会创建额外的定时任务

**为什么使用 delivery none？**
- 这些是后台任务，不需要主动通知用户
- 避免每次执行都发送消息
- 结果保存到文件系统，用户可以随时查看

**无需Web服务器**
- Knowledge Agent和Research Agent都直接调用lib模块
- 不依赖API服务器运行
- 更快的执行速度，更少的依赖

---

## 📝 对话总结系统

### OpenClaw 对话存储格式

#### 存储路径结构
```
~/.openclaw/agents/main/sessions/
├── {session-id}.jsonl          # 会话文件
├── {session-id}.jsonl.lock     # 锁文件（写入中）
└── ...
```

#### 文件格式说明
- **格式**: JSONL (JSON Lines) - 每行一个独立的JSON对象
- **编码**: UTF-8
- **特点**: 流式可读，增量处理友好

#### 记录类型
| 类型 | 说明 |
|------|------|
| `session` | 会话元数据（ID、时间戳、工作目录） |
| `message` | 用户/助手消息 |
| `toolCall` | 工具调用 |
| `toolResult` | 工具执行结果 |
| `model_change` | 模型切换 |

#### 示例结构
```json
// 会话元数据
{"type":"session","version":3,"id":"065ce98c-195e-4aef-a753-ab22ffb13f67","timestamp":"2026-02-26T03:35:19.545Z","cwd":"/home/admin/openclaw/workspace"}

// 用户消息
{"type":"message","id":"3b4be693","parentId":"e684b5ab","timestamp":"2026-02-26T03:36:13.617Z","message":{"role":"user","content":[{"type":"text","text":"clone这个仓库"}]}}

// 助手消息（包含工具调用）
{"type":"message","id":"4565cc7c","parentId":"3b4be693","timestamp":"2026-02-26T03:36:16.564Z","message":{"role":"assistant","content":[{"type":"text","text":"我来帮你克隆："},{"type":"toolCall","id":"call_xxx","name":"exec","arguments":{"command":"git clone ..."}}]}}

// 工具执行结果
{"type":"message","id":"94b67541","parentId":"4565cc7c","timestamp":"2026-02-26T03:36:18.753Z","message":{"role":"toolResult","toolCallId":"call_xxx","toolName":"exec","content":[{"type":"text","text":"Cloning into..."}]}}
```

#### 处理逻辑
系统会：
1. 读取所有 `.jsonl` 文件（跳过 `.lock` 文件）
2. 逐行解析JSON记录
3. 提取 `type: "message"` 且 `role: "user"` 或 `"assistant"` 的消息
4. 忽略工具调用的中间步骤
5. 组装成完整对话文本
6. 过滤太短的对话（< 50字符）

### 快速开始

```bash
# 1. 初始化系统
npm run summary:init

# 2. 启动服务器
npm run dev

# 3. 执行完整数据管道（一键完成所有步骤）
npm run summary:pipeline
```

详细文档请查看 [DATA_PIPELINE.md](./DATA_PIPELINE.md)

### 系统架构

```
对话数据源 → 对话处理器 → 多阶段摘要 → Markdown转换 → 前端展示
    ↓           ↓              ↓          ↓
OpenClaw    LLM生成摘要    三层树形结构   JSON文件
会话目录    智能聚类       Domain/Topic   索引加速
           试错重试       /Conversation   备份恢复
```

### 核心功能

**智能合并策略** - 使用大模型判断对话归属：
- **Merge（合并）** - 融入现有笔记，智能整合内容
- **Create New（新建）** - 创建独立的新笔记
- **Create Log Only（仅日志）** - 只记录简短对话

**鲁棒性增强**：
- ✅ 自动摘要生成 - 调用大模型生成摘要、提取关键词、分析情感
- ✅ 智能聚类 - 自动将相似对话聚合为主题，将相似主题聚合为领域
- ✅ 多阶段摘要 - 三层树形结构（领域 → 主题 → 对话），每层都有独立摘要
- ✅ 错误处理 - 自动重试3次、指数退避、降级处理、详细日志
- ✅ 防重复处理 - 跟踪已处理对话ID、断点续传
- ✅ 数据验证 - 格式、必需字段、类型检查
- ✅ 文件名安全 - 清理非法字符、防冲突

### 快速使用

```typescript
// 1. 初始化系统
import { initializeSummarySystem, quickProcess } from '@/lib/summary';
await initializeSummarySystem();

// 2. 处理对话
const result = await quickProcess();
console.log(`处理了 ${result.processed} 个对话`);

// 3. 搜索
import { quickSearch } from '@/lib/summary';
const results = await quickSearch('React hooks', { searchType: 'hybrid' });
```

### API接口

```bash
# 处理新对话
POST /api/summary/process

# 智能转换为Markdown
POST /api/summary/convert

# 搜索摘要（支持关键词/语义/混合搜索）
POST /api/summary/search

# 获取摘要树（三层结构）
GET /api/summary/tree?depth=3

# 获取统计信息
GET /api/summary/stats

# 智能推荐
GET /api/summary/recommend?conversation_id=xxx

# 触发聚类
POST /api/summary/cluster

# 获取对话详情
GET /api/summary/conversation/[id]

# 重建索引
POST /api/summary/rebuild-index
```

### 配置文件

编辑 `summary-config.json`：

```json
{
  "llm": {
    "model": "qwen3-max-2026-01-23",
    "max_retries": 3,
    "temperature": 0.7
  },
  "processing": {
    "batch_size": 10,
    "max_concurrent": 3,
    "min_conversation_length": 50
  },
  "clustering": {
    "similarity_threshold": 0.7,
    "min_cluster_size": 3
  },
  "intelligent_merger": {
    "min_conversation_length_for_note": 200,
    "min_keyword_count": 3,
    "strict_mode": true,
    "max_content_length": 3000,
    "max_keywords": 10
  }
}
```

**智能合并配置说明**：
- `min_conversation_length_for_note`: 创建笔记的最小对话长度（字符数）
- `min_keyword_count`: 创建笔记需要的最少关键词数量
- `strict_mode`: 严格模式，更保守地创建笔记
- 大部分日常对话会被标记为 `create_log_only`，只保存到日志
- 只有真正有价值的知识才会创建笔记

### 数据结构

```
data/summaries/
├── summaries.json          # 树形摘要结构
├── summary-index.json      # 快速检索索引
├── summary-metadata.json   # 元数据和统计
└── backups/                # 自动备份
```

---

## 🚧 开发路线图

### v1.0 (当前版本)
- [x] 基础笔记和日志管理
- [x] 全文搜索和标签系统
- [x] 知识图谱可视化
- [x] AI自动化Agent系统
- [x] 对话总结与多阶段摘要系统

### v1.1 (计划中)
- [ ] 多语言支持（英文/中文切换）
- [ ] 暗色模式优化
- [ ] 移动端适配
- [ ] PWA支持（离线访问）

### v2.0 (未来)
- [ ] 多用户协作
- [ ] 实时同步
- [ ] 插件系统
- [ ] AI对话界面

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 组件使用函数式+Hooks
- 提交信息遵循[Conventional Commits](https://www.conventionalcommits.org/)

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的React框架
- [Tailwind CSS](https://tailwindcss.com/) - 优雅的CSS框架
- [D3.js](https://d3js.org/) - 数据可视化库
- [OpenClaw](https://openclaw.ai/) - AI Agent基础设施

---

## 📮 联系方式

- **Email**: chenkai.nb.666@gmail.com
- **微信**: ck1640234528

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个Star！**

Made with ❤️ by ChenKai

</div>
