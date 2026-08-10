# OSMU PRD v2.2 MAJOR 리테이크

입력:

- `docs/prd-osmu-customer-publishing-flow-v2.0.0.md` — 상류 요구 원문 정본
- `docs/openclaw-auto-osmu-prd-v2.1-gpt-codex.md` — client-ready 구조 후보
- `tasks/osmu-prd-client-ready-critic.output` 마지막 `한 줄 결론:` 이후 — 독립 비평 정본
- `docs/qa-tracker.md` — 실제 QA 식별자 연결 대상

출력: `docs/openclaw-auto-osmu-prd-v2.2-gpt-codex.md`. 기존 파일은 수정하지 않는다.

## 회장 진행 명령에 따라 적용할 plan 기본안

1. R1 One Thing은 Threads 단독으로 확정한다. Instagram은 R0 연결·상태 회귀차단까지 포함하고 이미지 발행은 R2다.
2. 외부 SaaS 우선 비교안을 쓴다. Postiz Cloud, Postiz self-hosted, 현 OSMU 직접 운영을 후보명·월 비용 출처·데이터 위치·exit 경로로 비교하되 최종 공급자 계약/배포는 eng-design 전 회장 승인 대상으로 남긴다.
3. 첫 외부 고객 10명은 고객당 최대 USD 5, 총 USD 50의 초대 운영 크레딧을 실험 상한으로 둔다. 실패 요청은 차감하지 않고, BYOK는 선택 경로, self-service 결제는 반복가치 검증 뒤다. 숫자는 `(unsourced experiment cap)`로 명시하고 실제 공급자 단가 계산 전 확정 비용으로 주장하지 않는다.
4. 개인정보 보존·삭제·국외이전 정책의 제품 DRI는 서비스 운영자, 최종 승인자는 회장으로 둔다. 외부 출시 전 법률 검토 gate를 둔다.

## MAJOR 수정

- v2.0 상류 요구 문장을 변경 불가 열로 복원한다. 특히 L-01/L-03/L-04/L-08/L-09/L-13/N-01/N-02/N-09/B-07 의미를 축소·교체하지 않는다.
- `source requirement → master ID → atomic AC → actual qa-tracker TC` 매트릭스를 만든다.
- 마스터 ID 29개는 유지하되 AC/TC 수는 복합 결과만큼 분할한다. L-02/L-06/L-13/N-02/N-05/N-07/N-09/B-02/B-04를 A/B 등으로 원자화한다.
- 실제 `docs/qa-tracker.md`에 아직 없는 TC는 `신규 QA seed — 미등록`으로 정직하게 표시하고, PRD 표 안의 문장을 실제 연결 완료로 주장하지 않는다. 기존 실재 TC는 정확한 heading/ID 링크를 붙인다.
- R0를 pilot blocker와 회귀 lane으로 분리해 GitHub/공통 IA/미디어/billing이 첫 고객 실험 전체를 불필요하게 막지 않게 한다.
- 제품 vision의 운영자 0차 → 유료 사용자 1명 → 외부 10명 코호트 선후를 명시한다.
- 성공 6~7/10의 행동 규칙을 추가한다.
- provider/tenant/callback/BYOK/RLS/subprocessor를 용어에 추가한다.
- Go 문서 양식 출처는 현행 Proposal Process와 Design Template로 교체한다.
- rollback, monitoring owner, discussion link, DRI, 결정기한을 추가한다.
- Mermaid는 구조 검증 결과와 브라우저 렌더 미검증 여부를 구분한다.
- 자가점수는 비평 13/25를 출발점으로 실제 수정 근거에 따라 재평가하며 후하게 주지 않는다.

내부 기준은 planning/doc-review/benchmarks/artifact-stamp를 실제 Read하고, 외부 문서·제품 벤치마크를 실제 WebSearch한다. 제품 코드·디자인·API·DB·100B 파일은 수정하지 않는다. 셀프심문·steelman·premortem을 수행하고 SOURCES/MODEL/RUBRIC_SCORE/WEAKEST_LINE을 포함한다.
