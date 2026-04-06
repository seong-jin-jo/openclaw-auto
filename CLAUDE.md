# openclaw-auto — 기술 가이드

이 문서는 Claude Agent와 개발자가 참고하는 기술 문서입니다. 사용법은 README.md를 참고하세요.

## 아키텍처

```
OpenClaw Cron → Claude Agent → Tool Registry
                                 ├── threads_publish   (Threads API 2단계 발행)
                                 ├── x_publish          (X API v2, OAuth 1.0a)
                                 ├── threads_queue      (queue.json CRUD, 멀티채널)
                                 ├── threads_style      (style-data.json RAG)
                                 ├── threads_insights   (반응 수집 + 터진 글 감지 + 자동 피드)
                                 ├── threads_search     (키워드 기반 외부 인기글)
                                 ├── threads_growth     (팔로워 추적)
                                 ├── image_upload       (Cloudflare R2 업로드)
                                 ├── blog_queue         (블로그 큐 CRUD)
                                 ├── dedu_blog          (자체 사이트 블로그 발행)
                                 └── seo_keywords       (네이버 검색광고 API)
```

## Tool 등록/호출 과정

```
1. 빌드: extensions/*/openclaw.plugin.json + index.ts + src/*-tool.ts
2. 로딩: config/openclaw.json의 plugins.entries에서 enabled=true인 플러그인 로드
3. 호출: Agent가 Tool 이름 + JSON 파라미터 전달 → execute() → 결과 반환
```

핵심: Agent가 **실행 시점**에 어떤 Tool을 호출할지 결정. 같은 프롬프트라도 상황에 따라 다른 Tool 조합.

## Queue 멀티채널 스키마 (v2)

```json
{
  "status": "approved",
  "threadsMediaId": null,
  "channels": {
    "threads": { "status": "pending", "mediaId": null, "publishedAt": null, "error": null },
    "x": { "status": "pending", "tweetId": null, "publishedAt": null, "error": null }
  }
}
```

- `update_channel` 액션: 채널별 독립 상태 업데이트
- 양쪽 모두 published/skipped → top-level status 자동 갱신
- `channels` 필드는 optional → 기존 v1 queue.json 하위 호환

## 채널 상태 관리

| 상태 | 뱃지 | 조건 |
|------|------|------|
| Live (초록) | 운영 중 | credential 입력 + enabled |
| + Connect (파랑 테두리) | 연결 가능 | extension 존재 + credential 미입력 |
| Coming Soon (회색) | 준비 중 | extension 미구현 또는 외부 승인 대기 |

## Credential 검증

credential 저장 시 `verify_channel(channel, config)` 함수가 실제 API를 호출하여 유효성 검증:
- 검증 성공 → `enabled: true`, 응답에 `verified: true, account: "@username"`
- 검증 실패 → `enabled: false`, 응답에 `verified: false, error: "이유"`
- 채널별 검증: Threads(GET /me), Bluesky(createSession), Telegram(getMe), Facebook(GET /page), Discord(webhook URL 형식)
- X는 OAuth 1.0a 서명이 복잡하여 키 존재 여부만 확인

## Setup Guide 구조

모든 채널에 **Quick Setup** + **Detail(더 알아보기)** 2단계:
- Quick: 단계별 따라하기 (사이트 접속 → 앱 생성 → 키 복사 → 입력)
- Detail: 각 키의 역할, OAuth 구조, 권한 설명, 비용/제한사항
- `app.js`의 `setupGuides` 객체에 `quick` (배열) + `detail` (문자열) 정의

## AI 엔진 설정

LLM은 `config/openclaw.json > agents.defaults.model`에서 설정:
```json
"model": {
  "primary": "anthropic/claude-sonnet-4-6",
  "fallbacks": ["google/gemini-2.5-flash", "ollama/llama3.1:8b"]
}
```
- 인증: Claude Code Max Plan (OAuth, 자동 refresh)
- 대시보드 Settings > AI Engine에서 모델명/토큰 상태 확인 가능

## 새 채널 추가 방법

1. `extensions/PLATFORM-publish/` 디렉토리 생성 (threads-publish 패턴 참고)
2. `config/openclaw.json`의 `plugins.entries`에 설정 추가
3. `threads-queue-tool.ts`의 `Channels` 타입에 채널 추가
4. Docker 이미지 리빌드 (`OPENCLAW_EXTENSIONS`에 포함)
5. 크론잡 프롬프트에 새 채널 발행 로직 추가
6. 대시보드: `setupGuides`에 `quick` + `detail` 추가
7. `server.py`: `verify_channel()`에 검증 로직 추가
8. `server.py`: `IMPLEMENTED_PLUGINS` 세트에 플러그인명 추가

## 환경 변수

### Threads
- `THREADS_ACCESS_TOKEN`: Long-lived access token (60일 유효)
- `THREADS_USER_ID`: Threads user ID

### X (Twitter)
- `X_API_KEY`: 소비자 키 (Consumer Key)
- `X_API_KEY_SECRET`: 소비자 시크릿
- `X_ACCESS_TOKEN`: 액세스 토큰 (Read+Write 필수)
- `X_ACCESS_TOKEN_SECRET`: 액세스 토큰 시크릿

### Cloudflare R2
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

### 공통
- `OPENCLAW_GATEWAY_TOKEN`: Gateway 인증 토큰
- `DASHBOARD_PORT`: 대시보드 포트 (기본: 3456)
- `DASHBOARD_AUTH_TOKEN`: 대시보드 인증 토큰. 설정하면 로그인 필수, 미설정 시 누구나 접근 가능. .env에 추가하거나 docker run -e로 전달
- `VIRAL_THRESHOLD`: 터진 글 기준 views (기본: 500)

## Tool 목록

| Tool | 설명 |
|------|------|
| `threads_publish` | Threads API 발행 (TEXT/IMAGE/QUOTE, container → publish) |
| `x_publish` | X (Twitter) API v2 발행 (OAuth 1.0a, 280자 제한) |
| `threads_queue` | 콘텐츠 큐 CRUD (list/add/update/delete/get_approved/cleanup/update_channel) |
| `threads_style` | 스타일 학습 데이터 RAG (read/add/summary) |
| `threads_insights` | 반응 수집 + 댓글 좋아요/답글 + 저조 삭제 (collect/auto_like_replies/auto_reply/cleanup_low_engagement) |
| `threads_search` | 브라우저 스크래핑 기반 외부 인기글 수집 (scrape/fetch) |
| `threads_growth` | 팔로워 수/증감 추적 (track) |
| `image_upload` | 로컬 이미지 → Cloudflare R2 업로드 → 퍼블릭 URL 반환 (upload) |


## Cron Jobs

| 이름 | 기본 주기 | 설명 |
|------|----------|------|
| `threads-generate-drafts` | 6시간 | draft 배치 생성 (prompt-guide.txt 기반) |
| `threads-auto-publish` | 4시간 | approved 글 자동 발행 |
| `threads-collect-insights` | 6시간 | 반응 수집 + 댓글 좋아요 + 저조 글 삭제 |
| `threads-fetch-trending` | 주 1회 | 외부 인기글 수집 |
| `threads-track-growth` | 매일 | 팔로워 추적 |
| `threads-rewrite-trending` | - | 트렌드 재가공 |

주기는 `config/cron/jobs.json`에서 서비스별 조정. 대시보드 Settings에서 자동화 토글 ON/OFF 가능.

```bash
openclaw cron list                    # 목록 확인
openclaw cron run <id>                # 수동 실행
openclaw cron runs --id <id>          # 실행 이력
```

## 대시보드 API

인증: `DASHBOARD_AUTH_TOKEN` 환경변수. 미설정 시 인증 비활성화.

주요 엔드포인트:
- `GET /api/overview` — 전체 현황
- `GET /api/queue` — 콘텐츠 큐
- `GET /api/analytics` — 성과 분석
- `GET /api/channel-config` — 채널 연결 상태
- `POST /api/channel-config/threads` — Threads 크리덴셜 저장
- `POST /api/channel-config/x` — X 크리덴셜 저장
- `GET /api/token-status` — Claude/Threads/X 토큰 상태
- `GET /api/channel-settings` — 자동화 기능 토글 상태
- `GET /api/images` — 이미지 에셋 목록
- `GET /api/blog-queue` — 블로그 큐

## 서비스별 커스터마이징

모든 커스터마이징은 로컬 파일 (git에 안 올라감):

| 파일 | 용도 | 편집 방법 |
|------|------|----------|
| `data/prompt-guide.txt` | 콘텐츠 전략 | 대시보드 Settings |
| `data/search-keywords.txt` | 인기글 검색 키워드 | 대시보드 Settings |
| `config/cron/jobs.json` | Cron 주기/프롬프트 | 직접 편집 또는 대시보드 토글 |
| `.env` | API 토큰 | 직접 편집 또는 대시보드 채널 Settings |
| `config/openclaw.json` | 플러그인 설정 | 직접 편집 또는 대시보드 채널 Settings |

## 데이터 저장

모든 데이터는 `data/` 디렉토리에 flat file로 저장. DB 없음.

| 파일 | 용도 |
|------|------|
| `queue.json` | 콘텐츠 큐 (draft → approved → published) |
| `style-data.json` | 스타일 학습 (사용자 수정 이력 + 터진 글 패턴) |
| `popular-posts.txt` | 인기글 참고 (수동 + 외부 + 바이럴) |
| `growth.json` | 팔로워 추적 |
| `blog-queue.json` | 블로그 큐 |
| `analytics-history.json` | 성과 영구 보존 |
