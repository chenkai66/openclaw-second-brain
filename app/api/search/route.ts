import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search';

// 启用边缘运行时以提升性能
export const runtime = 'nodejs';

// 设置缓存
export const revalidate = 60; // 60秒

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') as 'note' | 'log' | 'all' | null;
    const tagsParam = searchParams.get('tags');
    const limitParam = searchParams.get('limit');

    // 解析参数
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : [];
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // 执行搜索
    const searchEngine = new SearchEngine();
    const results = await searchEngine.search(query, {
      type: type || 'all',
      tags,
      limit,
    });

    return NextResponse.json({
      query,
      results,
      total: results.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

