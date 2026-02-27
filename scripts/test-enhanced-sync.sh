#!/bin/bash

# 测试增强版知识同步系统
# 验证 Claude Code 对话自动处理功能

set -e

PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
cd "$PROJECT_DIR"

echo "🧪 Testing Enhanced Knowledge Sync System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Claude Code 会话目录
echo "📁 Checking Claude Code sessions directory..."
CLAUDE_SESSIONS="$HOME/.claude/projects"

if [ -d "$CLAUDE_SESSIONS" ]; then
    echo "✅ Found: $CLAUDE_SESSIONS"

    # 统计会话文件
    SESSION_COUNT=$(find "$CLAUDE_SESSIONS" -name "*.jsonl" -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "📊 Total Claude Code session files: $SESSION_COUNT"

    # 显示最近的会话
    echo ""
    echo "📝 Recent Claude Code sessions:"
    find "$CLAUDE_SESSIONS" -name "*.jsonl" -type f -exec stat -f "%Sm %N" -t "%Y-%m-%d %H:%M" {} \; 2>/dev/null | sort -r | head -5 | while read line; do
        echo "   $line"
    done
else
    echo "⚠️  Claude Code sessions directory not found"
    echo "   Path: $CLAUDE_SESSIONS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 OpenClaw 会话目录
echo "📁 Checking OpenClaw sessions directory..."
OPENCLAW_SESSIONS="$HOME/.openclaw/agents/main/sessions"

if [ -d "$OPENCLAW_SESSIONS" ]; then
    echo "✅ Found: $OPENCLAW_SESSIONS"

    # 统计会话文件
    SESSION_COUNT=$(find "$OPENCLAW_SESSIONS" -name "*.jsonl" -type f ! -name "*.lock" 2>/dev/null | wc -l | tr -d ' ')
    echo "📊 Total OpenClaw session files: $SESSION_COUNT"
else
    echo "⚠️  OpenClaw sessions directory not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查处理记录
echo "📋 Checking processed sessions tracking..."
PROCESSED_FILE="$HOME/.openclaw/workspace/memory/processed-claude-code-sessions.json"

if [ -f "$PROCESSED_FILE" ]; then
    PROCESSED_COUNT=$(cat "$PROCESSED_FILE" | jq '. | length' 2>/dev/null || echo "0")
    echo "✅ Found tracking file"
    echo "📊 Processed Claude Code sessions: $PROCESSED_COUNT"
else
    echo "ℹ️  No tracking file yet (will be created on first run)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 运行增强版知识同步
echo "🚀 Running enhanced knowledge sync..."
echo ""

npm run agent:knowledge:enhanced

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 验证结果
echo "✅ Verifying results..."
echo ""

# 检查生成的内容
NOTES_COUNT=$(find content/notes -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
LOGS_COUNT=$(find content/logs -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Generated content:"
echo "   - Notes: $NOTES_COUNT files"
echo "   - Logs: $LOGS_COUNT files"

# 检查最新的笔记
if [ "$NOTES_COUNT" -gt 0 ]; then
    echo ""
    echo "📝 Latest notes:"
    ls -lt content/notes/*.md 2>/dev/null | head -3 | awk '{print "   -", $9}'
fi

# 检查最新的日志
if [ "$LOGS_COUNT" -gt 0 ]; then
    echo ""
    echo "📋 Latest logs:"
    ls -lt content/logs/*.md 2>/dev/null | head -3 | awk '{print "   -", $9}'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test completed!"
echo ""
echo "🌐 View results:"
echo "   open http://localhost:3000"
echo ""
