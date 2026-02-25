/**
 * 对话总结系统 - 检索器
 * 负责搜索和检索对话、主题、领域
 */

import {
  SearchRequest,
  SearchResult,
  Conversation,
  Topic,
  Domain,
} from './types';
import { summaryStorage } from './summary-storage';
import {
  jaccardSimilarity,
  cosineSimilarity,
  filterByDateRange,
  filterByKeywords,
  generatePath,
} from './utils';

export class SummaryRetriever {
  /**
   * 搜索（主入口）
   */
  async search(request: SearchRequest): Promise<SearchResult[]> {
    const { query, search_type, filters, limit = 20, offset = 0 } = request;

    let results: SearchResult[] = [];

    switch (search_type) {
      case 'keyword':
        results = await this.keywordSearch(query, filters);
        break;
      case 'semantic':
        results = await this.semanticSearch(query, filters);
        break;
      case 'hybrid':
        results = await this.hybridSearch(query, filters);
        break;
      default:
        results = await this.keywordSearch(query, filters);
    }

    // 应用分页
    return results.slice(offset, offset + limit);
  }

  /**
   * 关键词搜索
   */
  private async keywordSearch(
    query: string,
    filters?: SearchRequest['filters']
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryKeywords = query.toLowerCase().split(/\s+/);

    // 搜索对话
    const tree = summaryStorage.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      // 应用领域过滤
      if (filters?.domains && !filters.domains.includes(domain.id)) {
        continue;
      }

      for (const topic of domain.topics) {
        // 应用主题过滤
        if (filters?.topics && !filters.topics.includes(topic.id)) {
          continue;
        }

        for (const conversation of topic.conversations) {
          // 应用日期过滤
          if (filters?.date_from || filters?.date_to) {
            const filtered = filterByDateRange(
              [conversation],
              filters.date_from,
              filters.date_to
            );
            if (filtered.length === 0) continue;
          }

          // 应用关键词过滤
          if (filters?.keywords && filters.keywords.length > 0) {
            const filtered = filterByKeywords([conversation], filters.keywords);
            if (filtered.length === 0) continue;
          }

          // 计算相关性分数
          const score = this.calculateKeywordScore(
            queryKeywords,
            conversation.summary,
            conversation.keywords
          );

          if (score > 0) {
            results.push({
              id: conversation.id,
              type: 'conversation',
              summary: conversation.summary,
              relevance_score: score,
              path: generatePath([domain.name, topic.name]),
              timestamp: conversation.timestamp,
              keywords: conversation.keywords,
              metadata: conversation.metadata,
            });
          }
        }
      }
    }

    // 按相关性排序
    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * 语义搜索（基于关键词相似度）
   */
  private async semanticSearch(
    query: string,
    filters?: SearchRequest['filters']
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryKeywords = query.toLowerCase().split(/\s+/);

    const tree = summaryStorage.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      if (filters?.domains && !filters.domains.includes(domain.id)) {
        continue;
      }

      for (const topic of domain.topics) {
        if (filters?.topics && !filters.topics.includes(topic.id)) {
          continue;
        }

        for (const conversation of topic.conversations) {
          if (filters?.date_from || filters?.date_to) {
            const filtered = filterByDateRange(
              [conversation],
              filters.date_from,
              filters.date_to
            );
            if (filtered.length === 0) continue;
          }

          if (filters?.keywords && filters.keywords.length > 0) {
            const filtered = filterByKeywords([conversation], filters.keywords);
            if (filtered.length === 0) continue;
          }

          // 计算语义相似度
          const score = this.calculateSemanticScore(
            queryKeywords,
            conversation.keywords,
            conversation.summary
          );

          if (score > 0.1) {
            results.push({
              id: conversation.id,
              type: 'conversation',
              summary: conversation.summary,
              relevance_score: score,
              path: generatePath([domain.name, topic.name]),
              timestamp: conversation.timestamp,
              keywords: conversation.keywords,
              metadata: conversation.metadata,
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * 混合搜索（关键词 + 语义）
   */
  private async hybridSearch(
    query: string,
    filters?: SearchRequest['filters']
  ): Promise<SearchResult[]> {
    const keywordResults = await this.keywordSearch(query, filters);
    const semanticResults = await this.semanticSearch(query, filters);

    // 合并结果，取平均分
    const mergedMap = new Map<string, SearchResult>();

    for (const result of keywordResults) {
      mergedMap.set(result.id, result);
    }

    for (const result of semanticResults) {
      const existing = mergedMap.get(result.id);
      if (existing) {
        existing.relevance_score = (existing.relevance_score + result.relevance_score) / 2;
      } else {
        mergedMap.set(result.id, result);
      }
    }

    const results = Array.from(mergedMap.values());
    return results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * 按关键词搜索
   */
  searchByKeywords(keywords: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    const index = summaryStorage.loadIndex();

    const conversationIds = new Set<string>();
    for (const keyword of keywords) {
      const ids = index.indices.by_keyword[keyword.toLowerCase()] || [];
      ids.forEach((id) => conversationIds.add(id));
    }

    for (const convId of conversationIds) {
      const result = summaryStorage.getConversation(convId);
      if (result) {
        const { domain, topic, conversation } = result;
        results.push({
          id: conversation.id,
          type: 'conversation',
          summary: conversation.summary,
          relevance_score: 1.0,
          path: generatePath([domain.name, topic.name]),
          timestamp: conversation.timestamp,
          keywords: conversation.keywords,
        });
      }
    }

    return results;
  }

  /**
   * 按日期范围搜索
   */
  searchByDateRange(dateFrom: string, dateTo: string): SearchResult[] {
    const results: SearchResult[] = [];
    const index = summaryStorage.loadIndex();

    const conversationIds = new Set<string>();
    for (const date in index.indices.by_date) {
      if (date >= dateFrom && date <= dateTo) {
        const ids = index.indices.by_date[date];
        ids.forEach((id) => conversationIds.add(id));
      }
    }

    for (const convId of conversationIds) {
      const result = summaryStorage.getConversation(convId);
      if (result) {
        const { domain, topic, conversation } = result;
        results.push({
          id: conversation.id,
          type: 'conversation',
          summary: conversation.summary,
          relevance_score: 1.0,
          path: generatePath([domain.name, topic.name]),
          timestamp: conversation.timestamp,
          keywords: conversation.keywords,
        });
      }
    }

    return results.sort((a, b) => b.timestamp!.localeCompare(a.timestamp!));
  }

  /**
   * 按主题搜索
   */
  searchByTopic(topicId: string): SearchResult[] {
    const result = summaryStorage.getTopic(topicId);
    if (!result) return [];

    const { domain, topic } = result;
    return topic.conversations.map((conversation) => ({
      id: conversation.id,
      type: 'conversation' as const,
      summary: conversation.summary,
      relevance_score: 1.0,
      path: generatePath([domain.name, topic.name]),
      timestamp: conversation.timestamp,
      keywords: conversation.keywords,
    }));
  }

  /**
   * 按领域搜索
   */
  searchByDomain(domainId: string): SearchResult[] {
    const domain = summaryStorage.getDomain(domainId);
    if (!domain) return [];

    const results: SearchResult[] = [];

    for (const topic of domain.topics) {
      for (const conversation of topic.conversations) {
        results.push({
          id: conversation.id,
          type: 'conversation',
          summary: conversation.summary,
          relevance_score: 1.0,
          path: generatePath([domain.name, topic.name]),
          timestamp: conversation.timestamp,
          keywords: conversation.keywords,
        });
      }
    }

    return results;
  }

  /**
   * 获取相关对话推荐
   */
  getRecommendations(
    conversationId: string,
    limit: number = 5
  ): Array<{
    conversation: Conversation;
    score: number;
    reason: string;
    path: string;
  }> {
    const result = summaryStorage.getConversation(conversationId);
    if (!result) return [];

    const { conversation: targetConv } = result;
    const recommendations: Array<{
      conversation: Conversation;
      score: number;
      reason: string;
      path: string;
    }> = [];

    const tree = summaryStorage.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        for (const conv of topic.conversations) {
          if (conv.id === conversationId) continue;

          // 计算相似度
          const keywordSim = jaccardSimilarity(targetConv.keywords, conv.keywords);
          const cosineSim = cosineSimilarity(targetConv.keywords, conv.keywords);
          const score = (keywordSim + cosineSim) / 2;

          if (score > 0.3) {
            let reason = 'Similar keywords';
            if (score > 0.7) reason = 'Highly related topic';
            else if (score > 0.5) reason = 'Related topic';

            recommendations.push({
              conversation: conv,
              score,
              reason,
              path: generatePath([domain.name, topic.name]),
            });
          }
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 计算关键词匹配分数
   */
  private calculateKeywordScore(
    queryKeywords: string[],
    summary: string,
    conversationKeywords: string[]
  ): number {
    let score = 0;
    const summaryLower = summary.toLowerCase();

    for (const keyword of queryKeywords) {
      // 摘要中包含关键词
      if (summaryLower.includes(keyword)) {
        score += 1.0;
      }

      // 对话关键词中包含
      if (conversationKeywords.some((k) => k.includes(keyword) || keyword.includes(k))) {
        score += 0.5;
      }
    }

    return score / queryKeywords.length;
  }

  /**
   * 计算语义相似度分数
   */
  private calculateSemanticScore(
    queryKeywords: string[],
    conversationKeywords: string[],
    summary: string
  ): number {
    // Jaccard相似度
    const jaccardScore = jaccardSimilarity(queryKeywords, conversationKeywords);

    // 余弦相似度
    const cosineScore = cosineSimilarity(queryKeywords, conversationKeywords);

    // 摘要匹配度
    const summaryLower = summary.toLowerCase();
    const summaryMatchCount = queryKeywords.filter((kw) =>
      summaryLower.includes(kw)
    ).length;
    const summaryScore = summaryMatchCount / queryKeywords.length;

    // 加权平均
    return jaccardScore * 0.3 + cosineScore * 0.4 + summaryScore * 0.3;
  }

  /**
   * 获取热门主题
   */
  getTopTopics(limit: number = 10): Array<{
    topic: Topic;
    domain: Domain;
    score: number;
  }> {
    const tree = summaryStorage.loadSummaryTree();
    const topics: Array<{ topic: Topic; domain: Domain; score: number }> = [];

    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        // 分数基于对话数量和最近更新时间
        const conversationScore = topic.conversation_count;
        const recencyScore = this.calculateRecencyScore(topic.updated_at);
        const score = conversationScore * 0.7 + recencyScore * 0.3;

        topics.push({ topic, domain, score });
      }
    }

    return topics.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 获取热门关键词
   */
  getTopKeywords(limit: number = 20): Array<{ keyword: string; count: number }> {
    const index = summaryStorage.loadIndex();
    const keywordCounts = Object.entries(index.indices.by_keyword).map(
      ([keyword, ids]) => ({
        keyword,
        count: ids.length,
      })
    );

    return keywordCounts.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * 计算时间新近度分数
   */
  private calculateRecencyScore(timestamp: string): number {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const daysSince = (now - time) / (1000 * 60 * 60 * 24);

    // 30天内的内容得分较高
    if (daysSince <= 7) return 1.0;
    if (daysSince <= 30) return 0.7;
    if (daysSince <= 90) return 0.4;
    return 0.1;
  }
}

// 导出单例实例
export const summaryRetriever = new SummaryRetriever();

