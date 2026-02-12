import { ContentCompression } from './content-compression';

export class AIOrganizer {
  private compression: ContentCompression;

  constructor() {
    this.compression = new ContentCompression();
  }

  /**
   * Generate a comprehensive summary with multiple levels of detail
   */
  async generateSummary(content: string): Promise<{
    brief: string;
    detailed: string;
    keyPoints: string[];
  }> {
    // In a real implementation, this would call an actual AI API
    // For now, we'll simulate intelligent summarization
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Brief summary (1-2 sentences)
    const brief = sentences.slice(0, 2).join('. ') + '.';
    
    // Detailed summary (first 50% of content)
    const detailedSentenceCount = Math.min(Math.ceil(sentences.length * 0.5), sentences.length);
    const detailed = sentences.slice(0, detailedSentenceCount).join('. ') + '.';
    
    // Key points extraction
    const keyPoints = sentences
      .filter((sentence, index) => index < 5 && sentence.trim().length > 20)
      .map(sentence => sentence.trim() + '.');
    
    return { brief, detailed, keyPoints };
  }

  /**
   * Extract intelligent tags from content
   */
  async extractTags(content: string): Promise<string[]> {
    // Simulate intelligent tag extraction
    const commonTags = ['second-brain', 'knowledge-management', 'ai', 'automation'];
    const contentWords = content.toLowerCase().split(/\s+/);
    
    // Extract potential tags from content
    const potentialTags = contentWords
      .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word))
      .slice(0, 3);
    
    return [...commonTags, ...potentialTags].slice(0, 6);
  }

  /**
   * Generate a semantic slug from title
   */
  async generateSlug(title: string): Promise<string> {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate an intelligent title from content
   */
  async generateTitle(content: string): Promise<string> {
    // Extract first meaningful sentence and make it title case
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length === 0) {
      return 'Knowledge Note';
    }
    
    const firstSentence = sentences[0].trim();
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }

  /**
   * Check if content is similar enough to merge with existing knowledge
   */
  async shouldMergeContent(newContent: string, existingContent: string, threshold: number = 0.7): Promise<boolean> {
    // Simple similarity check - in real implementation would use semantic similarity
    const newWords = new Set(newContent.toLowerCase().split(/\s+/));
    const existingWords = new Set(existingContent.toLowerCase().split(/\s+/));
    
    const intersection = [...newWords].filter(word => existingWords.has(word)).length;
    const union = new Set([...newWords, ...existingWords]).size;
    
    const similarity = union > 0 ? intersection / union : 0;
    return similarity >= threshold;
  }

  /**
   * Merge similar content intelligently
   */
  async mergeContent(existingContent: string, newContent: string): Promise<string> {
    // Combine content while avoiding duplication
    const existingSentences = existingContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const newSentences = newContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Keep existing content and append only new unique sentences
    const mergedSentences = [...existingSentences];
    for (const newSentence of newSentences) {
      const isNew = !existingSentences.some(existing => 
        this.calculateSentenceSimilarity(existing, newSentence) < 0.8
      );
      if (isNew) {
        mergedSentences.push(newSentence);
      }
    }
    
    return mergedSentences.join('. ') + '.';
  }

  /**
   * Calculate sentence similarity (simple word overlap)
   */
  private calculateSentenceSimilarity(s1: string, s2: string): number {
    const words1 = new Set(s1.toLowerCase().split(/\s+/));
    const words2 = new Set(s2.toLowerCase().split(/\s+/));
    
    const intersection = [...words1].filter(word => words2.has(word)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Identify topics that should be extracted as separate notes
   */
  async identifyTopicsForExtraction(conversations: Array<{ id: string; content: string; timestamp: string }>): Promise<string[]> {
    // Group conversations by potential topics
    const allContent = conversations.map(c => c.content).join(' ');
    const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Extract potential topics (first few meaningful sentences)
    return sentences.slice(0, 3).map(sentence => sentence.trim());
  }

  /**
   * Generate comprehensive note metadata
   */
  async generateNoteMetadata(topic: string, content: string): Promise<{
    slug: string;
    title: string;
    tags: string[];
    briefSummary: string;
    detailedSummary: string;
  }> {
    const title = await this.generateTitle(topic);
    const slug = await this.generateSlug(title);
    const tags = await this.extractTags(content);
    const { brief, detailed } = await this.generateSummary(content);
    
    return {
      slug,
      title,
      tags,
      briefSummary: brief,
      detailedSummary: detailed
    };
  }
}