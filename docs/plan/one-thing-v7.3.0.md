# OSMU Marketing Agent — One Thing v7.3.0

<!--
STAMP
created_at: 2026-08-07 12:58 KST
model: gpt-codex/gpt-5.6-sol
agent: prd-architect / marketing_agent_prd_v7
skills: brand-positioning-kit; openclaw-creative-brief
evidence: PRD v7.3.0 §§0~8·14~17, v18 blueprint/completeness audit, Jasper/HubSpot official workflows
deliberation: 생성량이 아니라 고객 목표→승인 캠페인→증명→다음 실험의 대행 책임을 One Thing으로 남긴다.
-->

| 항목 | 값 |
|---|---|
| 버전 | v7.3.0 |
| 정본 | [PRD v7.3.0](openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md) |
| 상태 | in-review — critic/verifier/`/approve plan` 전 downstream 금지 |
| 범위 | One Thing·MVP 연결·제품 경계 |

## 목차

- [한 문장](#한-문장)
- [입력과 고객 산출물](#입력과-고객-산출물)
- [MVP 연결](#mvp-연결)
- [함정답](#함정답)
- [v7.3.0 경계](#v730-경계)

## TL;DR

OSMU는 게시물 생성기나 SNS 로고 모음이 아니다. 고객 목표와 승인된 브랜드 근거를 하나의 캠페인으로 운영해 세 형식 납품물·실제 발행 증거·다음 실험까지 닫는 마케팅 실행 에이전트다.

## 한 문장

> **한 번의 고객 목표와 브랜드 근거를 승인 가능한 캠페인 납품물과 증명 가능한 발행 결과로 바꾸고, 그 결과를 다음 실험에 되돌리는 마케팅 실행 에이전트.**

## 입력과 고객 산출물

| 단계 | 입력 | 고객이 받는 출력 | 완료 기준 |
|---|---|---|---|
| Ground | source5+확정 guide version | fact/source/tone/taboo/proof snapshot | unknown factual claim approval0 |
| Brief | 고객 목표·audience·offer·dates·budget·approver | sourced research+approved brief/plan | brief bypass0 |
| Create | approved brief+선택 계정·형식 | **텍스트→사진/카드→영상** 납품물 | manifest/order/rights truth |
| Review | 채널별 수정·권리·계정 | 저장된 canonical version | per-card sibling mutation0 |
| Execute | Settings approval policy+readiness | `지금 게시/예약` 또는 `승인 요청/예약 승인 요청` | unapproved/duplicate0 |
| Community handoff | review 완료+명시 선택 | Telegram/Discord/Slack message delivery | default OFF, fourth rail0 |
| Prove | provider result | proof 또는 이름 붙은 recovery | false published0 |
| Learn | native8 truth | evidence IDs+changed variable1+next experiment/root | link-only/causal overclaim0 |

## MVP 연결

| MVP | One Thing에서 맡는 구간 | 성공 |
|---|---|---|
| M1 Grounded Campaign | 자료→가이드→승인 brief→콘텐츠 | source/brief coverage100% |
| M2 Account Truth | 정확한 계정·readiness | five-view diff0 |
| M3 Canonical Execution | 검수→now/schedule/approval | external side effect≤1 |
| M4 Result/Recovery | 증명 가능한 결과 | unsafe retry0 |
| M5 Measure-to-Create | 결과→다음 실험·생성 | evidence IDs+change1+diff |

## 함정답

1. “모든 SNS 기능을 똑같이 제공한다.” — capability 없는 Queue·Analytics를 만든다.
2. “한 번에 11개 플랫폼으로 뿌린다.” — account·format·slot·executor·message destination을 섞는다.
3. “AI가 성과를 보고 자동 최적화한다.” — unsupported data와 작은 표본에서 인과를 과장한다.
4. “Campaign은 생성물 폴더다.” — 목표·예산·승인권·revision·proof·report가 없는 agency theater가 된다.

## v7.3.0 경계

- Approval policy는 workspace owner가 Settings에서 관리한다. 신규 외부 pilot은 승인 필요, 기존 direct workspace는 명시 전환 전 유지한다. Readiness는 버튼의 실행 가능성만 판정한다.
- Messaging은 Studio 3 rail 밖에서 review 후 `커뮤니티로 보내기`를 켰을 때만 선택한다.
- Unsupported native truth는 capability source·checked_at·reason·next action과 N/A 3필드를 남긴다.
- Release는 Save·per-card edit·publish2·schedule2를 각각 세어 Studio6, R3 total30이다.
- Brand source5와 최소 wiki CRUD/version/archive는 새 target이며 구현 완료로 표현하지 않는다.
- Campaign14는 고객 업무위임→research→brief 승인→텍스트→사진/카드→영상→revision→proof→report→experiment의 한 lineage다.
- Sidebar는 `Social · 게시물`→`Messaging`→`Social · 짧은 영상`; Messaging은 OSMU rail이 아니고 default OFF다.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: Measure-to-Create의 고객 반복가치는 외부 pilot 전 가설이다.
SKILLS_USED: brand-positioning-kit — brand guide 계약 / openclaw-creative-brief — campaign 입출력·검수 계약
SKILLS_SKIPPED: 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md`; `tasks/marketing-agent-v18-agency-blueprint.output`; `tasks/marketing-agent-v18-completeness-audit.output`; Jasper Brand Voice/Knowledge Base; HubSpot Campaigns; Buffer/Sprout official workflows.
MODEL: gpt-codex/gpt-5.6-sol
