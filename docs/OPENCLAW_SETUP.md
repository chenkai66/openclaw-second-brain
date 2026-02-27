# OpenClaw 安装和配置指南

本文档详细说明如何安装和配置 OpenClaw CLI，以便与 Second Brain 系统集成。

## 目录

1. [什么是 OpenClaw](#什么是-openclaw)
2. [安装 OpenClaw](#安装-openclaw)
3. [配置环境](#配置环境)
4. [验证安装](#验证安装)
5. [配置 Second Brain](#配置-second-brain)
6. [使用 OpenClaw](#使用-openclaw)
7. [故障排查](#故障排查)

---

## 什么是 OpenClaw

OpenClaw 是一个 AI Agent 基础设施，提供：
- CLI 工具用于与 AI 对话
- 会话管理和历史记录
- 定时任务调度
- Agent 技能系统

Second Brain 依赖 OpenClaw 来：
- 读取对话历史 (`.openclaw/agents/main/sessions/*.jsonl`)
- 自动运行知识同步和研究任务
- 提供 AI Agent 运行环境

---

## 安装 OpenClaw

### macOS / Linux

```bash
# 使用官方安装脚本
curl -fsSL https://openclaw.ai/install.sh | sh

# 或者使用 Homebrew (如果支持)
brew install openclaw
```

### 验证安装

```bash
openclaw --version
```

应该输出版本号，例如：`openclaw 1.0.0`

---

## 配置环境

### 1. 设置 API 密钥

OpenClaw 需要一个 OpenAI 兼容的 API 密钥。推荐使用阿里云百炼：

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
export OPENAI_API_KEY="your-dashscope-api-key"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
```

**获取阿里云百炼 API 密钥**：
1. 访问 https://dashscope.console.aliyun.com/
2. 注册/登录账号
3. 在控制台创建 API Key
4. 复制 API Key 并设置到环境变量

### 2. 初始化 OpenClaw

```bash
# 初始化配置
openclaw init

# 进行第一次对话以创建会话
openclaw chat "你好，这是一次测试对话"
```

### 3. 检查会话目录

```bash
# 查看会话文件
ls -la ~/.openclaw/agents/main/sessions/

# 应该看到类似这样的输出：
# -rw-r--r--  1 user  staff  1234 Feb 27 10:00 session-id-123.jsonl
```

---

## 验证安装

使用 Second Brain 的健康检查脚本：

```bash
npm run health
```

检查以下项目是否通过：
- ✓ OpenClaw CLI 已安装
- ✓ OpenClaw 会话目录存在
- ✓ 找到 N 个会话文件

---

## 配置 Second Brain

### 1. 创建环境文件

```bash
cp .env.example .env
```

### 2. 编辑 `.env` 文件

```bash
# OpenAI Compatible API Configuration
OPENAI_API_KEY=your-dashscope-api-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# OpenClaw Sessions Path (通常无需修改)
OPENCLAW_SESSIONS_PATH=/Users/yourusername/.openclaw/agents/main/sessions

# Optional
PORT=3000
LOG_LEVEL=info
```

### 3. 初始化 Summary 系统

```bash
npm run summary:init
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 使用 OpenClaw

### 基本对话

```bash
# 开始对话
openclaw chat "帮我写一个 React 组件"

# 查看对话历史
openclaw history

# 查看特定会话
openclaw session show <session-id>
```

### 设置定时任务

为 Second Brain 设置自动化任务：

```bash
# 每小时同步知识
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd /path/to/openclaw-second-brain && npm run agent:knowledge" \
  --delivery none

# 每晚 23:00 生成研究报告
openclaw cron add \
  --name "Daily Research" \
  --cron "0 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "cd /path/to/openclaw-second-brain && npm run agent:research" \
  --delivery none

# 查看定时任务
openclaw cron list

# 手动触发任务
openclaw cron run --name "Knowledge Sync"
```

### 管理定时任务

```bash
# 查看任务状态
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Knowledge Sync" --limit 10

# 禁用任务
openclaw cron edit <job-id> --enabled false

# 启用任务
openclaw cron edit <job-id> --enabled true

# 删除任务
openclaw cron remove <job-id>
```

---

## 故障排查

### 问题 1: `openclaw: command not found`

**原因**: OpenClaw 未安装或不在 PATH 中

**解决方案**:
```bash
# 重新安装
curl -fsSL https://openclaw.ai/install.sh | sh

# 或手动添加到 PATH
export PATH="$PATH:$HOME/.openclaw/bin"
```

### 问题 2: 会话目录不存在

**原因**: 还没有进行过对话

**解决方案**:
```bash
# 进行第一次对话
openclaw chat "测试对话"

# 验证目录创建
ls -la ~/.openclaw/agents/main/sessions/
```

### 问题 3: API 连接失败

**原因**: API 密钥未设置或无效

**解决方案**:
```bash
# 检查环境变量
echo $OPENAI_API_KEY
echo $OPENAI_BASE_URL

# 重新设置
export OPENAI_API_KEY="your-valid-api-key"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# 测试连接
openclaw chat "test"
```

### 问题 4: Second Brain 无法读取会话

**原因**: 路径配置错误

**解决方案**:
```bash
# 检查路径
echo $OPENCLAW_SESSIONS_PATH

# 设置正确的路径
export OPENCLAW_SESSIONS_PATH="$HOME/.openclaw/agents/main/sessions"

# 或在 .env 文件中设置
echo "OPENCLAW_SESSIONS_PATH=$HOME/.openclaw/agents/main/sessions" >> .env
```

### 问题 5: 定时任务不运行

**原因**: 任务未启用或 cron 表达式错误

**解决方案**:
```bash
# 查看任务详情
openclaw cron list

# 检查任务是否启用
openclaw cron edit <job-id> --enabled true

# 验证 cron 表达式 (使用 crontab.guru)
# 例如: "0 * * * *" = 每小时整点运行

# 手动测试任务
openclaw cron run --name "Knowledge Sync"
```

---

## 高级配置

### 使用不同的会话路径

如果你有多个 OpenClaw 实例或想使用不同的会话目录：

```bash
# 设置自定义路径
export OPENCLAW_SESSIONS_PATH="/path/to/custom/sessions"

# Second Brain 会自动使用这个路径
```

### 会话文件格式

OpenClaw 使用 JSONL (JSON Lines) 格式存储会话：

```jsonl
{"type":"session","version":3,"id":"session-id","timestamp":"2026-02-27T03:00:00.000Z","cwd":"/path"}
{"type":"message","id":"msg-1","timestamp":"2026-02-27T03:00:01.000Z","message":{"role":"user","content":[{"type":"text","text":"Hello"}]}}
{"type":"message","id":"msg-2","timestamp":"2026-02-27T03:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}]}}
```

Second Brain 会：
1. 读取所有 `.jsonl` 文件
2. 跳过 `.jsonl.lock` 文件（正在写入）
3. 提取 `type: "message"` 的记录
4. 只保留 `role: "user"` 和 `role: "assistant"` 的消息
5. 过滤太短的对话 (< 50 字符)

---

## 最佳实践

### 1. 定期进行有意义的对话

为了让 Second Brain 有内容可处理：
- 与 OpenClaw 进行技术讨论
- 记录学习笔记
- 保存代码片段和解释
- 讨论项目架构

### 2. 使用有意义的会话名称

```bash
# 为重要对话设置标题
openclaw chat --title "React Performance Optimization" "讨论 React 性能优化"
```

### 3. 定期清理旧会话

```bash
# 归档超过 30 天的会话
openclaw session archive --older-than 30d

# 或手动备份
cp -r ~/.openclaw/agents/main/sessions ~/.openclaw/backups/sessions-$(date +%Y%m%d)
```

### 4. 监控定时任务

```bash
# 每周检查任务执行情况
openclaw cron runs --name "Knowledge Sync" --limit 50

# 查看失败的任务
openclaw cron runs --name "Knowledge Sync" --failed
```

---

## 参考资料

- **OpenClaw 官网**: https://openclaw.ai
- **OpenClaw 文档**: https://docs.openclaw.ai
- **阿里云百炼**: https://dashscope.console.aliyun.com
- **Cron 表达式**: https://crontab.guru

---

## 支持

如果遇到问题：

1. 运行健康检查: `npm run health`
2. 查看日志: `~/.openclaw/logs/`
3. 提交 Issue: https://github.com/anthropics/claude-code/issues

---

**⚠️ 重要提醒**

- 保护好你的 API 密钥，不要提交到 Git
- 定期备份 `~/.openclaw/` 目录
- 定时任务会消耗 API 配额，根据需要调整频率
