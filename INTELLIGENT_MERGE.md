# 智能合并系统 - 使用大模型判断对话归属

## 🎯 核心功能

使用**大模型智能判断**新对话应该如何处理，而不是简单的余弦相似度计算。

## 🔄 工作流程

```
新对话
  ↓
读取现有目录结构（领域/主题/笔记）
  ↓
大模型分析判断
  ├─ 领域归属（现有 or 新建）
  ├─ 主题归属（现有 or 新建）
  └─ 合并决策（merge / create_new / create_log_only）
  ↓
执行操作
  ├─ merge: 大模型智能合并到现有笔记
  ├─ create_new: 创建新笔记
  └─ create_log_only: 仅创建日志
```

## 📊 大模型决策过程

### 1. 读取现有结构

系统会读取 `content/notes/` 下所有笔记的：
- 标题
- 摘要
- 标签
- 所属领域和主题
- 更新时间

格式化为：
```
### 领域: 前端开发
  #### 主题: React性能优化
    - **React Performance Optimization - Advanced Guide**
      摘要: Comprehensive guide to React performance optimization...
      标签: react, performance, optimization
      更新: 2026-02-12
```

### 2. 大模型判断

提示词包含：
- 新对话的摘要和关键词
- 现有知识库的完整结构
- 判断标准和输出格式

大模型返回JSON：
```json
{
  "action": "merge",
  "domain": "前端开发",
  "topic": "React性能优化",
  "target_note_title": "React Performance Optimization - Advanced Guide",
  "reason": "这个对话讨论了React.memo的使用技巧，可以补充到现有的React性能优化笔记中"
}
```

### 3. 智能合并

如果决策是 `merge`，系统会：
1. 读取目标笔记的完整内容
2. 将现有内容和新对话发送给大模型
3. 大模型生成合并后的完整Markdown
4. 自动更新frontmatter（时间、标签、对话数）
5. 在"相关对话"章节添加新记录

## 🎨 三种处理策略

### Strategy 1: Merge（合并）
**条件**：
- 新对话与现有笔记内容高度相关
- 可以补充或深化现有知识点
- 属于同一主题的不同方面

**效果**：
- 保留原笔记的创建日期
- 更新修改时间
- 增加对话计数
- 智能融入相关章节
- 添加到"相关对话"列表

### Strategy 2: Create New（创建新笔记）
**条件**：
- 新对话是独立的新主题
- 内容足够深入和完整
- 与现有笔记关联度低

**效果**：
- 创建新的笔记文件
- 生成完整的文档结构
- 建立新的主题分类

### Strategy 3: Create Log Only（仅创建日志）
**条件**：
- 对话太简短或琐碎
- 不适合形成知识文档
- 仅作为历史记录保存

**效果**：
- 只在 `content/logs/` 创建日志
- 不生成笔记文件

## 🚀 使用方法

### 一键执行
```bash
npm run summary:pipeline
```

### API调用
```bash
curl -X POST http://localhost:3000/api/summary/convert
```

### 响应示例
```json
{
  "success": true,
  "result": {
    "merged_to_existing": 3,
    "created_notes": 1,
    "created_logs": 4,
    "updated_notes": [
      {
        "path": "/path/to/react-performance.md",
        "title": "React Performance Optimization"
      }
    ],
    "errors": [],
    "duration_ms": 25000
  },
  "message": "智能处理完成：合并3个，新建1个笔记，4个日志"
}
```

## 🎛️ 配置选项

在 `summary-config.json` 中：

```json
{
  "llm": {
    "model": "qwen-plus",
    "temperature": 0.3,
    "max_tokens": 4000
  },
  "intelligent_merger": {
    "enable": true,
    "merge_threshold": 0.7,
    "max_content_length": 3000
  }
}
```

## 💡 优势对比

### 传统方法（余弦相似度）
- ❌ 只能计算关键词的数学相似度
- ❌ 无法理解语义和上下文
- ❌ 难以判断内容是否可融入
- ❌ 容易误判相关性

### 智能方法（大模型）
- ✅ 深度理解对话内容和语义
- ✅ 分析现有笔记的结构和主题
- ✅ 判断内容是否可以补充或深化
- ✅ 智能生成合并后的连贯内容
- ✅ 保持文档的可读性和结构性

## 📝 实际案例

### 案例1：补充现有知识

**现有笔记**：`React Performance Optimization`
- 包含：useMemo、useCallback、React.memo基础用法

**新对话**：讨论React.memo的高级用法和自定义比较函数

**大模型判断**：
```json
{
  "action": "merge",
  "reason": "可以补充React.memo章节的高级技巧"
}
```

**结果**：在现有笔记的"React.memo"章节下添加"高级用法"子章节

### 案例2：创建新主题

**现有笔记**：只有React相关内容

**新对话**：讨论Vue 3的Composition API

**大模型判断**：
```json
{
  "action": "create_new",
  "domain": "前端开发",
  "topic": "Vue 3 Composition API",
  "reason": "这是一个新的独立主题，与现有React内容不相关"
}
```

**结果**：创建新笔记 `2026-02-25-vue-3-composition-api.md`

### 案例3：仅记录日志

**新对话**：简单问答"如何安装npm包"

**大模型判断**：
```json
{
  "action": "create_log_only",
  "reason": "内容太简短，不适合形成知识文档"
}
```

**结果**：只创建日志文件，不生成笔记

## 🔧 技术细节

### 大模型调用
- 使用阿里云百炼API（qwen-plus）
- 温度设置为0.3（更确定的决策）
- 最大token数：1000（决策）/ 4000（合并）

### 内容截断
- 现有笔记内容截断到3000字符（避免超出token限制）
- 保留完整的frontmatter和主要章节

### 错误处理
- API调用失败自动重试
- 解析失败默认创建新笔记
- 详细的错误日志记录

### 性能优化
- 每个对话处理后延迟1秒（避免API限流）
- 批量处理时显示进度
- 异步并发控制

## 🎉 总结

现在系统可以：
1. ✅ 智能判断对话归属
2. ✅ 自动合并到相关笔记
3. ✅ 保持文档结构和连贯性
4. ✅ 增量更新知识库
5. ✅ 一键执行完整流程

**完全自动化，无需手动干预！** 🚀

