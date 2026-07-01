# SSOT Routing — 이 레포의 3원 진실 지도 (필독)

**Date**: 2026-07-02 (wiki-track)
**Status**: living — 구조가 바뀌면 이 파일을 먼저 갱신.

openclaw-auto의 지식은 의도적으로 **3곳**에 나뉘어 있다. 어느 것부터 읽어야 하는지 모르면 사고가 난다 (실례: [prompt-guide 미독 3회 격노](../learnings/2026-06-prompt-guide-incident.md)).

## 라우팅 표

| 지식 종류 | SSOT (여기만 정본) | 쓰는 사람/시점 | 읽는 사람/시점 | 강제장치 |
|---|---|---|---|---|
| 기능·API·UI 계약 (빌드 스펙) | `docs/feature-spec.md` · `docs/ui-rules.md` · `docs/channel-ui-spec.md` · `docs/USERFLOW.md` | 기능 추가/변경 PR | 구현·리뷰 세션 | PR 템플릿 체크박스 + CODEOWNERS + CI |
| 아키텍처·결정(ADR)·교훈·운영 지식 | `wiki/` (architecture / decisions / learnings / ops / product / reference) | 결정·사고·학습 발생 시 | 모든 세션 온보딩 | Stop hook(stop-harness-reminder) 상기 |
| **테넌트별 마케팅 진실 (톤·브랜드 사실·금지사항)** | **`data-{tenant}/prompt-guide.txt`** (신규 테넌트는 `data/templates/*.prompt-guide.txt`에서 bootstrap 복사) | CEO 직접 | **테넌트 콘텐츠 생성·검수·발행 전 필독** | (승격 대기 — learnings 3-strike) |
| 라이브 작업 상태 | `wiki/ops/session-state.md` | 매 세션 종료 전 | 다음 세션 30초 재개 | handoff-freshness + Stop hook |
| 단계·QA·배포 상태 | `pipeline-state.md` · qa evidence | /pipeline·/approve만 | 게이트 훅·대시보드 | stage-gate.sh |

## 읽기 순서 (작업 유형별)

- **기능 구현**: docs/feature-spec → wiki/architecture → session-state
- **테넌트 콘텐츠 작업**: `data-{tenant}/prompt-guide.txt` **먼저** → postAGI wiki 마케팅팀 문서(배경 맥락) → wiki/reference/brand-grounding.md
- **온보딩/재개**: wiki/index.md → session-state → 이 파일

## 원칙

- 한 사실은 한 곳 — 다른 곳에는 링크만. docs↔wiki 간 내용 복붙 금지.
- 이 3원 분할 자체를 바꾸는 결정은 ADR로 남긴다 (`wiki/decisions/`).
