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

- **Knowledge Agent** - 每5分钟自动同步对话，智能提取概念和知识点
- **Research Agent** - 每晚23:00分析兴趣点，生成个性化研究报告
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

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/openclaw-second-brain.git
cd openclaw-second-brain

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 🎉

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
兴趣点 → Research Agent → 多源搜索 → 综合报告 → 行动建议
```

**示例**：研究AI编码工具
1. 频繁讨论Cursor、GitHub Copilot
2. Research Agent检测到兴趣点（评分8.5/10）
3. 自动搜索最新文章、GitHub项目、HN讨论
4. 生成2500字深度报告，包含使用建议

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

### 架构设计

```
主Agent (CRON-AGENT-README.md)
    ↓ 创建定时任务
    ├─→ Knowledge Agent (isolated, 每5分钟)
    │   └─→ 同步对话 → 更新Notes/Logs
    │
    └─→ Research Agent (isolated, 每天23:00)
        └─→ 分析兴趣 → 生成Reports
```

### 创建定时任务

```bash
# Knowledge Agent - 每小时同步一次
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd /root/openclaw-second-brain && npm run summary:pipeline" \
  --delivery none

# Research Agent - 每晚23:00研究
openclaw cron add \
  --name "Daily Research" \
  --cron "0 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "cd /root/openclaw-second-brain && Execute daily research based on user interests" \
  --delivery none
```

**注意**：将 `/root/openclaw-second-brain` 替换为实际的项目路径。

### 查看Agent执行历史

```bash
# 列出所有任务
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Knowledge Sync" --limit 10

# 手动触发
openclaw cron run --name "Knowledge Sync"
```

---

## 📝 智能对话总结系统

### 快速开始

```bash
# 1. 初始化系统
npm run summary:init

# 2. 启动服务器
npm run dev

# 3. 执行完整数据管道（一键完成所有步骤）
npm run summary:pipeline

# 4. 测试API功能
npm run summary:test-convert
```

### 核心功能

**智能合并策略** - 使用大模型判断对话归属：
- **Merge（合并）** - 融入现有笔记，智能整合内容
- **Create New（新建）** - 创建独立的新笔记
- **Create Log Only（仅日志）** - 只记录简短对话

**鲁棒性增强**：
- ✅ 数据验证（格式、必需字段、类型检查）
- ✅ 错误处理（自动重试3次、降级方案、详细日志）
- ✅ 防重复处理（跟踪已处理对话ID）
- ✅ 文件名安全（清理非法字符、防冲突）
- ✅ 多格式支持（支持多种JSON响应格式）
- ✅ 内容限制（防止超出token限制）

### 数据流

```
对话历史 (.jsonl) → API处理 → 摘要数据 (JSON) → Markdown转换 → 前端展示
```

### API接口

```bash
# 处理对话生成摘要
POST /api/summary/process

# 智能转换为Markdown
POST /api/summary/convert

# 搜索摘要
POST /api/summary/search

# 获取统计
GET /api/summary/stats

# 查看摘要树
GET /api/summary/tree
```

### 配置

编辑 `summary-config.json`：

```json
{
  "llm": {
    "model": "qwen-plus",
    "max_retries": 3
  },
  "processing": {
    "batch_size": 10,
    "delay_ms": 1000
  },
  "intelligent_merger": {
    "max_content_length": 3000,
    "max_keywords": 10
  }
}
```

---

## 📊 知识图谱

### 特性

- **力导向布局** - 自动计算节点位置，美观且有序
- **交互式探索** - 拖拽、缩放、悬停查看详情
- **智能着色** - 按类型区分（笔记/日志/标签）
- **关系强度** - 连线粗细表示关联程度

### 使用技巧

```
🖱️ 拖拽节点 - 调整布局
🔍 滚轮缩放 - 查看细节
👆 点击节点 - 跳转到内容
🎨 悬停显示 - 查看标题和标签
```

---

## 🔐 数据安全

- **本地存储** - 所有数据存储在本地文件系统
- **Git版本控制** - 内容变更可追溯
- **无外部依赖** - 不依赖第三方数据库
- **隐私保护** - `.agent-workspace/` 不提交到Git

---

## 📝 对话总结系统

### 完整数据管道

```
对话历史 (.jsonl) → API处理 → 摘要数据 (JSON) → Markdown转换 → 前端展示 (Notes/Logs)
```

**快速开始**:
```bash
# 1. 初始化系统
npm run summary:init

# 2. 启动服务器
npm run dev

# 3. 执行完整数据管道（自动完成所有步骤）
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

- **自动摘要生成** - 调用大模型为每个对话生成摘要、提取关键词、分析情感
- **智能聚类** - 自动将相似对话聚合为主题，将相似主题聚合为领域
- **多阶段摘要** - 三层树形结构（领域 → 主题 → 对话），每层都有独立摘要
- **试错机制** - 自动重试（3次）、指数退避、降级处理
- **时间戳管理** - 增量处理、断点续传、处理历史记录
- **丰富API** - 10+个API接口，支持搜索、统计、推荐等

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
    "model": "qwen-plus",
    "max_retries": 3,
    "temperature": 0.7
  },
  "processing": {
    "batch_size": 10,
    "max_concurrent": 3
  },
  "clustering": {
    "similarity_threshold": 0.7,
    "min_cluster_size": 3
  }
}
```

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
