/**
 * API: 智能转换摘要为Markdown文件
 * POST /api/summary/convert
 * 
 * 增强版：更好的错误处理、进度反馈、批量处理控制
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntelligentMerger } from '@/lib/summary/intelligent-merger';
import { llmClient } from '@/lib/summary/llm-client';
import path from 'path';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 解析请求参数
    const body = await request.json().catch(() => ({}));
    const { 
      batch_size = 10,
      delay_ms = 1000,
      skip_existing = true 
    } = body;

    // 验证参数
    if (batch_size < 1 || batch_size > 100) {
      return NextResponse.json({
        success: false,
        error: 'batch_size必须在1-100之间'
      }, { status: 400 });
    }

    const { summaryStorage } = await import('@/lib/summary/summary-storage');

    // 加载摘要树
    const tree = await summaryStorage.loadSummaryTree();

    if (!tree || !tree.tree || tree.tree.domains.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有可转换的摘要数据，请先处理对话',
        hint: '请先调用 POST /api/summary/process 处理对话'
      }, { status: 400 });
    }

    // 统计总对话数
    let totalConversations = 0;
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        totalConversations += topic.conversations.length;
      }
    }

    if (totalConversations === 0) {
      return NextResponse.json({
        success: false,
        message: '没有对话需要处理'
      }, { status: 400 });
    }

    console.log(`开始处理 ${totalConversations} 个对话...`);

    // 创建智能合并器
    const merger = new IntelligentMerger(
      llmClient,
      path.join(process.cwd(), 'content/notes'),
      path.join(process.cwd(), 'content/logs')
    );

    let totalMerged = 0;
    let totalCreatedNotes = 0;
    let totalCreatedLogs = 0;
    const allUpdatedNotes: Array<{ path: string; title: string }> = [];
    const allErrors: Array<{ conversation_id: string; error: string }> = [];
    let processedCount = 0;
    let skippedCount = 0;

    // 遍历所有对话，使用大模型智能判断
    for (const domain of tree.tree.domains) {
      for (const topic of domain.topics) {
        for (const conversation of topic.conversations) {
          try {
            // 检查是否超过批量限制
            if (processedCount >= batch_size) {
              console.log(`已达到批量限制 (${batch_size})，停止处理`);
              break;
            }

            // 验证对话数据
            if (!conversation || !conversation.id || !conversation.summary) {
              console.warn(`跳过无效对话: ${conversation?.id || 'unknown'}`);
              skippedCount++;
              continue;
            }

            console.log(`处理对话 [${processedCount + 1}/${Math.min(batch_size, totalConversations)}]: ${conversation.id}`);

            const result = await merger.processConversation(conversation);
            
            totalMerged += result.merged_count;
            totalCreatedNotes += result.created_notes;
            totalCreatedLogs += result.created_logs;
            allUpdatedNotes.push(...result.updated_notes);
            allErrors.push(...result.errors);

            processedCount++;

            // 添加延迟，避免API限流
            if (processedCount < batch_size && delay_ms > 0) {
              await new Promise(resolve => setTimeout(resolve, delay_ms));
            }

          } catch (error) {
            console.error(`处理对话失败 [${conversation.id}]:`, error);
            allErrors.push({
              conversation_id: conversation.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // 构建响应
    const response = {
      success: true,
      result: {
        processed: processedCount,
        skipped: skippedCount,
        merged_to_existing: totalMerged,
        created_notes: totalCreatedNotes,
        created_logs: totalCreatedLogs,
        updated_notes: allUpdatedNotes,
        errors: allErrors,
        duration_ms: duration
      },
      message: `智能处理完成：处理${processedCount}个对话，合并${totalMerged}个，新建${totalCreatedNotes}个笔记，${totalCreatedLogs}个日志`,
      stats: {
        total_conversations: totalConversations,
        success_rate: processedCount > 0 ? ((processedCount - allErrors.length) / processedCount * 100).toFixed(2) + '%' : '0%',
        avg_time_per_conversation: processedCount > 0 ? Math.round(duration / processedCount) + 'ms' : '0ms'
      }
    };

    // 如果有错误，记录详细信息
    if (allErrors.length > 0) {
      console.error(`处理过程中出现 ${allErrors.length} 个错误`);
      response.result.errors.forEach(err => {
        console.error(`  - ${err.conversation_id}: ${err.error}`);
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('智能转换失败:', error);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      duration_ms: duration
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/summary/convert',
    method: 'POST',
    description: '使用大模型智能判断，将对话合并到现有笔记或创建新笔记',
    parameters: {
      batch_size: {
        type: 'number',
        default: 10,
        description: '每次处理的对话数量（1-100）',
        example: 10
      },
      delay_ms: {
        type: 'number',
        default: 1000,
        description: '每个对话处理后的延迟时间（毫秒），避免API限流',
        example: 1000
      },
      skip_existing: {
        type: 'boolean',
        default: true,
        description: '是否跳过已处理的对话',
        example: true
      }
    },
    usage: {
      curl: 'curl -X POST http://localhost:3000/api/summary/convert -H "Content-Type: application/json" -d \'{"batch_size": 10, "delay_ms": 1000}\'',
      javascript: `fetch('/api/summary/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ batch_size: 10, delay_ms: 1000 })
})`
    },
    workflow: [
      '1. 读取现有笔记目录结构',
      '2. 大模型分析对话归属（领域/主题）',
      '3. 决策：merge（合并）/ create_new（新建）/ create_log_only（仅日志）',
      '4. 执行操作并创建日志',
      '5. 返回处理结果和统计信息'
    ]
  });
}
