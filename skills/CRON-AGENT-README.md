# CRON-AGENT-README

> **阅读对象**：主 Agent（负责创建和管理定时任务）
> 
> **重要提示**：本文件仅供主 Agent 阅读。子 Agent 执行时请直接读取各自的 SKILL.md 文件。

## 你的职责

作为主 Agent，你需要为 Second Brain 系统创建 2 个定时任务（cron jobs），让子 Agent 在隔离会话中自动执行知识管理和研究工作。

## 需要创建的定时任务

### 任务 1：Knowledge Agent（知识同步）

**执行周期**：每 5 分钟

**执行方式**：isolated（隔离会话）

**子 Agent 工作目录**：`skills/knowledge-agent-skill/`

**子 Agent 需要做的事**：
1. 读取 `skills/knowledge-agent-skill/SKILL.md` 获取工作指令
2. 读取 `skills/knowledge-agent-skill/config.json` 获取配置参数
3. 检查未同步的对话记录
4. 智能分析并更新或创建 Notes/Logs
5. 维护知识库的组织结构

**创建命令示例**：
```bash
openclaw cron add \
  --name "Knowledge Sync" \
  --cron "*/5 * * * *" \
  --session isolated \
  --message "Execute knowledge sync: read skills/knowledge-agent-skill/SKILL.md and config.json, then sync conversations to knowledge base." \
  --delivery none
```

---

### 任务 2：Research Agent（研究报告）

**执行周期**：每天 23:00（America/Los_Angeles 时区）

**执行方式**：isolated（隔离会话）

**子 Agent 工作目录**：`skills/research-agent-skill/`

**子 Agent 需要做的事**：
1. 读取 `skills/research-agent-skill/SKILL.md` 获取工作指令
2. 读取 `skills/research-agent-skill/config.json` 获取配置参数
3. 分析最近 7 天的对话，提取用户兴趣点
4. 进行多源互联网搜索
5. 生成 Daily Research 报告到 `content/reports/`

**创建命令示例**：
```bash
openclaw cron add \
  --name "Daily Research" \
  --cron "0 23 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Execute daily research: read skills/research-agent-skill/SKILL.md and config.json, then analyze interests and generate research report." \
  --delivery none
```

---

## 关键配置说明

### 为什么使用 isolated 会话？

- **隔离执行**：每个任务在独立的 `cron:<jobId>` 会话中运行，不会污染主会话历史
- **专注任务**：子 Agent 只看到自己的 SKILL.md 和任务上下文，不会被主会话干扰
- **防止误操作**：子 Agent 无法访问 CRON-AGENT-README.md，不会创建额外的定时任务

### 为什么使用 delivery none？

- **后台任务**：这些是自动化的后台工作，不需要主动通知用户
- **减少噪音**：避免每次执行都发送消息到主会话
- **结果可查**：生成的 Notes/Logs/Reports 会保存到文件系统，用户可以随时查看

---

## 验证和管理

### 查看已创建的任务
```bash
openclaw cron list
```

### 手动触发任务（测试用）
```bash
# 强制运行（不管是否到期）
openclaw cron run <job-id>

# 只在到期时运行
openclaw cron run <job-id> --due
```

### 查看任务执行历史
```bash
openclaw cron runs --id <job-id> --limit 10
```

### 编辑任务
```bash
# 修改执行时间
openclaw cron edit <job-id> --cron "*/10 * * * *"

# 禁用任务
openclaw cron edit <job-id> --enabled false

# 启用任务
openclaw cron edit <job-id> --enabled true
```

### 删除任务
```bash
openclaw cron remove <job-id>
```

---

## 重要说明

### 1. 子 Agent 的工作范围

当定时任务触发时，子 Agent 会在隔离会话中：
- ✅ 读取指定的 `SKILL.md` 文件（获取工作指令）
- ✅ 读取对应的 `config.json` 文件（获取配置参数）
- ✅ 执行自己的职责（同步知识或生成报告）
- ✅ 将结果写入文件系统（Notes/Logs/Reports）
- ❌ **不会**读取 `CRON-AGENT-README.md`（避免误创建其他定时任务）
- ❌ **不会**创建新的定时任务（只有主 Agent 才能做）
- ❌ **不会**污染主会话的对话历史

### 2. 配置文件的作用

每个子 Agent 的 `config.json` 包含：
- 执行参数（阈值、时间窗口等）
- 数据源配置
- 质量标准
- 个性化设置

子 Agent 会读取这些配置来调整自己的行为。

### 3. 日志和监控

OpenClaw 自动管理任务执行历史：
- 存储位置：`~/.openclaw/cron/runs/<jobId>.jsonl`
- 自动清理：旧记录会被自动清理
- 查看方式：使用 `openclaw cron runs --id <job-id>` 命令

---

## 故障排查

### 问题 1：任务没有执行
- 检查 OpenClaw Gateway 是否正在运行
- 使用 `openclaw cron list` 查看任务状态（enabled 应为 true）
- 使用 `openclaw cron runs --id <job-id>` 查看执行历史和错误信息

### 问题 2：任务执行失败
- 查看执行历史：`openclaw cron runs --id <job-id>`
- 检查 SKILL.md 文件路径是否正确
- 检查工作目录的读写权限
- 手动运行测试：`openclaw cron run <job-id>`

### 问题 3：子 Agent 创建了额外的定时任务
- 这不应该发生！子 Agent 在隔离会话中运行，只读取自己的 SKILL.md
- 如果发生，检查 SKILL.md 是否包含创建 cron 的指令
- 确保子 Agent 没有读取 CRON-AGENT-README.md

---

## 总结

作为主 Agent，你的任务很简单：

1. ✅ 创建 2 个 isolated 定时任务
   - Knowledge Agent：每 5 分钟，delivery none
   - Research Agent：每天 23:00，delivery none
2. ✅ 在 message 中明确指示子 Agent 读取对应的 SKILL.md 和 config.json
3. ✅ 验证任务创建成功（`openclaw cron list`）

之后，子 Agent 会在隔离会话中自动按照各自的 SKILL.md 执行工作，你无需干预。

**记住**：
- 子 Agent 在隔离会话中运行，不会看到这个文件
- 子 Agent 只看到你在 `--message` 中指定的指令和他们自己的 SKILL.md
- 使用 `delivery none` 避免后台任务产生噪音
