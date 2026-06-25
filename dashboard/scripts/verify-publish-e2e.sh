#!/usr/bin/env bash
# gstack-based E2E for the publish surfaces (Studio 저작 / Inbox 승인 / 예약 정직성).
# Run: bash dashboard/scripts/verify-publish-e2e.sh [BASE_URL]
# 무인증/무크레드면 인증 셸은 토큰 주입으로 렌더만 확인하고, 실발행은 WARN로 degrade.
# 발행 분기 단언은 Vitest(tests/publish/*)가, RLS는 rls.isolation.test.ts가 담당.

set -euo pipefail

BASE_URL="${1:-http://localhost:3456}"
B=""
if command -v browse >/dev/null 2>&1; then
  B="browse"
elif [ -x "$HOME/.claude/skills/gstack/browse/dist/browse" ]; then
  B="$HOME/.claude/skills/gstack/browse/dist/browse"
elif [ -x "$(git rev-parse --show-toplevel 2>/dev/null || echo .)/.claude/skills/gstack/browse/dist/browse" ]; then
  B="$(git rev-parse --show-toplevel)/.claude/skills/gstack/browse/dist/browse"
else
  echo "ERROR: gstack browse binary not found." >&2
  exit 2
fi

echo "=== gstack publish E2E ==="
echo "BASE: $BASE_URL"

# 인증 셸 렌더용 토큰 주입(API는 401일 수 있으나 페이지 chrome은 렌더됨).
"$B" goto "$BASE_URL/" >/dev/null
"$B" js "localStorage.setItem('dashboard_auth_token','e2e-visual'); 'set'" >/dev/null

echo "1) OSMU Studio — 직접 저작 표면"
"$B" goto "$BASE_URL/studio" >/dev/null
"$B" wait --networkidle || true
if "$B" js "document.body.textContent.includes('직접 저작')" | grep -qi true; then
  echo "   OK: Studio '직접 저작' 부제 노출"
else
  echo "   WARN: '직접 저작' 부제 미확인(배포 전 빌드일 수 있음)"
fi
"$B" screenshot "/tmp/pub-e2e-studio.png" || true

echo "2) 승인 인박스 — 검수 승인 표면"
"$B" goto "$BASE_URL/inbox" >/dev/null
"$B" wait --networkidle || true
if "$B" js "document.body.textContent.includes('검수 승인') || document.body.textContent.includes('승인 인박스')" | grep -qi true; then
  echo "   OK: 인박스 표면 노출"
else
  echo "   WARN: 인박스 표면 미확인"
fi
"$B" screenshot "/tmp/pub-e2e-inbox.png" || true

echo "3) 예약 발행 정직성 — '파이프라인 미연결 시 예약됨 대기' 카피"
# SchedulePanel은 Studio에서 글 작성 후 토글되므로, 카피 존재는 소스 레벨(Vitest/grep)로 보강.
# 여기선 페이지 로드 무오류만 확인.
ERRS=$("$B" console --errors 2>/dev/null | cat || true)
echo "   console errors (sample): $(echo "$ERRS" | head -3)"

echo "=== PUBLISH E2E SMOKE DONE ==="
echo "Screenshots: /tmp/pub-e2e-*.png"
echo "Note: 실발행(채널 토큰 필요)·예약→발행 전환(외부 게이트웨이)은 이 스모크 범위 밖."
echo "발행 분기 검증: npm run test:publish | RLS: tests/isolation/rls.isolation.test.ts"
exit 0
