# 🧠 OpenClaw Second Brain

**AI-Powered Personal Knowledge Management System**

*让思想永不遗忘 · 让知识自动生长*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

一个完全自主运行的 AI 知识管理系统，集成了 OpenClaw、Second Brain 和 Claude Code，实现持续学习、记忆管理和自动化工作流。

---

## ✨ 核心特性

### 🧠 分层记忆系统
- **Layer 1**: 用户偏好（长期）- 个人信息、技术偏好、工作风格
- **Layer 2**: 决策历史（中期）- 成功/失败的决策、问题解决方案
- **Layer 3**: 技术知识（短期-中期）- 技术栈、最佳实践、代码示例
- **Layer 4**: 对话历史（短期）- 所有对话的完整记录

### 🔄 自动知识流动
```
当前对话 (Claude Code)
    ↓ (记录在 git)
OpenClaw 对话
    ↓ (每小时自动)
Second Brain 知识库
    ↓ (每天凌晨)
记忆系统更新
```

### 🤖 多 AI 模型支持

| API 源 | 模型 | 用途 | 状态 |
|--------|------|------|------|
| **idealab (默认)** | Claude Sonnet 4.5 | 主力对话模型 | ✅ |
| idealab | Claude Opus 4.6 | 复杂任务 | ✅ |
| idealab | Claude Haiku 4.5 | 快速响应 | ✅ |
| **百炼 API** | qwen-max | 备用强力模型 | ✅ |
| 百炼 API | qwen3.5-flash | 快速轻量任务 | ✅ |
| 百炼 API | qwen3.5-122b | 大规模推理 | ✅ |

### ⚡ 自动化任务

| 任务 | 频率 | 功能 |
|------|------|------|
| **Knowledge Sync** | 每小时 | 同步对话到知识库 |
| **Daily Research** | 每天 23:00 | 生成研究报告 |
| **Memory Update** | 每天凌晨 | 更新记忆文件 |

### 🔍 智能搜索与导航
- **全文搜索** - 毫秒级响应，实时高亮匹配内容
- **标签系统** - 多维度分类，快速定位相关内容
- **知识图谱** - D3.js可视化，探索知识之间的隐藏联系

---

## 🚀 快速开始

### 1. 环境配置

编辑 `~/.zshrc` 添加：

```bash
# idealab Claude (通过 dashscope-proxy)
export ANTHROPIC_API_KEY="your-idealab-api-key"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"

# 百炼 API (阿里云)
export BAILIAN_API_KEY="your-bailian-api-key"
export BAILIAN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# OpenClaw 会话路径
export OPENCLAW_SESSIONS_PATH="$HOME/.openclaw/agents/main/sessions"
```

加载配置：
```bash
source ~/.zshrc
```

### 2. 安装依赖

```bash
git clone <your-repo>
cd openclaw-second-brain
npm install
```

### 3. 启动系统

```bash
# 一键启动（推荐）
./scripts/start-system.sh

# 或手动启动
npm run dev
```

### 4. 验证配置

```bash
# 测试所有 API
./scripts/test-multi-api.sh

# 查看模型状态
openclaw models status

# 查看定时任务
openclaw cron list
```

### 5. 开始使用

```bash
# 使用 OpenClaw TUI（默认 Claude Sonnet 4.5）
openclaw tui

# 在对话中切换模型
/model opus       # Claude Opus 4.6
/model haiku      # Claude Haiku 4.5

# 访问 Second Brain Web UI
open http://localhost:3000
```

---

## 📁 项目结构

```
openclaw-second-brain/
├── README.md                    # 本文档
├── .env.example                 # 环境变量模板
│
├── src/app/                     # Next.js 应用
│   ├── page.tsx                 # 首页（搜索+统计）
│   ├── notes/[slug]/            # 笔记详情页
│   ├── logs/[date]/             # 日志详情页
│   └── graph/                   # 知识图谱页
│
├── lib/                         # 核心逻辑
│   ├── conversation/            # 对话处理
│   ├── summary/                 # 知识提取
│   └── graph/                   # 知识图谱
│
├── scripts/                     # 自动化脚本
│   ├── start-system.sh          # 系统启动
│   ├── test-multi-api.sh        # API 测试
│   ├── knowledge-sync.sh        # 知识同步
│   └── update-memory.sh         # 记忆更新
│
├── skills/                      # OpenClaw Agent 技能
│   ├── knowledge-agent-skill/   # 知识同步 Agent
│   ├── research-agent-skill/    # 研究报告 Agent
│   └── project-developer-skill/ # 项目开发 Agent
│
├── content/                     # 生成的内容
│   ├── notes/                   # 知识笔记
│   ├── logs/                    # 对话日志
│   └── reports/                 # 研究报告
│
└── data/summaries/              # 知识摘要数据
```

---

## 🔧 核心功能详解

### 记忆系统

#### 查看记忆
```bash
cat ~/.openclaw/workspace/memory/user-preferences.md
cat ~/.openclaw/workspace/memory/decision-history.md
cat ~/.openclaw/workspace/memory/technical-knowledge.md
```

#### 更新记忆
记忆会自动更新，也可以手动编辑：
```bash
vim ~/.openclaw/workspace/memory/decision-history.md
```

### 知识同步流程

1. 在 OpenClaw 中对话
2. 系统每小时自动提取知识
3. 生成结构化的 Notes 和 Logs
4. 构建知识图谱
5. 更新记忆系统

### 模型切换

#### OpenClaw 中切换
```bash
# 在对话中使用命令
/model opus                          # Claude Opus 4.6
/model anthropic/claude-haiku-4-5    # Claude Haiku 4.5
/model anthropic/claude-sonnet-4-5   # 切换回默认

# 或通过命令行
openclaw models set anthropic/claude-opus-4-6
```

#### 百炼模型使用
百炼模型通过 API 直接调用（支持 qwen-max、qwen3.5-flash 等）。

---

## 🤖 Agent 自动化

### Knowledge Agent
- **功能**: 自动同步对话到 Second Brain
- **触发**: 每小时
- **输出**: Notes、Logs、Summary 数据

### Research Agent
- **功能**: 生成研究报告
- **触发**: 每晚 23:00
- **输出**: 研究报告保存到 `content/reports/`

### Project Developer Agent
- **功能**: 自主开发项目
- **触发**: 手动
- **使用**:
```bash
cd skills/project-developer-skill
./start-project-dev.sh
```

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
```

---

## 📊 监控和调试

### 查看日志
```bash
# Gateway 日志
tail -f ~/.openclaw/logs/gateway.log

# Next.js 日志
tail -f ~/.openclaw/logs/nextjs-dev.log

# Agent 日志
ls -lt ~/Desktop/Project/openclaw/openclaw-second-brain/agent-logs/
```

### 系统状态
```bash
# OpenClaw 状态
openclaw health

# 模型配置
openclaw models status

# Second Brain API
curl http://localhost:3000/api/summary/stats | jq .
```

---

## ⚠️ 注意事项

### API Key 安全
- ✅ 使用环境变量存储 API Key
- ✅ `.env` 已添加到 `.gitignore`
- ❌ **永远不要**将 API Key 提交到 Git
- ❌ **永远不要**硬编码 API Key

### dashscope-proxy 依赖
idealab Claude 模型需要 dashscope-proxy 运行：
```bash
# 检查代理状态
ps aux | grep dashscope-proxy

# 如未运行，启动代理
./dashscope-proxy
```

### 环境变量生效
新终端需要重新加载：
```bash
source ~/.zshrc
```

---

## 🎊 成功标志

系统正常运行的标志：

- ✅ `openclaw models list` 显示所有模型认证为 "yes"
- ✅ `./scripts/test-multi-api.sh` 所有测试通过
- ✅ `openclaw cron list` 显示 3 个定时任务
- ✅ Second Brain UI 可访问 http://localhost:3000
- ✅ 对话越来越个性化，AI 记住你的偏好
- ✅ 知识自动积累，图谱越来越丰富

---

## 🔄 日常维护

### 每天（自动）
- ✅ 知识同步 (每小时)
- ✅ 记忆更新 (凌晨)
- ✅ 研究报告 (23:00)

### 每周（手动）
```bash
# 检查系统状态
./scripts/start-system.sh

# 查看生成的内容
ls -la agent-logs/ content/notes/

# 更新决策历史（如有重要决策）
vim ~/.openclaw/workspace/memory/decision-history.md

# 备份重要数据
tar -czf backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/workspace/memory data/
```

---

## 🛠️ 技术栈

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI Models**: Claude 4.5/4.6, Qwen Max/3.5
- **Data**: Markdown, JSONL, File-based storage
- **Automation**: OpenClaw Gateway, Cron jobs
- **Search**: Full-text search, Knowledge graph
- **Visualization**: D3.js force-directed graph

---

## 🤝 贡献

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 License

MIT

---

**最后更新**: 2026-02-27
**版本**: 2.0
**配置者**: Claude Code + OpenClaw
**状态**: ✅ 生产就绪

Made with ❤️ by ChenKai
