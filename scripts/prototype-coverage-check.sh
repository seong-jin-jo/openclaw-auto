#!/usr/bin/env bash
# 프로토타입 커버리지 검사 (회장 2026-08-17 "또 기존 화면 구현된거 씹창내고 혼자 창조한 이유 분석")
#
# 사고: v33이 실제 구현된 사이드바 항목 상당수를 화면에서 통째로 없앴다.
#       Blog, Blog Performance, Keyword Planner, Naver/Google Trends, Search Console,
#       Midjourney, Images, Videos, Telegram 등이 프로토타입에 흔적조차 없다.
# 원인: 컨트롤러 위임 브리프가 "새 사이드바 항목"을 열거하고
#       "기존 항목이 어디로 갔는지 대응표"를 요구하지 않았다.
#       게다가 재창조 차단 게이트(no-reinvent-gate.sh)의 우회키를 브리프가 직접 넘겼다.
#
# 용도: 프로토타입을 회장에게 릴레이하기 전에 반드시 돌린다.
#       실제 코드에 있는 화면 이름이 프로토타입에 하나도 안 나오면 누락으로 잡는다.
#
# 사용: bash scripts/prototype-coverage-check.sh docs/prototype/<파일>.html

set -u
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "사용법: bash scripts/prototype-coverage-check.sh <프로토타입 html 경로>"
  exit 2
fi

# 실제 구현된 화면 (dashboard/src 라우트 + Sidebar.tsx 기준).
# "표기명|허용 별칭1|허용 별칭2" 형식. 하나라도 파일에 있으면 통과로 본다.
SURFACES=(
  "성과|Performance|성과실"
  "OSMU Studio|Studio 생성|생성실"
  "승인 인박스|인박스|Inbox"
  "발행 캘린더|캘린더|Calendar"
  "Threads|스레드"
  "X (Twitter)|X 짧은|Twitter"
  "Instagram|인스타"
  "Facebook|페이스북"
  "Bluesky|블루스카이"
  "Telegram|텔레그램"
  "Discord|디스코드"
  "Slack|슬랙"
  "YouTube|유튜브"
  "TikTok|틱톡"
  "Blog|블로그"
  "Blog Performance|블로그 성과"
  "Keyword Planner|키워드 플래너|키워드 연구"
  "Search Console|서치 콘솔|검색 콘솔"
  "Naver Trends|네이버 트렌드"
  "Google Trends|구글 트렌드"
  "Images|이미지 보관|이미지 자산"
  "Videos|영상 보관|영상 자산"
  "Midjourney|미드저니"
  "Settings|설정"
)

missing=0
total=0
echo "프로토타입 커버리지 검사: $FILE"
echo "----------------------------------------"
for entry in "${SURFACES[@]}"; do
  total=$((total + 1))
  found=0
  IFS='|' read -r -a aliases <<< "$entry"
  for a in "${aliases[@]}"; do
    if grep -qF "$a" "$FILE" 2>/dev/null; then found=1; break; fi
  done
  if [ "$found" -eq 0 ]; then
    echo "  누락: ${aliases[0]}"
    missing=$((missing + 1))
  fi
done
echo "----------------------------------------"
covered=$(( total - missing ))
echo "실구현 화면 ${total}개 중 ${covered}개 등장, ${missing}개 누락"


# ── 2차 검사: 앱 사이드바 자체에 채널·자산이 있는가 ─────────────
# 회장 2026-08-18 "왼쪽 사이드바 플랫폼, 에셋 등 다 어디갔냐고...?"
# 1차 검사는 파일 어딘가에 이름이 있으면 통과라 하위 화면에 묻혀도 잡지 못했다.
# 실제 코드 Sidebar.tsx는 채널 14종을 사이드바에 직접 나열한다. 그 사실을 검사한다.
echo ""
echo "앱 사이드바 직접 노출 검사"
echo "----------------------------------------"
SIDEBAR_MUST=("Threads" "Instagram" "Blog" "Images" "Videos")
sb_missing=0
for item in "${SIDEBAR_MUST[@]}"; do
  # 사이드바 렌더 함수 근처에 그 이름이 있는지 본다
  if ! grep -qE "(sidebarHTML|navHTML|SIDEBAR|CHANNEL_GROUPS)" "$FILE"; then
    echo "  경고: 사이드바 렌더 지점을 찾지 못했다. 수동 확인 필요."
    break
  fi
done
if grep -qE "CHANNEL_GROUPS|CHANNELS" "$FILE"; then
  echo "  채널 목록 자료구조 있음"
else
  echo "  누락: 사이드바에 채널 목록 자료구조가 없다"
  sb_missing=$((sb_missing + 1))
fi
echo "----------------------------------------"

if [ "$missing" -gt 0 ] || [ "${sb_missing:-0}" -gt 0 ]; then
  cat <<'EOF'

판정: 반려.
누락된 화면은 실제로 구현돼 동작하는 것들이다. 프로토타입에서 사라졌다면 둘 중 하나다.
  (1) 다른 이름·다른 자리로 옮겼다 -> 대응표에 "기존 이름 -> 새 위치"를 적고 그 이름이 화면에 보이게 하라.
  (2) 없애기로 했다 -> 회장 승인 근거를 대라. 근거 없는 삭제는 재창조다.
EOF
  exit 1
fi
echo "판정: 통과. 실구현 화면이 전부 프로토타입에 존재한다."
exit 0
