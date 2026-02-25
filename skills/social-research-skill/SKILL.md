# SOCIAL-RESEARCH Skill

> 你是被用户调用的研究助手，使用大模型智能分析需求并执行社区研究。

## 智能工作流

### 1. 分析用户需求（大模型）

当用户提出研究请求时，首先调用大模型分析：

```bash
# 使用对话总结系统获取上下文
curl -X POST http://localhost:3000/api/summary/search \
  -H "Content-Type: application/json" \
  -d '{"query": "用户最近讨论的主题", "search_type": "hybrid", "limit": 10}'
```

**大模型分析任务**：
```
输入：
- 用户的研究请求
- 最近的对话历史（从summary系统获取）
- 用户的技术栈和兴趣点

输出JSON：
{
  "research_type": "trend_analysis" | "tool_comparison" | "best_practices" | "community_opinion",
  "search_keywords": ["keyword1", "keyword2", "keyword3"],
  "platforms": ["reddit", "twitter", "hackernews"],
  "focus_areas": ["技术实现", "用户体验", "性能对比"],
  "report_structure": {
    "sections": ["概述", "社区讨论", "关键发现", "推荐"],
    "depth": "detailed" | "summary"
  },
  "reason": "为什么选择这个研究方向"
}
```

### 2. 执行研究（基于大模型决策）

根据大模型的分析结果执行搜索：

**研究类型**：

1. **Trend Analysis（趋势分析）**
   - 搜索最近3个月的讨论
   - 分析热度变化趋势
   - 识别新兴话题

2. **Tool Comparison（工具对比）**
   - 搜索工具对比讨论
   - 收集用户真实评价
   - 整理优缺点对比表

3. **Best Practices（最佳实践）**
   - 搜索实战经验分享
   - 收集代码示例
   - 整理避坑指南

4. **Community Opinion（社区观点）**
   - 搜索争议性讨论
   - 收集不同观点
   - 分析共识和分歧

### 3. 智能内容整合（大模型）

将搜索结果发送给大模型进行整合：

```
输入：
- 搜索结果（Reddit、Twitter、HN的讨论）
- 研究类型和焦点
- 用户的技术背景

输出：
- 结构化的研究报告
- 关键发现总结
- 个性化建议
```

## 使用示例

### 场景1：用户想了解某个工具

**用户输入**：
```
"帮我研究一下 Cursor 和 GitHub Copilot 的对比，看看社区怎么说"
```

**大模型分析**：
```json
{
  "research_type": "tool_comparison",
  "search_keywords": ["Cursor vs Copilot", "Cursor review", "Copilot alternative"],
  "platforms": ["reddit", "twitter", "hackernews"],
  "focus_areas": ["功能对比", "价格", "用户体验", "代码质量"],
  "report_structure": {
    "sections": ["工具概述", "功能对比", "社区评价", "使用建议"],
    "depth": "detailed"
  }
}
```

**执行搜索**：
- Reddit: r/programming, r/vscode
- Twitter: #Cursor #Copilot
- HackerNews: "Cursor" OR "Copilot"

**生成报告**：
```markdown
# Cursor vs GitHub Copilot - 社区对比分析

## 工具概述
[大模型整合的概述]

## 功能对比
| 功能 | Cursor | Copilot |
|------|--------|---------|
| ... | ... | ... |

## 社区评价

### Reddit 讨论要点
- 正面评价：...
- 负面评价：...

### Twitter 用户反馈
- 高频提及：...

### HackerNews 技术讨论
- 技术深度：...

## 使用建议
基于你的技术栈（React, TypeScript），推荐...
```

### 场景2：用户想了解技术趋势

**用户输入**：
```
"React Server Components 现在社区接受度怎么样？"
```

**大模型分析**：
```json
{
  "research_type": "trend_analysis",
  "search_keywords": ["React Server Components", "RSC adoption", "RSC production"],
  "platforms": ["reddit", "twitter", "hackernews"],
  "focus_areas": ["采用率", "实战经验", "性能提升", "学习曲线"],
  "report_structure": {
    "sections": ["技术概述", "采用趋势", "实战案例", "社区观点", "建议"],
    "depth": "detailed"
  }
}
```

### 场景3：用户想学习最佳实践

**用户输入**：
```
"大型 Next.js 应用有什么架构最佳实践？"
```

**大模型分析**：
```json
{
  "research_type": "best_practices",
  "search_keywords": ["Next.js architecture", "Next.js large scale", "Next.js best practices"],
  "platforms": ["reddit", "twitter", "hackernews"],
  "focus_areas": ["项目结构", "状态管理", "性能优化", "部署策略"],
  "report_structure": {
    "sections": ["架构模式", "实战经验", "常见问题", "推荐方案"],
    "depth": "detailed"
  }
}
```

## API接口设计

### POST /api/social-research/analyze

分析用户需求并生成研究计划

**请求**：
```json
{
  "query": "用户的研究请求",
  "context": {
    "recent_topics": ["topic1", "topic2"],
    "tech_stack": ["react", "typescript"],
    "user_level": "intermediate"
  }
}
```

**响应**：
```json
{
  "success": true,
  "research_plan": {
    "research_type": "tool_comparison",
    "search_keywords": [...],
    "platforms": [...],
    "focus_areas": [...],
    "estimated_time": "5-10分钟"
  }
}
```

### POST /api/social-research/execute

执行研究并生成报告

**请求**：
```json
{
  "research_plan": { ... },
  "options": {
    "max_results": 50,
    "time_range": "3months",
    "include_code": true
  }
}
```

**响应**：
```json
{
  "success": true,
  "report": {
    "title": "研究报告标题",
    "summary": "核心发现摘要",
    "content": "完整的Markdown内容",
    "sources": [...],
    "key_findings": [...]
  }
}
```

## 工作流程图

```
用户请求
    ↓
大模型分析需求
    ↓
生成研究计划
    ↓
并行搜索（Reddit + Twitter + HN）
    ↓
大模型整合内容
    ↓
生成个性化报告
    ↓
保存到 content/reports/
```

## 配置

编辑 `social-research-config.json`：

```json
{
  "llm": {
    "model": "qwen-plus",
    "temperature": 0.3,
    "max_tokens": 2000
  },
  "search": {
    "max_results_per_platform": 20,
    "time_range": "3months",
    "min_quality_score": 0.6
  },
  "report": {
    "min_word_count": 1500,
    "max_word_count": 4000,
    "include_code_examples": true,
    "include_statistics": true
  }
}
```

## 优势

**vs 传统方式**：
- ❌ 固定的搜索关键词
- ❌ 统一的报告结构
- ❌ 无法理解用户意图

**智能工作流**：
- ✅ 大模型理解用户真实需求
- ✅ 动态生成搜索策略
- ✅ 个性化报告结构
- ✅ 基于用户背景的建议
- ✅ 减轻Agent工作负担

## 使用方法

```bash
# 方式1：通过API
curl -X POST http://localhost:3000/api/social-research/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Cursor vs Copilot 对比"}'

# 方式2：在对话中直接请求
"帮我研究一下 [主题]"
```

## 注意事项

- 大模型会自动获取用户的技术背景（从summary系统）
- 搜索结果会根据质量评分过滤
- 报告会根据用户技术水平调整深度
- 所有报告保存到 `content/reports/social-research/`
