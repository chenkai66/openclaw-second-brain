# RESEARCH-AGENT Skill Document

## Agent 职责
RESEARCH-AGENT 负责分析用户的对话记录，发现兴趣点和知识需求，主动进行互联网搜索，整理最新资讯和有价值的信息，生成 Daily Research 报告。

## 执行频率
每天执行一次（建议在晚上 23:00）

## 工作流程

### 1. 分析用户兴趣
```
A. 读取最近 7 天的对话记录
   - 从 Logs 目录读取最近的对话
   - 从 Notes 目录读取最近更新的笔记
   
B. 提取兴趣点
   - 统计高频技术关键词
   - 识别正在学习的技术栈
   - 发现未解决的问题
   - 分析技术趋势偏好

C. 兴趣点评分
   关键词权重计算：
   - 出现频率：40%
   - 最近性（越近越高）：30%
   - 深度（对话长度）：20%
   - 实践性（是否有代码）：10%
   
   示例输出：
   {
     "interests": [
       {
         "topic": "React performance optimization",
         "score": 0.85,
         "keywords": ["react", "performance", "useMemo", "useCallback"],
         "lastMentioned": "2026-02-13",
         "conversationCount": 3
       },
       {
         "topic": "Docker containerization",
         "score": 0.72,
         "keywords": ["docker", "container", "deployment"],
         "lastMentioned": "2026-02-12",
         "conversationCount": 2
       }
     ]
   }
```

### 2. 生成研究主题
```
A. 主题筛选规则
   - 评分 > 0.6 的兴趣点
   - 排除已有 Research 报告的主题（7 天内）
   - 优先选择技术前沿话题
   - 每天生成 1-2 个研究主题

B. 主题扩展
   基于核心兴趣点，扩展研究方向：
   
   示例：
   核心兴趣："React performance"
   扩展方向：
   - React 18 新特性和性能提升
   - 前端性能监控工具对比
   - 大型 React 应用架构最佳实践
   - React vs Vue vs Svelte 性能对比

C. 主题优先级
   1. 用户明确提到想深入学习的
   2. 最近频繁讨论的技术
   3. 行业热点和新技术
   4. 用户技术栈相关的进阶内容
```

### 3. 互联网信息检索
```
A. 搜索策略
   多源搜索：
   - Google/Bing 搜索最新文章
   - GitHub Trending 查看热门项目
   - Hacker News 获取技术讨论
   - Dev.to / Medium 技术博客
   - Stack Overflow 最新问答
   - Twitter 技术大V动态
   - Reddit r/programming 讨论

B. 搜索关键词构建
   主题："React performance optimization"
   
   搜索查询：
   - "React performance optimization 2026"
   - "React 18 performance best practices"
   - "React useMemo useCallback when to use"
   - "React performance monitoring tools"
   - "React large scale application architecture"

C. 内容筛选
   质量评估标准：
   - 发布时间（优先最近 3 个月）
   - 来源可信度（官方文档、知名博客）
   - 内容深度（> 1000 字）
   - 实用性（有代码示例）
   - 社区反馈（点赞、评论数）
   
   筛选流程：
   1. 获取搜索结果前 50 条
   2. 过滤低质量内容
   3. 按相关性和质量排序
   4. 选择 top 10-15 篇文章
   5. 提取核心观点和代码示例
```

### 4. 信息整合与分析
```
A. 内容聚合
   将多个来源的信息按主题聚合：
   
   主题结构：
   - 技术概述
   - 最新发展
   - 最佳实践
   - 工具和资源
   - 案例研究
   - 未来趋势

B. 去重和提炼
   - 识别重复信息
   - 提取独特观点
   - 合并相似内容
   - 保留最有价值的部分

C. 添加个人化建议
   基于用户的技术水平和项目需求：
   - 推荐学习路径
   - 建议实践项目
   - 相关资源链接
   - 与用户现有知识的关联
```

### 5. 生成 Research 报告
```
A. 报告结构
   ---
   date: YYYY-MM-DD
   type: daily-research
   title: 研究主题标题
   summary: 英文摘要（~15 words）
   tags: [tag1, tag2, tag3, tag4, tag5]
   ai_generated: true
   sources: [url1, url2, url3]
   ---
   
   # 研究主题标题
   
   ## 研究背景
   为什么研究这个主题，与用户兴趣的关联
   
   ## 核心发现
   ### 1. 发现点一
   详细说明，包含数据和案例
   
   ### 2. 发现点二
   ...
   
   ## 技术深度分析
   ### 技术原理
   ### 实现方案
   ### 性能对比
   
   ## 最佳实践
   ### 实践建议 1
   ### 实践建议 2
   
   ## 工具和资源
   - 工具1：说明
   - 工具2：说明
   
   ## 案例研究
   真实项目案例分析
   
   ## 未来趋势
   技术发展方向预测
   
   ## 推荐行动
   - [ ] 具体可执行的学习任务
   - [ ] 实践项目建议
   
   ## 参考资源
   - [标题1](url1) - 简短说明
   - [标题2](url2) - 简短说明
   
   > 一句话总结核心价值

B. 文件命名
   格式：YYYY-MM-DD-主题-slug.md
   示例：2026-02-14-react-performance-optimization-2026.md

C. 质量标准
   - 字数：2000-4000 字
   - 代码示例：3-5 个
   - 外部链接：5-10 个
   - 图表：1-3 个（可选）
   - 可读性：清晰的结构，易于理解
```

### 6. 智能推荐系统
```
A. 发现新兴趣点
   从研究过程中发现用户可能感兴趣但未讨论的话题：
   
   示例：
   用户关注 "React performance"
   发现相关话题：
   - React Server Components（新特性）
   - Remix 框架（新兴框架）
   - Islands Architecture（新架构模式）
   
   生成推荐：
   "基于你对 React 性能的关注，你可能对以下话题感兴趣：
   1. React Server Components - 减少客户端 JavaScript
   2. Remix - 全栈 React 框架，性能优先
   3. Islands Architecture - 部分水合，极致性能"

B. 知识图谱扩展
   构建技术知识图谱：
   
   React Performance
   ├── 渲染优化
   │   ├── React.memo
   │   ├── useMemo
   │   └── useCallback
   ├── 代码分割
   │   ├── React.lazy
   │   ├── 动态导入
   │   └── 路由级分割
   └── 新特性
       ├── Concurrent Mode
       ├── Suspense
       └── Server Components
   
   推荐学习路径：
   1. 已掌握：渲染优化基础
   2. 建议学习：代码分割进阶
   3. 前沿探索：Server Components

C. 个性化内容
   根据用户特征定制内容：
   - 技术水平：初级/中级/高级
   - 工作领域：前端/后端/全栈
   - 学习风格：理论/实践/案例
   - 时间投入：快速浏览/深度学习
```

### 7. 趋势分析报告
```
每周生成一次综合趋势报告：

## 本周技术趋势分析

### 你的学习轨迹
- 本周关注的主要技术：React, Docker, TypeScript
- 学习深度：中级到高级
- 实践项目：Second Brain 系统

### 行业热点对比
你的关注 vs 行业热点：
- ✅ React 性能优化 - 行业热点，持续关注
- ✅ Docker 容器化 - 主流技术，实用性强
- ⚠️ AI/LLM 应用 - 行业爆发，建议关注
- ⚠️ Web3/区块链 - 新兴领域，可选学习

### 技能缺口分析
基于你的技术栈，建议补充：
1. 测试：单元测试、E2E 测试
2. 性能监控：Lighthouse, Web Vitals
3. CI/CD：GitHub Actions, Docker 部署

### 推荐学习计划
下周建议：
- 深入：React Server Components
- 补充：Jest 单元测试
- 探索：AI 辅助开发工具
```

## 示例：完整执行流程

### 输入：用户最近对话
```
- 2026-02-13: React 性能优化讨论（3次）
- 2026-02-12: Docker 部署问题
- 2026-02-11: TypeScript 高级类型
- 2026-02-10: CSS Grid 布局
```

### 分析结果
```json
{
  "topInterests": [
    {
      "topic": "React Performance",
      "score": 0.88,
      "reason": "频繁讨论，有实践需求"
    },
    {
      "topic": "TypeScript Advanced",
      "score": 0.75,
      "reason": "深度学习，多次追问"
    }
  ],
  "suggestedResearch": [
    "React 18 性能优化最佳实践 2026",
    "TypeScript 4.9+ 新特性深度解析"
  ]
}
```

### 搜索执行
```
主题：React 18 性能优化最佳实践 2026

搜索查询：
1. "React 18 performance optimization 2026"
2. "React concurrent features best practices"
3. "React Server Components production ready"

找到优质资源：
- React 官方博客：React 18 性能提升详解
- Vercel 博客：生产环境 React 性能优化
- Kent C. Dodds：React 性能优化完整指南
- GitHub：awesome-react-performance
```

### 生成报告
```markdown
---
date: 2026-02-14
type: daily-research
title: React 18 性能优化最佳实践 2026
summary: Comprehensive guide to React 18 performance optimization with concurrent features and best practices
tags: [react, performance, react-18, concurrent-mode, optimization]
ai_generated: true
sources: [
  "https://react.dev/blog/2022/03/29/react-v18",
  "https://vercel.com/blog/react-18-performance"
]
---

# React 18 性能优化最佳实践 2026

## 研究背景
基于你最近对 React 性能优化的深入学习，本报告整理了 React 18 的最新性能优化技术和最佳实践...

[详细内容]
```

## 配置文件：research-agent-config.json
```json
{
  "executionTime": "23:00",
  "analysisWindow": 7,
  "minInterestScore": 0.6,
  "maxDailyReports": 2,
  "searchSources": [
    "google",
    "github",
    "hackernews",
    "devto",
    "medium"
  ],
  "contentQuality": {
    "minWordCount": 2000,
    "maxWordCount": 5000,
    "minCodeExamples": 3,
    "minReferences": 5
  },
  "personalization": {
    "userLevel": "intermediate",
    "focusAreas": ["frontend", "fullstack"],
    "learningStyle": "practical"
  }
}
```

## 输出示例

### 执行日志
```
[2026-02-14 23:00:00] RESEARCH-AGENT: Daily research started
[2026-02-14 23:00:01] Analyzing conversations from 2026-02-07 to 2026-02-13
[2026-02-14 23:00:02] Found 15 conversations, 8 notes, 12 logs
[2026-02-14 23:00:03] Extracted interests: React (0.88), TypeScript (0.75), Docker (0.68)
[2026-02-14 23:00:04] Selected research topic: "React 18 Performance Optimization"
[2026-02-14 23:00:05] Searching Google: "React 18 performance 2026"
[2026-02-14 23:00:08] Found 47 results, filtering...
[2026-02-14 23:00:10] Selected 12 high-quality articles
[2026-02-14 23:00:15] Searching GitHub Trending: react performance
[2026-02-14 23:00:18] Found 5 relevant repositories
[2026-02-14 23:00:20] Aggregating content...
[2026-02-14 23:00:35] Generated report: 3,245 words, 5 code examples
[2026-02-14 23:00:36] Saved: 2026-02-14-react-18-performance-optimization.md
[2026-02-14 23:00:37] Research completed successfully
```

## 错误处理
```
1. 搜索失败
   - 重试 3 次
   - 切换搜索源
   - 降级到缓存内容

2. 内容质量不足
   - 扩大搜索范围
   - 降低质量阈值
   - 生成简短报告

3. 无明确兴趣点
   - 使用行业热点
   - 推荐通用技术文章
   - 生成技术周报
```

