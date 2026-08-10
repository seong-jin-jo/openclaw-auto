# OSMU PRD v2.3 plan-gate 리테이크

입력:

- `docs/openclaw-auto-osmu-prd-v2.2-gpt-codex.md`
- `tasks/osmu-prd-v2.2-critic.output` 마지막 `한 줄 결론:` 이전의 `## 판정`과 인계 노트
- `docs/prd-osmu-customer-publishing-flow-v2.0.0.md`
- `docs/qa-tracker.md`
- `pipeline-state.md`의 `2026-08-02 plan 결정 반영 + v2.2 독립 비평`

출력: `docs/openclaw-auto-osmu-prd-v2.3-gpt-codex.md`. 이전 문서는 수정하지 않는다.

회장 결정은 pipeline-state 최신 섹션이 durable 정본이다. 다음을 전부 닫아라.

1. 글로벌 제품 비전 V0는 유지하고, 이번 범위를 `V0-Pilot Readiness Slice`로 명명한다. 이 slice 통과는 전체 V0 완료가 아니며 V1 전환도 자동 허용하지 않는다.
2. L-03을 repo/permission/branch/key/Wiki/rate-limit 6개 상호배타 atomic AC로 분리한다.
3. L-04를 Markdown·PAT 각각에 대해 cross-tenant/response/log/analytics 노출 0건 매트릭스로 전수화한다. cross-tenant와 secret leakage는 기능 gate와 무관한 R0-P hard stop이다.
4. 기존 qa-tracker의 Instagram 운영 증거는 과거 회귀 baseline이며 폐기하지 않는다. 이번 신규 고객 activation에서 Instagram 연결·상태 회귀는 R0-R, 신규 image publish 확대는 R2다. supersession 규칙을 명시한다.
5. 개인정보 primary DRI는 회장(SJ)/서비스 운영자다. backup DRI와 법률 자문자는 `외부 출시 전 실명 지정 없으면 NO-GO`로 둔다. 미지정을 완료처럼 쓰지 않는다.
6. AI USD 50 외에 Postiz Cloud 월 USD 29 후보, 법률 자문, 운영 인건비를 포함한 파일럿 총예산 appetite를 `USD 79 + 법률/인건비 미확정, 회장 승인 전 지출 NO-GO`로 표시한다. 주당 운영시간 상한은 `4시간 (unsourced experiment cap)`으로 두고 초과 시 신규 모집 중단·수동 운영 축소를 규칙화한다.
7. 수요 kill을 복원한다: 2주간 자격고객 100명 제안 후 동의 3명 미만이면 개발 확대 중단. 반복가치 kill도 유지한다.
8. 59개 신규 QA seed는 plan 승인 시 등록 승인으로 간주하지 않는다. QA tracker 등록 owner=qa-verifier, due=design 승인 전, 미등록이면 build 승인 NO-GO로 둔다.
9. discussion link/decision log에는 pipeline-state 최신 섹션과 이 critic transcript를 연결한다.
10. clickable TOC, glossary, Mermaid, 29 master traceability, SOURCES/MODEL/RUBRIC_SCORE/WEAKEST_LINE을 보존하고 기계 검증한다.

planning/doc-review/benchmarks/artifact-stamp 기준을 실제 Read하라. 제품 코드·디자인·API·DB·100B는 수정하지 않는다. 셀프심문·steelman·premortem을 수행하라.
