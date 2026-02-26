# SOCIAL-RESEARCH Skill

> 你是被用户调用的研究助手，使用大模型智能分析需求并执行社区研究。

## 智能工作流

### 1. 分析用户需求（大模型）

当用户提出研究请求时，首先调用大模型分析：

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
  }
}
```

### 2. 执行研究（基于大模型决策）

**研究类型**：

1. **Trend Analysis（趋势分析）** - 搜索最近3个月的讨论，分析热度变化
2. **Tool Comparison（工具对比）** - 收集用户真实评价，整理优缺点
3. **Best Practices（最佳实践）** - 搜索实战经验，收集代码示例
4. **Community Opinion（社区观点）** - 搜索争议性讨论，分析共识和分歧

### 3. 智能内容整合（大模型）

将搜索结果发送给大模型进行整合：

```
输入：搜索结果（Reddit、Twitter、HN的讨论）
输出：结构化的研究报告、关键发现总结、个性化建议
```

## 使用示例

### 场景1：工具对比

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
  "focus_areas": ["功能对比", "价格", "用户体验", "代码质量"]
}
```

**生成报告**：
```markdown
# Cursor vs GitHub Copilot - 社区对比分析

## 工具概述
## 功能对比
## 社区评价
### Reddit 讨论要点
### Twitter 用户反馈
### HackerNews 技术讨论
## 使用建议
```

### 场景2：技术趋势

**用户输入**：
```
"React Server Components 现在社区接受度怎么样？"
```

**大模型分析**：
```json
{
  "research_type": "trend_analysis",
  "search_keywords": ["React Server Components", "RSC adoption", "RSC production"],
  "focus_areas": ["采用率", "实战经验", "性能提升", "学习曲线"]
}
```

### 场景3：最佳实践

**用户输入**：
```
"大型 Next.js 应用有什么架构最佳实践？"
```

**大模型分析**：
```json
{
  "research_type": "best_practices",
  "search_keywords": ["Next.js architecture", "Next.js large scale", "Next.js best practices"],
  "focus_areas": ["项目结构", "状态管理", "性能优化", "部署策略"]
}
```

## API接口

### POST /api/social-research/analyze

分析用户需求并生成研究计划

**请求**：
```json
{
  "query": "用户的研究请求",
  "context": {
    "recent_topics": ["topic1", "topic2"],
    "tech_stack": ["react", "typescript"]
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
    "time_range": "3months"
  }
}
```

**响应**：
```json
{
  "success": true,
  "report": {
    "title": "研究报告标题",
    "content": "完整的Markdown内容",
    "sources": [...],
    "key_findings": [...]
  }
}
```

## 工作流程

```
用户请求 → 大模型分析需求 → 生成研究计划 → 并行搜索 → 大模型整合 → 生成报告
```

## 配置

编辑 `social-research-config.json`：

```json
{
  "llm": {
    "model": "qwen-plus",
    "temperature": 0.3
  },
  "search": {
    "max_results_per_platform": 20,
    "time_range": "3months"
  },
  "report": {
    "min_word_count": 1500,
    "max_word_count": 4000
  }
}
```

## 优势

- ✅ 大模型理解用户真实需求
- ✅ 动态生成搜索策略
- ✅ 个性化报告结构
- ✅ 基于用户背景的建议

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
