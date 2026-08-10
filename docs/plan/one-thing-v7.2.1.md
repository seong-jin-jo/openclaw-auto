# OSMU Marketing Agent — One Thing v7.2.1

<!--
STAMP
created_at: 2026-08-06 18:42 KST
model: gpt-codex/gpt-5.6-sol
agent: prd-architect / marketing_agent_prd_v7
skills: 없음 — 제품 PRD view 전용 매칭 스킬 없음; planning.md·doc-review.md 적용
evidence: PRD v7.2.1 §§0~8, v7.2 independent critic major0/minor4, Buffer/Sprout official workflows
deliberation: 플랫폼 수나 화면 수가 아니라 근거→검수→실행→증명→다음 생성의 반복 단위만 남긴다.
-->

| 항목 | 값 |
|---|---|
| 버전 | v7.2.1 |
| 정본 | [PRD v7.2.1](openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md) |
| 상태 | GO candidate — `/approve plan` 전 downstream 금지 |
| 범위 | One Thing·MVP 연결·제품 경계 |

## 목차

- [한 문장](#한-문장)
- [입력과 고객 산출물](#입력과-고객-산출물)
- [MVP 연결](#mvp-연결)
- [함정답](#함정답)
- [v7.2.1 패치 경계](#v721-패치-경계)

## TL;DR

OSMU는 여러 로고를 한 화면에 늘어놓는 SNS dashboard가 아니다. 고객의 확인된 브랜드 근거를 채널별 콘텐츠로 바꾸고, 같은 identity를 가진 실행과 실제 결과를 남긴 뒤, 관찰 근거 하나를 다음 생성에 반영하는 마케팅 자동화 에이전트다.

## 한 문장

> **한 번의 브랜드 근거 입력을 채널별로 검수 가능한 콘텐츠와 증명 가능한 발행 결과로 바꾸고, 그 결과를 다음 생성에 되돌리는 마케팅 자동화 에이전트.**

## 입력과 고객 산출물

| 단계 | 입력 | 고객이 받는 출력 | 완료 기준 |
|---|---|---|---|
| Ground | 확인된 wiki·자료·아이디어 | source-linked root | unknown factual claim approval0 |
| Create | root+선택 계정·형식 | Social text·Short video·Card news 3 rail | rail3, slot truth |
| Review | 채널별 수정·권리·계정 | 저장된 canonical version | per-card sibling mutation0 |
| Execute | Settings approval policy+readiness | `지금 게시/예약` 또는 `승인 요청/예약 승인 요청` | unapproved/duplicate0 |
| Community handoff | review 완료+명시 선택 | Telegram/Discord/Slack message delivery | default OFF, fourth rail0 |
| Prove | provider result | proof 또는 이름 붙은 recovery | false published0 |
| Learn | native8 truth | limitation+changed variable1+next root | false-zero/causal overclaim0 |

## MVP 연결

| MVP | One Thing에서 맡는 구간 | 성공 |
|---|---|---|
| M1 Grounded Composer | 근거→콘텐츠 | source coverage100% |
| M2 Account Truth | 정확한 계정·readiness | five-view diff0 |
| M3 Canonical Execution | 검수→now/schedule/approval | external side effect≤1 |
| M4 Result/Recovery | 증명 가능한 결과 | unsafe retry0 |
| M5 Measure-to-Create | 결과→다음 생성 | native8 truth+change1 |

## 함정답

1. “모든 SNS 기능을 똑같이 제공한다.” — capability 없는 Queue·Analytics를 만든다.
2. “한 번에 11개 플랫폼으로 뿌린다.” — account·format·slot·executor·message destination을 섞는다.
3. “AI가 성과를 보고 자동 최적화한다.” — unsupported data와 작은 표본에서 인과를 과장한다.

## v7.2.1 패치 경계

- Approval policy는 workspace owner가 Settings에서 관리한다. 신규 외부 pilot은 승인 필요, 기존 direct workspace는 명시 전환 전 유지한다. Readiness는 버튼의 실행 가능성만 판정한다.
- Messaging은 Studio 3 rail 밖에서 review 후 `커뮤니티로 보내기`를 켰을 때만 선택한다.
- Unsupported native truth는 capability source·checked_at·reason·next action과 N/A 3필드를 남긴다.
- Release는 Save·per-card edit·publish2·schedule2를 각각 세어 Studio6, R3 total30이다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: Measure-to-Create의 고객 반복가치는 외부 pilot 전 가설이다.
SKILLS_USED: 없음 — 제품 PRD view 전용 매칭 skill 없음
SKILLS_SKIPPED: 없음 — 매칭 skill 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md`; `tasks/marketing-agent-plan-critic-v7.2.output`; Buffer Scheduling/Agency/All Channels; Sprout Approval.
MODEL: gpt-codex/gpt-5.6-sol
