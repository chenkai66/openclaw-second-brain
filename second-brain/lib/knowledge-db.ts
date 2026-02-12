import fs from 'fs';
import path from 'path';

interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  relatedLogs: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
  similarityHash: string; // For detecting similar content
}

export class KnowledgeDB {
  private dbPath: string;
  
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'data', 'knowledge-db.json');
    this.ensureDbExists();
  }
  
  private ensureDbExists(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2));
    }
  }
  
  async getAllEntries(): Promise<KnowledgeEntry[]> {
    const data = fs.readFileSync(this.dbPath, 'utf8');
    return JSON.parse(data);
  }
  
  async getEntryById(id: string): Promise<KnowledgeEntry | null> {
    const entries = await this.getAllEntries();
    return entries.find(entry => entry.id === id) || null;
  }
  
  async createEntry(entry: Omit<KnowledgeEntry, 'version' | 'similarityHash'>): Promise<KnowledgeEntry> {
    const entries = await this.getAllEntries();
    
    // Generate similarity hash based on content and title
    const similarityHash = this.generateSimilarityHash(entry.title, entry.content);
    
    const newEntry: KnowledgeEntry = {
      ...entry,
      version: 1,
      similarityHash,
      id: entry.id || this.generateId(entry.title)
    };
    
    entries.push(newEntry);
    fs.writeFileSync(this.dbPath, JSON.stringify(entries, null, 2));
    
    return newEntry;
  }
  
  async updateEntry(id: string, updates: Partial<Omit<KnowledgeEntry, 'id' | 'version'>>): Promise<KnowledgeEntry | null> {
    const entries = await this.getAllEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const oldEntry = entries[index];
    const similarityHash = this.generateSimilarityHash(
      updates.title || oldEntry.title,
      updates.content || oldEntry.content
    );
    
    const updatedEntry: KnowledgeEntry = {
      ...oldEntry,
      ...updates,
      similarityHash,
      version: oldEntry.version + 1,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    entries[index] = updatedEntry;
    fs.writeFileSync(this.dbPath, JSON.stringify(entries, null, 2));
    
    return updatedEntry;
  }
  
  async findSimilarEntries(threshold: number = 0.8): Promise<Array<{entry1: KnowledgeEntry, entry2: KnowledgeEntry, similarity: number}>> {
    const entries = await this.getAllEntries();
    const similarPairs: Array<{entry1: KnowledgeEntry, entry2: KnowledgeEntry, similarity: number}> = [];
    
    // Simple similarity calculation based on shared tags and title/content overlap
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const similarity = this.calculateSimilarity(entries[i], entries[j]);
        if (similarity >= threshold) {
          similarPairs.push({
            entry1: entries[i],
            entry2: entries[j],
            similarity
          });
        }
      }
    }
    
    return similarPairs;
  }
  
  private calculateSimilarity(entry1: KnowledgeEntry, entry2: KnowledgeEntry): number {
    // Calculate tag overlap
    const commonTags = entry1.tags.filter(tag => entry2.tags.includes(tag)).length;
    const totalTags = Math.max(entry1.tags.length, entry2.tags.length);
    const tagSimilarity = totalTags > 0 ? commonTags / totalTags : 0;
    
    // Calculate title/content similarity (simplified)
    const title1Words = entry1.title.toLowerCase().split(/\s+/);
    const title2Words = entry2.title.toLowerCase().split(/\s+/);
    const commonTitleWords = title1Words.filter(word => title2Words.includes(word)).length;
    const titleSimilarity = Math.max(title1Words.length, title2Words.length) > 0 ? 
      commonTitleWords / Math.max(title1Words.length, title2Words.length) : 0;
    
    // Weighted average
    return (tagSimilarity * 0.6) + (titleSimilarity * 0.4);
  }
  
  private generateSimilarityHash(title: string, content: string): string {
    // Simple hash generation for similarity detection
    const combined = (title + content).toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  private generateId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  async mergeEntries(entry1Id: string, entry2Id: string): Promise<KnowledgeEntry | null> {
    const entry1 = await this.getEntryById(entry1Id);
    const entry2 = await this.getEntryById(entry2Id);
    
    if (!entry1 || !entry2) {
      return null;
    }
    
    // Merge logic: keep the more recent/complete entry as base
    const baseEntry = entry1.updatedAt >= entry2.updatedAt ? entry1 : entry2;
    const otherEntry = entry1.updatedAt >= entry2.updatedAt ? entry2 : entry1;
    
    // Merge tags (remove duplicates)
    const mergedTags = [...new Set([...baseEntry.tags, ...otherEntry.tags])];
    
    // Merge related logs
    const mergedRelatedLogs = [...new Set([...baseEntry.relatedLogs, ...otherEntry.relatedLogs])];
    
    // Merge content intelligently (avoid duplication)
    let mergedContent = baseEntry.content;
    if (!baseEntry.content.includes(otherEntry.content)) {
      mergedContent += '\n\n---\n\n' + otherEntry.content;
    }
    
    // Update the base entry
    const updatedEntry = await this.updateEntry(baseEntry.id, {
      title: baseEntry.title, // Keep original title
      content: mergedContent,
      tags: mergedTags,
      relatedLogs: mergedRelatedLogs
    });
    
    // Delete the other entry
    await this.deleteEntry(otherEntry.id);
    
    return updatedEntry;
  }
  
  async deleteEntry(id: string): Promise<boolean> {
    const entries = await this.getAllEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    if (filteredEntries.length === entries.length) {
      return false; // Entry not found
    }
    
    fs.writeFileSync(this.dbPath, JSON.stringify(filteredEntries, null, 2));
    return true;
  }
  
  async getEntriesByTag(tag: string): Promise<KnowledgeEntry[]> {
    const entries = await this.getAllEntries();
    return entries.filter(entry => entry.tags.includes(tag));
  }
  
  async compressDaily(): Promise<{merged: number, deleted: number}> {
    // Find similar entries
    const similarPairs = await this.findSimilarEntries(0.85); // High threshold for merging
    
    let mergedCount = 0;
    let deletedCount = 0;
    
    // Process similar pairs
    for (const pair of similarPairs) {
      try {
        await this.mergeEntries(pair.entry1.id, pair.entry2.id);
        mergedCount++;
        deletedCount++; // One entry gets deleted during merge
      } catch (error) {
        console.error('Error merging entries:', error);
      }
    }
    
    return { merged: mergedCount, deleted: deletedCount };
  }
}