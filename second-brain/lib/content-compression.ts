import { KnowledgeEntry } from './knowledge-db';
import * as fs from 'fs';
import * as path from 'path';

export class ContentCompression {
  private knowledgeDbPath: string;
  private similarityThreshold: number = 0.85; // 85% similarity threshold for merging
  private maxCompressionRatio: number = 0.7; // Don't compress more than 70% of original content

  constructor() {
    this.knowledgeDbPath = path.join(process.cwd(), 'data', 'knowledge-db.json');
  }

  /**
   * Calculate similarity between two texts using a simple algorithm
   * In a real implementation, this would use more sophisticated NLP techniques
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Generate a merged title from similar titles
   */
  private generateMergedTitle(titles: string[]): string {
    // Find common words and create a concise merged title
    const allWords = titles.flatMap(title => title.split(/\s+/));
    const wordCounts = new Map<string, number>();
    
    allWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // Get words that appear in most titles (at least 50% of titles)
    const commonWords = Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= Math.ceil(titles.length / 2))
      .map(([word]) => word);
    
    if (commonWords.length > 0) {
      return commonWords.join(' ');
    }
    
    // Fallback: use the longest title
    return titles.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  /**
   * Merge similar content while preserving important information
   */
  private mergeContent(entries: KnowledgeEntry[]): KnowledgeEntry {
    const firstEntry = entries[0];
    const allSummaries = entries.map(entry => entry.summary).join(' ');
    const allContent = entries.map(entry => entry.content).join('\n\n---\n\n');
    const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)));
    const allSources = Array.from(new Set(entries.flatMap(entry => entry.sources)));

    // Generate merged title
    const titles = entries.map(entry => entry.title);
    const mergedTitle = this.generateMergedTitle(titles);

    // Create merged summary (keep it concise but informative)
    const mergedSummary = allSummaries.length > 500 
      ? allSummaries.substring(0, 500) + '...' 
      : allSummaries;

    // Create merged content with reasonable length limit
    const maxLength = Math.min(
      allContent.length * this.maxCompressionRatio,
      2000 // Maximum 2000 characters for merged content
    );
    const mergedContent = allContent.length > maxLength 
      ? allContent.substring(0, maxLength) + '\n\n[Content truncated due to merging]'
      : allContent;

    return {
      id: firstEntry.id, // Keep the original ID
      title: mergedTitle,
      summary: mergedSummary,
      content: mergedContent,
      tags: allTags,
      sources: allSources,
      createdAt: firstEntry.createdAt,
      updatedAt: new Date().toISOString(),
      version: firstEntry.version + entries.length - 1, // Increment version
      mergedFrom: entries.map(entry => entry.id)
    };
  }

  /**
   * Check for similar entries and merge them if necessary
   */
  async compressAndMerge(): Promise<{ merged: number, total: number }> {
    try {
      // Read current knowledge database
      const knowledgeDbContent = await fs.promises.readFile(this.knowledgeDbPath, 'utf8');
      const knowledgeEntries: KnowledgeEntry[] = JSON.parse(knowledgeDbContent);

      if (knowledgeEntries.length <= 1) {
        return { merged: 0, total: knowledgeEntries.length };
      }

      const mergedEntries: KnowledgeEntry[] = [];
      const processedIds = new Set<string>();
      let mergeCount = 0;

      // Group similar entries
      for (let i = 0; i < knowledgeEntries.length; i++) {
        const entry = knowledgeEntries[i];
        
        if (processedIds.has(entry.id)) continue;

        // Find similar entries
        const similarEntries = [entry];
        for (let j = i + 1; j < knowledgeEntries.length; j++) {
          const otherEntry = knowledgeEntries[j];
          
          if (processedIds.has(otherEntry.id)) continue;
          
          // Check similarity based on title and summary
          const titleSimilarity = this.calculateSimilarity(entry.title, otherEntry.title);
          const summarySimilarity = this.calculateSimilarity(entry.summary, otherEntry.summary);
          
          const overallSimilarity = (titleSimilarity + summarySimilarity) / 2;
          
          if (overallSimilarity >= this.similarityThreshold) {
            similarEntries.push(otherEntry);
            processedIds.add(otherEntry.id);
          }
        }
        
        processedIds.add(entry.id);

        if (similarEntries.length > 1) {
          // Merge similar entries
          const mergedEntry = this.mergeContent(similarEntries);
          mergedEntries.push(mergedEntry);
          mergeCount += similarEntries.length - 1;
        } else {
          // Keep single entry as is
          mergedEntries.push(entry);
        }
      }

      // Save compressed database
      await fs.promises.writeFile(
        this.knowledgeDbPath,
        JSON.stringify(mergedEntries, null, 2),
        'utf8'
      );

      console.log(`Compression completed: ${mergeCount} entries merged, ${mergedEntries.length} total remaining`);
      
      return { merged: mergeCount, total: mergedEntries.length };

    } catch (error) {
      console.error('Error during compression:', error);
      throw error;
    }
  }

  /**
   * Daily compression task that runs once per day
   */
  async runDailyCompression(): Promise<void> {
    try {
      const stats = await this.compressAndMerge();
      
      // Log compression results
      console.log(`Daily compression completed: ${stats.merged} entries merged`);
      
      // Update knowledge graph after compression
      // This would trigger knowledge graph regeneration
      
    } catch (error) {
      console.error('Daily compression failed:', error);
    }
  }
}