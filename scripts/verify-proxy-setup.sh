#!/bin/bash

# OpenClaw + Claude Code 代理配置验证脚本

echo "🔍 验证 OpenClaw + Claude Code 代理配置"
echo "=========================================="
echo ""

# 检查代理服务
echo "1️⃣ 检查 dashscope-proxy 是否运行在端口 8080..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "   ✅ 代理服务正在运行"
    lsof -i :8080 | grep LISTEN | awk '{print "   📍 PID: " $2 " | " $1}'
else
    echo "   ❌ 代理服务未运行"
    echo "   💡 请先启动: ./dashscope-proxy"
fi
echo ""

# 检查 OpenClaw 配置
echo "2️⃣ 检查 OpenClaw auth-profiles.json 配置..."
AUTH_FILE="$HOME/.openclaw/agents/main/agent/auth-profiles.json"
if [ -f "$AUTH_FILE" ]; then
    echo "   ✅ 配置文件存在"
    BASE_URL=$(jq -r '.["anthropic:idealab"].baseURL' "$AUTH_FILE" 2>/dev/null)
    if [ "$BASE_URL" = "http://127.0.0.1:8080/idealab" ]; then
        echo "   ✅ baseURL 配置正确: $BASE_URL"
    else
        echo "   ⚠️  baseURL 配置不正确: $BASE_URL"
        echo "   💡 应该是: http://127.0.0.1:8080/idealab"
    fi
else
    echo "   ❌ 配置文件不存在: $AUTH_FILE"
fi
echo ""

# 检查 Claude Code 配置
echo "3️⃣ 检查 Claude Code settings.json 配置..."
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
if [ -f "$CLAUDE_SETTINGS" ]; then
    echo "   ✅ 配置文件存在"
    CLAUDE_BASE_URL=$(jq -r '.env.ANTHROPIC_BASE_URL' "$CLAUDE_SETTINGS" 2>/dev/null)
    if [ "$CLAUDE_BASE_URL" = "http://127.0.0.1:8080/idealab" ]; then
        echo "   ✅ ANTHROPIC_BASE_URL 配置正确: $CLAUDE_BASE_URL"
    else
        echo "   ⚠️  ANTHROPIC_BASE_URL 配置不正确: $CLAUDE_BASE_URL"
        echo "   💡 应该是: http://127.0.0.1:8080/idealab"
    fi
else
    echo "   ❌ 配置文件不存在: $CLAUDE_SETTINGS"
fi
echo ""

# 检查 .gitignore
echo "4️⃣ 检查 .gitignore 配置..."
if grep -q "test-anthropic-sdk.js" .gitignore 2>/dev/null; then
    echo "   ✅ test-anthropic-sdk.js 已忽略"
else
    echo "   ⚠️  test-anthropic-sdk.js 未在 .gitignore 中"
fi

if grep -q "start-gateway-with-env.sh" .gitignore 2>/dev/null; then
    echo "   ✅ start-gateway-with-env.sh 已忽略"
else
    echo "   ⚠️  start-gateway-with-env.sh 未在 .gitignore 中"
fi
echo ""

# 总结
echo "=========================================="
echo "📝 配置验证完成"
echo ""
echo "如果所有检查都通过 (✅)，你可以："
echo "  • 使用 Claude Code: claude"
echo "  • 使用 OpenClaw: openclaw gateway"
echo ""
echo "如果有警告 (⚠️) 或错误 (❌)，请参考："
echo "  docs/PROXY_SETUP.md"
