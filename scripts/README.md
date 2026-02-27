# Scripts 目录说明

本目录包含 OpenClaw 和 Claude Code 的配置和管理脚本。

## 脚本列表

### 配置和验证

- **`verify-proxy-setup.sh`** - 验证 OpenClaw 和 Claude Code 的代理配置是否正确
  ```bash
  bash scripts/verify-proxy-setup.sh
  ```

- **`start-gateway-with-env.sh.example`** - OpenClaw Gateway 启动脚本示例
  - 复制此文件为 `start-gateway-with-env.sh` 并填入真实 API Key
  - ⚠️ 不要提交包含真实 API Key 的版本到 git

### 其他脚本

- **`health-check.js`** - 健康检查脚本
- **`init-summary-system.js`** - 初始化摘要系统
- **`test-summary-system.js`** - 测试摘要系统
- 其他 summary 和 agent 相关脚本

## 重要提示

### 安全注意事项

永远不要将包含以下内容的文件提交到 git：
- API Keys
- 认证令牌
- 密码
- 私钥

这些文件已在 `.gitignore` 中配置：
- `scripts/*-with-keys.sh`
- `scripts/openclaw-tui*.sh`
- `test-*.js`（测试脚本）

### 代理配置

OpenClaw 和 Claude Code 使用相同的代理配置：
- **代理地址**: `http://127.0.0.1:8080/idealab`
- **代理服务**: dashscope-proxy
- **端口**: 8080

详细配置说明请参考：[docs/PROXY_SETUP.md](../docs/PROXY_SETUP.md)
