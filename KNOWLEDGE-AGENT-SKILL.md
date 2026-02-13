# KNOWLEDGE-AGENT Skill Document

## Agent 职责
KNOWLEDGE-AGENT 负责自动同步和整理用户与 AI 的对话记录，将对话转化为结构化的知识库内容（Notes 和 Logs）。

## 执行频率
每 5 分钟执行一次（可配置）

## 工作流程

### 1. 检查未同步对话
```
1. 读取同步状态文件：.sync-state.json
   {
     "lastSyncTimestamp": "2026-02-13T21:30:00Z",
     "lastProcessedConversationId": "conv_12345"
   }

2. 获取最新对话记录（从 lastSyncTimestamp 之后）
3. 如果没有新对话，退出
4. 如果有新对话，继续处理
```

### 2. 分析对话内容
```
对每个新对话执行：

A. 提取关键信息
   - 主题/话题
   - 技术栈/标签
   - 问题类型（学习、调试、架构设计等）
   - 代码示例
   - 解决方案

B. 判断内容类型
   - 深度技术讨论 → 创建/更新 Note
   - 问题解决过程 → 创建 Log
   - 快速问答 → 追加到相关 Log
```

### 3. 查找相关已有内容
```
A. 标签匹配
   - 读取所有现有 Notes 和 Logs 的标签
   - 计算标签相似度（使用 Jaccard 相似度或语义相似度）
   - 如果相似度 > 0.6，认为是相关内容

B. 主题匹配
   - 提取对话的核心主题关键词
   - 在现有内容中搜索相同主题
   - 使用语义搜索找到最相关的文档

C. 项目匹配
   - 识别对话中提到的项目名称（如 "second brain"）
   - 查找该项目相关的所有文档
   - 优先更新项目相关文档
```

### 4. 内容整合策略

#### 策略 A：更新现有 Note
```
条件：
- 找到高度相关的 Note（相似度 > 0.7）
- 对话内容是对现有知识的补充或深化

操作：
1. 读取现有 Note
2. 识别合适的插入位置
   - 如果是 FAQ 类问题 → 添加到 FAQ 章节
   - 如果是新的子主题 → 创建新的二级标题
   - 如果是补充说明 → 追加到相关段落
3. 保持原有结构和格式
4. 更新 frontmatter 的 updated 字段和 tags
```

#### 策略 B：创建新 Log
```
条件：
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
```json
{
  "syncInterval": 300,
  "contentDir": "./content",
  "notesDir": "./content/notes",
  "logsDir": "./content/logs",
  "syncStateFile": ".sync-state.json",
  "similarityThreshold": 0.6,
  "updateThreshold": 0.7,
  "maxTagsPerDocument": 7,
  "logRetentionDays": 90,
  "enableAutoMerge": true,
  "enableFAQDetection": true,
  "projectKeywords": ["second brain", "openclaw"],
  "excludePatterns": ["test", "draft", "temp"]
}
```

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

