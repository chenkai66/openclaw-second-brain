#!/bin/bash

# Second Brain - 知识同步脚本
# 通过 API 调用触发知识同步

set -e

# 项目目录
PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
cd "$PROJECT_DIR"

# 日志文件
LOG_FILE="$PROJECT_DIR/agent-logs/knowledge-sync-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$PROJECT_DIR/agent-logs"

echo "🧠 Knowledge Sync Started at $(date)" | tee -a "$LOG_FILE"

# 检查 Next.js 服务器是否运行
if ! curl -s http://localhost:3000/api/summary/stats > /dev/null 2>&1; then
    echo "❌ Next.js 服务器未运行，请先启动: npm run dev" | tee -a "$LOG_FILE"
    exit 1
fi

# 触发对话处理
echo "📊 Processing conversations..." | tee -a "$LOG_FILE"
RESULT=$(curl -s -X POST http://localhost:3000/api/summary/process \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESULT" | jq . | tee -a "$LOG_FILE"

# 检查结果
SUCCESS=$(echo "$RESULT" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    PROCESSED=$(echo "$RESULT" | jq -r '.processed_count')
    NEW_CONVERSATIONS=$(echo "$RESULT" | jq -r '.new_conversations')
    echo "✅ Success: Processed $PROCESSED conversations, $NEW_CONVERSATIONS new" | tee -a "$LOG_FILE"

    # 如果有新对话，触发转换
    if [ "$NEW_CONVERSATIONS" -gt 0 ]; then
        echo "📝 Converting to Markdown..." | tee -a "$LOG_FILE"
        CONVERT_RESULT=$(curl -s -X POST http://localhost:3000/api/summary/convert \
          -H "Content-Type: application/json" \
          -d '{}')
        echo "$CONVERT_RESULT" | jq . | tee -a "$LOG_FILE"
    fi
else
    echo "❌ Failed to process conversations" | tee -a "$LOG_FILE"
    exit 1
fi

echo "🎉 Knowledge Sync Completed at $(date)" | tee -a "$LOG_FILE"
