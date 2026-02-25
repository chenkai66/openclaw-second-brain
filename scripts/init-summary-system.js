#!/usr/bin/env node

/**
 * 对话总结系统 - 初始化脚本
 * 用于初始化系统、测试连接、查看状态
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
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

function checkEnv() {
  log('\n📋 检查环境变量...', 'cyan');
  
  const required = ['OPENAI_API_KEY', 'OPENAI_BASE_URL'];
  const missing = [];
  
  for (const key of required) {
    if (process.env[key]) {
      log(`  ✅ ${key}: ${process.env[key].substring(0, 20)}...`, 'green');
    } else {
      log(`  ❌ ${key}: 未设置`, 'red');
      missing.push(key);
    }
  }
  
  return missing.length === 0;
}

function checkDirectories() {
  log('\n📁 检查目录结构...', 'cyan');
  
  const dirs = [
    './data/summaries',
    './data/summaries/backups',
    './data/summaries/logs',
  ];
  
  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      log(`  ✅ ${dir}`, 'green');
    } else {
      log(`  ⚠️  ${dir} - 不存在，正在创建...`, 'yellow');
      fs.mkdirSync(fullPath, { recursive: true });
      log(`  ✅ ${dir} - 已创建`, 'green');
    }
  }
}

function checkConfig() {
  log('\n⚙️  检查配置文件...', 'cyan');
  
  const configPath = path.join(process.cwd(), 'summary-config.json');
  
  if (fs.existsSync(configPath)) {
    log(`  ✅ summary-config.json 存在`, 'green');
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      log(`  ✅ 配置文件格式正确`, 'green');
      log(`  📊 模型: ${config.llm.model}`, 'blue');
      log(`  📊 批处理大小: ${config.processing.batch_size}`, 'blue');
      log(`  📊 相似度阈值: ${config.clustering.similarity_threshold}`, 'blue');
    } catch (error) {
      log(`  ❌ 配置文件格式错误: ${error.message}`, 'red');
      return false;
    }
  } else {
    log(`  ⚠️  summary-config.json 不存在`, 'yellow');
    log(`  💡 将使用默认配置`, 'blue');
  }
  
  return true;
}

async function testLLMConnection() {
  log('\n🤖 测试LLM连接...', 'cyan');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;
  
  if (!apiKey || !baseUrl) {
    log('  ❌ 缺少API配置', 'red');
    return false;
  }
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      log('  ✅ LLM连接成功', 'green');
      log(`  📝 响应: ${data.choices[0].message.content}`, 'blue');
      return true;
    } else {
      log('  ❌ LLM响应异常', 'red');
      log(`  📝 响应: ${JSON.stringify(data)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`  ❌ LLM连接失败: ${error.message}`, 'red');
    return false;
  }
}

async function checkAPIServer() {
  log('\n🌐 检查API服务器...', 'cyan');
  
  try {
    const response = await fetch('http://localhost:3000/api/summary/stats');
    
    if (response.ok) {
      const data = await response.json();
      log('  ✅ API服务器运行正常', 'green');
      log(`  📊 对话数: ${data.total_conversations}`, 'blue');
      log(`  📊 主题数: ${data.total_topics}`, 'blue');
      log(`  📊 领域数: ${data.total_domains}`, 'blue');
      return true;
    } else {
      log('  ❌ API服务器响应异常', 'red');
      return false;
    }
  } catch (error) {
    log('  ❌ 无法连接到API服务器', 'red');
    log('  💡 请确保运行: npm run dev', 'yellow');
    return false;
  }
}

async function main() {
  log('\n🧠 对话总结系统 - 初始化检查\n', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const envOk = checkEnv();
  checkDirectories();
  const configOk = checkConfig();
  
  if (!envOk) {
    log('\n❌ 环境变量检查失败', 'red');
    log('💡 请设置以下环境变量:', 'yellow');
    log('   export OPENAI_API_KEY="your-api-key"', 'yellow');
    log('   export OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"', 'yellow');
    process.exit(1);
  }
  
  if (!configOk) {
    log('\n❌ 配置文件检查失败', 'red');
    process.exit(1);
  }
  
  const llmOk = await testLLMConnection();
  const apiOk = await checkAPIServer();
  
  log('\n' + '='.repeat(50), 'cyan');
  log('\n📊 检查结果:', 'cyan');
  log(`  环境变量: ${envOk ? '✅' : '❌'}`, envOk ? 'green' : 'red');
  log(`  目录结构: ✅`, 'green');
  log(`  配置文件: ${configOk ? '✅' : '❌'}`, configOk ? 'green' : 'red');
  log(`  LLM连接: ${llmOk ? '✅' : '❌'}`, llmOk ? 'green' : 'red');
  log(`  API服务器: ${apiOk ? '✅' : '❌'}`, apiOk ? 'green' : 'red');
  
  if (envOk && configOk && llmOk && apiOk) {
    log('\n🎉 系统初始化完成，一切正常！', 'green');
    log('\n💡 下一步操作:', 'cyan');
    log('   1. 处理对话: curl -X POST http://localhost:3000/api/summary/process', 'blue');
    log('   2. 查看统计: curl http://localhost:3000/api/summary/stats', 'blue');
    log('   3. 搜索摘要: curl -X POST http://localhost:3000/api/summary/search -d \'{"query":"React"}\'', 'blue');
  } else {
    log('\n⚠️  部分检查失败，请修复后重试', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ 发生错误: ${error.message}`, 'red');
  process.exit(1);
});

