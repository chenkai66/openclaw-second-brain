/**
 * API: 获取摘要树
 * GET /api/summary/tree
 */

import { NextRequest, NextResponse } from 'next/server';
import { summaryStorage } from '@/lib/summary/summary-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domain_id');
    const depth = parseInt(searchParams.get('depth') || '3');

    const tree = summaryStorage.loadSummaryTree();

    // 如果指定了领域ID，只返回该领域
    if (domainId) {
      const domain = tree.tree.domains.find((d) => d.id === domainId);
      if (!domain) {
        return NextResponse.json(
          { error: 'Domain not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        version: tree.version,
        last_updated: tree.last_updated,
        tree: {
          domains: [domain],
        },
      });
    }

    // 根据深度过滤
    if (depth === 1) {
      // 只返回领域
      const simplifiedTree = {
        ...tree,
        tree: {
          domains: tree.tree.domains.map((d) => ({
            ...d,
            topics: [],
          })),
        },
      };
      return NextResponse.json(simplifiedTree);
    } else if (depth === 2) {
      // 返回领域和主题
      const simplifiedTree = {
        ...tree,
        tree: {
          domains: tree.tree.domains.map((d) => ({
            ...d,
            topics: d.topics.map((t) => ({
              ...t,
              conversations: [],
            })),
          })),
        },
      };
      return NextResponse.json(simplifiedTree);
    }

    // 返回完整树
    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error getting summary tree:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

