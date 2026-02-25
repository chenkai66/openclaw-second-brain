#!/usr/bin/env node

/**
 * 完整数据管道脚本
 * 
 * 执行流程：
 * 1. 读取对话历史 (.jsonl)
 * 2. 调用API处理对话，生成摘要
 * 3. 转换摘要为Markdown文件
 * 4. 更新同步状态
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// 发送HTTP请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function main() {
  console.log('🚀 启动完整数据管道...\n');

  try {
    // 步骤1: 处理对话，生成摘要
    console.log('📊 步骤1: 处理对话历史...');
    const processResult = await request('POST', '/api/summary/process', {
      batch_size: 10
    });

    if (!processResult.success) {
      console.error('❌ 处理对话失败:', processResult.error);
      process.exit(1);
    }

    console.log('✅ 对话处理完成:');
    console.log(`   - 处理对话数: ${processResult.processed_count}`);
    console.log(`   - 新增对话: ${processResult.new_conversations}`);
    console.log(`   - 更新主题: ${processResult.updated_topics}`);
    console.log(`   - 更新领域: ${processResult.updated_domains}`);
    console.log(`   - 耗时: ${processResult.duration_ms}ms\n`);

    // 如果没有新对话，跳过转换
    if (processResult.new_conversations === 0) {
      console.log('ℹ️  没有新对话需要转换，流程结束。');
      return;
    }

    // 步骤2: 转换摘要为Markdown
    console.log('📝 步骤2: 转换摘要为Markdown文件...');
    const convertResult = await request('POST', '/api/summary/convert');

    if (!convertResult.success) {
      console.error('❌ 转换失败:', convertResult.error);
      process.exit(1);
    }

    console.log('✅ Markdown转换完成:');
    console.log(`   - 创建日志: ${convertResult.result.created_logs}`);
    console.log(`   - 创建笔记: ${convertResult.result.created_notes}`);
    console.log(`   - 更新笔记: ${convertResult.result.updated_notes}`);
    console.log(`   - 耗时: ${convertResult.result.duration_ms}ms\n`);

    if (convertResult.result.errors.length > 0) {
      console.warn('⚠️  转换过程中出现错误:');
      convertResult.result.errors.forEach(err => {
        console.warn(`   - ${err.file}: ${err.error}`);
      });
      console.log();
    }

    // 步骤3: 显示统计信息
    console.log('📈 步骤3: 获取统计信息...');
    const statsResult = await request('GET', '/api/summary/stats');

    if (statsResult.success) {
      console.log('✅ 系统统计:');
      console.log(`   - 总对话数: ${statsResult.stats.total_conversations}`);
      console.log(`   - 总主题数: ${statsResult.stats.total_topics}`);
      console.log(`   - 总领域数: ${statsResult.stats.total_domains}`);
      console.log(`   - 最后更新: ${new Date(statsResult.stats.last_updated).toLocaleString()}\n`);
    }

    console.log('🎉 完整数据管道执行成功！');
    console.log('\n📂 生成的文件位置:');
    console.log('   - 日志文件: content/logs/');
    console.log('   - 笔记文件: content/notes/');
    console.log('   - 摘要数据: data/summaries/');

  } catch (error) {
    console.error('❌ 管道执行失败:', error.message);
    process.exit(1);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await request('GET', '/api/summary/stats');
    return true;
  } catch (error) {
    return false;
  }
}

// 主入口
(async () => {
  console.log('🔍 检查服务器状态...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.error('❌ 服务器未运行！');
    console.error('请先启动开发服务器: npm run dev');
    process.exit(1);
  }

  console.log('✅ 服务器运行正常\n');
  await main();
})();

