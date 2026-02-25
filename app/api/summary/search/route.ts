/**
 * API: 搜索摘要
 * POST /api/summary/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryRetriever } from '@/lib/summary/summary-retriever';
import { SearchRequest, SearchResponse } from '@/lib/summary/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchRequest = await request.json();
    const { query, search_type = 'hybrid', filters, limit = 20, offset = 0 } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await summaryRetriever.search({
      query,
      search_type,
      filters,
      limit,
      offset,
    });

    const response: SearchResponse = {
      results,
      total: results.length,
      query,
      search_type,
      duration_ms: Date.now() - startTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching summaries:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

