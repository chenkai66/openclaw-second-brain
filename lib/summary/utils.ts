/**
 * 对话总结系统 - 工具函数
 */

import crypto from 'crypto';

/**
 * 生成唯一ID
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 计算内容哈希
 */
export function calculateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * 计算两个字符串数组的Jaccard相似度
 */
export function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;

  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * 计算余弦相似度（基于关键词频率）
 */
export function cosineSimilarity(keywords1: string[], keywords2: string[]): number {
  // 构建词频向量
  const allKeywords = [...new Set([...keywords1, ...keywords2])];
  const vector1 = allKeywords.map((kw) => keywords1.filter((k) => k === kw).length);
  const vector2 = allKeywords.map((kw) => keywords2.filter((k) => k === kw).length);

  // 计算点积
  let dotProduct = 0;
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
  }

  // 计算模长
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * 提取日期范围内的项目
 */
export function filterByDateRange<T extends { timestamp: string }>(
  items: T[],
  dateFrom?: string,
  dateTo?: string
): T[] {
  return items.filter((item) => {
    const itemDate = item.timestamp.split('T')[0];
    if (dateFrom && itemDate < dateFrom) return false;
    if (dateTo && itemDate > dateTo) return false;
    return true;
  });
}

/**
 * 按关键词过滤
 */
export function filterByKeywords<T extends { keywords: string[] }>(
  items: T[],
  keywords: string[]
): T[] {
  if (keywords.length === 0) return items;

  return items.filter((item) => {
    return keywords.some((kw) => item.keywords.includes(kw));
  });
}

/**
 * 统计词频
 */
export function countWordFrequency(texts: string[]): Map<string, number> {
  const frequency = new Map<string, number>();

  for (const text of texts) {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2); // 过滤短词

    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }

  return frequency;
}

/**
 * 获取Top N项
 */
export function getTopN<T>(
  items: T[],
  scoreFunc: (item: T) => number,
  n: number
): T[] {
  return items
    .map((item) => ({ item, score: scoreFunc(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.item);
}

/**
 * 分批处理
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * 并发处理（带限制）
 */
export async function processConcurrent<T, R>(
  items: T[],
  maxConcurrent: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试执行
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier?: number;
  }
): Promise<T> {
  const { maxRetries, delayMs, backoffMultiplier = 2 } = options;
  let lastError: Error | undefined;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        const waitTime = delayMs * Math.pow(backoffMultiplier, i);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 规范化关键词
 */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * 合并关键词列表（去重）
 */
export function mergeKeywords(...keywordLists: string[][]): string[] {
  const allKeywords = keywordLists.flat();
  return [...new Set(allKeywords.map(normalizeKeyword))];
}

/**
 * 计算增长率
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

/**
 * 分组
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFunc: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFunc(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return groups;
}

/**
 * 计算平均值
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * 计算中位数
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 验证日期格式
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 获取日期范围
 */
export function getDateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

/**
 * 清理HTML标签
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 提取代码块数量
 */
export function countCodeBlocks(markdown: string): number {
  const matches = markdown.match(/```[\s\S]*?```/g);
  return matches ? matches.length : 0;
}

/**
 * 计算字数
 */
export function countWords(text: string): number {
  // 移除代码块
  const withoutCode = text.replace(/```[\s\S]*?```/g, '');
  // 分词
  const words = withoutCode.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * 检测语言（简单版本）
 */
export function detectLanguage(text: string): 'zh' | 'en' | 'unknown' {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
  const englishWords = text.match(/[a-zA-Z]+/g);

  const chineseCount = chineseChars ? chineseChars.length : 0;
  const englishCount = englishWords ? englishWords.length : 0;

  if (chineseCount > englishCount) return 'zh';
  if (englishCount > chineseCount) return 'en';
  return 'unknown';
}

/**
 * 生成路径字符串
 */
export function generatePath(parts: string[]): string {
  return parts.join(' > ');
}

/**
 * 解析路径字符串
 */
export function parsePath(path: string): string[] {
  return path.split(' > ').map((part) => part.trim());
}

/**
 * 深度克隆
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 检查对象是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 生成时间戳
 */
export function timestamp(): string {
  return new Date().toISOString();
}

/**
 * 解析时间戳为可读格式
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

