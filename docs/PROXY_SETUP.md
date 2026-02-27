# OpenClaw + Claude Code 统一代理配置指南

本文档说明如何配置 OpenClaw 使用与 Claude Code 相同的代理方式来调用 Anthropic 模型。

## 架构概述

```
┌─────────────────────┐
│   Claude Code CLI   │
│  (你当前使用的工具)  │
└──────────┬──────────┘
           │
           │ API 调用
           ▼
┌─────────────────────┐       ┌──────────────────────┐
│   dashscope-proxy   │◄──────│  OpenClaw Gateway    │
│   (端口 8080)       │       │  (本地服务)          │
└──────────┬──────────┘       └──────────────────────┘
           │
           │ 转发到
           ▼
┌─────────────────────┐
│   Idealab API       │
│ (Google Vertex)     │
└─────────────────────┘
```

## 配置步骤

### 1. 启动代理服务

确保 `dashscope-proxy` 在端口 8080 上运行：

```bash
./dashscope-proxy
```

启动成功后会显示：
```
Starting proxy server...
ANTHROPIC_BASE_URL: http://127.0.0.1:8080/idealab
Proxy server is running on port 8080
```

### 2. 配置 OpenClaw

OpenClaw 的配置文件位于：`~/.openclaw/openclaw.json`

**重要：** OpenClaw 不使用 `auth-profiles.json`，而是直接在 `openclaw.json` 的 `models.providers` 中配置。

需要在配置文件中添加 `models.providers` 部分：

```json
{
  "models": {
    "providers": {
      "anthropic": {
        "baseUrl": "http://127.0.0.1:8080/idealab",
        "apiKey": "YOUR_API_KEY_HERE",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude_sonnet4_5",
            "name": "Claude Sonnet 4.5",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude_sonnet4_5"
      },
      "models": {
        "anthropic/claude_sonnet4_5": {}
      }
    }
  }
}
```

**关键配置说明：**
- `baseUrl`: 必须是 `http://127.0.0.1:8080/idealab`（不包含 `/v1`）
- `api`: 必须是 `"anthropic-messages"`
- `models[].id`: 使用 Idealab 支持的模型 ID（如 `claude_sonnet4_5`）
- `agents.defaults.model.primary`: 格式为 `provider/model-id`（如 `anthropic/claude_sonnet4_5`）

### 3. 配置 Claude Code

Claude Code 的配置通过 CC Mate 或手动编辑 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY_HERE",
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8080/idealab",
    "ANTHROPIC_MODEL": "claude_sonnet4_5"
  }
}
```

### 4. 使用启动脚本（可选）

如果需要通过环境变量启动 OpenClaw Gateway：

```bash
# 1. 复制示例配置
cp scripts/start-gateway-with-env.sh.example scripts/start-gateway-with-env.sh

# 2. 编辑文件，填入真实的 API Key
vim scripts/start-gateway-with-env.sh

# 3. 运行脚本
bash scripts/start-gateway-with-env.sh
```

## 重要提示

### 为什么需要代理？

Idealab 接入的是 Google Vertex 平台的 Claude，返回值会缺少 `id` 字段。`dashscope-proxy` 代理会自动补充这个字段，确保兼容性。

### 端口说明

- **8080**: dashscope-proxy 代理服务端口（Claude Code 和 OpenClaw 共用）
- **8081**: ~~不再使用~~（旧配置）

### 安全注意事项

**永远不要将包含真实 API Key 的文件提交到 git！**

`.gitignore` 已配置忽略以下文件：
- `.openclaw/` 目录（包含 auth-profiles.json）
- `scripts/start-gateway-with-env.sh`（包含环境变量）
- `test-anthropic-sdk.js`（测试脚本）
- `**/auth-profiles.json`（认证配置）

## 验证配置

### 测试 Claude Code
```bash
claude --version
claude doctor
```

### 测试 OpenClaw
```bash
# 启动 gateway
openclaw gateway install

# 测试连接
openclaw agent --agent main -m "Hello, test connection"
```

预期输出：模型应该正常响应你的消息。

### 测试代理连接
```bash
# 确保代理正在运行
curl http://127.0.0.1:8080/idealab/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

## 故障排除

### 问题 1: 连接被拒绝
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**解决方案**: 确保 dashscope-proxy 正在运行：
```bash
ps aux | grep dashscope-proxy
```

### 问题 2: API Key 无效
```
Error: Authentication failed: Please make sure your API Key is valid.
```

**解决方案**:
1. 检查 API Key 是否正确配置在 `openclaw.json` 的 `models.providers` 中
2. 确认 `baseUrl` 是 `http://127.0.0.1:8080/idealab`（不包含 `/v1`）
3. 确认 `api` 字段设置为 `"anthropic-messages"`

### 问题 3: 模型不支持
```
Error: You invoked an unsupported model or your request did not allow prompt caching.
```

**解决方案**: 使用 Idealab 支持的模型 ID：
- `claude_sonnet4_5` (推荐)
- `claude-opus-4-6`
- `claude-haiku-4-5`

确保在 `models.providers.anthropic.models` 中定义了这些模型。

### 问题 3: 端口冲突
```
Error: Address already in use
```

**解决方案**: 检查端口占用情况：
```bash
lsof -i :8080
```

## 模型切换

### 在 OpenClaw 中切换模型

编辑 `~/.openclaw/openclaw.json`：
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6"
      }
    }
  }
}
```

可用模型（需要在 `models.providers.anthropic.models` 中定义）：
- `anthropic/claude_sonnet4_5` (推荐，默认)
- `anthropic/claude-opus-4-6`
- `anthropic/claude-haiku-4-5`
- `anthropic/claude-3-5-sonnet-20241022`

修改后重启 Gateway：
```bash
openclaw gateway stop
openclaw gateway install
```

### 在 Claude Code 中切换模型

通过 CC Mate 或命令：
```bash
# 在交互式会话中
/model opus
/model sonnet
/model haiku
```

## 相关文档

- [Claude Code 官方文档](https://docs.anthropic.com/claude/docs/claude-code)
- [OpenClaw 文档](https://docs.openclaw.ai/)
- [Idealab 申请流程](https://alidocs.dingtalk.com/i/nodes/20eMKjyp810mMdK4HkgpyY3AJxAZB1Gv)

## 更新日志

- **2026-02-27**: 统一 Claude Code 和 OpenClaw 使用相同代理端口（8080）
- **2026-02-25**: 初始配置，支持 Idealab API
