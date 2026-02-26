#!/usr/bin/env node

/**
 * Knowledge Agent 执行脚本
 * 一键调用完整的知识同步流程
 */

const path = require('path');

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * 验证环境变量
 */
function validateEnvironment() {
  const required = ['OPENAI_API_KEY', 'OPENAI_BASE_URL'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
      `Please set them before running:\n` +
      `export OPENAI_API_KEY="your-key"\n` +
      `export OPENAI_BASE_URL="your-url"`
    );
  }
}

// 动态导入 lib 模块
async function runKnowledgeSync() {
  console.log('🧠 Knowledge Agent 启动...\n');
  
  const startTime = Date.now();
  
  try {
    // 验证环境变量
    validateEnvironment();
    
    // 导入 summary 系统（Node.js会自动处理.ts文件通过ts-node或Next.js）
    const summaryLib = await import(path.join(PROJECT_ROOT, 'lib/summary/index.ts'));
    
    // 1. 初始化系统（确保配置和目录正确）
    console.log('🔧 初始化系统...');
    await summaryLib.initializeSummarySystem();
    console.log('✅ 系统初始化完成\n');
    
    // 2. 处理对话历史（使用便捷函数）
    console.log('📊 步骤1: 处理对话历史...');
    const processResult = await summaryLib.quickProcess();
    
    console.log('✅ 对话处理完成:');
    console.log(`   - 处理对话数: ${processResult.processed}`);
    console.log(`   - 成功: ${processResult.success}`);
    console.log(`   - 失败: ${processResult.errors}`);
    console.log(`   - 耗时: ${processResult.duration_ms}ms\n`);
    
    // 如果没有新对话，跳过转换
    if (processResult.processed === 0) {
      console.log('ℹ️  没有新对话需要处理');
      
      // 获取统计信息
      const stats = await summaryLib.getSystemStats();
      
      return {
        success: true,
        processed: 0,
        created_logs: 0,
        created_notes: 0,
        updated_notes: 0,
        total_conversations: stats.total_conversations,
        total_topics: stats.total_topics,
        total_domains: stats.total_domains,
        duration_ms: Date.now() - startTime
      };
    }
    
    // 3. 转换为 Markdown
    console.log('📝 步骤2: 转换为Markdown文件...');
    const markdownConverterPath = path.join(PROJECT_ROOT, 'lib/summary/markdown-converter.ts');
    const { MarkdownConverter } = await import(markdownConverterPath);
    
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
    
    // 4. 创建备份
    console.log('💾 步骤3: 创建备份...');
    const backupPath = await summaryLib.createBackup();
    console.log(`✅ 备份已创建: ${backupPath}\n`);
    
    // 5. 获取系统统计
    console.log('📈 步骤4: 系统统计...');
    const stats = await summaryLib.getSystemStats();
    
    console.log('✅ 系统统计:');
    console.log(`   - 总对话数: ${stats.total_conversations}`);
    console.log(`   - 总主题数: ${stats.total_topics}`);
    console.log(`   - 总领域数: ${stats.total_domains}`);
    console.log(`   - 最后更新: ${new Date(stats.last_processed_timestamp).toLocaleString()}\n`);
    
    console.log('📊 处理统计:');
    console.log(`   - 历史处理总数: ${stats.processing.total_processed}`);
    console.log(`   - 平均处理时间: ${Math.round(stats.processing.avg_processing_time_ms)}ms`);
    console.log(`   - 成功率: ${(stats.processing.success_rate * 100).toFixed(1)}%\n`);
    
    if (stats.processing.recent_errors.length > 0) {
      console.warn('⚠️  最近的错误:');
      stats.processing.recent_errors.slice(0, 3).forEach(err => {
        console.warn(`   - ${err.error_type}: ${err.error_message}`);
      });
      console.log();
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Knowledge Agent 执行完成！总耗时: ${totalTime}ms\n`);
    
    // 返回执行结果（供 Agent 使用）
    return {
      success: true,
      processed: processResult.processed,
      created_logs: convertResult.created_logs,
      created_notes: convertResult.created_notes,
      updated_notes: convertResult.updated_notes,
      total_conversations: stats.total_conversations,
      total_topics: stats.total_topics,
      total_domains: stats.total_domains,
      backup_path: backupPath,
      processing_stats: {
        total_processed: stats.processing.total_processed,
        avg_time_ms: stats.processing.avg_processing_time_ms,
        success_rate: stats.processing.success_rate,
        recent_errors_count: stats.processing.recent_errors.length
      },
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
        if (result.backup_path) {
          console.log(`   - 备份文件: ${result.backup_path}`);
        }
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