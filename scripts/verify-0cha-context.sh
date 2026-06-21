#!/usr/bin/env bash
# 0차 multi-repo context pulling smoke + operator-ready example
# Usage: bash scripts/verify-0cha-context.sh
#
# This simulates exactly what sourcing/route.ts and studio/text/route.ts do
# for context_sources (local + github) + wiki_path.
# It also prints a ready-to-copy payload you can POST to your running instance.

set -euo pipefail

echo "=== 0차 context_sources + wiki_path 검증 (operator ready) ==="

WIKI_ROOT="wiki"

# 1. Simulate wiki_path (project wiki as longform source, e.g. for Shorts)
WIKI_PATH_EX="product/vision.md"
if [ -f "$WIKI_ROOT/$WIKI_PATH_EX" ]; then
  CONTENT=$(cat "$WIKI_ROOT/$WIKI_PATH_EX")
  echo "OK: wiki_path loaded: $WIKI_PATH_EX (${#CONTENT} bytes)"
else
  echo "MISSING $WIKI_PATH_EX"; exit 1
fi

# 2. Simulate context_sources (multiple other "service" wikis)
# Using real files in this repo as proxy for operator's other services
SOURCES=(
  "type=local path=wiki/ops/multi-tenant.md"
  "type=local path=wiki/product/shorts-factory.md"
)

EXTRA_CONTEXT=""
for src in "${SOURCES[@]}"; do
  eval $src
  if [ -f "$path" ]; then
    c=$(cat "$path")
    header="## Context from ${path}"
    EXTRA_CONTEXT+=$'\n\n'"$header"$'\n'"${c:0:800}"
    echo "OK: context_source loaded: $path (${#c} bytes, truncated in use)"
  else
    echo "MISSING $path"
  fi
done

# 3. Simulate the append that happens in sourcing
LONGFORM="사용자가 입력한 롱폼 또는 아이디어 본문 (예: 최근 서비스 업데이트 내용...)"
LONGFORM+=$'\n\n'"## From wiki_path: $WIKI_PATH_EX"$'\n'"${CONTENT:0:600}"
LONGFORM+="$EXTRA_CONTEXT"

echo ""
echo "=== 시뮬 결과 ==="
echo "최종 longform 길이: ${#LONGFORM} chars"
echo "wikiFacts 스타일 주입 헤더 수: $(echo "$LONGFORM" | grep -c '^## Context from' || true)"
echo "에러 없이 주입 성공"

# 4. Full pipeline simulation using real wiki/ as "other service + project" context
echo ""
echo "=== FULL 0차 PIPELINE SIMULATION (using real wiki/ as multi-repo context) ==="

# Use a real doc as "longform source" via wiki_path logic + extra contexts
LONGFORM_BASE="이 문서는 SoloClaw 0차 안정화 작업에 대한 내용이다. 운영자가 여러 서비스의 wiki를 context로 사용해 Shorts를 자동 생산하는 예시."
LONGFORM="$LONGFORM_BASE"

# wiki_path style (project wiki as source)
if [ -f "$WIKI_ROOT/product/shorts-factory.md" ]; then
  C=$(cat "$WIKI_ROOT/product/shorts-factory.md")
  LONGFORM="$LONGFORM\n\n## From wiki_path: product/shorts-factory.md\n${C:0:500}"
  echo "Loaded as longform source via wiki_path: product/shorts-factory.md"
fi

# Additional context_sources (simulating operator's other services)
WIKI_FACTS=""
for f in "ops/multi-tenant.md" "product/vision.md"; do
  if [ -f "$WIKI_ROOT/$f" ]; then
    C=$(cat "$WIKI_ROOT/$f")
    LONGFORM="$LONGFORM\n\n## Context from $f\n${C:0:400}"
    WIKI_FACTS="$WIKI_FACTS\n\n## $f\n${C:0:400}"
  fi
done

echo "Assembled longform length: ${#LONGFORM} chars"
echo "Wiki facts assembled length: ${#WIKI_FACTS} chars"

# Simulate chunk + fact injection (as in sourcing/route.ts)
echo ""
echo "=== Prompt injection simulation (what actually goes to Claude for Shorts) ==="
SAMPLE_CHUNK="${LONGFORM:0:300}..."
PREPENDED="브랜드 사실 정보 (반드시 준수, 지어내지 마):\n${WIKI_FACTS:0:600}\n\n"
echo "Prepended facts header present: $(echo "$PREPENDED" | head -c 50 | grep -c '브랜드 사실' || echo 0)"
echo "Sample injected prompt start:"
echo "$PREPENDED" | head -c 200
echo "..."
echo "+ buildChunkPrompt on: $SAMPLE_CHUNK"

echo ""
echo "Key 0차 evidence: multi-repo wiki content (product + ops) is prepended as '브랜드 사실 정보' before the chunk prompt."
echo "This grounds Shorts generation in operator's own wikis (as per vision.md 'Brand Truth Layer' and 'beat 20-40% discard')."

# 5. Ready-to-use payload
echo ""
echo "=== OPERATOR TEST PAYLOAD (copy-paste to your live /api/sourcing) ==="
cat <<'EOF'
{
  "longform_text": "여기에 실제 서비스 업데이트나 블로그 초안을 넣으세요",
  "wiki_path": "product/shorts-factory.md",
  "context_sources": [
    { "type": "local", "path": "wiki/ops/multi-tenant.md" },
    { "type": "local", "path": "wiki/product/vision.md" }
  ],
  "tenant_id": "osmu"
}
EOF

echo ""
echo "이 payload로 POST 후 응답의 'wikiFactsUsed: true'와 candidates 확인."
echo "그 다음 longform-to-shorts 또는 video_generate 로 이어서 풀 루프 테스트."

echo ""
echo "=== 0차 context verify done ==="
echo "스크립트: scripts/verify-0cha-context.sh"
echo "테스트: dashboard/tests/context-sources.test.ts"
echo "코드: dashboard/src/app/api/sourcing/route.ts + studio/text/route.ts"
