# 화면 정의서 v26: OSMU Marketing Hub 매거진 허브

> 대상 프로토타입: `docs/prototype/openclaw-auto-marketing-agent-magazine-v26-gpt-codex.html`
>
> 이 문서는 프로토타입의 화면 레지스트리와 1:1이다. 손으로 옮겨 적지 않고 빌드된 HTML의 `SCREENS` 배열에서 뽑았다.
> 프로토타입이 바뀌면 이 표도 다시 뽑는다. 어긋나면 그 자체가 결함이다.

## 0. STAMP

| 항목 | 값 |
|---|---|
| 생성시각 | 2026-08-16 14:51 KST |
| 모델 | claude-opus-5[1m] |
| 에이전트 | product-designer |
| 작업 라인 | marketing-agent-design |
| 산출물 | marketing-agent-v26-gpt-codex.md |
| 기반(버전핀) | prototype v25(화면 콘텐츠 전량 승계) · prototype v24(라우트·사이드바) · user-flow v9.6 · 제품구조 결정 2026-08-15 §9.6 §9.7 §9.8 · wiki/product/marketing-hub-surface-map.md · dashboard/src 실구현 |
| 형식 표준 | `romeo-vnext-magazine-v13-opus.html` (회장 2026-08-16 지목) |
| 고민 한 줄 | 화면을 다시 그리지 않았다. v25가 만든 콘텐츠를 흐름 단계로 다시 묶고, 각 화면에 실구현 경로·심리 근거·벤치마크를 붙이는 것이 이번 작업의 전부다. |

## 0.1 v26.1 수정 (2026-08-16, 회장 직접 조작 결함 4건)

회장이 v26 프로토타입을 직접 눌러 본 뒤 나온 결함 4건을 같은 파일에서 수선했다. 화면 삭제 0, 재창조 0.

| 결함 | 무엇이 문제였나 | 무엇을 바꿨나 |
|---|---|---|
| 1. 클릭할 때마다 팝업 | 브라우저 기본 대화상자 `alert()` 6곳 | 전부 제거(파일 내 실행 코드 0건). 화면 안 인라인 알림(`state.flash` → `[data-v26-flash]`)과 상태 전환으로 대체. 모달 안에서 눌린 확인은 그 모달 안에 알림이 뜬다 |
| 2. 화면마다 프레임 크기가 바뀜 | 화면 정의의 `vp` 값이 이동할 때마다 뷰포트를 강제 전환 | 강제 전환 제거. 상단 뷰포트 토글에서 고른 폭이 화면을 넘겨도 유지된다. 화면별 권장 폭은 좌측 색인의 "권장 390" 표기와 우측 패널의 "(권장 1024)" 병기로만 남는다. 초기값은 1024 고정 |
| 3. 로그인 취소 화면에서 밖으로 나감 | 취소·오류 화면의 닫기 버튼이 흐름 밖으로 떨어뜨림 | 취소·오류 두 상태에서는 닫기를 "로그인 화면으로"로 바꾸고, 외부 결과 열기는 새 창 대신 주소를 인라인으로 보여준다. 문서 전체 `a[href^=http]` 0개, `target=_blank` 0개 |
| 4. OSMU 제작이 한 화면 | `/studio`가 시장·추천·후보·편집·출력을 한 번에 쌓아 보여줌 | 5단계 마법사로 분할(아래 §3.5). 단계마다 진행 표시, 이전으로 돌아가기, 지금까지 고른 값 요약 |

## 1. v25에서 무엇이 바뀌었나

회장이 v25를 반려한 사유는 화면 콘텐츠가 아니라 **바깥 컨테이너**였다. 그래서 콘텐츠는 손대지 않고 컨테이너만 교체했다.

| 반려 사유 | v25 | v26 |
|---|---|---|
| 스탬프 없음 | 주석에만 있고 화면에 안 보임 | 최상단에 항상 보이는 STAMP 줄 + 하단 스탬프 푸터 |
| 타입별 반응형 없음 | 브라우저 창을 줄여야 확인 가능 | 뷰포트 4종(390·768·1024·1440) 토글이 기기 프레임 폭을 실제로 바꾼다 |
| 플로우 없음 | 라우트 나열 | 사용자 흐름 11단계로 묶은 번호 색인 + 이전·다음 이동 + 키보드 ←→ |
| 벤치마크·심리 법칙 안 보임 | 소스 주석에만 존재 | 화면마다 우측 패널에 심리 근거 줄과 벤치마크 줄이 **화면 문구로** 노출 |

**반응형이 실제로 도는 방식.** v25의 미디어쿼리(`@media (max-width:700px)` 등)는 브라우저 창 폭을 본다. 기기 프레임 안에 넣으면 아무 반응도 하지 않는다. 그래서 빌드 시 미디어쿼리를 **컨테이너쿼리**(`@container frame (max-width:700px)`)로 바꿨다. 프레임이 컨테이너가 되므로 390 토글이 실제 모바일 레이아웃(햄버거 메뉴, 단일 컬럼)을 만든다. 사용자 환경 설정 쿼리(`prefers-reduced-motion`)는 그대로 뒀다.

## 2. 재창조 0 확인

| 불변 항목 | 기준값 | v26 실측 |
|---|---|---|
| 사이드바 그룹·항목 정의 블록 | v25와 동일해야 함 | **바이트 단위 동일** (`var groups=[...]` 블록 diff 0) |
| 소셜 텍스트 변형 | 6 | 6 |
| 영상 출력 | 3 | 3 |
| OSMU 플랫폼 실행 표 | 8 | 8 |
| 고객 Settings 탭 | 8 | 8 |
| 운영자 콘솔 탭 | 10 | 10 |
| Studio 인벤토리 | 미리보기 7 · 직접 발행 4 · 텍스트 어댑터 8 · 영상 3 | 변경 없음 |

신규로 더한 것은 화면 안의 블록 2개(D6 취향, D8 출력 플랫폼)뿐이고, 둘 다 새 라우트를 만들지 않고 기존 제작 흐름(`/studio`) 안에 산다.

## 3. 흐름 단계 (11단계)

| 단계 | 이름 | 화면 수 | 이 단계가 답하는 질문 |
|---|---|---|---|
| 1 | 진입 | 3 | 어떻게 들어오고, 실패하면 무엇이 남는가 |
| 2 | 온보딩·취향 | 4 | 무엇을 만들 사람인지 제품이 어떻게 아는가 |
| 3 | 제작 시작 | 4 | 빈 화면 대신 무엇이 먼저 놓이는가 (D7·D1) |
| 4 | 후보·선택 | 4 | 세 방향 중 어떤 것에 돈을 쓰는가 (D5) |
| 5 | 편집 | 3 | 어디까지 공짜고 어디부터 과금인가 |
| 6 | 출력 플랫폼 | 2 | 만든 것을 어디로 내보내는가 (D8) |
| 7 | 승인·발행 | 5 | 사람이 승인한 것과 실제 나갈 것이 같은가 |
| 8 | 성과·학습 | 4 | 무엇이 측정됐고 무엇을 배웠는가 (D6) |
| 9 | 자산 | 5 | 만든 것들이 어디에 쌓이는가 |
| 10 | 설정 | 3 | 무엇을 내가 바꾸고 무엇을 못 바꾸는가 |
| 11 | 운영자 | 5 | 운영자가 볼 수 있는 것과 대신 할 수 없는 것 |

## 3.5 제작 마법사 5단계 (v26.1 신규, 결함 4 수선)

`/studio`는 한 화면에서 전부 고르는 구조를 버리고 다섯 단계로 나눈다. 흐름 색인 11단계는 문서의 목차이고, 이 5단계는 **고객이 실제로 넘기며 만드는 순서**다. 플랫폼 선택은 회장 결정 D8(작업은 하나, 플랫폼은 출구)대로 마지막 단계다.

| 단계 | 화면 제목 | 이 단계에서 고르는 것 | 대응 화면 색인 | 렌더 블록 |
|---|---|---|---|---|
| 1 | 누구에게 보여줄 글인지 먼저 고릅니다 | 타깃 시장, 출력 언어 (D1) | 09 | `marketPicker()` |
| 2 | 무엇을 만들지 정합니다 | 추천 수용 여부, 질문 3개, 요청 조립 근거 (D7) | 08 · 10 · 11 | `recommendationCard()` + `assemblyPanel()` |
| 3 | 세 방향 중 하나를 고릅니다 | 저해상도 후보 3개 중 1개 (D5) | 12 · 13 · 14 · 15 | `candidatePanel()` |
| 4 | 문구와 화면을 다듬습니다 | 채널별 문구, 카드뉴스, 영상 | 16 · 17 · 18 | 텍스트·사진·영상 3묶음 + 편집 과금 경계 |
| 5 | 다 만든 이 작업을 어디로 낼지 고릅니다 | 출력 플랫폼 8곳 (D8) | 19 · 20 | `outletPanel()` + 예약 바 |

각 단계 화면에 공통으로 있는 것 (하나라도 빠지면 결함):

1. **진행 표시**: "OSMU 제작 · 5단계 중 N단계" 문구 + 단계 알약 5개. 지난 단계에는 완료 표시(✓). 좁은 폭(390)에서도 다섯 개가 줄바꿈으로 전부 보인다(가로 스크롤 숨김 금지).
2. **이전으로 돌아가기**: 하단 좌측 "← 이전 단계 · (단계 이름)". 1단계에서는 "여기가 첫 단계입니다"로 비활성.
3. **지금까지 고른 값 요약**: 타깃 시장 · 출력 언어 · 만들 것 · 고른 후보 · 편집 중 · 내보낼 곳을 단계가 진행될수록 누적 표기. 마지막 칸은 "이전으로 가도 고른 값은 그대로"로 손실 우려를 먼저 막는다.
4. **다음 단계 버튼**: 다음 단계 이름을 함께 적는다("다음 단계 · 후보 선택 →"). 5단계에서는 "승인 인박스로 보내기"로 바뀐다.

심리 근거: Hick의 법칙(한 화면 한 결정) · Zeigarnik(남은 단계 가시화) · Nielsen 가시성과 사용자 자유(진행 표시와 되돌리기) · 손실회피(뒤로 가도 값이 남는다고 먼저 말함).
벤치마크: Runway Gen-4의 초안·마스터 2단 흐름(고른 하나만 고해상도), Publer의 채널 일괄 선택(단, 우리는 그 선택을 제작 뒤로 옮김).
학습된 취향(D6)은 제작 단계 안에 섞지 않고 별도 화면(색인 27·28)으로 언제든 연다.

## 4. 화면 목록 (42개)

> 뷰포트 열은 **권장 폭**이다(v26.1). 화면을 넘겨도 프레임 폭은 사람이 상단 토글에서 고른 값을 유지하며, 이 값으로 자동 전환하지 않는다.

| # | 흐름 단계 | 화면 | 실구현 경로 | 권장 뷰포트 | 유저 타입 | 데이터 상태 |
|---|---|---|---|---|---|---|
| 01 | 1 진입 | 로그인 (Google 하나) | `dashboard/src/app/login/page.tsx` | 390 | 비로그인 | 정상 |
| 02 | 1 진입 | 로그인 취소·연결 오류 | `dashboard/src/app/login/page.tsx · api/auth` | 390 | 비로그인 | 오류 |
| 03 | 1 진입 | 첫 로그인 · 빈 성과 | `dashboard/src/app/page.tsx` | 1024 | 신규 가입자 | 정상 |
| 04 | 2 온보딩·취향 | 작업 요청 정의 | `dashboard/src/app/studio/page.tsx · BrandSetupWizard` | 390 | 신규 가입자 | 정상 |
| 05 | 2 온보딩·취향 | 브랜드 자료 연결 (5경로) | `dashboard/src/components/studio/RepoConnect.tsx` | 1024 | 신규 가입자 | 정상 |
| 06 | 2 온보딩·취향 | 브랜드 기준 확정 (금지선) | `dashboard/src/components/shared/BrandSetupWizard.tsx` | 1024 | 신규 가입자 | 정상 |
| 07 | 2 온보딩·취향 | 채널 연결 (사유의 주인 3분류) | `dashboard/src/app/settings/page.tsx · lib/oauth-app-credentials.ts` | 1024 | 신규 가입자 | 정상 |
| 08 | 3 제작 시작 | 시작 추천 카드 (결정 D7) | `dashboard/src/app/studio/page.tsx` | 1024 | 활성 고객 | 정상 |
| 09 | 3 제작 시작 | 타깃 시장·출력 언어 (결정 D1) | `dashboard/src/app/studio/page.tsx` | 1024 | 활성 고객 | 정상 |
| 10 | 3 제작 시작 | 질문 3개 (건너뛰기 상시) | `dashboard/src/app/studio/page.tsx` | 390 | 활성 고객 | 정상 |
| 11 | 3 제작 시작 | 요청 조립 네 층 (해자) | `dashboard/src/app/api/studio · lib/analytics/events.ts` | 1024 | 활성 고객 | 정상 |
| 12 | 4 후보·선택 | 후보 없음 (empty) | `dashboard/src/app/studio/page.tsx` | 390 | 활성 고객 | 내용 없음 |
| 13 | 4 후보·선택 | 후보 생성 중 (loading) | `dashboard/src/app/studio/page.tsx` | 390 | 활성 고객 | 불러오는 중 |
| 14 | 4 후보·선택 | 저해상도 후보 3개 중 선택 (결정 D5) | `dashboard/src/app/studio/page.tsx · api/generate` | 1024 | 활성 고객 | 정상 |
| 15 | 4 후보·선택 | 후보 생성 실패 (금지선 차단) | `dashboard/src/app/studio/page.tsx` | 390 | 활성 고객 | 오류 |
| 16 | 5 편집 | 텍스트 · 채널별 문구 (6종) | `dashboard/src/components/studio/PlatformPreview.tsx` | 1024 | 활성 고객 | 정상 |
| 17 | 5 편집 | 사진·카드뉴스 (권리·대체 텍스트) | `dashboard/src/components/channel/InstagramPage.tsx` | 390 | 활성 고객 | 정상 |
| 18 | 5 편집 | 짧은 영상 · 편집 과금 경계 | `dashboard/src/app/videos/page.tsx` | 390 | 활성 고객 | 정상 |
| 19 | 6 출력 플랫폼 | 이 작업을 어디로 낼지 (결정 D8) | `dashboard/src/lib/constants.ts · SCHEDULABLE_PLATFORMS` | 1024 | 활성 고객 | 정상 |
| 20 | 6 출력 플랫폼 | 플랫폼 8개 과다 · 좁은 폭 | `dashboard/src/lib/constants.ts` | 390 | 활성 고객 | 정상 |
| 21 | 7 승인·발행 | 승인 인박스 (승인 후 변경 감지) | `dashboard/src/app/inbox/page.tsx` | 1024 | 활성 고객 | 정상 |
| 22 | 7 승인·발행 | 발행 캘린더 (시간대 병기) | `dashboard/src/app/calendar/page.tsx` | 1024 | 활성 고객 | 정상 |
| 23 | 7 승인·발행 | 채널 상세 · 게시 준비 8단계 | `dashboard/src/components/channel/ChannelPage.tsx` | 1024 | 활성 고객 | 정상 |
| 24 | 7 승인·발행 | 미연결 채널 · 게시 전 차단 | `dashboard/src/components/channel/ChannelPage.tsx` | 390 | 활성 고객 | 권한 필요 |
| 25 | 7 승인·발행 | 메시징 전달 (기본 꺼짐) | `dashboard/src/components/channel/ChannelPage.tsx` | 1024 | 활성 고객 | 정상 |
| 26 | 8 성과·학습 | 성과 홈 (측정 가능한 게시) | `dashboard/src/app/page.tsx` | 1440 | 활성 고객 | 정상 |
| 27 | 8 성과·학습 | 채널 고유 결과 (정의 변경 표기) | `dashboard/src/app/blog-performance/page.tsx` | 1024 | 활성 고객 | 일부 완료 |
| 28 | 8 성과·학습 | 학습된 취향 열람·수정 (결정 D6) | `dashboard/src/app/settings/page.tsx · store/ui-store.ts` | 1024 | 활성 고객 | 정상 |
| 29 | 8 성과·학습 | 학습 전 취향 (empty) | `dashboard/src/store/ui-store.ts` | 390 | 신규 가입자 | 내용 없음 |
| 30 | 9 자산 | Images (권리·자르기·대체 텍스트) | `dashboard/src/app/images/page.tsx` | 1024 | 활성 고객 | 정상 |
| 31 | 9 자산 | Videos · 복구 가능한 24상태 | `dashboard/src/app/videos/page.tsx` | 1024 | 활성 고객 | 결과 확인 중 |
| 32 | 9 자산 | Midjourney 사용 불가 (정직한 차단) | `dashboard/src/app/channels/[channel]/page.tsx` | 390 | 활성 고객 | 권한 필요 |
| 33 | 9 자산 | Blog · 네이버 반자동 | `dashboard/src/app/blog/page.tsx` | 1024 | 활성 고객 | 정상 |
| 34 | 9 자산 | Keyword Planner (출처·기간 표기) | `dashboard/src/app/keyword-planner/page.tsx` | 1024 | 활성 고객 | 일부 완료 |
| 35 | 10 설정 | Settings · Channels (고객 8탭) | `dashboard/src/app/settings/page.tsx` | 1024 | 활성 고객 | 정상 |
| 36 | 10 설정 | Settings · AI Engine | `dashboard/src/app/settings/page.tsx` | 1024 | 활성 고객 | 정상 |
| 37 | 10 설정 | Settings · Notifications | `dashboard/src/app/settings/page.tsx` | 390 | 활성 고객 | 정상 |
| 38 | 11 운영자 | 운영 콘솔 · 상태 | `dashboard/src/app/operator/page.tsx` | 1440 | 운영자 | 정상 |
| 39 | 11 운영자 | 고객과 작업 공간 | `dashboard/src/app/operator/customers/page.tsx` | 1440 | 운영자 | 정상 |
| 40 | 11 운영자 | 한도와 정책 (공유 쿼터) | `dashboard/src/lib/constants.ts · channel-status` | 1440 | 운영자 | 정상 |
| 41 | 11 운영자 | 안전한 기록 복구 | `dashboard/src/app/operator/page.tsx` | 1440 | 운영자 | 기록 복구 |
| 42 | 11 운영자 | 보안 기록 (감사) | `dashboard/src/app/operator/page.tsx` | 1440 | 운영자 | 정상 |

## 5. 상태 축 정의

프로토타입 상단에서 세 축을 독립적으로 바꾼다. 위 표의 값은 각 화면의 **기본 조건**이지 유일한 조건이 아니다.

- **뷰포트 4종:** 390(모바일) · 768(태블릿) · 1024(데스크톱) · 1440(와이드)
- **유저 타입 4종:** 비로그인 · 신규 가입자(연결 0, 게시 0) · 활성 고객(연결 있음, 게시 있음) · 운영자
- **데이터 상태 8종:** 정상 · 내용 없음 · 불러오는 중 · 오류 · 일부 완료 · 권한 필요 · 결과 확인 중 · 기록 복구

## 6. 화면별 정의

### 01. 로그인 (Google 하나)

- 흐름 단계: 1 진입
- 실구현 경로: `dashboard/src/app/login/page.tsx`
- 기본 조건: 뷰포트 390 / 비로그인 / 정상
- 화면 정의: 가입 폼을 따로 만들지 않습니다. /signup은 /login으로 보내고 진입은 Google 하나뿐입니다. 계정 종류를 늘리면 복구 경로도 그만큼 늘어나서 1인 운영이 감당하지 못합니다.
- 심리 근거: Hick의 법칙 = 진입 선택지 1개 · Jakob의 법칙 = 소셜 로그인 관습 그대로 · 신뢰 설계 = 비밀번호를 받지 않는다고 먼저 말함
- 벤치마크: Buffer는 소셜 로그인 단일 진입으로 첫 화면 이탈을 줄인다 (socialrails.com/blog/buffer-review). 우리는 여기서 계정 선택 화면을 제품 안에 위조하지 않는 점이 다르다.

### 02. 로그인 취소·연결 오류

- 흐름 단계: 1 진입
- 실구현 경로: `dashboard/src/app/login/page.tsx · api/auth`
- 기본 조건: 뷰포트 390 / 비로그인 / 오류
- 화면 정의: 취소와 오류를 다른 문장으로 나눕니다. 둘 다 "계정과 작업 공간에는 변화가 없습니다"를 먼저 말해 사용자가 무엇을 잃었는지 추측하지 않게 합니다.
- 심리 근거: Nielsen 오류 복구 = 원인 + 다음 행동 · 손실회피 완화 = 잃은 것이 없음을 명시
- 벤치마크: Stripe 대시보드는 실패 상태에서 원인과 재시도를 같은 카드에 둔다. 우리는 여기에 "무엇이 보존됐는지"를 한 줄 더 붙였다.

### 03. 첫 로그인 · 빈 성과

- 흐름 단계: 1 진입
- 실구현 경로: `dashboard/src/app/page.tsx`
- 기본 조건: 뷰포트 1024 / 신규 가입자 / 정상
- 화면 정의: 가입 직후에 게시 18건을 보여주면 그 화면 전체가 거짓말이 됩니다. 없는 숫자를 만들어 채우지 않고, 여기에 무엇이 생기는지와 지금 하실 일 하나만 둡니다.
- 심리 근거: 빈 상태 = 방치가 아니라 첫 행동 화면 · Fogg B=MAP 유발 = 지금 하실 일 하나 · Zeigarnik = 시작 체크리스트 진행 표기
- 벤치마크: ChatGPT 메모리 화면은 비어 있을 때 "아직 없음"을 그대로 보여준다 (ai-toolbox.co/chatgpt-management-and-productivity/how-to-manage-chatgpt-memory-2026). 우리도 0을 지어내지 않는다.

### 04. 작업 요청 정의

- 흐름 단계: 2 온보딩·취향
- 실구현 경로: `dashboard/src/app/studio/page.tsx · BrandSetupWizard`
- 기본 조건: 뷰포트 390 / 신규 가입자 / 정상
- 화면 정의: 원하는 결과, 확인 담당자, 완료 기준을 먼저 받습니다. 이 셋이 없으면 나중에 결과물을 보고도 잘 된 건지 판정할 근거가 없습니다.
- 심리 근거: 실행의도 = 목표와 완료 기준을 문장으로 · 의도된 마찰 = 짧지만 건너뛰지 않는 3칸
- 벤치마크: Linear의 이슈 생성은 필수 필드를 3개로 묶어 밀도를 지킨다 (adminlte.io/blog/saas-dashboard-design-examples). 우리는 그 3개를 마케팅 용어로 바꿔 넣었다.

### 05. 브랜드 자료 연결 (5경로)

- 흐름 단계: 2 온보딩·취향
- 실구현 경로: `dashboard/src/components/studio/RepoConnect.tsx`
- 기본 조건: 뷰포트 1024 / 신규 가입자 / 정상
- 화면 정의: 자료가 있는 사람과 없는 사람을 같은 화면에서 받습니다. GitHub 폴더, 파일 묶음, 6문항, 직접 붙여넣기, 제품 안에서 새로 쓰기까지 다섯 경로이고 가져올 범위를 먼저 확인시킵니다.
- 심리 근거: 통제감 = 가져올 범위를 먼저 보여줌 · Hick 완화 = 다섯 경로를 카드로 시각 분리 · 백지 공포 제거 = 자료 없어도 6문항으로 진입
- 벤치마크: Runway는 소재를 넣기 전에 무엇이 쓰이는지 먼저 보여준다 (help.runwayml.com/hc/en-us/articles/37053594806419). 우리는 범위 확인을 저장 전 단계로 끌어올렸다.

### 06. 브랜드 기준 확정 (금지선)

- 흐름 단계: 2 온보딩·취향
- 실구현 경로: `dashboard/src/components/shared/BrandSetupWizard.tsx`
- 기본 조건: 뷰포트 1024 / 신규 가입자 / 정상
- 화면 정의: 약속과 피할 표현을 같은 화면에 둡니다. 성과를 보장하는 근거를 못 찾으면 약속을 좁혔다고 그 자리에서 말합니다. 이 금지선이 뒤에서 후보 생성을 중단시키는 근거가 됩니다.
- 심리 근거: 신뢰는 설계·평가된다 = 근거 없는 주장을 제품이 먼저 깎음 · 다크패턴 회피 = 과장·긴급성 금지를 기준에 박음
- 벤치마크: Buffer의 AI 톤 조정은 브랜드 보이스를 저장해 재사용한다 (socialrails.com/blog/buffer-review). 우리는 "쓸 것"뿐 아니라 "쓰지 않을 것"을 같은 무게로 저장한다.

### 07. 채널 연결 (사유의 주인 3분류)

- 흐름 단계: 2 온보딩·취향
- 실구현 경로: `dashboard/src/app/settings/page.tsx · lib/oauth-app-credentials.ts`
- 기본 조건: 뷰포트 1024 / 신규 가입자 / 정상
- 화면 정의: 채널마다 왜 아직 안 되는지와 누가 해결하는지를 함께 적습니다. 미연결은 내가 할 일, 오픈 준비중은 우리가 할 일입니다. 이 구분이 없으면 사용자가 자기 잘못이라고 오해합니다.
- 심리 근거: 통제감 = 내가 풀 수 있는 것과 아닌 것을 분리 · 재촉 회피 = 우리가 할 일에는 붉은 색을 쓰지 않음 · Nielsen 가시성
- 벤치마크: Later는 채널 연결 상태를 계정 단위로 보여준다 (help.later.com/hc/en-us/articles/360043244733). 우리는 상태 옆에 담당자를 붙인 점이 다르다.

### 08. 시작 추천 카드 (결정 D7)

- 흐름 단계: 3 제작 시작
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 빈 화면에서 시작하지 않습니다. 무엇을 만들지 추천이 먼저 놓이고 근거는 세 가지입니다. 지난 콘텐츠의 성과, 이전 후보 선택 이력, 현재 트렌드. 매번 밀어붙이지 않고 가끔 제안하는 강도로 둡니다.
- 심리 근거: Fogg B=MAP = 유발(추천 카드)이 동기·능력과 함께 있음 · 백지 공포 제거 · Miller 7±2 = 추천 근거를 3줄로 제한
- 벤치마크: Buffer는 아이디어 제안을 작성 입구에 둔다 (socialrails.com/blog/buffer-review). 우리는 제안에 예상 비용과 소요 시간까지 붙여 그 자리에서 판단이 끝나게 했다.

### 09. 타깃 시장·출력 언어 (결정 D1)

- 흐름 단계: 3 제작 시작
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 고객면은 한국어 하나지만 출력 언어는 요청 파라미터입니다. 한국어와 English만 저희가 직접 읽고 판정하며, 그 밖의 언어는 생성은 되지만 원어민 검수를 하지 않는다고 고르는 순간 말합니다.
- 심리 근거: 의도된 마찰 = 품질 보증 범위를 클레임 전에 밝힘 · 기본값 설계 = 한국·한국어가 기본이라 아무것도 안 고쳐도 진행 · Jakob = 시장·언어 2축
- 벤치마크: Shopify Markets의 시장·언어 2축 배치를 구조만 빌렸다. 우리는 언어마다 품질 보증 여부를 다르게 표기하는 점을 더했다.

### 10. 질문 3개 (건너뛰기 상시)

- 흐름 단계: 3 제작 시작
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 정상
- 화면 정의: 먼저 제안하고 필요할 때만 묻습니다. 질문은 3개가 상한이고 건너뛰기는 항상 열려 있습니다. 답한 것은 목록으로 남아 무엇 때문에 결과가 그렇게 나왔는지 되짚을 수 있습니다.
- 심리 근거: Fogg 능력 = 질문 3개 상한 · Zeigarnik = 질문 1 / 3 진행 표기 · Miller = 선택지 3개 이하
- 벤치마크: ChatGPT는 사용자가 준 정보를 목록으로 되보여준다 (aimemlink.com/blog/manage-chatgpt-memory). 우리는 답변마다 "답함" 상태를 붙여 되짚기를 쉽게 했다.

### 11. 요청 조립 네 층 (해자)

- 흐름 단계: 3 제작 시작
- 실구현 경로: `dashboard/src/app/api/studio · lib/analytics/events.ts`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 타깃 시장, 마케팅 공통 지식, 개인 취향, 브랜드 제약. 네 층은 수명과 소유자가 달라 섞어서 저장하지 않습니다. 어느 층을 고치면 결과가 달라지는지 여기서 볼 수 있습니다.
- 심리 근거: 신뢰는 설계된다 = 결과의 출처를 층으로 분해 · 통제감 = 고칠 지점을 지목 가능 · Nielsen 가시성
- 벤치마크: Stripe는 계산 결과 옆에 그 값을 만든 항목을 펼친다 (adminlte.io/blog/fintech-dashboard-design-examples). 우리는 그 방식을 프롬프트 조립에 적용했다.

### 12. 후보 없음 (empty)

- 흐름 단계: 4 후보·선택
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 내용 없음
- 화면 정의: 빈 화면을 방치하지 않고 첫 행동을 시킵니다. 저해상도라 몇 분이면 된다는 시간 감각까지 같이 줍니다.
- 심리 근거: 빈 상태 = 첫 행동 유도 · 기대 관리 = 소요 시간 명시
- 벤치마크: Runway는 생성 전 화면에서 예상 크레딧과 시간을 함께 보여준다 (versely.studio/blog/runway-gen-4-pricing-vs-alternatives-2026).

### 13. 후보 생성 중 (loading)

- 흐름 단계: 4 후보·선택
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 불러오는 중
- 화면 정의: 보통 4분에서 7분입니다. 화면을 닫아도 계속 만들어지고 끝나면 알림이 온다고 미리 말합니다. 기다리는 동안 문구를 다듬을 수 있게 다른 일을 함께 엽니다.
- 심리 근거: 기대 관리(Nielsen) = 소요와 이탈 가능 여부 명시 · 대기 비용 절감 = 대기 중 다른 작업 제공
- 벤치마크: Runway는 draft 티어로 먼저 돌리고 최종만 고비용 렌더로 올린다 (help.runwayml.com/hc/en-us/articles/37327109429011). 우리 후보 3개가 그 draft 티어에 해당한다.

### 14. 저해상도 후보 3개 중 선택 (결정 D5)

- 흐름 단계: 4 후보·선택
- 실구현 경로: `dashboard/src/app/studio/page.tsx · api/generate`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 먼저 저해상도로 세 방향을 보여주고 고른 하나만 고해상도로 만듭니다. 나머지 둘을 나중에 고해상도로 올리면 그때 추가 과금이라는 사실을 고르기 전에 말합니다.
- 심리 근거: Hick = 선택지 3개 고정 · 손실회피 = 뒤늦은 추가 과금을 선택 전에 공개 · 기본값 설계 = 추천 후보 B 선택 상태
- 벤치마크: Runway Gen-4는 1080p로 반복하고 히어로 컷만 4K로 올리며 4K는 비용이 두 배다 (versely.studio/blog/runway-gen-4-pricing-vs-alternatives-2026). 우리는 그 비용 구조를 화면 문구로 꺼냈다.

### 15. 후보 생성 실패 (금지선 차단)

- 흐름 단계: 4 후보·선택
- 실구현 경로: `dashboard/src/app/studio/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 오류
- 화면 정의: 브랜드 자료에서 금지한 표현이 대본에 남아 중단했고 크레딧은 쓰이지 않았다고 함께 말합니다. 고치러 가기와 그대로 다시 만들기를 둘 다 열어 막다른 길을 만들지 않습니다.
- 심리 근거: Nielsen 오류 = 원인 + 다음 행동 · 손실 불안 제거 = 크레딧 미차감 명시 · 통제감 = 예외 진행 경로 유지
- 벤치마크: Stripe는 실패 응답에 원인 코드와 재시도 경로를 함께 준다. 우리는 "돈이 나갔는지"를 가장 먼저 답하도록 순서를 바꿨다.

### 16. 텍스트 · 채널별 문구 (6종)

- 흐름 단계: 5 편집
- 실구현 경로: `dashboard/src/components/studio/PlatformPreview.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 공통 초안 하나에서 채널별 문구가 갈라집니다. 상속된 부분과 채널별로 바꾼 부분을 따로 저장해서 나중에 무엇을 왜 바꿨는지 남습니다.
- 심리 근거: Jakob = 탭형 변형 편집 관습 · 통제감 = 부분 저장 · 인지 부하 감소 = 한 번에 한 채널
- 벤치마크: Buffer는 하나의 글을 플랫폼별로 다시 쓰게 한다 (socialrails.com/blog/buffer-review). Publer는 여기에 변형 자동화를 더한다 (authoredup.com/blog/publer-vs-buffer). 우리는 상속과 변경을 분리 저장하는 점이 다르다.

### 17. 사진·카드뉴스 (권리·대체 텍스트)

- 흐름 단계: 5 편집
- 실구현 경로: `dashboard/src/components/channel/InstagramPage.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 정상
- 화면 정의: 카드뉴스 5장에서 첫 장의 핵심 문구와 모든 이미지의 사용 권리를 게시 전에 확인합니다. 대체 텍스트가 빠진 장은 확인 상태로 남겨 그냥 넘어가지 못하게 합니다.
- 심리 근거: 의도된 마찰 = 권리 확인을 게시 앞에 배치 · Nielsen 오류 예방 · 접근성 = 대체 텍스트 누락 가시화
- 벤치마크: Later는 게시 전 미디어 규격을 검사한다 (help.later.com/hc/en-us/articles/29780709560343). 우리는 규격에 더해 권리 출처를 같은 줄에 넣었다.

### 18. 짧은 영상 · 편집 과금 경계

- 흐름 단계: 5 편집
- 실구현 경로: `dashboard/src/app/videos/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 정상
- 화면 정의: 자막 고치기와 컷 길이 조정은 추가 크레딧이 없고, 나레이션 목소리 변경과 소재 교체는 새로 만들어야 해서 과금됩니다. 이 경계를 편집 화면 안에 두어 나중에 청구서로 만나지 않게 합니다.
- 심리 근거: 손실회피 = 과금 편집을 누르기 전에 표시 · 통제감 = 무료 편집 범위를 먼저 제시 · 다크패턴 회피
- 벤치마크: Runway는 재생성마다 크레딧을 차감한다 (aitoolsdevpro.com/ai-tools/runway-guide). 우리는 차감되는 편집과 아닌 편집을 화면에서 갈라 두었다.

### 19. 이 작업을 어디로 낼지 (결정 D8)

- 흐름 단계: 6 출력 플랫폼
- 실구현 경로: `dashboard/src/lib/constants.ts · SCHEDULABLE_PLATFORMS`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 플랫폼 선택이 제작의 입구가 아니라 출구입니다. 하나의 작업을 만들고 그 작업을 어느 플랫폼으로 낼지만 고릅니다. 준비되지 않은 곳도 골라 둘 수 있지만 게시 직전에 막고 이유와 담당을 그때 다시 알려줍니다.
- 심리 근거: Hick = 만들기 전 8지선다 제거 · Nielsen 오류 예방 = 차단 사유와 담당 표기 · 기본값 설계 = 준비된 곳만 켜짐
- 벤치마크: Publer는 13개 채널을 한 화면에서 고르게 한다 (ampifire.com/blog/publer-vs-buffer-for-social-media-scheduling-features-pricing). 우리는 그 선택을 제작 뒤로 옮기고 각 줄에 차단 사유를 붙였다.

### 20. 플랫폼 8개 과다 · 좁은 폭

- 흐름 단계: 6 출력 플랫폼
- 실구현 경로: `dashboard/src/lib/constants.ts`
- 기본 조건: 뷰포트 390 / 활성 고객 / 정상
- 화면 정의: 390 폭에서 표가 터지지 않는지 보는 화면입니다. 표는 가로 스크롤로 감싸고 라벨은 줄바꿈으로 흡수합니다. 데이터가 많아도 레이아웃이 무너지지 않는 것이 이 화면의 합격선입니다.
- 심리 근거: Nielsen 미니멀 = 좁은 폭에서 열을 줄이지 않고 스크롤로 보존 · 인지 부하 = 스크롤 힌트 제공
- 벤치마크: Setproduct의 2026 데이터 테이블 가이드는 좁은 폭에서 열 삭제 대신 가로 스크롤을 권한다 (setproduct.com/blog/data-table-ui-design).

### 21. 승인 인박스 (승인 후 변경 감지)

- 흐름 단계: 7 승인·발행
- 실구현 경로: `dashboard/src/app/inbox/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 승인 후 내용이나 예약 시간이 바뀌면 다시 확인이 필요하다고 표시합니다. 사람이 승인한 것과 실제로 나갈 것이 다른 상황을 만들지 않는 것이 이 화면의 목적입니다.
- 심리 근거: 신뢰는 설계된다 = 승인 이후 변경을 숨기지 않음 · Nielsen 가시성 · 의도된 마찰
- 벤치마크: Later의 승인 흐름은 검토자와 게시자를 분리한다 (help.later.com/hc/en-us/articles/360043244733). 우리는 승인 후 변경 재확인을 추가했다.

### 22. 발행 캘린더 (시간대 병기)

- 흐름 단계: 7 승인·발행
- 실구현 경로: `dashboard/src/app/calendar/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 작업 공간 시간과 내 시간을 같이 적습니다. 예약이 취소되면 초안으로 남는다는 사실을 그 자리에 남겨 사라진 것처럼 보이지 않게 합니다.
- 심리 근거: Nielsen 가시성 = 두 시간대 병기 · 손실회피 = 취소 시 초안 보존 명시
- 벤치마크: Publer의 시각 캘린더는 채널별 색으로 구분한다 (ampifire.com/blog/publer-vs-buffer-for-social-media-scheduling-features-pricing). 우리는 색 대신 상태 문구를 썼다. 색만으로는 승인 여부를 구별하지 못한다.

### 23. 채널 상세 · 게시 준비 8단계

- 흐름 단계: 7 승인·발행
- 실구현 경로: `dashboard/src/components/channel/ChannelPage.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 코드가 준비된 것, 운영자가 앱을 설정한 것, 고객이 연결한 것, 실제 게시가 확인된 것을 분리합니다. 이 넷을 하나로 뭉치면 "연결됨"이 거짓말이 됩니다.
- 심리 근거: 신뢰는 설계·평가된다 = 준비 단계를 사다리로 노출 · Nielsen 가시성 · 권위 회피 = 확인 안 된 것을 준비됨으로 쓰지 않음
- 벤치마크: Metricool은 네트워크별 API 제약을 표로 공개한다 (help.metricool.com/api-limitations-per-social-network-n7zlr). 우리는 그 제약을 채널 화면 안으로 옮겼다.

### 24. 미연결 채널 · 게시 전 차단

- 흐름 단계: 7 승인·발행
- 실구현 경로: `dashboard/src/components/channel/ChannelPage.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 권한 필요
- 화면 정의: 막힌 이유와 누가 푸는지를 같이 적고 작성한 초안이 보존된다는 사실을 먼저 말합니다. 막다른 화면을 만들지 않습니다.
- 심리 근거: 손실회피 = 초안 보존 명시 · Nielsen 복구 · 통제감 = 담당 표기
- 벤치마크: YouTube는 심사 전 계정의 게시 범위를 제한한다 (developers.google.com/youtube/v3/guides/quota_and_compliance_audits). 우리는 그 제한을 게시 버튼 앞에서 설명한다.

### 25. 메시징 전달 (기본 꺼짐)

- 흐름 단계: 7 승인·발행
- 실구현 경로: `dashboard/src/components/channel/ChannelPage.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: Telegram, Discord, Slack은 게시 대상이 아니라 전달 대상이라 기본으로 꺼져 있습니다. 켜면 받을 공간과 문구를 다시 확인합니다.
- 심리 근거: 기본값 설계 = 위험한 자동 전달을 꺼짐으로 · 다크패턴 회피 = 사전 체크된 동의 없음
- 벤치마크: Buffer는 채널마다 게시 권한을 따로 요구한다 (socialrails.com/blog/buffer-review). 우리는 전달과 게시를 아예 다른 개념으로 갈랐다.

### 26. 성과 홈 (측정 가능한 게시)

- 흐름 단계: 8 성과·학습
- 실구현 경로: `dashboard/src/app/page.tsx`
- 기본 조건: 뷰포트 1440 / 활성 고객 / 정상
- 화면 정의: 게시 18건과 측정 가능한 14건을 다른 숫자로 둡니다. 권한이 없어 수집 못 한 값을 0으로 표시하지 않고, 게시 4건 이하 채널은 평균을 계산하지 않고 보류로 둡니다.
- 심리 근거: 신뢰는 설계·평가된다 = 없는 값을 0으로 세지 않음 · 데이터 위계 = 총량과 측정 가능량 분리
- 벤치마크: Stripe 대시보드는 차트를 요약으로, 표를 진실로 다룬다 (adminlte.io/blog/fintech-dashboard-design-examples). 우리는 그 원칙 위에 "표본이 적으면 평균을 내지 않는다"를 더했다.

### 27. 채널 고유 결과 (정의 변경 표기)

- 흐름 단계: 8 성과·학습
- 실구현 경로: `dashboard/src/app/blog-performance/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 일부 완료
- 화면 정의: Instagram 저장과 YouTube 평균 시청은 제공자마다 정의가 달라 하나로 합치지 않습니다. 정의가 바뀐 지점 전후는 하나의 추세로 잇지 않습니다.
- 심리 근거: 신뢰 설계 = 지표 정의 출처 표기 · Nielsen 일치 = 제공자 용어 그대로
- 벤치마크: Metricool은 네트워크마다 수집 가능한 지표가 다르다고 명시한다 (help.metricool.com/api-limitations-per-social-network-n7zlr).

### 28. 학습된 취향 열람·수정 (결정 D6)

- 흐름 단계: 8 성과·학습
- 실구현 경로: `dashboard/src/app/settings/page.tsx · store/ui-store.ts`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 배운 내용을 사람이 읽는 문장으로 보여주고 각 항목이 어느 선택에서 나왔는지 근거를 답니다. 항목마다 고치기와 지우기가 있고 언어별로 나눠서 보입니다. 배운 것을 못 보여주면 "당신 취향을 배운다"는 주장을 증명할 수 없습니다.
- 심리 근거: 신뢰는 설계·평가된다 = 학습 근거 노출 · 통제감·Nielsen 자유 = 항목별 삭제 · 손실회피 완화 = 지워도 결과물은 남는다고 먼저 말함
- 벤치마크: ChatGPT 메모리는 저장된 항목을 전부 나열하고 개별 삭제를 준다 (aimemlink.com/blog/manage-chatgpt-memory). 2026년 조사에서 저장 항목의 96%가 사용자 지시 없이 만들어졌다는 점 때문에 우리는 항목마다 출처를 함께 적었다 (ai-toolbox.co/chatgpt-management-and-productivity/how-to-manage-chatgpt-memory-2026).

### 29. 학습 전 취향 (empty)

- 흐름 단계: 8 성과·학습
- 실구현 경로: `dashboard/src/store/ui-store.ts`
- 기본 조건: 뷰포트 390 / 신규 가입자 / 내용 없음
- 화면 정의: 배운 것이 없을 때 그럴듯한 문장을 지어내지 않습니다. 비어 있는 것이 정상이라고 말하고 첫 후보 만들기로 보냅니다.
- 심리 근거: 빈 상태 = 첫 행동 유도 · 신뢰 설계 = 없는 학습을 만들지 않음
- 벤치마크: ChatGPT 메모리도 비활성 상태를 그대로 보여준다 (gptprompts.ai/chatgpt-memory-guide).

### 30. Images (권리·자르기·대체 텍스트)

- 흐름 단계: 9 자산
- 실구현 경로: `dashboard/src/app/images/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 이미지마다 사용 권리와 대체 텍스트 상태를 함께 관리합니다. 게시 화면에서 급하게 확인하지 않도록 자산 단계에서 미리 닫습니다.
- 심리 근거: Nielsen 오류 예방 = 앞 단계에서 결함 차단 · 접근성
- 벤치마크: Later의 미디어 라이브러리 구조를 빌리되 권리 상태 열을 추가했다 (help.later.com/hc/en-us/articles/29780709560343).

### 31. Videos · 복구 가능한 24상태

- 흐름 단계: 9 자산
- 실구현 경로: `dashboard/src/app/videos/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 결과 확인 중
- 화면 정의: 렌더링, 업로드, 결과 확인, 기한 만료와 복구를 영상 작업 단위로 봅니다. 결과 확인 중에는 다시 게시하지 않고, 외부 성공 뒤 기록만 실패했다면 기록만 복구합니다.
- 심리 근거: Nielsen 복구 = 상태별 복구 경로 · 손실회피 = 중복 게시 방지 · 신뢰 설계
- 벤치마크: Runway는 렌더 작업을 큐로 관리하고 실패를 작업 단위로 되돌린다 (help.runwayml.com/hc/en-us/articles/46974685288467).

### 32. Midjourney 사용 불가 (정직한 차단)

- 흐름 단계: 9 자산
- 실구현 경로: `dashboard/src/app/channels/[channel]/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 권한 필요
- 화면 정의: 작동하지 않는 생성을 성공처럼 보이게 하지 않습니다. 대신 작업을 잃지 않고 Images로 넘어가는 길을 같은 화면에서 줍니다.
- 심리 근거: 신뢰는 설계된다 = 못 하는 것을 못 한다고 말함 · 막다른 길 0
- 벤치마크: Stripe는 사용 불가 기능을 회색 처리하지 않고 이유를 문장으로 준다 (adminlte.io/blog/fintech-dashboard-design-examples).

### 33. Blog · 네이버 반자동

- 흐름 단계: 9 자산
- 실구현 경로: `dashboard/src/app/blog/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 내보내기 형식은 새 메뉴나 자동 게시 연결을 뜻하지 않습니다. 네이버 블로그는 초안까지만 만들고 게시는 직접 하신다고 명시합니다.
- 심리 근거: 기대 관리 = 자동화 범위를 문장으로 제한 · 다크패턴 회피
- 벤치마크: Publer는 지원 채널 수를 크게 쓰지만 채널별 제약은 하위 문서에 둔다 (authoredup.com/blog/publer-vs-buffer). 우리는 제약을 같은 화면에 올렸다.

### 34. Keyword Planner (출처·기간 표기)

- 흐름 단계: 9 자산
- 실구현 경로: `dashboard/src/app/keyword-planner/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 일부 완료
- 화면 정의: 관심 흐름은 출처와 기간을 붙여 보여주고 결과를 보장하지 않는다고 적습니다. 일부만 수집된 항목은 일부 상태로 남깁니다.
- 심리 근거: 신뢰 설계 = 출처와 기간 병기 · 과장 금지
- 벤치마크: Google Trends 자체가 상대값이라는 점을 그대로 표기했다 (developers.google.com/youtube/v3/determine_quota_cost 계열 공식 문서 관행).

### 35. Settings · Channels (고객 8탭)

- 흐름 단계: 10 설정
- 실구현 경로: `dashboard/src/app/settings/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 고객 설정은 8탭입니다. Video/TTS는 테넌트 단위가 아니라 전역 설정이라 고객에게 의도적으로 숨깁니다.
- 심리 근거: Nielsen 일치 = 볼 수 없는 것은 안 보이게 · 역할 경계 명시
- 벤치마크: Linear는 개인 설정과 워크스페이스 설정을 아예 다른 트리로 나눈다 (adminlte.io/blog/saas-dashboard-design-examples).

### 36. Settings · AI Engine

- 흐름 단계: 10 설정
- 실구현 경로: `dashboard/src/app/settings/page.tsx`
- 기본 조건: 뷰포트 1024 / 활성 고객 / 정상
- 화면 정의: 공용 AI를 쓰는지 직접 키를 넣는지에 따라 실패 모습이 다릅니다. 그 차이를 설정 화면에서 미리 설명합니다.
- 심리 근거: 기대 관리 = 실패 형태를 미리 · 통제감
- 벤치마크: Stripe는 테스트 키와 운영 키의 결과 차이를 화면에서 구분한다 (adminlte.io/blog/fintech-dashboard-design-examples).

### 37. Settings · Notifications

- 흐름 단계: 10 설정
- 실구현 경로: `dashboard/src/app/settings/page.tsx`
- 기본 조건: 뷰포트 390 / 활성 고객 / 정상
- 화면 정의: 게시 결과 지연과 연결 만료처럼 사용자가 손대야 하는 일만 알림으로 둡니다. 알림을 성과 광고로 쓰지 않습니다.
- 심리 근거: 다크패턴 회피 = 재참여 유도 알림 배제 · Fogg 유발은 필요한 순간에만
- 벤치마크: Buffer의 알림은 게시 실패 중심이다 (socialrails.com/blog/buffer-review).

### 38. 운영 콘솔 · 상태

- 흐름 단계: 11 운영자
- 실구현 경로: `dashboard/src/app/operator/page.tsx`
- 기본 조건: 뷰포트 1440 / 운영자 / 정상
- 화면 정의: 현재 사실과 목표 상태를 분리합니다. 고객 화면과 게시 행동은 이 콘솔에서 숨겨집니다. 운영자는 고객 대신 작성·승인·게시하지 않습니다.
- 심리 근거: 역할 경계 = 권한을 화면 구조로 강제 · 신뢰 설계 = 대리 게시 불가 명시
- 벤치마크: Linear의 관리자 뷰는 조직 상태만 보여주고 사용자 행동을 대신하지 않는다 (adminlte.io/blog/saas-dashboard-design-examples).

### 39. 고객과 작업 공간

- 흐름 단계: 11 운영자
- 실구현 경로: `dashboard/src/app/operator/customers/page.tsx`
- 기본 조건: 뷰포트 1440 / 운영자 / 정상
- 화면 정의: 고객 목록과 연결 자격 증명을 다루되 고객의 access 값은 표시하지 않습니다. 확인이 필요하면 재인증과 사유를 남기고 30초만 엽니다.
- 심리 근거: 의도된 마찰 = 비밀값 확인에 재인증과 사유 · 감사 가능성
- 벤치마크: Stripe는 민감 값 확인에 재인증을 요구한다 (adminlte.io/blog/fintech-dashboard-design-examples).

### 40. 한도와 정책 (공유 쿼터)

- 흐름 단계: 11 운영자
- 실구현 경로: `dashboard/src/lib/constants.ts · channel-status`
- 기본 조건: 뷰포트 1440 / 운영자 / 정상
- 화면 정의: 앱 전체가 나눠 쓰는 채널은 회원이 늘면 먼저 터집니다. YouTube 쇼츠는 전 회원 공유 하루 100건 같은 실제 수치를 그대로 적습니다.
- 심리 근거: 운영 가시성 = 터질 지점을 미리 · 데이터 위계
- 벤치마크: YouTube 공식 쿼터 문서의 수치를 그대로 인용했다 (developers.google.com/youtube/v3/determine_quota_cost).

### 41. 안전한 기록 복구

- 흐름 단계: 11 운영자
- 실구현 경로: `dashboard/src/app/operator/page.tsx`
- 기본 조건: 뷰포트 1440 / 운영자 / 기록 복구
- 화면 정의: 외부 게시는 성공했는데 내부 기록만 누락된 경우입니다. 같은 콘텐츠를 다시 게시하지 않고 기록만 복구합니다.
- 심리 근거: 손실회피 = 중복 게시로 인한 신뢰 손실 차단 · Nielsen 복구
- 벤치마크: Metricool도 외부 성공과 내부 기록을 분리해 다룬다 (help.metricool.com/api-limitations-per-social-network-n7zlr).

### 42. 보안 기록 (감사)

- 흐름 단계: 11 운영자
- 실구현 경로: `dashboard/src/app/operator/page.tsx`
- 기본 조건: 뷰포트 1440 / 운영자 / 정상
- 화면 정의: 운영자 재인증, 30초 비밀값 확인, 계정 일시 정지, 공유 AI 승인, 지원 모드와 기록 복구의 담당자·사유·시간을 남깁니다.
- 심리 근거: 절차 공정성 = 조치 근거 기록 · 신뢰는 평가된다
- 벤치마크: Stripe의 감사 로그 구조를 빌렸다 (adminlte.io/blog/fintech-dashboard-design-examples).


## 7. 자가 검사 결과 (실렌더 측정)

| 항목 | 기준 | 실측 | 판정 |
|---|---|---|---|
| 콘솔 오류 | 0 | 0 | 통과 |
| 렌더 실패 화면 | 0 | 0 / 42 | 통과 |
| 가로 넘침 | 0 | 390·768·1024·1440 모두 0px | 통과 |
| 라벨 잘림 | 0 | 42화면 전수 순회 0건 | 통과 |
| 텍스트 대비 (WCAG AA 4.5:1) | 전 항목 통과 | 최저 7.05:1 | 통과 (2건 수정 후) |
| 터치 타깃 | 허브 컨트롤 32px 이상 | 미달 0건 | 통과 |
| 폰트 패밀리 (허브 크롬) | 3 이하 | 2 | 통과 |
| 엠대시 | 0 | 0 | 통과 |
| 보라 그라디언트 | 0 | 0 | 통과 |
| placeholder·로렘 | 0 | 0 | 통과 |
| 무의미 CTA("시작하기"·"더 알아보기") | 0 | 0 | 통과 |
| 한국어 줄바꿈 | `word-break: keep-all` | 적용됨 | 통과 |
| `prefers-reduced-motion` | 존중 | 적용됨 | 통과 |
| `focus-visible` | 전 컨트롤 | 적용됨 | 통과 |

## 8. SOURCES / MODEL / SKILLS

**기반(버전핀):**
- `docs/prototype/openclaw-auto-marketing-agent-fidelity-v25-gpt-codex.html` (화면 콘텐츠·CSS·렌더 함수 전량 승계)
- `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` (v25가 승계한 라우트·사이드바)
- `docs/prototype/v26-brief.md` (지시서)
- `docs/design-docs/user-flow-openclaw-service-v9.6-gpt-codex.md`
- `docs/제품구조-결정-2026-08-15.md` §9.6 §9.7 §9.8
- `wiki/product/marketing-hub-surface-map.md`
- `dashboard/src/app/**`, `dashboard/src/lib/constants.ts`, `dashboard/src/components/studio/PlatformPreview.tsx`
- `DESIGN.md` (컬러·타이포 토큰 상속, 신규 시스템 발명 0)
- `/Users/sj/.claude/standards/design.md`
- 형식 표준: `romeo-vnext-magazine-v13-opus.html`

**벤치마크(WebSearch 실조사 4회):**
- [ChatGPT 메모리 관리 2026](https://www.ai-toolbox.co/chatgpt-management-and-productivity/how-to-manage-chatgpt-memory-2026)
- [ChatGPT 메모리 열람·수정·삭제](https://aimemlink.com/blog/manage-chatgpt-memory)
- [Buffer 리뷰 2026](https://socialrails.com/blog/buffer-review)
- [Publer vs Buffer 스케줄링](https://ampifire.com/blog/publer-vs-buffer-for-social-media-scheduling-features-pricing)
- [Runway Gen-4 가격과 티어 2026](https://www.versely.studio/blog/runway-gen-4-pricing-vs-alternatives-2026)
- [Runway Gen-4 Video 공식](https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4-Video)
- [SaaS 대시보드 사례 2026 (Linear·Stripe·Vercel)](https://adminlte.io/blog/saas-dashboard-design-examples/)
- [데이터 테이블 UI 2026](https://www.setproduct.com/blog/data-table-ui-design)

**MODEL:** claude-opus-5[1m]

**SKILLS_USED:** design-html(허브 컨테이너 구조 설계에 적용), design-review(대비·터치타깃·슬롭·잘림 루브릭을 headless Chrome 실렌더에 적용, 등급 산출)

**SKILLS_SKIPPED:** design-shotgun(형식이 회장 지목 예시로 확정돼 발산 불요), design-consultation(DESIGN.md 토큰 상속이라 신규 시스템 제안 불요), diagram(흐름이 색인과 표로 닫혀 별도 다이어그램 불요)

**PRESENTATION_CHECK:** 툴콜·XML 태그 잔재 없음 · headless Chrome 실렌더 육안 확인함(390·1024·D6·D8) · 콘솔 오류 0 · 42화면 전수 렌더 확인

🏷 STAMP | line: marketing-agent-design | 생성: 2026-08-16 14:51 KST | model: claude-opus-5[1m] | agent: product-designer
skills: design-html, design-review | 근거: prototype v25 전량 승계 + 제품구조 §9.8 + dashboard/src 실구현 + WebSearch 4회
고민: 화면 목록을 손으로 옮겨 적으면 프로토타입과 어긋난다. 그래서 빌드된 HTML의 화면 레지스트리에서 직접 뽑아 이 문서를 생성했다. 문서와 프로토타입이 같은 원본을 본다.
