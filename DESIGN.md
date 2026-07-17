# DESIGN.md — 제품 대시보드 디자인 시스템 정본

> **이 파일의 목적**: 어떤 모델(Opus/Sonnet/Haiku/Codex)이 새 화면을 만들어도 **동일한 디자인**이 나오게 하는 단일 진실원(SSOT).
> 신규 창작 문서가 아니라 **이미 구현된 실물을 컴파일**한 정본이다. 여기 적힌 토큰·컴포넌트는 전부 코드에서 실제 확인한 것이다(추측 0).
>
> **판정 우선순위** (충돌 시 위가 이김): ① 이 DESIGN.md → ② `docs/ui-rules.md`(레이아웃·페이지 상세) → ③ `dashboard/CLAUDE.md`(코딩 규칙) → ④ `~/.claude/standards/design.md`(품질헌법) → ⑤ 모델 취향(최후).
>
> **실물 정본 위치**: 토큰=`dashboard/src/app/globals.css` · 레이아웃/화면 규칙=`docs/ui-rules.md` · 컴포넌트=`dashboard/src/components/**` · 코딩 규칙=`dashboard/CLAUDE.md`.
> 이 파일과 실물이 어긋나면 **실물(globals.css/components)이 진실**이다 — 이 파일을 실물에 맞춰 갱신하라(반대 금지).

---

## 0. 경계선 (무엇이 이 파일 소관이고 무엇이 아닌가)

| 구분 | 정본 | 소관 |
|---|---|---|
| **제품 UI**(대시보드 화면·컴포넌트·토큰) | **이 DESIGN.md** | 여기 |
| SNS 마케팅 비주얼(카드뉴스·릴스·썸네일 등 발행 에셋) | `wiki/marketing/design-system.md` | 별도 — 이 파일과 무관 |

- **이 파일은 제품 UI 정본이다.** 브랜드명(OSMU 등)·특정 서비스 URL·특정 고객 도메인을 넣지 않는다(공통 플랫폼 중립성 — `CLAUDE.md` 공통 레포 정책).
- 마케팅 에셋의 색·폰트는 제품 UI 토큰과 **다를 수 있고 그래도 된다**. 서로 참조하지 않는다.

---

## 1. 브랜드 형용사 3개 + 디자인 원칙

**기억시킬 한 가지(memorable thing)**: *"복잡한 SNS 자동화를, 사장님도 클릭 몇 번으로 — 믿고 맡기는 차분한 관제탑."*

도출 근거: `globals.css` 무드 주석("도박틱 퍼플→핑크 제거, 신뢰형 플랫 블루") + `docs/ui-rules.md` 서두("대상 사용자: 일반인·자영업자·비개발자, 개발자 용어 최소화") + 실제 신뢰 장치 컴포넌트(TenantIsolationBanner·ConsentBanner·FreeEventBanner)의 존재.

### 톤앵커 → 화면 발현 (1:1, 이 표를 못 채우면 그 화면은 톤 미달 = 재작업)

| 형용사 | 뜻 | 화면 요소로 어떻게 발현되나 (실물 근거) |
|---|---|---|
| **믿음직한** (Trustworthy) | 사장님이 자기 계정·데이터를 맡겨도 안심 | 신뢰형 **플랫 블루 단일 액센트**(`--accent #2563EB`, 그라데이션·도박틱 색 금지) / **상태를 색으로 즉시 구분**(Live=초록 `--success`, Connected=파랑 `--accent`, 에러=빨강 `--danger`) / 민감 지점에 **신뢰 장치 노출**(TenantIsolationBanner의 RLS 실증 버튼, ConsentBanner의 거부 경로, FreeEventBanner의 과금 주체 명시) / credential은 기본 마스킹·readonly |
| **또렷한** (Clear) | 비개발자가 헤매지 않고 지금 뭘 할지 안다 | **개발자 용어 최소화**, 쓰면 바로 옆 한국어 설명(SetupGuide) / **한 화면 한 결정**(Don't make me think), 자주 쓰는 기능은 최소 클릭 / **시맨틱 텍스트 위계** `text-text`(본문) → `text-muted`(보조) → `text-subtle`(비활성/힌트) / 빈 화면 방치 금지(EmptyState·OnboardingChecklist가 첫 행동 유도) |
| **차분한** (Calm) | 밀도 높은 관제탑인데 시끄럽지 않다 | **desaturated 중립(zinc) 팔레트 + 액센트 1개**만 채도 보유(Linear식 절제) / 카드 radius 12px 통일·과한 그림자 없음(`--shadow`는 낮게) / 애니메이션 절제(`.channel-card` hover `translateY(-2px)`, `.pulse-dot` 은은한 opacity 펄스) / 장식용 blob·wave·gradient 0 |

### 핵심 디자인 원칙

1. **일반인 우선(Don't make me think).** 개발자 용어는 마지막 수단, 쓰면 옆에 설명. 한 화면 한 결정.
2. **상태는 색으로 즉시.** 연결/미연결/에러/발행됨을 텍스트 읽기 전에 색으로 안다.
3. **신뢰는 설계된다.** "느낌상 믿음직"이 아니라 거부 경로·과정 노출·실증 버튼 같은 **구체 요소**로 신뢰를 만든다(뱅크샐러드식 의도된 마찰).
4. **절제가 밀도를 만든다.** 요소를 더해 채우지 말고 빼서 또렷하게. 액센트는 하나, 나머지는 중립.
5. **라이트·다크 동시 성립.** 모든 화면은 두 테마 모두에서 깨지지 않는다(하드코딩 색 금지 — §2).

---

## 2. 토큰 정본 (globals.css — 유일한 색·테마 원천)

**철칙: 새 색·새 폰트·임의 hex 추가 금지.** 모든 색은 아래 시맨틱 토큰을 **Tailwind 유틸리티**로만 쓴다. `bg-gray-900`, `text-amber-200`, `#3b82f6` 같은 직접값·하드코딩 다크 클래스는 라이트 테마에서 깨진다 — **금지**(`dashboard/CLAUDE.md` 코딩 규칙).

테마 전환: `<html data-theme="dark">` (라이트가 기본, ThemeToggle + layout FOUC 스크립트가 관리, next-themes 미사용).

### 2.1 시맨틱 토큰 표 (라이트 기본 / 다크 토글)

| 토큰(CSS 변수) | Tailwind 유틸리티 | 라이트 | 다크 | 용도 |
|---|---|---|---|---|
| `--bg` | `bg-bg` | `#FBFBFC` | `#0A0A0B` | 페이지 최하단 배경(true-grey, 순수 검정 아님) |
| `--surface` | `bg-surface` | `#FFFFFF` | `#161618` | 카드·패널 표면(1단 elevation) |
| `--surface-2` | `bg-surface-2` | `#F4F4F5` | `#1F1F23` | 중첩 표면·hover·입력칸(2단 elevation) |
| `--border` | `border-border` | `#E4E4E7` | `#27272A` | 경계선·구분선 |
| `--text` | `text-text` | `#18181B` | `#F4F4F5` | 본문·제목(주 텍스트) |
| `--text-muted` | `text-muted` | `#52525B` | `#A1A1AA` | 보조 텍스트·라벨 |
| `--text-subtle` | `text-subtle` | `#A1A1AA` | `#71717A` | 힌트·비활성·placeholder |
| `--accent` | `bg-accent` / `text-accent` | `#2563EB` | `#3B82F6` | 단일 액센트(신뢰형 플랫 블루) — CTA·활성탭·링크 |
| `--accent-hover` | `bg-accent-hover` | `#1D4ED8` | `#60A5FA` | 액센트 hover |
| `--accent-fg` | `text-accent-fg` | `#FFFFFF` | `#FFFFFF` | 액센트 배경 위 글자(항상 흰색) |
| `--accent-soft` | `bg-accent-soft` | `#EFF4FF` | `#172554` | 액센트 연한 배경(활성 사이드바·정보 배너) |
| `--success` | `text-success` | `#16A34A` | `#22C55E` | 성공·Live 상태(다크에서 desaturate 조정됨) |
| `--warning` | `text-warning` | `#D97706` | `#F59E0B` | 경고·주의 배너 |
| `--danger` | `text-danger` | `#DC2626` | `#EF4444` | 에러·실패·삭제 |
| `--shadow` | (`.card`/`.channel-card` 내부) | `0 4px 12px rgba(16,24,40,.08)` | `0 4px 12px rgba(0,0,0,.5)` | 낮은 그림자(elevation on hover) |

> **2026 벤치마크 정합 확인(WebSearch)**: 위 시스템은 현행 SaaS 대시보드 베스트프랙티스와 일치한다 — ①순수 `#000` 대신 true-grey 다크 베이스(`#0A0A0B`) ②중립(zinc) 위에 **채도 있는 액센트 1개**(desaturated system + single accent) ③success/warning/danger를 **다크 전용값으로 별도 튜닝**(dark-mode-aware semantic color) ④surface→surface-2로 3~6% 밝기 스텝 elevation. (AYDesign·925studios 2026, §5 출처.)

### 2.2 재사용 CSS 프리미티브 (globals.css 정의 — 컴포넌트 아님)

| 클래스 | 용도 | 비고 |
|---|---|---|
| `.card` | 표준 카드(surface + border + radius 12px, hover 시 border 밝아짐) | `<Card>` 컴포넌트가 감싼다 |
| `.channel-card` | 채널 카드(hover `translateY(-2px)` + shadow) | Marketing Home 그리드 |
| `.sidebar-item` | 사이드바 항목(active 시 `accent-soft` 배경 + 우측 2px 액센트 라인) | Sidebar |
| `.pulse-dot` | 연결 상태 라이브 도트(2s opacity 펄스) | 상태 표시 |
| `.blog-article-body` | 블로그 미리보기 본문(라이트 콘텐츠 전용, 의도적 고정색 유지) | **예외**: 블로그 프리뷰는 발행 콘텐츠라 라이트 고정 — 대시보드 UI 아님 |
| `.bg-accent` | 액센트 배경 요소는 항상 `--accent-fg` 흰 글씨 강제 | 가독성 보장 |

### 2.3 타이포그래피

- **주 서체**: `Pretendard` → `-apple-system, BlinkMacSystemFont, system-ui, sans-serif` 폴백(한국어 UI 최적, 블로그 프리뷰에서 명시 사용). 대시보드 본문은 Tailwind 기본 sans 스택 위에 시스템 폰트로 렌더 — **한글 가독이 최우선**이라 장식 서체를 쓰지 않는 것이 의도된 선택이다(품질헌법 §4 "무심코 system-ui" 함정 회피 — 여기선 근거 있는 선택: 자영업자 대상 정보 밀도 UI).
- **위계**: 크기+굵기로만 만든다. 제목 `font-bold`, 본문 기본, 라벨·힌트는 `text-[10px]~text-xs` + `text-subtle`. (실물 관찰: 라벨류는 `text-[10px]`/`text-xs`, 카드 제목 `text-sm font-medium`.)
- 새 폰트 추가 금지. 표현이 부족하면 **크기·굵기·색 토큰**으로 해결.

---

## 3. 컴포넌트 인벤토리 (dashboard/src/components/** — 실제 스캔, 55개)

**철칙: 새 화면은 이 인벤토리 재사용이 기본.** 신규 컴포넌트는 **여기 등재한 뒤** 사용한다(등재 없이 즉흥 생성 금지). 재사용 판단은 "같은 역할의 컴포넌트가 이미 있는가?"부터.

### 3.1 shared/ — 전역 재사용 프리미티브 (17개) ★가장 먼저 재사용 검토

| 컴포넌트 | 경로 | 용도 | 재사용 조건 |
|---|---|---|---|
| `Card` | shared/Card.tsx | `.card` 래퍼(surface+border+radius) | 모든 패널/카드의 기본 컨테이너 — **항상 이걸로 감싼다** |
| `StatusBadge` | shared/Badge.tsx | 상태 pill(constants의 `CH_STATUS_BADGE`/`_LABEL` 매핑) | 채널/글 상태 표기 전부 |
| `EmptyState` | shared/EmptyState.tsx | 빈 목록 안내("아직 데이터 없음") | 리스트·큐·분석 빈 상태 |
| `ErrorBoundary` | shared/ErrorBoundary.tsx | UI 크래시 캐치 + `/api/errors` 리포트 | 페이지/위험 영역 래핑 |
| `BackButton` | shared/BackButton.tsx | 진짜 뒤로가기(history 있으면 back, 없으면 fallback) | 하위 페이지 상단 |
| `LoginModal` | shared/LoginModal.tsx | 401 시 로그인 모달(`auth:required` 이벤트) | 전역 1회 마운트 |
| `AuthGate` | shared/AuthGate.tsx | 인증 게이트 + 정지/이용불가 풀스크린 | 앱 셸 |
| `CredentialForm` | shared/CredentialForm.tsx | credential 입력(마스킹·Show/Hide·readonly) | 모든 채널 자격증명 |
| `SetupGuide` | shared/SetupGuide.tsx | Quick Setup 단계 + 더 알아보기 토글(progressive disclosure) | 모든 채널 연결 가이드 |
| `ConsentBanner` | shared/ConsentBanner.tsx | GA 동의 배너(Consent Mode v2, 거부 경로) | 전역, 신뢰 장치 |
| `TenantIsolationBanner` | shared/TenantIsolationBanner.tsx | "내 데이터만 보임" RLS **실증 버튼** | 데이터 화면, 신뢰 장치 |
| `FreeEventBanner` | shared/FreeEventBanner.tsx | 무료 이벤트·과금 주체 명시(compact 옵션) | 온보딩/생성 화면, 신뢰 장치 |
| `ChannelConnectBanner` | shared/ChannelConnectBanner.tsx | 미연결 채널 유도 배너(warning 톤) | 홈/발행 진입 |
| `OnboardingChecklist` | shared/OnboardingChecklist.tsx | 4단계 가치체감 체크리스트(완료 시 사라짐, Zeigarnik) | 홈 상단 |
| `OnboardingWizard` | shared/OnboardingWizard.tsx | 3단계 온보딩(업종→채널→연결) | 최초 진입 |
| `BrandSetupWizard` | shared/BrandSetupWizard.tsx | 6문항 브랜드 셋업 → 증류 | Studio 최초 |
| `RouteTracker` | shared/RouteTracker.tsx | App Router page_view 트래킹(동의 연동) | 전역 1회 |

### 3.2 layout/ — 앱 셸 (4개)

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `Sidebar` | layout/Sidebar.tsx | 카테고리 그룹 사이드바(연결수/전체, 자동 열림, 모바일 가로탭) |
| `ThemeToggle` | layout/ThemeToggle.tsx | 라이트/다크 토글(`data-theme` + localStorage) |
| `Toast` | layout/Toast.tsx | 토스트(ToastProvider + `useToast`, success/error/warning/info) |
| `Providers` | layout/Providers.tsx | SWRConfig + ToastProvider 루트 |

### 3.3 channel/ — 채널 페이지 조립 (9개)

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `ChannelPage` | channel/ChannelPage.tsx | 콘텐츠 발행 채널 페이지 셸(Queue/Analytics/Growth/Popular/Settings 탭) |
| `MessagingPage` | channel/MessagingPage.tsx | 메시징 채널(알림 설정 + 테스트 발송, Content Guide 없음) |
| `DataChannelPage` | channel/DataChannelPage.tsx | Data & SEO 채널 |
| `InstagramPage` | channel/InstagramPage.tsx | 인스타 카드뉴스 전용 페이지 |
| `ContentGuide` | channel/ContentGuide.tsx | 채널별 Content Guide 편집(공통 복사) |
| `KeywordsEditor` | channel/KeywordsEditor.tsx | 채널별 키워드 편집 |
| `NotifStatusCard` | channel/NotifStatusCard.tsx | 이벤트별 알림 ON/OFF(onPublish/onViral/onError/weeklyReport) |
| `TestSendCard` | channel/TestSendCard.tsx | 즉시 테스트 메시지 발송 |
| `SocialConnectButton` | channel/SocialConnectButton.tsx | OAuth "연결" 버튼(비번/토큰 개념 없이, ADR-004) |

### 3.4 queue/ — 발행 큐 (4개)

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `QueueList` | queue/QueueList.tsx | 큐 목록 + 필터(전체/초안/승인됨/발행됨/실패) |
| `UnifiedPostCard` | queue/UnifiedPostCard.tsx | 멀티채널 통합 글 카드(채널별 상태) |
| `PostCard` | queue/PostCard.tsx | 단일 글 카드 |
| `ImagePickerModal` | queue/ImagePickerModal.tsx | 첨부 이미지 선택 모달 |

### 3.5 settings/ — 설정 8탭 (16개)

`Account` · `AIEngine` · `AiKeySettings` · `ChannelsSettings` · `ClaudeToken` · `DesignToolsSettings` · `ElevenLabsSettings` · `InteractiveChat` · `KeywordBankSettings` · `KwPlannerSettings` · `LlmModel` · `Notifications` · `SlackSettings` · `StorageSettings` · `SystemSettings` · `TenantTokensSettings` (모두 `settings/`). 탭 구조는 `docs/ui-rules.md` §15 참조.

### 3.6 home/ · studio/ (5개)

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `PipelineTimeline` | home/PipelineTimeline.tsx | 초안→승인→발행→성과 파이프라인 시각화 |
| `ChannelConnect` | studio/ChannelConnect.tsx | 채널 연결 모달(검증 경로 통일) |
| `PlatformPreview` | studio/PlatformPreview.tsx | 플랫폼별 발행물 미리보기(threads/x/ig/shorts) |
| `RepoConnect` | studio/RepoConnect.tsx | 레포 위키 연동(폴더 전체/특정 파일 2모드) |
| `SchedulePanel` | studio/SchedulePanel.tsx | 예약 발행(날짜·시간 picker + 플랫폼 체크) |

---

## 4. 레이아웃·패턴 규칙 (상세 정본 = docs/ui-rules.md, 여기선 요약만)

중복 서술 금지 — 아래는 인덱스이고 **상세는 `docs/ui-rules.md`가 정본**이다.

- **페이지 구조**(ui-rules §1): Marketing Home / 채널별 페이지(Queue·Analytics·Growth·Popular·Settings) / Blog / Images / 전역 Settings.
- **사이드바**(§2): 카테고리(Social/Video/Blog/Messaging/Data&SEO/Custom) · 연결 있으면 자동 열림 · `연결수/전체` 카운터 · 모바일은 가로 버튼.
- **채널 상태**(§3): Live=초록 / Connected=파랑 / 미입력=뱃지 없음 / Coming Soon=회색. 색은 §2 토큰 사용.
- **채널 유형별 페이지 구성**(§6): 발행 채널 vs Messaging vs Data — 2컬럼 레이아웃 패턴.
- **Credentials/Setup Guide**(§4·§5): 마스킹 readonly + Edit 모드 / Quick Setup(항상) + 더 알아보기(토글).
- **Analytics 빈 상태**(§8): 크론 안 돌아도 이전 데이터 표시, 없으면 안내 메시지.
- **온보딩**(§16): 3단계 위저드(업종→채널→연결) + "나중에 설정하기".

### 반응형 (품질헌법 §1.4 이중 레이아웃 — 실물 근거)

- **모바일(≤768px)**: `globals.css` 미디어쿼리가 사이드바를 **가로 버튼 리스트**로 전환(`aside nav` flex-wrap, 그룹 라벨 숨김). 카드 1열.
- **데스크톱(≥1024px)**: 사이드바(고정) + 본문 멀티컬럼(발행 채널 2컬럼: Credentials|Info / Content Guide|Keywords). "폭만 늘린 모바일" 금지 — 넓은 폭엔 그 폭에 맞는 정보 배치.
- 새 화면도 두 폭 모두 설계한다(네이티브 앱 전용 화면 없음 — 전부 웹).

---

## 5. 벤치마크 Reference 표

시작점 = `~/.claude/standards/benchmarks.md` §디자인. 이 제품(자영업자용 SNS 자동화 관제탑)에 맞는 것만 채택. 최신성 검증 WebSearch 1회 완료(2026 SaaS 대시보드 베스트프랙티스 — §2.1 정합 확인, 출처 하단).

### 채택 (무엇을 가져오고 / 무엇을 버리나)

| 레퍼런스 | 가져온 것 (이 제품에 어떻게) | 버린 것 / 안 훔친 것 |
|---|---|---|
| **Linear** (linear.app) | 밀도 높은 정보를 차갑지 않게 — **중립 위 단일 액센트**의 절제, 크기·굵기로 만든 타이포 위계, surface 스텝 elevation. → globals.css의 zinc+blue 시스템·`.card`/`.surface-2` 구조가 이 원리. | 보라 그라데이션(맥락 없으면 슬롭 1호) — **제거됨**. Linear 특유 모션 강도도 절제(우린 자영업자 대상, 더 차분히). |
| **뱅크샐러드** | **의도된 마찰 = 신뢰 장치.** 민감 지점(자격증명·데이터 격리·동의)에서 과정을 보여준다. → `TenantIsolationBanner`(RLS 실증 버튼) · `ConsentBanner`(거부 경로) · `FreeEventBanner`(과금 주체 명시)가 직접 구현. | 브랜드 자산 없음(원리만 차용). |
| **토스** | **디자이너=편집자, 한 화면 한 결정** + 마이크로카피 구어체 정확성. → "일반인 우선, 개발자 용어 최소" 원칙 · 에러 문구 "원인+다음행동" · 최소 클릭. | 토스체 폰트·일러스트 스타일(전재 금지). |
| **Stripe** | **점진 공개(progressive disclosure)** — 어려운 걸 처음부터 다 보여주지 않는다. → `SetupGuide`의 Quick Setup(항상) + "더 알아보기"(토글), 개발자 용어 뒤 한국어 설명. | 그라디언트 아이덴티티(안 가져옴 — 우린 플랫). |

### 기각 (왜 이 제품엔 안 맞나)

| 레퍼런스 | 기각 사유 |
|---|---|
| **배민** | 강한 대비·키치·과감한 브랜드 목소리는 "믿고 맡기는 차분한 관제탑" 톤과 충돌. 이 제품은 유머보다 **신뢰·또렷함**이 우선 — 도구가 시끄러우면 안 된다. |
| **오늘의집** | 매거진 감성·감성 사진 전면 배치는 콘텐츠-커머스용. 이 제품은 밀도 높은 **운영 도구**라 매거진 톤이 부적합. |

---

## 6. 금지 패턴 (관찰된 원칙 + 품질헌법 §4 블랙리스트에서 도출)

1. **도박틱/보라·핑크 그라데이션.** `globals.css`가 명시적으로 제거한 이력("도박틱 퍼플→핑크 제거"). AI 슬롭 1호. 액센트는 **플랫 블루 하나**뿐.
2. **토큰 밖 임의 hex / 하드코딩 다크 클래스.** `bg-gray-900`, `text-amber-200`, `#3b82f6`, `*-900/50` 직접 사용 금지 — 라이트에서 깨진다. §2 시맨틱 유틸리티만.
3. **라이트/다크 한쪽만 스타일링.** 두 테마 다 성립해야 한다. `dark:` 변형·조건부 색 대신 토큰 사용.
4. **개발자 전문용어 노출.** 대상이 일반인. 용어를 쓰면 옆에 한국어 설명(SetupGuide 패턴).
5. **generic 카드 나열·의미 없는 장식.** blob·wave·아이콘-원-배경 반복·전부 가운데 정렬 금지. 요소를 빼서 또렷하게.
6. **빈 CTA.** "시작하기/더 알아보기" 금지 → 동사+대상+이득("채널 연결하기 →", "무료로 바로 시작"). (실물 `ChannelConnectBanner`가 이미 준수.)
7. **다크패턴.** 가짜 긴급·강제 연속결제·사전 체크된 동의 금지(`ConsentBanner`는 거부 경로 제공).
8. **인벤토리 무시 즉흥 컴포넌트.** §3에 같은 역할이 있으면 재사용. 신규는 §3 등재 후.
9. **빈 상태 방치.** 빈 화면은 `EmptyState`/체크리스트로 첫 행동 유도(방치 화면 금지).

### ⚠️ 관찰된 토큰-부채 (신규 화면은 답습 금지, 기존은 점진 마이그레이션 대상)

실물 스캔 중 발견한 **기존 위반**(정직하게 기록 — 이걸 새 화면에 복제하지 마라):
- `queue/PostCard.tsx`·`queue/UnifiedPostCard.tsx`: `bg-yellow-900/50 text-yellow-300` 등 하드코딩 상태색.
- `shared/OnboardingChecklist.tsx`: `bg-green-900/30 text-green-300`.
- `shared/TenantIsolationBanner.tsx`: `bg-emerald-900/15 text-emerald-200`.
- `layout/Toast.tsx`: `COLORS`가 `bg-green-800` 등 하드코딩.
- `shared/OnboardingWizard.tsx`: 인스타 아이콘 `bg-gradient-to-br from-pink-500 to-orange-400`(브랜드 로고 재현 목적 — 예외 허용하되 UI 액센트로 확산 금지).

→ **규칙**: 신규 화면은 상태색을 `text-success`/`text-warning`/`text-danger` + `bg-accent-soft`류 토큰으로만 쓴다. 위 부채는 별건으로 토큰화(이 파일 착수 범위 아님, `pipeline reopen` 없이 후속 정리).

---

## 7. 디자인 작업 절차 (새 화면·컴포넌트 요청 시)

1. **이 DESIGN.md를 Read** — 톤앵커 3형용사·토큰·금지 패턴 확인.
2. **인벤토리 재사용 판단**(§3) — 같은 역할 컴포넌트가 있으면 재사용. 없으면 신규를 §3에 **먼저 등재**.
3. **레이아웃 정본 확인**(`docs/ui-rules.md`) — 페이지 유형별 구성·상태 규칙.
4. **목업**: `design-html` 스킬로 production 품질 시안(모바일 390px + 데스크톱 ≥1024px 둘 다, 상태 4종 empty/loading/error/disabled 포함).
5. **자가 QA**: `design-review` 스킬 완주 → **Design Score 등급 출력**. B 미만이면 findings 반영 리테이크(최대 2회). **스킬 실호출만 인정 — 수동 체크리스트·자가 검사로 등급을 대신 매기는 것 금지**(2026-07-16 리허설 실측: 하위모델이 스킬을 스킵하고 "A"를 자가 산출하는 드리프트 관찰됨. 검증 스크립트가 스킬 실호출 여부를 트랜스크립트에서 확인한다).
6. **구현**: 시맨틱 토큰 유틸리티만, 라이트/다크 둘 다 검수(`browse` 라이트/다크).
7. **판단 불가 시**(브랜드 결정·미정의 요구·토큰으로 표현 불가): 추측 말고 `⛔ 회수 필요: <질문>`으로 상류에 올린다.

**착수 전 필독**: `~/.claude/standards/design.md`(품질헌법 — 판정 우선순위·5디자이너 원칙·안티슬롭). 벤치마크는 `~/.claude/standards/benchmarks.md` §디자인에서 시작 + 최신성 WebSearch ≥1.
