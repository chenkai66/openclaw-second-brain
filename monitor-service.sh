#!/bin/bash

# Second Brain 服务监控脚本
# 每20分钟检查服务状态，如果未运行则自动重启

LOG_FILE="/root/openclaw-second-brain/service-monitor.log"
PROJECT_DIR="/root/openclaw-second-brain"
PORT=8000

# 记录日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查服务是否在运行
check_service() {
    # 检查端口是否被监听
    if ss -tuln | grep -q ":$PORT "; then
        # 检查是否是我们的服务进程
        if pgrep -f "node .next/standalone/server.js" > /dev/null; then
            return 0
        else
            log_message "端口 $PORT 被占用，但不是我们的服务进程"
            return 1
        fi
    else
        log_message "端口 $PORT 未被监听，服务可能已停止"
        return 1
    fi
}

# 检查服务健康状态
check_health() {
    # 尝试访问服务健康检查端点
    if curl -s --connect-timeout 5 --max-time 10 "http://localhost:$PORT" > /dev/null; then
        return 0
    else
        log_message "服务响应异常，可能已崩溃"
        return 1
    fi
}

# 停止现有服务进程
stop_service() {
    log_message "正在停止现有服务进程..."
    
    # 终止 node 进程
    pkill -f "node .next/standalone/server.js" 2>/dev/null
    
    # 等待进程完全退出
    sleep 3
    
    # 强制终止任何剩余进程
    pkill -9 -f "node .next/standalone/server.js" 2>/dev/null
    
    # 释放端口（如果被占用）
    fuser -k $PORT/tcp 2>/dev/null || true
    
    sleep 2
}

# 启动服务
start_service() {
    log_message "正在启动 Second Brain 服务..."
    
    cd "$PROJECT_DIR"
    
    # 检查构建产物是否存在
    if [ ! -d ".next/standalone" ]; then
        log_message "构建产物不存在，尝试重新构建..."
        npm run build
        if [ $? -ne 0 ]; then
            log_message "构建失败，无法启动服务"
            return 1
        fi
    fi
    
    # 启动服务（后台运行）
    nohup node .next/standalone/server.js > /dev/null 2>&1 &
    
    # 等待服务启动
    sleep 5
    
    # 验证服务是否成功启动
    if check_service && check_health; then
        log_message "服务启动成功"
        return 0
    else
        log_message "服务启动失败"
        return 1
    fi
}

# 主监控逻辑
main() {
    log_message "=== 开始服务监控 ==="
    
    if check_service && check_health; then
        log_message "服务运行正常"
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
    echo ""
}

# 执行主函数
main