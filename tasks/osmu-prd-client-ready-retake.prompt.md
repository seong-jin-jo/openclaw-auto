# OSMU plan 단계 client-ready PRD 재작성

기존 실패본 `docs/prd-osmu-customer-publishing-flow-v2.0.0.md`는 입력으로 읽되 수정하지 말고,
새 정본 후보 `docs/openclaw-auto-osmu-prd-v2.1-gpt-codex.md`를 작성한다.

## 반드시 읽을 내부 기준

- `AGENTS.md`, `CLAUDE.md`, `pipeline-state.md`, `docs/qa-tracker.md`
- `wiki/ops/session-state.md`는 전체를 출력하지 말고 `rg -n 'OSMU 고객 발행|OSMU plan|PRD 출고|PRD 웹|시크릿 창|P0-6'`로 찾은 관련 구간만 읽는다. n8n·인프라 등 다른 트랙은 무시한다.
- `/Users/sj/.claude/standards/planning.md`
- `/Users/sj/.claude/standards/writing.md`
- `/Users/sj/.claude/standards/benchmarks.md`
- `/Users/sj/.claude/standards/doc-review.md`
- `/Users/sj/.claude/standards/artifact-stamp.md`

## 외부 조사

실제 기업 또는 공개 1차 소스의 PRD·RFC·제품기획 문서 양식을 최소 3개 웹 조사한다.
문서 구조, 의사결정, 요구 추적성에서 무엇을 차용하고 무엇을 변경했는지 명시한다.
제품 기능 벤치마크(Buffer/Postiz/Jasper/Meta/GitHub)와 문서 양식 벤치마크를 분리한다.

## 필수 구조

- 제목 직하 스탬프: semver, 작성일, 작성자/모델, 상류 산출물 버전 핀 링크
- 클릭형 목차와 실제 앵커
- 1문단 경영진 요약
- 목적, 배경, 범위, 비범위, 용어정의
- 핵심 유저플로우 Mermaid 1개 이상
- 페르소나, JTBD, One Thing
- R0/R1/R2/Backlog 분할
- 사용자 실관찰 7개와 기존 13+신규 9+백로그 7, 총 29개 요구
- 요구별 증거상태, owner, 원자 AC, QA TC 1:1
- 성공지표, kill criteria, 리스크, 법무, 운영, 경쟁대안
- 오픈이슈, 회장 결정 3개, 개정이력, planning 7원칙
- `SOURCES`, `MODEL`, `RUBRIC_SCORE`, `WEAKEST_LINE`

## 검증과 경계

- 목차 앵커, Mermaid 문법, 내부링크, 29/29 추적성을 자체 검증한다.
- 외부 SaaS/내부 인프라 등 회장 미결정은 자가확정하지 않는다.
- 제품 코드, 디자인, API, DB, 100B 파일은 수정하지 않는다.
- 결론 직전 셀프심문과 steelman을 수행한다.
- 현재 실패본을 hand-patch하지 말고 완전한 새 버전으로 작성한다.
