# OSMU v5 Wireframe 05: View, State, Button RTM

## ID dictionary

### Views

| ID | View |
|---|---|
| V01 | OSMU provider hub and common shell |
| V02 | Global Settings > Channels |
| V03 | Platform Settings 9 groups |
| V04 | Provider and surface Editor |
| V05 | Final Review Sheet |
| V06 | Queue |
| V07 | Calendar |
| V08 | Source Result Group |
| V09 | Analytics |
| V10 | Growth |
| V11 | Popular |
| V12 | Recovery and reconciliation |
| V13 | OSMU Studio source and 12 variants |
| V14 | Account Switcher and account truth comparison |

### States

| ID | State |
|---|---|
| S01 | 연결 안 됨 |
| S02 | 확인 중 |
| S03 | 연결됨 |
| S04 | 재연결 필요 |
| S05 | 플랫폼 준비 안 됨 |
| S06 | 일시 장애 |
| S07 | wrong-account |
| S08 | tenant mismatch |
| S09 | connection false-success TRIGGERED |
| S10 | source 미승인 |
| S11 | validation error |
| S12 | scheduled |
| S13 | publishing |
| S14 | processing |
| S15 | reconciling 502/timeout |
| S16 | partial |
| S17 | published external result |
| S18 | terminal failure |
| S19 | unsupported/review-required |
| S20 | Popular sample 0/2/3 |
| S21 | loading local one area |
| S22 | duplicate request/idempotency |

### Buttons

| ID | Button |
|---|---|
| B01 | provider 열기 |
| B02 | 플랫폼 설정 열기 |
| B03 | 계정 바꾸기 |
| B04 | 계정 다시 확인 |
| B05 | 원문 승인 |
| B06 | 선택한 초안 만들기 |
| B07 | 이 초안 편집 |
| B08 | 선택한 항목 검수 |
| B09 | 지금 발행 요청 |
| B10 | 예약 확정 |
| B11 | Queue에서 계속 보기 |
| B12 | Calendar에서 보기 |
| B13 | 게시물 보기 |
| B14 | 외부 결과 먼저 확인 |
| B15 | 실패만 복구 |
| B16 | 준비 조건 보기 |
| B17 | 다시 연결 |
| B18 | 내 워크스페이스로 돌아가기 |
| B19 | 권한 확인 |
| B20 | 목표 계약 보기 |
| B21 | 예약 취소 |
| B22 | 시간 바꾸기 |

## REQUEST-OSMU-001 17/17

| # | Request | View | State | Button | Coverage |
|---:|---|---|---|---|---|
| 1 | 가입 account와 Threads handle 혼선 | V02,V03,V04,V06,V14 | S07,S08 | B03,B18 | target identity 4면 비교와 tenant 차단 |
| 2 | Meta 계정 전환 없음 | V14 | S07 | B03,B04 | existing-session chooser와 callback target 확인 |
| 3 | Threads not connected | V02,V03,V04,V06 | S01,S02,S03,S09 | B04,B16 | callback/provider truth 동일 상태 |
| 4 | Instagram CTA·재연결 | V02,V03,V04 | S03,S04 | B17,B02 | OAuth 뒤 CTA와 handle 동기화 |
| 5 | 한국어 상태 통일 | V01~V06 | S01~S06 | B04,B17 | 6-state system |
| 6 | Graph token 중복·빈값 | V03 group 9 | S04 | B17 | 고급 복구 안에서만 token diagnosis |
| 7 | Global Settings 연결 표시 | V02 | S01~S06 | B02 | identity/state/verified-at 요약 |
| 8 | 탭 일관성 | V01 | S03,S05 | B01 | provider 6개, exact 6 tabs |
| 9 | 502 recovery | V06,V08,V12 | S15,S16,S22 | B14,B15 | correlation, reconcile, duplicate 0 |
| 10 | 초안·검수·Now·Schedule | V04,V05,V06,V07,V13 | S10~S14 | B05~B12 | one source lifecycle |
| 11 | 전체 OSMU 범위 | V01,V04,V13 | S03,S05,S19 | B01,B06 | 6 provider, 8 surface, 12 capability |
| 12 | 고객 용어 | all | all | all | 내부용어를 고객 행동 언어로 교체 |
| 13 | loading 절제 | all async views | S21 | B11 | 선택 영역 한 곳만 loading |
| 14 | 기존 구현 전수·보존 | V01,V06,V07,V13 | all | B01,B11,B12 | Sidebar, Studio, Queue, Calendar additive |
| 15 | 먼저 운영 복구 | V01,V02,V12 | S09 | B16,B14 | R0 hard stop 전 신규 dispatch 닫힘 |
| 16 | client-ready PRD | V01~V14 | all | all | v5 hub와 문서 RTM |
| 17 | 100B 표시 | V01 | S03 | B01 | controller publication 이후 link 대상 |

## DESIGN-005 8/8

| # | 요구 | View | State | Button | Coverage |
|---:|---|---|---|---|---|
| 1 | 6 providers/8 surfaces | V01,V04,V13 | S03,S05 | B01,B06 | counts와 surface switcher |
| 2 | 공통 6탭 | V01 | all | B01 | Queue/Editor/Analytics/Growth/Popular/Settings 36/36 |
| 3 | 생성·플랫폼 편집·검수 | V04,V05,V13 | S10,S11,S19 | B05~B08 | 12 independent variants |
| 4 | Now/Schedule/Queue/Calendar | V05,V06,V07 | S12~S18 | B09~B12,B21,B22 | current gap과 target path |
| 5 | 기록·link·분석 | V08~V11 | S17,S19,S20 | B13,B19 | external result와 18 analytics contracts |
| 6 | 연결·계정·권한·설정 | V02,V03,V14 | S01~S09,S19 | B02~B04,B16~B18 | 6×9 settings detail |
| 7 | current readiness vs target | all provider views | S03,S05,S19 | B16,B20 | fixed mode badge |
| 8 | happy+recovery | V05,V08,V12 | S07~S18,S22 | B09,B10,B14,B15 | success, wrong-account, 502, partial, duplicate |

## OSMU-V3-TC-001~030

| TC | View | State | Button | Prototype observation |
|---|---|---|---|---|
| 001 | V01,V04,V13 | S03,S19 | B01,B06 | 6/8/12 IDs |
| 002 | V01 | all | B01 | 6 providers × 6 tabs, hidden 0 |
| 003 | V02,V03,V04,V06 | S01~S06,S09 | B04,B17 | 4면 identity/state/CTA |
| 004 | V14 | S07 | B03 | Meta target chooser recovery |
| 005 | V14,V05,V08 | S03,S07 | B03,B09 | same provider 2 accounts, target link |
| 006 | V02,V03 | S01~S06 | B02 | summary/detail split, same truth |
| 007 | V03 | S03,S05,S19 | B02,B16 | 54/54 settings cell detail |
| 008 | V13,V05 | S10 | B05 | unapproved dispatch 0 |
| 009 | V13,V04 | S03,S19 | B06,B07 | 12/12 variant, manual edit preserved |
| 010 | V04 | S11 | B07 | invalid media/privacy/disclosure request 0 |
| 011 | V05 | S03,S19 | B08 | target/content/privacy/time gate |
| 012 | V05,V08 | S13,S17 | B09,B13 | external ID/link/identity |
| 013 | V05,V06,V07 | S12,S17 | B10,B21,B22 | create/cancel/reschedule/due consistency |
| 014 | V06,V08 | S14,S17,S18 | B11,B13 | terminal 전 published 0 |
| 015 | V08,V12 | S15,S22 | B14 | same key external result ≤1 |
| 016 | V08,V12 | S16,S17,S18 | B13,B15 | source group partial isolation |
| 017 | V09,V10,V11 | S19,S20 | B19 | 6×3 S/R/U, fake 0 없음 |
| 018 | V01,V06,V12 | S04,S06,S18,S19 | B16,B17 | action과 retry time |
| 019 | V03 | S01,S04 | B02 | disconnect/delete/revoke 영향과 publish 0 |
| 020 | V02,V03,V04,V06 | S08 | B18 | 2 tenant ×2 account deny |
| 021 | all provider views | S05,S19 | B16,B20 | readiness reason/evidence/enable condition |
| 022 | V01,V06,V07,V13 | all | B01,B11,B12 | additive shell, route 제거 0 |
| 023 | V04,V05,V08 | S03,S12~S17 | B09,B10,B13 | Threads 3 + Instagram 2 legacy target flows |
| 024 | V01~V14 | S01~S22 | B01~B22 | REQUEST 17, DESIGN 8, TC30, orphan 0 |
| 025 | V13 | S03 | B05 | external cohort notice and consent entry |
| 026 | V01,V05 | S09 | B16 | R0 전 OAuth/Now/Schedule closed |
| 027 | V02,V03,V08 | S08 | B18 | token/private source/handle/permalink raw 노출 0 |
| 028 | V08,V12 | S15 | B14,B15 | white screen 0, correlation/reconcile/action |
| 029 | V04,V05,V06 | S05,S19 | B16,B20 | IG/FB Reels, X media, YT, TT schedule gap honest |
| 030 | V11 | S20 | B11,B13 | sample 0/2 부족, 3 ranking+link |

## Coverage result

- REQUEST-OSMU-001: 17/17
- DESIGN-005: 8/8
- OSMU-V3-TC: 30/30
- view orphan: 0
- state orphan: 0
- button orphan: 0

---
🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 01:28 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SKILLS_USED: design-consultation에 요구 추출, design-html에 view/state/button routing, design-review에 orphan audit / SKILLS_SKIPPED: 없음
SOURCES: PRD v3.1 §10·11·17, qa-tracker REQUEST-OSMU-001·DESIGN-005·TC-001~030
MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: coverage=5/5 atomicity=5/5 observability=5/5 recovery=5/5 slop=5/5 total=25/25
WEAKEST_LINE: TC-025의 cohort collection은 design entry만 추적하며 실제 개인정보 notice와 저장 계약은 eng-design에서 확정해야 한다.
