# OSMU Marketing Agent — Risks v7.2.1

<!-- STAMP | created_at: 2026-08-06 18:44 KST | model: gpt-codex/gpt-5.6-sol | agent: prd-architect | skills: 없음 | evidence: PRD v7.2.1 §§18·22, v7.2 critic, current Studio/analytics code | deliberation: 안전·정합·정직성 위험을 관찰 신호와 hard stop으로 연결한다. -->

| 항목 | 값 |
|---|---|
| 버전·정본 | v7.2.1 · [PRD v7.2.1](openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md) |
| 상태 | plan GO candidate; provider production E2E M=0 |
| 최고위험 | wrong-account·unapproved/duplicate publish·projection drift·false analytics |

## 목차

- [Risk register](#risk-register)
- [Hard stops](#hard-stops)
- [Steelman](#steelman)
- [Premortem](#premortem)
- [셀프심문](#셀프심문)

## TL;DR

제품 신뢰를 무너뜨리는 사건은 계정·승인·중복·거짓 성과다. v7.2.1은 approval policy와 readiness를 분리하고 Messaging을 rail 밖에 두며 unsupported provenance를 명시해 design 오독을 차단한다.

## Risk register

| Risk | Early signal | Prevention/evidence |
|---|---|---|
| wrong account | target/current mismatch | verified ladder+OAuth18 |
| unapproved publish | required tenant external before approval | owner policy+version binding |
| silent policy migration | 기존 direct 버튼 의미 변경 | explicit owner switch+audit |
| readiness/policy 혼용 | 미연결 때 `승인 요청`으로 변경 | policy copy 유지+disabled reason/action |
| duplicate | same intent two surfaces | canonical idempotency+dual-init external≤1 |
| fourth Messaging rail | Telegram/Discord/Slack 상시 preview | rail3 lock+default OFF post-review handoff |
| projection drift | Studio/Queue/Inbox/Calendar diff | parity100%+repair |
| fake unsupported metric | 0·가짜 collected_at/publication | capability source+checked_at+reason+action+N/A3 |
| rights/policy | license/consent/disclosure unknown | V24 approval/publish block |
| low demand/high cost | low repeat/high support | pilot kill+pivot |

## Hard stops

- tenant/private/raw-token leak, wrong-account, unapproved or duplicate publication **1건** → automation·신규 cohort 즉시 OFF.
- accepted≥20에서 24h terminalization<95% 또는 projection N≥30 parity<100% → 해당 automation release 차단.
- workspace3 중 <2가 28일 내 Studio→now/schedule→proof→next loop2회 → broad publisher를 grounded composer/handoff로 축소.
- eligible publication≥20에서 evidence-linked next change<50% 또는 Social5 permanent unsupported≥3 → 성과 환류 판매 문구 제거.

## Steelman

가장 강한 반대안은 외부 게시를 전부 management view와 사람 승인으로 제한하는 것이다. 사고면은 줄지만 현행 Studio의 생성→즉시/예약 primary loop를 없애 고객 완료시간을 늘린다. v7.2.1은 신규 외부 pilot만 승인 필요를 기본으로 하고 기존 direct workspace는 유지하면서, 두 UI가 같은 command contract를 쓰는 제한안으로 안전과 회귀 방지를 함께 택한다.

## Premortem

6개월 뒤 실패했다면 readiness 장애를 승인 정책 변경으로 오해해 버튼 의미가 바뀌었거나, Messaging이 네 번째 rail로 돌아왔거나, unsupported 성과에 가짜 시각을 채웠을 가능성이 크다. Settings owner/default/migration matrix, rail3+explicit handoff, two-schema native TC, R3 Studio6이 이를 사전에 잡아야 한다.

## 셀프심문

**이 단계가 틀렸다면 왜?** 신규 pilot approval-required가 1인 고객의 첫 가치 시간을 과도하게 늘릴 수 있다. 그래서 이를 시장 사실로 고정하지 않고 cohort default로만 적용하며, 이탈률·support time·repeat loop를 측정해 재판정한다. 기존 direct workspace를 실험 때문에 조용히 바꾸지 않는다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: Provider app review·허용 scope·약관은 production 검증 전 외부 회수 필요다.
SKILLS_USED: 없음 — risk PRD view 전용 매칭 skill 없음
SKILLS_SKIPPED: 없음 — 매칭 skill 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md`; `tasks/marketing-agent-plan-critic-v7.2.output`; current Studio/analytics/metrics evidence; RFC9700; Buffer/Sprout official workflows.
MODEL: gpt-codex/gpt-5.6-sol
