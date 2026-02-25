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
  --message "Execute daily research based on user interests" \
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

## 工作流程

1. **分析用户兴趣**
   - 读取最近7天的对话记录
   - 统计高频技术关键词
   - 识别正在学习的技术栈
   - 计算兴趣点评分（评分 > 0.6）

2. **使用对话总结系统**
   ```bash
   # 获取热门主题
   curl http://localhost:3000/api/summary/stats?period=week
   
   # 搜索相关对话
   curl -X POST http://localhost:3000/api/summary/search \
     -H "Content-Type: application/json" \
     -d '{"query": "React performance", "search_type": "hybrid"}'
   ```

3. **互联网信息检索**
   - 多源搜索：Google、GitHub、Hacker News、Dev.to
   - 筛选高质量内容（最近3个月、有代码示例）
   - 选择 top 10-15 篇文章

4. **生成研究报告**
   - 字数：2000-4000字
   - 代码示例：3-5个
   - 外部链接：5-10个
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
- 优先选择技术前沿话题
- 排除已有报告的主题（7天内）
- 每天生成1-2个研究主题
