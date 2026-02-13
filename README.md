# 🧠 Second Brain

智能知识管理系统 - AI 驱动的个人知识库

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

## 核心功能

- **智能搜索** - 全文检索笔记和日志，实时高亮匹配
- **笔记编辑** - Markdown 编辑器，支持实时预览
- **标签筛选** - 按标签快速过滤内容
- **知识图谱** - 可视化展示笔记、日志和标签的关系网络
- **自动同步** - 定时检测新对话，自动提取概念

## 项目结构

```
openclaw-second-brain/
├── app/              # Next.js 应用
├── components/       # React 组件
├── content/          # 内容存储（Markdown 文件）
├── lib/              # 工具库
└── public/           # 静态资源
```

## 技术栈

- Next.js 14 + React 18 + TypeScript
- Tailwind CSS + Crimson Pro 字体
- D3.js（知识图谱可视化）
- React Markdown（内容渲染）

## 性能优化

- ✅ 增量静态生成（ISR）
- ✅ 图片优化（AVIF/WebP）
- ✅ 代码分割和按需加载
- ✅ API 缓存策略
- ✅ 编译优化

## 许可证

MIT
