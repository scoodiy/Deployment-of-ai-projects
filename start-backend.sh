#!/bin/bash
# Stock-AYUU 后端启动脚本
# 用法: ./start-backend.sh

set -e

cd "$(dirname "$0")/backend"

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# 加载环境变量
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# 检查数据库连接
echo "检查数据库连接..."
.venv/bin/python3 -c "
import psycopg2
try:
    conn = psycopg2.connect('$DATABASE_URL')
    print('✅ 数据库连接成功')
    conn.close()
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
    print('请检查 .env 中的 DATABASE_URL 是否正确')
    exit(1)
"

# 启动服务
echo "启动后端服务..."
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 9988
