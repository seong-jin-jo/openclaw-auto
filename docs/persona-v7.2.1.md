# OSMU Marketing Agent — Persona v7.2.1

<!--
STAMP
created_at: 2026-08-06 18:42 KST
model: gpt-codex/gpt-5.6-sol
agent: prd-architect / marketing_agent_prd_v7
skills: 없음 — persona PRD view 전용 매칭 스킬 없음; planning.md·doc-review.md 적용
evidence: PRD v7.2.1 §3, user failure reports, current Studio rail/actions, v7.2 critic
deliberation: 생성량보다 wrong-account·중복·끊긴 관리 화면을 두려워하는 1인 운영자의 실제 완료 흐름으로 구체화한다.
-->

| 항목 | 값 |
|---|---|
| 버전 | v7.2.1 |
| 정본 | [PRD v7.2.1](openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md) |
| Primary persona | 김민서, 38세, 1인 교육·컨설팅 브랜드 대표 |
| 상태 | GO candidate — 수작업 시간·빈도·WTP는 pilot 전 미측정 |

## 목차

- [인물](#인물)
- [해야 하는 일](#해야-하는-일)
- [Pain과 불신 조건](#pain과-불신-조건)
- [성공 흐름](#성공-흐름)
- [정책별 기대](#정책별-기대)
- [Anti-persona](#anti-persona)

## TL;DR

김민서는 AI 초안 수보다 정확한 계정·검수 가능한 채널별 결과·중복 없는 게시·실제 결과 링크를 원한다. Studio에서 일을 시작하되 승인·일정·복구 화면에서도 같은 항목을 찾을 수 있어야 다시 사용한다.

## 인물

김민서는 서울에서 직무교육과 소규모 컨설팅을 혼자 운영한다. 수업·상담·회계·고객응대까지 직접 하므로 마케팅 시간은 월요일 45분과 평일 자투리 시간뿐이다. Threads, Instagram Feed, Facebook, YouTube Shorts, Instagram Reels, TikTok을 운영하지만 같은 아이디어를 여러 번 다시 쓰고 계정·형식·공개범위를 확인하는 시간이 부담스럽다. AI 초안은 예전 가격이나 존재하지 않는 혜택을 섞을 수 있어 회사소개와 강의자료를 다시 연다. 가장 큰 공포는 잘못된 계정과 중복 발행이다. `j.the.great.investor`로 가입했는데 연결 팝업에 기존 `zero_to_one_ai`가 보이거나 연결 완료 뒤 미연결이면 자동화를 믿지 않는다. Studio에서 콘텐츠를 만들었는데 Publish와 예약이 사라져 Queue·Inbox·Calendar를 순회해야 하면 기능이 후퇴했다고 느낀다. 반대로 여러 화면의 버튼이 별도 record를 만들어 두 번 게시되는 것도 원하지 않는다. 필요한 것은 Studio에서 채널별 카드를 수정하고 저장한 뒤 자신의 승인 정책에 맞춰 `지금 게시`, `승인 요청`, `예약`, `예약 승인 요청`을 정확히 실행하는 것이다. 이후 동일 항목을 승인 인박스·캘린더·채널 Queue·영상 작업실에서 찾아 복구와 결과를 관리하고 싶다. Telegram·Discord·Slack은 매번 생성되는 네 번째 콘텐츠 rail이 아니라, 검수를 마친 공지를 커뮤니티에도 보내기로 명시 결정했을 때만 필요하다. 전체 성과는 발행 상태 같은 합산 가능한 운영지표만 보고, 조회·도달·참여는 Threads/X/Facebook/Instagram Feed/Bluesky/Shorts/Reels/TikTok 각각의 실제 수집 또는 미수집 상태로 보고 싶다. 성공은 브랜드 근거 선택→Studio 생성·수정→Save→즉시/예약 initiation→필요 시 승인→증명 가능한 게시 결과→native observation→다음 콘텐츠 변경안까지 한 흐름에서 끝나고 다음 주에도 같은 identity로 찾는 상태다. 수작업 시간·게시 빈도·지불의사는 아직 미측정 가설이다.

## 해야 하는 일

> 마케팅 시간이 부족할 때, 내 브랜드 자료로 채널별 콘텐츠를 만들고 Studio에서 바로 저장·승인 요청·게시·예약한 뒤 동일 항목의 실제 결과를 확인해 잘못된 계정·중복 게시·끊긴 목록 없이 다음 콘텐츠를 개선하고 싶다.

## Pain과 불신 조건

| Pain | 제품이 실패한 증거 | 필요한 통제 |
|---|---|---|
| Wrong account | target B인데 A 계정 표시/발행 | identity ladder+switch fixture |
| 기능 후퇴 | Studio Publish·예약·카드 편집 사라짐 | action preservation+R3 Studio6 |
| 중복 게시 | 같은 intent가 화면별로 두 번 실행 | canonical command+idempotency |
| 화면 drift | Studio/Queue/Inbox/Calendar 상태 다름 | projection parity100% |
| 메시징 혼잡 | Discord/Slack이 생성 rail에 상시 노출 | rail3 lock+default OFF handoff |
| 거짓 성과 | 미수집을 숫자0이나 가짜 시각으로 표시 | native8 two-schema truth |

## 성공 흐름

1. 내 workspace·계정임을 확인한다.
2. 확인된 브랜드 근거로 3 rail을 생성하고 카드별로 수정·저장한다.
3. Settings의 실제 승인 정책에 맞는 버튼을 누른다. readiness 실패는 정책 문구를 바꾸지 않고 이유와 해결 action을 준다.
4. 커뮤니티 공지가 필요할 때만 `커뮤니티로 보내기`를 켜고 destination을 고른다.
5. Queue·Inbox·Calendar·`/videos`에서 같은 identity/version을 관리한다.
6. proof 또는 안전한 recovery를 확인한다.
7. native8의 collected 또는 정직한 unsupported truth를 보고 다음 콘텐츠 변수 하나를 바꾼다.

## 정책별 기대

| 상황 | 기대 문구·결과 |
|---|---|
| 신규 외부 pilot | 승인 필요 기본; `승인 요청/예약 승인 요청`; 승인 전 external0 |
| 기존 direct workspace | 명시 전환 전 `지금 게시/예약` 유지; silent change0 |
| readiness failure | 현재 정책 copy 유지+disabled+reason+next action |
| 일반 member | Settings policy read-only |
| workspace owner | policy 변경+confirmation+audit |

## Anti-persona

- 무승인 대량 DM·댓글·팔로우 자동화를 원하는 operator.
- provider 약관·권리·AI disclosure를 우회하려는 사용자.
- enterprise attribution warehouse·paid bidding을 즉시 대체하려는 조직.

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=4/5 추적성=5/5 전문성=5/5 total=24/25
WEAKEST_LINE: 지불의사와 현재 수작업 시간은 외부 인터뷰 전 미측정이다.
SKILLS_USED: 없음 — persona PRD view 전용 매칭 skill 없음
SKILLS_SKIPPED: 없음 — 매칭 skill 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md`; `tasks/marketing-agent-plan-critic-v7.2.output`; user-reported OAuth/Studio/OSMU failures; current `studio/page.tsx`.
MODEL: gpt-codex/gpt-5.6-sol
