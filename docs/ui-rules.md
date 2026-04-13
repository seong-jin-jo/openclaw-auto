# UI 규칙 — 대시보드 공통 인터페이스

모든 fork가 공유하는 대시보드 UI/UX 기준.
대상 사용자: **일반인** (자영업자, 비개발자). 개발자 용어 최소화.

---

## 1. 페이지 구조

```
대시보드
├── Marketing Home        ← 전역 대시보드
├── 채널별 페이지          ← Social / Video / Blog / Messaging / Data / Custom
│   ├── Queue             ← 콘텐츠 발행 채널만
│   ├── Analytics         ← 콘텐츠 발행 채널만
│   ├── Growth            ← 콘텐츠 발행 채널만
│   ├── Popular           ← 콘텐츠 발행 채널만
│   └── Settings          ← 모든 채널 (Credentials + Setup Guide + ...)
├── Blog                  ← 블로그 큐
├── Images                ← 에셋 갤러리
└── Settings              ← 전역 설정
    ├── AI Engine
    ├── Notifications
    ├── Interactive Chat
    └── Account
```

## 2. 사이드바

- **카테고리**: Social / Video / Blog / Messaging / Data & SEO / Custom Integration
- 연결된 채널(Live/Connected) 있는 카테고리: **자동 열림**
- 카운터: `연결수/전체수` 표시 (연결 있으면 초록)
- Coming Soon: 클릭 불가, 회색 텍스트
- 모바일: 가로 버튼 리스트로 전환

### 카테고리 분류 기준

| 카테고리 | 용도 | 예시 |
|----------|------|------|
| Social | SNS 콘텐츠 발행 | Threads, X, Instagram, Facebook, LinkedIn, Bluesky, Pinterest, Tumblr |
| Video | 영상 콘텐츠 | TikTok, YouTube |
| Blog | 블로그/긴 글 | Naver Blog, Medium, Substack |
| Messaging | 알림/대화 (콘텐츠 생성 X) | Telegram, Discord, Slack, LINE, Kakao, WhatsApp |
| Data & SEO | 데이터 수집/분석 | Google Analytics, Search Console, Google Business |
| Custom Integration | 특정 도메인에 종속 | 자체 블로그, Custom API, Webhook, RSS |

- **공통 플랫폼** (Social~Data): 모든 서비스에서 사용
- **Custom Integration**: 특정 사업에 종속 (fork마다 다름)

## 3. 채널 상태

| 상태 | 뱃지 | 조건 |
|------|------|------|
| Live | 초록 | credential 입력 + 검증 성공 + 자동화 활성 |
| Connected | 파랑 | credential 입력 + 자동화 미시작 |
| (없음) | — | extension 존재, credential 미입력 |
| Coming Soon | 회색 | extension 미구현 |

## 4. Credentials (모든 채널 공통)

- 기본: **readonly** (값 마스킹 표시)
- "Edit" 클릭 → 수정 모드 (Update + Cancel 버튼)
- 저장 시 실제 API 호출로 검증 → 성공하면 보기 모드 복귀, 실패 시 에러 메시지
- **Show/Hide 토글**: secret 필드(Token, Password, Secret)에 적용
- 토큰 전체 값은 `title` 속성으로 호버 시 확인 가능
- placeholder에 마스킹된 기존 값 표시

## 5. Setup Guide (모든 채널 공통)

- **Quick Setup**: 따라만 하면 동작하는 단계별 가이드 (항상 표시)
  - 번호 매기기, 한 단계에 한 동작
  - "어디서 뭘 검색/클릭하는지" 구체적으로 명시
- **더 알아보기**: 키 역할, OAuth 구조, 비용, 제한사항 (토글로 숨김)
  - `whitespace-pre-wrap` 적용
  - 대상이 일반인이므로 개발자 용어 사용 시 바로 옆에 설명 추가

## 6. 채널 유형별 페이지 구성

### 콘텐츠 발행 채널 (Social / Video / Blog)

```
┌─────────────────────┬─────────────────────┐
│ Credentials         │ Channel Info        │
│                     │ Setup Guide         │
├─────────────────────┼─────────────────────┤
│ Content Guide       │ Keywords            │
│ (채널 전용 편집)     │ (채널 전용 편집)     │
└─────────────────────┴─────────────────────┘
+ 채널 특성에 따라 탭 구성이 다를 수 있음
```

- 기본 탭: Queue / Analytics / Growth / Popular / Settings
- 채널 특성에 따라 일부 탭이 없거나 추가될 수 있음 (예: Video 채널은 Growth 대신 다른 지표)
- Content Guide + Keywords: 채널별 독립 편집
- "공통에서 복사" 버튼으로 동기화
- 없으면 공통 가이드 자동 사용

### Messaging 채널 (Telegram / Discord / Slack / LINE / Kakao / WhatsApp)

```
┌─────────────────────┬─────────────────────┐
│ Credentials         │ Channel Info        │
│                     │ Setup Guide         │
├─────────────────────┼─────────────────────┤
│ 알림 발송 설정       │ 테스트 발송          │
│ (어떤 이벤트에 ON)   │ (즉시 메시지 전송)   │
└─────────────────────┴─────────────────────┘
```

- **Content Guide / Keywords 없음** — Messaging은 콘텐츠를 생성하는 채널이 아님
- 알림 발송: onPublish / onViral / onError / weeklyReport 이벤트별 ON/OFF
- 테스트 발송: 즉시 메시지 전송으로 연결 확인
- Interactive Chat 연결 상태 표시 (양방향 대화 가능한 채널)

### Data & SEO 채널

```
┌─────────────────────┬─────────────────────┐
│ Credentials         │ Channel Info        │
│                     │ Setup Guide         │
└─────────────────────┴─────────────────────┘
+ (구현 시 페이지 구성 확인 필요)
```

- 현재 다른 프로젝트에서 구현 중
- 새 Data 채널 페이지가 들어오면 구성 검토 후 반영

## 7. Content Guide + Keywords

- 공통 파일: `data/prompt-guide.txt`, `data/search-keywords.txt`
- 채널별 파일: `data/prompt-guide.{channel}.txt`, `data/search-keywords.{channel}.txt`
- 채널 Settings에서 편집 시 채널 전용 파일로 저장
- 채널 전용 파일 없으면 공통 파일을 자동 사용
- **적용 대상**: 콘텐츠를 생성/발행하는 채널만 (Social, Video, Blog)
- **비적용**: Messaging, Data & SEO

## 8. Analytics

- 크론 안 돌아도 이전 데이터 표시 (빈 화면 방지)
- 크론 에러 시: "자동화 일시 중단 — 최신 데이터가 아닐 수 있습니다" 경고 배너
- 데이터 없으면 안내 메시지 ("아직 데이터가 없습니다. 첫 발행 후 수집됩니다")

## 9. Marketing Home (전역)

- 채널 아이콘 그리드 (연결된 것 초록 도트, 클릭 시 해당 채널 페이지)
- 주간 성과 요약 카드
- 크론 상태 (정상/에러/정지)
- Alerts (바이럴 감지, 크론 에러 등)
- 활동 타임라인 (최근 발행/수집/알림)
- 온보딩: 로그인 여부에 따라 다르게 표시
  - 미로그인: 로그인 유도
  - 로그인 후 연결된 채널 0개: 채널 연결 안내

## 10. Settings (전역)

- **AI Engine**: LLM 모델 선택 + 크론잡별 모델 오버라이드
- **Notifications**: 이벤트별 알림 채널 선택 + 주간 리포트 발송 설정
- **Interactive Chat**: 양방향 봇 설정 (Telegram 등)
- **Account**: 로그인/로그아웃 + 테마 전환 (다크/라이트)

## 11. 인증

- `DASHBOARD_AUTH_TOKEN` 환경변수 설정 시 로그인 필수
- 미설정 시: 인증 비활성화 (로컬 개발용)
- 로그인 모달: 전체 화면 가림 대신 모달 팝업

## 12. 디자인 원칙

- **테마**: 다크 기본 (`#0a0a0a` 배경, `#141414` 카드, `#1e1e1e` 보더), 라이트 테마 전환 가능하게
- **최소 클릭**: 자주 쓰는 기능은 한 번에 접근
- **상태 명확**: 연결/미연결/에러 상태를 색상으로 즉시 구분
- **모바일 대응**: 사이드바 → 가로 탭, 카드 1열 배치
- **캐시 버스팅**: `app.js?v=X.X` 버전 파라미터
