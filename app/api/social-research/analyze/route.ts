/**
 * Social Research API - 智能分析
 * POST /api/social-research/analyze
 * 
 * 使用大模型分析用户需求，生成研究计划
 */

import { NextRequest, NextResponse } from 'next/server';
import { llmClient } from '@/lib/summary/llm-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: '请提供研究查询'
      }, { status: 400 });
    }

    // 获取用户最近的对话上下文
    const { summaryStorage } = await import('@/lib/summary/summary-storage');
    const tree = await summaryStorage.loadSummaryTree();
    
    // 提取最近的主题和关键词
    const recentTopics: string[] = [];
    const recentKeywords: string[] = [];
    
    if (tree && tree.tree && tree.tree.domains.length > 0) {
      for (const domain of tree.tree.domains) {
        for (const topic of domain.topics) {
          recentTopics.push(topic.name);
          if (topic.keywords) {
            recentKeywords.push(...topic.keywords);
          }
        }
      }
    }

    // 构建分析提示词
    const prompt = buildAnalysisPrompt(query, {
      recent_topics: recentTopics.slice(-10),
      recent_keywords: [...new Set(recentKeywords)].slice(-20),
      tech_stack: context?.tech_stack || [],
      user_level: context?.user_level || 'intermediate'
    });

    // 调用大模型分析
    const response = await llmClient.generateConversationSummary(prompt, {
      maxLength: 2000
    });

    // 解析大模型响应
    const researchPlan = parseAnalysisResponse(response);

    return NextResponse.json({
      success: true,
      research_plan: researchPlan,
      context: {
        recent_topics: recentTopics.slice(-5),
        detected_intent: researchPlan.research_type
      }
    });

  } catch (error) {
    console.error('分析研究需求失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/**
 * 构建分析提示词
 */
function buildAnalysisPrompt(
  query: string,
  context: {
    recent_topics: string[];
    recent_keywords: string[];
    tech_stack: string[];
    user_level: string;
  }
): string {
  return `你是一个社区研究分析助手。用户想要进行社区研究，请分析他的需求并生成研究计划。

## 用户请求

"${query}"

## 用户背景

**最近讨论的主题**: ${context.recent_topics.join(', ') || '无'}
**技术关键词**: ${context.recent_keywords.slice(0, 15).join(', ') || '无'}
**技术栈**: ${context.tech_stack.join(', ') || '通用'}
**技术水平**: ${context.user_level}

## 你的任务

分析用户的研究需求，判断：

1. **研究类型**（选择最合适的一个）：
   - trend_analysis: 趋势分析（技术采用率、热度变化）
   - tool_comparison: 工具对比（功能、性能、用户评价）
   - best_practices: 最佳实践（架构、模式、经验分享）
   - community_opinion: 社区观点（争议讨论、不同看法）

2. **搜索关键词**：生成3-5个英文搜索关键词

3. **搜索平台**：选择最相关的平台
   - reddit: 适合深度讨论和真实评价
   - twitter: 适合快速观点和趋势
   - hackernews: 适合技术深度和专业讨论

4. **焦点领域**：用户最关心的3-4个方面

5. **报告结构**：
   - sections: 报告应该包含哪些章节
   - depth: "detailed"（详细）或 "summary"（概要）

## 输出格式（严格JSON）

\`\`\`json
{
  "research_type": "tool_comparison",
  "search_keywords": ["keyword1", "keyword2", "keyword3"],
  "platforms": ["reddit", "twitter"],
  "focus_areas": ["功能对比", "用户体验", "性能"],
  "report_structure": {
    "sections": ["概述", "对比分析", "社区评价", "建议"],
    "depth": "detailed"
  },
  "reason": "简短说明为什么选择这个研究方向（1-2句话）"
}
\`\`\`

请直接输出JSON，不要有其他内容。`;
}

/**
 * 解析大模型响应
 */
function parseAnalysisResponse(response: string): any {
  try {
    // 提取JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/```\s*([\s\S]*?)\s*```/) ||
                     response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('无法从响应中提取JSON');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    // 验证必需字段
    if (!parsed.research_type || !parsed.search_keywords || !parsed.platforms) {
      throw new Error('JSON缺少必需字段');
    }

    // 验证research_type
    const validTypes = ['trend_analysis', 'tool_comparison', 'best_practices', 'community_opinion'];
    if (!validTypes.includes(parsed.research_type)) {
      parsed.research_type = 'community_opinion'; // 默认值
    }

    // 确保数组格式
    if (!Array.isArray(parsed.search_keywords)) {
      parsed.search_keywords = [String(parsed.search_keywords)];
    }
    if (!Array.isArray(parsed.platforms)) {
      parsed.platforms = [String(parsed.platforms)];
    }
    if (!Array.isArray(parsed.focus_areas)) {
      parsed.focus_areas = [];
    }

    // 添加预估时间
    parsed.estimated_time = estimateResearchTime(parsed);

    return parsed;

  } catch (error) {
    console.error('解析分析响应失败:', error);
    
    // 返回默认计划
    return {
      research_type: 'community_opinion',
      search_keywords: ['general discussion'],
      platforms: ['reddit', 'twitter'],
      focus_areas: ['社区讨论', '用户反馈'],
      report_structure: {
        sections: ['概述', '社区讨论', '关键发现'],
        depth: 'summary'
      },
      reason: '解析失败，使用默认研究计划',
      estimated_time: '5-10分钟'
    };
  }
}

/**
 * 预估研究时间
 */
function estimateResearchTime(plan: any): string {
  const platformCount = plan.platforms.length;
  const keywordCount = plan.search_keywords.length;
  const isDetailed = plan.report_structure?.depth === 'detailed';
  
  const baseTime = platformCount * keywordCount * 2; // 每个平台每个关键词2分钟
  const extraTime = isDetailed ? 5 : 2; // 详细报告需要更多时间
  
  const totalMinutes = baseTime + extraTime;
  
  if (totalMinutes < 5) return '3-5分钟';
  if (totalMinutes < 10) return '5-10分钟';
  if (totalMinutes < 15) return '10-15分钟';
  return '15-20分钟';
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/social-research/analyze',
    method: 'POST',
    description: '使用大模型分析用户需求，生成智能研究计划',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: '用户的研究请求',
        example: 'Cursor vs GitHub Copilot 对比'
      },
      context: {
        type: 'object',
        required: false,
        description: '用户上下文信息',
        properties: {
          tech_stack: {
            type: 'array',
            example: ['react', 'typescript']
          },
          user_level: {
            type: 'string',
            example: 'intermediate'
          }
        }
      }
    },
    usage: {
      curl: `curl -X POST http://localhost:3000/api/social-research/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"query": "Cursor vs Copilot 对比"}'`
    }
  });
}

