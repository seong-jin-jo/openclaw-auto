#!/usr/bin/env bash
# 판 간 회귀 검사 (회장 2026-08-18 "1440 하면 왼쪽 화면흐름은 사라지네")
#
# 사고 패턴 (이번 세션 4회 반복, 전부 같은 뿌리):
#   ① "새 사이드바 항목 열거"    -> 채널 14개 삭제
#   ② "v32를 기준선으로"          -> 13판 계보 유실
#   ③ "사이드바는 채널에 집중"    -> 네 방 삭제
#   ④ "1440에서 프레임을 넓혀라"  -> 좌측 색인·우측 해설 삭제
# 뿌리: 컨트롤러가 목표만 말하고 지켜야 할 불변 조건을 말하지 않는다.
#       에이전트는 말한 목표를 최적화하며 말하지 않은 것을 희생한다.
#       컨트롤러는 캡처를 열어도 "요구한 것이 있는가"만 보고 "무엇이 사라졌는가"를 안 본다.
#
# 이 검사는 사람의 눈을 믿지 않고 판 사이 요소 개수를 기계로 대조한다.
# 이전 판에 있던 것이 새 판에서 0이 되면 무조건 반려다.
#
# 사용: bash scripts/check-regression.sh <이전판.html> <새판.html>
# 종료: 0=PASS, 1=FAIL

set -uo pipefail
OLD="${1:-}"; NEW="${2:-}"
[ -f "$OLD" ] && [ -f "$NEW" ] || { echo "사용: $0 <이전판.html> <새판.html>" >&2; exit 2; }

# 사라지면 안 되는 요소. 화면 부품과 콘텐츠 밀도 양쪽.
KEYS=(
  "흐름 색인" "sidenav" "sidecard" "device" "notch"
  "Studio 생성" "Studio 편집" "발행실" "성과실"
  "학습 정보" "Assets" "설정"
  "Threads" "Instagram" "Facebook" "Bluesky" "Telegram" "Discord" "Slack" "YouTube" "TikTok" "Blog"
  "Keyword Planner" "Search Console" "Naver Trends" "Google Trends" "Blog Performance"
  "Images" "Videos" "Midjourney"
  "해시태그" "첫 댓글" "자막" "캐러셀" "미리보기"
  "심리 근거" "벤치마크" "실구현"
)

echo "판 간 회귀 검사"
echo "  이전: $OLD"
echo "  새판: $NEW"
echo "------------------------------------------------------------"
printf "%-18s %8s %8s %s\n" "요소" "이전" "새판" "판정"
echo "------------------------------------------------------------"

fail=0
for k in "${KEYS[@]}"; do
  a=$(grep -cF "$k" "$OLD" 2>/dev/null | head -1); a=${a:-0}
  b=$(grep -cF "$k" "$NEW" 2>/dev/null | head -1); b=${b:-0}
  verdict="ok"
  if [ "$a" -gt 0 ] && [ "$b" -eq 0 ]; then
    verdict="소실"; fail=$((fail + 1))
  elif [ "$a" -gt 4 ] && [ "$b" -lt $(( a / 2 )) ]; then
    verdict="반감"; fail=$((fail + 1))
  fi
  [ "$verdict" != "ok" ] && printf "%-18s %8s %8s %s\n" "$k" "$a" "$b" "$verdict"
done

# 파일 크기도 본다. 줄어들면 내용이 사라졌다는 신호다.
sa=$(stat -f%z "$OLD"); sb=$(stat -f%z "$NEW")
echo "------------------------------------------------------------"
printf "파일 크기  %dKB -> %dKB\n" $(( sa / 1024 )) $(( sb / 1024 ))
if [ "$sb" -lt "$sa" ]; then
  echo "  경고: 새 판이 더 작다. 무엇이 사라졌는지 설명하지 못하면 손실이다."
  fail=$((fail + 1))
fi

echo "------------------------------------------------------------"
if [ "$fail" -gt 0 ]; then
  cat <<'EOF'
판정: 반려. 이전 판에 있던 것이 사라졌거나 절반 이하로 줄었다.

의도한 이동이면 대응표에 "기존 위치 -> 새 위치"를 적고 그 이름이 새 판에도 남아 있게 하라.
의도한 삭제면 회장 승인 문구를 인용하라. 인용할 것이 없으면 되살려라.
EOF
  exit 1
fi
echo "판정: 통과. 이전 판의 요소가 전부 살아 있다."
exit 0
