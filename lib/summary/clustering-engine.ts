/**
 * 对话总结系统 - 聚类引擎
 * 负责对话聚类、主题发现、领域分类
 */

import {
  Conversation,
  Topic,
  Domain,
  ClusteringResult,
  SimilarityMatrix,
} from './types';
import { summaryStorage } from './summary-storage';
import { summaryGenerator } from './summary-generator';
import { configManager } from './config';
import {
  jaccardSimilarity,
  cosineSimilarity,
  generateId,
  timestamp,
} from './utils';

export class ClusteringEngine {
  /**
   * 对对话进行聚类，生成新主题
   */
  async clusterConversations(
    conversations: Conversation[],
    options?: {
      minSimilarity?: number;
      minClusterSize?: number;
    }
  ): Promise<ClusteringResult> {
    const config = configManager.getClusteringConfig();
    const minSimilarity = options?.minSimilarity || config.similarity_threshold;
    const minClusterSize = options?.minClusterSize || config.min_cluster_size;

    // 计算相似度矩阵
    const similarityMatrix = this.calculateSimilarityMatrix(conversations);

    // 层次聚类
    const clusters = this.hierarchicalClustering(
      conversations,
      similarityMatrix,
      minSimilarity
    );

    // 过滤小簇
    const validClusters = clusters.filter(
      (cluster) => cluster.members.length >= minClusterSize
    );
    const outliers = clusters
      .filter((cluster) => cluster.members.length < minClusterSize)
      .flatMap((cluster) => cluster.members);

    // 为每个簇生成名称和摘要
    const namedClusters = await Promise.all(
      validClusters.map(async (cluster) => {
        const clusterConversations = cluster.members.map((id) =>
          conversations.find((c) => c.id === id)!
        );
        const name = await summaryGenerator.suggestTopicName(clusterConversations);
        const summary = await summaryGenerator.generateTopicSummary({
          id: cluster.id,
          name,
          summary: '',
          created_at: timestamp(),
          updated_at: timestamp(),
          conversation_count: clusterConversations.length,
          conversations: clusterConversations,
        });

        return {
          ...cluster,
          name,
          summary,
        };
      })
    );

    return {
      clusters: namedClusters,
      outliers,
    };
  }

  /**
   * 对主题进行聚类，生成新领域
   */
  async clusterTopics(
    topics: Topic[],
    options?: {
      minSimilarity?: number;
      minClusterSize?: number;
    }
  ): Promise<ClusteringResult> {
    const config = configManager.getClusteringConfig();
    const minSimilarity = options?.minSimilarity || config.similarity_threshold;
    const minClusterSize = options?.minClusterSize || 2;

    // 计算主题相似度矩阵
    const similarityMatrix = this.calculateTopicSimilarityMatrix(topics);

    // 层次聚类
    const clusters = this.hierarchicalClustering(
      topics,
      similarityMatrix,
      minSimilarity
    );

    // 过滤小簇
    const validClusters = clusters.filter(
      (cluster) => cluster.members.length >= minClusterSize
    );
    const outliers = clusters
      .filter((cluster) => cluster.members.length < minClusterSize)
      .flatMap((cluster) => cluster.members);

    // 为每个簇生成领域名称和摘要
    const namedClusters = await Promise.all(
      validClusters.map(async (cluster) => {
        const clusterTopics = cluster.members.map((id) =>
          topics.find((t) => t.id === id)!
        );
        const name = await summaryGenerator.suggestDomainName(clusterTopics);
        const summary = await summaryGenerator.generateDomainSummary({
          id: cluster.id,
          name,
          summary: '',
          created_at: timestamp(),
          updated_at: timestamp(),
          topics: clusterTopics,
        });

        return {
          ...cluster,
          name,
          summary,
        };
      })
    );

    return {
      clusters: namedClusters,
      outliers,
    };
  }

  /**
   * 计算对话相似度矩阵
   */
  private calculateSimilarityMatrix(
    conversations: Conversation[]
  ): SimilarityMatrix {
    const n = conversations.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const sim = this.calculateConversationSimilarity(
            conversations[i],
            conversations[j]
          );
          matrix[i][j] = sim;
          matrix[j][i] = sim;
        }
      }
    }

    return {
      ids: conversations.map((c) => c.id),
      matrix,
    };
  }

  /**
   * 计算主题相似度矩阵
   */
  private calculateTopicSimilarityMatrix(topics: Topic[]): SimilarityMatrix {
    const n = topics.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const sim = this.calculateTopicSimilarity(topics[i], topics[j]);
          matrix[i][j] = sim;
          matrix[j][i] = sim;
        }
      }
    }

    return {
      ids: topics.map((t) => t.id),
      matrix,
    };
  }

  /**
   * 计算两个对话的相似度
   */
  private calculateConversationSimilarity(
    conv1: Conversation,
    conv2: Conversation
  ): number {
    const jaccardScore = jaccardSimilarity(conv1.keywords, conv2.keywords);
    const cosineScore = cosineSimilarity(conv1.keywords, conv2.keywords);

    // 时间接近度
    const time1 = new Date(conv1.timestamp).getTime();
    const time2 = new Date(conv2.timestamp).getTime();
    const timeDiff = Math.abs(time1 - time2);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    const timeScore = Math.max(0, 1 - daysDiff / 30); // 30天内的对话时间分数较高

    // 加权平均
    return jaccardScore * 0.4 + cosineScore * 0.4 + timeScore * 0.2;
  }

  /**
   * 计算两个主题的相似度
   */
  private calculateTopicSimilarity(topic1: Topic, topic2: Topic): number {
    const keywords1 = topic1.keywords || [];
    const keywords2 = topic2.keywords || [];

    const jaccardScore = jaccardSimilarity(keywords1, keywords2);
    const cosineScore = cosineSimilarity(keywords1, keywords2);

    return (jaccardScore + cosineScore) / 2;
  }

  /**
   * 层次聚类算法
   */
  private hierarchicalClustering<T extends { id: string }>(
    items: T[],
    similarityMatrix: SimilarityMatrix,
    threshold: number
  ): Array<{ id: string; members: string[] }> {
    const n = items.length;
    const clusters: Array<{ id: string; members: string[] }> = items.map((item) => ({
      id: generateId('cluster'),
      members: [item.id],
    }));

    let merged = true;
    while (merged && clusters.length > 1) {
      merged = false;
      let maxSim = -1;
      let mergeI = -1;
      let mergeJ = -1;

      // 找到最相似的两个簇
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const sim = this.calculateClusterSimilarity(
            clusters[i].members,
            clusters[j].members,
            similarityMatrix
          );

          if (sim > maxSim && sim >= threshold) {
            maxSim = sim;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // 合并簇
      if (mergeI >= 0 && mergeJ >= 0) {
        clusters[mergeI].members.push(...clusters[mergeJ].members);
        clusters.splice(mergeJ, 1);
        merged = true;
      }
    }

    return clusters;
  }

  /**
   * 计算两个簇之间的相似度（平均链接法）
   */
  private calculateClusterSimilarity(
    cluster1: string[],
    cluster2: string[],
    similarityMatrix: SimilarityMatrix
  ): number {
    let totalSim = 0;
    let count = 0;

    for (const id1 of cluster1) {
      for (const id2 of cluster2) {
        const idx1 = similarityMatrix.ids.indexOf(id1);
        const idx2 = similarityMatrix.ids.indexOf(id2);

        if (idx1 >= 0 && idx2 >= 0) {
          totalSim += similarityMatrix.matrix[idx1][idx2];
          count++;
        }
      }
    }

    return count > 0 ? totalSim / count : 0;
  }

  /**
   * 自动聚类并更新存储
   */
  async autoCluster(): Promise<{
    new_topics: number;
    merged_topics: number;
    new_domains: number;
    updated_domains: number;
  }> {
    const tree = summaryStorage.loadSummaryTree();
    let newTopics = 0;
    let mergedTopics = 0;
    let newDomains = 0;
    let updatedDomains = 0;

    // 收集所有未分类的对话（孤立对话）
    const orphanConversations: Conversation[] = [];
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        if (topic.conversation_count === 1) {
          orphanConversations.push(...topic.conversations);
        }
      }
    }

    // 对孤立对话进行聚类
    if (orphanConversations.length >= 3) {
      const result = await this.clusterConversations(orphanConversations);

      for (const cluster of result.clusters) {
        // 创建新主题
        const newTopic = summaryGenerator.createTopic(cluster.name!);
        newTopic.summary = cluster.summary!;
        newTopic.conversations = cluster.members.map((id) =>
          orphanConversations.find((c) => c.id === id)!
        );
        newTopic.conversation_count = newTopic.conversations.length;
        newTopic.keywords = summaryGenerator.mergeTopicKeywords(newTopic);

        // 分配到合适的领域
        let assignedDomain: Domain | null = null;
        let bestSimilarity = 0;

        // 查找最相似的领域
        for (const domain of tree.tree.domains) {
          const domainKeywords = domain.keywords || [];
          const similarity = jaccardSimilarity(newTopic.keywords || [], domainKeywords);
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            assignedDomain = domain;
          }
        }

        const config = configManager.getClusteringConfig();

        if (assignedDomain && bestSimilarity >= config.similarity_threshold * 0.8) {
          // 添加到现有领域
          summaryStorage.upsertTopic(assignedDomain.id, newTopic);
          updatedDomains++;
        } else {
          // 创建新领域
          const domainName = await summaryGenerator.suggestDomainName([newTopic]);
          const newDomain = summaryGenerator.createDomain(domainName, newTopic);
          newDomain.keywords = summaryGenerator.mergeDomainKeywords(newDomain);
          summaryStorage.upsertDomain(newDomain);
          newDomains++;
        }

        newTopics++;
      }
    }

    // 收集所有主题
    const allTopics: Topic[] = [];
    for (const domain of tree.tree.domains) {
      allTopics.push(...domain.topics);
    }

    // 对主题进行聚类，发现新领域
    if (allTopics.length >= 3) {
      const result = await this.clusterTopics(allTopics);

      for (const cluster of result.clusters) {
        // 检查是否应该创建新领域
        if (cluster.members.length >= 3) {
          const newDomain = summaryGenerator.createDomain(cluster.name!);
          newDomain.summary = cluster.summary!;
          newDomain.topics = cluster.members.map((id) =>
            allTopics.find((t) => t.id === id)!
          );
          newDomain.keywords = summaryGenerator.mergeDomainKeywords(newDomain);

          summaryStorage.upsertDomain(newDomain);
          newDomains++;
        }
      }
    }

    return {
      new_topics: newTopics,
      merged_topics: mergedTopics,
      new_domains: newDomains,
      updated_domains: updatedDomains,
    };
  }

  /**
   * 合并相似主题
   */
  async mergeSimilarTopics(threshold: number = 0.85): Promise<number> {
    const tree = summaryStorage.loadSummaryTree();
    let mergedCount = 0;

    for (const domain of tree.tree.domains) {
      const topics = domain.topics;

      for (let i = 0; i < topics.length; i++) {
        for (let j = i + 1; j < topics.length; j++) {
          const sim = this.calculateTopicSimilarity(topics[i], topics[j]);

          if (sim >= threshold) {
            // 合并主题j到主题i
            topics[i].conversations.push(...topics[j].conversations);
            topics[i].conversation_count = topics[i].conversations.length;
            topics[i].keywords = summaryGenerator.mergeTopicKeywords(topics[i]);

            // 更新摘要
            const updatedTopic = await summaryGenerator.updateTopicSummary(topics[i]);
            topics[i].summary = updatedTopic.summary;

            // 删除主题j
            summaryStorage.deleteTopic(topics[j].id);
            topics.splice(j, 1);
            j--;

            mergedCount++;
          }
        }
      }

      // 更新领域
      summaryStorage.upsertDomain(domain);
    }

    return mergedCount;
  }
}

// 导出单例实例
export const clusteringEngine = new ClusteringEngine();

