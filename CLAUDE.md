# openclaw-auto — 기술 가이드

Claude Agent와 개발자가 참고하는 기술 문서. 사용법은 README.md 참고.

## 아키텍처

```
OpenClaw Cron → Claude Agent → Tool Registry
                                 ├── threads_publish   (Threads API 발행)
                                 ├── x_publish          (X API v2, OAuth 1.0a)
                                 ├── threads_queue      (queue.json CRUD, 멀티채널)
                                 ├── threads_style      (style-data.json RAG)
                                 ├── threads_insights   (반응 수집 + 터진 글 감지)
                                 ├── threads_search     (외부 인기글 수집)
                                 ├── threads_growth     (팔로워 추적)
                                 ├── image_upload       (R2 이미지 업로드)
                                 ├── card_generator     (카드뉴스 생성)
                                 ├── blog_queue         (블로그 큐)
                                 └── 14개 채널 publish extensions
```

## 멀티채널 발행 구조

### 크론잡: `multi-channel-publish`
```
1. threads_queue action=get_approved → 발행 대상 글
2. 각 글에 대해:
   ├── Threads: threads_publish → update_channel(threads, published)
   ├── X: 280자 자동 압축 → x_publish → update_channel(x, published)
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
- Bluesky: `POST createSession`
- Telegram: `GET /bot{token}/getMe`
- Facebook: `GET /{pageId}?fields=name`
- X: 4개 키 존재 여부 (OAuth 서명 생략)

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

## 새 채널 추가

1. `extensions/PLATFORM-publish/` 생성 (4파일: package.json, plugin.json, index.ts, tool.ts)
2. `server.py > IMPLEMENTED_PLUGINS`에 추가
3. `server.py > verify_channel()`에 검증 로직 추가
4. `app.js > setupGuides`에 quick + detail 추가
5. `threads-queue-tool.ts > Channels` 타입에 채널 추가
6. Docker 리빌드 (OPENCLAW_EXTENSIONS에 포함)

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

## 대시보드

Flask + Vanilla JS SPA. 구조:
- Marketing Home: 채널 그리드 + 주간 성과 + 크론 상태 + 활동 타임라인
- 채널별 페이지: Queue / Analytics / Growth / Popular / Settings (credential + guide + keywords)
- Settings: 채널 연결 + AI Engine + Notifications + Account
- Blog / Images 탭

인증: `DASHBOARD_AUTH_TOKEN` 설정 시 로그인 필수. 미인증 시 랜딩페이지.

## 사업화 설계

### 타겟
자영업자 (카페/미용실/식당/피트니스). 월 10-20만원 구독.

### 온보딩 플로우
```
첫 접속 → 업종 선택 (카페/미용실/식당/...) 
  → prompt-guide + keywords 자동 설정 (업종별 템플릿)
  → 채널 선택 (Threads/X/Instagram/...)
  → credential 입력 (Setup Guide 따라하기)
  → 자동화 시작
```

### 비용 구조
- Claude API: Max Plan 공유 or 고객별 API 키
- X API: 종량제 (PPU), 고객 부담
- 호스팅: Docker 인스턴스 or 멀티테넌트 공유

### Messaging 채널 상세

**즉시 사용 가능 (무료):**
- Telegram: @BotFather → Bot Token + Chat ID. 완전 무료, 양방향 대화 가능
- Discord: 채널 설정 > 웹후크 URL. 완전 무료, 일방향
- Slack: api.slack.com > Incoming Webhook. 완전 무료, 일방향

**연동 가능 (유료/계약):**
- LINE: developers.line.biz > Messaging API. 무료 500건/월, 이후 건당 과금. 브로드캐스트 방식
- Kakao Channel: 알림톡(템플릿 승인 필요) + 친구톡(마케팅). 직접 API 없음, 리셀러(알리고/솔라피) 통해 연동. 건당 과금
- WhatsApp: BSP(Business Solution Provider) 계약 필요. 건당 $0.02~$0.22. 템플릿 사전 승인

**자영업자 우선순위:**
한국: Kakao > LINE > Telegram
글로벌: WhatsApp > Telegram > LINE

### Messaging 활용
1. **콘텐츠 발행**: 카카오/LINE/Telegram 채널에 마케팅 콘텐츠 자동 발송
2. **알림**: 발행 완료/바이럴/에러 → Telegram/Slack/Discord로 관리자 알림
3. **대화 (양방향)**: OpenClaw 내장 채널 기능으로 Agent와 대화 가능 (Telegram 봇 등)

알림 설정: `data/notification-settings.json`
```json
{ "onPublish": { "enabled": true, "channels": ["telegram"] },
  "onViral": { "enabled": true, "channels": ["slack"] },
  "onError": { "enabled": true, "channels": ["slack"] } }
```
API: `GET/POST /api/notification-settings`, `POST /api/send-notification`

### 멀티 테넌트

**현재** (Phase 1): 프로젝트별 독립 인스턴스
```
/home/sj/marketing-AI-dark/    ← 고객 A (독립 Docker)
/home/sj/marketing-AI-romeo/   ← 고객 B (독립 Docker)
```

**Phase 2** (v3.0): tenant 라우팅
```
/app/tenants/
  tenant-001/config/ + data/   ← 고객 A
  tenant-002/config/ + data/   ← 고객 B
```
- 로그인 토큰에 tenant ID 포함: `tenant-001:password`
- server.py에서 DATA_DIR/CONFIG_DIR를 tenant별 분기
- 같은 대시보드 + extension으로 여러 고객 서비스

**Phase 3** (v4.0 SaaS): 회원가입 + DB + 결제
- 회원가입 → tenant 자동 생성
- flat file → DB 전환 (Supabase/PostgreSQL)
- Stripe 결제 연동

### 기술 전환 고려 (v4.0 시점)

**DB 전환:**
- 현재: flat file (queue.json, growth.json) — 동시 접근 문제, 검색/집계 불가
- SQLite (가장 간단) 또는 PostgreSQL/Supabase (SaaS 대비)
- 마이그레이션: queue.json → posts 테이블, growth.json → metrics 테이블

**Next.js 전환:**
- 현재: Flask + Vanilla JS (app.js 2000줄+, 컴포넌트 분리 불가)
- Next.js + React → 컴포넌트 분리, SSR/SEO, TypeScript (extension과 통일)
- 예상 공수: 3-5일 풀타임
- 추천 시점: v3.0 완료 후, v4.0 SaaS 준비 단계
