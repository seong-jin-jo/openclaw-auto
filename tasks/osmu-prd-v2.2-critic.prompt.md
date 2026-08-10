# OSMU PRD v2.2 집중 독립 비평

`docs/openclaw-auto-osmu-prd-v2.2-gpt-codex.md`를 plan 게이트 직전 독립 비평하라.

반드시 비교할 정본:

- `docs/prd-osmu-customer-publishing-flow-v2.0.0.md`
- `tasks/osmu-prd-client-ready-critic.output`의 마지막 `한 줄 결론:` 이후 비평
- `docs/qa-tracker.md`

검사 범위는 다음으로 제한한다.

1. v2.0 요구 29개, 특히 L-01/L-03/L-04/L-08/L-09/L-13/N-01/N-02/N-09/B-07 의미 보존
2. master ID → atomic AC → 실제 QA ID 또는 `신규 QA seed — 미등록` 추적의 정직성
3. R0-P pilot blocker와 R0-R regression 분리, Threads One Thing, Instagram R2 경계
4. V0 운영자 → V1 유료 1명 → V2 외부 10명, 6~7/10 행동 규칙
5. Postiz Cloud/self-host/current OSMU 비교의 비용·데이터·exit·미확인 표시
6. 개인정보 DRI/승인자/법률 gate, rollback/monitoring/discussion/결정기한
7. 클릭 목차·용어·Mermaid 구조·SOURCES/MODEL/RUBRIC_SCORE/WEAKEST_LINE

결론은 `PASS`, `RETAKE-MINOR`, `RETAKE-MAJOR` 중 하나로 시작하라. MAJOR는 plan 게이트 차단 결함만 사용한다. 문서는 수정하지 말고 비평만 반환한다. planning/doc-review/benchmarks 기준을 실제 Read하고, 셀프심문·steelman·premortem을 포함하라.
