# CRON-AGENT-README

> **阅读对象**：主 Agent（负责创建和管理定时任务）
> 
> **重要提示**：本文件仅供主 Agent 阅读。子 Agent 执行时请直接读取各自的 SKILL.md 文件。

## 你的职责

作为主 Agent，你需要为 Second Brain 系统完成以下完整部署流程：
1. 部署并启动 Second Brain Web 服务（端口 8000，绑定 0.0.0.0）
2. 创建 **3 个**定时任务（cron jobs），让子 Agent 在隔离会话中自动执行知识管理、研究工作和**服务监控**
3. 确保服务可通过公网 IP 访问
4. 建立完整的弹性监控和自愈机制

## 完整部署流程

### 步骤 1：构建和启动 Second Brain 服务

**常见安装路径**（按优先级顺序检查）：
- `/root/openclaw-second-brain/` （当前用户根目录）
- `/opt/openclaw/openclaw-second-brain/` （系统级安装）
- `/home/[username]/openclaw-second-brain/` （用户家目录）
- `/usr/local/openclaw-second-brain/` （本地系统目录）

**如果以上路径都找不到项目，请使用全局搜索**：
```bash
# 全局搜索 openclaw-second-brain 目录
find / -type d -name "openclaw-second-brain" 2>/dev/null

# 或者在常见位置搜索
find /root /home /opt /usr/local -type d -name "openclaw-second-brain" 2>/dev/null
```

**找到项目后，使用实际路径执行命令**：
```bash
# 进入项目目录（替换为实际找到的路径）
cd /path/to/openclaw-second-brain/

# 安装依赖（如果尚未安装）
npm install

# 构建生产版本
npm run build

# 启动服务（绑定到 0.0.0.0 以支持公网访问）
PORT=8000 HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js > /dev/null 2>&1 &
```

**服务地址**：`http://<服务器公网IP>:8000`

**ECS 用户重要提示**：
- 如果在阿里云 ECS 上运行，必须在安全组中添加入方向规则：
  - 协议类型：TCP
  - 端口范围：8000
  - 授权对象：0.0.0.0/0（或指定 IP 范围）
- 其他云服务商（AWS/Azure/GCP）也需要在安全组/防火墙中开放 8000 端口

### 步骤 2：创建三个定时任务

#### 任务 1：Service Monitor Agent（服务监控与自愈）

**执行周期**：每 20 分钟（*/20 * * * *）

**执行方式**：isolated（隔离会话）

**子 Agent 工作目录**：`[实际路径]/openclaw-second-brain/`

**子 Agent 需要做的事**：
1. 检查 OpenClaw Gateway 服务状态，确保定时任务调度器正常运行
2. 检查 Second Brain Web 服务状态（端口 8000）
3. 如果服务异常，执行完整的自愈流程：
   - 终止残留进程（包括占用端口 3000/8000 的 next-server 进程）
   - 清理可能的锁文件或临时文件
   - 使用正确的环境变量重新启动服务（PORT=8000, HOSTNAME=0.0.0.0）
   - 验证服务是否成功启动并监听端口 8000
4. 记录详细的监控日志到 `/var/log/second-brain-monitor.log`
5. 如果自愈失败超过 3 次，发送告警通知（可选）

**创建命令**（替换 `[实际路径]` 为找到的实际路径）：
```bash
openclaw cron add \
  --name "Service Monitor Every 20m" \
  --cron "*/20 * * * *" \
  --session isolated \
  --message "Execute service monitoring: check OpenClaw gateway status, then monitor Second Brain service on port 8000. If service is down, perform full recovery: kill residual processes, clean up, and restart with PORT=8000 HOSTNAME=0.0.0.0 environment variables. Log all actions to /var/log/second-brain-monitor.log." \
  --delivery none
```

---

#### 任务 2：Knowledge Agent（知识同步）

**执行周期**：每小时（0 * * * *）

**执行方式**：isolated（隔离会话）

**子 Agent 工作目录**：`[实际路径]/openclaw-second-brain/skills/knowledge-agent-skill/`

**子 Agent 需要做的事**：
1. 检查 OpenClaw Gateway 服务状态，如果未运行则启动
2. **验证 Second Brain 服务是否正常运行**（端口 8000 可访问）
3. 如果服务不可用，等待 5 分钟后重试（最多 3 次）
4. 读取 `[实际路径]/openclaw-second-brain/skills/knowledge-agent-skill/SKILL.md` 获取工作指令
5. 读取 `[实际路径]/openclaw-second-brain/skills/knowledge-agent-skill/config.json` 获取配置参数
6. 检查未同步的对话记录
7. 智能分析并更新或创建 Notes/Logs
8. 维护知识库的组织结构
9. 记录执行日志和统计信息

**创建命令**（替换 `[实际路径]` 为找到的实际路径）：
```bash
openclaw cron add \
  --name "Knowledge Sync Hourly" \
  --cron "0 * * * *" \
  --session isolated \
  --message "Execute knowledge sync: verify Second Brain service is running on port 8000, then check OpenClaw gateway status and start if needed. Read [实际路径]/openclaw-second-brain/skills/knowledge-agent-skill/SKILL.md and config.json, then sync conversations to knowledge base with proper error handling and retry logic." \
  --delivery none
```

---

#### 任务 3：Research Agent（研究报告）

**执行周期**：每天 23:00（Asia/Shanghai 时区）

**执行方式**：isolated（隔离会话）

**子 Agent 工作目录**：`[实际路径]/openclaw-second-brain/skills/research-agent-skill/`

**子 Agent 需要做的事**：
1. 检查 OpenClaw Gateway 服务状态，如果未运行则启动
2. **验证 Second Brain 服务是否正常运行**（端口 8000 可访问）
3. 如果服务不可用，等待 10 分钟后重试（最多 2 次）
4. 读取 `[实际路径]/openclaw-second-brain/skills/research-agent-skill/SKILL.md` 获取工作指令
5. 读取 `[实际路径]/openclaw-second-brain/skills/research-agent-skill/config.json` 获取配置参数
6. 分析最近 7 天的对话，提取用户兴趣点
7. 进行多源互联网搜索
8. 生成 Daily Research 报告到 `[实际路径]/openclaw-second-brain/content/reports/`
9. 如果报告生成成功，更新服务中的索引
10. 记录详细的执行日志和性能指标

**创建命令**（替换 `[实际路径]` 为找到的实际路径）：
```bash
openclaw cron add \
  --name "Daily Research Report" \
  --cron "0 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "Execute daily research: verify Second Brain service is running on port 8000, then check OpenClaw gateway status and start if needed. Read [实际路径]/openclaw-second-brain/skills/research-agent-skill/SKILL.md and config.json, then analyze interests from last 7 days and generate comprehensive research report with retry logic for service availability." \
  --delivery none
```

---

## 关键配置说明

### 为什么使用 isolated 会话？

- **隔离执行**：每个任务在独立的 `cron:<jobId>` 会话中运行，不会污染主会话历史
- **专注任务**：子 Agent 只看到自己的 SKILL.md 和任务上下文，不会被主会话干扰
- **防止误操作**：子 Agent 无法访问 CRON-AGENT-README.md，不会创建额外的定时任务
- **资源隔离**：每个任务有独立的内存和执行环境，避免相互影响

### 为什么使用 delivery none？

- **后台任务**：这些是自动化的后台工作，不需要主动通知用户
- **减少噪音**：避免每次执行都发送消息到主会话
- **结果可查**：生成的 Notes/Logs/Reports 会保存到文件系统，用户可以随时查看
- **错误处理**：严重的错误可以通过其他机制（如日志监控）来处理

### 弹性设计原则

1. **服务依赖检查**：所有子 Agent 在执行核心任务前都必须验证 Second Brain 服务可用性
2. **重试机制**：对于临时性故障（如服务短暂不可用），实现智能重试逻辑
3. **降级处理**：如果核心服务不可用，记录错误但不中断整个流程
4. **自愈能力**：Service Monitor Agent 具备完整的故障检测和恢复能力
5. **日志完整性**：所有操作都有详细日志，便于问题排查和性能分析

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
- ✅ 检查 OpenClaw Gateway 服务状态并确保其运行
- ✅ **验证 Second Brain 服务可用性**（新增的关键步骤）
- ✅ 读取指定的 `SKILL.md` 文件（获取工作指令）
- ✅ 读取对应的 `config.json` 文件（获取配置参数）
- ✅ 执行自己的职责（同步知识、生成报告或监控服务）
- ✅ 将结果写入文件系统（Notes/Logs/Reports）
- ✅ 实现适当的错误处理和重试逻辑
- ❌ **不会**读取 `CRON-AGENT-README.md`（避免误创建其他定时任务）
- ❌ **不会**创建新的定时任务（只有主 Agent 才能做）
- ❌ **不会**污染主会话的对话历史

### 2. 配置文件的作用

每个子 Agent 的 `config.json` 包含：
- 执行参数（阈值、时间窗口等）
- 数据源配置
- 质量标准
- 个性化设置
- **重试策略**（新增：最大重试次数、重试间隔等）

子 Agent 会读取这些配置来调整自己的行为。

### 3. 日志和监控

OpenClaw 自动管理任务执行历史：
- 存储位置：`~/.openclaw/cron/runs/<jobId>.jsonl`
- 自动清理：旧记录会被自动清理
- 查看方式：使用 `openclaw cron runs --id <job-id>` 命令

**服务监控日志**：
- 位置：`/var/log/second-brain-monitor.log`
- 内容：详细的服务状态检查、自愈操作、错误信息
- 轮转：建议配置 logrotate 进行日志轮转

### 4. Agent 中间产物

子 Agent 在执行过程中会产生中间产物（分析结果、决策记录、执行日志等），这些文件保存在：

```
.agent-workspace/
├── service-monitor/      # Service Monitor Agent 的中间产物
├── knowledge-agent/      # Knowledge Agent 的中间产物  
├── research-agent/       # Research Agent 的中间产物
└── social-research/      # Social Research 的中间产物
```

**重要说明**：
- ⚠️ `.agent-workspace/` 目录的内容**不会**被网页应用加载
- 这些文件仅用于观察 Agent 的行为轨迹和调试
- 已添加到 `.gitignore`，不会提交到 Git
- 可以安全删除以释放磁盘空间

**建议子 Agent 保存的内容**：
- 执行日志（每次运行的详细记录）
- 分析结果（兴趣点、标签匹配、相似度计算等）
- 决策记录（为什么做某个决策的理由）
- 搜索结果（原始数据和筛选过程）
- 内容整合（报告生成的中间步骤）
- **服务健康检查结果**（新增）

---

## 故障排查

### 问题 1：Web 服务无法通过公网 IP 访问
- **检查 1**：确认服务是否绑定到 `0.0.0.0:8000`（不是 `127.0.0.1:8000`）
- **检查 2**：如果是 ECS，确认安全组已开放 8000 端口 TCP 入方向
- **检查 3**：检查服务器防火墙是否允许 8000 端口
- **检查 4**：使用 `curl http://localhost:8000` 测试本地访问
- **检查 5**：使用 `netstat -tlnp | grep :8000` 确认端口监听状态

### 问题 2：任务没有执行
- 检查 OpenClaw Gateway 是否正在运行
- 使用 `openclaw cron list` 查看任务状态（enabled 应为 true）
- 使用 `openclaw cron runs --id <job-id>` 查看执行历史和错误信息
- 检查系统时间是否正确（特别是时区设置）

### 问题 3：任务执行失败
- 查看执行历史：`openclaw cron runs --id <job-id>`
- 检查 SKILL.md 文件路径是否正确
- 检查工作目录的读写权限
- 手动运行测试：`openclaw cron run <job-id>`
- **检查 Second Brain 服务状态**（新增的关键检查点）

### 问题 4：端口冲突导致服务启动失败
- **现象**：服务启动失败，错误显示 "EADDRINUSE: address already in use"
- **原因**：残留的 next-server 进程占用了端口 3000 或 8000
- **解决方案**：
  ```bash
  # 查找占用端口的进程
  lsof -i :3000
  lsof -i :8000
  
  # 终止相关进程
  pkill -f "next-server"
  pkill -f "node.*server.js"
  
  # 或者使用具体 PID
  kill -9 <PID>
  ```

### 问题 5：子 Agent 创建了额外的定时任务
- 这不应该发生！子 Agent 在隔离会话中运行，只读取自己的 SKILL.md
- 如果发生，检查 SKILL.md 是否包含创建 cron 的指令
- 确保子 Agent 没有读取 CRON-AGENT-README.md

---

## 总结

作为主 Agent，你的完整任务流程：

1. ✅ **部署 Web 服务**
   - 构建：`npm run build`
   - 启动：`PORT=8000 HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js > /dev/null 2>&1 &`
   - 验证公网访问（ECS 用户需配置安全组）

2. ✅ **创建 3 个 isolated 定时任务**
   - **Service Monitor Agent**：每 20 分钟，delivery none（**新增的核心监控任务**）
   - **Knowledge Agent**：每小时，delivery none（增强服务依赖检查）
   - **Research Agent**：每天 23:00 Asia/Shanghai，delivery none（增强服务依赖检查）

3. ✅ **在 message 中明确指示子 Agent**
   - 检查 OpenClaw Gateway 状态并启动（如果需要）
   - **验证 Second Brain 服务可用性**（关键新增步骤）
   - 读取完整的绝对路径 SKILL.md 和 config.json
   - 执行各自的核心职责，包含适当的错误处理和重试逻辑

4. ✅ **验证任务创建成功**（`openclaw cron list`）

5. ✅ **建立完整的弹性监控体系**
   - 服务监控 Agent 提供主动健康检查和自愈能力
   - 知识和研究 Agent 具备服务依赖感知和重试机制
   - 所有组件都有详细的日志记录和错误处理

之后，三个子 Agent 会在隔离会话中自动按照各自的 SKILL.md 执行工作，形成一个完整的、具有弹性的自动化系统。

**记住**：
- 子 Agent 在隔离会话中运行，不会看到这个文件
- 子 Agent 只看到你在 `--message` 中指定的指令和他们自己的 SKILL.md
- 使用 `delivery none` 避免后台任务产生噪音
- **服务可用性是所有任务的前提条件**（关键改进点）
- 确保 OpenClaw Gateway 服务始终运行以支持定时任务