#!/bin/bash

# 测试 OpenClaw 使用 Claude 模型
# 注意：需要先设置环境变量 ANTHROPIC_API_KEY 和 ANTHROPIC_BASE_URL

set -e

echo "🧪 OpenClaw Claude Model Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查环境变量
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY 环境变量未设置"
    echo "请先设置: export ANTHROPIC_API_KEY='your-api-key'"
    exit 1
fi

if [ -z "$ANTHROPIC_BASE_URL" ]; then
    echo "❌ ANTHROPIC_BASE_URL 环境变量未设置"
    echo "请先设置: export ANTHROPIC_BASE_URL='http://127.0.0.1:8080/idealab'"
    exit 1
fi

echo "✅ 环境变量已设置"

# 检查代理是否运行
if ! ps aux | grep -v grep | grep dashscope-proxy > /dev/null; then
    echo "❌ dashscope-proxy 未运行"
    echo "请先启动代理: ./dashscope-proxy"
    exit 1
fi
echo "✅ dashscope-proxy 正在运行"

# 检查模型配置
echo ""
echo "📊 当前模型配置:"
openclaw models status | grep "Default"
echo ""

# 测试 API 调用（简单测试）
echo "🔍 测试 Claude API 连接..."
RESPONSE=$(curl -s -w "\n%{http_code}" $ANTHROPIC_BASE_URL/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude_sonnet4_5",
    "max_tokens": 20,
    "messages": [{"role": "user", "content": "Say hello in Chinese"}]
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API 连接成功"
    echo "$BODY" | jq -r '.content[0].text' 2>/dev/null || echo "$BODY"
else
    echo "❌ API 连接失败 (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！OpenClaw 已成功配置 Claude 模型"
echo ""
echo "📝 使用说明:"
echo "1. 在任何 OpenClaw 会话中，现在默认使用 Claude Sonnet 4.5"
echo "2. 可以使用 /model opus 切换到 Claude Opus 4.6"
echo "3. 可以使用 /model haiku 切换到 Claude Haiku 4.5"
echo ""
echo "🚀 开始使用:"
echo "   openclaw tui"
echo ""
