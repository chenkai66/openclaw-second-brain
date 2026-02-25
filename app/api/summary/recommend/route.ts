/**
 * API: 智能推荐
 * GET /api/summary/recommend
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryRetriever } from '@/lib/summary/summary-retriever';
import { RecommendResponse } from '@/lib/summary/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const topicId = searchParams.get('topic_id');
    const keywords = searchParams.get('keywords')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!conversationId && !topicId && keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one of conversation_id, topic_id, or keywords is required' },
        { status: 400 }
      );
    }

    let recommendations: RecommendResponse['recommendations'] = [];

    if (conversationId) {
      // 基于对话推荐
      const recs = summaryRetriever.getRecommendations(conversationId, limit);
      recommendations = recs.map((rec) => ({
        id: rec.conversation.id,
        type: 'conversation',
        summary: rec.conversation.summary,
        relevance_score: rec.score,
        reason: rec.reason,
        path: rec.path,
      }));
    } else if (topicId) {
      // 基于主题推荐
      const results = summaryRetriever.searchByTopic(topicId);
      recommendations = results.slice(0, limit).map((result) => ({
        id: result.id,
        type: 'conversation' as const,
        summary: result.summary,
        relevance_score: result.relevance_score,
        reason: 'Same topic',
        path: result.path,
      }));
    } else if (keywords.length > 0) {
      // 基于关键词推荐
      const results = summaryRetriever.searchByKeywords(keywords);
      recommendations = results.slice(0, limit).map((result) => ({
        id: result.id,
        type: 'conversation' as const,
        summary: result.summary,
        relevance_score: result.relevance_score,
        reason: 'Matching keywords',
        path: result.path,
      }));
    }

    const response: RecommendResponse = {
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

