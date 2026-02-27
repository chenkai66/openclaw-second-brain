#!/usr/bin/env node

/**
 * OpenClaw Second Brain 健康检查脚本
 *
 * 检查系统配置、依赖、环境变量、文件权限等
 * 帮助快速诊断常见问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(title, 'bright');
  log('='.repeat(60), 'blue');
}

let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

// 主检查函数
async function runHealthCheck() {
  log('\n🔍 OpenClaw Second Brain - 系统健康检查\n', 'bright');

  // 1. 检查 Node.js 版本
  section('1. Node.js 环境');
  checkNodeVersion();

  // 2. 检查环境变量
  section('2. 环境变量配置');
  checkEnvironmentVariables();

  // 3. 检查依赖
  section('3. 依赖检查');
  checkDependencies();

  // 4. 检查文件和目录
  section('4. 文件系统');
  checkFileSystem();

  // 5. 检查 OpenClaw 路径
  section('5. OpenClaw 配置');
  checkOpenClawPath();

  // 6. 检查配置文件
  section('6. 配置文件');
  checkConfigFiles();

  // 7. 检查 API 连接性（可选）
  section('7. API 连接性');
  await checkAPIConnection();

  // 8. 打印总结
  section('健康检查总结');
  printSummary();
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    info(`Node.js 版本: ${version}`);

    if (majorVersion >= 18) {
      success('Node.js 版本满足要求 (>=18)');
      passedChecks++;
    } else {
      error(`Node.js 版本过低，需要 18 或更高版本，当前: ${version}`);
      failedChecks++;
    }
  } catch (err) {
    error(`无法检查 Node.js 版本: ${err.message}`);
    failedChecks++;
  }
}

function checkEnvironmentVariables() {
  const requiredEnvVars = [
    { name: 'OPENAI_API_KEY', description: 'OpenAI 兼容 API 密钥' },
    { name: 'OPENAI_BASE_URL', description: 'OpenAI 兼容 API 基础 URL' },
  ];

  const optionalEnvVars = [
    { name: 'OPENCLAW_SESSIONS_PATH', description: 'OpenClaw 会话文件路径' },
    { name: 'PORT', description: '服务器端口' },
    { name: 'LOG_LEVEL', description: '日志级别' },
  ];

  info('必需的环境变量:');
  requiredEnvVars.forEach(({ name, description }) => {
    if (process.env[name]) {
      success(`${name}: ✓ (${description})`);
      passedChecks++;
    } else {
      error(`${name}: ✗ 未设置 (${description})`);
      failedChecks++;
    }
  });

  info('\n可选的环境变量:');
  optionalEnvVars.forEach(({ name, description }) => {
    if (process.env[name]) {
      success(`${name}: ✓ (${description})`);
    } else {
      warning(`${name}: 未设置 (${description})`);
      warnings++;
    }
  });

  // 检查 .env 文件
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    success('.env 文件存在');
  } else {
    warning('.env 文件不存在，请参考 .env.example 创建');
    warning(`你可以运行: cp .env.example .env`);
    warnings++;
  }
}

function checkDependencies() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    info(`项目名称: ${packageJson.name}`);
    info(`版本: ${packageJson.version}`);

    // 检查关键依赖
    const criticalDeps = [
      'next',
      'react',
      'react-dom',
    ];

    const missingDeps = [];

    criticalDeps.forEach((dep) => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        success(`${dep}: ${packageJson.dependencies[dep]}`);
        passedChecks++;
      } else {
        error(`${dep}: 未安装`);
        missingDeps.push(dep);
        failedChecks++;
      }
    });

    // 检查 node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      success('node_modules 目录存在');
      passedChecks++;
    } else {
      error('node_modules 目录不存在，请运行: npm install');
      failedChecks++;
    }

    // 检查 ts-node
    const tsNodePath = path.join(process.cwd(), 'node_modules', 'ts-node');
    if (fs.existsSync(tsNodePath)) {
      success('ts-node 已安装');
      passedChecks++;
    } else {
      warning('ts-node 未安装，某些脚本可能无法运行');
      warning('安装命令: npm install ts-node@^10.9.2 --save-dev');
      warnings++;
    }

  } catch (err) {
    error(`无法检查依赖: ${err.message}`);
    failedChecks++;
  }
}

function checkFileSystem() {
  const requiredDirs = [
    { path: 'app', description: 'Next.js 应用目录' },
    { path: 'components', description: 'React 组件目录' },
    { path: 'lib', description: '核心库目录' },
    { path: 'content', description: '内容存储目录' },
    { path: 'data', description: '数据目录' },
    { path: 'public', description: '静态资源目录' },
    { path: 'scripts', description: '脚本目录' },
  ];

  info('检查必需的目录:');
  requiredDirs.forEach(({ path: dirPath, description }) => {
    const fullPath = path.join(process.cwd(), dirPath);
    if (fs.existsSync(fullPath)) {
      success(`${dirPath}: ✓ (${description})`);
      passedChecks++;
    } else {
      error(`${dirPath}: ✗ 不存在 (${description})`);
      failedChecks++;
    }
  });

  // 检查写入权限
  info('\n检查写入权限:');
  const writableDirs = ['content', 'data', '.next'];

  writableDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    try {
      if (fs.existsSync(fullPath)) {
        fs.accessSync(fullPath, fs.constants.W_OK);
        success(`${dir}: 可写`);
        passedChecks++;
      } else {
        warning(`${dir}: 目录不存在，将自动创建`);
        warnings++;
      }
    } catch (err) {
      error(`${dir}: 无写入权限`);
      failedChecks++;
    }
  });
}

function checkOpenClawPath() {
  const openclawPath = process.env.OPENCLAW_SESSIONS_PATH ||
    path.join(process.env.HOME || '', '.openclaw/agents/main/sessions');

  info(`OpenClaw 会话路径: ${openclawPath}`);

  if (fs.existsSync(openclawPath)) {
    success('OpenClaw 会话目录存在');
    passedChecks++;

    // 检查是否有会话文件
    try {
      const files = fs.readdirSync(openclawPath)
        .filter(f => f.endsWith('.jsonl') && !f.endsWith('.jsonl.lock'));

      if (files.length > 0) {
        success(`找到 ${files.length} 个会话文件`);
        passedChecks++;
      } else {
        warning('会话目录为空，还没有对话记录');
        warnings++;
      }
    } catch (err) {
      error(`无法读取会话目录: ${err.message}`);
      failedChecks++;
    }
  } else {
    error('OpenClaw 会话目录不存在');
    error('请确保:');
    error('1. 已安装 OpenClaw CLI');
    error('2. 至少进行过一次对话');
    error('3. 正确设置了 OPENCLAW_SESSIONS_PATH 环境变量');
    failedChecks++;
  }

  // 检查 OpenClaw CLI
  try {
    execSync('openclaw --version', { stdio: 'pipe' });
    success('OpenClaw CLI 已安装');
    passedChecks++;
  } catch (err) {
    warning('OpenClaw CLI 未安装或不在 PATH 中');
    warning('访问 https://openclaw.ai 了解安装方法');
    warnings++;
  }
}

function checkConfigFiles() {
  const configFiles = [
    { path: 'next.config.js', description: 'Next.js 配置' },
    { path: 'tsconfig.json', description: 'TypeScript 配置' },
    { path: 'tailwind.config.ts', description: 'Tailwind CSS 配置' },
    { path: 'summary-config.json', description: 'Summary 系统配置' },
  ];

  configFiles.forEach(({ path: filePath, description }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      success(`${filePath}: ✓ (${description})`);
      passedChecks++;
    } else {
      error(`${filePath}: ✗ 不存在 (${description})`);
      failedChecks++;
    }
  });

  // 验证 summary-config.json
  try {
    const configPath = path.join(process.cwd(), 'summary-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      if (config.llm && config.processing && config.clustering && config.storage) {
        success('summary-config.json 格式正确');
        passedChecks++;
      } else {
        error('summary-config.json 格式不完整');
        failedChecks++;
      }
    }
  } catch (err) {
    error(`无法��析 summary-config.json: ${err.message}`);
    failedChecks++;
  }
}

async function checkAPIConnection() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;

  if (!apiKey || !baseUrl) {
    warning('跳过 API 连接测试（缺少环境变量）');
    return;
  }

  info('测试 API 连接...');

  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      success('API 连接成功');
      passedChecks++;
    } else {
      error(`API 连接失败: ${response.status} ${response.statusText}`);
      failedChecks++;
    }
  } catch (err) {
    error(`API 连接测试失败: ${err.message}`);
    warning('请检查:');
    warning('1. OPENAI_BASE_URL 是否正确');
    warning('2. OPENAI_API_KEY 是否有效');
    warning('3. 网络连接是否正常');
    failedChecks++;
  }
}

function printSummary() {
  const total = passedChecks + failedChecks;
  const successRate = total > 0 ? ((passedChecks / total) * 100).toFixed(1) : 0;

  log('');
  log('━'.repeat(60), 'cyan');
  log(`总检查项: ${total}`, 'bright');
  log(`通过: ${passedChecks}`, 'green');
  log(`失败: ${failedChecks}`, 'red');
  log(`警告: ${warnings}`, 'yellow');
  log(`成功率: ${successRate}%`, 'bright');
  log('━'.repeat(60), 'cyan');

  if (failedChecks === 0) {
    log('\n✅ 系统健康，可以开始使用！', 'green');
    log('\n快速启动命令:', 'bright');
    log('  npm run dev              # 启动开发服务器', 'cyan');
    log('  npm run summary:init     # 初始化 summary 系统', 'cyan');
    log('  npm run agent:knowledge  # 运行知识同步 Agent', 'cyan');
  } else {
    log('\n���️  发现问题，请根据上述错误信息进行修复', 'yellow');
    log('\n常见解决方案:', 'bright');
    log('  1. 安装依赖:       npm install', 'cyan');
    log('  2. 创建环境文件:   cp .env.example .env', 'cyan');
    log('  3. 编辑环境变量:   编辑 .env 文件，设置 API 密钥', 'cyan');
    log('  4. 安装 OpenClaw:  访问 https://openclaw.ai', 'cyan');
  }

  log('');
  process.exit(failedChecks > 0 ? 1 : 0);
}

// 运行健康检查
runHealthCheck().catch((err) => {
  error(`健康检查失败: ${err.message}`);
  console.error(err);
  process.exit(1);
});
