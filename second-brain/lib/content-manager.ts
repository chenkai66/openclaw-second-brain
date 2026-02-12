import fs from 'fs';
import path from 'path';

export class ContentManager {
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
    
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1];
      const titleMatch = frontmatterContent.match(/title:\s*(.*)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      const relatedLogsMatch = frontmatterContent.match(/related_logs:\s*\[(.*?)\]/);
      if (relatedLogsMatch && relatedLogsMatch[1].trim()) {
        relatedLogs = relatedLogsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
      }
    }
    
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

  async getAllLogs(): Promise<Array<{ id: string; content: string }>> {
    const files = fs.readdirSync(this.logsDir);
    const logs: Array<{ id: string; content: string }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.logsDir, file), 'utf8');
        const id = file.replace('.md', '');
        logs.push({ id, content });
      }
    }
    
    // Sort by date (newest first)
    logs.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    return logs;
  }

  async getAllNotes(): Promise<Array<{ id: string; content: string }>> {
    const files = fs.readdirSync(this.notesDir);
    const notes: Array<{ id: string; content: string }> = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(this.notesDir, file), 'utf8');
        const id = file.replace('.md', '');
        notes.push({ id, content });
      }
    }
    
    return notes;
  }

  async deleteNote(slug: string): Promise<void> {
    const filePath = path.join(this.notesDir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}