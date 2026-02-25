#!/usr/bin/env node

/**
 * 测试智能合并API
 * 
 * 测试场景：
 * 1. 空数据测试
 * 2. 单个对话测试
 * 3. 批量对话测试
 * 4. 错误处理测试
 * 5. 参数验证测试
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testServerConnection() {
  log('\n🔍 测试1: 检查服务器连接...', 'cyan');
  try {
    const response = await request('GET', '/api/summary/convert');
    if (response.status === 200) {
      log('✅ 服务器连接正常', 'green');
      log(`   API文档: ${JSON.stringify(response.data.description)}`, 'blue');
      return true;
    } else {
      log(`❌ 服务器响应异常: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 无法连接到服务器: ${error.message}`, 'red');
    log('   请确保开发服务器正在运行: npm run dev', 'yellow');
    return false;
  }
}

async function testParameterValidation() {
  log('\n🔍 测试2: 参数验证...', 'cyan');
  
  // 测试无效的batch_size
  try {
    const response = await request('POST', '/api/summary/convert', {
      batch_size: 200 // 超过最大值
    });
    
    if (response.status === 400 && response.data.error) {
      log('✅ 参数验证正常工作', 'green');
      log(`   错误信息: ${response.data.error}`, 'blue');
    } else {
      log('⚠️  参数验证可能有问题', 'yellow');
    }
  } catch (error) {
    log(`❌ 参数验证测试失败: ${error.message}`, 'red');
  }
}

async function testEmptyData() {
  log('\n🔍 测试3: 空数据处理...', 'cyan');
  
  try {
    const response = await request('POST', '/api/summary/convert', {
      batch_size: 5
    });
    
    if (response.status === 400) {
      log('✅ 空数据处理正常', 'green');
      log(`   提示信息: ${response.data.message}`, 'blue');
    } else if (response.status === 200) {
      log('✅ 有数据可处理', 'green');
      log(`   处理结果: ${response.data.message}`, 'blue');
    } else {
      log(`⚠️  意外的响应状态: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ 空数据测试失败: ${error.message}`, 'red');
  }
}

async function testProcessConversations() {
  log('\n🔍 测试4: 处理对话...', 'cyan');
  
  try {
    // 先检查是否有摘要数据
    const statsResponse = await request('GET', '/api/summary/stats');
    
    if (statsResponse.status === 200 && statsResponse.data.success) {
      const stats = statsResponse.data.stats;
      log(`   当前统计: ${stats.total_conversations} 个对话, ${stats.total_topics} 个主题`, 'blue');
      
      if (stats.total_conversations === 0) {
        log('⚠️  没有对话数据，请先运行: npm run summary:process', 'yellow');
        return;
      }
    }
    
    // 测试转换
    log('   开始转换对话为Markdown...', 'blue');
    const convertResponse = await request('POST', '/api/summary/convert', {
      batch_size: 3,
      delay_ms: 500
    });
    
    if (convertResponse.status === 200 && convertResponse.data.success) {
      const result = convertResponse.data.result;
      log('✅ 对话处理成功', 'green');
      log(`   处理数量: ${result.processed}`, 'blue');
      log(`   合并到现有笔记: ${result.merged_to_existing}`, 'blue');
      log(`   创建新笔记: ${result.created_notes}`, 'blue');
      log(`   创建日志: ${result.created_logs}`, 'blue');
      log(`   错误数量: ${result.errors.length}`, result.errors.length > 0 ? 'yellow' : 'blue');
      log(`   耗时: ${result.duration_ms}ms`, 'blue');
      
      if (convertResponse.data.stats) {
        log(`   成功率: ${convertResponse.data.stats.success_rate}`, 'blue');
        log(`   平均处理时间: ${convertResponse.data.stats.avg_time_per_conversation}`, 'blue');
      }
      
      if (result.errors.length > 0) {
        log('\n   错误详情:', 'yellow');
        result.errors.forEach(err => {
          log(`   - ${err.conversation_id}: ${err.error}`, 'yellow');
        });
      }
      
      if (result.updated_notes.length > 0) {
        log('\n   更新的笔记:', 'blue');
        result.updated_notes.slice(0, 5).forEach(note => {
          log(`   - ${note.title}`, 'blue');
        });
        if (result.updated_notes.length > 5) {
          log(`   ... 还有 ${result.updated_notes.length - 5} 个`, 'blue');
        }
      }
    } else {
      log(`⚠️  处理失败: ${convertResponse.data.error || convertResponse.data.message}`, 'yellow');
    }
  } catch (error) {
    log(`❌ 对话处理测试失败: ${error.message}`, 'red');
  }
}

async function testErrorHandling() {
  log('\n🔍 测试5: 错误处理...', 'cyan');
  
  try {
    // 测试无效的JSON
    const response = await request('POST', '/api/summary/convert', null);
    
    if (response.status === 200 || response.status === 400) {
      log('✅ 错误处理正常', 'green');
    } else {
      log(`⚠️  意外的错误响应: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`❌ 错误处理测试失败: ${error.message}`, 'red');
  }
}

async function testFileGeneration() {
  log('\n🔍 测试6: 检查生成的文件...', 'cyan');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const notesDir = path.join(process.cwd(), 'content/notes');
    const logsDir = path.join(process.cwd(), 'content/logs');
    
    // 检查目录是否存在
    if (fs.existsSync(notesDir)) {
      const notes = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
      log(`✅ 笔记目录存在: ${notes.length} 个文件`, 'green');
      
      if (notes.length > 0) {
        log('   最新的笔记:', 'blue');
        notes.slice(-3).forEach(note => {
          log(`   - ${note}`, 'blue');
        });
      }
    } else {
      log('⚠️  笔记目录不存在', 'yellow');
    }
    
    if (fs.existsSync(logsDir)) {
      const logs = fs.readdirSync(logsDir).filter(f => f.endsWith('.md'));
      log(`✅ 日志目录存在: ${logs.length} 个文件`, 'green');
      
      if (logs.length > 0) {
        log('   最新的日志:', 'blue');
        logs.slice(-3).forEach(log => {
          console.log(`   - ${log}`);
        });
      }
    } else {
      log('⚠️  日志目录不存在', 'yellow');
    }
  } catch (error) {
    log(`❌ 文件检查失败: ${error.message}`, 'red');
  }
}

async function runAllTests() {
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║        智能合并API测试套件                              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  const serverOk = await testServerConnection();
  
  if (!serverOk) {
    log('\n❌ 服务器未运行，测试终止', 'red');
    process.exit(1);
  }
  
  await testParameterValidation();
  await testEmptyData();
  await testProcessConversations();
  await testErrorHandling();
  await testFileGeneration();
  
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║        测试完成                                         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n📝 下一步:', 'blue');
  log('   1. 查看生成的笔记: content/notes/', 'blue');
  log('   2. 查看生成的日志: content/logs/', 'blue');
  log('   3. 在前端查看: http://localhost:3000/notes', 'blue');
}

// 主入口
runAllTests().catch(error => {
  log(`\n❌ 测试套件执行失败: ${error.message}`, 'red');
  process.exit(1);
});

