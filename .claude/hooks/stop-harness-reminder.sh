#!/bin/bash
# OpenClaw 하네스 체크포인트 (Stop 훅)
#
# 2026-08-22 개정 — 회장 지적 "훅 걸릴 때마다 새로 응답해서 어디서부터 읽어야 할지 모르겠다".
#   구판은 조건 없이 매 stop 마다 block 했다. 그래서 모든 턴이 "보고 → 차단 → 하네스 체크 완료" 두 통이 됐고
#   회장 화면에는 같은 내용이 두 번 흘렀다. 상기가 목적인 훅이 가독성을 매번 깨는 것은 이득보다 손해다.
#
# 개정 원칙: 실제로 안 한 정황이 있을 때만 막는다.
#   ① 작업 흔적이 없으면(워킹트리 깨끗) 침묵 통과. 대화만 한 턴을 막을 이유가 없다.
#   ② 핸드오프 노트가 최신(30분 이내)이면 침묵 통과. 이미 한 것을 또 시키지 않는다.
#   ③ 위 둘이 아닐 때만 막는다.
# 우회: HARNESS_CHECK_OK=1
set -euo pipefail

payload="$(cat || true)"

pass() { echo '{}'; exit 0; }

# 재진입 방지 (구판 유지)
printf '%s' "$payload" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && pass
[ "${HARNESS_CHECK_OK:-}" = "1" ] && pass

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || pass

# ① 이번 세션에 파일을 안 건드렸으면 통과
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then pass; fi
dirty="$(git status --porcelain --untracked-files=no 2>/dev/null | head -1)"
[ -z "$dirty" ] && pass

# ② 핸드오프 노트가 30분 이내로 갱신됐으면 통과
note="wiki/ops/session-state.md"
[ -f "$note" ] || note=".handoff-state.md"
if [ -f "$note" ]; then
  now=$(date +%s)
  mtime=$(stat -f %m "$note" 2>/dev/null || stat -c %Y "$note" 2>/dev/null || echo 0)
  age=$(( now - mtime ))
  size=$(wc -c < "$note" 2>/dev/null || echo 0)
  if [ "$age" -lt 1800 ] && [ "$size" -gt 200 ]; then pass; fi
fi

# ③ 여기까지 왔으면 진짜 안 한 것이다
cat <<'JSON'
{
  "decision": "block",
  "reason": "하네스 체크: 파일을 건드렸는데 wiki/ops/session-state.md 가 30분 넘게 갱신되지 않았다. 이번 턴 보고를 끝내기 전에 ①현재 작업과 핸드오프 기준 ②만진 파일 ③검증 상태(안 돌렸으면 그 이유) ④막힌 것 ⑤정확한 다음 액션을 노트에 적어라. 동작·스키마·채널·인증·발행이 바뀌었으면 해당 wiki 페이지도 갱신하라. 다음 세션이 이 노트만 읽고 30초 안에 이어갈 수 있어야 한다. 이미 다 했으면 노트를 touch 하고 끝내라."
}
JSON
