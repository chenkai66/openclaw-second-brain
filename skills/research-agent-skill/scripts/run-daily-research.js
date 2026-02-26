#!/usr/bin/env node

/**
 * Research Agent 执行脚本
 * 分析用户兴趣并生成研究报告
 */

const path = require('path');
const fs = require('fs');

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

async function runDailyResearch() {
  console.log('🔬 Research Agent 启动...\n');
  
  const startTime = Date.now();
  
  try {
    // 1. 分析用户兴趣
    console.log('📊 步骤1: 分析用户兴趣...');
    const { summaryRetriever } = await import(path.join(PROJECT_ROOT, 'lib/summary/summary-retriever.ts'));
    const { summaryStorage } = await import(path.join(PROJECT_ROOT, 'lib/summary/summary-storage.ts'));
    
    // 获取最近7天的热门主题
    const metadata = summaryStorage.loadMetadata();
    const recentTopics = Object.entries(metadata.topics)
      .map(([id, topic]) => ({
        id,
        name: topic.name,
        count: topic.conversation_count,
        lastUpdated: new Date(topic.last_updated)
      }))
      .filter(topic => {
        const daysSince = (Date.now() - topic.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    console.log('✅ 发现热门主题:');
    recentTopics.forEach((topic, i) => {
      console.log(`   ${i + 1}. ${topic.name} (${topic.count}次讨论)`);
    });
    console.log();
    
    if (recentTopics.length === 0) {
      console.log('ℹ️  最近7天没有足够的讨论数据');
      return {
        success: true,
        topics_analyzed: 0,
        reports_generated: 0
      };
    }
    
    // 2. 选择研究主题（选择讨论最多的）
    const selectedTopic = recentTopics[0];
    console.log(`🎯 选择研究主题: ${selectedTopic.name}\n`);
    
    // 3. 搜索相关对话
    console.log('🔍 步骤2: 搜索相关对话...');
    const searchResults = await summaryRetriever.search({
      query: selectedTopic.name,
      search_type: 'hybrid',
      limit: 20
    });
    
    console.log(`✅ 找到 ${searchResults.results.length} 条相关对话\n`);
    
    // 4. 生成研究报告
    console.log('📝 步骤3: 生成研究报告...');
    
    const reportDate = new Date().toISOString().split('T')[0];
    const reportTitle = `${selectedTopic.name} - 研究报告`;
    const reportSlug = `${reportDate}-${selectedTopic.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // 提取关键信息
    const keyPoints = searchResults.results
      .slice(0, 10)
      .map(r => r.summary || r.title)
      .filter(Boolean);
    
    // 生成报告内容
    const reportContent = `---
date: ${reportDate}
type: daily-research
title: ${reportTitle}
summary: 基于最近7天的对话分析，深入研究 ${selectedTopic.name} 相关内容
tags: [${selectedTopic.name}, research, auto-generated]
ai_generated: true
conversation_count: ${selectedTopic.count}
---

# ${reportTitle}

## 研究背景

基于最近7天的对话分析，发现 **${selectedTopic.name}** 是你最关注的话题之一，共有 ${selectedTopic.count} 次相关讨论。

## 核心发现

${keyPoints.map((point, i) => `### ${i + 1}. ${point}\n`).join('\n')}

## 相关对话

${searchResults.results.slice(0, 5).map(r => `- **${r.title}** (${new Date(r.timestamp).toLocaleDateString()})`).join('\n')}

## 推荐行动

- [ ] 深入学习 ${selectedTopic.name} 的核心概念
- [ ] 实践相关技术和工具
- [ ] 关注社区最新动态

## 数据来源

- 分析时间范围: 最近7天
- 相关对话数: ${searchResults.results.length}
- 生成时间: ${new Date().toLocaleString()}

---

*本报告由 Research Agent 自动生成*
`;
    
    // 保存报告
    const reportsDir = path.join(PROJECT_ROOT, 'content/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, `${reportSlug}.md`);
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    
    console.log(`✅ 报告已保存: ${reportPath}\n`);
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Research Agent 执行完成！总耗时: ${totalTime}ms\n`);
    
    // 返回执行结果
    return {
      success: true,
      topics_analyzed: recentTopics.length,
      selected_topic: selectedTopic.name,
      reports_generated: 1,
      report_path: reportPath,
      conversation_count: searchResults.results.length,
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
  runDailyResearch()
    .then(result => {
      if (result.success) {
        console.log('📊 执行摘要:');
        console.log(`   - 分析主题数: ${result.topics_analyzed}`);
        console.log(`   - 选择主题: ${result.selected_topic}`);
        console.log(`   - 生成报告: ${result.reports_generated}`);
        console.log(`   - 报告位置: ${result.report_path}`);
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

module.exports = { runDailyResearch };

