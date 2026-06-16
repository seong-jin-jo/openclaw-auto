#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 고객 전용 게이트웨이 프로비저너 (SaaS 상품화)
#
# 고객이 가입+토큰등록하면 그 고객 전용 발행엔진(openclaw gateway)을 띄운다.
# 시크릿(채널토큰·Claude키)·발행큐·크론을 고객별로 격리(한 명 사고가 전염 안 됨).
# 안 쓰면 reap-idle-gateways.sh가 재운다(autosleep).
#
# 사용:  provision-gateway.sh <tenant_id> [up|down|status]
# 필요 env: DATABASE_URL(Supabase 풀러), OSMU_SECRET_KEY(pgcrypto 복호화), docker
# ⚠️ docker 있는 VM 호스트에서 실행. 이 mac엔 docker 없어 미검증 — VM에서 검증 필요.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TENANT="${1:?사용: provision-gateway.sh <tenant_id> [up|down|status]}"
ACTION="${2:-up}"
: "${DATABASE_URL:?DATABASE_URL 필요}"

NAME="gw-${TENANT}"
IMAGE="${GATEWAY_IMAGE:-openclaw-auto/gateway:postagi}"
ROOT="${OPENCLAW_TENANT_ROOT:-$HOME/openclaw-tenants}"
TDIR="$ROOT/$TENANT"
REGISTRY="$ROOT/registry.json"
PORT_BASE="${OPENCLAW_PORT_BASE:-19000}"

case "$ACTION" in
  down)   docker rm -f "$NAME" >/dev/null 2>&1 || true; echo "stopped $NAME"; exit 0 ;;
  status) docker inspect -f '{{.State.Status}}' "$NAME" 2>/dev/null || echo absent; exit 0 ;;
  up)     ;;
  *)      echo "알 수 없는 action: $ACTION" >&2; exit 2 ;;
esac

: "${OSMU_SECRET_KEY:?OSMU_SECRET_KEY 필요(복호화)}"
mkdir -p "$TDIR/config" "$TDIR/data"
[ -f "$REGISTRY" ] || echo '{}' > "$REGISTRY"

# 포트 할당(테넌트별 고정, registry.json에 보관). 없으면 base부터 빈 포트.
PORT=$(jq -r --arg t "$TENANT" '.[$t] // empty' "$REGISTRY")
if [ -z "$PORT" ]; then
  used=$(jq -r '.[]' "$REGISTRY" | sort -n)
  PORT=$PORT_BASE
  while echo "$used" | grep -qx "$PORT"; do PORT=$((PORT+1)); done
  tmp=$(mktemp); jq --arg t "$TENANT" --argjson p "$PORT" '.[$t]=$p' "$REGISTRY" > "$tmp" && mv "$tmp" "$REGISTRY"
fi

# ── 시크릿 복호화 → .env 렌더 (RLS 우회 role이라 tenant_id 명시 필터) ───────────
ENV_FILE="$TDIR/.env"
trap 'chmod 600 "$ENV_FILE" 2>/dev/null || true' EXIT
: > "$ENV_FILE"; chmod 600 "$ENV_FILE"

# 채널 자격증명: kind=channel 행을 게이트웨이 env 변수명으로 매핑(label + meta 기반).
# label→env: threads→THREADS_*, instagram→INSTAGRAM_*, x→X_*(meta 4키). 확장 시 case 추가.
psql "$DATABASE_URL" -tA <<SQL | while IFS='|' read -r label token meta; do
SELECT label,
       coalesce(pgp_sym_decrypt(dearmor(secret_enc), '$OSMU_SECRET_KEY'), ''),
       coalesce(meta::text, '{}')
FROM integrations
WHERE tenant_id = '$TENANT'::uuid AND kind='channel';
SQL
  uid=$(echo "$meta" | jq -r '.userId // empty')
  case "$label" in
    threads)   { echo "THREADS_ACCESS_TOKEN=$token"; [ -n "$uid" ] && echo "THREADS_USER_ID=$uid"; } >> "$ENV_FILE" ;;
    instagram) { echo "INSTAGRAM_ACCESSTOKEN=$token"; [ -n "$uid" ] && echo "INSTAGRAM_USERID=$uid"; } >> "$ENV_FILE" ;;
    x)         echo "$meta" | jq -r 'to_entries[]|select(.key|test("Key|Secret|Token";"i"))|"X_"+(.key|ascii_upcase)+"="+(.value|tostring)' >> "$ENV_FILE" ;;
    *)         [ -n "$token" ] && echo "$(echo "$label"|tr '[:lower:]-' '[:upper:]_')_TOKEN=$token" >> "$ENV_FILE" ;;
  esac
done

# Claude(Anthropic) 키 — 고객 과금. 게이트웨이 LLM이 이 키 사용.
AK=$(psql "$DATABASE_URL" -tA -c "SELECT coalesce(pgp_sym_decrypt(dearmor(secret_enc), '$OSMU_SECRET_KEY'),'') FROM integrations WHERE tenant_id='$TENANT'::uuid AND kind='anthropic' LIMIT 1;")
[ -n "$AK" ] && echo "ANTHROPIC_API_KEY=$AK" >> "$ENV_FILE"

# ── 컨테이너 기동(있으면 교체) ────────────────────────────────────────────────
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" --restart unless-stopped --init \
  --env-file "$ENV_FILE" \
  -e HOME=/home/node -e TZ=Asia/Seoul -e TENANT_ID="$TENANT" \
  -v "$TDIR/config:/home/node/.openclaw" \
  -v "$TDIR/data:/home/node/data" \
  -p "127.0.0.1:${PORT}:${PORT}" \
  "$IMAGE" \
  node dist/index.js gateway --bind loopback --port "$PORT" --allow-unconfigured

echo "provisioned $NAME (port $PORT, data $TDIR/data)"
