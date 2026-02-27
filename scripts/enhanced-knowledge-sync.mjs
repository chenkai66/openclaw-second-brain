#!/usr/bin/env node

/**
 * 增强版知识同步脚本
 * 支持 OpenClaw + Claude Code 双源对话处理
 */

import { claudeCodeAdapter } from '../lib/claude-code-adapter.js';
import { quickProcess, initializeSummarySystem } from '../lib/summary/index.js';

async function main() {
  console.log('🤖 Knowledge Sync Agent - Enhanced Version');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const startTime = Date.now();
  const results = {
    claudeCode: { processed: 0, exported: 0, errors: 0 },
    openclaw: { processed: 0, created_logs: 0, created_notes: 0, updated_notes: 0 },
    total: { conversations: 0, notes: 0, logs: 0 },
  };

  try {
    // 步骤 1: 初始化系统
    console.log('📋 Step 1/4: Initializing system...');
    await initializeSummarySystem();
    console.log('✅ System initialized\n');

    // 步骤 2: 处理 Claude Code 对话
    console.log('📋 Step 2/4: Processing Claude Code conversations...');
    try {
      const stats = await claudeCodeAdapter.getStats();
      console.log(`   Found ${stats.totalProjects} Claude Code projects`);
      console.log(`   Total sessions: ${stats.totalSessions}`);
      console.log(`   Processed: ${stats.processedSessions}`);
      console.log(`   Unprocessed: ${stats.unprocessedSessions}`);

      if (stats.unprocessedSessions > 0) {
        const conversations = await claudeCodeAdapter.getUnprocessedConversations();
        console.log(`   Discovered ${conversations.length} new conversations`);

        for (const conversation of conversations) {
          try {
            const exportedPath = await claudeCodeAdapter.exportToOpenClaw(conversation);
            console.log(`   ✅ Exported: ${conversation.id} (${conversation.messages.length} messages)`);
            results.claudeCode.exported++;
          } catch (error) {
            console.error(`   ❌ Failed to export ${conversation.id}:`, error);
            results.claudeCode.errors++;
          }
        }

        results.claudeCode.processed = conversations.length;
      } else {
        console.log('   ℹ️  No new Claude Code conversations to process');
      }
    } catch (error) {
      console.error('❌ Error processing Claude Code conversations:', error);
      results.claudeCode.errors++;
    }
    console.log('');

    // 步骤 3: 处理所有对话（OpenClaw + 导出的 Claude Code）
    console.log('📋 Step 3/4: Processing conversations and generating summaries...');
    try {
      const processResult = await quickProcess();

      if (processResult.success) {
        results.openclaw.processed = processResult.processed || 0;
        results.openclaw.created_logs = processResult.created_logs || 0;
        results.openclaw.created_notes = processResult.created_notes || 0;
        results.openclaw.updated_notes = processResult.updated_notes || 0;

        console.log(`   ✅ Processed ${results.openclaw.processed} conversations`);
        console.log(`   📝 Created ${results.openclaw.created_logs} logs`);
        console.log(`   📄 Created ${results.openclaw.created_notes} notes`);
        console.log(`   🔄 Updated ${results.openclaw.updated_notes} notes`);
      } else {
        console.log('   ℹ️  No new conversations to process');
      }
    } catch (error) {
      console.error('❌ Error in processing pipeline:', error);
    }
    console.log('');

    // 步骤 4: 生成统计报告
    console.log('📋 Step 4/4: Generating statistics...');
    results.total.conversations = results.claudeCode.processed + results.openclaw.processed;
    results.total.notes = results.openclaw.created_notes + results.openclaw.updated_notes;
    results.total.logs = results.openclaw.created_logs;

    const duration = Date.now() - startTime;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Sync Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Claude Code:');
    console.log(`  - Processed: ${results.claudeCode.processed}`);
    console.log(`  - Exported: ${results.claudeCode.exported}`);
    console.log(`  - Errors: ${results.claudeCode.errors}`);
    console.log('');
    console.log('OpenClaw + Claude Code:');
    console.log(`  - Total processed: ${results.openclaw.processed}`);
    console.log(`  - Logs created: ${results.openclaw.created_logs}`);
    console.log(`  - Notes created: ${results.openclaw.created_notes}`);
    console.log(`  - Notes updated: ${results.openclaw.updated_notes}`);
    console.log('');
    console.log('Total:');
    console.log(`  - Conversations: ${results.total.conversations}`);
    console.log(`  - Notes: ${results.total.notes}`);
    console.log(`  - Logs: ${results.total.logs}`);
    console.log(`  - Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Knowledge sync completed successfully!');
    console.log('');

    // 输出 JSON 结果（供 OpenClaw Agent 解析）
    const jsonResult = {
      success: true,
      claudeCode: results.claudeCode,
      openclaw: results.openclaw,
      total: results.total,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('JSON_RESULT:', JSON.stringify(jsonResult));

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Knowledge sync failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error);
    console.error('');

    const jsonResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    console.log('JSON_RESULT:', JSON.stringify(jsonResult));

    process.exit(1);
  }
}

main();
