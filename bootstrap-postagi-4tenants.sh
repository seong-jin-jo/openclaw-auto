#!/bin/bash
# postAGI 4 서비스(Tenant/DC/Tenant/폴리) openclaw 인스턴스 초기 셋업
# - 각 서비스용 data-{slug}/, config-{slug}/ 디렉토리 생성
# - templates/{slug}.prompt-guide.txt → data-{slug}/prompt-guide.txt 복사
# - .env.{slug} 자동 생성 (포트/토큰 placeholder)
#
# 사용: bash bootstrap-postagi-4tenants.sh

set -euo pipefail
cd "$(dirname "$0")"

declare -A PORTS=(
  ["tenant2"]="34561:18790"
  ["dc"]="34562:18791"
  ["tenant3"]="34563:18792"
  ["tenant4"]="34564:18793"
)

for slug in tenant2 dc tenant3 tenant4; do
  echo "===== ${slug} ====="

  # 1. 디렉토리 생성
  mkdir -p "data-${slug}" "config-${slug}"
  chmod 755 "data-${slug}" "config-${slug}"

  # 2. templates → data 복사 (이미 있으면 skip)
  if [ ! -f "data-${slug}/prompt-guide.txt" ]; then
    cp "data/templates/${slug}.prompt-guide.txt" "data-${slug}/prompt-guide.txt"
    echo "  ✓ prompt-guide.txt copied"
  else
    echo "  - prompt-guide.txt exists (skip)"
  fi

  if [ ! -f "data-${slug}/search-keywords.txt" ]; then
    cp "data/templates/${slug}.search-keywords.txt" "data-${slug}/search-keywords.txt"
    echo "  ✓ search-keywords.txt copied"
  else
    echo "  - search-keywords.txt exists (skip)"
  fi

  # 3. .env.{slug} placeholder (실 토큰은 사용자가 dashboard Settings에서 입력 권장)
  PORTS_PAIR="${PORTS[$slug]}"
  DASHBOARD_PORT="${PORTS_PAIR%%:*}"
  GATEWAY_PORT="${PORTS_PAIR##*:}"
  if [ ! -f ".env.${slug}" ]; then
    cat > ".env.${slug}" <<EOF
# openclaw ${slug} tenant — 자동 생성 (편집 후 docker-compose up -d)
DASHBOARD_PORT=${DASHBOARD_PORT}
GATEWAY_PORT=${GATEWAY_PORT}
OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)
DASHBOARD_AUTH_TOKEN=$(openssl rand -hex 32)
# 채널 credential은 dashboard Settings에서 입력 (영구 저장 = config-${slug}/)
# 또는 여기 박아도 됨:
# INSTAGRAM_ACCESS_TOKEN=
# X_API_KEY=
# THREADS_ACCESS_TOKEN=
TZ=Asia/Seoul
EOF
    echo "  ✓ .env.${slug} generated (token 자동 — 외부 노출 X)"
  else
    echo "  - .env.${slug} exists (skip)"
  fi
done

# 5. data/tenants.json — dashboard /services 페이지 로드용 (fork-local, gitignore)
if [ ! -f "data/tenants.json" ]; then
  cat > "data/tenants.json" <<'EOF'
{
  "tenants": [
    { "slug": "tenant1",  "name": "Tenant", "emoji": "💘", "dashboardPort": 34560, "gatewayPort": 18789, "publicUrl": "https://marketing-tenant1.example.com", "channels": ["instagram","threads"], "status": "active" },
    { "slug": "tenant2",   "name": "Tenant",   "emoji": "緣", "dashboardPort": 34561, "gatewayPort": 18790, "publicUrl": "https://marketing-tenant2.example.com", "channels": ["instagram","threads"], "status": "active" },
    { "slug": "dc",     "name": "Tenant",    "emoji": "🖤", "dashboardPort": 34562, "gatewayPort": 18791, "publicUrl": "https://marketing-dc.example.com", "channels": ["x"], "status": "pending" },
    { "slug": "tenant3", "name": "Tenant",        "emoji": "📷", "dashboardPort": 34563, "gatewayPort": 18792, "publicUrl": "https://marketing-tenant3.example.com", "channels": ["instagram"], "status": "waiting-meta-review" },
    { "slug": "tenant4",   "name": "tenant",     "emoji": "∞", "dashboardPort": 34564, "gatewayPort": 18793, "publicUrl": "https://marketing-tenant4.example.com", "channels": ["x"], "status": "waiting-legal-opinion" }
  ]
}
EOF
  echo "  ✓ data/tenants.json generated (5 tenants: tenant1+tenant2+dc+tenant3+tenant4)"
fi

echo ""
echo "============================================================"
echo "✅ 4 tenants 초기화 완료"
echo "============================================================"
echo ""
echo "다음:"
echo "  1. docker-compose -f docker-compose.postagi-4tenants.yml up -d"
echo "  2. Cloudflare Tunnel 라우트 추가:"
echo "     marketing-tenant2.example.com    → localhost:34561"
echo "     marketing-dc.example.com        → localhost:34562"
echo "     marketing-tenant3.example.com  → localhost:34563"
echo "     marketing-tenant4.example.com      → localhost:34564"
echo "  3. 각 dashboard → Settings → 채널 credential 입력 (IG/X/Threads)"
echo "  4. Settings → Automation ON → cron 6시간 자동 발행 시작"
