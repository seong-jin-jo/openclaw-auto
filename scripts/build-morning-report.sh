#!/usr/bin/env bash
# build-morning-report.sh — 회장이 아침에 열어 볼 한 장을 만든다.
#
# 왜 (회장 2026-08-28 "내일 아침에 개발된거 내가 볼수있게끔하라"):
#   밤새 커밋이 쌓여도 회장은 git log 를 읽지 않는다. 무엇이 만들어졌는지,
#   그래서 어느 화면이 어떻게 생겼는지를 한 장으로 봐야 한다.
#
# 감독이 매 순회마다 부른다. 따로 실행해도 된다.
#   결과: docs/rendered/아침보고.html  (열기: open docs/rendered/아침보고.html)
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"
OUT="$ROOT/docs/rendered/아침보고.html"
SHOTS="$ROOT/docs/rendered/아침보고-화면"
STATE="$ROOT/docs/plan/osmu-backlog-state.tsv"
mkdir -p "$(dirname "$OUT")" "$SHOTS"

# 밤 동안의 화면을 새로 찍는다. 앱이 죽어 있으면 지난 그림을 그대로 둔다.
if curl -s -o /dev/null --max-time 5 http://localhost:3456/api/health 2>/dev/null; then
  ( cd "$ROOT/dashboard" && set -a && . ./.env.local && set +a &&
    FE3_DASHBOARD_TOKEN="$DASHBOARD_AUTH_TOKEN" \
    FE3_STUDIO_TOKEN="${STUDIO_DEV_BEARER_TOKEN:-}" \
    FE3_WORKSPACE_ID="${STUDIO_DEV_WORKSPACE_IDS%%,*}" \
    FE3_OUTPUT_DIR="$SHOTS" \
    timeout 180 node scripts/capture-studio-fe3-playwright.mjs > /tmp/morning-capture.json 2>/dev/null ) || true
fi

since="${MORNING_SINCE:-2026-08-28 04:30}"
commits=$(git log --since="$since" --pretty=format:'%h|%s' | grep -viE '^\w+\|(기록|문서):' || true)

{
cat <<'HEAD'
<title>밤사이 만든 것</title>
<style>
:root{--bg:#fbfbfa;--fg:#1a1a19;--muted:#6b6b68;--line:#e4e4e1;--card:#fff;--accent:#2563eb}
:root:not([data-theme="light"]){}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16161a;--fg:#ececea;--muted:#9a9a97;--line:#2c2c31;--card:#1e1e23;--accent:#7aa2ff}}
:root[data-theme="dark"]{--bg:#16161a;--fg:#ececea;--muted:#9a9a97;--line:#2c2c31;--card:#1e1e23;--accent:#7aa2ff}
body{background:var(--bg);color:var(--fg);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard",sans-serif;margin:0;padding:40px 24px 80px}
.wrap{max-width:900px;margin:0 auto}
h1{font-size:30px;letter-spacing:-.02em;margin:0 0 6px}
.sub{color:var(--muted);margin:0 0 36px}
h2{font-size:20px;margin:44px 0 14px;padding-top:20px;border-top:1px solid var(--line)}
table{border-collapse:collapse;width:100%;font-size:15px;display:block;overflow-x:auto}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;font-size:13px}
code{background:var(--card);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:13px}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin-top:16px}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
figure img{display:block;width:100%;height:auto}
figcaption{padding:9px 12px;font-size:13px;color:var(--muted);border-top:1px solid var(--line)}
.note{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:8px;padding:14px 16px;margin:18px 0}
</style>
<div class="wrap">
HEAD
echo "<h1>밤사이 만든 것</h1>"
echo "<p class=\"sub\">$(date '+%Y년 %m월 %d일 %H시 %M분') 기준. 이 장은 감독이 1분마다 새로 씁니다.</p>"

echo "<div class=\"note\">실제로 눌러 보시려면 <code>http://localhost:3456/studio</code> 입니다. 아래 그림은 방금 그 앱을 찍은 것입니다.</div>"

echo "<h2>지금 도는 것</h2><table><tr><th>판</th><th>갈래</th><th>상태</th><th>시각</th></tr>"
if [ -f "$STATE" ]; then
  awk -F'\t' 'NR>1{last[$1]=$0} END{for(k in last){split(last[k],f,"\t");printf "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>\n",f[1],f[2],f[3],f[4]}}' "$STATE" | sort
fi
echo "</table>"

echo "<h2>화면</h2>"
if [ -n "$(ls -A "$SHOTS" 2>/dev/null | grep -i '\.png$' || true)" ]; then
  echo "<div class=\"shots\">"
  for f in "$SHOTS"/*.png; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .png)
    echo "<figure><img src=\"아침보고-화면/$(basename "$f")\" alt=\"$name\"><figcaption>$name</figcaption></figure>"
  done
  echo "</div>"
else
  echo "<p class=\"sub\">아직 찍힌 화면이 없습니다.</p>"
fi

echo "<h2>밤사이 들어간 작업</h2><table><tr><th>커밋</th><th>무엇을</th></tr>"
if [ -n "$commits" ]; then
  printf '%s\n' "$commits" | while IFS='|' read -r h m; do
    echo "<tr><td><code>$h</code></td><td>$m</td></tr>"
  done
else
  echo "<tr><td colspan=2>아직 없습니다.</td></tr>"
fi
echo "</table>"

echo "<h2>회장이 확인하실 것</h2>"
echo "<p>멈추려면 <code>touch /tmp/osmu-supervisor.stop</code> 입니다. 진행 기록은 <code>/tmp/osmu-supervisor.log</code> 에 있습니다.</p>"
echo "</div>"
} > "$OUT"
echo "$OUT"
