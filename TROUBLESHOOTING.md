# 常见问题排查指南

## 🔍 问题1：系统看起来只创建简单日志，没有真正的知识提取

### 症状
- 运行 `npm run agent:knowledge` 后只看到简单的日志文件
- 没有生成结构化的笔记
- 没有调用LLM进行摘要生成

### 根本原因
1. **环境变量配置错误**
   - 使用了错误的 API Key
   - API Base URL 配置不正确
   - 环境变量未正确加载

2. **端口冲突**
   - Next.js 服务器在非标准端口运行（如3001而不是3000）
   - API路由无法访问

3. **脚本路径问题**
   - 直接运行简化的脚本而不是完整的pipeline

### 解决方案

#### 方案1：检查环境变量（最常见）

```bash
# 1. 检查环境变量是否设置
echo $OPENAI_API_KEY
echo $OPENAI_BASE_URL

# 2. 如果为空，设置正确的值
export OPENAI_API_KEY="sk-your-actual-key-here"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"

# 3. 验证配置
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ API Key已设置' : '❌ API Key未设置')"
```

#### 方案2：使用完整的Pipeline脚本

```bash
# 不要只运行单个脚本
# ❌ 错误方式
npm run agent:knowledge

# ✅ 正确方式 - 使用完整pipeline
npm run summary:pipeline
```

#### 方案3：检查端口配置

```bash
# 1. 检查Next.js运行在哪个端口
lsof -i :3000
lsof -i :3001

# 2. 如果在3001端口，修改package.json
# "dev": "next dev -p 3001"  # 改为
# "dev": "next dev"          # 默认3000端口

# 3. 或者更新API调用的端口
# 在脚本中使用正确的端口号
```

#### 方案4：验证LLM连接

```bash
# 测试LLM连接
npm run summary:test

# 应该看到：
# ✅ LLM连接成功
# Model: qwen3-max-2026-01-23
# Response time: 1234ms
```

---

## 🔍 问题2：环境变量在定时任务中不生效

### 症状
- 手动运行脚本正常
- 定时任务运行失败，提示缺少环境变量

### 根本原因
Cron任务运行在受限的环境中，不会自动加载 shell 配置文件（如 `.bashrc`, `.zshrc`）

### 解决方案

#### 方案1：在定时任务中显式设置环境变量

```bash
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "export OPENAI_API_KEY='your-key' && export OPENAI_BASE_URL='your-url' && cd /path/to/project && npm run agent:knowledge" \
  --delivery none
```

#### 方案2：使用环境变量文件

```bash
# 1. 创建 .env 文件
cat > .env << EOF
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENCLAW_SESSIONS_PATH=/home/admin/.openclaw/agents/main/sessions
EOF

# 2. 在脚本中加载
# 在 run-knowledge-sync.js 开头添加：
require('dotenv').config();

# 3. 安装 dotenv
npm install dotenv
```

#### 方案3：使用系统级环境变量

```bash
# 添加到 /etc/environment (需要root权限)
sudo bash -c 'cat >> /etc/environment << EOF
OPENAI_API_KEY="your-key"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
EOF'

# 重新登录后生效
```

---

## 🔍 问题3：脚本找不到项目路径

### 症状
- 定时任务报错：`cd: no such file or directory`
- 手动运行正常，定时任务失败

### 根本原因
- 使用了相对路径
- 工作目录不正确

### 解决方案

#### 使用绝对路径

```bash
# ❌ 错误 - 相对路径
cd openclaw-second-brain && npm run agent:knowledge

# ✅ 正确 - 绝对路径
cd /home/admin/openclaw/workspace/openclaw-second-brain && npm run agent:knowledge

# 或者使用自动查找
PROJECT_PATH=$(find ~ -type d -name "openclaw-second-brain" 2>/dev/null | head -1)
cd "$PROJECT_PATH" && npm run agent:knowledge
```

---

## 🔍 问题4：TypeScript导入错误

### 症状
```
Error: Cannot find module './types'
Error: Cannot find module './config.js'
```

### 根本原因
- TypeScript导入路径配置不一致
- 混用了 `.js` 扩展名和无扩展名

### 解决方案

#### 统一导入格式

```typescript
// ✅ 正确 - TypeScript文件不带扩展名
import { Config } from './config';
import { LLMClient } from './llm-client';

// ❌ 错误 - 不要加 .js 扩展名
import { Config } from './config.js';
```

---

## 🔍 问题5：模块系统冲突

### 症状
```
ReferenceError: require is not defined
SyntaxError: Cannot use import statement outside a module
```

### 根本原因
- ES模块和CommonJS混用
- `package.json` 中的 `"type": "module"` 配置

### 解决方案

#### 统一使用CommonJS

```json
// package.json - 不要添加 "type": "module"
{
  "name": "second-brain",
  "scripts": {
    "dev": "next dev"
  }
}
```

```javascript
// 脚本文件使用 CommonJS
const path = require('path');
module.exports = { ... };

// 不要使用
import path from 'path';
export { ... };
```

---

## 🔍 问题6：Next.js构建缓存问题

### 症状
- 修改了配置文件，但系统仍使用旧配置
- 看到旧的模型名称（如 `qwen-plus`）

### 根本原因
- `.next` 目录缓存了旧的构建结果

### 解决方案

```bash
# 清理缓存并重新构建
rm -rf .next
npm run build

# 或者只清理缓存
rm -rf .next
npm run dev
```

---

## 🔍 问题7：对话文件读取失败

### 症状
- 系统报告"找到0个对话"
- 明明有对话文件但无法读取

### 根本原因
- 对话文件路径配置错误
- 文件格式解析错误
- 锁文件干扰

### 解决方案

#### 检查路径配置

```bash
# 1. 确认对话文件位置
ls ~/.openclaw/agents/main/sessions/*.jsonl

# 2. 设置正确的路径
export OPENCLAW_SESSIONS_PATH="$HOME/.openclaw/agents/main/sessions"

# 3. 验证路径
node -e "console.log(require('fs').readdirSync(process.env.OPENCLAW_SESSIONS_PATH || '$HOME/.openclaw/agents/main/sessions'))"
```

#### 检查文件格式

```bash
# 查看文件内容
head -5 ~/.openclaw/agents/main/sessions/*.jsonl

# 应该看到类似：
# {"type":"session","id":"xxx",...}
# {"type":"message","message":{"role":"user",...}}
```

---

## 📋 完整的诊断清单

运行以下命令进行完整诊断：

```bash
#!/bin/bash
echo "🔍 Second Brain 系统诊断"
echo "========================"

# 1. 环境变量
echo -e "\n1️⃣ 环境变量检查："
[ -n "$OPENAI_API_KEY" ] && echo "✅ OPENAI_API_KEY: 已设置" || echo "❌ OPENAI_API_KEY: 未设置"
[ -n "$OPENAI_BASE_URL" ] && echo "✅ OPENAI_BASE_URL: $OPENAI_BASE_URL" || echo "❌ OPENAI_BASE_URL: 未设置"

# 2. 项目路径
echo -e "\n2️⃣ 项目路径检查："
if [ -d "lib/summary" ]; then
  echo "✅ 当前在项目根目录"
  echo "   模块数量: $(ls lib/summary/*.ts 2>/dev/null | wc -l)"
else
  echo "❌ 不在项目根目录"
fi

# 3. 对话文件
echo -e "\n3️⃣ 对话文件检查："
SESSIONS_PATH="${OPENCLAW_SESSIONS_PATH:-$HOME/.openclaw/agents/main/sessions}"
if [ -d "$SESSIONS_PATH" ]; then
  JSONL_COUNT=$(ls "$SESSIONS_PATH"/*.jsonl 2>/dev/null | grep -v ".lock" | wc -l)
  echo "✅ 对话目录存在: $SESSIONS_PATH"
  echo "   会话文件数: $JSONL_COUNT"
else
  echo "❌ 对话目录不存在: $SESSIONS_PATH"
fi

# 4. 依赖检查
echo -e "\n4️⃣ 依赖检查："
[ -d "node_modules" ] && echo "✅ node_modules 存在" || echo "❌ 需要运行 npm install"

# 5. 端口检查
echo -e "\n5️⃣ 端口检查："
lsof -i :3000 >/dev/null 2>&1 && echo "⚠️  端口3000已被占用" || echo "✅ 端口3000可用"

# 6. 配置文件
echo -e "\n6️⃣ 配置文件检查："
[ -f "summary-config.json" ] && echo "✅ summary-config.json 存在" || echo "❌ summary-config.json 缺失"

echo -e "\n========================"
echo "诊断完成！"
```

保存为 `diagnose.sh` 并运行：
```bash
chmod +x diagnose.sh
./diagnose.sh
```

---

## 🎯 推荐的完整设置流程

```bash
# 1. 克隆项目
git clone https://github.com/chenkai66/openclaw-second-brain.git
cd openclaw-second-brain

# 2. 安装依赖
npm install

# 3. 设置环境变量（永久）
cat >> ~/.bashrc << EOF
export OPENAI_API_KEY="your-key-here"
export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
export OPENCLAW_SESSIONS_PATH="$HOME/.openclaw/agents/main/sessions"
EOF
source ~/.bashrc

# 4. 验证配置
npm run summary:test

# 5. 初始化系统
npm run summary:init

# 6. 运行完整pipeline
npm run summary:pipeline

# 7. 启动Web界面
npm run dev

# 8. 设置定时任务（可选）
# 参考 README.md 中的"自动化部署"章节
```

---

## 💡 最佳实践

1. **始终使用绝对路径** - 特别是在定时任务中
2. **显式设置环境变量** - 不要依赖shell配置
3. **使用完整pipeline** - 而不是单独的脚本
4. **定期清理缓存** - `rm -rf .next` 解决很多问题
5. **查看详细日志** - 脚本会输出详细的执行信息
6. **测试LLM连接** - 在运行主流程前先测试
7. **检查文件权限** - 确保脚本有执行权限
8. **使用诊断脚本** - 快速定位问题

---

## 📞 获取帮助

如果问题仍未解决：

1. 运行诊断脚本并保存输出
2. 查看详细日志：`npm run agent:knowledge 2>&1 | tee debug.log`
3. 检查 `data/summaries/summary-metadata.json` 中的错误记录
4. 提交Issue时附上诊断信息和日志

