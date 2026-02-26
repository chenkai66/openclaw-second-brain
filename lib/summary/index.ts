/**
 * 对话总结系统 - 主入口
 * 导出所有核心功能
 */

// 类型定义
export * from './types.js';

// 配置管理
export { configManager, ConfigManager } from './config.js';

// 大模型客户端
export { llmClient, LLMClient } from './llm-client.js';

// 存储管理
export { summaryStorage, SummaryStorage } from './summary-storage.js';

// 摘要生成
export { summaryGenerator, SummaryGenerator } from './summary-generator.js';

// 对话处理
export { conversationProcessor, ConversationProcessor } from './conversation-processor.js';

// 检索器
export { summaryRetriever, SummaryRetriever } from './summary-retriever.js';

// 聚类引擎
export { clusteringEngine, ClusteringEngine } from './clustering-engine.js';

// Markdown转换器
export { MarkdownConverter } from './markdown-converter.js';

// 智能合并器
export { IntelligentMerger } from './intelligent-merger.js';

// 工具函数
export * from './utils.js';

/**
 * 初始化摘要系统
 */
export async function initializeSummarySystem(configPath?: string): Promise<void> {
  const { configManager } = await import('./config.js');
  
  if (configPath) {
    // 加载自定义配置
    const config = new (await import('./config.js')).ConfigManager(configPath);
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
  const { conversationProcessor } = await import('./conversation-processor.js');
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
  const { summaryRetriever } = await import('./summary-retriever.js');
  
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
  const { summaryStorage } = await import('./summary-storage.js');
  const { conversationProcessor } = await import('./conversation-processor.js');

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
  const { summaryStorage } = await import('./summary-storage.js');
  return summaryStorage.createBackup();
}

/**
 * 测试LLM连接
 */
export async function testLLMConnection(): Promise<boolean> {
  const { llmClient } = await import('./llm-client.js');
  return await llmClient.testConnection();
}