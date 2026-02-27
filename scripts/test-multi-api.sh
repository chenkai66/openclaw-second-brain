#!/bin/bash

# 测试百炼 API 和 idealab Claude 多源配置

set -e

echo "🧪 OpenClaw 多 API 源测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 设置环境变量
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-http://127.0.0.1:8080/idealab}"
export BAILIAN_API_KEY="${BAILIAN_API_KEY}"
export BAILIAN_BASE_URL="${BAILIAN_BASE_URL:-https://dashscope.aliyuncs.com/compatible-mode/v1}"

# 检查环境变量
echo "📋 检查环境变量..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY 未设置"
    exit 1
fi

if [ -z "$BAILIAN_API_KEY" ]; then
    echo "❌ BAILIAN_API_KEY 未设置"
    exit 1
fi

echo "✅ Anthropic API Key: ${ANTHROPIC_API_KEY:0:10}...${ANTHROPIC_API_KEY: -6}"
echo "✅ Bailian API Key: ${BAILIAN_API_KEY:0:10}...${BAILIAN_API_KEY: -6}"
echo ""

# 测试 1: idealab Claude (通过 dashscope-proxy)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 1: idealab Claude (通过 dashscope-proxy)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! ps aux | grep -v grep | grep dashscope-proxy > /dev/null; then
    echo "⚠️  dashscope-proxy 未运行，跳过此测试"
else
    echo "✅ dashscope-proxy 正在运行"

    RESPONSE=$(curl -s -w "\n%{http_code}" $ANTHROPIC_BASE_URL/v1/messages \
      -H "Content-Type: application/json" \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -d '{
        "model": "claude_sonnet4_5",
        "max_tokens": 20,
        "messages": [{"role": "user", "content": "Say hi"}]
      }' 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ idealab Claude API 测试成功"
        echo "📝 Response: $(echo "$BODY" | jq -r '.content[0].text' 2>/dev/null || echo "$BODY")"
    else
        echo "❌ idealab Claude API 测试失败 (HTTP $HTTP_CODE)"
        echo "$BODY"
    fi
fi

echo ""

# 测试 2: 百炼 API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 2: 百炼 API (qwen-max)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" $BAILIAN_BASE_URL/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BAILIAN_API_KEY" \
  -d '{
    "model": "qwen-max",
    "messages": [{"role": "user", "content": "用中文说你好"}],
    "max_tokens": 20
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 百炼 API 测试成功"
    echo "📝 Response: $(echo "$BODY" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$BODY")"
else
    echo "❌ 百炼 API 测试失败 (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

echo ""

# 测试 3: 百炼 qwen3.5-flash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 3: 百炼 API (qwen3.5-flash)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" $BAILIAN_BASE_URL/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BAILIAN_API_KEY" \
  -d '{
    "model": "qwen3.5-flash",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 15
  }' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 百炼 qwen3.5-flash 测试成功"
    echo "📝 Response: $(echo "$BODY" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$BODY")"
else
    echo "❌ 百炼 qwen3.5-flash 测试失败 (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

echo ""

# OpenClaw 配置状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 OpenClaw 模型配置状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openclaw models status | grep -A 2 "Default"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "📝 可用的 API 源:"
echo "   1. idealab Claude (通过 dashscope-proxy)"
echo "      - Claude Sonnet 4.5 (默认)"
echo "      - Claude Opus 4.6"
echo "      - Claude Haiku 4.5"
echo ""
echo "   2. 百炼 API (阿里云)"
echo "      - qwen-max"
echo "      - qwen3.5-flash"
echo "      - qwen3.5-122b"
echo "      - 更多模型..."
echo ""
echo "🚀 使用方法:"
echo "   openclaw tui  # 使用默认 Claude Sonnet 4.5"
echo ""
