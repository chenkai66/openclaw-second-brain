/**
 * 对话总结系统 - 主入口
 * 导出所有核心功能
 */

// 类型定义
export * from './types';

// 配置管理
export { configManager, ConfigManager } from './config';

// 大模型客户端
export { llmClient, LLMClient } from './llm-client';

// 存储管理
export { summaryStorage, SummaryStorage } from './summary-storage';

// 摘要生成
export { summaryGenerator, SummaryGenerator } from './summary-generator';

// 对话处理
export { conversationProcessor, ConversationProcessor } from './conversation-processor';

// 检索器
export { summaryRetriever, SummaryRetriever } from './summary-retriever';

// 聚类引擎
export { clusteringEngine, ClusteringEngine } from './clustering-engine';

// Markdown转换器
export { MarkdownConverter } from './markdown-converter';

// 智能合并器
export { IntelligentMerger } from './intelligent-merger';

// 工具函数
export * from './utils';

/**
 * 初始化摘要系统
 */
export async function initializeSummarySystem(configPath?: string): Promise<void> {
  const { configManager } = await import('./config');

  if (configPath) {
    // 加载自定义配置
    const config = new (await import('./config')).ConfigManager(configPath);
    Object.assign(configManager, config);
  }

  // 验证配置
  const validation = configManager.validateConfig();
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  // 确保存储目录存在
  configManager.ensureStorageDirectories();

  console.log('Summary system initialized successfully');
}

/**
 * 快速处理所有未处理的对话
 */
export async function quickProcess(): Promise<{
  processed: number;
  success: number;
  errors: number;
  duration_ms: number;
}> {
  const { conversationProcessor } = await import('./conversation-processor');
  const result = await conversationProcessor.processAll();

  return {
    processed: result.processed_count,
    success: result.success_count,
    errors: result.error_count,
    duration_ms: result.duration_ms,
  };
}

/**
 * 快速搜索
 */
export async function quickSearch(
  query: string,
  options?: {
    limit?: number;
    searchType?: 'keyword' | 'semantic' | 'hybrid';
  }
) {
  const { summaryRetriever } = await import('./summary-retriever');

  return await summaryRetriever.search({
    query,
    search_type: options?.searchType || 'hybrid',
    limit: options?.limit || 20,
  });
}

/**
 * 获取系统统计
 */
export async function getSystemStats() {
  const { summaryStorage } = await import('./summary-storage');
  const { conversationProcessor } = await import('./conversation-processor');

  const metadata = summaryStorage.loadMetadata();
  const processingStats = conversationProcessor.getProcessingStats();

  return {
    ...metadata.statistics,
    processing: processingStats,
  };
}

/**
 * 创建备份
 */
export async function createBackup(): Promise<string> {
  const { summaryStorage } = await import('./summary-storage');
  return summaryStorage.createBackup();
}

/**
 * 测试LLM连接
 */
export async function testLLMConnection(): Promise<boolean> {
  const { llmClient } = await import('./llm-client');
  return await llmClient.testConnection();
}
