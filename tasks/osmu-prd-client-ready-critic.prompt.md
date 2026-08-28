# OSMU PRD v2.1 독립 재비평

대상: `docs/openclaw-auto-osmu-prd-v2.1-gpt-codex.md`

먼저 `AGENTS.md`, `CLAUDE.md`, `/Users/sj/.claude/standards/planning.md`,
`/Users/sj/.claude/standards/doc-review.md`, `/Users/sj/.claude/standards/benchmarks.md`를 읽는다.

## 비평 목표

- client-ready 문서인지 Kubernetes KEP, GitLab Product Development Flow, Go Proposal 등 실제 1차 문서 양식과 대조한다.
- 제목 직하 스탬프, 클릭 TOC, 경영진 요약, 용어, Mermaid 유저플로우, 범위/비범위, 오픈이슈,
  개정이력, SOURCES/MODEL/RUBRIC 푸터가 존재만 하는지 실제 기능하는지 검토한다.
- 사용자 실관찰 7개와 기존13+신규9+백로그7 총29 요구가 누락 없이 들어갔는지 확인한다.
- 요구↔원자 AC↔QA TC가 실제 1:1인지, 한 AC/TC에 복합 판정이 숨지 않았는지 공격한다.
- One Thing과 R0/R1/R2/Backlog 분할이 과대범위를 다시 만들지 않았는지 검토한다.
- 외부 SaaS/내부 인프라, Threads 단독/Instagram 병행, 첫 10명 비용이 회장 결정으로 남아 있는지 확인한다.
- 자가 RUBRIC 24/25가 후한 점수인지 독립 재채점한다.
- 셀프심문: 이 비평이 틀렸다면 왜인지 자답·수정한다.

제품 코드, PRD, 디자인, API, DB, 100B 파일은 수정하지 않는다. 결과는 transcript로만 반환한다.
판정은 PASS 또는 RETAKE이며, RETAKE면 MAJOR/MINOR와 정확한 수정 지시를 낸다.
끝에 SOURCES, MODEL, RUBRIC_SCORE, WEAKEST_LINE을 포함한다.
