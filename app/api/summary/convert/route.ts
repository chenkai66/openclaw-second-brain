/**
 * API: 转换摘要为Markdown文件
 * POST /api/summary/convert
 * 
 * 功能：将 data/summaries/ 的JSON数据转换为 content/notes/ 和 content/logs/ 的Markdown文件
 */

import { NextRequest, NextResponse } from 'next/server';
import { SummaryStorage } from '@/lib/summary/summary-storage';
import { MarkdownConverter } from '@/lib/summary/markdown-converter';
import { ConfigManager } from '@/lib/summary/config';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { summaryStorage } = await import('@/lib/summary/summary-storage');

    // 加载摘要树
    const tree = await summaryStorage.loadSummaryTree();

    if (!tree || !tree.tree || tree.tree.domains.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有可转换的摘要数据，请先处理对话'
      }, { status: 400 });
    }

    // 创建Markdown转换器
    const converter = new MarkdownConverter({
      contentDir: path.join(process.cwd(), 'content'),
      notesDir: path.join(process.cwd(), 'content/notes'),
      logsDir: path.join(process.cwd(), 'content/logs'),
      syncStateFile: path.join(process.cwd(), '.sync-state.json'),
      minConversationsForNote: 3 // 至少3个对话才生成Note
    });

    // 转换摘要树（传入tree.tree，因为MarkdownConverter期望的是内部结构）
    const startTime = Date.now();
    const result = await converter.convertSummaryTree(tree.tree);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result: {
        created_logs: result.createdLogs,
        created_notes: result.createdNotes,
        updated_notes: result.updatedNotes,
        errors: result.errors,
        duration_ms: duration
      },
      message: `成功转换：${result.createdLogs}个日志，${result.createdNotes}个笔记，${result.updatedNotes}个更新`
    });

  } catch (error) {
    console.error('转换摘要失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/summary/convert',
    method: 'POST',
    description: '将摘要JSON转换为Markdown文件',
    usage: {
      curl: 'curl -X POST http://localhost:3000/api/summary/convert'
    }
  });
}

