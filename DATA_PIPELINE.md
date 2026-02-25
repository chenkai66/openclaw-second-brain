# 对话总结系统 - 完整数据管道

## 系统架构

```
对话历史 (.jsonl)
    ↓
API处理 (/api/summary/process)
    ↓
摘要数据 (data/summaries/*.json)
    ↓
Markdown转换 (/api/summary/convert)
    ↓
前端展示 (content/notes/*.md, content/logs/*.md)
```

## 快速开始

### 1. 初始化系统

```bash
npm run summary:init
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 执行完整数据管道

```bash
npm run summary:pipeline
```

这个命令会自动完成：
- 读取对话历史
- 调用大模型生成摘要
- 智能聚类和分类
- 转换为Markdown文件
- 更新同步状态

## 手动执行步骤

如果需要分步执行：

### 步骤1: 处理对话，生成摘要

```bash
npm run summary:process
```

或使用curl：

```bash
curl -X POST http://localhost:3000/api/summary/process \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10}'
```

### 步骤2: 转换摘要为Markdown

```bash
npm run summary:convert
```

或使用curl：

```bash
curl -X POST http://localhost:3000/api/summary/convert
```

### 步骤3: 查看统计信息

```bash
npm run summary:stats
```

## API接口

### 1. 处理对话
- **端点**: `POST /api/summary/process`
- **功能**: 读取对话历史，生成摘要，智能聚类
- **输入**: `{ batch_size: 10 }`
- **输出**: 处理统计信息

### 2. 转换Markdown
- **端点**: `POST /api/summary/convert`
- **功能**: 将JSON摘要转换为Markdown文件
- **输出**: 创建的日志和笔记数量

### 3. 搜索摘要
- **端点**: `POST /api/summary/search`
- **功能**: 搜索对话摘要
- **输入**: `{ query: "关键词", search_type: "hybrid" }`

### 4. 获取摘要树
- **端点**: `GET /api/summary/tree`
- **功能**: 获取完整的摘要树结构

### 5. 统计信息
- **端点**: `GET /api/summary/stats`
- **功能**: 获取系统统计信息

### 6. 智能推荐
- **端点**: `POST /api/summary/recommend`
- **功能**: 基于关键词推荐相关对话

### 7. 触发聚类
- **端点**: `POST /api/summary/cluster`
- **功能**: 手动触发聚类分析

### 8. 重建索引
- **端点**: `POST /api/summary/rebuild-index`
- **功能**: 重建搜索索引

## 数据流说明

### 输入数据
- **位置**: `~/.openclaw/agents/main/sessions/`
- **格式**: `.jsonl` 文件
- **结构**: 每行一个对话JSON对象

### 中间数据
- **位置**: `data/summaries/`
- **文件**:
  - `summaries.json` - 树形摘要结构
  - `summary-index.json` - 搜索索引
  - `summary-metadata.json` - 元数据统计

### 输出数据

#### 日志文件 (content/logs/)
- **格式**: `YYYY-MM-DD-HH-mm-ss.md`
- **内容**: 单个对话的详细记录
- **Frontmatter**:
  ```yaml
  date: 2026-02-25-14-17-20
  type: daily-log
  summary: "对话摘要"
  topics: ["关键词1", "关键词2"]
  domain: "领域名称"
  topic: "主题名称"
  sentiment: "positive/neutral/negative"
  ai_generated: true
  ```

#### 笔记文件 (content/notes/)
- **格式**: `YYYY-MM-DD-主题名称.md`
- **内容**: 多个相关对话的知识整合
- **条件**: 主题至少包含3个对话
- **Frontmatter**:
  ```yaml
  title: "主题名称"
  created: 2026-02-25
  updated: 2026-02-25
  tags: ["标签1", "标签2"]
  domain: "领域名称"
  summary: "主题摘要"
  conversation_count: 5
  ai_refined: true
  ```

## 配置文件

编辑 `summary-config.json` 自定义系统行为：

```json
{
  "llm": {
    "api_key": "your-api-key",
    "model": "qwen-plus",
    "max_retries": 3,
    "timeout": 30000
  },
  "processing": {
    "batch_size": 10,
    "max_concurrent": 3
  },
  "clustering": {
    "similarity_threshold": 0.7,
    "min_conversations_per_topic": 3
  },
  "markdown": {
    "min_conversations_for_note": 3
  }
}
```

## 同步状态

系统维护 `.sync-state.json` 记录同步状态：

```json
{
  "lastSyncTimestamp": "2026-02-25T14:17:20.946Z",
  "lastProcessedConversationId": "conv_12345",
  "processedCount": 10,
  "createdNotes": 2,
  "createdLogs": 8,
  "updatedNotes": 1
}
```

## 定时任务

可以设置cron任务自动执行数据管道：

```bash
# 每小时执行一次
0 * * * * cd /path/to/project && npm run summary:pipeline >> /var/log/summary-pipeline.log 2>&1
```

## 故障排查

### 问题1: 服务器未运行
```bash
# 检查服务器状态
curl http://localhost:3000/api/summary/stats

# 如果失败，启动服务器
npm run dev
```

### 问题2: 没有对话数据
```bash
# 检查对话历史目录
ls -la ~/.openclaw/agents/main/sessions/

# 确认配置文件中的路径正确
cat summary-config.json | grep conversationSource
```

### 问题3: API调用失败
```bash
# 查看详细错误
curl -v -X POST http://localhost:3000/api/summary/process

# 检查日志
tail -f .next/server.log
```

### 问题4: Markdown文件未生成
```bash
# 确认摘要数据存在
cat data/summaries/summaries.json

# 手动触发转换
npm run summary:convert

# 检查输出目录权限
ls -la content/notes/ content/logs/
```

## 最佳实践

1. **首次使用**: 先运行 `npm run summary:init` 初始化系统
2. **定期执行**: 设置定时任务每小时执行一次数据管道
3. **监控日志**: 定期检查处理日志和错误信息
4. **备份数据**: 系统会自动备份，但建议定期手动备份
5. **调整配置**: 根据实际使用情况调整批处理大小和聚类阈值

## 性能优化

- **批处理大小**: 默认10个对话，可根据服务器性能调整
- **并发数**: 默认3个并发请求，避免API限流
- **相似度阈值**: 默认0.7，调高会创建更多主题，调低会合并更多对话
- **最小对话数**: 默认3个对话才生成Note，避免碎片化

## 技术栈

- **后端**: Next.js API Routes
- **存储**: JSON文件系统
- **大模型**: 阿里云百炼 (qwen-plus)
- **聚类**: TF-IDF + 余弦相似度
- **格式**: Markdown + YAML Frontmatter

