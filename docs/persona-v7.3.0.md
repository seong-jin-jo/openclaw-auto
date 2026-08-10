# OSMU Marketing Agent — Persona v7.3.0

<!--
STAMP
created_at: 2026-08-07 12:58 KST
model: gpt-codex/gpt-5.6-sol
agent: prd-architect / marketing_agent_prd_v7
skills: brand-positioning-kit; openclaw-creative-brief
evidence: PRD v7.3.0 §3·§8.5, user failure reports, current Studio/brand code, v18 audits
deliberation: 생성량보다 “목표를 줬는데 다시 내가 PM해야 하는” 대행 공백과 wrong-account·중복 불신을 함께 구체화한다.
-->

| 항목 | 값 |
|---|---|
| 버전 | v7.3.0 |
| 정본 | [PRD v7.3.0](openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md) |
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

김민서는 AI 초안 수보다 자신의 목표와 브랜드 근거를 받아 조사·브리프·세 형식 납품·발행·보고까지 운영해 주는 에이전트를 원한다. 자신은 중요한 결정만 승인하되 모든 화면에서 같은 캠페인과 실제 계정을 확인할 수 있어야 다시 사용한다.

## 인물

김민서는 서울에서 직무교육과 소규모 컨설팅을 혼자 운영한다. 수업·상담·회계·고객응대까지 직접 하므로 마케팅 시간은 월요일 45분과 평일 자투리 시간뿐이다. Threads, Instagram Feed, Facebook, YouTube Shorts, Instagram Reels, TikTok을 운영하지만 같은 아이디어를 여러 번 다시 쓰고 계정·형식·공개범위를 확인하는 시간이 부담스럽다. AI 초안은 예전 가격이나 존재하지 않는 혜택을 섞을 수 있어 회사소개와 강의자료를 다시 연다. 더 근본적인 고통은 “이번 달 신규 강의 20석”이라는 목표를 줘도 조사·브리프·텍스트·카드·영상·검수·파일 정리·성과 보고를 다시 자신이 PM해야 한다는 점이다. 목표, audience, offer, 유료 집행 없음, 마감, 승인권자를 한 번 확인하면 Agent가 근거를 모으고 승인 가능한 브리프와 납품 계획을 가져오길 원한다. 피드백이 어느 버전에 반영됐고 어떤 게시 결과가 다음 주 실험 한 가지를 바꿨는지도 남아야 대행을 맡겼다고 느낀다. 가장 큰 공포는 잘못된 계정과 중복 발행이다. `j.the.great.investor`로 가입했는데 연결 팝업에 기존 `zero_to_one_ai`가 보이거나 연결 완료 뒤 미연결이면 자동화를 믿지 않는다. Studio에서 Publish와 예약이 사라져 Queue·Inbox·Calendar를 순회해야 하면 기능이 후퇴했다고 느끼고, 반대로 화면별 record가 두 번 게시돼도 떠난다. 필요한 것은 기존 자료를 GitHub 폴더·tone 파일·6문항·붙여넣기·새 wiki 중 편한 방식으로 넣고, 확정된 guide와 brief로 `텍스트→사진/카드→영상`을 만든 뒤 자신의 승인 정책에 맞춰 `지금 게시`, `승인 요청`, `예약`, `예약 승인 요청`을 실행하는 것이다. Telegram·Discord·Slack은 생성 rail이 아니라 검수 후 명시 선택한 공지 handoff여야 한다. 전체 성과는 합산 가능한 운영지표만, native 성과는 destination-format별 수집·미수집 상태로 보고 싶다. 성공은 업무위임→근거→승인 brief→세 형식→수정·승인→증명 가능한 게시→성과 보고→근거가 실제 입력된 다음 실험까지 같은 campaign identity로 닫히는 상태다. 수작업 시간·게시 빈도·지불의사는 아직 미측정 가설이다.

## 해야 하는 일

> 마케팅 시간이 부족할 때, 목표와 브랜드 자료를 한 번 맡기고 승인할 결정만 확인하면서 조사·세 형식 납품·정확한 계정 발행·성과 보고·다음 실험까지 같은 캠페인으로 끝내고 싶다.

## Pain과 불신 조건

| Pain | 제품이 실패한 증거 | 필요한 통제 |
|---|---|---|
| Wrong account | target B인데 A 계정 표시/발행 | identity ladder+switch fixture |
| 기능 후퇴 | Studio Publish·예약·카드 편집 사라짐 | action preservation+R3 Studio6 |
| 중복 게시 | 같은 intent가 화면별로 두 번 실행 | canonical command+idempotency |
| 화면 drift | Studio/Queue/Inbox/Calendar 상태 다름 | projection parity100% |
| 메시징 혼잡 | Discord/Slack이 생성 rail에 상시 노출 | rail3 lock+default OFF handoff |
| 거짓 성과 | 미수집을 숫자0이나 가짜 시각으로 표시 | native8 two-schema truth |
| 대행 흉내 | 초안 수만 많고 목표·마감·승인자·보고가 끊김 | campaign14+work order/brief/report |
| 브랜드 drift | 새 guide가 예전 산출물까지 바꿔 보임 | immutable source/guide/generation snapshot |
| 가짜 학습 | `다음 초안` 링크만 열리고 입력 변화0 | evidence IDs+variable1+revision diff |

## 성공 흐름

1. 내 workspace를 확인하고 source5 중 하나로 브랜드 자료와 guide version을 확정한다.
2. 목표·audience·offer·dates·budget·approver를 위임하고 research/brief를 승인한다.
3. `텍스트→사진/카드→영상` 납품물을 카드별로 검수·수정·저장한다.
4. Settings의 실제 승인 정책에 맞는 버튼을 누른다. readiness 실패는 정책 문구를 바꾸지 않고 이유와 해결 action을 준다.
5. 커뮤니티 공지가 필요할 때만 `커뮤니티로 보내기`를 켜고 destination을 고른다.
6. Queue·Inbox·Calendar·`/videos`에서 같은 identity/version을 관리한다.
7. proof·result library·성과 보고를 확인하고, evidence ID가 연결된 다음 실험 변수 하나를 승인한다.

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
SKILLS_USED: brand-positioning-kit — persona 욕망·불신·tone 경계 / openclaw-creative-brief — 고객 업무위임·승인 흐름
SKILLS_SKIPPED: 없음
PRESENTATION_CHECK: 툴 잔재0·목차/표 구조 확인; 최종 웹 렌더는 exit report에 기록
SOURCES: `openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md`; v18 blueprint/completeness audit; user-reported OAuth/Studio/OSMU failures; current `studio/page.tsx`, RepoConnect, BrandSetupWizard.
MODEL: gpt-codex/gpt-5.6-sol
