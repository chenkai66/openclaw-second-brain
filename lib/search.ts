import fs from 'fs';
import path from 'path';

export interface SearchResult {
  type: 'note' | 'log';
  slug: string;
  title: string;
  excerpt: string;
  matches: number;
  date?: string;
  tags?: string[];
}

export class SearchEngine {
  private contentDir: string;
  private logsDir: string;
  private notesDir: string;

  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.logsDir = path.join(this.contentDir, 'logs');
    this.notesDir = path.join(this.contentDir, 'notes');
  }

  /**
   * 搜索笔记和日志
   * @param query 搜索关键词
   * @param options 搜索选项
   */
  async search(
    query: string,
    options: {
      type?: 'note' | 'log' | 'all';
      tags?: string[];
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { type = 'all', tags = [], limit = 50 } = options;
    const results: SearchResult[] = [];

    // 标准化查询
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return results;
    }

    // 搜索笔记
    if (type === 'note' || type === 'all') {
      const noteResults = await this.searchInDirectory(
        this.notesDir,
        normalizedQuery,
        'note',
        tags
      );
      results.push(...noteResults);
    }

    // 搜索日志
    if (type === 'log' || type === 'all') {
      const logResults = await this.searchInDirectory(
        this.logsDir,
        normalizedQuery,
        'log',
        tags
      );
      results.push(...logResults);
    }

    // 按匹配度排序
    results.sort((a, b) => b.matches - a.matches);

    // 限制结果数量
    return results.slice(0, limit);
  }

  /**
   * 在指定目录中搜索
   */
  private async searchInDirectory(
    dir: string,
    query: string,
    type: 'note' | 'log',
    tags: string[]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // 解析 frontmatter 和内容
      const { metadata, body } = this.parseMarkdown(content);

      // 标签过滤
      if (tags.length > 0) {
        const fileTags = metadata.tags || [];
        const hasMatchingTag = tags.some(tag => 
          fileTags.some((fileTag: string) => 
            fileTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) continue;
      }

      // 搜索匹配
      const matches = this.countMatches(content, query);
      if (matches === 0) continue;

      // 提取摘要
      const excerpt = this.extractExcerpt(body, query);

      results.push({
        type,
        slug: file.replace('.md', ''),
        title: metadata.title || file.replace('.md', ''),
        excerpt,
        matches,
        date: metadata.date || metadata.created,
        tags: metadata.tags || [],
      });
    }

    return results;
  }

  /**
   * 解析 Markdown 文件
   */
  private parseMarkdown(content: string): {
    metadata: Record<string, any>;
    body: string;
  } {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      return { metadata: {}, body: content };
    }

    const frontmatterContent = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    const metadata: Record<string, any> = {};

    // 解析 frontmatter
    const lines = frontmatterContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayContent = value.slice(1, -1);
          metadata[key] = arrayContent
            .split(',')
            .map(item => item.trim().replace(/"/g, ''))
            .filter(item => item);
        } else {
          metadata[key] = value.replace(/"/g, '');
        }
      }
    }

    return { metadata, body };
  }

  /**
   * 计算匹配次数
   */
  private countMatches(text: string, query: string): number {
    const normalizedText = text.toLowerCase();
    const words = query.split(/\s+/);
    let count = 0;

    for (const word of words) {
      const regex = new RegExp(word, 'gi');
      const matches = normalizedText.match(regex);
      count += matches ? matches.length : 0;
    }

    return count;
  }

  /**
   * 提取包含关键词的摘要
   */
  private extractExcerpt(text: string, query: string, maxLength: number = 150): string {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // 找到第一个匹配位置
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) {
      // 如果没有找到，返回开头
      return text.substring(0, maxLength).trim() + '...';
    }

    // 提取匹配位置前后的文本
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 100);
    
    let excerpt = text.substring(start, end).trim();
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    const tagCounts = new Map<string, number>();

    // 统计笔记标签
    if (fs.existsSync(this.notesDir)) {
      const files = fs.readdirSync(this.notesDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const content = fs.readFileSync(path.join(this.notesDir, file), 'utf8');
        const { metadata } = this.parseMarkdown(content);
        
        if (metadata.tags) {
          for (const tag of metadata.tags) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        }
      }
    }

    // 统计日志主题
    if (fs.existsSync(this.logsDir)) {
      const files = fs.readdirSync(this.logsDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const content = fs.readFileSync(path.join(this.logsDir, file), 'utf8');
        const { metadata } = this.parseMarkdown(content);
        
        if (metadata.topics) {
          for (const topic of metadata.topics) {
            tagCounts.set(topic, (tagCounts.get(topic) || 0) + 1);
          }
        }
      }
    }

    // 转换为数组并排序
    const tags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return tags;
  }
}

