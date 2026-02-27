import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Claude Code 会话适配器
 * 用于读取和解析 Claude Code 的对话记录，并转换为统一格式
 */

export interface ClaudeCodeMessage {
  type: string;
  role?: string;
  content?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface UnifiedConversation {
  id: string;
  source: 'claude-code' | 'openclaw';
  timestamp: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  metadata: {
    project?: string;
    sessionFile: string;
    totalMessages: number;
  };
}

export class ClaudeCodeAdapter {
  private processedSessionsFile: string;
  private processedSessions: Set<string>;

  constructor() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.processedSessionsFile = path.join(
      homeDir,
      '.openclaw',
      'workspace',
      'memory',
      'processed-claude-code-sessions.json'
    );
    this.processedSessions = new Set();
  }

  /**
   * 初始化 - 加载已处理的会话列表
   */
  async initialize(): Promise<void> {
    try {
      if (existsSync(this.processedSessionsFile)) {
        const data = await fs.readFile(this.processedSessionsFile, 'utf-8');
        const sessions = JSON.parse(data);
        this.processedSessions = new Set(sessions);
      }
    } catch (error) {
      console.warn('Failed to load processed sessions:', error);
      this.processedSessions = new Set();
    }
  }

  /**
   * 保存已处理的会话列表
   */
  async saveProcessedSessions(): Promise<void> {
    try {
      const dir = path.dirname(this.processedSessionsFile);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.processedSessionsFile,
        JSON.stringify(Array.from(this.processedSessions), null, 2)
      );
    } catch (error) {
      console.error('Failed to save processed sessions:', error);
    }
  }

  /**
   * 查找所有 Claude Code 项目目录
   */
  async findClaudeCodeProjects(): Promise<string[]> {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const claudeProjectsDir = path.join(homeDir, '.claude', 'projects');

    try {
      if (!existsSync(claudeProjectsDir)) {
        return [];
      }

      const entries = await fs.readdir(claudeProjectsDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(claudeProjectsDir, entry.name));
    } catch (error) {
      console.error('Failed to find Claude Code projects:', error);
      return [];
    }
  }

  /**
   * 查找项目中的所有会话文件
   */
  async findSessionFiles(projectDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(projectDir);
      return files
        .filter(file => file.endsWith('.jsonl') && !file.includes('.lock'))
        .map(file => path.join(projectDir, file));
    } catch (error) {
      console.error(`Failed to read project directory ${projectDir}:`, error);
      return [];
    }
  }

  /**
   * 解析 Claude Code 会话文件
   */
  async parseSessionFile(filePath: string): Promise<UnifiedConversation | null> {
    try {
      // 检查是否已处理
      if (this.processedSessions.has(filePath)) {
        return null;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        return null;
      }

      const messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> = [];
      let sessionId = '';
      let sessionTimestamp = '';
      let projectName = '';

      for (const line of lines) {
        try {
          const record: ClaudeCodeMessage = JSON.parse(line);

          // 提取会话元数据
          if (record.type === 'session') {
            sessionId = record.id || '';
            sessionTimestamp = record.timestamp || new Date().toISOString();
            projectName = record.cwd?.split('/').pop() || 'unknown';
          }

          // 提取用户和助手消息
          if (record.type === 'message' && record.role) {
            if (record.role === 'user' || record.role === 'assistant') {
              const content = this.extractContent(record.content);
              if (content && content.length > 10) {
                messages.push({
                  role: record.role as 'user' | 'assistant',
                  content,
                  timestamp: record.timestamp || new Date().toISOString(),
                });
              }
            }
          }
        } catch (parseError) {
          // 跳过无法解析的行
          continue;
        }
      }

      // 过滤太短的会话
      if (messages.length < 2) {
        return null;
      }

      const totalContent = messages.map(m => m.content).join(' ');
      if (totalContent.length < 100) {
        return null;
      }

      return {
        id: sessionId || path.basename(filePath, '.jsonl'),
        source: 'claude-code',
        timestamp: sessionTimestamp || new Date().toISOString(),
        messages,
        metadata: {
          project: projectName,
          sessionFile: filePath,
          totalMessages: messages.length,
        },
      };
    } catch (error) {
      console.error(`Failed to parse session file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 提取消息内容
   */
  private extractContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }
          if (item.type === 'text' && item.text) {
            return item.text;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    if (content?.text) {
      return content.text;
    }

    return '';
  }

  /**
   * 标记会话为已处理
   */
  markAsProcessed(filePath: string): void {
    this.processedSessions.add(filePath);
  }

  /**
   * 获取所有未处理的 Claude Code 对话
   */
  async getUnprocessedConversations(): Promise<UnifiedConversation[]> {
    await this.initialize();

    const conversations: UnifiedConversation[] = [];
    const projects = await this.findClaudeCodeProjects();

    for (const projectDir of projects) {
      const sessionFiles = await this.findSessionFiles(projectDir);

      for (const sessionFile of sessionFiles) {
        const conversation = await this.parseSessionFile(sessionFile);
        if (conversation) {
          conversations.push(conversation);
          this.markAsProcessed(sessionFile);
        }
      }
    }

    if (conversations.length > 0) {
      await this.saveProcessedSessions();
    }

    return conversations;
  }

  /**
   * 将 Claude Code 对话转换为 OpenClaw 格式（兼容现有处理流程）
   */
  convertToOpenClawFormat(conversation: UnifiedConversation): string {
    const lines: string[] = [];

    // 添加会话元数据
    lines.push(
      JSON.stringify({
        type: 'session',
        version: 3,
        id: conversation.id,
        timestamp: conversation.timestamp,
        cwd: conversation.metadata.project || 'claude-code',
        source: 'claude-code',
      })
    );

    // 添加消息
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      lines.push(
        JSON.stringify({
          type: 'message',
          id: `msg-${i}`,
          parentId: i > 0 ? `msg-${i - 1}` : null,
          timestamp: msg.timestamp,
          message: {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: msg.content,
              },
            ],
          },
        })
      );
    }

    return lines.join('\n');
  }

  /**
   * 导出 Claude Code 对话到 OpenClaw 会话目录
   */
  async exportToOpenClaw(conversation: UnifiedConversation): Promise<string> {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const openclawSessionsDir = path.join(homeDir, '.openclaw', 'agents', 'main', 'sessions');

    await fs.mkdir(openclawSessionsDir, { recursive: true });

    const fileName = `claude-code-${conversation.id}-${Date.now()}.jsonl`;
    const filePath = path.join(openclawSessionsDir, fileName);

    const content = this.convertToOpenClawFormat(conversation);
    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    totalProjects: number;
    totalSessions: number;
    processedSessions: number;
    unprocessedSessions: number;
  }> {
    await this.initialize();

    const projects = await this.findClaudeCodeProjects();
    let totalSessions = 0;

    for (const projectDir of projects) {
      const sessionFiles = await this.findSessionFiles(projectDir);
      totalSessions += sessionFiles.length;
    }

    return {
      totalProjects: projects.length,
      totalSessions,
      processedSessions: this.processedSessions.size,
      unprocessedSessions: Math.max(0, totalSessions - this.processedSessions.size),
    };
  }
}

// 导出单例
export const claudeCodeAdapter = new ClaudeCodeAdapter();
