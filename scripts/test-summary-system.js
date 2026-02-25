#!/usr/bin/env node

/**
 * 对话总结系统 - 测试脚本
 * 测试完整的工作流程
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, method, url, body = null) {
  log(`\n🧪 测试: ${name}`, 'cyan');
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const startTime = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      log(`  ✅ 成功 (${duration}ms)`, 'green');
      log(`  📝 响应: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, 'blue');
      return { success: true, data };
    } else {
      const error = await response.text();
      log(`  ❌ 失败 (${response.status})`, 'red');
      log(`  📝 错误: ${error}`, 'yellow');
      return { success: false, error };
    }
  } catch (error) {
    log(`  ❌ 异常: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createTestData() {
  log('\n📝 创建测试数据...', 'cyan');
  
  const sessionsDir = path.join(process.env.HOME, '.openclaw/agents/main/sessions');
  
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
    log('  ✅ 创建会话目录', 'green');
  }
  
  const testData = [
    {
      id: 'test_conv_001',
      timestamp: new Date().toISOString(),
      messages: [
        { role: 'user', content: '我想学习React性能优化，有什么好的方法吗？' },
        { role: 'assistant', content: 'React性能优化有几个关键方法：1. 使用React.memo避免不必要的重渲染 2. 使用useMemo和useCallback缓存计算结果和函数 3. 使用代码分割和懒加载' }
      ]
    },
    {
      id: 'test_conv_002',
      timestamp: new Date(Date.now() + 1000).toISOString(),
      messages: [
        { role: 'user', content: 'Docker容器化部署有什么注意事项？' },
        { role: 'assistant', content: 'Docker容器化部署需要注意：1. 使用多阶段构建减小镜像体积 2. 合理设置资源限制 3. 使用.dockerignore排除不必要的文件' }
      ]
    },
    {
      id: 'test_conv_003',
      timestamp: new Date(Date.now() + 2000).toISOString(),
      messages: [
        { role: 'user', content: 'TypeScript的高级类型有哪些？' },
        { role: 'assistant', content: 'TypeScript的高级类型包括：1. 联合类型 2. 交叉类型 3. 条件类型 4. 映射类型' }
      ]
    }
  ];
  
  const testFile = path.join(sessionsDir, 'test-session.jsonl');
  const content = testData.map(d => JSON.stringify(d)).join('\n');
  fs.writeFileSync(testFile, content);
  
  log(`  ✅ 创建测试文件: ${testFile}`, 'green');
  log(`  📊 测试对话数: ${testData.length}`, 'blue');
}

async function main() {
  log('\n🧠 对话总结系统 - 完整测试\n', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const baseUrl = 'http://localhost:3000/api/summary';
  
  // 1. 测试获取统计（初始状态）
  const stats1 = await testAPI(
    '获取统计信息（初始）',
    'GET',
    `${baseUrl}/stats`
  );
  
  // 2. 创建测试数据
  await createTestData();
  
  // 3. 测试处理对话
  const process = await testAPI(
    '处理新对话',
    'POST',
    `${baseUrl}/process`,
    { batch_size: 10 }
  );
  
  if (process.success) {
    log(`\n📊 处理结果:`, 'cyan');
    log(`  处理数量: ${process.data.processed_count}`, 'blue');
    log(`  成功数量: ${process.data.new_conversations}`, 'blue');
    log(`  新增主题: ${process.data.updated_topics}`, 'blue');
    log(`  新增领域: ${process.data.updated_domains}`, 'blue');
    log(`  处理时间: ${process.data.duration_ms}ms`, 'blue');
  }
  
  // 等待一下让数据写入完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. 测试获取统计（处理后）
  const stats2 = await testAPI(
    '获取统计信息（处理后）',
    'GET',
    `${baseUrl}/stats`
  );
  
  // 5. 测试获取摘要树
  const tree = await testAPI(
    '获取摘要树',
    'GET',
    `${baseUrl}/tree?depth=3`
  );
  
  // 6. 测试搜索
  const search = await testAPI(
    '搜索摘要',
    'POST',
    `${baseUrl}/search`,
    { query: 'React', search_type: 'hybrid', limit: 5 }
  );
  
  // 7. 测试推荐
  if (search.success && search.data.results.length > 0) {
    const convId = search.data.results[0].id;
    await testAPI(
      '智能推荐',
      'GET',
      `${baseUrl}/recommend?conversation_id=${convId}&limit=3`
    );
  }
  
  // 8. 测试聚类
  const cluster = await testAPI(
    '触发聚类',
    'POST',
    `${baseUrl}/cluster`,
    { target: 'topics', min_similarity: 0.7 }
  );
  
  // 9. 测试重建索引
  const rebuild = await testAPI(
    '重建索引',
    'POST',
    `${baseUrl}/rebuild-index`,
    { full_rebuild: true }
  );
  
  // 10. 最终统计
  const statsFinal = await testAPI(
    '获取最终统计',
    'GET',
    `${baseUrl}/stats?include_history=true`
  );
  
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 测试总结:', 'cyan');
  
  const tests = [
    { name: '初始统计', result: stats1 },
    { name: '处理对话', result: process },
    { name: '处理后统计', result: stats2 },
    { name: '摘要树', result: tree },
    { name: '搜索', result: search },
    { name: '聚类', result: cluster },
    { name: '重建索引', result: rebuild },
    { name: '最终统计', result: statsFinal },
  ];
  
  const passed = tests.filter(t => t.result.success).length;
  const total = tests.length;
  
  tests.forEach(t => {
    log(`  ${t.result.success ? '✅' : '❌'} ${t.name}`, t.result.success ? 'green' : 'red');
  });
  
  log(`\n📈 通过率: ${passed}/${total} (${Math.round(passed/total*100)}%)`, 
    passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 所有测试通过！系统运行正常！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查日志', 'yellow');
  }
  
  log('\n💡 提示:', 'cyan');
  log('  - 查看数据: ls -la data/summaries/', 'blue');
  log('  - 查看备份: ls -la data/summaries/backups/', 'blue');
  log('  - 清理测试数据: rm ~/.openclaw/agents/main/sessions/test-session.jsonl', 'blue');
}

main().catch(error => {
  log(`\n❌ 测试失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

