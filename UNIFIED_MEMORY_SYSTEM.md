# 🎉 Claude Code + OpenClaw 统一记忆系统

## ✅ 系统功能

现在你的对话记录无论是在 **Claude Code** 还是 **OpenClaw TUI** 中，都会自动被记忆、学习和积累！

### 工作原理

```
Claude Code 对话          OpenClaw TUI 对话
    ↓                          ↓
    ├─ ~/.claude/projects/     ├─ ~/.openclaw/agents/main/sessions/
    │                          │
    └─────────┬────────────────┘
              ↓
      增强版 Knowledge Agent
      (每小时自动运行)
              ↓
      ├─ 自动发现 Claude Code 会话
      ├─ 格式转换和统一处理
      ├─ 去重（避免重复处理）
      └─ LLM 提取知识
              ↓
      Second Brain 知识库
      (Notes + Logs + Summary)
              ↓
      记忆系统更新
      (每天凌晨)
              ↓
      下次对话携带记忆 ✨
```

## 🚀 快速开始

### 方法 1: 使用启动脚本（推荐）

```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain

# 启动 OpenClaw TUI（自动设置环境变量）
./scripts/openclaw-tui.sh
```

###方法 2: 手动设置环境变量

```bash
# 设置环境变量（替换为你的实际 API Key）
export ANTHROPIC_API_KEY="your-idealab-api-key"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"

# 启动 OpenClaw TUI
openclaw tui
```

### 方法 3: 永久设置（添加到 ~/.zshrc）

已经在你的 `~/.zshrc` 中配置好了，新终端自动生效：

```bash
# 重新加载配置
source ~/.zshrc

# 启动 OpenClaw TUI
openclaw tui
```

## 🧪 测试系统

### 1. 测试增强版知识同步

```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain
./scripts/test-enhanced-sync.sh
```

这会：
- 扫描所有 Claude Code 会话
- 扫描所有 OpenClaw 会话
- 显示待处理数量
- 运行完整的知识提取流程
- 生成 Notes 和 Logs

### 2. 手动触发知识同步

```bash
# 运行增强版知识同步
cd ~/Desktop/Project/openclaw/openclaw-second-brain
npm run agent:knowledge:enhanced
```

### 3. 查看处理记录

```bash
# 查看已处理的 Claude Code 会话
cat ~/.openclaw/workspace/memory/processed-claude-code-sessions.json | jq .

# 查看生成的笔记
ls -la content/notes/

# 查看生成的日志
ls -la content/logs/
```

## ⏰ 自动化配置

### 当前定时任务

```bash
# 查看现有定时任务
openclaw cron list
```

应该看到：
- **Knowledge Sync**: 每小时执行（目前使用旧版本）
- **Daily Research**: 每天 23:00
- **Memory Update**: 每天凌晨

### 升级到增强版（推荐）

```bash
# 1. 找到现有的 Knowledge Sync 任务 ID
TASK_ID=$(openclaw cron list | grep "Knowledge Sync" | awk '{print $1}')

# 2. 删除旧任务
openclaw cron remove $TASK_ID

# 3. 创建增强版任务
PROJECT_PATH="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"

openclaw cron add \
  --name "Enhanced Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd $PROJECT_PATH && npm run agent:knowledge:enhanced" \
  --no-deliver

# 4. 验证
openclaw cron list
```

## 📊 功能对比

| 功能 | 旧版 Knowledge Sync | 增强版 Knowledge Sync |
|------|--------------------|--------------------|
| OpenClaw TUI 对话 | ✅ 自动处理 | ✅ 自动处理 |
| **Claude Code 对话** | ❌ 不支持 | ✅ **自动处理** |
| 去重机制 | ⚠️ 基础 | ✅ **完善追踪** |
| 格式转换 | ⚠️ 单一格式 | ✅ **多格式支持** |
| 处理统计 | ⚠️ 简单 | ✅ **详细报告** |
| 错误处理 | ⚠️ 基础 | ✅ **健壮** |

## 🎯 使用场景

### 场景 1: 代码开发（Claude Code）

```bash
# 在 Claude Code 中工作
claude

# 对话内容会自动保存到
~/.claude/projects/<project-hash>/xxx.jsonl

# 每小时，Knowledge Agent 自动：
# 1. 发现这个会话
# 2. 提取对话内容
# 3. 转换为统一格式
# 4. 生成知识笔记
# 5. 标记为已处理

# 你无需做任何操作！
```

### 场景 2: 知识讨论（OpenClaw TUI）

```bash
# 使用 OpenClaw TUI
./scripts/openclaw-tui.sh

# 讨论技术问题、学习新知识
# 对话自动保存到
~/.openclaw/agents/main/sessions/xxx.jsonl

# 每小时自动处理（和 Claude Code 一起）
```

### 场景 3: 查看积累的知识

```bash
# 访问 Second Brain
open http://localhost:3000

# 你会看到：
# - 来自 Claude Code 的知识笔记
# - 来自 OpenClaw TUI 的知识笔记
# - 统一的知识图谱
# - 完整的对话日志
```

## 🔍 监控和验证

### 查看 Claude Code 会话统计

```bash
# 查找所有 Claude Code 会话
find ~/.claude/projects -name "*.jsonl" -type f | wc -l

# 查看最近的会话
find ~/.claude/projects -name "*.jsonl" -type f -exec stat -f "%Sm %N" -t "%Y-%m-%d %H:%M" {} \; | sort -r | head -5
```

### 查看处理状态

```bash
# 已处理的 Claude Code 会话数量
cat ~/.openclaw/workspace/memory/processed-claude-code-sessions.json | jq '. | length'

# 查看 Second Brain 统计
curl -s http://localhost:3000/api/summary/stats | jq .
```

### 查看生成的内容

```bash
# 最新的笔记
ls -lt content/notes/*.md | head -5

# 最新的日志
ls -lt content/logs/*.md | head -5
```

## 🎊 成功验证

运行测试后，你应该看到：

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Sync Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude Code:
  - Processed: 5          # 🆕 发现并处理的 Claude Code 会话
  - Exported: 5           # 🆕 成功导出的会话
  - Errors: 0

OpenClaw + Claude Code:
  - Total processed: 8    # 总共处理的对话（包括两种来源）
  - Logs created: 5
  - Notes created: 3
  - Notes updated: 2

Total:
  - Conversations: 13
  - Notes: 5
  - Logs: 5
  - Duration: 3.45s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Knowledge sync completed successfully!
```

## ⚠️ 注意事项

### 1. 首次运行

首次运行会处理所有历史会话，可能需要较长时间：
```bash
# 如果会话很多，建议分批处理
# 系统会自动追踪已处理的会话，不会重复
```

### 2. dashscope-proxy 依赖

Claude 模型需要 dashscope-proxy 运行：
```bash
# 检查代理
ps aux | grep dashscope-proxy

# 如未运行
./dashscope-proxy
```

### 3. 去重机制

系统会自动追踪已处理的会话：
- 文件：`~/.openclaw/workspace/memory/processed-claude-code-sessions.json`
- 每次运行只处理新会话
- 如需重新处理，删除追踪文件即可

### 4. 升级建议

建议升级到增强版定时任务：
```bash
# 删除旧的 Knowledge Sync 任务
openclaw cron remove <old-task-id>

# 添加增强版任务（见上文）
```

## 📚 相关文件

- **适配器**: `lib/claude-code-adapter.ts` - Claude Code 会话解析和转换
- **增强脚本**: `scripts/enhanced-knowledge-sync.mjs` - 统一处理流程
- **启动脚本**: `scripts/openclaw-tui.sh` - OpenClaw TUI 启动（带环境变量）
- **测试脚本**: `scripts/test-enhanced-sync.sh` - 完整测试流程
- **Agent 技能**: `skills/knowledge-agent-skill/SKILL.md` - 更新的技能文档

## 🎯 总结

现在你的系统已经完全统一了！

| 对话来源 | 自动发现 | 自动处理 | 知识积累 | 长期学习 |
|---------|---------|---------|---------|---------|
| **Claude Code** | ✅ | ✅ | ✅ | ✅ |
| **OpenClaw TUI** | ✅ | ✅ | ✅ | ✅ |

**核心优势**：
- 🚀 完全自动化 - 无需手动操作
- 🧠 统一记忆 - 两种对话来源合并
- 📈 持续学习 - 每小时更新
- 🔍 智能去重 - 避免重复处理
- 📊 详细统计 - 清晰的处理报告

**开始使用**：
```bash
# 1. 启动 OpenClaw TUI
./scripts/openclaw-tui.sh

# 2. 或继续使用 Claude Code
claude

# 3. 所有对话自动记忆！ ✨
```

---

**配置完成时间**: 2026-02-27
**状态**: ✅ 生产就绪
**维护**: 自动化，无需干预
