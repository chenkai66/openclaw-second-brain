# KNOWLEDGE-AGENT Skill Document

> **重要提示**：你是被定时任务调用的子 Agent。你的唯一职责是调用对话总结系统API。
> 
> **禁止操作**：不要创建、修改或管理任何定时任务（cron jobs）。定时任务由主 Agent 管理。

## Agent 职责
KNOWLEDGE-AGENT 负责调用对话总结系统API，自动处理新对话并生成多阶段摘要。

## 执行说明
- 你会被定时任务每小时调用一次
- 每次执行时，调用 `/api/summary/process` API
- 系统会自动处理所有未处理的对话

## 工作流程

### 简单执行步骤

```bash
# 调用API处理新对话
curl -X POST http://localhost:3000/api/summary/process \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10}'
```

### API响应示例

```json
{
  "success": true,
  "processed_count": 5,
  "new_conversations": 5,
  "updated_topics": 2,
  "updated_domains": 1,
  "errors": [],
  "duration_ms": 15000
}
```

## 系统功能

对话总结系统会自动完成以下工作：

### 1. 自动摘要生成
- 调用大模型为每个对话生成摘要
- 提取关键词（英文）
- 分析情感倾向

### 2. 智能聚类
- 计算对话相似度
- 自动分配到相关主题
- 创建新主题（如果需要）
- 聚合主题到领域

### 3. 多阶段摘要
```
Domain (领域)
  ├── Topic (主题)
  │   ├── Conversation (对话)
  │   ├── Conversation
  │   └── Conversation
  └── Topic
      └── ...
```

### 4. 试错机制
- 自动重试（最多3次）
- 指数退避策略
- 降级处理（简化提示词）
- 详细错误日志

### 5. 时间戳管理
- 增量处理（只处理新对话）
- 断点续传
- 处理历史记录

## 中间产物存储

系统自动将处理结果保存到：

```
data/summaries/
├── summaries.json          # 树形摘要结构
├── summary-index.json      # 快速检索索引
├── summary-metadata.json   # 元数据和统计
└── backups/                # 自动备份
```

## 执行日志

查看处理统计：

```bash
curl http://localhost:3000/api/summary/stats
```

## 配置说明

编辑 `summary-config.json` 调整系统行为：

```json
{
  "llm": {
    "model": "qwen-plus",
    "max_retries": 3
  },
  "processing": {
    "batch_size": 10,
    "max_concurrent": 3
  },
  "clustering": {
    "similarity_threshold": 0.7
  }
}
```

---

**注意**：旧的手动处理流程已被对话总结系统取代。现在只需调用API即可自动完成所有工作。
- 对话是完整的问题解决过程
- 包含用户提问和 AI 详细回答
- 有实用的代码示例或解决方案

操作：
1. 生成 Log 文件名：YYYY-MM-DD-HH-mm-ss.md
2. 创建结构化内容：
   ---
   date: YYYY-MM-DD-HH-mm-ss
   type: daily-log
   summary: 简短英文摘要（~15 words）
   topics: [tag1, tag2, tag3]
   ai_generated: true
   ---
   
   # YYYY-MM-DD HH:mm - 对话主题
   
   ## 对话记录
   
   ### 用户提问
   [原始问题]
   
   ### AI 回答
   [详细回答，包含代码示例]
   
   ### 用户追问
   [后续问题]
   
   ### AI 深入讲解
   [更详细的解释]
   
   ## 关键收获
   1. 要点1
   2. 要点2
   
   ## 下一步计划
   - [ ] 行动项1
   - [ ] 行动项2
```

#### 策略 C：创建新 Note
```
条件：
- 对话涉及新的技术主题
- 内容足够深入和完整
- 可以独立成为一篇知识文档

操作：
1. 生成 Note 文件名：YYYY-MM-DD-主题-slug.md
2. 从对话中提取结构化内容
3. 组织成教程或参考文档格式
4. 添加代码示例和最佳实践
```

### 5. 特殊场景处理

#### 场景 1：项目相关问题（如 Second Brain）
```
识别标志：
- 对话中提到项目名称
- 讨论项目的 bug、功能、架构

处理流程：
1. 查找项目相关的主 Note（如 "second-brain-system-guide.md"）
2. 判断问题类型：
   - Bug 修复 → 添加到 "常见问题" 或 "FAQ" 章节
   - 功能实现 → 添加到 "功能说明" 章节
   - 架构优化 → 添加到 "架构设计" 章节
3. 如果没有对应章节，创建新章节
4. 保持文档的整体结构和可读性
```

#### 场景 2：重复主题的深化
```
识别标志：
- 标签完全匹配或高度重叠
- 讨论同一技术的不同方面

处理流程：
1. 读取现有相关文档
2. 分析新对话的独特价值
3. 如果是补充内容：
   - 追加到现有章节
   - 添加 "补充说明" 或 "高级技巧" 小节
4. 如果是新角度：
   - 创建新的二级标题
   - 交叉引用相关内容
```

#### 场景 3：快速问答
```
识别标志：
- 对话简短（< 500 字）
- 单一问题和答案
- 没有深入讨论

处理流程：
1. 查找最近的相关 Log
2. 如果找到（时间 < 24 小时，主题相关）：
   - 追加到该 Log 的 "补充问答" 章节
3. 如果没找到：
   - 创建新的简短 Log
```

### 6. 内容质量控制
```
A. 格式规范
   - 统一使用 Markdown 格式
   - 代码块必须指定语言
   - 标题层级正确（# ## ### ####）
   - frontmatter 格式正确

B. 内容完整性
   - 代码示例可运行
   - 解释清晰易懂
   - 包含关键收获总结
   - 有实际应用价值

C. 标签规范
   - 使用小写
   - 使用连字符分隔（如 "react-hooks"）
   - 避免重复标签
   - 标签数量 3-7 个
```

### 7. 更新同步状态
```
处理完成后：
1. 更新 .sync-state.json
   {
     "lastSyncTimestamp": "2026-02-13T22:00:00Z",
     "lastProcessedConversationId": "conv_12346",
     "processedCount": 3,
     "createdNotes": 1,
     "createdLogs": 2,
     "updatedNotes": 1
   }

2. 生成同步报告（可选）
   - 处理了多少对话
   - 创建/更新了哪些文档
   - 发现的新主题
```

## 示例：处理 Second Brain 项目问题

### 输入：用户对话
```
用户：我的 Second Brain 项目在部署时遇到样式加载失败的问题
AI：这是因为缺少 PostCSS 配置...
[详细解决过程]
```

### 处理流程
```
1. 识别关键词："Second Brain"、"部署"、"样式"
2. 查找相关文档：
   - 找到 "2026-02-13-second-brain-system-guide.md"
3. 分析内容类型：问题解决
4. 决定更新策略：添加到 FAQ 章节
5. 执行更新：
   
   在 Note 中添加：
   
   ## 常见问题 FAQ
   
   ### 部署时样式加载失败
   
   **问题描述：**
   部署后发现页面样式没有加载，图标很大，没有任何样式。
   
   **原因分析：**
   缺少 PostCSS 配置文件和 Tailwind Typography 插件。
   
   **解决方案：**
   ```bash
   # 1. 安装依赖
   npm install @tailwindcss/typography
   
   # 2. 创建 postcss.config.js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   
   # 3. 更新 tailwind.config.ts
   plugins: [require('@tailwindcss/typography')]
   ```
   
   **相关链接：**
   - [Tailwind CSS 文档](https://tailwindcss.com)
   
6. 更新 frontmatter：
   - updated: 2026-02-13
   - 添加标签：deployment, troubleshooting
```

## 错误处理
```
1. 文件读写错误
   - 记录错误日志
   - 跳过当前文件，继续处理
   - 在下次同步时重试

2. 内容解析错误
   - 保存原始对话到 .failed/ 目录
   - 记录错误原因
   - 人工审核

3. 标签匹配失败
   - 使用默认标签："general", "conversation"
   - 创建新 Log 而不是更新 Note
```

## 配置文件：knowledge-agent-config.json

**重要：对话历史源路径配置**

OpenClaw 的对话历史默认存储在 `~/.openclaw/agents/main/sessions/` 目录下。你需要在配置文件中明确指定 `conversationSource` 字段，否则 Agent 将无法找到对话记录进行同步。

```json
{
  "syncInterval": 3600,
  "contentDir": "./content",
  "notesDir": "./content/notes",
  "logsDir": "./content/logs",
  "reportsDir": "./content/reports",
  "syncStateFile": ".sync-state.json",
  "conversationSource": "/root/.openclaw/agents/main/sessions",
  "similarityThreshold": 0.6,
  "updateThreshold": 0.7,
  "maxTagsPerDocument": 7,
  "logRetentionDays": 90,
  "enableAutoMerge": true,
  "enableFAQDetection": true,
  "projectKeywords": ["second brain", "openclaw", "knowledge management"],
  "excludePatterns": ["test", "draft", "temp", ".git"]
}
```

### 关键配置字段说明：
- **`conversationSource`**: 必需字段，指定 OpenClaw 对话历史的存储路径
  - 默认路径：`/root/.openclaw/agents/main/sessions`
  - 如果 OpenClaw 运行在不同用户下，请相应调整路径
  - 路径必须包含 `.jsonl` 格式的对话历史文件

- **`syncStateFile`**: 同步状态文件，记录上次同步的时间戳和处理的对话ID
  - 首次运行时会自动创建
  - 确保 Agent 有写入权限

- **`contentDir`, `notesDir`, `logsDir`**: 输出目录配置
  - 相对于 Agent 工作目录的路径
  - 确保这些目录存在且有写入权限

## 输出示例

### 成功日志
```
[2026-02-13 22:00:00] KNOWLEDGE-AGENT: Sync started
[2026-02-13 22:00:01] Found 3 new conversations since 2026-02-13T21:30:00Z
[2026-02-13 22:00:02] Processing conversation conv_12344: "React performance optimization"
[2026-02-13 22:00:03] Found related note: 2026-02-12-react-performance-optimization.md (similarity: 0.85)
[2026-02-13 22:00:04] Updated note with new FAQ section
[2026-02-13 22:00:05] Processing conversation conv_12345: "Docker deployment issue"
[2026-02-13 22:00:06] No related content found, creating new log
[2026-02-13 22:00:07] Created log: 2026-02-13-22-00-00.md
[2026-02-13 22:00:08] Sync completed: 1 note updated, 1 log created
```

## 性能优化
```
1. 缓存策略
   - 缓存所有文档的标签和摘要
   - 只在文件修改时重新读取
   - 使用内存缓存加速标签匹配

2. 批量处理
   - 一次处理多个对话
   - 批量写入文件
   - 减少磁盘 I/O

3. 增量更新
   - 只处理新增对话
   - 跳过已处理的内容
   - 使用时间戳快速过滤
```

