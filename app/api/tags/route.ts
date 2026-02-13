import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search';

// 设置缓存
export const revalidate = 300; // 5分钟

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const searchEngine = new SearchEngine();
    const tags = await searchEngine.getPopularTags(limit);

    return NextResponse.json({ tags }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

