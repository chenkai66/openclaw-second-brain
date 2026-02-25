/**
 * API: 重建索引
 * POST /api/summary/rebuild-index
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryStorage } from '@/lib/summary/summary-storage';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { full_rebuild = true } = body;

    if (full_rebuild) {
      // 完全重建索引
      summaryStorage.rebuildAllIndices();

      // 更新统计信息
      summaryStorage.updateStatistics();

      const metadata = summaryStorage.loadMetadata();

      return NextResponse.json({
        success: true,
        indexed_items: metadata.statistics.total_conversations,
        duration_ms: Date.now() - startTime,
      });
    } else {
      // 增量更新索引（只更新统计信息）
      summaryStorage.updateStatistics();
      
      const metadata = summaryStorage.loadMetadata();

      return NextResponse.json({
        success: true,
        indexed_items: metadata.statistics.total_conversations,
        duration_ms: Date.now() - startTime,
      });
    }
  } catch (error) {
    console.error('Error rebuilding index:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

