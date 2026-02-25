/**
 * 对话总结系统 - 摘要生成器
 * 负责生成单对话、主题和领域的摘要
 */

import {
  Conversation,
  Topic,
  Domain,
  RawConversation,
  SummaryGenerationResult,
} from './types';
import { llmClient } from './llm-client';
import { configManager } from './config';
import {
  generateId,
  calculateHash,
  countWords,
  countCodeBlocks,
  normalizeKeyword,
} from './utils';

export class SummaryGenerator {
  /**
   * 生成单个对话的摘要
   */
  async generateConversationSummary(
    rawConversation: RawConversation
  ): Promise<SummaryGenerationResult> {
    const startTime = Date.now();
    const config = configManager.getProcessingConfig();
    let retryCount = 0;

    try {
      // 验证对话长度
      if (rawConversation.content.length < config.min_conversation_length) {
        return {
          success: false,
          error: 'Conversation too short',
          retry_count: 0,
          duration_ms: Date.now() - startTime,
        };
      }

      // 生成摘要
      const summary = await llmClient.generateConversationSummary(
        rawConversation.content,
        {
          maxLength: config.max_summary_length,
          language: 'Chinese',
        }
      );

      // 提取关键词
      let keywords: string[] = [];
      if (config.enable_keyword_extraction) {
        keywords = await llmClient.extractKeywords(rawConversation.content, {
          maxKeywords: 10,
          language: 'English',
        });
        keywords = keywords.map(normalizeKeyword);
      }

      // 分析情感
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (config.enable_sentiment_analysis) {
        sentiment = await llmClient.analyzeSentiment(rawConversation.content);
      }

      return {
        success: true,
        summary,
        keywords,
        sentiment,
        retry_count: retryCount,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Failed to generate conversation summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retry_count: retryCount,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * 将原始对话转换为Conversation对象
   */
  async createConversation(
    rawConversation: RawConversation,
    summaryResult: SummaryGenerationResult
  ): Promise<Conversation | null> {
    if (!summaryResult.success || !summaryResult.summary) {
      return null;
    }

    const conversation: Conversation = {
      id: rawConversation.id,
      timestamp: rawConversation.timestamp,
      summary: summaryResult.summary,
      keywords: summaryResult.keywords || [],
      content_hash: calculateHash(rawConversation.content),
      related_notes: [],
      related_logs: [],
      metadata: {
        word_count: countWords(rawConversation.content),
        code_blocks: countCodeBlocks(rawConversation.content),
        has_solution: this.detectSolution(rawConversation.content),
        sentiment: summaryResult.sentiment || 'neutral',
      },
      raw_content: rawConversation.content,
    };

    return conversation;
  }

  /**
   * 生成主题摘要
   */
  async generateTopicSummary(topic: Topic): Promise<string> {
    if (topic.conversations.length === 0) {
      return '暂无对话';
    }

    if (topic.conversations.length === 1) {
      return topic.conversations[0].summary;
    }

    // 收集所有对话摘要
    const conversationSummaries = topic.conversations.map((conv) => conv.summary);

    // 调用LLM生成主题摘要
    const summary = await llmClient.generateTopicSummary(
      conversationSummaries,
      topic.name,
      {
        maxLength: 800,
      }
    );

    return summary;
  }

  /**
   * 生成领域摘要
   */
  async generateDomainSummary(domain: Domain): Promise<string> {
    if (domain.topics.length === 0) {
      return '暂无主题';
    }

    if (domain.topics.length === 1) {
      return domain.topics[0].summary;
    }

    // 收集所有主题摘要
    const topicSummaries = domain.topics.map((topic) => ({
      name: topic.name,
      summary: topic.summary,
    }));

    // 调用LLM生成领域摘要
    const summary = await llmClient.generateDomainSummary(
      topicSummaries,
      domain.name,
      {
        maxLength: 1000,
      }
    );

    return summary;
  }

  /**
   * 批量生成对话摘要
   */
  async generateBatchSummaries(
    rawConversations: RawConversation[]
  ): Promise<Array<{ conversation: Conversation | null; result: SummaryGenerationResult }>> {
    const results: Array<{
      conversation: Conversation | null;
      result: SummaryGenerationResult;
    }> = [];

    for (const rawConv of rawConversations) {
      const result = await this.generateConversationSummary(rawConv);
      const conversation = result.success
        ? await this.createConversation(rawConv, result)
        : null;

      results.push({ conversation, result });
    }

    return results;
  }

  /**
   * 更新主题摘要（当添加新对话时）
   */
  async updateTopicSummary(topic: Topic): Promise<Topic> {
    const updatedSummary = await this.generateTopicSummary(topic);

    return {
      ...topic,
      summary: updatedSummary,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * 更新领域摘要（当添加新主题时）
   */
  async updateDomainSummary(domain: Domain): Promise<Domain> {
    const updatedSummary = await this.generateDomainSummary(domain);

    return {
      ...domain,
      summary: updatedSummary,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * 创建新主题
   */
  createTopic(
    name: string,
    initialConversation?: Conversation
  ): Topic {
    const topic: Topic = {
      id: generateId('topic'),
      name,
      summary: initialConversation?.summary || '新主题',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      conversation_count: initialConversation ? 1 : 0,
      conversations: initialConversation ? [initialConversation] : [],
      keywords: initialConversation?.keywords || [],
    };

    return topic;
  }

  /**
   * 创建新领域
   */
  createDomain(name: string, initialTopic?: Topic): Domain {
    const domain: Domain = {
      id: generateId('domain'),
      name,
      summary: initialTopic?.summary || '新领域',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      topics: initialTopic ? [initialTopic] : [],
      keywords: initialTopic?.keywords || [],
    };

    return domain;
  }

  /**
   * 合并主题关键词
   */
  mergeTopicKeywords(topic: Topic): string[] {
    const allKeywords = topic.conversations.flatMap((conv) => conv.keywords);
    const keywordFrequency = new Map<string, number>();

    for (const keyword of allKeywords) {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    }

    // 按频率排序，取前10个
    return Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * 合并领域关键词
   */
  mergeDomainKeywords(domain: Domain): string[] {
    const allKeywords = domain.topics.flatMap((topic) => topic.keywords || []);
    const keywordFrequency = new Map<string, number>();

    for (const keyword of allKeywords) {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    }

    // 按频率排序，取前15个
    return Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword]) => keyword);
  }

  /**
   * 检测对话是否包含解决方案
   */
  private detectSolution(content: string): boolean {
    const solutionKeywords = [
      '解决',
      '修复',
      '成功',
      'solved',
      'fixed',
      'working',
      'success',
      '完成',
      '实现',
    ];

    const lowerContent = content.toLowerCase();
    return solutionKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * 提取主题名称建议
   */
  async suggestTopicName(conversations: Conversation[]): Promise<string> {
    if (conversations.length === 0) return '未命名主题';
    if (conversations.length === 1) {
      // 从摘要中提取关键短语
      const summary = conversations[0].summary;
      const words = summary.split(/[，。、]/)[0]; // 取第一句话
      return words.substring(0, 30);
    }

    // 多个对话，使用最常见的关键词组合
    const allKeywords = conversations.flatMap((conv) => conv.keywords);
    const keywordFrequency = new Map<string, number>();

    for (const keyword of allKeywords) {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    }

    const topKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);

    return topKeywords.join(' & ');
  }

  /**
   * 提取领域名称建议
   */
  async suggestDomainName(topics: Topic[]): Promise<string> {
    if (topics.length === 0) return '未命名领域';
    if (topics.length === 1) return topics[0].name;

    // 多个主题，找出共同的技术栈或领域
    const allKeywords = topics.flatMap((topic) => topic.keywords || []);
    const keywordFrequency = new Map<string, number>();

    for (const keyword of allKeywords) {
      keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
    }

    // 找出出现在多个主题中的关键词
    const commonKeywords = Array.from(keywordFrequency.entries())
      .filter(([_, count]) => count >= Math.ceil(topics.length / 2))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([keyword]) => keyword);

    if (commonKeywords.length > 0) {
      return commonKeywords.join(' & ');
    }

    // 如果没有共同关键词，使用第一个主题的名称
    return topics[0].name;
  }

  /**
   * 验证摘要质量
   */
  validateSummary(summary: string, originalContent: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 检查摘要长度
    if (summary.length < 20) {
      issues.push('Summary too short');
    }

    const config = configManager.getProcessingConfig();
    if (summary.length > config.max_summary_length) {
      issues.push('Summary too long');
    }

    // 检查摘要是否与原内容相关
    const summaryWords = new Set(summary.toLowerCase().split(/\s+/));
    const contentWords = new Set(originalContent.toLowerCase().split(/\s+/));
    const overlap = [...summaryWords].filter((word) => contentWords.has(word)).length;
    const overlapRatio = overlap / summaryWords.size;

    if (overlapRatio < 0.1) {
      issues.push('Summary may not be relevant to original content');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// 导出单例实例
export const summaryGenerator = new SummaryGenerator();

