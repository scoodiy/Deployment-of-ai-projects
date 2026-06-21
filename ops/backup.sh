#!/bin/bash
# ayuu.fun 数据库备份脚本
# 用法: ./ops/backup.sh [保留天数]
# 定时: crontab -e → 0 3 * * * /opt/xhblogs/ops/backup.sh 7

set -euo pipefail

# === 配置 ===
PROJECT_DIR="/opt/xhblogs"
DB_FILE="${PROJECT_DIR}/data/ayuu.db"
BACKUP_DIR="${PROJECT_DIR}/ops/backups"
KEEP_DAYS="${1:-7}"       # 默认保留7天
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ayuu_${TIMESTAMP}.db"

# === 检查 ===
if [ ! -f "$DB_FILE" ]; then
    echo "❌ 数据库文件不存在: $DB_FILE"
    exit 1
fi

# === 创建备份目录 ===
mkdir -p "$BACKUP_DIR"

# === 备份 (使用 sqlite3 .backup 确保一致性) ===
if command -v sqlite3 &>/dev/null; then
    sqlite3 "$DB_FILE" ".backup '${BACKUP_FILE}'"
else
    # 如果没有 sqlite3，直接复制 (服务运行时可能不一致)
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# === 压缩 ===
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo "✅ 备份完成: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})"

# === 清理旧备份 ===
DELETED=$(find "$BACKUP_DIR" -name "ayuu_*.db.gz" -mtime +${KEEP_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "🗑️  已清理 ${DELETED} 个超过 ${KEEP_DAYS} 天的旧备份"
fi

# === 显示当前备份列表 ===
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "ayuu_*.db.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "📦 当前备份: ${BACKUP_COUNT} 个, 共 ${TOTAL_SIZE}"
