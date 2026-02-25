/**
 * 对话总结系统 - 大模型客户端
 * 封装阿里云百炼API调用，提供试错机制和异常处理
 */

import { LLMError } from './types';
import { configManager } from './config';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export class LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private retryOptions: RetryOptions;

  constructor() {
    const config = configManager.getLLMConfig();
    this.apiKey = configManager.getLLMApiKey();
    this.baseUrl = configManager.getLLMBaseUrl();
    this.model = config.model;
    this.retryOptions = {
      maxRetries: config.max_retries,
      delayMs: config.retry_delay_ms,
      backoffMultiplier: 2,
    };
  }

  /**
   * 生成对话摘要
   */
  async generateConversationSummary(
    conversationContent: string,
    options?: {
      maxLength?: number;
      language?: string;
    }
  ): Promise<string> {
    const maxLength = options?.maxLength || 500;
    const language = options?.language || 'Chinese';

    const systemPrompt = `你是一个专业的对话摘要助手。你的任务是为用户的对话生成简洁、准确的摘要。

要求：
1. 摘要长度不超过${maxLength}字
2. 使用${language}
3. 提取核心观点和关键信息
4. 保持客观中立的语气
5. 如果对话包含技术内容，保留关键技术术语`;

    const userPrompt = `请为以下对话生成摘要：

${conversationContent}

请直接输出摘要内容，不要添加任何前缀或解释。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages);
    return response.content.trim();
  }

  /**
   * 提取关键词
   */
  async extractKeywords(
    content: string,
    options?: {
      maxKeywords?: number;
      language?: string;
    }
  ): Promise<string[]> {
    const maxKeywords = options?.maxKeywords || 10;
    const language = options?.language || 'English';

    const systemPrompt = `你是一个关键词提取专家。从给定的文本中提取最重要的关键词。

要求：
1. 提取${maxKeywords}个最重要的关键词
2. 关键词使用${language}
3. 关键词应该是单词或短语（2-3个词）
4. 优先提取技术术语、概念名称、工具名称
5. 使用小写字母
6. 多个单词用连字符连接（如：react-hooks）
7. 只输出关键词列表，每行一个，不要编号或其他格式`;

    const userPrompt = `请从以下内容中提取关键词：

${content}

请直接输出关键词列表，每行一个。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages);
    const keywords = response.content
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, maxKeywords);

    return keywords;
  }

  /**
   * 分析情感倾向
   */
  async analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
    const systemPrompt = `你是一个情感分析专家。分析给定文本的情感倾向。

要求：
1. 只输出以下三个词之一：positive、neutral、negative
2. positive：积极、正面、满意、成功
3. neutral：中性、客观、陈述事实
4. negative：消极、负面、不满、失败
5. 不要输出任何其他内容`;

    const userPrompt = `请分析以下内容的情感倾向：

${content}

只输出：positive、neutral 或 negative`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages);
    const sentiment = response.content.trim().toLowerCase();

    if (sentiment.includes('positive')) return 'positive';
    if (sentiment.includes('negative')) return 'negative';
    return 'neutral';
  }

  /**
   * 生成主题摘要（聚合多个对话）
   */
  async generateTopicSummary(
    conversationSummaries: string[],
    topicName: string,
    options?: {
      maxLength?: number;
    }
  ): Promise<string> {
    const maxLength = options?.maxLength || 800;

    const systemPrompt = `你是一个知识整合专家。你的任务是将多个相关对话的摘要整合成一个主题摘要。

要求：
1. 摘要长度不超过${maxLength}字
2. 识别共同主题和模式
3. 提取核心观点和关键发现
4. 组织成结构化的内容
5. 使用中文`;

    const userPrompt = `主题：${topicName}

以下是该主题下的多个对话摘要：

${conversationSummaries.map((summary, index) => `${index + 1}. ${summary}`).join('\n\n')}

请生成一个整合性的主题摘要，涵盖所有重要内容。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages);
    return response.content.trim();
  }

  /**
   * 生成领域摘要（聚合多个主题）
   */
  async generateDomainSummary(
    topicSummaries: Array<{ name: string; summary: string }>,
    domainName: string,
    options?: {
      maxLength?: number;
    }
  ): Promise<string> {
    const maxLength = options?.maxLength || 1000;

    const systemPrompt = `你是一个知识领域专家。你的任务是将多个相关主题的摘要整合成一个领域级别的综合摘要。

要求：
1. 摘要长度不超过${maxLength}字
2. 识别领域的核心知识体系
3. 总结主要技术栈和工具
4. 提炼最佳实践和经验
5. 展现知识的演进和趋势
6. 使用中文`;

    const userPrompt = `领域：${domainName}

以下是该领域下的多个主题摘要：

${topicSummaries.map((topic, index) => `${index + 1}. ${topic.name}\n${topic.summary}`).join('\n\n')}

请生成一个领域级别的综合摘要。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages);
    return response.content.trim();
  }

  /**
   * 为对话分配主题
   */
  async assignTopic(
    conversationSummary: string,
    existingTopics: Array<{ id: string; name: string; summary: string }>,
    options?: {
      similarityThreshold?: number;
    }
  ): Promise<{ topicId: string | null; confidence: number; suggestedNewTopic?: string }> {
    const threshold = options?.similarityThreshold || 0.7;

    const systemPrompt = `你是一个主题分类专家。你的任务是判断一个对话摘要应该归属于哪个现有主题，或者是否需要创建新主题。

要求：
1. 分析对话摘要与现有主题的相关性
2. 如果相关性高（>0.7），返回最匹配的主题ID
3. 如果相关性低，建议创建新主题并给出主题名称
4. 输出JSON格式：{"topic_id": "xxx", "confidence": 0.85} 或 {"topic_id": null, "confidence": 0.3, "suggested_topic": "新主题名称"}`;

    const topicsList = existingTopics
      .map((topic) => `ID: ${topic.id}\n名称: ${topic.name}\n摘要: ${topic.summary}`)
      .join('\n\n---\n\n');

    const userPrompt = `现有主题列表：

${topicsList}

---

待分类的对话摘要：
${conversationSummary}

请判断该对话应该归属于哪个主题，或者是否需要创建新主题。只输出JSON格式的结果。`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.chat(messages);
      const result = JSON.parse(response.content);
      return {
        topicId: result.topic_id || null,
        confidence: result.confidence || 0,
        suggestedNewTopic: result.suggested_topic,
      };
    } catch (error) {
      console.error('Failed to parse topic assignment result:', error);
      return { topicId: null, confidence: 0 };
    }
  }

  /**
   * 核心聊天方法（带重试机制）
   */
  private async chat(messages: Message[], retryCount = 0): Promise<LLMResponse> {
    const config = configManager.getLLMConfig();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        }),
        signal: AbortSignal.timeout(config.timeout_ms),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new LLMError(`API request failed: ${response.status} ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new LLMError('No response from LLM', { data });
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (error) {
      // 判断是否需要重试
      if (retryCount < this.retryOptions.maxRetries) {
        const delay = this.retryOptions.delayMs * Math.pow(this.retryOptions.backoffMultiplier, retryCount);
        console.warn(`LLM request failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.retryOptions.maxRetries})`);
        
        await this.sleep(delay);
        return this.chat(messages, retryCount + 1);
      }

      // 超过重试次数，抛出错误
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError('LLM request failed', { originalError: error });
    }
  }

  /**
   * 降级处理：使用简化提示词
   */
  async chatWithFallback(messages: Message[]): Promise<LLMResponse> {
    try {
      return await this.chat(messages);
    } catch (error) {
      console.warn('Primary LLM request failed, trying with simplified prompt...');
      
      // 简化提示词
      const simplifiedMessages = messages.map((msg) => ({
        ...msg,
        content: msg.content.substring(0, 1000), // 截断过长的内容
      }));

      return await this.chat(simplifiedMessages);
    }
  }

  /**
   * 工具方法：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Hello, please respond with "OK"' },
      ]);
      return response.content.includes('OK') || response.content.length > 0;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}

// 导出单例实例
export const llmClient = new LLMClient();

