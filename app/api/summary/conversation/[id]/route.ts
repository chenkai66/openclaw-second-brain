/**
 * API: 获取对话详情
 * GET /api/summary/conversation/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryStorage } from '@/lib/summary/summary-storage';
import { summaryRetriever } from '@/lib/summary/summary-retriever';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    const result = summaryStorage.getConversation(conversationId);
    if (!result) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const { domain, topic, conversation } = result;

    // 获取相关对话推荐
    const recommendations = summaryRetriever.getRecommendations(conversationId, 5);

    return NextResponse.json({
      conversation,
      topic: {
        id: topic.id,
        name: topic.name,
        summary: topic.summary,
      },
      domain: {
        id: domain.id,
        name: domain.name,
        summary: domain.summary,
      },
      related_conversations: recommendations.map((rec) => ({
        id: rec.conversation.id,
        summary: rec.conversation.summary,
        relevance_score: rec.score,
        reason: rec.reason,
        path: rec.path,
      })),
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

