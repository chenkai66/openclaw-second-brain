/**
 * 对话总结系统 - 对话处理器
 * 负责从数据源读取对话、生成摘要、分配主题、更新存储
 */

import fs from 'fs';
import path from 'path';
import {
  RawConversation,
  ProcessingError,
  ProcessingHistoryEntry,
  Conversation,
  Topic,
  Domain,
} from './types';
import { summaryStorage } from './summary-storage';
import { summaryGenerator } from './summary-generator';
import { llmClient } from './llm-client';
import { configManager } from './config';
import {
  generateId,
  formatDate,
  jaccardSimilarity,
  processConcurrent,
  timestamp,
} from './utils';

export class ConversationProcessor {
  /**
   * 从OpenClaw会话目录读取原始对话
   */
  async loadRawConversations(conversationSource?: string): Promise<RawConversation[]> {
    const source =
      conversationSource ||
      process.env.OPENCLAW_SESSIONS_PATH ||
      path.join(process.env.HOME || '', '.openclaw/agents/main/sessions');

    if (!fs.existsSync(source)) {
      console.warn(`Conversation source not found: ${source}`);
      return [];
    }

    const conversations: RawConversation[] = [];

    try {
      // 读取所有.jsonl文件
      const files = fs.readdirSync(source).filter((f) => f.endsWith('.jsonl'));

      for (const file of files) {
        const filePath = path.join(source, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            // 提取对话内容
            if (data.messages && Array.isArray(data.messages)) {
              const conversationText = data.messages
                .map((msg: any) => `${msg.role}: ${msg.content}`)
                .join('\n\n');

              conversations.push({
                id: data.id || generateId('conv'),
                timestamp: data.timestamp || new Date().toISOString(),
                content: conversationText,
                metadata: data.metadata || {},
              });
            }
          } catch (error) {
            console.warn(`Failed to parse line in ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load raw conversations:', error);
    }

    return conversations;
  }

  /**
   * 获取未处理的对话
   */
  async getUnprocessedConversations(): Promise<RawConversation[]> {
    const allConversations = await this.loadRawConversations();
    const metadata = summaryStorage.loadMetadata();
    const lastProcessedTimestamp = metadata.sync_state.last_sync_timestamp;

    // 过滤出新对话
    return allConversations.filter(
      (conv) => new Date(conv.timestamp) > new Date(lastProcessedTimestamp)
    );
  }

  /**
   * 处理单个对话
   */
  async processConversation(
    rawConversation: RawConversation
  ): Promise<{
    success: boolean;
    conversation: Conversation | null;
    error?: ProcessingError;
  }> {
    try {
      // 生成摘要
      const summaryResult = await summaryGenerator.generateConversationSummary(
        rawConversation
      );

      if (!summaryResult.success) {
        return {
          success: false,
          conversation: null,
          error: {
            conversation_id: rawConversation.id,
            error_type: 'SUMMARY_GENERATION_FAILED',
            error_message: summaryResult.error || 'Unknown error',
            timestamp: timestamp(),
            retry_count: summaryResult.retry_count,
          },
        };
      }

      // 创建Conversation对象
      const conversation = await summaryGenerator.createConversation(
        rawConversation,
        summaryResult
      );

      if (!conversation) {
        return {
          success: false,
          conversation: null,
          error: {
            conversation_id: rawConversation.id,
            error_type: 'CONVERSATION_CREATION_FAILED',
            error_message: 'Failed to create conversation object',
            timestamp: timestamp(),
            retry_count: 0,
          },
        };
      }

      // 分配到主题
      await this.assignConversationToTopic(conversation);

      return {
        success: true,
        conversation,
      };
    } catch (error) {
      return {
        success: false,
        conversation: null,
        error: {
          conversation_id: rawConversation.id,
          error_type: 'PROCESSING_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: timestamp(),
          retry_count: 0,
        },
      };
    }
  }

  /**
   * 批量处理对话
   */
  async processBatch(
    rawConversations: RawConversation[]
  ): Promise<ProcessingHistoryEntry> {
    const startTime = Date.now();
    const config = configManager.getProcessingConfig();

    const results = await processConcurrent(
      rawConversations,
      config.max_concurrent,
      (conv) => this.processConversation(conv)
    );

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    const errors = results.filter((r) => r.error).map((r) => r.error!);

    // 更新元数据
    const metadata = summaryStorage.loadMetadata();
    const historyEntry: ProcessingHistoryEntry = {
      timestamp: timestamp(),
      processed_count: rawConversations.length,
      success_count: successCount,
      error_count: errorCount,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };

    metadata.statistics.processing_history.push(historyEntry);
    metadata.sync_state.last_sync_timestamp = timestamp();
    if (rawConversations.length > 0) {
      metadata.sync_state.last_processed_conversation_id =
        rawConversations[rawConversations.length - 1].id;
    }

    summaryStorage.saveMetadata(metadata);
    summaryStorage.updateStatistics();

    return historyEntry;
  }

  /**
   * 将对话分配到主题
   */
  private async assignConversationToTopic(conversation: Conversation): Promise<void> {
    const allDomains = summaryStorage.getAllDomains();

    // 收集所有现有主题
    const allTopics: Array<{ domain: Domain; topic: Topic }> = [];
    for (const domain of allDomains) {
      for (const topic of domain.topics) {
        allTopics.push({ domain, topic });
      }
    }

    if (allTopics.length === 0) {
      // 没有现有主题，创建新的领域和主题
      await this.createNewDomainAndTopic(conversation);
      return;
    }

    // 查找最匹配的主题
    let bestMatch: { domain: Domain; topic: Topic; similarity: number } | null = null;

    for (const { domain, topic } of allTopics) {
      const topicKeywords = topic.keywords || [];
      const similarity = jaccardSimilarity(conversation.keywords, topicKeywords);

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { domain, topic, similarity };
      }
    }

    const config = configManager.getClusteringConfig();

    if (bestMatch && bestMatch.similarity >= config.similarity_threshold) {
      // 添加到现有主题
      summaryStorage.addConversationToTopic(bestMatch.topic.id, conversation);

      // 更新主题摘要
      const updatedTopic = await summaryGenerator.updateTopicSummary(bestMatch.topic);
      updatedTopic.keywords = summaryGenerator.mergeTopicKeywords(updatedTopic);
      summaryStorage.upsertTopic(bestMatch.domain.id, updatedTopic);

      // 更新索引
      this.updateIndices(conversation, bestMatch.topic.id, bestMatch.domain.id);
    } else {
      // 相似度不够，使用LLM判断
      const assignment = await llmClient.assignTopic(
        conversation.summary,
        allTopics.map(({ topic }) => ({
          id: topic.id,
          name: topic.name,
          summary: topic.summary,
        })),
        { similarityThreshold: config.similarity_threshold }
      );

      if (assignment.topicId && assignment.confidence >= config.similarity_threshold) {
        // 分配到现有主题
        const matchedTopic = allTopics.find(({ topic }) => topic.id === assignment.topicId);
        if (matchedTopic) {
          summaryStorage.addConversationToTopic(matchedTopic.topic.id, conversation);

          const updatedTopic = await summaryGenerator.updateTopicSummary(matchedTopic.topic);
          updatedTopic.keywords = summaryGenerator.mergeTopicKeywords(updatedTopic);
          summaryStorage.upsertTopic(matchedTopic.domain.id, updatedTopic);

          this.updateIndices(conversation, matchedTopic.topic.id, matchedTopic.domain.id);
        }
      } else {
        // 创建新主题
        await this.createNewTopicForConversation(conversation, assignment.suggestedNewTopic);
      }
    }
  }

  /**
   * 创建新的领域和主题
   */
  private async createNewDomainAndTopic(conversation: Conversation): Promise<void> {
    // 创建新主题
    const topicName =
      (await summaryGenerator.suggestTopicName([conversation])) || 'General';
    const newTopic = summaryGenerator.createTopic(topicName, conversation);
    newTopic.keywords = summaryGenerator.mergeTopicKeywords(newTopic);

    // 创建新领域
    const domainName =
      (await summaryGenerator.suggestDomainName([newTopic])) || 'General Knowledge';
    const newDomain = summaryGenerator.createDomain(domainName, newTopic);
    newDomain.keywords = summaryGenerator.mergeDomainKeywords(newDomain);

    // 保存
    summaryStorage.upsertDomain(newDomain);

    // 更新索引
    this.updateIndices(conversation, newTopic.id, newDomain.id);
  }

  /**
   * 为对话创建新主题
   */
  private async createNewTopicForConversation(
    conversation: Conversation,
    suggestedName?: string
  ): Promise<void> {
    const topicName =
      suggestedName || (await summaryGenerator.suggestTopicName([conversation]));
    const newTopic = summaryGenerator.createTopic(topicName, conversation);
    newTopic.keywords = summaryGenerator.mergeTopicKeywords(newTopic);

    // 找到最合适的领域
    const allDomains = summaryStorage.getAllDomains();
    let bestDomain: Domain | null = null;
    let bestSimilarity = 0;

    for (const domain of allDomains) {
      const domainKeywords = domain.keywords || [];
      const similarity = jaccardSimilarity(conversation.keywords, domainKeywords);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestDomain = domain;
      }
    }

    const config = configManager.getClusteringConfig();

    if (bestDomain && bestSimilarity >= config.similarity_threshold * 0.8) {
      // 添加到现有领域
      summaryStorage.upsertTopic(bestDomain.id, newTopic);

      // 更新领域
      const updatedDomain = await summaryGenerator.updateDomainSummary(bestDomain);
      updatedDomain.keywords = summaryGenerator.mergeDomainKeywords(updatedDomain);
      summaryStorage.upsertDomain(updatedDomain);

      this.updateIndices(conversation, newTopic.id, bestDomain.id);
    } else {
      // 创建新领域
      const domainName = await summaryGenerator.suggestDomainName([newTopic]);
      const newDomain = summaryGenerator.createDomain(domainName, newTopic);
      newDomain.keywords = summaryGenerator.mergeDomainKeywords(newDomain);

      summaryStorage.upsertDomain(newDomain);

      this.updateIndices(conversation, newTopic.id, newDomain.id);
    }
  }

  /**
   * 更新索引
   */
  private updateIndices(conversation: Conversation, topicId: string, domainId: string): void {
    // 更新关键词索引
    for (const keyword of conversation.keywords) {
      summaryStorage.updateKeywordIndex(keyword, conversation.id);
    }

    // 更新日期索引
    const date = formatDate(conversation.timestamp);
    summaryStorage.updateDateIndex(date, conversation.id);

    // 更新主题索引
    summaryStorage.updateTopicIndex(topicId, conversation.id);

    // 更新领域索引
    summaryStorage.updateDomainIndex(domainId, topicId);
  }

  /**
   * 处理所有未处理的对话
   */
  async processAll(): Promise<ProcessingHistoryEntry> {
    const unprocessed = await this.getUnprocessedConversations();
    console.log(`Found ${unprocessed.length} unprocessed conversations`);

    if (unprocessed.length === 0) {
      return {
        timestamp: timestamp(),
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        duration_ms: 0,
      };
    }

    return await this.processBatch(unprocessed);
  }

  /**
   * 强制重新处理所有对话
   */
  async reprocessAll(): Promise<ProcessingHistoryEntry> {
    const allConversations = await this.loadRawConversations();
    console.log(`Reprocessing ${allConversations.length} conversations`);

    // 清空现有数据
    const emptyTree = {
      version: '1.0',
      last_updated: timestamp(),
      tree: { domains: [] },
    };
    summaryStorage.saveSummaryTree(emptyTree);

    // 重建索引
    summaryStorage.rebuildAllIndices();

    return await this.processBatch(allConversations);
  }

  /**
   * 获取处理统计
   */
  getProcessingStats(): {
    total_processed: number;
    avg_processing_time_ms: number;
    success_rate: number;
    recent_errors: ProcessingError[];
  } {
    const metadata = summaryStorage.loadMetadata();
    const history = metadata.statistics.processing_history;

    if (history.length === 0) {
      return {
        total_processed: 0,
        avg_processing_time_ms: 0,
        success_rate: 0,
        recent_errors: [],
      };
    }

    const totalProcessed = history.reduce((sum, entry) => sum + entry.processed_count, 0);
    const totalSuccess = history.reduce((sum, entry) => sum + entry.success_count, 0);
    const avgTime =
      history.reduce((sum, entry) => sum + entry.duration_ms, 0) / history.length;
    const successRate = totalProcessed > 0 ? totalSuccess / totalProcessed : 0;

    const recentErrors = history
      .slice(-10)
      .flatMap((entry) => entry.errors || [])
      .slice(-20);

    return {
      total_processed: totalProcessed,
      avg_processing_time_ms: avgTime,
      success_rate: successRate,
      recent_errors: recentErrors,
    };
  }
}

// 导出单例实例
export const conversationProcessor = new ConversationProcessor();

