#!/bin/bash
# Daily backup of data/ and config/ directories
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/home/sj/backups/openclaw-$(date +%Y%m%d)"

mkdir -p "$BACKUP_DIR"

# Backup data/
if [ -d "$PROJECT_DIR/data" ]; then
  cp -r "$PROJECT_DIR/data/" "$BACKUP_DIR/data/"
  echo "Backed up data/"
fi

# Backup config/
if [ -d "$PROJECT_DIR/config" ]; then
  cp -r "$PROJECT_DIR/config/" "$BACKUP_DIR/config/"
  echo "Backed up config/"
fi

# Keep last 7 backups
ls -dt /home/sj/backups/openclaw-* 2>/dev/null | tail -n +8 | xargs rm -rf 2>/dev/null || true

echo "Backup completed: $BACKUP_DIR"
