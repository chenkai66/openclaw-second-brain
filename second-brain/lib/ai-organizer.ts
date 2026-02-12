export class AIOrganizer {
  // Generate a semantic slug from title
  static async generateSlug(title: string): Promise<string> {
    // Simple slug generation - replace spaces with hyphens, remove special characters
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Extract topics from conversation content
  static extractTopics(content: string): string[] {
    const text = content.toLowerCase();
    const topics: string[] = [];

    // System-related topics
    if (text.includes('server') || text.includes('部署') || text.includes('启动')) {
      topics.push('server-deployment');
    }
    if (text.includes('cron') || text.includes('定时') || text.includes('自动')) {
      topics.push('cron-jobs');
    }
    if (text.includes('问题') || text.includes('修复') || text.includes('troubleshoot')) {
      topics.push('troubleshooting');
    }
    if (text.includes('知识') || text.includes('brain') || text.includes('第二大脑')) {
      topics.push('second-brain', 'knowledge-management');
    }
    if (text.includes('公网') || text.includes('public') || text.includes('访问')) {
      topics.push('public-access');
    }
    if (text.includes('api') || text.includes('接口')) {
      topics.push('api');
    }
    if (text.includes('前端') || text.includes('界面') || text.includes('web')) {
      topics.push('web-interface');
    }
    if (text.includes('同步') || text.includes('sync')) {
      topics.push('sync-task');
    }
    if (text.includes('修复') || text.includes('fix') || text.includes('更新')) {
      topics.push('system-fix');
    }

    // Remove duplicates
    return [...new Set(topics)];
  }

  // Generate summary from content
  static generateSummary(content: string): string {
    // Simple summary - take first sentence or truncate
    const sentences = content.split(/[.!?]+/);
    if (sentences.length > 0 && sentences[0].trim().length > 0) {
      return sentences[0].trim() + '.';
    }
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  }
}