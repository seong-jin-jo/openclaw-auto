# openclaw-auto — 기술 가이드

Claude Agent와 개발자가 참고하는 기술 문서. 사용법은 README.md 참고.

## 공통 레포 정책

이 레포는 서비스 중립적 공통 플랫폼. 코드, 커밋, PR에 특정 서비스 URL/사용자명/브랜드명/API 키를 포함하지 않는다. Custom Integration은 fork에서 추가.

## 아키텍처

```
OpenClaw Cron → Claude Agent → Tool Registry
                                 ├── threads_publish   (Threads API 발행)
                                 ├── x_publish          (X API v2, OAuth 1.0a)
                                 ├── instagram_publish  (Instagram Graph API)
                                 ├── threads_queue      (queue.json CRUD, 멀티채널)
                                 ├── threads_style      (style-data.json RAG)
                                 ├── threads_insights   (반응 수집 + 터진 글 감지)
                                 ├── threads_search     (외부 인기글 수집)
                                 ├── threads_growth     (팔로워 추적)
                                 ├── image_upload       (R2 이미지 업로드)
                                 ├── card_generator     (카드뉴스 생성)
                                 ├── midjourney_image   (Midjourney 이미지 생성)
                                 ├── blog_queue         (블로그 큐)
                                 └── 14개 채널 publish extensions
```

## 대시보드

Next.js (App Router) + TypeScript. 구조:

```
dashboard/src/
  app/                    # App Router — 페이지 + API routes
    api/                  #   REST API endpoints (channel-config, queue, guide, keywords 등)
    channels/             #   채널별 페이지 (Queue/Analytics/Growth/Popular/Settings)
    blog/                 #   블로그 관리
    images/               #   에셋 갤러리
    settings/             #   채널 연결, AI Engine, Notifications, Account
    page.tsx              #   Marketing Home
    layout.tsx            #   루트 레이아웃 + 사이드바
  components/             # React 컴포넌트 (공유 UI)
  lib/                    # 유틸리티, 상수, API 헬퍼, 채널 설정
  hooks/                  # 커스텀 React hooks
  types/                  # TypeScript 타입 정의
  store/                  # 상태 관리

dashboard/legacy/         # Flask 호환용 (점진적 제거 예정)
  server.py               #   Flask API 서버
  static/                 #   레거시 프론트엔드
```

주요 페이지:
- Marketing Home: 채널 그리드 + 주간 성과 + 크론 상태 + 활동 타임라인
- 채널별 페이지: Queue / Analytics / Growth / Popular / Settings (credential + guide + keywords)
- Settings: 채널 연결 + AI Engine + Notifications + Account
- Blog / Images 탭

인증: `DASHBOARD_AUTH_TOKEN` 설정 시 로그인 필수. 미인증 시 랜딩페이지.

## 레거시 전환 로드맵

### Phase 1 (현재): Flask + Next.js 병행
- `dashboard/legacy/server.py` — Flask API 서버 (기존 크론잡/extension이 호출)
- `dashboard/src/` — Next.js 프론트엔드 + API routes (신규 기능)
- 두 서버가 동시에 실행, Next.js가 일부 API를 Flask로 프록시

### Phase 2: Docker를 Next.js로 전환
- Next.js API routes가 Flask API를 완전 대체
- `server.py`의 모든 엔드포인트를 `src/app/api/`로 마이그레이션
- Docker Compose에서 Flask 컨테이너 제거

### Phase 3: legacy/ 삭제
- `dashboard/legacy/` 디렉토리 완전 제거
- Next.js 단일 서버로 운영

### fork 주의사항
- 새 기능은 반드시 `src/`에 추가
- `server.py` 수정 시 `src/app/api/`에도 동일 기능 반영 (이중 구현)
- Phase 2 전환 시 `server.py` 코드는 삭제 대상

## 멀티채널 발행 구조

### 크론잡: `multi-channel-publish`
```
1. threads_queue action=get_approved → 발행 대상 글
2. 각 글에 대해:
   ├── Threads: threads_publish → update_channel(threads, published)
   ├── X: 280자 자동 압축 → x_publish → update_channel(x, published)
   ├── Instagram: 이미지 첨부 → instagram_publish → update_channel(instagram, published)
   └── 채널 비활성/미연결 → update_channel(channel, skipped)
3. 모든 채널 완료 → top-level status 자동 갱신
4. cleanup: 오래된 published/failed 정리
```

새 채널 추가 시 publish extension만 enabled하면 크론잡이 자동 감지하여 발행.

### Queue 스키마 (v2)
```json
{
  "status": "approved",
  "channels": {
    "threads": { "status": "pending", "mediaId": null, "publishedAt": null, "error": null },
    "x": { "status": "pending", "tweetId": null, "publishedAt": null, "error": null },
    "instagram": { "status": "pending", "publishedAt": null, "error": null }
  }
}
```

### 채널별 Content Guide + Keywords
```
data/
  prompt-guide.txt          ← 공통 (모든 채널 기본값)
  prompt-guide.threads.txt  ← Threads 전용 (선택, 없으면 공통 사용)
  prompt-guide.x.txt        ← X 전용 (선택)
  search-keywords.txt       ← 공통
  search-keywords.x.txt     ← X 전용 (선택)
```
- 채널 Settings에서 편집 시 채널 전용 파일로 저장
- "공통에서 복사" 버튼으로 동기화
- API: `GET/POST /api/guide/<channel>`, `GET/POST /api/keywords/<channel>`

## 채널 상태

| 상태 | 뱃지 | 조건 |
|------|------|------|
| Live | 초록 | credential 입력 + 검증 성공 + enabled |
| Connected | 파랑 | credential 입력 + 자동화 미시작 |
| (없음) | - | extension 존재, credential 미입력 |
| Coming Soon | 회색 | extension 미구현 |

### Credential 검증
저장 시 `verify_channel(channel, config)` 호출 → 실제 API로 유효성 확인.
- Threads: `GET /me?fields=username`
- Instagram: `GET /me?fields=username` (Graph API)
- Bluesky: `POST createSession`
- Telegram: `GET /bot{token}/getMe`
- Facebook: `GET /{pageId}?fields=name`
- X: 4개 키 존재 여부 (OAuth 서명 생략)

## 새 채널 추가

1. `extensions/PLATFORM-publish/` 생성 (4파일: package.json, plugin.json, index.ts, tool.ts)
2. `src/app/api/channel-config/route.ts` — `OTHER_CHANNELS`에 채널 추가
3. `src/lib/verify-channel.ts` — 검증 로직 추가
4. `src/lib/setup-guides.ts` — quick + detail 가이드 추가
5. `src/lib/constants.ts` — `CH_LABELS` + `IMPLEMENTED_PLUGINS`에 추가
6. Docker 리빌드 (`OPENCLAW_EXTENSIONS`에 포함)

## AI 엔진 (LLM)

`config/openclaw.json > agents.defaults.model`:
```json
{
  "primary": "anthropic/claude-sonnet-4-6",
  "fallbacks": ["google/gemini-2.5-flash", "ollama/llama3.1:8b"]
}
```

크론잡별 모델 오버라이드: `jobs.json > payload.model`
- 콘텐츠 생성 → Sonnet/Opus (품질 중요)
- 발행/수집/추적 → Haiku (비용 절감)
- 대시보드 Settings > AI Engine에서 GUI 설정

인증: Claude Code Max Plan (OAuth, 자동 refresh). 사용량 한도 초과 시 크론 정지.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `THREADS_ACCESS_TOKEN` | Threads long-lived access token (60일) |
| `THREADS_USER_ID` | Threads user ID |
| `X_API_KEY` / `X_API_KEY_SECRET` | X 소비자 키/시크릿 (OAuth 1.0a) |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | X 액세스 토큰/시크릿 (Read+Write) |
| `INSTAGRAM_ACCESSTOKEN` / `INSTAGRAM_USERID` | Instagram Graph API 토큰/유저 ID |
| `MIDJOURNEY_DISCORD_TOKEN` / `MIDJOURNEY_CHANNEL_ID` / `MIDJOURNEY_SERVER_ID` | Midjourney Discord 연동 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT` / `R2_PUBLIC_URL` | Cloudflare R2 |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway 인증 |
| `DASHBOARD_PORT` | 대시보드 포트 (기본 3456) |
| `DASHBOARD_AUTH_TOKEN` | 대시보드 로그인 토큰. 미설정 시 인증 비활성화 |
| `VIRAL_THRESHOLD` | 터진 글 기준 views (기본 500) |

## Cron Jobs

| 이름 | 주기 | 모델 | 설명 |
|------|------|------|------|
| `threads-generate-drafts` | 6h | Sonnet | prompt-guide 기반 draft 생성 |
| `multi-channel-publish` | 2h | Haiku | 승인 글 멀티채널 발행 |
| `instagram-generate-drafts` | 6h | Sonnet | Instagram 카드뉴스 콘텐츠 생성 |
| `instagram-auto-publish` | 2h | Haiku | Instagram 이미지 글 자동 발행 |
| `threads-collect-insights` | 6h | Haiku | 반응 수집 + 댓글 좋아요 + 저조 삭제 |
| `threads-fetch-trending` | 주1회 | Haiku | 외부 인기글 수집 |
| `threads-track-growth` | 매일 | Haiku | 팔로워 추적 |

## UI 규칙

→ **[docs/ui-rules.md](docs/ui-rules.md)** 참고

CLAUDE.md와 별도 관리. 모든 fork가 공유하는 대시보드 UI/UX 기준.
