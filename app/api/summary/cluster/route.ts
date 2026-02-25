/**
 * API: 触发聚类
 * POST /api/summary/cluster
 */

import { NextRequest, NextResponse } from 'next/server';
import { clusteringEngine } from '@/lib/summary/clustering-engine';
import { ClusterRequest, ClusterResponse } from '@/lib/summary/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ClusterRequest = await request.json();
    const { target = 'topics', algorithm = 'hierarchical', min_similarity, force_recluster = false } = body;

    let result;

    if (target === 'topics') {
      // 自动聚类
      result = await clusteringEngine.autoCluster();

      const response: ClusterResponse = {
        success: true,
        new_topics: result.new_topics,
        merged_topics: result.merged_topics,
        new_domains: result.new_domains,
        updated_domains: result.updated_domains,
        duration_ms: Date.now() - startTime,
      };

      return NextResponse.json(response);
    } else if (target === 'domains') {
      // 领域聚类
      result = await clusteringEngine.autoCluster();

      const response: ClusterResponse = {
        success: true,
        new_domains: result.new_domains,
        updated_domains: result.updated_domains,
        duration_ms: Date.now() - startTime,
      };

      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: 'Invalid target. Must be "topics" or "domains"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error clustering:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

