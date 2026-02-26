#!/usr/bin/env node

/**
 * Knowledge Agent 执行脚本
 * 一键调用完整的知识同步流程
 */

const path = require('path');
const fs = require('fs');

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// 动态导入 lib 模块
async function runKnowledgeSync() {
  console.log('🧠 Knowledge Agent 启动...\n');
  
  const startTime = Date.now();
  
  try {
    // 1. 导入 summary 系统
    const summaryLib = await import(path.join(PROJECT_ROOT, 'lib/summary/index.ts'));
    
    console.log('📊 步骤1: 处理对话历史...');
    const { conversationProcessor } = await import(path.join(PROJECT_ROOT, 'lib/summary/conversation-processor.ts'));
    
    // 处理所有未处理的对话
    const processResult = await conversationProcessor.processAll();
    
    console.log('✅ 对话处理完成:');
    console.log(`   - 处理对话数: ${processResult.processed_count}`);
    console.log(`   - 成功: ${processResult.success_count}`);
    console.log(`   - 失败: ${processResult.error_count}`);
    console.log(`   - 耗时: ${processResult.duration_ms}ms\n`);
    
    // 如果没有新对话，跳过转换
    if (processResult.processed_count === 0) {
      console.log('ℹ️  没有新对话需要处理');
      return {
        success: true,
        processed: 0,
        created_logs: 0,
        created_notes: 0,
        updated_notes: 0
      };
    }
    
    // 2. 转换为 Markdown
    console.log('📝 步骤2: 转换为Markdown文件...');
    const { MarkdownConverter } = await import(path.join(PROJECT_ROOT, 'lib/summary/markdown-converter.ts'));
    
    const converter = new MarkdownConverter();
    const convertResult = await converter.convertAll();
    
    console.log('✅ Markdown转换完成:');
    console.log(`   - 创建日志: ${convertResult.created_logs}`);
    console.log(`   - 创建笔记: ${convertResult.created_notes}`);
    console.log(`   - 更新笔记: ${convertResult.updated_notes}`);
    console.log(`   - 耗时: ${convertResult.duration_ms}ms\n`);
    
    if (convertResult.errors.length > 0) {
      console.warn('⚠️  转换过程中出现错误:');
      convertResult.errors.forEach(err => {
        console.warn(`   - ${err.file}: ${err.error}`);
      });
      console.log();
    }
    
    // 3. 获取统计信息
    console.log('📈 步骤3: 系统统计...');
    const { summaryStorage } = await import(path.join(PROJECT_ROOT, 'lib/summary/summary-storage.ts'));
    
    const metadata = summaryStorage.loadMetadata();
    console.log('✅ 系统统计:');
    console.log(`   - 总对话数: ${metadata.statistics.total_conversations}`);
    console.log(`   - 总主题数: ${metadata.statistics.total_topics}`);
    console.log(`   - 总领域数: ${metadata.statistics.total_domains}`);
    console.log(`   - 最后更新: ${new Date(metadata.statistics.last_updated).toLocaleString()}\n`);
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Knowledge Agent 执行完成！总耗时: ${totalTime}ms\n`);
    
    // 返回执行结果（供 Agent 使用）
    return {
      success: true,
      processed: processResult.processed_count,
      created_logs: convertResult.created_logs,
      created_notes: convertResult.created_notes,
      updated_notes: convertResult.updated_notes,
      total_conversations: metadata.statistics.total_conversations,
      total_topics: metadata.statistics.total_topics,
      total_domains: metadata.statistics.total_domains,
      duration_ms: totalTime
    };
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    console.error(error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 主入口
if (require.main === module) {
  runKnowledgeSync()
    .then(result => {
      if (result.success) {
        console.log('📂 生成的文件位置:');
        console.log('   - 日志文件: content/logs/');
        console.log('   - 笔记文件: content/notes/');
        console.log('   - 摘要数据: data/summaries/');
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runKnowledgeSync };

