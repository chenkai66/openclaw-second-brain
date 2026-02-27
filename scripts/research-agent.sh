#!/bin/bash

# Second Brain - 研究生成脚本
# 基于对话历史生成研究报告

set -e

# 项目目录
PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
cd "$PROJECT_DIR"

# 日志文件
LOG_FILE="$PROJECT_DIR/agent-logs/research-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$PROJECT_DIR/agent-logs"

echo "🔬 Research Agent Started at $(date)" | tee -a "$LOG_FILE"

# 检查 Next.js 服务器是否运行
if ! curl -s http://localhost:3000/api/summary/stats > /dev/null 2>&1; then
    echo "❌ Next.js 服务器未运行，请先启动: npm run dev" | tee -a "$LOG_FILE"
    exit 1
fi

# 获取系统统计
echo "📊 Getting system stats..." | tee -a "$LOG_FILE"
STATS=$(curl -s http://localhost:3000/api/summary/stats)
echo "$STATS" | jq . | tee -a "$LOG_FILE"

TOTAL_CONVERSATIONS=$(echo "$STATS" | jq -r '.total_conversations')
TOTAL_TOPICS=$(echo "$STATS" | jq -r '.total_topics')

echo "📈 Current status:" | tee -a "$LOG_FILE"
echo "   - Total conversations: $TOTAL_CONVERSATIONS" | tee -a "$LOG_FILE"
echo "   - Total topics: $TOTAL_TOPICS" | tee -a "$LOG_FILE"

if [ "$TOTAL_TOPICS" -eq 0 ]; then
    echo "ℹ️  No topics found, skipping research generation" | tee -a "$LOG_FILE"
    exit 0
fi

# TODO: 实际的研究生成逻辑
# 这里可以调用研究 Agent 的 API 或脚本

echo "✅ Research Agent Completed at $(date)" | tee -a "$LOG_FILE"
