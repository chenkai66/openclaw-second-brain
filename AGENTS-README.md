# Second Brain - Agent 自动化系统

## 系统架构

本项目包含两个智能 Agent，负责自动化知识管理和研究：

### 1. KNOWLEDGE-AGENT（知识管理 Agent）
**职责**：自动同步和整理对话记录，转化为结构化知识库

**执行频率**：每 5 分钟

**核心功能**：
- 检测未同步的对话记录
- 智能分析对话内容和主题
- 查找相关已有文档（标签匹配、语义搜索）
- 自动更新或创建 Notes/Logs
- 特殊处理项目相关问题（如 Second Brain FAQ）

**详细文档**：[KNOWLEDGE-AGENT-SKILL.md](./KNOWLEDGE-AGENT-SKILL.md)

### 2. RESEARCH-AGENT（研究 Agent）
**职责**：分析用户兴趣，主动搜索最新资讯，生成研究报告

**执行频率**：每天 23:00

**核心功能**：
- 分析最近 7 天的对话，提取兴趣点
- 生成研究主题并评分
- 多源互联网搜索（Google、GitHub、HN 等）
- 整合信息并生成 Daily Research 报告
- 个性化推荐和趋势分析

**详细文档**：[RESEARCH-AGENT-SKILL.md](./RESEARCH-AGENT-SKILL.md)

## 目录结构

```
openclaw-second-brain/
├── content/
│   ├── notes/          # 知识笔记（结构化技术文档）
│   ├── logs/           # 对话日志（详细的问答记录）
│   └── reports/        # 研究报告（Daily Research）
├── KNOWLEDGE-AGENT-SKILL.md    # Knowledge Agent 技能文档
├── RESEARCH-AGENT-SKILL.md     # Research Agent 技能文档
├── knowledge-agent-config.json # Knowledge Agent 配置
├── research-agent-config.json  # Research Agent 配置
└── .sync-state.json            # 同步状态文件
```

## 配置文件说明

### knowledge-agent-config.json
```json
{
  "syncInterval": 300,              // 同步间隔（秒）
  "similarityThreshold": 0.6,       // 标签相似度阈值
  "updateThreshold": 0.7,           // 更新文档的相似度阈值
  "enableAutoMerge": true,          // 启用自动合并
  "enableFAQDetection": true,       // 启用 FAQ 检测
  "projectKeywords": [...]          // 项目关键词
}
```

### research-agent-config.json
```json
{
  "executionTime": "23:00",         // 执行时间
  "analysisWindow": 7,              // 分析窗口（天）
  "minInterestScore": 0.6,          // 最小兴趣分数
  "maxDailyReports": 2,             // 每天最多生成报告数
  "searchSources": [...]            // 搜索源配置
}
```

### .sync-state.json
记录同步状态和统计信息：
- 最后同步时间戳
- 已处理的对话 ID
- 内容索引（Notes/Logs 的标签和元数据）
- 统计数据

## 工作流程示例

### Knowledge Agent 工作流程

```
1. 定时触发（每 5 分钟）
   ↓
2. 读取 .sync-state.json，获取 lastSyncTimestamp
   ↓
3. 获取新对话（时间戳 > lastSyncTimestamp）
   ↓
4. 对每个对话：
   a. 提取主题、标签、代码示例
   b. 查找相关文档（标签匹配 + 语义搜索）
   c. 判断：更新现有文档 or 创建新文档
   d. 执行操作
   ↓
5. 更新 .sync-state.json
   ↓
6. 生成同步报告
```

### Research Agent 工作流程

```
1. 定时触发（每天 23:00）
   ↓
2. 读取最近 7 天的 Logs 和 Notes
   ↓
3. 分析兴趣点：
   - 统计关键词频率
   - 计算兴趣分数
   - 排序并筛选
   ↓
4. 生成研究主题（1-2 个）
   ↓
5. 多源搜索：
   - Google 搜索
   - GitHub Trending
   - Hacker News
   - Dev.to / Medium
   ↓
6. 内容整合：
   - 提取核心观点
   - 去重和提炼
   - 添加代码示例
   ↓
7. 生成 Research 报告
   ↓
8. 保存到 content/reports/
```

## 特殊场景处理

### 场景 1：Second Brain 项目问题
```
用户：Second Brain 部署时样式加载失败

Knowledge Agent 处理：
1. 识别关键词："Second Brain"、"部署"、"样式"
2. 查找文档：second-brain-system-guide.md
3. 判断类型：问题解决 → FAQ
4. 操作：在 FAQ 章节添加问题和解决方案
5. 更新标签：添加 "deployment", "troubleshooting"
```

### 场景 2：深度技术讨论
```
用户：详细讨论 React 性能优化（多轮对话）

Knowledge Agent 处理：
1. 识别：深度对话，包含多个问答
2. 查找：react-performance-optimization.md（相似度 0.85）
3. 判断：内容补充 → 更新 Note
4. 操作：添加新的优化技巧章节
5. 同时创建 Log：保留完整对话记录
```

### 场景 3：新兴趣点发现
```
Research Agent 分析：
- 用户最近频繁讨论 React（5 次）
- 提到性能问题（3 次）
- 有实践需求（代码示例多）

Research Agent 行动：
1. 生成主题："React 18 性能优化最佳实践 2026"
2. 搜索最新资讯
3. 生成报告：包含最新技术、工具、案例
4. 个性化推荐：基于用户水平和项目需求
```

## 部署和运行

### 方式 1：定时任务（Cron）
```bash
# 编辑 crontab
crontab -e

# 添加定时任务
# Knowledge Agent - 每 5 分钟
*/5 * * * * cd /path/to/openclaw-second-brain && node scripts/knowledge-agent.js

# Research Agent - 每天 23:00
0 23 * * * cd /path/to/openclaw-second-brain && node scripts/research-agent.js
```

### 方式 2：Node.js 脚本
```javascript
// scripts/knowledge-agent.js
const KnowledgeAgent = require('./agents/knowledge-agent');
const config = require('../knowledge-agent-config.json');

async function run() {
  const agent = new KnowledgeAgent(config);
  await agent.sync();
}

run().catch(console.error);
```

### 方式 3：GitHub Actions
```yaml
# .github/workflows/knowledge-sync.yml
name: Knowledge Sync
on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分钟
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Knowledge Agent
        run: node scripts/knowledge-agent.js
```

## 监控和日志

### 日志格式
```
[2026-02-13 22:00:00] KNOWLEDGE-AGENT: Sync started
[2026-02-13 22:00:01] Found 3 new conversations
[2026-02-13 22:00:02] Processing: "React performance optimization"
[2026-02-13 22:00:03] Found related note (similarity: 0.85)
[2026-02-13 22:00:04] Updated note with FAQ section
[2026-02-13 22:00:05] Sync completed: 1 note updated, 1 log created
```

### 监控指标
- 同步成功率
- 平均处理时间
- 创建/更新的文档数量
- 错误率和类型
- 标签匹配准确率

## 最佳实践

1. **定期检查同步状态**
   - 查看 .sync-state.json
   - 检查是否有失败的对话

2. **调整配置参数**
   - 根据实际效果调整相似度阈值
   - 优化兴趣点评分权重

3. **人工审核**
   - 定期审核自动生成的内容
   - 修正不准确的标签和分类

4. **备份数据**
   - 定期备份 content/ 目录
   - 保存 .sync-state.json 历史

## 故障排查

### 问题 1：同步失败
```
检查：
- .sync-state.json 是否可写
- 对话 API 是否可访问
- 网络连接是否正常

解决：
- 检查文件权限
- 重试机制
- 查看错误日志
```

### 问题 2：标签匹配不准确
```
检查：
- similarityThreshold 是否过低/过高
- 标签库是否完整

解决：
- 调整阈值（建议 0.6-0.8）
- 扩充 tagCategories
- 使用语义搜索
```

### 问题 3：Research 报告质量低
```
检查：
- 搜索源是否可用
- contentQuality 配置是否合理
- 用户兴趣点是否明确

解决：
- 增加搜索源
- 提高质量阈值
- 手动指定研究主题
```

## 未来扩展

- [ ] 支持多语言内容
- [ ] 集成更多搜索源（Twitter、Reddit）
- [ ] AI 摘要和总结
- [ ] 知识图谱可视化
- [ ] 智能推荐系统
- [ ] 协作功能（多用户）

---

**注意**：这是一个智能自动化系统，需要定期监控和调整以确保最佳效果。

