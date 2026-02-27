#!/bin/bash

# Second Brain - 系统启动脚本
# 确保 Next.js 服务器和所有依赖服务正常运行

set -e

PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
cd "$PROJECT_DIR"

echo "🚀 Starting Second Brain System..."

# 检查 OpenClaw Gateway
echo "📡 Checking OpenClaw Gateway..."
if openclaw health > /dev/null 2>&1; then
    echo "✅ OpenClaw Gateway is running"
else
    echo "⚠️  OpenClaw Gateway not running, attempting to start..."
    openclaw gateway &
    sleep 3
fi

# 检查 Next.js 服务器
echo "🌐 Checking Next.js server..."
if curl -s http://localhost:3000/api/summary/stats > /dev/null 2>&1; then
    echo "✅ Next.js server is already running"
else
    echo "🔧 Starting Next.js server..."
    npm run dev > ~/.openclaw/logs/nextjs-dev.log 2>&1 &
    echo "⏳ Waiting for server to start..."
    sleep 10

    # 验证启动
    if curl -s http://localhost:3000/api/summary/stats > /dev/null 2>&1; then
        echo "✅ Next.js server started successfully"
    else
        echo "❌ Failed to start Next.js server"
        exit 1
    fi
fi

# 显示状态
echo ""
echo "📊 System Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# OpenClaw 状态
openclaw health | head -3

# API 状态
STATS=$(curl -s http://localhost:3000/api/summary/stats)
CONVERSATIONS=$(echo "$STATS" | jq -r '.total_conversations')
TOPICS=$(echo "$STATS" | jq -r '.total_topics')
DOMAINS=$(echo "$STATS" | jq -r '.total_domains')

echo ""
echo "📈 Second Brain Stats:"
echo "   - Conversations: $CONVERSATIONS"
echo "   - Topics: $TOPICS"
echo "   - Domains: $DOMAINS"

# Cron 任务
echo ""
echo "⏰ Scheduled Tasks:"
openclaw cron list | tail -n +2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Second Brain System is ready!"
echo ""
echo "🌐 Dashboard: http://localhost:3000"
echo "🦞 OpenClaw Dashboard: http://127.0.0.1:18789"
echo ""
echo "📝 Quick Commands:"
echo "   - View logs: tail -f ~/.openclaw/logs/nextjs-dev.log"
echo "   - Manual sync: /Users/kchen/Desktop/Project/openclaw/openclaw-second-brain/scripts/knowledge-sync.sh"
echo "   - Check cron: openclaw cron list"
