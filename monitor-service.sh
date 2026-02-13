#!/bin/bash

# Second Brain 服务监控脚本
# 每20分钟检查一次服务状态，如果服务停止则自动重启

LOG_FILE="/var/log/second-brain-monitor.log"
PROJECT_DIR="/root/openclaw-second-brain"
PORT=8000

# 创建日志目录
mkdir -p /var/log

# 记录日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 检查服务是否运行
check_service() {
    # 使用 netstat 检查端口（兼容性更好）
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
            return 0
        fi
    fi
    
    # 备用方法：检查进程
    if pgrep -f "node.*server.js" >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# 停止服务
stop_service() {
    log_message "正在停止现有服务进程..."
    
    # 终止 node 进程
    pkill -f "node.*server.js" 2>/dev/null
    
    # 等待进程完全停止
    sleep 5
    
    # 强制终止（如果还有残留进程）
    pkill -9 -f "node.*server.js" 2>/dev/null
}

# 启动服务
start_service() {
    log_message "正在启动 Second Brain 服务..."
    
    cd "$PROJECT_DIR" || { log_message "无法进入项目目录"; return 1; }
    
    # 后台启动服务，设置正确的端口环境变量
    PORT=$PORT nohup node .next/standalone/server.js > /dev/null 2>&1 &
    
    # 等待服务启动
    sleep 10
    
    # 验证服务是否成功启动
    if check_service; then
        log_message "服务启动成功"
        return 0
    else
        log_message "服务启动失败"
        return 1
    fi
}

# 主监控逻辑
log_message "=== 开始服务监控 ==="

if check_service; then
    log_message "服务正常运行"
else
    log_message "服务异常，尝试重启..."
    stop_service
    if start_service; then
        log_message "服务已成功重启"
    else
        log_message "服务重启失败，请手动检查"
    fi
fi

log_message "=== 监控完成 ==="