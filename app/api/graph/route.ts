import { NextRequest, NextResponse } from 'next/server';
import { GraphBuilder } from '@/lib/graph-builder';

// 设置缓存
export const revalidate = 300; // 5分钟

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const depthParam = searchParams.get('depth');
    const depth = depthParam ? parseInt(depthParam, 10) : 1;

    const graphBuilder = new GraphBuilder();
    
    let graph;
    if (nodeId) {
      // 获取特定节点的邻居
      graph = await graphBuilder.getNeighbors(nodeId, depth);
    } else {
      // 获取完整图谱
      graph = await graphBuilder.buildGraph();
    }

    return NextResponse.json(graph, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Graph error:', error);
    return NextResponse.json(
      { error: 'Failed to build graph' },
      { status: 500 }
    );
  }
}

