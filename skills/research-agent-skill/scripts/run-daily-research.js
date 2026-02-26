#!/usr/bin/env node

/**
 * Research Agent 执行脚本
 * 调用lib接口获取用户兴趣数据，供Agent分析和研究
 */

import path from 'path';
import fs from 'fs';

// 项目根目录
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');

async function runDailyResearch() {
  console.log('🔬 Research Agent 启动...\n');
  
  const startTime = Date.now();
  
  try {
    // 导入lib模块
    const { summaryRetriever } = await import(path.join(PROJECT_ROOT, 'lib/summary/summary-retriever.ts'));
    const { summaryStorage } = await import(path.join(PROJECT_ROOT, 'lib/summary/summary-storage.ts'));
    
    // 1. 获取热门主题（最近7天）
    console.log('📊 步骤1: 获取热门主题...');
    const topTopics = summaryRetriever.getTopTopics(10);
    
    // 过滤最近7天的主题
    const recentTopics = topTopics.filter(item => {
      const daysSince = (Date.now() - new Date(item.topic.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    console.log(`✅ 找到 ${recentTopics.length} 个热门主题\n`);
    
    // 2. 获取热门关键词
    console.log('📊 步骤2: 获取热门关键词...');
    const topKeywords = summaryRetriever.getTopKeywords(20);
    console.log(`✅ 找到 ${topKeywords.length} 个热门关键词\n`);
    
    // 3. 获取统计信息
    console.log('📊 步骤3: 获取统计信息...');
    const metadata = summaryStorage.loadMetadata();
    const allDomains = summaryStorage.getAllDomains();
    
    console.log('✅ 统计信息:');
    console.log(`   - 总对话数: ${metadata.statistics.total_conversations}`);
    console.log(`   - 总主题数: ${metadata.statistics.total_topics}`);
    console.log(`   - 总领域数: ${metadata.statistics.total_domains}\n`);
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 数据获取完成！总耗时: ${totalTime}ms\n`);
    
    // 返回结构化数据供Agent使用
    return {
      success: true,
      data: {
        // 热门主题（按讨论热度排序）
        top_topics: recentTopics.map(item => ({
          id: item.topic.id,
          name: item.topic.name,
          domain: item.domain.name,
          conversation_count: item.topic.conversation_count,
          score: item.score,
          updated_at: item.topic.updated_at,
          keywords: item.topic.conversations.flatMap(c => c.keywords).slice(0, 10)
        })),
        
        // 热门关键词（按出现频率排序）
        top_keywords: topKeywords,
        
        // 所有领域
        domains: allDomains.map(d => ({
          id: d.id,
          name: d.name,
          topic_count: d.topics.length
        })),
        
        // 统计信息
        statistics: {
          total_conversations: metadata.statistics.total_conversations,
          total_topics: metadata.statistics.total_topics,
          total_domains: metadata.statistics.total_domains,
          last_updated: metadata.statistics.last_processed_timestamp
        }
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
if (import.meta.main) {
  runDailyResearch()
    .then(result => {
      if (result.success) {
        console.log('📊 返回数据摘要:');
        console.log(`   - 热门主题: ${result.data.top_topics.length} 个`);
        console.log(`   - 热门关键词: ${result.data.top_keywords.length} 个`);
        console.log(`   - 领域数: ${result.data.domains.length} 个`);
        console.log(`   - 总对话数: ${result.data.statistics.total_conversations}`);
        console.log();
        console.log('💡 Agent可以使用这些数据:');
        console.log('   1. 分析用户兴趣点（top_topics, top_keywords）');
        console.log('   2. 选择研究主题');
        console.log('   3. 使用搜索工具查找相关资料');
        console.log('   4. 生成研究报告');
        console.log();
        console.log('📄 完整数据已返回JSON格式');
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

export { runDailyResearch };