#!/usr/bin/env bash
# 재창조 차단 게이트 (회장 2026-08-16, v25 사고 후 이빨화)
#
# 사고: 프로토타입 v25를 353KB짜리 v24 계보를 무시하고 52KB 신규 화면으로 새로 그렸다.
# 같은 위반이 v23에서도 발생해 감사 불통과했다(회장 R-03/R-13 반복 지적).
# 원인: 규율은 docs/prototype/v24-brief.md와 DESIGN.md 4절에 있었으나 강제 장치가 없었다.
#
# 동작: docs/prototype/*.html 또는 DESIGN.md 신규 쓰기 시 ask로 멈추고 기준선 확인을 요구한다.
# 우회: REINVENT_OK=1 (기준선을 확인했고 의도적으로 신규 제작할 때만)

set -u
LOG="${HOME}/.claude/logs/harness.jsonl"
input=$(cat)
path=$(printf '%s' "$input" | /usr/bin/python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)

[ -z "$path" ] && exit 0
[ "${REINVENT_OK:-}" = "1" ] && exit 0

case "$path" in
  */docs/prototype/*.html|*/DESIGN.md) ;;
  *) exit 0 ;;
esac

# 이미 존재하는 파일 편집은 진화이므로 통과
[ -f "$path" ] && exit 0

base=$(ls -1t "${CLAUDE_PROJECT_DIR:-.}"/docs/prototype/openclaw-auto-marketing-agent-fidelity-v*.html 2>/dev/null | head -1)

mkdir -p "$(dirname "$LOG")" 2>/dev/null
printf '{"hook":"no-reinvent-gate","path":"%s","ts":"%s"}\n' "$path" "$(date -u +%FT%TZ)" >> "$LOG" 2>/dev/null

cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"재창조 차단 게이트: 새 디자인 산출물을 만들려 한다. 진행 전에 확인하라. (1) 진화 대상 기준 파일을 복사했는가 -> 최신 계보본: ${base:-없음} (2) 실제 코드 dashboard/src를 진실원으로 대조했는가 (3) docs/prototype/qa-v24 실측 스크린샷을 봤는가 (4) DESIGN.md 토큰을 따르는가 (5) v25-brief 형식의 브리프를 먼저 썼는가. 신규 IA/화면 창작은 금지다(v24-brief 규율, 회장 R-03/R-13). 확인했고 의도적 신규 제작이면 REINVENT_OK=1."}}
EOF
exit 0
