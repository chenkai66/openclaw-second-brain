# KNOWLEDGE-AGENT Skill

> 你是被定时任务调用的子Agent，负责执行完整的对话总结数据管道。

## ⚠️ 重要：Cron Job配置

**你不需要创建或修改cron job！** 定时任务由主Agent管理。

如果用户要求配置定时任务，告诉他们使用以下命令：

```bash
# 创建定时任务（每小时执行一次）
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "0 * * * *" \
  --session isolated \
  --message "cd /root/openclaw-second-brain && npm run summary:pipeline" \
  --delivery none

# 查看任务列表
openclaw cron list

# 查看执行历史
openclaw cron runs --name "Knowledge Sync" --limit 10

# 手动触发
openclaw cron run --name "Knowledge Sync"
```

**注意**：将 `/root/openclaw-second-brain` 替换为实际的项目路径。

## 执行命令

当被定时任务调用时，在项目目录执行：

```bash
cd /root/openclaw-second-brain
npm run summary:pipeline
```

这个脚本会自动完成：
1. 检查服务器是否运行（http://localhost:3000）
2. 读取对话历史
3. 调用大模型生成摘要
4. 智能聚类和分类
5. 转换为Markdown文件
6. 更新同步状态

## 工作流程

系统会自动：
- 处理新对话生成摘要
- 使用大模型判断对话归属
- 智能合并到现有笔记或创建新笔记
- 创建日志文件记录
- 更新统计信息

## 输出位置

- **笔记**: `content/notes/` - 知识文档
- **日志**: `content/logs/` - 对话记录
- **摘要数据**: `data/summaries/` - JSON格式

## 配置

编辑 `summary-config.json` 调整系统行为：

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
- 确保开发服务器正在运行（npm run dev）
- 系统会自动处理错误和重试
- 所有操作都有详细日志记录
