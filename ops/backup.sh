#!/usr/bin/env bash
# ayuu.fun SQLite backup script

set -euo pipefail
umask 077

PROJECT_DIR="/opt/xhblogs"
DB_FILE="${PROJECT_DIR}/data/ayuu.db"
BACKUP_DIR="${PROJECT_DIR}/ops/backups"
KEEP_DAYS="${1:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ayuu_${TIMESTAMP}.db"

if [ ! -f "$DB_FILE" ]; then
  echo "Database file does not exist: $DB_FILE" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is required for a consistent online backup" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

cleanup_failed_backup() {
  rm -f "$BACKUP_FILE" "${BACKUP_FILE}.gz"
}
trap cleanup_failed_backup ERR

sqlite3 -cmd '.timeout 5000' "$DB_FILE" ".backup '${BACKUP_FILE}'"

if [ "$(sqlite3 "$BACKUP_FILE" 'PRAGMA integrity_check;')" != "ok" ]; then
  echo "Backup integrity check failed" >&2
  cleanup_failed_backup
  exit 1
fi

gzip -9 "$BACKUP_FILE"
trap - ERR

COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "Backup complete: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})"

find "$BACKUP_DIR" -name 'ayuu_*.db.gz' -mtime +"${KEEP_DAYS}" -delete

BACKUP_COUNT=$(find "$BACKUP_DIR" -name 'ayuu_*.db.gz' | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Available backups: ${BACKUP_COUNT}, total ${TOTAL_SIZE}"
