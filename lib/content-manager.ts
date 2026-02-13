import fs from 'fs';
import path from 'path';

// Helper function to parse the custom date format (YYYY-MM-DD-HH-mm-ss)
function parseCustomDate(dateString: string): Date {
  // Handle standard date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Handle custom format (YYYY-MM-DD-HH-mm-ss)
  const parts = dateString.split('-');
  if (parts.length >= 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JS
    const day = parseInt(parts[2]);
    const hour = parts.length > 3 ? parseInt(parts[3]) : 0;
    const minute = parts.length > 4 ? parseInt(parts[4]) : 0;
    const second = parts.length > 5 ? parseInt(parts[5]) : 0;
    
    return new Date(year, month, day, hour, minute, second);
  }
  
  // Fallback to current date if parsing fails
  return new Date();
}

// Helper function to format date for display
function formatDateForDisplay(date: Date): string {
  return date.toISOString().split('T')[0];
}

export class ContentManager {
  private contentDir: string;
  private logsDir: string;
  private notesDir: string;

  private reportsDir: string;

  constructor() {
    this.contentDir = path.join(process.cwd(), 'content');
    this.logsDir = path.join(this.contentDir, 'logs');
    this.notesDir = path.join(this.contentDir, 'notes');
    this.reportsDir = path.join(this.contentDir, 'reports');
    
    // Ensure directories exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    if (!fs.existsSync(this.notesDir)) {
      fs.mkdirSync(this.notesDir, { recursive: true });
    }
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async logExists(date: string): Promise<boolean> {
    const filePath = path.join(this.logsDir, `${date}.md`);
    return fs.existsSync(filePath);
  }

  async getLog(date: string): Promise<string> {
    const filePath = path.join(this.logsDir, `${date}.md`);
    return fs.readFileSync(filePath, 'utf8');
  }

  async createLog(date: string, content: string, summary: string = ''): Promise<void> {
    const frontmatter = `---
date: ${date}
type: daily-log
summary: "${summary}"
topics: []
ai_generated: true
---

# ${date}

${content}

> 此日志由系统自动生成。`;
    
    const filePath = path.join(this.logsDir, `${date}.md`);
    fs.writeFileSync(filePath, frontmatter);
  }

  async updateLog(date: string, content: string, summary: string): Promise<void> {
    // Extract existing frontmatter to preserve topics
    const existingContent = await this.getLog(date);
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
    let topics: string[] = [];
    
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1];
      const topicsMatch = frontmatterContent.match(/topics:\s*\[(.*?)\]/);
      if (topicsMatch && topicsMatch[1].trim()) {
        topics = topicsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      }
    }
    
    const frontmatter = `---
date: ${date}
type: daily-log
summary: "${summary}"
topics: [${topics.map(t => `"${t}"`).join(', ')}]
ai_generated: true
---

# ${date}

${content}

> 此日志由系统自动生成。`;
    
    const filePath = path.join(this.logsDir, `${date}.md`);
    fs.writeFileSync(filePath, frontmatter);
  }

  async noteExists(slug: string): Promise<boolean> {
    const filePath = path.join(this.notesDir, `${slug}.md`);
    return fs.existsSync(filePath);
  }

  async getNote(slug: string): Promise<string> {
    const filePath = path.join(this.notesDir, `${slug}.md`);
    return fs.readFileSync(filePath, 'utf8');
  }

  async createNote(slug: string, title: string, content: string, tags: string[], relatedLogs: string[]): Promise<void> {
    const frontmatter = `---
title: ${title}
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
related_logs: [${relatedLogs.map(log => `"${log}"`).join(', ')}]
ai_refined: true
---

# ${title}

${content}

> 本文档由 Clawdbot 在对话中自动生成并命名。`;
    
    const filePath = path.join(this.notesDir, `${slug}.md`);
    fs.writeFileSync(filePath, frontmatter);
  }

  async updateNote(slug: string, content: string, tags: string[]): Promise<void> {
    // Extract existing frontmatter to preserve other metadata
    const existingContent = await this.getNote(slug);
    const frontmatterMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
    let title = slug.replace(/-/g, ' ');
    let relatedLogs: string[] = [];
    let created = new Date().toISOString().split('T')[0];
    
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1];
      const titleMatch = frontmatterContent.match(/title:\s*(.*)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      const createdMatch = frontmatterContent.match(/created:\s*(.*)/);
      if (createdMatch) {
        created = createdMatch[1].trim();
      }
      
      const relatedLogsMatch = frontmatterContent.match(/related_logs:\s*\[(.*?)\]/);
      if (relatedLogsMatch && relatedLogsMatch[1].trim()) {
        relatedLogs = relatedLogsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      }
    }
    
    // Build the complete file content with frontmatter and user content
    const frontmatter = `---
title: ${title}
created: ${created}
updated: ${new Date().toISOString().split('T')[0]}
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
related_logs: [${relatedLogs.map(log => `"${log}"`).join(', ')}]
ai_refined: true
---

${content}`;
    
    const filePath = path.join(this.notesDir, `${slug}.md`);
    fs.writeFileSync(filePath, frontmatter);
  }

  // Parse frontmatter from markdown content
  private parseFrontmatter(content: string): Record<string, any> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }
    
    const frontmatterContent = frontmatterMatch[1];
    const metadata: Record<string, any> = {};
    
    // Parse date
    const dateMatch = frontmatterContent.match(/date:\s*(.*)/);
    if (dateMatch) {
      metadata.date = dateMatch[1].trim();
    }
    
    // Parse title
    const titleMatch = frontmatterContent.match(/title:\s*(.*)/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Parse summary
    const summaryMatch = frontmatterContent.match(/summary:\s*"([^"]*)"/);
    if (summaryMatch) {
      metadata.summary = summaryMatch[1];
    }
    
    // Parse created date
    const createdMatch = frontmatterContent.match(/created:\s*(.*)/);
    if (createdMatch) {
      metadata.created = createdMatch[1].trim();
    }
    
    // Parse tags
    const tagsMatch = frontmatterContent.match(/tags:\s*\[(.*?)\]/);
    if (tagsMatch && tagsMatch[1].trim()) {
      metadata.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
    }
    
    return metadata;
  }

  async getAllLogs(): Promise<Array<{ date: string; slug: string; content: string; metadata: Record<string, any> }>> {
    const files = fs.readdirSync(this.logsDir);
    const logs: Array<{ date: string; slug: string; content: string; metadata: Record<string, any> }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.logsDir, file), 'utf8');
        const slug = file.replace('.md', '');
        const metadata = this.parseFrontmatter(content);
        
        // Extract date from filename or metadata
        const date = metadata.date || slug;
        
        logs.push({ date, slug, content, metadata });
      }
    }
    
    // Sort by date (newest first)
    logs.sort((a, b) => {
      const dateA = parseCustomDate(a.slug).getTime();
      const dateB = parseCustomDate(b.slug).getTime();
      return dateB - dateA;
    });
    
    return logs;
  }

  async getAllNotes(): Promise<Array<{ slug: string; content: string; metadata: Record<string, any> }>> {
    const files = fs.readdirSync(this.notesDir);
    const notes: Array<{ slug: string; content: string; metadata: Record<string, any> }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.notesDir, file), 'utf8');
        const slug = file.replace('.md', '');
        const metadata = this.parseFrontmatter(content);
        notes.push({ slug, content, metadata });
      }
    }
    
    // Sort by creation date (newest first)
    notes.sort((a, b) => {
      const createdA = a.metadata.created ? new Date(a.metadata.created).getTime() : 0;
      const createdB = b.metadata.created ? new Date(b.metadata.created).getTime() : 0;
      return createdB - createdA;
    });
    
    return notes;
  }

  async deleteNote(slug: string): Promise<void> {
    const filePath = path.join(this.notesDir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async deleteLog(date: string): Promise<boolean> {
    const filePath = path.join(this.logsDir, `${date}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getAllReports(): Promise<Array<{ slug: string; content: string; metadata: Record<string, any> }>> {
    const files = fs.readdirSync(this.reportsDir);
    const reports: Array<{ slug: string; content: string; metadata: Record<string, any> }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.reportsDir, file), 'utf8');
        const slug = file.replace('.md', '');
        const metadata = this.parseFrontmatter(content);
        
        // Extract date from metadata or filename
        const date = metadata.date || slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
        if (date) {
          metadata.date = date;
        }
        
        reports.push({ slug, content, metadata });
      }
    }
    
    // Sort by date (newest first)
    reports.sort((a, b) => {
      const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
      const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
      return dateB - dateA;
    });
    
    return reports;
  }

  async getReport(slug: string): Promise<string> {
    const filePath = path.join(this.reportsDir, `${slug}.md`);
    return fs.readFileSync(filePath, 'utf8');
  }

  async reportExists(slug: string): Promise<boolean> {
    const filePath = path.join(this.reportsDir, `${slug}.md`);
    return fs.existsSync(filePath);
  }
}