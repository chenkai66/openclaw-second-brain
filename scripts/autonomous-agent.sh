#!/bin/bash

# 自主项目开发 Agent - 启动脚本
# 让 OpenClaw 自主工作，开发一个能赚钱的项目

set -e

PROJECT_DIR="/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain"
MEMORY_DIR="$HOME/.openclaw/workspace/memory"
LOG_DIR="$PROJECT_DIR/agent-logs"

echo "🤖 Autonomous Project Development Agent Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 加载记忆上下文
echo "📚 Loading Memory Context..."

CONTEXT=$(cat <<'EOF'
# 上下文信息

## 用户偏好
$(cat $MEMORY_DIR/user-preferences.md)

## 历史决策
$(cat $MEMORY_DIR/decision-history.md | head -100)

## 知识库
$(cat $MEMORY_DIR/knowledge-base.md | head -200)

## 当前会话总结
$(cat $MEMORY_DIR/current-session.md | head -100)

## Second Brain 统计
$(curl -s http://localhost:3000/api/summary/stats)
EOF
)

# 2. 构建任务提示
TASK_PROMPT=$(cat <<'TASKEOF'
你是一个自主的 AI Agent，现在要完成一个完整的项目开发任务。

【记忆上下文】
$CONTEXT

【核心任务】
设计并开发一个能够产生收入的项目。你有一整天的时间（8小时）。

【要求】
1. 基于用户偏好选择合适的技术栈
2. 从过去的决策历史中学习
3. 应用知识库中的最佳实践
4. 形成多角色讨论来优化决策
5. 完成项目的完整交付

【工作流程】
Phase 1 (1小时): 需求分析和可行性研究
- 分析市场需求
- 评估技术可行性
- 确定项目方向
- 输出: 项目提案文档

Phase 2 (2小时): 规划和设计
- 架构设计
- 技术选型
- 详细计划
- 输出: 设计文档和实施计划

Phase 3 (4小时): 开发实施
- 核心功能开发
- 测试验证
- 文档编写
- 输出: 可运行的项目代码

Phase 4 (1小时): 总结和优化
- 项目复盘
- 经验总结
- 改进建议
- 输出: 总结报告

【多角色讨论】
在每个关键决策点，你需要模拟以下角色进行讨论：

1. Planning Agent (规划者)
   - 提出方案和计划
   - 分析可行性
   - 估算资源和时间

2. Discussion Agent (讨论者)
   - 提出质疑和问题
   - 评估风险
   - 建议替代方案

3. Execution Agent (执行者)
   - 关注实施细节
   - 评估技术难度
   - 确保可落地

4. Review Agent (审核者)
   - 评估质量
   - 把关标准
   - 提供反馈

【输出要求】
所有输出保存到: $PROJECT_DIR/autonomous-project/

包括：
- proposal.md (项目提案)
- architecture.md (架构设计)
- plan.md (实施计划)
- discussions/ (讨论记录)
- src/ (源代码)
- docs/ (文档)
- summary.md (总结报告)

【成功标准】
1. 项目有明确的价值主张
2. 有清晰的变现路径
3. 代码可运行
4. 文档完整
5. 可以实际部署

现在开始Phase 1: 需求分析和可行性研究。

请首先进行多角色讨论，确定要开发什么项目。

Planning Agent，请你先发言，提出3个项目想法。
TASKEOF
)

# 3. 创建输出目录
mkdir -p "$PROJECT_DIR/autonomous-project"/{discussions,src,docs}

# 4. 启动 OpenClaw Agent
echo "🚀 Starting OpenClaw Agent..."
echo ""
echo "任务: 自主项目开发"
echo "预计时间: 8 小时"
echo "输出目录: $PROJECT_DIR/autonomous-project/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 使用 OpenClaw Agent
openclaw agent \
  --message "$TASK_PROMPT" \
  --session-id autonomous-dev-$(date +%Y%m%d) \
  --thinking high \
  --timeout 28800 \
  --json > "$LOG_DIR/autonomous-agent-$(date +%Y%m%d-%H%M%S).json"

echo ""
echo "✅ Agent execution completed!"
echo "📁 Output saved to: $PROJECT_DIR/autonomous-project/"
echo "📝 Log saved to: $LOG_DIR/"
