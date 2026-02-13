# CRON-AGENT-README

> **阅读对象**：主 Agent（负责创建和管理定时任务）
> 
> **重要提示**：本文件仅供主 Agent 阅读。子 Agent 执行时请直接读取各自的 SKILL.md 文件。

## 你的职责

作为主 Agent，你需要为 Second Brain 系统创建并管理 2 个定时任务（cron jobs），让子 Agent 自动执行知识管理和研究工作。

## 需要创建的定时任务

### 任务 1：Knowledge Agent（知识同步）

**执行频率**：每 5 分钟一次

**Cron 表达式**：`*/5 * * * *`

**执行命令**：
```bash
cd /path/to/openclaw-second-brain && claude --skill skills/knowledge-agent-skill/SKILL.md
```

**任务说明**：
- 自动同步用户对话到知识库
- 智能更新或创建 Notes/Logs
- 维护知识库的组织结构

**配置文件**：`skills/knowledge-agent-skill/config.json`

**子 Agent 读取**：`skills/knowledge-agent-skill/SKILL.md`（子 Agent 只看这个文件）

---

### 任务 2：Research Agent（研究报告）

**执行频率**：每天 23:00

**Cron 表达式**：`0 23 * * *`

**执行命令**：
```bash
cd /path/to/openclaw-second-brain && claude --skill skills/research-agent-skill/SKILL.md
```

**任务说明**：
- 分析用户兴趣点
- 搜索最新技术资讯
- 生成 Daily Research 报告

**配置文件**：`skills/research-agent-skill/config.json`

**子 Agent 读取**：`skills/research-agent-skill/SKILL.md`（子 Agent 只看这个文件）

---

## 创建定时任务的步骤

### 方式 1：使用 Crontab（推荐）

```bash
# 1. 打开 crontab 编辑器
crontab -e

# 2. 添加以下两行
*/5 * * * * cd /Users/kchen/Desktop/Project/openclaw/openclaw-second-brain && claude --skill skills/knowledge-agent-skill/SKILL.md >> logs/knowledge-agent.log 2>&1
0 23 * * * cd /Users/kchen/Desktop/Project/openclaw/openclaw-second-brain && claude --skill skills/research-agent-skill/SKILL.md >> logs/research-agent.log 2>&1

# 3. 保存并退出
```

### 方式 2：使用 launchd（macOS）

创建两个 plist 文件：

**~/Library/LaunchAgents/com.openclaw.knowledge-agent.plist**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openclaw.knowledge-agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/claude</string>
        <string>--skill</string>
        <string>/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain/skills/knowledge-agent-skill/SKILL.md</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
    <key>WorkingDirectory</key>
    <string>/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain</string>
</dict>
</plist>
```

**~/Library/LaunchAgents/com.openclaw.research-agent.plist**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openclaw.research-agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/claude</string>
        <string>--skill</string>
        <string>/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain/skills/research-agent-skill/SKILL.md</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>23</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>WorkingDirectory</key>
    <string>/Users/kchen/Desktop/Project/openclaw/openclaw-second-brain</string>
</dict>
</plist>
```

然后加载：
```bash
launchctl load ~/Library/LaunchAgents/com.openclaw.knowledge-agent.plist
launchctl load ~/Library/LaunchAgents/com.openclaw.research-agent.plist
```

---

## 重要说明

### 1. 子 Agent 的工作范围

当定时任务触发时，子 Agent 会：
- ✅ 读取自己的 `SKILL.md` 文件（获取工作指令）
- ✅ 读取自己的 `config.json` 文件（获取配置参数）
- ✅ 执行自己的职责（同步知识或生成报告）
- ❌ **不会**读取 `CRON-AGENT-README.md`（避免误创建其他定时任务）
- ❌ **不会**创建新的定时任务（只有主 Agent 才能做）

### 2. 配置文件的作用

每个子 Agent 的 `config.json` 包含：
- 执行参数（阈值、时间窗口等）
- 数据源配置
- 质量标准
- 个性化设置

子 Agent 会读取这些配置来调整自己的行为。

### 3. 日志和监控

建议创建日志目录：
```bash
mkdir -p /Users/kchen/Desktop/Project/openclaw/openclaw-second-brain/logs
```

每个任务的输出会记录到：
- `logs/knowledge-agent.log`
- `logs/research-agent.log`

定期检查日志以确保任务正常运行。

---

## 验证任务是否创建成功

### 检查 Crontab
```bash
crontab -l
```

应该看到两行定时任务。

### 检查 launchd（macOS）
```bash
launchctl list | grep openclaw
```

应该看到两个服务正在运行。

### 手动测试
```bash
# 测试 Knowledge Agent
cd /Users/kchen/Desktop/Project/openclaw/openclaw-second-brain
claude --skill skills/knowledge-agent-skill/SKILL.md

# 测试 Research Agent
claude --skill skills/research-agent-skill/SKILL.md
```

---

## 任务管理

### 停止任务

**Crontab**:
```bash
crontab -e
# 删除对应的行或在行首添加 # 注释掉
```

**launchd**:
```bash
launchctl unload ~/Library/LaunchAgents/com.openclaw.knowledge-agent.plist
launchctl unload ~/Library/LaunchAgents/com.openclaw.research-agent.plist
```

### 修改执行频率

编辑 cron 表达式或 plist 文件中的时间配置，然后重新加载。

---

## 故障排查

### 问题 1：任务没有执行
- 检查 cron 服务是否运行
- 检查命令路径是否正确
- 查看日志文件是否有错误

### 问题 2：权限问题
- 确保 claude 命令有执行权限
- 确保工作目录有读写权限

### 问题 3：子 Agent 创建了额外的定时任务
- 这不应该发生！子 Agent 只读取自己的 SKILL.md
- 如果发生，检查 SKILL.md 是否包含创建 cron 的指令
- 确保子 Agent 没有读取 CRON-AGENT-README.md

---

## 总结

作为主 Agent，你的任务很简单：

1. ✅ 创建 2 个定时任务（Knowledge Agent 每 5 分钟，Research Agent 每天 23:00）
2. ✅ 确保任务指向正确的 SKILL.md 文件
3. ✅ 设置日志输出
4. ✅ 验证任务创建成功

之后，子 Agent 会自动按照各自的 SKILL.md 执行工作，你无需干预。

**记住**：子 Agent 不会看到这个文件，他们只看自己的 SKILL.md！
