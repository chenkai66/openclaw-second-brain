#!/bin/bash

# 同步 Claude Code 对话到 Second Brain
# 用于将当前 Claude Code 会话导入到知识库

set -e

CLAUDE_CODE_SESSIONS="$HOME/.claude/projects"
OPENCLAW_SESSIONS="$HOME/.openclaw/agents/main/sessions"
PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"

echo "🔄 Claude Code → Second Brain 同步"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 查找最近的 Claude Code 会话
LATEST_SESSION=$(find "$CLAUDE_CODE_SESSIONS" -name "*.jsonl" -type f -exec stat -f "%m %N" {} \; | sort -rn | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_SESSION" ]; then
    echo "❌ 未找到 Claude Code 会话文件"
    exit 1
fi

echo "📝 找到最近的会话:"
echo "   $LATEST_SESSION"
echo ""

# 复制到 OpenClaw 会话目录
SESSION_NAME="claude-code-$(date +%Y%m%d-%H%M%S).jsonl"
cp "$LATEST_SESSION" "$OPENCLAW_SESSIONS/$SESSION_NAME"

echo "✅ 已复制到 OpenClaw 会话目录"
echo "   $OPENCLAW_SESSIONS/$SESSION_NAME"
echo ""

# 触发知识同步
echo "🤖 触发知识同步..."
cd "$PROJECT_DIR"
npm run agent:knowledge > /dev/null 2>&1 || echo "⚠️  需要手动运行知识同步"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 同步完成！"
echo ""
echo "📊 查看结果:"
echo "   open http://localhost:3000"
echo ""
