# OpenClaw Auto Marketing Hub PRD v5.0.0

> STAMP: 2026-08-06 | model: gpt-codex/gpt-5.6-sol | owner: prd-architect | 기반: `wiki/product/marketing-hub-surface-map.md`, `tasks/osmu-full-ui-code-audit.output` | 상태: **계획 초안—구현/배포 승인 아님**

## 목차

1. 목적·One Thing·성공
2. 사용자·증거 경계·출처
3. 현행과 목표
4. IA·라우트·공급자 계약
5. MVP·비목표·요구사항
6. BM·리스크·출시·중단 기준
7. 레드팀·미결정

## 1. 제품 정의

**One Thing:** 고객이 하나의 콘텐츠 원본을 만들고, 자신의 연결 계정별로 검토·수정한 뒤 즉시 또는 예약 발행하고, 실패하면 같은 카드에서 회복할 수 있게 한다.

성공은 “채널 카드가 많음”이 아니라, **초안 → 계정별 편집 → 카드별/일괄 발행 또는 예약 → Inbox/Calendar 확인 → permalink 또는 재시도**가 고객 계정 경계 안에서 끊기지 않는 것이다. 첫 MVP 성공 기준은 연결된 고객이 1개 이상 텍스트 채널에서 이 흐름을 완료하고, 발행 결과·실패 사유·복구 동작을 직접 확인하는 것이다.

### 사용자

| 사용자 | 해야 할 일 | 제품 원칙 |
|---|---|---|
| 고객(소상공인/마케터) | 브랜드 콘텐츠를 여러 계정에 맞춰 발행·예약·복구 | 비밀값을 보지 않으며 자신의 워크스페이스·계정만 본다. |
| 운영자 | 고객·OAuth 연결 상태·지원 요청을 관리 | 고객 콘텐츠를 임의 발행하지 않으며 timed secret reveal과 감사 경계를 지킨다. |

### 증거 경계와 출처

현행 사실은 로컬 코드 감사 기준이며 운영 동작 증명이 아니다. 특히 502는 관찰된 장애 신호이지 해결된 문제가 아니다. 제품 흐름 참고는 [Buffer scheduling](https://support.buffer.com/article/642-scheduling-posts), [Buffer all channels](https://support.buffer.com/article/861-how-to-use-the-all-channels-view), [Later social sets](https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets), [Later profile connection](https://help.later.com/hc/en-us/articles/360043244733-Add-Remove-Transfer-Social-Profiles-in-Later), [Hootsuite calendar create/schedule](https://help.hootsuite.com/hc/de/articles/1260804306069-Create-and-schedule-content-in-a-calendar), [Hootsuite calendar management](https://help.hootsuite.com/hc/de/articles/1260804306009-Manage-your-content-calendar)을 사용했다. 이들 문서는 UX 비교 근거일 뿐 현재 기능 증거가 아니다.

## 2. 현행 → 목표

| 구분 | 현행 코드 감사 | MVP 목표 |
|---|---|---|
| Studio 시각 카드 | Threads, X, Facebook, Instagram, Shorts, Reels, TikTok **7** | 7개 카드의 표현은 보존하되, 지원·미지원·외부 상태를 명시한다. |
| Studio 직접 발행 | Threads/X/Facebook/Instagram **4** | 지원 provider만 즉시/예약 가능; 나머지는 생성·내보내기 또는 disabled 상태. |
| 텍스트 어댑터 | **8** | 계정별 제약·미리보기·발행 능력을 capability로 판단한다. |
| 비디오 어댑터 | **3** | `/videos`가 소유하고 텍스트 스케줄의 성공으로 가장하지 않는다. |
| 확장 | **15** | extension 존재를 고객 가능 기능으로 노출하지 않는다. |
| Inbox/Calendar | legacy queue 기반 초안 승인 / 읽기 전용 날짜 보기 | 한 작업 결과를 참조할 수 있게 연결하되, DB SSOT 전환 전에는 기존 queue 의미를 보존한다. |

## 3. 정보구조: 25개 라우트 보존·수정·추가

`P=보존`, `F=흐름 연결/수정`, `A=추가`, `D=disabled`, `E=external`, `O=운영자`.

| # | Route | 결정 | v5 계약 |
|---:|---|---|---|
| 1 | `/` | F | 성과·온보딩·최근 결과 permalink/실패 복구 진입점 |
| 2 | `/login` | P | Google 로그인·권한 경계 |
| 3 | `/signup` | P | 로그인으로 안전한 리다이렉트 |
| 4 | `/studio` | F | 원본·계정별 카드·즉시/예약·결과 생성 |
| 5 | `/inbox` | F | 기존 queue 승인 + Studio 결과 링크, 혼동 없는 상태 라벨 |
| 6 | `/calendar` | F | queue 날짜 보기 보존; Studio 예약 결과를 참조·재시도 진입 |
| 7 | `/channels/[channel]` | F | provider capability에 따라 specialized 탭 유지 |
| 8 | `/videos` | F | 비디오 생성/발행의 독립 작업공간 |
| 9 | `/images` | P | tenant 이미지 갤러리 |
| 10 | `/blog` | P | 독립 블로그 queue |
| 11 | `/blog-performance` | P | API 의존 성과 보기 |
| 12 | `/search-console` | P | 연결 시 데이터 UI, 실패/캐시 상태 |
| 13 | `/keyword-planner` | P | 키워드 조사·bank |
| 14 | `/google-analytics` | D | 고객 GA4 미지원 안내, 데이터 없음 표기 |
| 15 | `/naver-trends` | D | tenant credential 저장 전 미지원 |
| 16 | `/search-advisor` | D | tenant credential 저장 전 미지원 |
| 17 | `/google-trends` | E | 외부 Google Trends 링크/가이드 |
| 18 | `/performance` | P | `/` 호환 리다이렉트 |
| 19 | `/services` | P | tenant 서비스 전환·생성(권한 검증 필요) |
| 20 | `/settings` | F | 연결·계정 전환 SSOT와 8개 고객 탭 |
| 21 | `/operator` | O | 운영자 전용 진입·고객 shell 분리 |
| 22 | `/operator/customers` | O | 고객/OAuth 관리, 발행 권한 없음 |
| 23 | `/privacy` | P | 정책 |
| 24 | `/terms` | P | 약관 |
| 25 | `/data-deletion` | P | 데이터 삭제 절차 |

### 공급자 capability 계약

| 종류 | 현행 표면 | v5 지원 계약 |
|---|---|---|
| Threads | Queue/Analytics/Growth/Popular/Settings | 텍스트 카드, 계정 선택, 지원 시 즉시·예약·permalink·재시도 |
| Instagram | Queue/Editor/Settings, CardNews | specialized Editor 보존; OAuth와 수동 token을 단일 연결 정본처럼 보이게 하지 않음 |
| X/Facebook | generic social | 지원 adapter/연결 계정에서만 카드 발행 |
| Shorts/Reels/TikTok | Studio 시각 카드 + `/videos` | Studio는 생성/hand-off; 비디오 발행은 `/videos` capability가 승인할 때만 |
| Messaging | credential/setup guide | Queue/Analytics가 있다고 암시하지 않음 |
| Data | credential/setup 또는 별도 data route | 발행 provider가 아님 |
| Blog | channel + `/blog` | 독립 blog queue, Studio 발행과 병합 금지 |

**연결 SSOT:** provider account는 고객 workspace에 귀속된 하나의 account record와 capability snapshot으로 표현한다. Settings/채널 화면/Studio는 같은 읽기 모델을 사용한다. OAuth callback의 “연결 완료”는 account 저장 + 상태 읽기 검증 후에만 표시한다. 계정 전환은 provider 세션 선택이 불가할 수 있음을 먼저 알리고, 재인증/권한해제/선택 계정 식별을 남긴다. customer UI에는 운영자 secret·타 tenant가 노출되지 않는다.

## 4. MVP와 비목표

**MVP:** (1) 연결된 계정 선택, (2) Studio 원본에서 provider별 텍스트 카드 생성·편집, (3) 카드별/일괄 즉시 발행 및 예약, (4) 하나의 작업 ID로 상태·permalink·오류·복구 제공, (5) Inbox/Calendar에 안전한 참조, (6) 390px 모바일 navigation과 overflow 안전성, (7) 502/중복 요청에 대한 idempotency·관찰성.

**비목표:** 모든 15 extension의 발행 지원, GA4/Naver/Search Advisor의 즉시 활성화, Studio와 blog/video queue의 강제 통합, provider가 제공하지 않는 계정 선택 보장, 운영자의 고객 대리발행, 실패를 성공으로 치환하는 자동 재시도.

## 5. 요구사항·수용기준·테스트 (1:1)

| ID | Requirement (FR) | Acceptance (AC) | Test (TC) |
|---|---|---|---|
| 01 | 고객 workspace를 모든 작업 ID에 고정 | 타 tenant 데이터 0건 | A/B tenant API/UI 격리 |
| 02 | operator/customer shell 분리 | 고객 route에 운영 메뉴 없음 | 두 role 렌더 |
| 03 | Settings를 account SSOT로 사용 | 3 화면 동일 account/status | Settings/Studio/channel 대조 |
| 04 | OAuth 완료는 read-back 뒤 표시 | 저장 실패면 성공 문구 없음 | callback 실패 주입 |
| 05 | account switch 식별 기록 | 선택/재인증 안내와 account label | 기존 provider 세션 케이스 |
| 06 | OAuth/manual token 경로를 구분 | Instagram에 두 정본처럼 보이지 않음 | Settings 스냅샷 |
| 07 | capability snapshot을 노출 | 지원/disabled/external이 명확 | provider matrix 렌더 |
| 08 | 비밀값 고객 비노출 | token 문자열 0 | DOM/API 검사 |
| 09 | Studio 원본 초안 저장 | 재진입 시 원본 보존 | create/reload |
| 10 | 텍스트 8 adapter를 구분 | 카드가 capability를 따름 | 8 adapter fixture |
| 11 | visual 7을 보존 | 7 카드 모두 표시 | Studio snapshot |
| 12 | direct 4만 발행 CTA | 나머지는 publish CTA 없음 | 7 card assertion |
| 13 | video 3은 `/videos` hand-off | Studio 성공 발행으로 표시 안 함 | video card click |
| 14 | 계정별 카드 편집 | 한 카드 수정이 원본/타 카드 불변 | edit isolation |
| 15 | validation은 계정별 실행 | 제약 위반 카드만 차단 | mixed-card fixture |
| 16 | 카드별 즉시 발행 | 한 카드 결과가 작업 ID에 기록 | single publish |
| 17 | 지원 카드 bulk 즉시 발행 | 각 카드 독립 결과 | one failure bulk |
| 18 | 카드별 예약 | timezone/date validation | schedule single |
| 19 | 지원 카드 bulk 예약 | 개별 schedule 상태 | mixed bulk schedule |
| 20 | 작업 상태를 durable 저장 | reload 뒤 상태 동일 | publish/reload |
| 21 | 결과에 permalink 저장 | 성공 시 링크·provider ID 존재 | mocked provider success |
| 22 | 실패 사유를 카드에 저장 | generic 성공 문구 없음 | provider error |
| 23 | 재시도는 같은 intent 키 사용 | 중복 post 1회 | double-click/network retry |
| 24 | 502를 명확히 실패 처리 | retry 가능/지원 ID 표시 | 502 fixture |
| 25 | timeout은 미확정으로 표시 | 성공 추정 금지 | timeout fixture |
| 26 | recovery는 카드별 제공 | 실패 카드만 재시도 가능 | partial failure |
| 27 | Inbox는 queue 의미 보존 | Studio/legacy 상태 라벨 구분 | Inbox fixtures |
| 28 | Calendar는 읽기 view 보존 | 예약 작업 참조 링크 존재 | date fixture |
| 29 | `/`에 최근 결과 노출 | 링크/실패 회복 진입 | home fixture |
| 30 | Threads Growth/Popular 보존 | 탭 제거 없음 | Threads tabs |
| 31 | Instagram Editor/CardNews 보존 | generic 탭으로 대체 안 함 | Instagram tabs |
| 32 | Messaging는 config only | Queue/Analytics CTA 없음 | messaging route |
| 33 | Blog queue 독립 | Studio 결과와 병합 안 함 | blog/studio isolation |
| 34 | disabled data routes 유지 | 데이터 정상처럼 표시 안 함 | 3 disabled routes |
| 35 | Google Trends external 표시 | 외부 목적지/경고 명확 | link assertion |
| 36 | `/performance` 호환 유지 | `/`로 redirect | route test |
| 37 | Settings 고객 8탭 유지 | operator Video/TTS 미노출 | role snapshots |
| 38 | operator customer 관리 보존 | timed reveal·감사 경계 | operator fixture |
| 39 | legal 3 route 유지 | navigation/link 동작 | route smoke |
| 40 | desktop sidebar 26 IA 보존 | 대상 route 접근 가능 | nav inventory |
| 41 | 390px 대체 nav 제공 | sidebar 숨김이어도 이동 가능 | 390px keyboard/tap |
| 42 | 모바일 수평 overflow 0 | videos/search-console 포함 0px | 390px scrollWidth |
| 43 | mobile card actions overflow menu | touch target에서 모든 action 접근 | 390px card action |
| 44 | loading/error/empty를 구분 | tenant/API 실패 안내 | API fixtures |
| 45 | analytics는 capability와 분리 | extension/API 존재 과장 없음 | copy audit |
| 46 | audit trail 기록 | actor/time/account/intent/result | DB/API assertion |
| 47 | provider rate/error observability | correlation ID로 추적 | log capture |
| 48 | E2E는 happy+edge 증명 | 실제 지원 fixture 전부 통과 | end-to-end suite |

## 6. BM·리스크·출시

**BM:** workspace 월 구독(연결 계정 수·예약/협업 한도) + 고비용 AI/비디오 사용량 기반 과금. provider API 비용·rate limit과 operator 지원비를 요금제에 반영하며, 미지원 provider는 유료 기능처럼 팔지 않는다.

| 리스크 | 완화/출시 조건 |
|---|---|
| OAuth가 다른 provider 계정을 계속 사용 | account read-back, 전환 안내, 실제 새 계정 callback E2E 전 출시 금지 |
| legacy queue와 새 작업 모델 불일치 | 참조 브리지부터, SSOT 마이그레이션은 별도 승인 |
| 502/timeout 중복 발행 | intent idempotency, uncertain 상태, provider 조회/수동 recovery |
| capability 과장 | UI capability contract·disabled/external 상태·copy audit |
| 모바일 sidebar 부재/overflow | 390px E2E에서 nav 및 0 overflow가 gate |
| 고객/운영자 권한 누출 | tenant isolation과 role E2E가 release gate |

**Rollout:** 내부 fixture → 단일 테스트 workspace(Threads 등 한 지원 provider) → 제한 고객 cohort → capability별 확장. 각 단계는 실제 계정에서 draft→edit→publish/schedule→permalink/recovery를 관찰하고 502/timeout recovery를 연습한 뒤 다음 단계로 간다. 배포는 QA 승인 후 별도 결정이다.

**Kill criteria:** 제한 cohort에서 2주 내 지원 provider 작업 성공률 90% 미만, idempotency 위반 1건, cross-tenant/secret 노출 1건, 또는 390px 핵심 흐름 차단이 해소되지 않으면 확장 중지·원인 분석·rollback/기능 flag 조치를 한다. 이는 제품 폐기가 아니라 해당 rollout 단계 중단 기준이다.

## 7. 셀프 레드팀·미결정

**레드팀:** (a) “7 visual 카드=7개 발행 지원”이라는 오류를 direct 4/text 8/video 3과 분리했다. (b) Queue/Calendar가 이미 하나의 작업 SSOT라는 오류를 피하고 기존 view 보존을 요구했다. (c) local component/API 존재를 운영 검증으로 쓰지 않았다. (d) provider 계정 전환을 우리가 강제할 수 있다는 전제를 두지 않고 provider 세션 경계와 실 E2E를 release gate로 뒀다. (e) 502 뒤 재시도가 중복 발행할 위험을 intent key/uncertain 상태로 명시했다.

**회수 필요(구현 전 결정):** 새 작업 결과의 DB 스키마·API 계약·legacy queue와의 정식 SSOT 전환 시점, 지원 provider별 예약/조회 capability, OAuth 재인증 UX의 provider별 허용 경계, cohort 요금·한도. 이는 되돌리기 비싼 기술/사업 결정이므로 eng-design에서 선택지와 trade-off를 합의한다.

## 품질 선언

이 PRD는 `marketing-hub-surface-map`과 UI audit의 25 route/26 sidebar/현행 inventory를 보존 기준으로 삼았다. 코드를 변경하지 않았고, 현행 운용 가능·배포 완료·provider 성공을 주장하지 않는다.
