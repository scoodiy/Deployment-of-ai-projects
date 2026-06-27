#!/bin/bash
set -euo pipefail

DB_FILE="/opt/xhblogs/data/ayuu.db"
BACKUP_DIR="/opt/xhblogs/backups"

echo "========================================="
echo "  数据库恢复工具"
echo "========================================="
echo ""

backups=( $(ls -1t "$BACKUP_DIR"/ayuu_*.db.gz 2>/dev/null) )

if [ ${#backups[@]} -eq 0 ]; then
    echo "未找到任何备份文件"
    exit 1
fi

echo "可用备份列表:"
echo ""
for i in "${!backups[@]}"; do
    fname=$(basename "${backups[$i]}")
    fsize=$(stat -c%s "${backups[$i]}" 2>/dev/null || stat -f%z "${backups[$i]}" 2>/dev/null)
    fsize_human=$(numfmt --to=iec "$fsize" 2>/dev/null || echo "${fsize}B")
    printf "  [%2d] %s  (%s)\n" "$((i + 1))" "$fname" "$fsize_human"
done

echo ""
read -rp "请输入要恢复的备份编号 [1-${#backups[@]}]: " choice

if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#backups[@]}" ]; then
    echo "无效选择"
    exit 1
fi

SELECTED="${backups[$((choice - 1))]}"
echo ""
echo "将恢复: $(basename "$SELECTED")"

if [ -f "$DB_FILE" ]; then
    echo ""
    echo "--- 先备份当前数据库 ---"
    CURRENT_BACKUP="$BACKUP_DIR/ayuu_before_restore_$(date +%Y%m%d_%H%M%S).db.gz"
    sqlite3 "$DB_FILE" ".backup '/tmp/ayuu_restore_tmp.db'"
    gzip -c /tmp/ayuu_restore_tmp.db > "$CURRENT_BACKUP"
    rm -f /tmp/ayuu_restore_tmp.db
    echo "当前数据库已备份到: $CURRENT_BACKUP"
fi

read -rp "确认恢复? 此操作将覆盖当前数据库 [y/N]: " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

gunzip -c "$SELECTED" > /tmp/ayuu_restore_tmp.db
mv /tmp/ayuu_restore_tmp.db "$DB_FILE"
echo "恢复完成: $DB_FILE"
