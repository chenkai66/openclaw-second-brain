/**
 * 智能合并器 - 使用大模型判断对话是否应该合并到现有笔记
 * 
 * 工作流程：
 * 1. 读取现有的目录结构（领域/主题/笔记）
 * 2. 让大模型判断新对话应该归属到哪个层级
 * 3. 如果可以融入现有笔记，读取并智能合并
 * 4. 如果不能融入，创建新笔记
 */

import fs from 'fs/promises';
import path from 'path';
import { LLMClient } from './llm-client';
import type { Conversation, Topic, Domain } from './types';

export interface DirectoryStructure {
  domains: Array<{
    name: string;
    path: string;
    topics: Array<{
      name: string;
      notes: Array<{
        title: string;
        summary: string;
        filepath: string;
        tags: string[];
        created: string;
        updated: string;
      }>;
    }>;
  }>;
}

export interface MergeDecision {
  action: 'merge' | 'create_new' | 'create_log_only';
  target_note?: string; // 如果是merge，目标笔记的路径
  domain: string;
  topic: string;
  reason: string;
}

export interface MergeResult {
  merged_count: number;
  created_notes: number;
  created_logs: number;
  updated_notes: Array<{ path: string; title: string }>;
  errors: Array<{ conversation_id: string; error: string }>;
}

export class IntelligentMerger {
  private llmClient: LLMClient;
  private notesDir: string;
  private logsDir: string;

  constructor(llmClient: LLMClient, notesDir: string, logsDir: string) {
    this.llmClient = llmClient;
    this.notesDir = notesDir;
    this.logsDir = logsDir;
  }

  /**
   * 处理新对话，智能决定是合并还是创建新笔记
   */
  async processConversation(conversation: Conversation): Promise<MergeResult> {
    const result: MergeResult = {
      merged_count: 0,
      created_notes: 0,
      created_logs: 0,
      updated_notes: [],
      errors: []
    };

    try {
      // 1. 读取现有目录结构
      const structure = await this.readDirectoryStructure();

      // 2. 让大模型判断应该如何处理这个对话
      const decision = await this.getMergeDecision(conversation, structure);

      // 3. 根据决策执行操作
      if (decision.action === 'merge' && decision.target_note) {
        // 合并到现有笔记
        await this.mergeToExistingNote(conversation, decision.target_note, decision);
        result.merged_count++;
        result.updated_notes.push({
          path: decision.target_note,
          title: path.basename(decision.target_note, '.md')
        });
      } else if (decision.action === 'create_new') {
        // 创建新笔记
        const notePath = await this.createNewNote(conversation, decision);
        result.created_notes++;
        result.updated_notes.push({
          path: notePath,
          title: path.basename(notePath, '.md')
        });
      }

      // 4. 总是创建日志文件
      await this.createLogFile(conversation, decision);
      result.created_logs++;

    } catch (error) {
      result.errors.push({
        conversation_id: conversation.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return result;
  }

  /**
   * 读取现有的目录结构
   */
  private async readDirectoryStructure(): Promise<DirectoryStructure> {
    const structure: DirectoryStructure = { domains: [] };

    try {
      const files = await fs.readdir(this.notesDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      // 读取所有笔记的frontmatter
      for (const file of mdFiles) {
        const filepath = path.join(this.notesDir, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const metadata = this.parseFrontmatter(content);

        if (metadata) {
          // 按领域分组
          let domain = structure.domains.find(d => d.name === metadata.domain);
          if (!domain) {
            domain = {
              name: metadata.domain || 'General',
              path: this.notesDir,
              topics: []
            };
            structure.domains.push(domain);
          }

          // 按主题分组
          let topic = domain.topics.find(t => t.name === metadata.topic);
          if (!topic) {
            topic = {
              name: metadata.topic || metadata.title,
              notes: []
            };
            domain.topics.push(topic);
          }

          // 添加笔记
          topic.notes.push({
            title: metadata.title,
            summary: metadata.summary || '',
            filepath: filepath,
            tags: metadata.tags || [],
            created: metadata.created || '',
            updated: metadata.updated || ''
          });
        }
      }
    } catch (error) {
      console.error('读取目录结构失败:', error);
    }

    return structure;
  }

  /**
   * 使用大模型判断合并决策
   */
  private async getMergeDecision(
    conversation: Conversation,
    structure: DirectoryStructure
  ): Promise<MergeDecision> {
    // 构建提示词
    const prompt = this.buildDecisionPrompt(conversation, structure);

    // 使用assignTopic方法来判断（虽然名字不同，但功能类似）
    // 或者直接使用generateConversationSummary的底层逻辑
    const response = await this.llmClient.generateConversationSummary(prompt, {
      maxLength: 1000
    });

    // 解析大模型的响应
    return this.parseDecisionResponse(response, structure);
  }

  /**
   * 构建决策提示词
   */
  private buildDecisionPrompt(
    conversation: Conversation,
    structure: DirectoryStructure
  ): string {
    // 格式化现有目录结构
    const structureText = this.formatStructureForPrompt(structure);

    return `你是一个知识管理助手。现在有一个新的对话需要归档，请判断它应该如何处理。

## 新对话信息

**摘要**: ${conversation.summary}
**关键词**: ${conversation.keywords.join(', ')}
**时间**: ${conversation.timestamp}

## 现有知识库结构

${structureText}

## 你的任务

请分析这个对话，并做出以下判断：

1. **领域归属**: 这个对话属于哪个领域？是现有领域还是需要创建新领域？
2. **主题归属**: 这个对话属于哪个主题？是现有主题还是需要创建新主题？
3. **合并决策**: 
   - 如果这个对话可以融入某个现有笔记（内容相关、可以补充现有知识），选择 "merge"
   - 如果这个对话是新的独立主题，需要创建新笔记，选择 "create_new"
   - 如果这个对话太简短或不重要，只创建日志不创建笔记，选择 "create_log_only"

## 输出格式（严格JSON）

\`\`\`json
{
  "action": "merge" | "create_new" | "create_log_only",
  "domain": "领域名称",
  "topic": "主题名称",
  "target_note_title": "如果action是merge，填写目标笔记的标题；否则填null",
  "reason": "简短说明你的判断理由（1-2句话）"
}
\`\`\`

请直接输出JSON，不要有其他内容。`;
  }

  /**
   * 格式化目录结构为提示词
   */
  private formatStructureForPrompt(structure: DirectoryStructure): string {
    if (structure.domains.length === 0) {
      return '（知识库为空，这是第一个对话）';
    }

    let text = '';
    for (const domain of structure.domains) {
      text += `\n### 领域: ${domain.name}\n`;
      for (const topic of domain.topics) {
        text += `\n  #### 主题: ${topic.name}\n`;
        for (const note of topic.notes) {
          text += `    - **${note.title}**\n`;
          text += `      摘要: ${note.summary.substring(0, 100)}...\n`;
          text += `      标签: ${note.tags.join(', ')}\n`;
          text += `      更新: ${note.updated}\n`;
        }
      }
    }
    return text;
  }

  /**
   * 解析大模型的决策响应
   */
  private parseDecisionResponse(
    response: string,
    structure: DirectoryStructure
  ): MergeDecision {
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // 查找目标笔记路径
      let target_note: string | undefined;
      if (parsed.action === 'merge' && parsed.target_note_title) {
        target_note = this.findNoteByTitle(parsed.target_note_title, structure);
      }

      return {
        action: parsed.action,
        domain: parsed.domain,
        topic: parsed.topic,
        target_note: target_note,
        reason: parsed.reason
      };
    } catch (error) {
      console.error('解析大模型响应失败:', error);
      // 默认创建新笔记
      return {
        action: 'create_new',
        domain: 'General',
        topic: 'Uncategorized',
        reason: '解析失败，默认创建新笔记'
      };
    }
  }

  /**
   * 根据标题查找笔记路径
   */
  private findNoteByTitle(title: string, structure: DirectoryStructure): string | undefined {
    for (const domain of structure.domains) {
      for (const topic of domain.topics) {
        for (const note of topic.notes) {
          if (note.title === title || note.filepath.includes(title)) {
            return note.filepath;
          }
        }
      }
    }
    return undefined;
  }

  /**
   * 合并到现有笔记
   */
  private async mergeToExistingNote(
    conversation: Conversation,
    notePath: string,
    decision: MergeDecision
  ): Promise<void> {
    // 读取现有笔记
    const existingContent = await fs.readFile(notePath, 'utf-8');

    // 使用大模型生成合并后的内容
    const mergedContent = await this.generateMergedContent(
      existingContent,
      conversation,
      decision
    );

    // 写回文件
    await fs.writeFile(notePath, mergedContent, 'utf-8');
  }

  /**
   * 使用大模型生成合并后的内容
   */
  private async generateMergedContent(
    existingContent: string,
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<string> {
    const prompt = `你是一个知识整合助手。请将新的对话内容智能地合并到现有笔记中。

## 现有笔记内容

\`\`\`markdown
${existingContent.substring(0, 3000)}
\`\`\`

## 新对话内容

**摘要**: ${conversation.summary}
**关键词**: ${conversation.keywords.join(', ')}
**时间**: ${new Date(conversation.timestamp).toLocaleString()}
**对话ID**: ${conversation.id}

## 合并要求

1. **更新frontmatter**: 
   - 更新 \`updated\` 字段为当前日期
   - 合并新的关键词到 \`tags\`
   - 增加 \`conversation_count\`

2. **内容整合**:
   - 如果新对话补充了现有章节的内容，将其融入对应章节
   - 在"相关对话"章节添加新对话的记录

3. **保持结构**:
   - 保持原有的章节结构和格式
   - 保持Markdown语法正确

请输出完整的合并后的Markdown内容。`;

    const response = await this.llmClient.generateConversationSummary(prompt, {
      maxLength: 4000
    });

    // 提取Markdown内容
    const markdownMatch = response.match(/```markdown\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      return markdownMatch[1];
    }

    // 如果没有markdown标记，直接返回响应
    return response;
  }

  /**
   * 创建新笔记
   */
  private async createNewNote(
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<string> {
    const timestamp = new Date(conversation.timestamp);
    const dateStr = timestamp.toISOString().split('T')[0];
    const slug = decision.topic
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const filename = `${dateStr}-${slug}.md`;
    const filepath = path.join(this.notesDir, filename);

    const content = `---
title: "${decision.topic}"
created: ${dateStr}
updated: ${dateStr}
tags: [${conversation.keywords.map(k => `"${k}"`).join(', ')}]
domain: "${decision.domain}"
summary: "${conversation.summary}"
conversation_count: 1
ai_refined: true
---

# ${decision.topic}

## 概述

${conversation.summary}

## 相关对话

### 1. ${timestamp.toLocaleDateString()} - ${conversation.summary.substring(0, 50)}...

**关键词**: ${conversation.keywords.join(', ')}  
**情感**: ${conversation.metadata?.sentiment || 'neutral'}

${conversation.summary}

---

> 本文档由对话总结系统自动生成。  
> 对话ID: ${conversation.id}
`;

    await fs.writeFile(filepath, content, 'utf-8');
    return filepath;
  }

  /**
   * 创建日志文件
   */
  private async createLogFile(
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<void> {
    const timestamp = new Date(conversation.timestamp);
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `${dateStr}-${timeStr}.md`;
    const filepath = path.join(this.logsDir, filename);

    // 检查文件是否已存在
    try {
      await fs.access(filepath);
      return; // 已存在，跳过
    } catch {
      // 不存在，继续创建
    }

    const content = `---
date: ${dateStr}-${timeStr}
type: daily-log
summary: "${conversation.summary}"
topics: [${conversation.keywords.map(k => `"${k}"`).join(', ')}]
domain: "${decision.domain}"
topic: "${decision.topic}"
sentiment: "${conversation.metadata?.sentiment || 'neutral'}"
ai_generated: true
---

# ${dateStr} ${timeStr.replace(/-/g, ':')} - ${decision.topic}

## 对话摘要

${conversation.summary}

## 关键词

${conversation.keywords.map(k => `- ${k}`).join('\n')}

## 所属分类

**领域**: ${decision.domain}  
**主题**: ${decision.topic}

---

> 此日志由对话总结系统自动生成。  
> 对话ID: ${conversation.id}  
> 处理决策: ${decision.action} - ${decision.reason}
`;

    await fs.writeFile(filepath, content, 'utf-8');
  }

  /**
   * 解析Markdown frontmatter
   */
  private parseFrontmatter(content: string): any {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter: any = {};
    const lines = match[1].split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      let value: string | string[] = line.substring(colonIndex + 1).trim();

      // 移除引号
      value = value.replace(/^["']|["']$/g, '');

      // 解析数组
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key] = value
          .slice(1, -1)
          .split(',')
          .map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        frontmatter[key] = value;
      }
    }

    return frontmatter;
  }
}

