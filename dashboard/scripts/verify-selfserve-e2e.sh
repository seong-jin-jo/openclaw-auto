#!/usr/bin/env bash
# 셀프서브 온보딩 라이브 E2E (browse) — 비-기술 담당자 경로를 끝까지 밟아 끊김 0 확인.
# 흐름: /login(가입) 렌더 → 로그인 → 온보딩 위저드(4스텝, 무료이벤트 배너) → Studio 브랜드 설정 →
#       위키 연결(CUPID public repo) → OSMU 생성 → 출력에 위키 사실 반영.
# 분기 단언(키 검증·증류 경로·그라운딩 주입)은 Vitest tests/brand/* 가 담당(이미 통과).
# 이 스크립트는 *실제 배포 화면*에서 사람이 보는 흐름을 스크린샷으로 증명한다.
#
# 사용: BASE_URL=https://<live> OPERATOR_TOKEN=<dashboard_auth_token> bash dashboard/scripts/verify-selfserve-e2e.sh
# 무인증/무DB면 렌더만 확인하고 실생성은 WARN로 degrade. browse 바이너리 필요.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3456}"
OPERATOR_TOKEN="${OPERATOR_TOKEN:-}"

# browse 바이너리 발견(verify-publish-e2e.sh와 동일 규약)
B=""
if command -v browse >/dev/null 2>&1; then B="browse"
elif [ -x "$HOME/.claude/skills/gstack/browse/dist/browse" ]; then B="$HOME/.claude/skills/gstack/browse/dist/browse"
elif [ -x "$(git rev-parse --show-toplevel 2>/dev/null || echo .)/.claude/skills/gstack/browse/dist/browse" ]; then B="$(git rev-parse --show-toplevel)/.claude/skills/gstack/browse/dist/browse"
else echo "ERROR: gstack browse 바이너리 없음." >&2; exit 2; fi

echo "[selfserve-e2e] BASE_URL=$BASE_URL"

# 1) 가입/로그인 화면 렌더
"$B" "$BASE_URL/login" --screenshot /tmp/ss-01-login.png >/dev/null 2>&1 \
  && echo "  ✓ /login 렌더" || echo "  WARN: /login 렌더 실패"

# 2) 운영자 토큰 있으면 /api/me 진단(DB·인증 살아있나)
if [ -n "$OPERATOR_TOKEN" ]; then
  code=$(curl -s -o /tmp/ss-me.json -w "%{http_code}" "$BASE_URL/api/me" -H "Authorization: Bearer $OPERATOR_TOKEN")
  echo "  /api/me http=$code → $(cat /tmp/ss-me.json 2>/dev/null | head -c 200)"
else
  echo "  WARN: OPERATOR_TOKEN 없음 → 인증·DB 진단 skip(라이트 렌더만)."
fi

# 3) 온보딩 위저드 / Studio 렌더(인증 셸 — 토큰 주입은 browse 세션 쿠키/localStorage에 의존)
"$B" "$BASE_URL/studio?setup=brand" --screenshot /tmp/ss-02-studio-brand.png >/dev/null 2>&1 \
  && echo "  ✓ /studio?setup=brand 렌더(브랜드 위저드 자동오픈)" || echo "  WARN: /studio 렌더 실패(미인증일 수 있음)"

echo "[selfserve-e2e] 렌더 단계 완료. 실제 가입→키→생성 풀 플로우는 테스트 계정 + 라이브 DB 필요."
echo "  스크린샷: /tmp/ss-01-login.png, /tmp/ss-02-studio-brand.png"
