#!/bin/bash

echo "🔍 Second Brain 系统诊断"
echo "========================"

# 1. 环境变量
echo -e "\n1️⃣ 环境变量检查："
[ -n "$OPENAI_API_KEY" ] && echo "✅ OPENAI_API_KEY: 已设置" || echo "❌ OPENAI_API_KEY: 未设置"
[ -n "$OPENAI_BASE_URL" ] && echo "✅ OPENAI_BASE_URL: $OPENAI_BASE_URL" || echo "❌ OPENAI_BASE_URL: 未设置"
[ -n "$OPENCLAW_SESSIONS_PATH" ] && echo "✅ OPENCLAW_SESSIONS_PATH: $OPENCLAW_SESSIONS_PATH" || echo "⚠️  OPENCLAW_SESSIONS_PATH: 未设置（将使用默认路径）"

# 2. 项目路径
echo -e "\n2️⃣ 项目路径检查："
if [ -d "lib/summary" ]; then
  echo "✅ 当前在项目根目录"
  MODULE_COUNT=$(ls lib/summary/*.ts 2>/dev/null | wc -l | tr -d ' ')
  echo "   模块数量: $MODULE_COUNT/13"
  [ "$MODULE_COUNT" -eq 13 ] && echo "   ✅ 所有模块完整" || echo "   ⚠️  模块不完整"
else
  echo "❌ 不在项目根目录"
  echo "   请先 cd 到项目目录"
fi

# 3. 对话文件
echo -e "\n3️⃣ 对话文件检查："
SESSIONS_PATH="${OPENCLAW_SESSIONS_PATH:-$HOME/.openclaw/agents/main/sessions}"
if [ -d "$SESSIONS_PATH" ]; then
  JSONL_COUNT=$(ls "$SESSIONS_PATH"/*.jsonl 2>/dev/null | grep -v ".lock" | wc -l | tr -d ' ')
  LOCK_COUNT=$(ls "$SESSIONS_PATH"/*.jsonl.lock 2>/dev/null | wc -l | tr -d ' ')
  echo "✅ 对话目录存在: $SESSIONS_PATH"
  echo "   会话文件数: $JSONL_COUNT"
  [ "$LOCK_COUNT" -gt 0 ] && echo "   ⚠️  锁文件数: $LOCK_COUNT (有会话正在写入)"
else
  echo "❌ 对话目录不存在: $SESSIONS_PATH"
  echo "   请检查 OpenClaw 是否已安装"
fi

# 4. 依赖检查
echo -e "\n4️⃣ 依赖检查："
if [ -d "node_modules" ]; then
  echo "✅ node_modules 存在"
  [ -f "node_modules/next/package.json" ] && echo "   ✅ Next.js 已安装" || echo "   ❌ Next.js 未安装"
  [ -f "node_modules/typescript/package.json" ] && echo "   ✅ TypeScript 已安装" || echo "   ❌ TypeScript 未安装"
else
  echo "❌ node_modules 不存在"
  echo "   请运行: npm install"
fi

# 5. 端口检查
echo -e "\n5️⃣ 端口检查："
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :3000 >/dev/null 2>&1; then
    echo "⚠️  端口3000已被占用"
    lsof -i :3000 | grep LISTEN
  else
    echo "✅ 端口3000可用"
  fi
else
  echo "⚠️  lsof 命令不可用，跳过端口检查"
fi

# 6. 配置文件
echo -e "\n6️⃣ 配置文件检查："
if [ -f "summary-config.json" ]; then
  echo "✅ summary-config.json 存在"
  MODEL=$(grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' summary-config.json | cut -d'"' -f4)
  [ -n "$MODEL" ] && echo "   模型: $MODEL"
else
  echo "❌ summary-config.json 缺失"
fi

if [ -f "package.json" ]; then
  echo "✅ package.json 存在"
  HAS_TYPE_MODULE=$(grep -c '"type"[[:space:]]*:[[:space:]]*"module"' package.json)
  [ "$HAS_TYPE_MODULE" -eq 0 ] && echo "   ✅ 使用 CommonJS (正确)" || echo "   ⚠️  使用 ES Module (可能导致问题)"
else
  echo "❌ package.json 缺失"
fi

# 7. 数据目录
echo -e "\n7️⃣ 数据目录检查："
[ -d "data/summaries" ] && echo "✅ data/summaries 存在" || echo "⚠️  data/summaries 不存在（首次运行会自动创建）"
[ -d "content/notes" ] && echo "✅ content/notes 存在" || echo "⚠️  content/notes 不存在（首次运行会自动创建）"
[ -d "content/logs" ] && echo "✅ content/logs 存在" || echo "⚠️  content/logs 不存在（首次运行会自动创建）"

# 8. 构建缓存
echo -e "\n8️⃣ 构建缓存检查："
if [ -d ".next" ]; then
  CACHE_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
  echo "⚠️  .next 缓存存在 (大小: $CACHE_SIZE)"
  echo "   如果遇到配置问题，建议清理: rm -rf .next"
else
  echo "✅ 无构建缓存"
fi

# 总结
echo -e "\n========================"
echo "诊断完成！"
echo ""

# 检查关键问题
CRITICAL_ISSUES=0
[ -z "$OPENAI_API_KEY" ] && CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
[ ! -d "lib/summary" ] && CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
[ ! -d "$SESSIONS_PATH" ] && CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))

if [ $CRITICAL_ISSUES -eq 0 ]; then
  echo "✅ 系统配置正常，可以运行！"
  echo ""
  echo "建议的下一步："
  echo "  1. npm run summary:init    # 初始化系统"
  echo "  2. npm run summary:pipeline # 运行完整流程"
  echo "  3. npm run dev             # 启动Web界面"
else
  echo "❌ 发现 $CRITICAL_ISSUES 个关键问题，请先修复"
  echo ""
  echo "修复建议："
  [ -z "$OPENAI_API_KEY" ] && echo "  • 设置环境变量: export OPENAI_API_KEY='your-key'"
  [ ! -d "lib/summary" ] && echo "  • 切换到项目根目录"
  [ ! -d "$SESSIONS_PATH" ] && echo "  • 检查 OpenClaw 安装或设置 OPENCLAW_SESSIONS_PATH"
fi

echo ""
echo "详细文档: https://github.com/yourusername/openclaw-second-brain/blob/master/TROUBLESHOOTING.md"

