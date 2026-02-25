/**
 * 对话总结系统 - 存储管理器
 * 负责树形结构、索引和元数据的持久化
 */

import fs from 'fs';
import path from 'path';
import {
  SummaryTree,
  SummaryIndex,
  SummaryMetadata,
  Domain,
  Topic,
  Conversation,
  StorageError,
} from './types';
import { configManager } from './config';

export class SummaryStorage {
  private summariesPath: string;
  private indexPath: string;
  private metadataPath: string;
  private backupDir: string;

  constructor() {
    configManager.ensureStorageDirectories();
    const paths = configManager.getStoragePaths();
    this.summariesPath = paths.summaries;
    this.indexPath = paths.index;
    this.metadataPath = paths.metadata;
    this.backupDir = paths.backupDir;

    this.initializeStorage();
  }

  /**
   * 初始化存储文件
   */
  private initializeStorage(): void {
    // 初始化摘要树
    if (!fs.existsSync(this.summariesPath)) {
      const initialTree: SummaryTree = {
        version: '1.0',
        last_updated: new Date().toISOString(),
        tree: {
          domains: [],
        },
      };
      this.saveSummaryTree(initialTree);
    }

    // 初始化索引
    if (!fs.existsSync(this.indexPath)) {
      const initialIndex: SummaryIndex = {
        version: '1.0',
        indices: {
          by_keyword: {},
          by_date: {},
          by_topic: {},
          by_domain: {},
        },
        last_updated: new Date().toISOString(),
      };
      this.saveIndex(initialIndex);
    }

    // 初始化元数据
    if (!fs.existsSync(this.metadataPath)) {
      const initialMetadata: SummaryMetadata = {
        version: '1.0',
        statistics: {
          total_conversations: 0,
          total_topics: 0,
          total_domains: 0,
          last_processed_timestamp: new Date().toISOString(),
          processing_history: [],
        },
        sync_state: {
          last_sync_timestamp: new Date().toISOString(),
          last_processed_conversation_id: '',
          pending_conversations: [],
        },
      };
      this.saveMetadata(initialMetadata);
    }
  }

  // ============================================================================
  // 摘要树操作
  // ============================================================================

  /**
   * 加载摘要树
   */
  loadSummaryTree(): SummaryTree {
    try {
      const content = fs.readFileSync(this.summariesPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new StorageError('Failed to load summary tree', { error });
    }
  }

  /**
   * 保存摘要树
   */
  saveSummaryTree(tree: SummaryTree): void {
    try {
      tree.last_updated = new Date().toISOString();
      fs.writeFileSync(this.summariesPath, JSON.stringify(tree, null, 2), 'utf-8');
    } catch (error) {
      throw new StorageError('Failed to save summary tree', { error });
    }
  }

  /**
   * 添加或更新领域
   */
  upsertDomain(domain: Domain): void {
    const tree = this.loadSummaryTree();
    const existingIndex = tree.tree.domains.findIndex((d) => d.id === domain.id);

    if (existingIndex >= 0) {
      tree.tree.domains[existingIndex] = domain;
    } else {
      tree.tree.domains.push(domain);
    }

    this.saveSummaryTree(tree);
  }

  /**
   * 获取领域
   */
  getDomain(domainId: string): Domain | null {
    const tree = this.loadSummaryTree();
    return tree.tree.domains.find((d) => d.id === domainId) || null;
  }

  /**
   * 获取所有领域
   */
  getAllDomains(): Domain[] {
    const tree = this.loadSummaryTree();
    return tree.tree.domains;
  }

  /**
   * 删除领域
   */
  deleteDomain(domainId: string): void {
    const tree = this.loadSummaryTree();
    tree.tree.domains = tree.tree.domains.filter((d) => d.id !== domainId);
    this.saveSummaryTree(tree);
  }

  /**
   * 添加或更新主题
   */
  upsertTopic(domainId: string, topic: Topic): void {
    const tree = this.loadSummaryTree();
    const domain = tree.tree.domains.find((d) => d.id === domainId);

    if (!domain) {
      throw new StorageError(`Domain not found: ${domainId}`);
    }

    const existingIndex = domain.topics.findIndex((t) => t.id === topic.id);

    if (existingIndex >= 0) {
      domain.topics[existingIndex] = topic;
    } else {
      domain.topics.push(topic);
    }

    domain.updated_at = new Date().toISOString();
    this.saveSummaryTree(tree);
  }

  /**
   * 获取主题
   */
  getTopic(topicId: string): { domain: Domain; topic: Topic } | null {
    const tree = this.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      const topic = domain.topics.find((t) => t.id === topicId);
      if (topic) {
        return { domain, topic };
      }
    }
    return null;
  }

  /**
   * 获取领域下的所有主题
   */
  getTopicsByDomain(domainId: string): Topic[] {
    const domain = this.getDomain(domainId);
    return domain?.topics || [];
  }

  /**
   * 删除主题
   */
  deleteTopic(topicId: string): void {
    const tree = this.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      domain.topics = domain.topics.filter((t) => t.id !== topicId);
    }
    this.saveSummaryTree(tree);
  }

  /**
   * 添加对话到主题
   */
  addConversationToTopic(topicId: string, conversation: Conversation): void {
    const result = this.getTopic(topicId);
    if (!result) {
      throw new StorageError(`Topic not found: ${topicId}`);
    }

    const { domain, topic } = result;

    // 检查对话是否已存在
    const existingIndex = topic.conversations.findIndex((c) => c.id === conversation.id);

    if (existingIndex >= 0) {
      topic.conversations[existingIndex] = conversation;
    } else {
      topic.conversations.push(conversation);
      topic.conversation_count = topic.conversations.length;
    }

    topic.updated_at = new Date().toISOString();
    this.upsertTopic(domain.id, topic);
  }

  /**
   * 获取对话
   */
  getConversation(conversationId: string): { domain: Domain; topic: Topic; conversation: Conversation } | null {
    const tree = this.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        const conversation = topic.conversations.find((c) => c.id === conversationId);
        if (conversation) {
          return { domain, topic, conversation };
        }
      }
    }
    return null;
  }

  /**
   * 删除对话
   */
  deleteConversation(conversationId: string): void {
    const tree = this.loadSummaryTree();
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        topic.conversations = topic.conversations.filter((c) => c.id !== conversationId);
        topic.conversation_count = topic.conversations.length;
      }
    }
    this.saveSummaryTree(tree);
  }

  // ============================================================================
  // 索引操作
  // ============================================================================

  /**
   * 加载索引
   */
  loadIndex(): SummaryIndex {
    try {
      const content = fs.readFileSync(this.indexPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new StorageError('Failed to load index', { error });
    }
  }

  /**
   * 保存索引
   */
  saveIndex(index: SummaryIndex): void {
    try {
      index.last_updated = new Date().toISOString();
      fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      throw new StorageError('Failed to save index', { error });
    }
  }

  /**
   * 更新关键词索引
   */
  updateKeywordIndex(keyword: string, conversationId: string): void {
    const index = this.loadIndex();
    if (!index.indices.by_keyword[keyword]) {
      index.indices.by_keyword[keyword] = [];
    }
    if (!index.indices.by_keyword[keyword].includes(conversationId)) {
      index.indices.by_keyword[keyword].push(conversationId);
    }
    this.saveIndex(index);
  }

  /**
   * 更新日期索引
   */
  updateDateIndex(date: string, conversationId: string): void {
    const index = this.loadIndex();
    if (!index.indices.by_date[date]) {
      index.indices.by_date[date] = [];
    }
    if (!index.indices.by_date[date].includes(conversationId)) {
      index.indices.by_date[date].push(conversationId);
    }
    this.saveIndex(index);
  }

  /**
   * 更新主题索引
   */
  updateTopicIndex(topicId: string, conversationId: string): void {
    const index = this.loadIndex();
    if (!index.indices.by_topic[topicId]) {
      index.indices.by_topic[topicId] = [];
    }
    if (!index.indices.by_topic[topicId].includes(conversationId)) {
      index.indices.by_topic[topicId].push(conversationId);
    }
    this.saveIndex(index);
  }

  /**
   * 更新领域索引
   */
  updateDomainIndex(domainId: string, topicId: string): void {
    const index = this.loadIndex();
    if (!index.indices.by_domain[domainId]) {
      index.indices.by_domain[domainId] = [];
    }
    if (!index.indices.by_domain[domainId].includes(topicId)) {
      index.indices.by_domain[domainId].push(topicId);
    }
    this.saveIndex(index);
  }

  /**
   * 重建所有索引
   */
  rebuildAllIndices(): void {
    const tree = this.loadSummaryTree();
    const index: SummaryIndex = {
      version: '1.0',
      indices: {
        by_keyword: {},
        by_date: {},
        by_topic: {},
        by_domain: {},
      },
      last_updated: new Date().toISOString(),
    };

    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        // 更新领域索引
        if (!index.indices.by_domain[domain.id]) {
          index.indices.by_domain[domain.id] = [];
        }
        index.indices.by_domain[domain.id].push(topic.id);

        for (const conversation of topic.conversations) {
          // 更新主题索引
          if (!index.indices.by_topic[topic.id]) {
            index.indices.by_topic[topic.id] = [];
          }
          index.indices.by_topic[topic.id].push(conversation.id);

          // 更新关键词索引
          for (const keyword of conversation.keywords) {
            if (!index.indices.by_keyword[keyword]) {
              index.indices.by_keyword[keyword] = [];
            }
            index.indices.by_keyword[keyword].push(conversation.id);
          }

          // 更新日期索引
          const date = conversation.timestamp.split('T')[0];
          if (!index.indices.by_date[date]) {
            index.indices.by_date[date] = [];
          }
          index.indices.by_date[date].push(conversation.id);
        }
      }
    }

    this.saveIndex(index);
  }

  // ============================================================================
  // 元数据操作
  // ============================================================================

  /**
   * 加载元数据
   */
  loadMetadata(): SummaryMetadata {
    try {
      const content = fs.readFileSync(this.metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new StorageError('Failed to load metadata', { error });
    }
  }

  /**
   * 保存元数据
   */
  saveMetadata(metadata: SummaryMetadata): void {
    try {
      fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      throw new StorageError('Failed to save metadata', { error });
    }
  }

  /**
   * 更新统计信息
   */
  updateStatistics(): void {
    const tree = this.loadSummaryTree();
    const metadata = this.loadMetadata();

    let totalConversations = 0;
    let totalTopics = 0;

    for (const domain of tree.tree.domains) {
      totalTopics += domain.topics.length;
      for (const topic of domain.topics) {
        totalConversations += topic.conversations.length;
      }
    }

    metadata.statistics.total_conversations = totalConversations;
    metadata.statistics.total_topics = totalTopics;
    metadata.statistics.total_domains = tree.tree.domains.length;
    metadata.statistics.last_processed_timestamp = new Date().toISOString();

    this.saveMetadata(metadata);
  }

  // ============================================================================
  // 备份操作
  // ============================================================================

  /**
   * 创建备份
   */
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // 备份所有文件
    fs.copyFileSync(this.summariesPath, path.join(backupPath, 'summaries.json'));
    fs.copyFileSync(this.indexPath, path.join(backupPath, 'summary-index.json'));
    fs.copyFileSync(this.metadataPath, path.join(backupPath, 'summary-metadata.json'));

    // 清理旧备份
    this.cleanOldBackups();

    return backupPath;
  }

  /**
   * 清理旧备份
   */
  private cleanOldBackups(): void {
    const config = configManager.getStorageConfig();
    const backups = fs.readdirSync(this.backupDir).filter((name) => name.startsWith('backup-'));

    if (backups.length > config.max_backups) {
      // 按时间排序
      backups.sort();
      // 删除最旧的备份
      const toDelete = backups.slice(0, backups.length - config.max_backups);
      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup);
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
    }
  }

  /**
   * 从备份恢复
   */
  restoreFromBackup(backupPath: string): void {
    if (!fs.existsSync(backupPath)) {
      throw new StorageError(`Backup not found: ${backupPath}`);
    }

    fs.copyFileSync(path.join(backupPath, 'summaries.json'), this.summariesPath);
    fs.copyFileSync(path.join(backupPath, 'summary-index.json'), this.indexPath);
    fs.copyFileSync(path.join(backupPath, 'summary-metadata.json'), this.metadataPath);
  }

  /**
   * 列出所有备份
   */
  listBackups(): string[] {
    return fs
      .readdirSync(this.backupDir)
      .filter((name) => name.startsWith('backup-'))
      .sort()
      .reverse();
  }
}

// 导出单例实例
export const summaryStorage = new SummaryStorage();

