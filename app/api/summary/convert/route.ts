/**
 * API: 智能转换摘要为Markdown文件
 * POST /api/summary/convert
 * 
 * 功能：使用大模型智能判断，将对话合并到现有笔记或创建新笔记
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntelligentMerger } from '@/lib/summary/intelligent-merger';
import { llmClient } from '@/lib/summary/llm-client';
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

    // 创建智能合并器
    const merger = new IntelligentMerger(
      llmClient,
      path.join(process.cwd(), 'content/notes'),
      path.join(process.cwd(), 'content/logs')
    );

    const startTime = Date.now();
    let totalMerged = 0;
    let totalCreatedNotes = 0;
    let totalCreatedLogs = 0;
    const allUpdatedNotes: Array<{ path: string; title: string }> = [];
    const allErrors: Array<{ conversation_id: string; error: string }> = [];

    // 遍历所有对话，使用大模型智能判断
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        for (const conversation of topic.conversations) {
          try {
            const result = await merger.processConversation(conversation);
            
            totalMerged += result.merged_count;
            totalCreatedNotes += result.created_notes;
            totalCreatedLogs += result.created_logs;
            allUpdatedNotes.push(...result.updated_notes);
            allErrors.push(...result.errors);

            // 添加延迟，避免API限流
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            allErrors.push({
              conversation_id: conversation.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result: {
        merged_to_existing: totalMerged,
        created_notes: totalCreatedNotes,
        created_logs: totalCreatedLogs,
        updated_notes: allUpdatedNotes,
        errors: allErrors,
        duration_ms: duration
      },
      message: `智能处理完成：合并${totalMerged}个，新建${totalCreatedNotes}个笔记，${totalCreatedLogs}个日志`
    });

  } catch (error) {
    console.error('智能转换失败:', error);
    
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

