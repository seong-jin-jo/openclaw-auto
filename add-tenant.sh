#!/bin/bash
# 신규 tenant 추가 — docker-compose에 service 2개 append + data/config 디렉토리 + .env 자동 생성
# 사용: bash add-tenant.sh {slug} {dashboard_port} {gateway_port} {channel}
#   예: bash add-tenant.sh nova 34565 18794 instagram

set -euo pipefail
cd "$(dirname "$0")"

SLUG="${1:?slug required}"
DASHBOARD_PORT="${2:?dashboard port required}"
GATEWAY_PORT="${3:?gateway port required}"
CHANNEL="${4:-instagram}"

COMPOSE_FILE="docker-compose.postagi-4tenants.yml"

# 0. 중복 체크
if grep -q "openclaw-gateway-${SLUG}:" "${COMPOSE_FILE}" 2>/dev/null; then
  echo "❌ tenant '${SLUG}' 이미 ${COMPOSE_FILE}에 존재"
  exit 1
fi

# 1. data/config 디렉토리
mkdir -p "data-${SLUG}" "config-${SLUG}"

# 2. prompt-guide / search-keywords 템플릿 (있으면 사용, 없으면 generic)
if [ -f "data/templates/${SLUG}.prompt-guide.txt" ]; then
  cp "data/templates/${SLUG}.prompt-guide.txt" "data-${SLUG}/prompt-guide.txt"
  cp "data/templates/${SLUG}.search-keywords.txt" "data-${SLUG}/search-keywords.txt"
  echo "  ✓ ${SLUG} 전용 템플릿 복사"
else
  cp "data/templates/general.prompt-guide.txt" "data-${SLUG}/prompt-guide.txt"
  cp "data/templates/general.search-keywords.txt" "data-${SLUG}/search-keywords.txt"
  echo "  ✓ general 템플릿 복사 (추후 data-${SLUG}/prompt-guide.txt 편집)"
fi

# 3. .env.${slug}
cat > ".env.${SLUG}" <<EOF
# openclaw ${SLUG} tenant (auto-generated)
DASHBOARD_PORT=${DASHBOARD_PORT}
GATEWAY_PORT=${GATEWAY_PORT}
OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
DASHBOARD_AUTH_TOKEN=$(openssl rand -hex 32)
TZ=Asia/Seoul
# 채널 credential은 dashboard Settings에서 입력 (또는 여기 직접):
# INSTAGRAM_ACCESS_TOKEN=
# X_API_KEY=
# THREADS_ACCESS_TOKEN=
EOF

# 4. docker-compose에 service 2개 append (yaml anchor 활용)
cat >> "${COMPOSE_FILE}" <<EOF

  # ─────────────── ${SLUG} (auto-added $(date +%Y-%m-%d)) ───────────────
  openclaw-gateway-${SLUG}:
    <<: *gateway-base
    container_name: openclaw-gateway-${SLUG}
    volumes:
      - ./config-${SLUG}:/home/node/.openclaw
      - ./data-${SLUG}:/home/node/data
    env_file: .env.${SLUG}
    environment:
      HOME: /home/node
      TZ: Asia/Seoul
    command: ["node", "dist/index.js", "gateway", "--bind", "loopback", "--port", "${GATEWAY_PORT}"]
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:${GATEWAY_PORT}/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s

  openclaw-dashboard-${SLUG}:
    <<: *dashboard-base
    container_name: openclaw-dashboard-${SLUG}
    volumes:
      - ./data-${SLUG}:/app/data
      - ./config-${SLUG}:/app/config
      - /var/run/docker.sock:/var/run/docker.sock
    env_file: .env.${SLUG}
    environment:
      DATA_DIR: /app/data
      CONFIG_DIR: /app/config
      PORT: "${DASHBOARD_PORT}"
      HOSTNAME: "0.0.0.0"
      GATEWAY_CONTAINER: openclaw-gateway-${SLUG}
      GATEWAY_PORT: "${GATEWAY_PORT}"
    depends_on:
      - openclaw-gateway-${SLUG}
EOF
echo "  ✓ docker-compose.postagi-4tenants.yml 에 service 2개 추가"

# 5. marketing-hub/tenants.json 자동 갱신
HUB_JSON="marketing-hub/tenants.json"
if [ -f "${HUB_JSON}" ]; then
  python3 -c "
import json, sys
with open('${HUB_JSON}') as f: d = json.load(f)
slugs = [t['slug'] for t in d['tenants']]
if '${SLUG}' in slugs:
    sys.exit(0)
d['tenants'].append({
    'slug': '${SLUG}',
    'name': '${SLUG}',
    'emoji': '✨',
    'dashboardPort': ${DASHBOARD_PORT},
    'gatewayPort': ${GATEWAY_PORT},
    'publicUrl': 'https://marketing-${SLUG}.example.art',
    'channels': ['${CHANNEL}'],
    'status': 'pending'
})
with open('${HUB_JSON}', 'w') as f: json.dump(d, f, indent=2, ensure_ascii=False)
print('  ✓ marketing-hub/tenants.json 갱신')
" || echo "  ⚠ tenants.json 자동 갱신 실패 (python3 없음?) — 수동 추가 필요"
fi

echo ""
echo "============================================================"
echo "✅ tenant '${SLUG}' 추가 완료"
echo "============================================================"
echo "다음:"
echo "  1. docker-compose -f docker-compose.postagi-4tenants.yml up -d openclaw-gateway-${SLUG} openclaw-dashboard-${SLUG} --build"
echo "  2. Cloudflare Tunnel 라우트 추가 (예: marketing-${SLUG}.<도메인> → localhost:${DASHBOARD_PORT})"
echo "  3. http://localhost:${DASHBOARD_PORT} 접속 → Settings → 채널 credential 입력"
echo "  4. marketing-hub/tenants.json publicUrl 실 도메인으로 편집"
