#!/bin/bash

# 记忆系统更新脚本
# 从 Second Brain 提取知识更新到 OpenClaw 记忆

set -e

PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
MEMORY_DIR="$HOME/.openclaw/workspace/memory"
LOG_FILE="$PROJECT_DIR/agent-logs/memory-update-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$PROJECT_DIR/agent-logs"
mkdir -p "$MEMORY_DIR"

echo "🧠 Memory Update Started at $(date)" | tee -a "$LOG_FILE"

# 检查 Second Brain API
if ! curl -s http://localhost:3000/api/summary/stats > /dev/null 2>&1; then
    echo "❌ Second Brain API unavailable" | tee -a "$LOG_FILE"
    exit 1
fi

# 获取统计数据
STATS=$(curl -s http://localhost:3000/api/summary/stats)
TOTAL_CONVERSATIONS=$(echo "$STATS" | jq -r '.total_conversations')
TOTAL_TOPICS=$(echo "$STATS" | jq -r '.total_topics')
TOP_KEYWORDS=$(echo "$STATS" | jq -r '.top_keywords[0:5] | .[].keyword' | tr '\n' ', ' | sed 's/,$//')

echo "📊 Second Brain Stats:" | tee -a "$LOG_FILE"
echo "   - Conversations: $TOTAL_CONVERSATIONS" | tee -a "$LOG_FILE"
echo "   - Topics: $TOTAL_TOPICS" | tee -a "$LOG_FILE"
echo "   - Top Keywords: $TOP_KEYWORDS" | tee -a "$LOG_FILE"

# 更新技术知识（追加新知识）
echo "" | tee -a "$LOG_FILE"
echo "📝 Updating technical knowledge..." | tee -a "$LOG_FILE"

if [ "$TOTAL_CONVERSATIONS" -gt 0 ]; then
    cat >> "$MEMORY_DIR/technical-knowledge.md" << EOF

## 最近学习 ($(date +%Y-%m-%d))

基于最近 $TOTAL_CONVERSATIONS 个对话提取的知识:
- 讨论的主题数: $TOTAL_TOPICS
- 关键技术: $TOP_KEYWORDS

*自动更新: $(date)*

---
EOF
    echo "✅ Technical knowledge updated" | tee -a "$LOG_FILE"
else
    echo "ℹ️  No new conversations to process" | tee -a "$LOG_FILE"
fi

# 记录更新历史
echo "" | tee -a "$LOG_FILE"
echo "📈 Update Summary:" | tee -a "$LOG_FILE"
echo "   - Memory files: 3" | tee -a "$LOG_FILE"
echo "   - Last update: $(date)" | tee -a "$LOG_FILE"

# 触发重新索引（如果可用）
echo "" | tee -a "$LOG_FILE"
echo "🔄 Reindexing memory..." | tee -a "$LOG_FILE"
openclaw memory index 2>&1 || echo "⚠️  Memory indexing skipped (embedding unavailable)" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "✅ Memory Update Completed at $(date)" | tee -a "$LOG_FILE"
