# 🎯 OpenClaw 自主 AI 系统 - 完整配置指南

## 系统概览

本系统实现了一个完整的自主 AI 生态，包括：
1. **分层记忆系统**: 用户偏好、决策历史、技术知识
2. **自动知识流动**: OpenClaw ↔ Second Brain ↔ 当前对话
3. **多 Agent 协作**: 项目开发、知识管理、研究分析
4. **持续自动化**: 24/7 运行的智能系统

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code 对话                      │
│              (当前会话 - 实时交互)                       │
└────────────────────┬────────────────────────────────────┘
                     │ 对话记录
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   OpenClaw 系统                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  会话存储    │  │  记忆系统    │  │  Agent 技能  │  │
│  │  sessions/   │  │  memory/     │  │  skills/     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  记忆层次:                                               │
│  ├─ 用户偏好 (user-preferences.md)                      │
│  ├─ 决策历史 (decision-history.md)                      │
│  └─ 技术知识 (technical-knowledge.md)                   │
└────────────────────┬────────────────────────────────────┘
                     │ 自动同步
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Second Brain                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  笔记 Notes  │  │  日志 Logs   │  │  报告 Reports│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  功能:                                                   │
│  ├─ 知识图谱可视化                                      │
│  ├─ 全文搜索                                            │
│  └─ Web UI 展示                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 分层记忆系统

### 第 1 层: 用户偏好 (长期)
**文件**: `~/.openclaw/workspace/memory/user-preferences.md`
**内容**:
- 个人信息和联系方式
- 技术偏好和工作风格
- 学习方式和沟通偏好
- 当前项目和长期目标

**更新频率**: 每月或有重大变化时
**优先级**: ⭐⭐⭐⭐⭐

### 第 2 层: 决策历史 (中期)
**文件**: `~/.openclaw/workspace/memory/decision-history.md`
**内容**:
- 成功和失败的决策
- 遇到的问题和解决方案
- 最佳实践和教训
- 待改进的地方

**更新频率**: 每周或完成重要任务后
**优先级**: ⭐⭐⭐⭐

### 第 3 层: 技术知识 (短期-中期)
**文件**: `~/.openclaw/workspace/memory/technical-knowledge.md`
**内容**:
- 技术栈和最佳实践
- 代码示例和模式
- 工具使用技巧
- 常见问题解决方案

**更新频率**: 每天或学习新知识后
**优先级**: ⭐⭐⭐

### 第 4 层: 对话历史 (短期)
**位置**: `~/.openclaw/agents/main/sessions/*.jsonl`
**内容**:
- 所有对话记录
- 工具调用历史
- 执行结果

**更新频率**: 实时
**优先级**: ⭐⭐

---

## 🔄 知识流动机制

### 1. OpenClaw → Second Brain
**频率**: 每小时
**机制**: Cron 任务自动触发
**流程**:
```
OpenClaw 对话
→ 会话文件 (sessions/*.jsonl)
→ Knowledge Sync 脚本
→ Next.js API 处理
→ LLM 提取知识
→ Second Brain 存储
→ Markdown 转换
```

**Cron 配置**:
```bash
openclaw cron list
# Second Brain - Knowledge Sync: 每小时整点
```

### 2. Second Brain → OpenClaw 记忆
**频率**: 每天
**机制**: 定时更新记忆文件
**流程**:
```
Second Brain 数据
→ 分析和聚合
→ 提取关键知识
→ 更新记忆文件
→ OpenClaw 重新索引
```

### 3. 当前对话 → 记忆系统
**频率**: 会话结束时
**机制**: 手动或自动更新
**流程**:
```
当前对话
→ 提取关键决策
→ 更新决策历史
→ 补充技术知识
→ 记忆文件更新
```

---

## 🤖 Agent 系统配置

### 1. Knowledge Agent
**技能文件**: `skills/knowledge-agent-skill/SKILL.md`
**功能**: 自动同步知识到 Second Brain
**触发**: 每小时
**输入**: OpenClaw 会话文件
**输出**: Notes、Logs、Summary 数据

### 2. Research Agent
**技能文件**: `skills/research-agent-skill/SKILL.md`
**功能**: 生成研究报告
**触发**: 每晚 23:00
**输入**: Summary 数据、热门主题
**输出**: 研究报告 (Reports)

### 3. Project Developer Agent (新)
**技能文件**: `skills/project-developer-skill/SKILL.md`
**功能**: 自主开发赚钱项目
**触发**: 手动或定时
**输入**: 项目需求、用户偏好
**输出**: 完整项目代码

**虚拟团队**:
- 产品经理 Agent
- 技术架构师 Agent
- 前端开发 Agent
- 后端开发 Agent
- 测试 Agent
- 运营 Agent

---

## ⏰ 定时任务配置

### 当前任务
```bash
openclaw cron list
```

| 任务 | 频率 | 功能 | 状态 |
|------|------|------|------|
| Knowledge Sync | 每小时 | 同步知识 | ✅ 运行中 |
| Daily Research | 每天 23:00 | 生成报告 | ✅ 运行中 |

### 建议新增任务

#### 1. 记忆更新任务
```bash
openclaw cron add \
  --name "Memory Update" \
  --cron "0 0 * * *" \
  --session isolated \
  --message "/path/to/scripts/update-memory.sh" \
  --no-deliver
```
**功能**: 每天凌晨更新记忆文件

#### 2. 项目开发任务（一次性）
```bash
openclaw cron add \
  --at "+30m" \
  --name "Project Development Day" \
  --session isolated \
  --message "/path/to/skills/project-developer-skill/start-project-dev.sh" \
  --no-deliver \
  --timeout 86400000
```
**功能**: 给 Agent 一整天时间开发项目

#### 3. 系统健康检查
```bash
openclaw cron add \
  --name "System Health Check" \
  --cron "*/30 * * * *" \
  --session isolated \
  --message "/path/to/scripts/health-check.sh" \
  --no-deliver
```
**功能**: 每 30 分钟检查系统状态

---

## 🚀 启动指南

### 步骤 1: 启动所有服务
```bash
cd ~/Desktop/Project/openclaw/openclaw-second-brain
./scripts/start-system.sh
```

### 步骤 2: 验证系统状态
```bash
# 检查 OpenClaw
openclaw status

# 检查 Second Brain
curl http://localhost:3000/api/summary/stats

# 检查 Cron 任务
openclaw cron list
```

### 步骤 3: 创建对话
```bash
# 这将自动保存到 OpenClaw 会话
# 并在每小时自动同步到 Second Brain
```

### 步骤 4: 启动项目开发（可选）
```bash
# 给 Agent 一整天时间开发项目
cd ~/Desktop/Project/openclaw/openclaw-second-brain/skills/project-developer-skill
./start-project-dev.sh
```

---

## 📊 数据流监控

### 查看知识同步日志
```bash
ls -lt ~/Desktop/Project/openclaw/openclaw-second-brain/agent-logs/
tail -f ~/Desktop/Project/openclaw/openclaw-second-brain/agent-logs/knowledge-sync-*.log
```

### 查看 Second Brain 数据
```bash
# 访问 Web UI
open http://localhost:3000

# 查看数据文件
ls -la ~/Desktop/Project/openclaw/openclaw-second-brain/data/summaries/
cat ~/Desktop/Project/openclaw/openclaw-second-brain/data/summaries/summary-metadata.json | jq .
```

### 查看记忆文件
```bash
ls -la ~/.openclaw/workspace/memory/
cat ~/.openclaw/workspace/memory/user-preferences.md
```

---

## 🎯 使用场景

### 场景 1: 日常技术讨论
1. 与 OpenClaw 讨论技术问题
2. 系统自动记录到会话
3. 每小时自动同步到 Second Brain
4. 知识自动提取和分类
5. 更新到记忆系统

### 场景 2: 项目开发
1. 启动项目开发 Agent
2. Agent 自动调研市场
3. 生成技术方案
4. 协调虚拟团队开发
5. 持续监控进度
6. 最终交付完整项目

### 场景 3: 知识查询
1. 在 Second Brain Web UI 搜索
2. 查看知识图谱
3. 阅读研究报告
4. 浏览对话日志

---

## 🔧 维护指南

### 每天
- [ ] 查看系统健康状态
- [ ] 检查 Cron 任务执行情况
- [ ] 浏览新生成的内容

### 每周
- [ ] 更新决策历史
- [ ] 补充技术知识
- [ ] 清理旧日志文件
- [ ] 备份重要数据

### 每月
- [ ] 更新用户偏好
- [ ] 检查系统性能
- [ ] 优化记忆系统
- [ ] 评估项目进展

---

## 🐛 故障排查

### 问题: 记忆索引失败
**原因**: OpenAI embeddings 区域限制
**解决**: 当前已禁用向量搜索，使用文件直接访问

### 问题: 知识同步失败
**原因**: Next.js 服务器未运行
**解决**:
```bash
./scripts/start-system.sh
```

### 问题: Cron 任务未执行
**原因**: Gateway 未运行
**解决**:
```bash
openclaw gateway restart
openclaw cron list
```

---

## 🎊 系统特性

### ✅ 已实现
- 分层记忆系统（文件based）
- 自动知识同步（每小时）
- 研究报告生成（每晚）
- Web UI 可视化
- 健康检查系统
- 完整的文档

### 🚧 进行中
- 项目开发 Agent
- 多 Agent 协作机制
- 当前对话自动同步

### 📋 计划中
- 记忆动态加载
- 偏好自动学习
- 决策链可视化
- 项目自动部署
- 收益自动分析

---

## 📚 相关文档

- [OpenClaw 安装指南](./OPENCLAW_INSTALLED.md)
- [自动化配置完成](./AUTOMATION_SETUP_COMPLETE.md)
- [系统优化报告](./docs/OPTIMIZATION_REPORT.md)
- [项目开发 Agent 技能](./skills/project-developer-skill/SKILL.md)

---

## 💡 最佳实践

1. **定期更新记忆**: 及时记录重要决策和知识
2. **监控系统状态**: 确保所有服务正常运行
3. **备份重要数据**: 定期备份会话和记忆文件
4. **优化记忆内容**: 保持记忆文件精炼和有用
5. **评估 Agent 输出**: 检查自动生成的内容质量

---

**系统版本**: 2.0
**最后更新**: 2026-02-27
**配置者**: Claude Code + OpenClaw

🎉 **你现在拥有一个完整的自主 AI 系统！**
