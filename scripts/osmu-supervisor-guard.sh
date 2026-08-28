#!/usr/bin/env bash
# osmu-supervisor-guard.sh — 감독이 죽어 있으면 되살린다. cron 이 부른다.
#
# 왜 (회장 2026-08-28 "너가 대기하고 있다가 cron을 걸든 어떻게해서 코덱스한테 재지시하라"):
#   감독이 백로그를 비우고 스스로 종료한 뒤, 다음 판을 사람이 손으로 걸었다.
#   그 손이 없으면 아무것도 안 돈다. 감독을 죽지 않게 고치고, 그래도 죽으면
#   cron 이 되살린다. 두 겹이다.
#
# 설치: crontab 에 5분마다. scripts/install-supervisor-cron.sh 가 넣는다.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
LOG="/tmp/osmu-supervisor-guard.log"
STOP="/tmp/osmu-supervisor.stop"

# 회장이 명시적으로 멈춘 것은 되살리지 않는다.
if [ -f "$STOP" ]; then
  echo "[$(date '+%m-%d %H:%M')] 멈춤 요청이 있어 되살리지 않는다." >> "$LOG"
  exit 0
fi

if pgrep -f "osmu-supervisor.sh" >/dev/null 2>&1; then
  exit 0
fi

echo "[$(date '+%m-%d %H:%M')] 감독이 죽어 있다. 되살린다." >> "$LOG"
nohup bash "$ROOT/scripts/osmu-supervisor.sh" >> /tmp/osmu-supervisor.log 2>&1 &
