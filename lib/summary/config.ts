/**
 * 对话总结系统 - 配置管理
 */

import { SummarySystemConfig } from './types';
import fs from 'fs';
import path from 'path';

const DEFAULT_CONFIG: SummarySystemConfig = {
  llm: {
    provider: 'dashscope',
    model: 'qwen-plus',
    api_key_env: 'OPENAI_API_KEY',
    base_url_env: 'OPENAI_BASE_URL',
    max_retries: 3,
    retry_delay_ms: 1000,
    timeout_ms: 30000,
    temperature: 0.7,
    max_tokens: 2000,
  },
  processing: {
    batch_size: 10,
    max_concurrent: 3,
    min_conversation_length: 50,
    max_summary_length: 500,
    enable_sentiment_analysis: true,
    enable_keyword_extraction: true,
  },
  clustering: {
    similarity_threshold: 0.7,
    min_cluster_size: 3,
    max_topics_per_domain: 20,
    auto_cluster_interval_hours: 24,
    clustering_algorithm: 'hierarchical',
  },
  storage: {
    data_dir: './data/summaries',
    backup_enabled: true,
    backup_interval_hours: 24,
    max_backups: 7,
    compression_enabled: false,
  },
};

export class ConfigManager {
  private config: SummarySystemConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'summary-config.json');
    this.config = this.loadConfig();
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): SummarySystemConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const userConfig = JSON.parse(fileContent);
        return this.mergeConfig(DEFAULT_CONFIG, userConfig);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}, using defaults:`, error);
    }
    return DEFAULT_CONFIG;
  }

  /**
   * 合并配置（深度合并）
   */
  private mergeConfig(
    defaultConfig: SummarySystemConfig,
    userConfig: Partial<SummarySystemConfig>
  ): SummarySystemConfig {
    return {
      llm: { ...defaultConfig.llm, ...userConfig.llm },
      processing: { ...defaultConfig.processing, ...userConfig.processing },
      clustering: { ...defaultConfig.clustering, ...userConfig.clustering },
      storage: { ...defaultConfig.storage, ...userConfig.storage },
    };
  }

  /**
   * 获取完整配置
   */
  getConfig(): SummarySystemConfig {
    return this.config;
  }

  /**
   * 获取LLM配置
   */
  getLLMConfig() {
    return this.config.llm;
  }

  /**
   * 获取处理配置
   */
  getProcessingConfig() {
    return this.config.processing;
  }

  /**
   * 获取聚类配置
   */
  getClusteringConfig() {
    return this.config.clustering;
  }

  /**
   * 获取存储配置
   */
  getStorageConfig() {
    return this.config.storage;
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<SummarySystemConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  /**
   * 保存配置到文件
   */
  saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = DEFAULT_CONFIG;
  }

  /**
   * 验证配置
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证LLM配置
    if (!this.config.llm.model) {
      errors.push('LLM model is required');
    }
    if (!this.config.llm.api_key_env) {
      errors.push('LLM api_key_env is required');
    }
    if (this.config.llm.max_retries < 0) {
      errors.push('LLM max_retries must be >= 0');
    }

    // 验证处理配置
    if (this.config.processing.batch_size < 1) {
      errors.push('Processing batch_size must be >= 1');
    }
    if (this.config.processing.max_concurrent < 1) {
      errors.push('Processing max_concurrent must be >= 1');
    }

    // 验证聚类配置
    if (
      this.config.clustering.similarity_threshold < 0 ||
      this.config.clustering.similarity_threshold > 1
    ) {
      errors.push('Clustering similarity_threshold must be between 0 and 1');
    }

    // 验证存储配置
    if (!this.config.storage.data_dir) {
      errors.push('Storage data_dir is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取环境变量值
   */
  getEnvValue(envKey: string): string | undefined {
    return process.env[envKey];
  }

  /**
   * 获取LLM API密钥
   */
  getLLMApiKey(): string {
    const apiKey = this.getEnvValue(this.config.llm.api_key_env);
    if (!apiKey) {
      throw new Error(
        `LLM API key not found in environment variable: ${this.config.llm.api_key_env}`
      );
    }
    return apiKey;
  }

  /**
   * 获取LLM Base URL
   */
  getLLMBaseUrl(): string {
    const baseUrl = this.getEnvValue(this.config.llm.base_url_env);
    if (!baseUrl) {
      throw new Error(
        `LLM base URL not found in environment variable: ${this.config.llm.base_url_env}`
      );
    }
    return baseUrl;
  }

  /**
   * 确保存储目录存在
   */
  ensureStorageDirectories(): void {
    const dirs = [
      this.config.storage.data_dir,
      path.join(this.config.storage.data_dir, 'backups'),
      path.join(this.config.storage.data_dir, 'logs'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * 获取存储文件路径
   */
  getStoragePaths() {
    const dataDir = this.config.storage.data_dir;
    return {
      summaries: path.join(dataDir, 'summaries.json'),
      index: path.join(dataDir, 'summary-index.json'),
      metadata: path.join(dataDir, 'summary-metadata.json'),
      backupDir: path.join(dataDir, 'backups'),
      logsDir: path.join(dataDir, 'logs'),
    };
  }
}

// 导出单例实例
export const configManager = new ConfigManager();

