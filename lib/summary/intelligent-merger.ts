/**
 * 智能合并器 - 使用大模型判断对话是否应该合并到现有笔记
 * 
 * 增强版：支持多种对话格式，更加鲁棒，完善错误处理
 */

import fs from 'fs/promises';
import path from 'path';
import { LLMClient } from './llm-client';
import type { Conversation } from './types';

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
  target_note?: string;
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
  private processedConversations: Set<string>;

  constructor(llmClient: LLMClient, notesDir: string, logsDir: string) {
    this.llmClient = llmClient;
    this.notesDir = notesDir;
    this.logsDir = logsDir;
    this.processedConversations = new Set();
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
      // 验证对话数据
      if (!this.validateConversation(conversation)) {
        throw new Error('对话数据格式无效');
      }

      // 防止重复处理
      if (this.processedConversations.has(conversation.id)) {
        console.log(`跳过已处理的对话: ${conversation.id}`);
        return result;
      }

      // 确保目录存在
      await this.ensureDirectories();

      // 1. 读取现有目录结构
      const structure = await this.readDirectoryStructure();

      // 2. 让大模型判断应该如何处理这个对话
      const decision = await this.getMergeDecision(conversation, structure);

      // 3. 根据决策执行操作
      if (decision.action === 'merge' && decision.target_note) {
        await this.mergeToExistingNote(conversation, decision.target_note, decision);
        result.merged_count++;
        result.updated_notes.push({
          path: decision.target_note,
          title: path.basename(decision.target_note, '.md')
        });
      } else if (decision.action === 'create_new') {
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

      // 标记为已处理
      this.processedConversations.add(conversation.id);

    } catch (error) {
      console.error(`处理对话失败 [${conversation.id}]:`, error);
      result.errors.push({
        conversation_id: conversation.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return result;
  }

  /**
   * 验证对话数据格式
   */
  private validateConversation(conversation: Conversation): boolean {
    if (!conversation || typeof conversation !== 'object') {
      console.error('对话数据为空或格式错误');
      return false;
    }

    if (!conversation.id || typeof conversation.id !== 'string') {
      console.error('对话ID缺失或格式错误');
      return false;
    }

    if (!conversation.summary || typeof conversation.summary !== 'string') {
      console.error('对话摘要缺失或格式错误');
      return false;
    }

    if (!Array.isArray(conversation.keywords)) {
      console.error('关键词格式错误，应为数组');
      return false;
    }

    if (!conversation.timestamp) {
      console.error('时间戳缺失');
      return false;
    }

    return true;
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.notesDir, { recursive: true });
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('创建目录失败:', error);
      throw error;
    }
  }

  /**
   * 读取现有的目录结构
   */
  private async readDirectoryStructure(): Promise<DirectoryStructure> {
    const structure: DirectoryStructure = { domains: [] };

    try {
      // 检查目录是否存在
      try {
        await fs.access(this.notesDir);
      } catch {
        console.log('笔记目录不存在，返回空结构');
        return structure;
      }

      const files = await fs.readdir(this.notesDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      // 读取所有笔记的frontmatter
      for (const file of mdFiles) {
        try {
          const filepath = path.join(this.notesDir, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const metadata = this.parseFrontmatter(content);

          if (metadata && metadata.title) {
            // 按领域分组
            const domainName = metadata.domain || 'General';
            let domain = structure.domains.find(d => d.name === domainName);
            if (!domain) {
              domain = {
                name: domainName,
                path: this.notesDir,
                topics: []
              };
              structure.domains.push(domain);
            }

            // 按主题分组
            const topicName = metadata.topic || metadata.title;
            let topic = domain.topics.find(t => t.name === topicName);
            if (!topic) {
              topic = {
                name: topicName,
                notes: []
              };
              domain.topics.push(topic);
            }

            // 添加笔记
            topic.notes.push({
              title: metadata.title,
              summary: metadata.summary || '',
              filepath: filepath,
              tags: Array.isArray(metadata.tags) ? metadata.tags : [],
              created: metadata.created || '',
              updated: metadata.updated || ''
            });
          }
        } catch (error) {
          console.error(`读取文件失败 [${file}]:`, error);
          // 继续处理其他文件
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
    try {
      const prompt = this.buildDecisionPrompt(conversation, structure);
      
      // 调用大模型，添加重试机制
      let response: string;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await this.llmClient.generateConversationSummary(prompt, {
            maxLength: 1000
          });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.warn(`大模型调用失败，重试中... (剩余${retries}次)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return this.parseDecisionResponse(response!, structure);
    } catch (error) {
      console.error('获取合并决策失败:', error);
      // 返回默认决策
      return {
        action: 'create_new',
        domain: 'General',
        topic: conversation.keywords[0] || 'Uncategorized',
        reason: '大模型调用失败，默认创建新笔记'
      };
    }
  }

  /**
   * 构建决策提示词
   */
  private buildDecisionPrompt(
    conversation: Conversation,
    structure: DirectoryStructure
  ): string {
    const structureText = this.formatStructureForPrompt(structure);
    const keywords = conversation.keywords.slice(0, 10).join(', '); // 限制关键词数量
    const summary = conversation.summary.substring(0, 500); // 限制摘要长度

    return `你是一个严格的知识管理助手。你的任务是判断对话是否值得沉淀为知识笔记。

## 新对话信息

**摘要**: ${summary}
**关键词**: ${keywords}
**时间**: ${conversation.timestamp}

## 现有知识库结构

${structureText}

## 判断标准（非常重要！）

### ✅ 值得创建笔记的对话（merge 或 create_new）：
1. **有实质性知识内容**：
   - 技术原理、方法论、最佳实践
   - 问题解决方案、调试经验
   - 深入的分析和见解
   - 可复用的代码或配置

2. **有长期参考价值**：
   - 未来可能需要查阅
   - 可以帮助解决类似问题
   - 包含重要的决策依据

3. **内容充实**：
   - 对话有深度，不是简单的一问一答
   - 包含详细的解释或步骤
   - 有具体的例子或代码

### ❌ 只需要创建日志的对话（create_log_only）：
1. **简单的操作指令**：
   - "帮我运行这个命令"
   - "创建一个文件"
   - "修改这个配置"

2. **临时性的问题**：
   - 一次性的错误排查
   - 环境配置问题
   - 简单的文件操作

3. **闲聊或无关内容**：
   - 打招呼、寒暄
   - 与技术无关的讨论
   - 重复的简单问题

4. **内容太短或太浅**：
   - 对话少于3轮
   - 没有深入讨论
   - 只是简单确认

## 决策流程

1. **首先判断是否值得创建笔记**：
   - 如果不符合"值得创建笔记"的标准 → 直接选择 "create_log_only"
   - 如果符合标准 → 继续下一步

2. **判断领域和主题**：
   - 确定对话的领域（如：编程、系统配置、数据分析等）
   - 确定具体主题

3. **判断是合并还是新建**：
   - 如果现有笔记可以容纳这个内容 → "merge"
   - 如果是全新的独立主题 → "create_new"

## 输出格式（严格JSON）

\`\`\`json
{
  "action": "create_log_only",
  "domain": "领域名称",
  "topic": "主题名称",
  "target_note_title": "目标笔记的标题（如果action不是merge则填null）",
  "reason": "简短说明你的判断理由（必须说明为什么值得或不值得创建笔记）"
}
\`\`\`

**重要提示**：
- 宁可保守，不要把简单对话变成笔记
- 只有真正有价值的知识才值得创建笔记
- 大部分日常对话应该只创建日志（create_log_only）
- 日志文件会保留完整记录，不用担心信息丢失

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
    let noteCount = 0;
    const maxNotes = 20; // 限制显示的笔记数量

    for (const domain of structure.domains) {
      text += `\n### 领域: ${domain.name}\n`;
      for (const topic of domain.topics) {
        text += `\n  #### 主题: ${topic.name}\n`;
        for (const note of topic.notes) {
          if (noteCount >= maxNotes) {
            text += `    ... (还有更多笔记)\n`;
            return text;
          }
          text += `    - **${note.title}**\n`;
          const shortSummary = note.summary.substring(0, 80);
          text += `      摘要: ${shortSummary}${note.summary.length > 80 ? '...' : ''}\n`;
          text += `      标签: ${note.tags.slice(0, 5).join(', ')}\n`;
          noteCount++;
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
      // 多种方式提取JSON
      let jsonStr: string | null = null;
      
      // 方式1: 提取```json```包裹的内容
      const jsonMatch1 = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch1) {
        jsonStr = jsonMatch1[1];
      }
      
      // 方式2: 提取```包裹的内容
      if (!jsonStr) {
        const jsonMatch2 = response.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[1];
        }
      }
      
      // 方式3: 直接提取JSON对象
      if (!jsonStr) {
        const jsonMatch3 = response.match(/\{[\s\S]*\}/);
        if (jsonMatch3) {
          jsonStr = jsonMatch3[0];
        }
      }
      
      if (!jsonStr) {
        throw new Error('无法从响应中提取JSON');
      }

      // 清理JSON字符串
      jsonStr = jsonStr.trim();
      
      const parsed = JSON.parse(jsonStr);

      // 验证必需字段
      if (!parsed.action || !parsed.domain || !parsed.topic) {
        throw new Error('JSON缺少必需字段');
      }

      // 验证action值
      if (!['merge', 'create_new', 'create_log_only'].includes(parsed.action)) {
        console.warn(`无效的action值: ${parsed.action}，默认为create_new`);
        parsed.action = 'create_new';
      }

      // 查找目标笔记路径
      let target_note: string | undefined;
      if (parsed.action === 'merge' && parsed.target_note_title) {
        target_note = this.findNoteByTitle(parsed.target_note_title, structure);
        if (!target_note) {
          console.warn(`找不到目标笔记: ${parsed.target_note_title}，改为创建新笔记`);
          parsed.action = 'create_new';
        }
      }

      return {
        action: parsed.action,
        domain: String(parsed.domain),
        topic: String(parsed.topic),
        target_note: target_note,
        reason: String(parsed.reason || '无理由说明')
      };
    } catch (error) {
      console.error('解析大模型响应失败:', error);
      console.error('原始响应:', response);
      
      // 返回安全的默认值
      return {
        action: 'create_new',
        domain: 'General',
        topic: 'Uncategorized',
        reason: '解析失败，默认创建新笔记'
      };
    }
  }

  /**
   * 根据标题查找笔记路径（模糊匹配）
   */
  private findNoteByTitle(title: string, structure: DirectoryStructure): string | undefined {
    const normalizedTitle = title.toLowerCase().trim();
    
    for (const domain of structure.domains) {
      for (const topic of domain.topics) {
        for (const note of topic.notes) {
          const normalizedNoteTitle = note.title.toLowerCase().trim();
          
          // 精确匹配
          if (normalizedNoteTitle === normalizedTitle) {
            return note.filepath;
          }
          
          // 包含匹配
          if (normalizedNoteTitle.includes(normalizedTitle) || 
              normalizedTitle.includes(normalizedNoteTitle)) {
            return note.filepath;
          }
          
          // 文件名匹配
          const filename = path.basename(note.filepath, '.md').toLowerCase();
          if (filename.includes(normalizedTitle)) {
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
    try {
      // 读取现有笔记
      const existingContent = await fs.readFile(notePath, 'utf-8');

      // 检查是否已经包含这个对话
      if (existingContent.includes(conversation.id)) {
        console.log(`笔记已包含对话 ${conversation.id}，跳过合并`);
        return;
      }

      // 使用大模型生成合并后的内容
      const mergedContent = await this.generateMergedContent(
        existingContent,
        conversation,
        decision
      );

      // 备份原文件
      const backupPath = `${notePath}.backup`;
      await fs.writeFile(backupPath, existingContent, 'utf-8');

      // 写回文件
      await fs.writeFile(notePath, mergedContent, 'utf-8');
      
      console.log(`成功合并对话到: ${notePath}`);
    } catch (error) {
      console.error(`合并到现有笔记失败 [${notePath}]:`, error);
      throw error;
    }
  }

  /**
   * 使用大模型生成合并后的内容
   */
  private async generateMergedContent(
    existingContent: string,
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<string> {
    try {
      // 限制内容长度
      const truncatedContent = existingContent.substring(0, 3000);
      const truncatedSummary = conversation.summary.substring(0, 500);
      
      const prompt = `你是一个知识整合助手。请将新的对话内容智能地合并到现有笔记中。

## 现有笔记内容

\`\`\`markdown
${truncatedContent}
\`\`\`

## 新对话内容

**摘要**: ${truncatedSummary}
**关键词**: ${conversation.keywords.slice(0, 10).join(', ')}
**时间**: ${new Date(conversation.timestamp).toLocaleString()}
**对话ID**: ${conversation.id}

## 合并要求

1. **更新frontmatter**: 
   - 更新 \`updated\` 字段为当前日期 (${new Date().toISOString().split('T')[0]})
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

      // 如果没有markdown标记，检查是否直接返回了内容
      if (response.includes('---') && response.includes('# ')) {
        return response;
      }

      // 如果大模型返回失败，手动合并
      console.warn('大模型合并失败，使用手动合并');
      return this.manualMerge(existingContent, conversation);
      
    } catch (error) {
      console.error('生成合并内容失败:', error);
      // 降级到手动合并
      return this.manualMerge(existingContent, conversation);
    }
  }

  /**
   * 手动合并（降级方案）
   */
  private manualMerge(existingContent: string, conversation: Conversation): string {
    // 更新frontmatter
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return existingContent; // 无法解析，返回原内容
    }

    const frontmatter = frontmatterMatch[1];
    const body = existingContent.substring(frontmatterMatch[0].length);

    // 更新updated字段
    const updatedDate = new Date().toISOString().split('T')[0];
    let newFrontmatter = frontmatter.replace(
      /updated:\s*\d{4}-\d{2}-\d{2}/,
      `updated: ${updatedDate}`
    );

    // 增加conversation_count
    newFrontmatter = newFrontmatter.replace(
      /conversation_count:\s*(\d+)/,
      (match, count) => `conversation_count: ${parseInt(count) + 1}`
    );

    // 在相关对话章节添加新记录
    const timestamp = new Date(conversation.timestamp);
    const newConversation = `\n### ${timestamp.toLocaleDateString()} - ${conversation.summary.substring(0, 50)}...

**关键词**: ${conversation.keywords.join(', ')}  
**对话ID**: ${conversation.id}

${conversation.summary}

---\n`;

    let newBody = body;
    if (body.includes('## 相关对话')) {
      newBody = body.replace('## 相关对话', `## 相关对话${newConversation}`);
    } else {
      newBody += `\n\n## 相关对话${newConversation}`;
    }

    return `---\n${newFrontmatter}\n---${newBody}`;
  }

  /**
   * 创建新笔记
   */
  private async createNewNote(
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<string> {
    try {
      const timestamp = new Date(conversation.timestamp);
      const dateStr = timestamp.toISOString().split('T')[0];
      
      // 生成安全的文件名
      const slug = this.sanitizeFilename(decision.topic);
      const filename = `${dateStr}-${slug}.md`;
      const filepath = path.join(this.notesDir, filename);

      // 检查文件是否已存在
      try {
        await fs.access(filepath);
        console.warn(`文件已存在: ${filepath}，添加时间戳`);
        const uniqueFilename = `${dateStr}-${Date.now()}-${slug}.md`;
        return await this.createNewNote(conversation, {
          ...decision,
          topic: uniqueFilename.replace('.md', '')
        });
      } catch {
        // 文件不存在，继续创建
      }

      const content = `---
title: "${this.escapeQuotes(decision.topic)}"
created: ${dateStr}
updated: ${dateStr}
tags: [${conversation.keywords.slice(0, 10).map(k => `"${this.escapeQuotes(k)}"`).join(', ')}]
domain: "${this.escapeQuotes(decision.domain)}"
summary: "${this.escapeQuotes(conversation.summary.substring(0, 200))}"
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
      console.log(`成功创建新笔记: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('创建新笔记失败:', error);
      throw error;
    }
  }

  /**
   * 创建日志文件
   */
  private async createLogFile(
    conversation: Conversation,
    decision: MergeDecision
  ): Promise<void> {
    try {
      const timestamp = new Date(conversation.timestamp);
      const dateStr = timestamp.toISOString().split('T')[0];
      const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `${dateStr}-${timeStr}.md`;
      const filepath = path.join(this.logsDir, filename);

      // 检查文件是否已存在
      try {
        await fs.access(filepath);
        console.log(`日志文件已存在: ${filepath}`);
        return;
      } catch {
        // 文件不存在，继续创建
      }

      const content = `---
date: ${dateStr}-${timeStr}
type: daily-log
summary: "${this.escapeQuotes(conversation.summary.substring(0, 200))}"
topics: [${conversation.keywords.slice(0, 10).map(k => `"${this.escapeQuotes(k)}"`).join(', ')}]
domain: "${this.escapeQuotes(decision.domain)}"
topic: "${this.escapeQuotes(decision.topic)}"
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
      console.log(`成功创建日志: ${filepath}`);
    } catch (error) {
      console.error('创建日志文件失败:', error);
      // 日志创建失败不应该阻止整个流程
    }
  }

  /**
   * 解析Markdown frontmatter
   */
  private parseFrontmatter(content: string): any {
    try {
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
            .map(v => v.trim().replace(/^["']|["']$/g, ''))
            .filter(v => v.length > 0);
        } else {
          frontmatter[key] = value;
        }
      }

      return frontmatter;
    } catch (error) {
      console.error('解析frontmatter失败:', error);
      return null;
    }
  }

  /**
   * 清理文件名（移除非法字符）
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/^-|-$/g, '') || 'untitled';
  }

  /**
   * 转义引号
   */
  private escapeQuotes(str: string): string {
    return str.replace(/"/g, '\\"');
  }
}
