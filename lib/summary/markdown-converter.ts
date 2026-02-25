/**
 * Markdown Converter - 将摘要JSON转换为Markdown文件
 * 
 * 功能：
 * 1. 将对话摘要转换为 content/logs/ 的日志文件
 * 2. 将主题摘要转换为 content/notes/ 的知识文档
 * 3. 生成符合前端要求的frontmatter格式
 * 4. 更新 .sync-state.json 同步状态
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  Conversation,
  Topic,
  Domain
} from './types';

export interface MarkdownConversionOptions {
  contentDir: string;
  notesDir: string;
  logsDir: string;
  syncStateFile: string;
  minConversationsForNote: number; // 主题至少包含多少对话才生成Note
}

export interface ConversionResult {
  createdLogs: number;
  createdNotes: number;
  updatedNotes: number;
  errors: Array<{ file: string; error: string }>;
}

export interface SyncState {
  lastSyncTimestamp: string;
  lastProcessedConversationId: string;
  processedCount: number;
  createdNotes: number;
  createdLogs: number;
  updatedNotes: number;
}

export class MarkdownConverter {
  private options: MarkdownConversionOptions;

  constructor(options: MarkdownConversionOptions) {
    this.options = options;
  }

  /**
   * 转换整个摘要树为Markdown文件
   */
  async convertSummaryTree(tree: { domains: Domain[] }): Promise<ConversionResult> {
    const result: ConversionResult = {
      createdLogs: 0,
      createdNotes: 0,
      updatedNotes: 0,
      errors: []
    };

    // 确保目录存在
    await this.ensureDirectories();

    // 读取同步状态
    const syncState = await this.loadSyncState();
    const processedConversations = new Set<string>();

    // 遍历所有领域
    for (const domain of tree.domains) {
      // 遍历领域下的所有主题
      for (const topic of domain.topics) {
        // 1. 为每个对话创建Log文件
        for (const conversation of topic.conversations) {
          // 跳过已处理的对话
          if (conversation.id === syncState.lastProcessedConversationId) {
            break;
          }

          try {
            await this.createLogFile(conversation, topic, domain);
            result.createdLogs++;
            processedConversations.add(conversation.id);
          } catch (error) {
            result.errors.push({
              file: `log-${conversation.id}`,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        // 2. 如果主题包含足够多的对话，创建或更新Note文件
        if (topic.conversations.length >= this.options.minConversationsForNote) {
          try {
            const noteExists = await this.noteExists(topic);
            
            if (noteExists) {
              await this.updateNoteFile(topic, domain);
              result.updatedNotes++;
            } else {
              await this.createNoteFile(topic, domain);
              result.createdNotes++;
            }
          } catch (error) {
            result.errors.push({
              file: `note-${topic.id}`,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    // 更新同步状态
    if (processedConversations.size > 0) {
      await this.updateSyncState({
        ...syncState,
        lastSyncTimestamp: new Date().toISOString(),
        lastProcessedConversationId: Array.from(processedConversations).pop() || syncState.lastProcessedConversationId,
        processedCount: syncState.processedCount + processedConversations.size,
        createdNotes: syncState.createdNotes + result.createdNotes,
        createdLogs: syncState.createdLogs + result.createdLogs,
        updatedNotes: syncState.updatedNotes + result.updatedNotes
      });
    }

    return result;
  }

  /**
   * 创建Log文件（对话日志）
   */
  private async createLogFile(
    conversation: Conversation,
    topic: Topic,
    domain: Domain
  ): Promise<void> {
    const timestamp = new Date(conversation.timestamp);
    const filename = this.formatLogFilename(timestamp);
    const filepath = path.join(this.options.logsDir, filename);

    // 检查文件是否已存在
    try {
      await fs.access(filepath);
      return; // 文件已存在，跳过
    } catch {
      // 文件不存在，继续创建
    }

    const content = this.generateLogContent(conversation, topic, domain);
    await fs.writeFile(filepath, content, 'utf-8');
  }

  /**
   * 创建Note文件（知识文档）
   */
  private async createNoteFile(
    topic: Topic,
    domain: Domain
  ): Promise<void> {
    const filename = this.formatNoteFilename(topic);
    const filepath = path.join(this.options.notesDir, filename);

    const content = this.generateNoteContent(topic, domain);
    await fs.writeFile(filepath, content, 'utf-8');
  }

  /**
   * 更新Note文件
   */
  private async updateNoteFile(
    topic: Topic,
    domain: Domain
  ): Promise<void> {
    const filename = this.formatNoteFilename(topic);
    const filepath = path.join(this.options.notesDir, filename);

    try {
      const existingContent = await fs.readFile(filepath, 'utf-8');
      const updatedContent = this.mergeNoteContent(existingContent, topic, domain);
      await fs.writeFile(filepath, updatedContent, 'utf-8');
    } catch (error) {
      // 如果读取失败，创建新文件
      await this.createNoteFile(topic, domain);
    }
  }

  /**
   * 生成Log文件内容
   */
  private generateLogContent(
    conversation: Conversation,
    topic: Topic,
    domain: Domain
  ): string {
    const timestamp = new Date(conversation.timestamp);
    const dateStr = this.formatDate(timestamp);
    const timeStr = this.formatTime(timestamp);

    return `---
date: ${this.formatLogFilename(timestamp).replace('.md', '')}
type: daily-log
summary: "${conversation.summary}"
topics: [${conversation.keywords.map(k => `"${k}"`).join(', ')}]
domain: "${domain.name}"
topic: "${topic.name}"
sentiment: "${conversation.metadata?.sentiment || 'neutral'}"
ai_generated: true
---

# ${dateStr} ${timeStr} - ${topic.name}

## 对话摘要

${conversation.summary}

## 关键词

${conversation.keywords.map(k => `- ${k}`).join('\n')}

## 所属主题

**领域**: ${domain.name}  
**主题**: ${topic.name}

## 相关对话

${topic.conversations
  .filter(c => c.id !== conversation.id)
  .slice(0, 5)
  .map(c => `- [${new Date(c.timestamp).toLocaleDateString()}] ${c.summary.substring(0, 60)}...`)
  .join('\n')}

---

> 此日志由对话总结系统自动生成。
> 对话ID: ${conversation.id}
`;
  }

  /**
   * 生成Note文件内容
   */
  private generateNoteContent(
    topic: Topic,
    domain: Domain
  ): string {
    const createdDate = new Date(topic.created_at);
    const updatedDate = new Date(topic.updated_at);

    return `---
title: "${topic.name}"
created: ${this.formatDate(createdDate)}
updated: ${this.formatDate(updatedDate)}
tags: [${(topic.keywords || []).map(k => `"${k}"`).join(', ')}]
domain: "${domain.name}"
summary: "${topic.summary}"
conversation_count: ${topic.conversations.length}
ai_refined: true
---

# ${topic.name}

## 概述

${topic.summary}

## 目录

${this.generateTableOfContents(topic)}

## 详细内容

${this.generateDetailedContent(topic)}

## 相关对话

${topic.conversations
  .map((c, idx) => `### ${idx + 1}. ${new Date(c.timestamp).toLocaleDateString()} - ${c.summary.substring(0, 50)}...

**关键词**: ${c.keywords.join(', ')}  
**情感**: ${c.metadata?.sentiment || 'neutral'}

${c.summary}

---
`)
  .join('\n')}

## 关键收获

${this.generateKeyTakeaways(topic)}

## 相关主题

${this.generateRelatedTopics(topic, domain)}

---

> 本文档由对话总结系统自动生成并持续更新。  
> 最后更新: ${this.formatDate(updatedDate)}  
> 包含对话数: ${topic.conversations.length}
`;
  }

  /**
   * 合并Note内容（更新现有文档）
   */
  private mergeNoteContent(
    existingContent: string,
    topic: Topic,
    domain: Domain
  ): string {
    // 解析现有frontmatter
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      // 如果没有frontmatter，创建新内容
      return this.generateNoteContent(topic, domain);
    }

    // 更新frontmatter
    const updatedDate = new Date(topic.updated_at);
    const newFrontmatter = `---
title: "${topic.name}"
created: ${this.extractCreatedDate(existingContent)}
updated: ${this.formatDate(updatedDate)}
tags: [${(topic.keywords || []).map(k => `"${k}"`).join(', ')}]
domain: "${domain.name}"
summary: "${topic.summary}"
conversation_count: ${topic.conversations.length}
ai_refined: true
---`;

    // 提取现有内容主体
    const bodyContent = existingContent.substring(frontmatterMatch[0].length);

    // 检查是否需要添加新的对话记录
    const newConversations = this.getNewConversations(bodyContent, topic);
    
    if (newConversations.length > 0) {
      // 在"相关对话"章节添加新对话
      const conversationSection = this.generateConversationSection(newConversations);
      const updatedBody = this.insertConversationSection(bodyContent, conversationSection);
      
      return `${newFrontmatter}\n${updatedBody}`;
    }

    return `${newFrontmatter}\n${bodyContent}`;
  }

  /**
   * 生成目录
   */
  private generateTableOfContents(topic: Topic): string {
    return `1. 概述
2. 详细内容
3. 相关对话 (${topic.conversations.length}个)
4. 关键收获
5. 相关主题`;
  }

  /**
   * 生成详细内容
   */
  private generateDetailedContent(topic: Topic): string {
    // 按关键词分组对话
    const keywordGroups = this.groupConversationsByKeywords(topic.conversations);
    
    let content = '';
    for (const [keyword, conversations] of Object.entries(keywordGroups)) {
      content += `### ${keyword}\n\n`;
      content += `${conversations.map(c => `- ${c.summary}`).join('\n')}\n\n`;
    }
    
    return content || '暂无详细内容。';
  }

  /**
   * 生成关键收获
   */
  private generateKeyTakeaways(topic: Topic): string {
    // 提取所有对话的关键词，统计频率
    const keywordFreq = new Map<string, number>();
    
    topic.conversations.forEach(c => {
      c.keywords.forEach(k => {
        keywordFreq.set(k, (keywordFreq.get(k) || 0) + 1);
      });
    });

    // 按频率排序，取前5个
    const topKeywords = Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => `- **${keyword}**: 在 ${count} 个对话中被提及`);

    return topKeywords.join('\n') || '- 暂无关键收获';
  }

  /**
   * 生成相关主题
   */
  private generateRelatedTopics(topic: Topic, domain: Domain): string {
    // 找出同领域下的其他主题
    const relatedTopics = domain.topics
      .filter(t => t.id !== topic.id)
      .slice(0, 5)
      .map(t => `- [${t.name}](${this.formatNoteFilename(t)})`);

    return relatedTopics.join('\n') || '- 暂无相关主题';
  }

  /**
   * 按关键词分组对话
   */
  private groupConversationsByKeywords(conversations: Conversation[]): Record<string, Conversation[]> {
    const groups: Record<string, Conversation[]> = {};
    
    conversations.forEach(c => {
      const primaryKeyword = c.keywords[0] || 'general';
      if (!groups[primaryKeyword]) {
        groups[primaryKeyword] = [];
      }
      groups[primaryKeyword].push(c);
    });
    
    return groups;
  }

  /**
   * 获取新对话（不在现有内容中的）
   */
  private getNewConversations(existingContent: string, topic: Topic): Conversation[] {
    return topic.conversations.filter(c => !existingContent.includes(c.id));
  }

  /**
   * 生成对话章节
   */
  private generateConversationSection(conversations: Conversation[]): string {
    return conversations
      .map((c, idx) => `### ${idx + 1}. ${new Date(c.timestamp).toLocaleDateString()} - ${c.summary.substring(0, 50)}...

**关键词**: ${c.keywords.join(', ')}  
**情感**: ${c.metadata?.sentiment || 'neutral'}

${c.summary}

---
`)
      .join('\n');
  }

  /**
   * 插入对话章节到现有内容
   */
  private insertConversationSection(bodyContent: string, newSection: string): string {
    // 查找"相关对话"章节
    const conversationHeaderMatch = bodyContent.match(/## 相关对话/);
    
    if (conversationHeaderMatch) {
      // 在该章节后插入新内容
      const insertPosition = conversationHeaderMatch.index! + conversationHeaderMatch[0].length;
      return bodyContent.slice(0, insertPosition) + '\n\n' + newSection + bodyContent.slice(insertPosition);
    }
    
    // 如果找不到章节，在末尾添加
    return bodyContent + '\n\n## 相关对话\n\n' + newSection;
  }

  /**
   * 提取创建日期
   */
  private extractCreatedDate(content: string): string {
    const match = content.match(/created:\s*(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : this.formatDate(new Date());
  }

  /**
   * 检查Note是否存在
   */
  private async noteExists(topic: Topic): Promise<boolean> {
    const filename = this.formatNoteFilename(topic);
    const filepath = path.join(this.options.notesDir, filename);
    
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 格式化Log文件名
   */
  private formatLogFilename(date: Date): string {
    return `${this.formatDate(date)}-${this.formatTime(date).replace(/:/g, '-')}.md`;
  }

  /**
   * 格式化Note文件名
   */
  private formatNoteFilename(topic: Topic): string {
    const date = new Date(topic.created_at);
    const slug = topic.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `${this.formatDate(date)}-${slug}.md`;
  }

  /**
   * 格式化日期 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 格式化时间 HH:mm:ss
   */
  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0];
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.options.contentDir, { recursive: true });
    await fs.mkdir(this.options.notesDir, { recursive: true });
    await fs.mkdir(this.options.logsDir, { recursive: true });
  }

  /**
   * 加载同步状态
   */
  private async loadSyncState(): Promise<SyncState> {
    try {
      const content = await fs.readFile(this.options.syncStateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {
        lastSyncTimestamp: new Date(0).toISOString(),
        lastProcessedConversationId: '',
        processedCount: 0,
        createdNotes: 0,
        createdLogs: 0,
        updatedNotes: 0
      };
    }
  }

  /**
   * 更新同步状态
   */
  private async updateSyncState(state: SyncState): Promise<void> {
    await fs.writeFile(
      this.options.syncStateFile,
      JSON.stringify(state, null, 2),
      'utf-8'
    );
  }
}

