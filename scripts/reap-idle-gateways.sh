#!/usr/bin/env bash
# 유휴 게이트웨이 재우기(autosleep). cron으로 N분마다 실행 → 마지막 활동 후 IDLE_MIN 지난 gw-* stop.
# 비용 절감: 고객이 안 쓰는 동안 컨테이너 정지. 다음 작업/접속 시 provision-gateway.sh up으로 재기동.
# 활동 신호 = $TENANT_ROOT/<tenant>/data/.last-active (대시보드가 테넌트 작업 시 touch — 후속 연결).
# ⚠️ docker 있는 VM에서 cron 등록. 이 mac 미검증.
set -euo pipefail
ROOT="${OPENCLAW_TENANT_ROOT:-$HOME/openclaw-tenants}"
IDLE_MIN="${GATEWAY_IDLE_MIN:-60}"
now=$(date +%s)
for c in $(docker ps --format '{{.Names}}' | grep '^gw-' || true); do
  t="${c#gw-}"
  marker="$ROOT/$t/data/.last-active"
  if [ -f "$marker" ]; then last=$(stat -c %Y "$marker" 2>/dev/null || stat -f %m "$marker" 2>/dev/null || echo 0); else last=0; fi
  age_min=$(( (now - last) / 60 ))
  if [ "$age_min" -ge "$IDLE_MIN" ]; then
    docker stop "$c" >/dev/null 2>&1 && echo "slept $c (idle ${age_min}m)"
  fi
done
