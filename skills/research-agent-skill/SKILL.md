# RESEARCH-AGENT Skill

> 你是被定时任务调用的子Agent，负责分析用户兴趣并生成研究报告。

## ⚠️ 重要：Cron Job配置

**你不需要创建或修改cron job！** 定时任务由主Agent管理。

如果用户要求配置定时任务，告诉他们使用以下命令：

```bash
# 创建定时任务（每天23:00执行）
openclaw cron add \
  --name "Daily Research" \
  --cron "0 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "cd <PROJECT_PATH> && npm run agent:research" \
  --delivery none

# 查看任务列表
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Daily Research" --limit 10

# 手动触发
openclaw cron run --name "Daily Research"
```

## 执行时间

每天 23:00 自动执行

## 执行命令

```bash
cd <PROJECT_PATH>
npm run agent:research
```

## 工作流程

1. **分析用户兴趣**
   - 直接调用 `lib/summary` 模块
   - 读取最近7天的对话记录
   - 统计高频主题和讨论次数
   - 选择讨论最多的主题进行研究

2. **搜索相关对话**
   - 使用 `summaryRetriever.search()` 搜索相关内容
   - 提取关键信息和讨论要点
   - 分析用户的技术背景和兴趣点

3. **生成研究报告**
   - 基于对话分析生成结构化报告
   - 包含核心发现、相关对话、推荐行动
   - 保存到：`content/reports/YYYY-MM-DD-主题.md`

4. **返回执行结果**
   - 报告生成状态
   - 分析的主题数量
   - 报告文件路径

## 报告结构

```markdown
---
date: YYYY-MM-DD
type: daily-research
title: 研究主题标题
summary: 英文摘要
tags: [tag1, tag2, tag3]
ai_generated: true
sources: [url1, url2]
---

# 研究主题标题

## 研究背景
为什么研究这个主题

## 核心发现
### 1. 发现点一
### 2. 发现点二

## 技术深度分析
### 技术原理
### 实现方案

## 最佳实践
### 实践建议

## 工具和资源
- 工具列表

## 推荐行动
- [ ] 学习任务
- [ ] 实践项目

## 参考资源
- [标题](url) - 说明
```

## 执行结果

脚本执行后会返回JSON格式的结果：

```json
{
  "success": true,
  "topics_analyzed": 5,
  "selected_topic": "React Performance",
  "reports_generated": 1,
  "report_path": "content/reports/2024-01-15-react-performance.md",
  "conversation_count": 15,
  "duration_ms": 2500
}
```

**Agent可以使用这些信息**：
- 了解分析了哪些主题
- 获取生成的报告路径
- 向用户报告研究成果

## 中间产物

保存到 `.agent-workspace/research-agent/`：
- `execution-YYYY-MM-DD.log` - 执行日志
- `interest-analysis-YYYY-MM-DD.json` - 兴趣分析
- `search-results-YYYY-MM-DD.json` - 搜索结果

## 配置

编辑 `research-agent-config.json`：

```json
{
  "executionTime": "23:00",
  "analysisWindow": 7,
  "minInterestScore": 0.6,
  "maxDailyReports": 2,
  "searchSources": ["google", "github", "hackernews"],
  "contentQuality": {
    "minWordCount": 2000,
    "minCodeExamples": 3
  }
}
```

## 注意事项

- 不要创建或修改定时任务（由主Agent管理）
- **无需启动Web服务器**（直接调用lib模块）
- 优先选择讨论最多的主题
- 排除已有报告的主题（7天内）
- 每天生成1个研究报告
