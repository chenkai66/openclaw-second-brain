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

### 脚本做什么（自动完成）

1. **获取热门主题**
   - 调用 `summaryRetriever.getTopTopics(10)`
   - 过滤最近7天的主题
   - 按讨论热度排序

2. **获取热门关键词**
   - 调用 `summaryRetriever.getTopKeywords(20)`
   - 统计关键词出现频率

3. **获取统计信息**
   - 总对话数、主题数、领域数
   - 返回结构化JSON数据

### Agent应该做什么（手动完成）

1. **分析数据**
   - 查看 `top_topics` 选择研究方向
   - 查看 `top_keywords` 了解兴趣点
   - 结合用户最近的对话上下文

2. **互联网搜索**
   - 使用搜索工具查找相关资料
   - 来源：Google、GitHub、Hacker News、Dev.to
   - 筛选高质量内容（最近3个月）

3. **生成研究报告**
   - 整合搜索结果
   - 字数：2000-4000字
   - 代码示例：3-5个
   - 保存到：`content/reports/YYYY-MM-DD-主题.md`

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

脚本执行后会返回JSON格式的数据：

```json
{
  "success": true,
  "data": {
    "top_topics": [
      {
        "id": "topic-123",
        "name": "React Performance",
        "domain": "Frontend Development",
        "conversation_count": 15,
        "score": 0.85,
        "updated_at": "2024-01-15T10:30:00Z",
        "keywords": ["react", "performance", "optimization", "hooks"]
      }
    ],
    "top_keywords": [
      { "keyword": "react", "count": 45 },
      { "keyword": "typescript", "count": 38 }
    ],
    "domains": [
      { "id": "domain-1", "name": "Frontend Development", "topic_count": 12 }
    ],
    "statistics": {
      "total_conversations": 150,
      "total_topics": 25,
      "total_domains": 8
    }
  },
  "duration_ms": 2500
}
```

**Agent应该使用这些数据**：
1. **分析用户兴趣** - 查看 `top_topics` 和 `top_keywords`
2. **选择研究主题** - 根据热度和相关性选择
3. **使用搜索工具** - 调用互联网搜索（Google、GitHub、HN等）
4. **生成研究报告** - 整合搜索结果，保存到 `content/reports/`

**Agent不应该做的**：
- ❌ 不要自己生成报告（脚本不生成报告）
- ❌ 不要使用lib的search功能做互联网搜索（那是内部搜索）
- ✅ 应该使用外部搜索工具获取最新资料

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

- ✅ 脚本只提供数据，不生成报告
- ✅ Agent需要自己做互联网搜索
- ✅ Agent需要自己生成和保存报告
- ✅ 无需启动Web服务器（直接调用lib模块）
- ✅ 优先选择讨论最多的主题
- ✅ 排除已有报告的主题（7天内）
- ✅ 每天生成1个研究报告
