#!/bin/bash
# 异地备份脚本 - 将本地备份同步到远程服务器
# 用法: 配置下方变量后加入 cron
# 0 4 * * * /opt/xhblogs/scripts/backup-remote.sh

set -euo pipefail

# ========== 配置区 ==========
LOCAL_BACKUP_DIR="/opt/xhblogs/backups"
REMOTE_HOST="user@remote-server"  # 改为你的远程服务器
REMOTE_DIR="/backup/ayuu.fun"      # 远程备份目录
KEEP_REMOTE_DAYS=30                # 远程保留天数
SSH_KEY=""                         # SSH 密钥路径（留空用默认）
# ============================

LOG_FILE="/opt/xhblogs/logs/backup-remote.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# 检查配置
if [[ "$REMOTE_HOST" == "user@remote-server" ]]; then
    log "ERROR: 请先配置 REMOTE_HOST"
    exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"
[[ -n "$SSH_KEY" ]] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

# 1. 确保远程目录存在
ssh $SSH_OPTS "$REMOTE_HOST" "mkdir -p $REMOTE_DIR" 2>/dev/null || {
    log "ERROR: 无法连接远程服务器 $REMOTE_HOST"
    exit 1
}

# 2. 同步备份文件（只传新增的）
log "开始同步备份到 $REMOTE_HOST:$REMOTE_DIR"
rsync -avz --progress -e "ssh $SSH_OPTS" \
    "$LOCAL_BACKUP_DIR/" \
    "$REMOTE_HOST:$REMOTE_DIR/" \
    >> "$LOG_FILE" 2>&1

# 3. 清理远程过期备份
log "清理远程 ${KEEP_REMOTE_DAYS} 天前的备份"
ssh $SSH_OPTS "$REMOTE_HOST" \
    "find $REMOTE_DIR -name '*.db' -mtime +${KEEP_REMOTE_DAYS} -delete" \
    2>/dev/null

log "远程备份同步完成"
