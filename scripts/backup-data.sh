#!/bin/bash
# data/ 파일 자동 백업 — 6시간마다 실행, 최근 7일 보관
set -e

DATA_DIR="${DATA_DIR:-$(dirname "$0")/../data}"
BACKUP_DIR="$DATA_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MAX_AGE_DAYS=7

mkdir -p "$BACKUP_DIR"

# queue.json 백업
if [ -f "$DATA_DIR/queue.json" ]; then
  cp "$DATA_DIR/queue.json" "$BACKUP_DIR/queue_${TIMESTAMP}.json"
fi

# style-data.json 백업
if [ -f "$DATA_DIR/style-data.json" ]; then
  cp "$DATA_DIR/style-data.json" "$BACKUP_DIR/style-data_${TIMESTAMP}.json"
fi

# growth.json 백업
if [ -f "$DATA_DIR/growth.json" ]; then
  cp "$DATA_DIR/growth.json" "$BACKUP_DIR/growth_${TIMESTAMP}.json"
fi

# 오래된 백업 삭제 (7일 이상)
find "$BACKUP_DIR" -name "*.json" -mtime +$MAX_AGE_DAYS -delete 2>/dev/null || true

echo "Backup complete: $TIMESTAMP ($(ls "$BACKUP_DIR"/*.json 2>/dev/null | wc -l) files)"
