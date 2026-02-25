# KNOWLEDGE-AGENT Skill

> 你是被定时任务调用的子Agent，负责执行完整的对话总结数据管道。

## 执行命令

```bash
npm run summary:pipeline
```

这个命令会自动完成：
1. 读取对话历史
2. 调用大模型生成摘要
3. 智能聚类和分类
4. 转换为Markdown文件
5. 更新同步状态

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
- 系统会自动处理错误和重试
- 所有操作都有详细日志记录
