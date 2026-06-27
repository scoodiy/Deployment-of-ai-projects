#!/bin/bash
set -euo pipefail

DB_FILE="/opt/xhblogs/data/ayuu.db"
BACKUP_DIR="/opt/xhblogs/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ayuu_${TIMESTAMP}.db"
RETAIN_DAYS=7
RETAIN_MONTHLY_DAYS=30

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始备份数据库..."

if [ ! -f "$DB_FILE" ]; then
    log "错误: 数据库文件 $DB_FILE 不存在"
    exit 1
fi

sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
log "备份已创建: $BACKUP_FILE"

if [ ! -f "$BACKUP_FILE" ]; then
    log "错误: 备份文件未生成"
    exit 1
fi

FSIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
if [ "$FSIZE" -eq 0 ]; then
    log "错误: 备份文件大小为 0"
    rm -f "$BACKUP_FILE"
    exit 1
fi
log "备份文件大小: $FSIZE 字节"

gzip -f "$BACKUP_FILE"
log "已压缩: ${BACKUP_FILE}.gz"

log "清理旧备份..."

find "$BACKUP_DIR" -maxdepth 1 -name "ayuu_*.db.gz" -type f | sort | while read -r f; do
    fname=$(basename "$f")
    day_str=$(echo "$fname" | grep -oP '\d{8}')
    if [ -z "$day_str" ]; then
        continue
    fi

    file_day="${day_str:6:2}"
    file_age_days=$(( ($(date +%s) - $(date -d "$day_str" +%s 2>/dev/null || echo 0)) / 86400 ))

    if [ "$file_day" = "01" ]; then
        if [ "$file_age_days" -gt "$RETAIN_MONTHLY_DAYS" ]; then
            log "删除过期月备份: $fname (已保留 $file_age_days 天)"
            rm -f "$f"
        fi
    else
        if [ "$file_age_days" -gt "$RETAIN_DAYS" ]; then
            log "删除过期日备份: $fname (已保留 $file_age_days 天)"
            rm -f "$f"
        fi
    fi
done

log "备份完成"
