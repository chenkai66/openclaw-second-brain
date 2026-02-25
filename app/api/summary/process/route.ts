/**
 * API: 处理新对话
 * POST /api/summary/process
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationProcessor } from '@/lib/summary/conversation-processor';
import { summaryStorage } from '@/lib/summary/summary-storage';
import { ProcessRequest, ProcessResponse } from '@/lib/summary/types';

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { force_reprocess = false, batch_size = 10, conversation_ids } = body;

    let result;

    if (force_reprocess) {
      // 强制重新处理所有对话
      result = await conversationProcessor.reprocessAll();
    } else if (conversation_ids && conversation_ids.length > 0) {
      // 处理指定的对话（暂不支持）
      return NextResponse.json(
        { 
          success: false,
          error: 'Processing specific conversations not yet implemented. Use force_reprocess to reprocess all conversations.' 
        },
        { status: 501 }
      );
    } else {
      // 处理未处理的对话
      result = await conversationProcessor.processAll();
    }

    // 获取处理前后的统计数据
    const metadata = summaryStorage.loadMetadata();
    const beforeStats = {
      topics: metadata.statistics.total_topics,
      domains: metadata.statistics.total_domains,
    };

    // 更新统计
    summaryStorage.updateStatistics();
    const afterMetadata = summaryStorage.loadMetadata();
    const afterStats = {
      topics: afterMetadata.statistics.total_topics,
      domains: afterMetadata.statistics.total_domains,
    };

    const response: ProcessResponse = {
      success: true,
      processed_count: result.processed_count,
      new_conversations: result.success_count,
      updated_topics: afterStats.topics - beforeStats.topics,
      updated_domains: afterStats.domains - beforeStats.domains,
      errors: result.errors || [],
      duration_ms: result.duration_ms,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 获取处理状态
    const stats = conversationProcessor.getProcessingStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting processing stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

