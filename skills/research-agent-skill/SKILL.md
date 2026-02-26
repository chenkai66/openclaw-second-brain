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
```

将 `<PROJECT_PATH>` 替换为实际的项目路径。

## 执行命令

```bash
npm run agent:research
```

## 工作流程

### 脚本做什么（自动完成）

1. **获取热门主题** - 调用 `summaryRetriever.getTopTopics(10)`，过滤最近7天
2. **获取热门关键词** - 调用 `summaryRetriever.getTopKeywords(20)`
3. **获取统计信息** - 总对话数、主题数、领域数
4. **返回结构化数据** - JSON格式供Agent使用

### Agent应该做什么（手动完成）

1. **分析数据** - 查看 `top_topics` 和 `top_keywords`，选择研究方向
2. **互联网搜索** - 使用搜索工具查找资料（Google、GitHub、HN、Dev.to）
3. **生成研究报告** - 整合搜索结果，保存到 `content/reports/YYYY-MM-DD-主题.md`

## 执行结果

```json
{
  "success": true,
  "data": {
    "top_topics": [
      {
        "name": "React Performance",
        "keywords": ["react", "performance", "optimization"],
        "conversation_count": 15,
        "score": 0.85
      }
    ],
    "top_keywords": [
      { "keyword": "react", "count": 45 }
    ],
    "statistics": {
      "total_conversations": 150,
      "total_topics": 25
    }
  }
}
```

## 报告结构

```markdown
---
date: YYYY-MM-DD
type: daily-research
title: 研究主题标题
tags: [tag1, tag2]
ai_generated: true
sources: [url1, url2]
---

# 研究主题标题

## 研究背景
## 核心发现
## 技术深度分析
## 最佳实践
## 推荐行动
## 参考资源
```

## 注意事项

- ✅ 脚本只提供数据，不生成报告
- ✅ Agent需要自己做互联网搜索
- ✅ Agent需要自己生成和保存报告
- ✅ 无需启动Web服务器（直接调用lib模块）
- ✅ 优先选择讨论最多的主题
- ✅ 每天生成1个研究报告
