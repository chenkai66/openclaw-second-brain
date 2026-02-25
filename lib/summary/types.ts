/**
 * 对话总结系统 - 类型定义
 */

// ============================================================================
// 基础类型
// ============================================================================

export interface Conversation {
  id: string;
  timestamp: string;
  summary: string;
  keywords: string[];
  content_hash: string;
  related_notes: string[];
  related_logs: string[];
  metadata: ConversationMetadata;
  raw_content?: string; // 原始对话内容（可选）
}

export interface ConversationMetadata {
  word_count: number;
  code_blocks: number;
  has_solution: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  language?: string;
  participants?: string[];
}

export interface Topic {
  id: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
  conversations: Conversation[];
  keywords?: string[];
  parent_domain_id?: string;
}

export interface Domain {
  id: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  topics: Topic[];
  keywords?: string[];
}

// ============================================================================
// 树形结构
// ============================================================================

export interface SummaryTree {
  version: string;
  last_updated: string;
  tree: {
    domains: Domain[];
  };
}

// ============================================================================
// 索引结构
// ============================================================================

export interface SummaryIndex {
  version: string;
  indices: {
    by_keyword: Record<string, string[]>; // keyword -> conversation_ids
    by_date: Record<string, string[]>; // date -> conversation_ids
    by_topic: Record<string, string[]>; // topic_id -> conversation_ids
    by_domain: Record<string, string[]>; // domain_id -> topic_ids
  };
  last_updated: string;
}

// ============================================================================
// 元数据
// ============================================================================

export interface ProcessingHistoryEntry {
  timestamp: string;
  processed_count: number;
  success_count: number;
  error_count: number;
  duration_ms: number;
  errors?: ProcessingError[];
}

export interface ProcessingError {
  conversation_id: string;
  error_type: string;
  error_message: string;
  timestamp: string;
  retry_count: number;
}

export interface SummaryMetadata {
  version: string;
  statistics: {
    total_conversations: number;
    total_topics: number;
    total_domains: number;
    last_processed_timestamp: string;
    processing_history: ProcessingHistoryEntry[];
  };
  sync_state: {
    last_sync_timestamp: string;
    last_processed_conversation_id: string;
    pending_conversations: string[];
  };
}

// ============================================================================
// API 请求/响应类型
// ============================================================================

export interface ProcessRequest {
  force_reprocess?: boolean;
  batch_size?: number;
  conversation_ids?: string[]; // 指定要处理的对话ID
}

export interface ProcessResponse {
  success: boolean;
  processed_count: number;
  new_conversations: number;
  updated_topics: number;
  updated_domains: number;
  errors: ProcessingError[];
  duration_ms: number;
}

export interface SearchRequest {
  query: string;
  search_type: 'semantic' | 'keyword' | 'hybrid';
  filters?: {
    date_from?: string;
    date_to?: string;
    topics?: string[];
    domains?: string[];
    keywords?: string[];
  };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: 'conversation' | 'topic' | 'domain';
  summary: string;
  relevance_score: number;
  path: string; // e.g., "Web Development > React Performance"
  timestamp?: string;
  keywords?: string[];
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  search_type: string;
  duration_ms: number;
}

export interface ClusterRequest {
  target: 'topics' | 'domains';
  algorithm?: 'hierarchical' | 'kmeans' | 'dbscan';
  min_similarity?: number;
  force_recluster?: boolean;
}

export interface ClusterResponse {
  success: boolean;
  new_topics?: number;
  merged_topics?: number;
  new_domains?: number;
  updated_domains?: number;
  duration_ms: number;
}

export interface StatsRequest {
  period?: 'day' | 'week' | 'month' | 'all';
  include_history?: boolean;
}

export interface StatsResponse {
  total_conversations: number;
  total_topics: number;
  total_domains: number;
  growth_rate: number;
  top_topics: Array<{
    id: string;
    name: string;
    conversation_count: number;
  }>;
  top_keywords: Array<{
    keyword: string;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    conversation_count: number;
    new_topics: number;
  }>;
  processing_stats?: {
    avg_processing_time_ms: number;
    success_rate: number;
    total_processed: number;
  };
}

export interface ExportRequest {
  format: 'json' | 'markdown' | 'csv';
  scope: 'all' | 'domain' | 'topic' | 'conversation';
  id?: string; // 当scope不是all时需要
  include_raw_content?: boolean;
}

export interface RecommendRequest {
  conversation_id?: string;
  topic_id?: string;
  keywords?: string[];
  limit?: number;
}

export interface RecommendResponse {
  recommendations: Array<{
    id: string;
    type: 'conversation' | 'topic';
    summary: string;
    relevance_score: number;
    reason: string;
    path?: string;
  }>;
}

// ============================================================================
// 配置类型
// ============================================================================

export interface LLMConfig {
  provider: 'dashscope' | 'openai';
  model: string;
  api_key_env: string;
  base_url_env: string;
  max_retries: number;
  retry_delay_ms: number;
  timeout_ms: number;
  temperature?: number;
  max_tokens?: number;
}

export interface ProcessingConfig {
  batch_size: number;
  max_concurrent: number;
  min_conversation_length: number;
  max_summary_length: number;
  enable_sentiment_analysis: boolean;
  enable_keyword_extraction: boolean;
}

export interface ClusteringConfig {
  similarity_threshold: number;
  min_cluster_size: number;
  max_topics_per_domain: number;
  auto_cluster_interval_hours: number;
  clustering_algorithm: 'hierarchical' | 'kmeans' | 'dbscan';
}

export interface StorageConfig {
  data_dir: string;
  backup_enabled: boolean;
  backup_interval_hours: number;
  max_backups: number;
  compression_enabled: boolean;
}

export interface SummarySystemConfig {
  llm: LLMConfig;
  processing: ProcessingConfig;
  clustering: ClusteringConfig;
  storage: StorageConfig;
}

// ============================================================================
// 内部处理类型
// ============================================================================

export interface RawConversation {
  id: string;
  timestamp: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SummaryGenerationResult {
  success: boolean;
  summary?: string;
  keywords?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  error?: string;
  retry_count: number;
  duration_ms: number;
}

export interface ClusteringResult {
  clusters: Array<{
    id: string;
    name: string;
    members: string[]; // conversation_ids or topic_ids
    centroid?: number[];
    summary?: string;
  }>;
  outliers: string[];
  silhouette_score?: number;
}

export interface SimilarityMatrix {
  ids: string[];
  matrix: number[][]; // similarity scores [0, 1]
}

// ============================================================================
// 错误类型
// ============================================================================

export class SummarySystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SummarySystemError';
  }
}

export class LLMError extends SummarySystemError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_ERROR', details);
    this.name = 'LLMError';
  }
}

export class StorageError extends SummarySystemError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class ClusteringError extends SummarySystemError {
  constructor(message: string, details?: any) {
    super(message, 'CLUSTERING_ERROR', details);
    this.name = 'ClusteringError';
  }
}

export class ValidationError extends SummarySystemError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

