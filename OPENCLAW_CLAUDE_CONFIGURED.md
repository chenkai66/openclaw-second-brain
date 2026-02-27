# OpenClaw Claude 模型配置完成

## ✅ 配置状态

OpenClaw 现在已经成功配置为使用 **Claude Sonnet 4.5** 作为默认模型，配置方式与 Claude Code 完全相同。

## 🔧 配置详情

### 使用的代理
- **代理服务**: dashscope-proxy
- **代理地址**: http://127.0.0.1:8080/idealab
- **API Key**: 通过环境变量 `ANTHROPIC_API_KEY` 设置

### 配置方式
通过环境变量配置（需添加到 ~/.zshrc）:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"
```

⚠️ **安全提示**:
- 请将 `your-api-key-here` 替换为实际的 API Key
- **永远不要**将 API Key 提交到 Git 仓库
- 使用 `.env` 文件或环境变量管理敏感信息

### 模型配置
| 模型 | 状态 | 说明 |
|------|------|------|
| **anthropic/claude-sonnet-4-5** | ✅ 默认模型 | 与 Claude Code 使用相同版本 |
| **anthropic/claude-opus-4-6** | ✅ 已配置 | 最强大的 Claude 模型 |
| **anthropic/claude-haiku-4-5** | ✅ 已配置 | 最快速的 Claude 模型 |
| openai/gpt-4 | ✅ 备用 | OpenAI 模型 |
| openai/qwen-max | ⚠️ Missing | 通义千问（原默认） |

## 🎯 统一配置优势

现在 **OpenClaw** 和 **Claude Code** 使用完全相同的配置：

1. **相同的代理**: 都通过 `dashscope-proxy` 访问 idealab
2. **相同的环境变量**: `ANTHROPIC_API_KEY` 和 `ANTHROPIC_BASE_URL`
3. **相同的模型**: Claude Sonnet 4.5
4. **相同的 Base URL**: `http://127.0.0.1:8080/idealab`

### 配置对比

| 项目 | Claude Code | OpenClaw | 状态 |
|------|-------------|----------|------|
| 代理 | dashscope-proxy | dashscope-proxy | ✅ 相同 |
| 环境变量 | ANTHROPIC_API_KEY | ANTHROPIC_API_KEY | ✅ 相同 |
| Base URL | http://127.0.0.1:8080/idealab | http://127.0.0.1:8080/idealab | ✅ 相同 |
| 默认模型 | claude_sonnet4_5 | anthropic/claude-sonnet-4-5 | ✅ 相同 |
| 配置方式 | CC Mate + settings.json | 环境变量 + openclaw.json | ✅ 都支持 |

## 📝 使用方法

### 1. 设置环境变量
首次使用需要设置环境变量：

```bash
# 添加到 ~/.zshrc（永久）
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
echo 'export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"' >> ~/.zshrc
source ~/.zshrc

# 或者临时设置（当前 shell）
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"
```

### 2. 启动系统
```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain
./scripts/start-system.sh
```

脚本会自动：
- 检查 dashscope-proxy 是否运行
- 加载环境变量
- 启动 OpenClaw Gateway
- 启动 Next.js 服务器

### 3. 使用 OpenClaw TUI
```bash
openclaw tui
```

现在你会使用 Claude Sonnet 4.5 进行对话。

### 4. 切换模型
在 OpenClaw 对话中可以使用命令切换模型：

```bash
# 切换到 Opus 4.6（最强大）
/model opus

# 切换到 Haiku 4.5（最快）
/model haiku

# 切换回 Sonnet 4.5
/model anthropic/claude-sonnet-4-5
```

### 5. 验证配置
```bash
# 查看当前模型状态
openclaw models status

# 运行测试脚本
./scripts/test-openclaw-claude.sh
```

## 🔍 技术细节

### 环境变量优先级
OpenClaw 使用以下优先级查找认证：
1. 环境变量 (`ANTHROPIC_API_KEY`)
2. auth-profiles.json 文件
3. 命令行参数

当前配置使用环境变量方式（最简单、最安全）。

### 配置文件位置
- **OpenClaw 主配置**: `~/.openclaw/openclaw.json`
- **认证配置**: `~/.openclaw/agents/main/agent/auth-profiles.json`
- **环境变量**: `~/.zshrc`（永久）

### API 端点映射
OpenClaw 会自动将 Anthropic API 调用映射到配置的 Base URL：

```
原始: https://api.anthropic.com/v1/messages
↓
重写: http://127.0.0.1:8080/idealab/v1/messages
↓
dashscope-proxy 处理
↓
idealab Google Vertex Claude
```

## 🚀 自动化任务

现在所有的自动化任务（Cron jobs）都会使用 Claude 模型：

| 任务 | 频率 | 使用的模型 |
|------|------|------------|
| Knowledge Sync | 每小时 | Claude Sonnet 4.5 |
| Daily Research | 每天 23:00 | Claude Sonnet 4.5 |
| Memory Update | 每天凌晨 | Claude Sonnet 4.5 |

查看任务状态：
```bash
openclaw cron list
```

## ⚠️ 注意事项

### 1. dashscope-proxy 必须运行
所有对话前确保代理在运行：
```bash
ps aux | grep dashscope-proxy
```

如果未运行：
```bash
./dashscope-proxy
```

### 2. 环境变量生效
新终端会话需要确保环境变量已加载：
```bash
source ~/.zshrc
```

或者在当前 shell 中设置：
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"
```

### 3. Gateway 重启
修改模型配置后，需要重启 Gateway：
```bash
openclaw gateway restart
```

### 4. 安全最佳实践
- ✅ 使用环境变量存储 API Key
- ✅ 将 API Key 添加到 `.gitignore`
- ✅ 定期轮换 API Key
- ❌ **永远不要**将 API Key 硬编码到代码中
- ❌ **永远不要**将包含 API Key 的文件提交到 Git

## 📊 监控和调试

### 查看日志
```bash
# Gateway 日志
tail -f ~/.openclaw/logs/gateway.log

# Next.js 日志
tail -f ~/.openclaw/logs/nextjs-dev.log

# Cron 任务日志
ls -lt ~/Desktop/Project/openclaw/openclaw-second-brain/agent-logs/
```

### 测试 API 连接
```bash
curl -s $ANTHROPIC_BASE_URL/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude_sonnet4_5",
    "max_tokens": 20,
    "messages": [{"role": "user", "content": "Hi"}]
  }' | jq .
```

## 🎊 成功标志

系统配置成功的标志：

- ✅ `openclaw models list` 显示 Anthropic 模型的 Auth 列为 "yes"
- ✅ `openclaw models status` 显示默认模型为 `anthropic/claude-sonnet-4-5`
- ✅ `./scripts/test-openclaw-claude.sh` 测试通过
- ✅ `openclaw tui` 可以正常对话
- ✅ Claude Code 和 OpenClaw 使用相同配置

## 📚 相关文档

- [OpenClaw 安装指南](./OPENCLAW_INSTALLED.md)
- [自主 AI 系统](./AUTONOMOUS_AI_SYSTEM.md)
- [快速开始](./GETTING_STARTED.md)

---

**配置完成时间**: 2026-02-27
**配置者**: Claude Code (Sonnet 4.5) + OpenClaw
**状态**: ✅ 生产就绪

**安全提示**: 本文档不包含任何敏感信息，所有 API Key 均通过环境变量管理。
