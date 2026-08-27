#!/usr/bin/env bash
# osmu-supervisor.sh — 개발이 끝날 때까지 codex 워커를 쉬지 않고 돌린다.
#
# 왜 (회장 2026-08-28 "개발 완료될때까지 Codex 멈추지말고 시켜라"):
#   지금까지는 컨트롤러가 한 판 발주하고, 끝나면 회장이 물어볼 때까지 다음 판을 안 걸었다.
#   회장이 자는 동안에도 백로그가 스스로 다음 과제를 집어 던지게 만든다.
#
# 하는 일:
#   두 갈래(백엔드·화면)를 각각 한 명씩만 돌린다. 그 갈래가 비면 백로그에서 다음 과제를 꺼내
#   codex-in-pane 으로 던지고, 결과를 기록한다. 백로그가 비면 스스로 멈춘다.
#
# 사용: nohup bash scripts/osmu-supervisor.sh >/tmp/osmu-supervisor.log 2>&1 &
#   상태 보기: cat docs/plan/osmu-backlog-state.tsv
#   멈추기:   touch /tmp/osmu-supervisor.stop
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
BACKLOG="$ROOT/docs/plan/osmu-backlog.tsv"
STATE="$ROOT/docs/plan/osmu-backlog-state.tsv"
STOP="/tmp/osmu-supervisor.stop"
PROMPTS="$ROOT/docs/plan/backlog-prompts"
rm -f "$STOP"
[ -f "$STATE" ] || printf 'id\tlane\t상태\t시각\t세션\n' > "$STATE"

status_of() { awk -F'\t' -v i="$1" '$1==i{s=$3} END{print s}' "$STATE"; }
mark() { printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$(date +%H:%M)" "$4" >> "$STATE"; }

# 그 갈래에서 지금 돌고 있는 세션이 있으면 이름을, 없으면 빈 문자열을 준다.
running_in_lane() {
  local lane="$1" id sess
  while IFS=$'\t' read -r id l st ts sess; do
    [ "$l" = "$lane" ] || continue
    [ "$st" = "돌는중" ] || continue
    [ "$(status_of "$id")" = "돌는중" ] || continue
    if tmux has-session -t "$sess" 2>/dev/null &&
       ! tmux capture-pane -pt "$sess" 2>/dev/null | tail -40 | grep -q "■ 끝났습니다"; then
      echo "$sess"; return
    fi
    # pane 이 끝났으면 결과를 판정해 닫는다
    local verdict="끝남"
    if tmux capture-pane -pt "$sess" 2>/dev/null | tail -40 | grep -qE "회수 필요|타임아웃|미완료"; then
      verdict="빈손"
    fi
    mark "$id" "$lane" "$verdict" "$sess"
  done < "$STATE"
  echo ""
}

next_pending() {
  local lane="$1" id l pf
  while IFS=$'\t' read -r id l pf; do
    case "$id" in ''|'#'*|id) continue;; esac
    [ "$l" = "$lane" ] || continue
    [ -z "$(status_of "$id")" ] || continue
    echo -e "$id\t$pf"; return
  done < "$BACKLOG"
  echo ""
}

echo "[$(date +%H:%M)] 감독 시작. 백로그 $BACKLOG"
idle_rounds=0
while :; do
  [ -f "$STOP" ] && { echo "[$(date +%H:%M)] 멈춤 요청을 받아 종료한다."; break; }
  dispatched=0
  for lane in build fe; do
    [ -n "$(running_in_lane "$lane")" ] && continue
    entry="$(next_pending "$lane")"
    [ -z "$entry" ] && continue
    id="${entry%%$'\t'*}"; pf="${entry##*$'\t'}"
    prompt="$PROMPTS/$pf"
    if [ ! -f "$prompt" ]; then
      echo "[$(date +%H:%M)] $id 프롬프트 없음: $prompt"
      mark "$id" "$lane" "프롬프트없음" "-"
      continue
    fi
    sess="osmu-$id"
    echo "[$(date +%H:%M)] $lane 갈래가 비었다. $id 를 던진다."
    # 45분 기본은 이 레포의 판 하나에 짧다. build5·fe4 가 실제 작업을 끝내고
    # 보고를 쓰다가 잘렸다. 90분으로 늘린다.
    if CODEX_TIMEOUT="${CODEX_TIMEOUT:-5400}" bash "$HOME/.claude/harness/bin/codex-in-pane.sh" "$sess" code-builder "$prompt" >/dev/null 2>&1; then
      mark "$id" "$lane" "돌는중" "$sess"; dispatched=1
    else
      echo "[$(date +%H:%M)] $id 발주 실패"
      mark "$id" "$lane" "발주실패" "$sess"
    fi
  done

  # 두 갈래 모두 비었고 던질 것도 없으면 백로그가 소진된 것이다.
  if [ "$dispatched" = "0" ] &&
     [ -z "$(running_in_lane build)" ] && [ -z "$(running_in_lane fe)" ] &&
     [ -z "$(next_pending build)" ] && [ -z "$(next_pending fe)" ]; then
    idle_rounds=$((idle_rounds+1))
    [ "$idle_rounds" -ge 2 ] && { echo "[$(date +%H:%M)] 백로그를 다 비웠다. 감독을 마친다."; break; }
  else
    idle_rounds=0
  fi
  sleep 60
done
