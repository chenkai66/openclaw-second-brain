# OpenClaw TUI 启动指南

## ✅ 已配置完成

所有 API Keys 已配置，相关文件已添加到 `.gitignore`，不会被推送到 GitHub。

## 🚀 启动方法

### 方法 1: 使用启动脚本（推荐）

```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain
./scripts/openclaw-tui-with-keys.sh
```

这会：
- ✅ 自动设置所有 API Keys
- ✅ 检查 dashscope-proxy 状态
- ✅ 启动 OpenClaw TUI

### 方法 2: 手动启动（每次都要设置环境变量）

```bash
# 设置环境变量
export ANTHROPIC_API_KEY="your-idealab-api-key"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"

# 启动
openclaw tui
```

### 方法 3: 永久配置（推荐用于日常使用）

环境变量已添加到 `~/.zshrc`，新终端会自动加载：

```bash
# 在新终端中直接运行
openclaw tui
```

## 📝 使用说明

### 启动后

```
🦞 OpenClaw 2026.2.26
session agent:main:main

> 你的消息
```

### 常用命令

- `/model opus` - 切换到 Claude Opus 4.6
- `/model haiku` - 切换到 Claude Haiku 4.5
- `/help` - 查看帮助
- `Ctrl+C` 或 `/exit` - 退出

### 当前配置

| 配置项 | 值 |
|--------|-----|
| 默认模型 | Claude Sonnet 4.5 |
| API 来源 | idealab (通过 dashscope-proxy) |
| 备用模型 | Claude Opus 4.6, Haiku 4.5 |
| 会话存储 | `~/.openclaw/agents/main/sessions/` |

## ⚠️ 注意事项

### 1. dashscope-proxy 必须运行

Claude 模型需要代理：

```bash
# 检查代理状态
ps aux | grep dashscope-proxy

# 如未运行，启动代理
./dashscope-proxy
```

### 2. Gateway 必须运行

```bash
# 检查 Gateway 状态
openclaw health

# 如未运行，启动 Gateway
openclaw gateway restart
```

### 3. 验证配置

```bash
# 查看模型状态（Auth 应为 yes）
export ANTHROPIC_API_KEY="your-idealab-api-key"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"
openclaw models list | grep anthropic

# 应该显示：
# anthropic/claude-sonnet-4-5  ... yes  default
# anthropic/claude-opus-4-6    ... yes  configured
# anthropic/claude-haiku-4-5   ... yes  configured
```

## 🔒 安全保护

以下文件包含 API Keys，已在 `.gitignore` 中，**不会被推送到 GitHub**：

- ✅ `scripts/openclaw-tui-with-keys.sh`
- ✅ `scripts/openclaw-tui.sh`
- ✅ `~/.zshrc` (不在仓库中)
- ✅ `~/.openclaw/agents/main/agent/auth-profiles.json` (不在仓库中)

`.gitignore` 配置：
```gitignore
# OpenClaw 配置和认证文件（包含 API Keys）
.openclaw/
**/auth-profiles.json
scripts/openclaw-tui*.sh
scripts/*-with-keys.sh

# 环境变量和密钥
.env
.env.local
*.key
*.pem
```

## 🐛 故障排查

### 问题 1: "No API key found"

**解决方案**：
```bash
# 使用启动脚本
./scripts/openclaw-tui-with-keys.sh

# 或手动设置环境变量
export ANTHROPIC_API_KEY="your-idealab-api-key"
export ANTHROPIC_BASE_URL="http://127.0.0.1:8080/idealab"
openclaw tui
```

### 问题 2: "Connection refused"

**原因**: Gateway 未运行

**解决方案**:
```bash
openclaw gateway restart
sleep 3
openclaw tui
```

### 问题 3: Claude 模型无响应

**原因**: dashscope-proxy 未运行

**解决方案**:
```bash
./dashscope-proxy
```

## 📊 对话记录

所有对话会自动保存到：
```
~/.openclaw/agents/main/sessions/
```

每小时会自动同步到 Second Brain，提取知识并生成笔记。

## ✅ 快速验证

运行测试：
```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain

# 1. 启动 OpenClaw TUI
./scripts/openclaw-tui-with-keys.sh

# 2. 输入测试消息
> 你好，你使用的是什么模型？

# 3. 应该看到 Claude Sonnet 4.5 的回复
```

---

**配置完成**: ✅
**API Keys**: ✅ 已配置
**安全保护**: ✅ 已在 gitignore
**状态**: 可以使用
