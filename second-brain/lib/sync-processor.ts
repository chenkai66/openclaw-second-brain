import fs from 'fs';
import path from 'path';

interface Conversation {
  role: string;
  content: Array<{ type: string; text: string }>;
  timestamp: number;
}

export class SyncProcessor {
  private contentDir: string;
  private logsDir: string;
  private notesDir: string;

  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.logsDir = path.join(this.contentDir, 'logs');
    this.notesDir = path.join(this.contentDir, 'notes');
    
    // Ensure directories exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    if (!fs.existsSync(this.notesDir)) {
      fs.mkdirSync(this.notesDir, { recursive: true });
    }
  }

  async processConversations(conversations: Conversation[]): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Extract user messages only (role: "user")
      const userMessages = conversations
        .filter(conv => conv.role === 'user')
        .map(conv => ({
          timestamp: conv.timestamp,
          content: conv.content.find(c => c.type === 'text')?.text || ''
        }))
        .filter(msg => msg.content.trim() !== '');

      if (userMessages.length === 0) {
        console.log('No user messages found in conversations');
        return;
      }

      // Get or create today's log
      const logPath = path.join(this.logsDir, `${today}.md`);
      let existingContent = '';
      let existingSummary = '';
      let existingTopics: string[] = [];

      if (fs.existsSync(logPath)) {
        existingContent = fs.readFileSync(logPath, 'utf8');
        // Extract existing frontmatter
        const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const summaryMatch = frontmatter.match(/summary:\s*"([^"]*)"/);
          const topicsMatch = frontmatter.match(/topics:\s*\[([^\]]*)\]/);
          
          if (summaryMatch) existingSummary = summaryMatch[1];
          if (topicsMatch && topicsMatch[1].trim()) {
            existingTopics = topicsMatch[1]
              .split(',')
              .map(t => t.trim().replace(/"/g, ''));
          }
        }
      }

      // Create new content from user messages
      const newContentLines = userMessages.map(msg => {
        const date = new Date(msg.timestamp).toLocaleString('zh-CN');
        return `- **${date}**: ${msg.content}`;
      });

      const combinedContent = existingContent + '\n' + newContentLines.join('\n');

      // Generate summary (in real implementation, this would use AI)
      const newSummary = this.generateSummary(combinedContent);
      
      // Extract topics (in real implementation, this would use AI)
      const newTopics = this.extractTopics(combinedContent);
      const allTopics = [...new Set([...existingTopics, ...newTopics])];

      // Create frontmatter
      const frontmatter = `---
date: ${today}
type: daily-log
summary: "${newSummary}"
topics: [${allTopics.map(t => `"${t}"`).join(', ')}]
ai_generated: true
---`;

      // Write updated log
      const fullContent = `${frontmatter}\n\n# ${today}\n\n${combinedContent}\n\n> 此日志由系统自动生成。`;
      fs.writeFileSync(logPath, fullContent);

      // Create knowledge notes based on topics
      await this.createKnowledgeNotes(today, allTopics, combinedContent);

      console.log(`Sync completed: processed ${userMessages.length} messages, updated log for ${today}`);
    } catch (error) {
      console.error('Error processing conversations:', error);
      throw error;
    }
  }

  private generateSummary(content: string): string {
    // Simple heuristic for summary generation
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Look for key phrases
    if (content.includes('sync') || content.includes('同步')) {
      return '讨论了第二大脑的同步功能实现和前端卡片设计。涉及知识图谱、TAG系统和内容摘要生成。';
    }
    
    if (content.includes('frontend') || content.includes('界面')) {
      return '优化了第二大脑的前端界面设计，包括卡片布局、知识图谱可视化和用户体验改进。';
    }
    
    if (content.includes('database') || content.includes('数据库')) {
      return '设计了三数据库架构：原始对话记录、知识摘要库和知识图谱，实现了智能压缩和合并机制。';
    }
    
    // Fallback to first meaningful line
    for (const line of lines) {
      if (line.trim().length > 20 && !line.startsWith('---') && !line.startsWith('#')) {
        return line.substring(0, 100) + '...';
      }
    }
    
    return '今日对话内容摘要。';
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    
    if (content.includes('sync') || content.includes('同步')) {
      topics.push('sync-implementation');
    }
    
    if (content.includes('frontend') || content.includes('界面') || content.includes('design')) {
      topics.push('frontend-design');
    }
    
    if (content.includes('database') || content.includes('数据库') || content.includes('knowledge')) {
      topics.push('knowledge-management');
    }
    
    if (content.includes('graph') || content.includes('图谱')) {
      topics.push('knowledge-graph');
    }
    
    if (content.includes('compression') || content.includes('压缩')) {
      topics.push('content-compression');
    }
    
    return topics.length > 0 ? topics : ['general-discussion'];
  }

  private async createKnowledgeNotes(date: string, topics: string[], content: string): Promise<void> {
    for (const topic of topics) {
      const noteId = this.slugify(topic);
      const notePath = path.join(this.notesDir, `${noteId}.md`);
      
      // Only create if it doesn't exist
      if (!fs.existsSync(notePath)) {
        const noteContent = this.generateNoteContent(topic, content, date);
        fs.writeFileSync(notePath, noteContent);
        console.log(`Created new knowledge note: ${noteId}`);
      }
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateNoteContent(topic: string, content: string, date: string): string {
    const title = topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    let noteContent = `---
title: ${title}
created: ${date}
updated: ${date}
tags: ["${topic}"]
related_logs: ["${date}"]
ai_refined: true
---

# ${title}

`;
    
    switch (topic) {
      case 'sync-implementation':
        noteContent += `通过定时任务每分钟检测新对话内容，自动生成日志摘要和独立笔记。

## 核心功能
- **实时检测**: 每60秒扫描对话记忆源
- **智能摘要**: 自动生成1-2句高层概括  
- **知识提取**: 识别重要主题并创建独立笔记
- **TAG系统**: 基于内容自动生成标签

> 本文档由系统自动生成。`;
        break;
        
      case 'frontend-design':
        noteContent += `第二大脑的前端界面采用现代化设计原则：

## 设计要点
- **卡片式布局**: 主页显示摘要卡片，点击查看详情
- **响应式设计**: 适配桌面和移动设备
- **知识图谱**: 基于TAG的可视化连接
- **简洁美学**: 无干扰的极简界面

> 本文档由系统自动生成。`;
        break;
        
      case 'knowledge-management':
        noteContent += `三数据库架构确保知识的有效组织和持久保存：

## 数据库结构
- **原始对话库**: 完整保存所有对话历史
- **知识摘要库**: 提炼的核心知识点，带丰富元数据
- **知识图谱**: TAG关系网络，支持可视化探索

> 本文档由系统自动生成。`;
        break;
        
      case 'knowledge-graph':
        noteContent += `基于TAG的知识图谱提供直观的知识关联视图：

## 功能特性
- **TAG提取**: 自动从内容中提取关键词作为TAG
- **关系映射**: 显示不同知识点之间的连接
- **交互探索**: 点击TAG查看相关知识卡片
- **动态更新**: 随新内容自动扩展图谱

> 本文档由系统自动生成。`;
        break;
        
      case 'content-compression':
        noteContent += `智能压缩机制平衡内容完整性和冗余消除：

## 压缩策略
- **相似度检测**: 识别高度重复的内容
- **智能合并**: 保留完整信息的同时消除冗余
- **版本追踪**: 合并操作保持版本历史
- **阈值控制**: 避免过度压缩导致信息丢失

> 本文档由系统自动生成。`;
        break;
        
      default:
        noteContent += `关于 ${title} 的讨论内容。

## 关键点
${content.substring(0, 300)}...

> 本文档由系统自动生成。`;
    }
    
    return noteContent;
  }
}