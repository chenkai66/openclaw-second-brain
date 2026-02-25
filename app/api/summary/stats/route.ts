/**
 * API: 获取统计信息
 * GET /api/summary/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryStorage } from '@/lib/summary/summary-storage';
import { summaryRetriever } from '@/lib/summary/summary-retriever';
import { conversationProcessor } from '@/lib/summary/conversation-processor';
import { StatsResponse } from '@/lib/summary/types';
import { getDateRange } from '@/lib/summary/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const includeHistory = searchParams.get('include_history') === 'true';

    const metadata = summaryStorage.loadMetadata();
    const processingStats = conversationProcessor.getProcessingStats();

    // 获取热门主题
    const topTopics = summaryRetriever.getTopTopics(10);

    // 获取热门关键词
    const topKeywords = summaryRetriever.getTopKeywords(20);

    // 计算增长率
    let growthRate = 0;
    if (metadata.statistics.processing_history.length >= 2) {
      const recent = metadata.statistics.processing_history.slice(-2);
      const previous = recent[0].success_count;
      const current = recent[1].success_count;
      growthRate = previous > 0 ? (current - previous) / previous : 0;
    }

    // 获取最近活动
    const recentActivity: Array<{
      date: string;
      conversation_count: number;
      new_topics: number;
    }> = [];

    if (period !== 'all') {
      const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const { from, to } = getDateRange(days);

      // 按日期统计对话数
      const index = summaryStorage.loadIndex();
      const dateStats = new Map<string, number>();

      for (const date in index.indices.by_date) {
        if (date >= from && date <= to) {
          dateStats.set(date, index.indices.by_date[date].length);
        }
      }

      // 转换为数组并排序
      for (const [date, count] of dateStats.entries()) {
        recentActivity.push({
          date,
          conversation_count: count,
          new_topics: 0, // 简化处理，不统计新主题
        });
      }

      recentActivity.sort((a, b) => a.date.localeCompare(b.date));
    }

    const response: StatsResponse = {
      total_conversations: metadata.statistics.total_conversations,
      total_topics: metadata.statistics.total_topics,
      total_domains: metadata.statistics.total_domains,
      growth_rate: growthRate,
      top_topics: topTopics.map((t) => ({
        id: t.topic.id,
        name: t.topic.name,
        conversation_count: t.topic.conversation_count,
      })),
      top_keywords: topKeywords,
      recent_activity: recentActivity,
      processing_stats: includeHistory
        ? {
            avg_processing_time_ms: processingStats.avg_processing_time_ms,
            success_rate: processingStats.success_rate,
            total_processed: processingStats.total_processed,
          }
        : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

