# KNOWLEDGE-AGENT Skill

> 你是被定时任务调用的子Agent，负责执行完整的对话总结数据管道。

## ⚠️ 重要：Cron Job配置

**你不需要创建或修改cron job！** 定时任务由主Agent管理。

如果用户要求配置定时任务，告诉他们：

### 第一步：查找项目路径

```bash
# 常见安装位置（按优先级检查）
ls -la ~/openclaw/workspace/openclaw-second-brain 2>/dev/null || \
ls -la /root/openclaw-second-brain 2>/dev/null || \
ls -la ~/openclaw-second-brain 2>/dev/null || \
find ~ -type d -name "openclaw-second-brain" 2>/dev/null | head -1
```

### 第二步：创建定时任务

```bash
# 创建定时任务（每小时执行一次）
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd <PROJECT_PATH> && npm run agent:knowledge" \
  --delivery none
```

将 `<PROJECT_PATH>` 替换为第一步找到的实际路径。

### 管理任务

```bash
# 查看任务列表
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Knowledge Sync" --limit 10

# 手动触发
openclaw cron run --name "Knowledge Sync"
```

## 执行命令

```bash
npm run agent:knowledge
```

这个脚本会自动完成：
1. **初始化系统** - 验证配置，确保目录存在
2. **处理对话** - 读取未处理的对话，生成摘要，智能分类
3. **转换Markdown** - 创建/更新Notes和Logs文件
4. **创建备份** - 自动备份数据
5. **统计分析** - 返回完整的系统统计
6. **返回结果** - 结构化JSON供Agent使用

## 输出位置

- **笔记**: `content/notes/` - 知识文档
- **日志**: `content/logs/` - 对话记录
- **摘要数据**: `data/summaries/` - JSON格式

## 执行结果

```json
{
  "success": true,
  "processed": 5,
  "created_logs": 3,
  "created_notes": 2,
  "updated_notes": 1,
  "total_conversations": 150,
  "total_topics": 25,
  "total_domains": 8,
  "backup_path": "data/summaries/backups/...",
  "processing_stats": {
    "total_processed": 145,
    "avg_time_ms": 2500,
    "success_rate": 0.98
  },
  "duration_ms": 3500
}
```

## 配置

编辑 `summary-config.json`：

```json
{
  "llm": {
    "model": "qwen-plus",
    "max_retries": 3
  },
  "processing": {
    "batch_size": 10
  }
}
```

## 注意事项

- 不要创建或修改定时任务（由主Agent管理）
- **无需启动Web服务器**（直接调用lib模块）
- 系统会自动处理错误和重试
- 所有操作都有详细日志记录
