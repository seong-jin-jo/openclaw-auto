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
    "x": { "status": "pending", "tweetId": null, "publishedAt": null, "error": null }
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
| `threads-collect-insights` | 6h | Haiku | 반응 수집 + 댓글 좋아요 + 저조 삭제 |
| `threads-fetch-trending` | 주1회 | Haiku | 외부 인기글 수집 |
| `threads-track-growth` | 매일 | Haiku | 팔로워 추적 |

## 대시보드

Flask + Vanilla JS SPA. 구조:
- Marketing Home: 채널 그리드 + 주간 성과 + 크론 상태 + 활동 타임라인
- 채널별 페이지: Queue / Analytics / Growth / Popular / Settings (credential + guide + keywords)
- Settings: 채널 연결 + AI Engine + Account
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

### 멀티 테넌트
현재: 프로젝트별 독립 인스턴스 (dark/romeo)
목표: 하나의 서버에서 여러 고객 관리
- 고객별 data/ 디렉토리 분리
- config/openclaw.json 고객별 격리
- 대시보드 로그인 → 고객 식별 → 해당 데이터만 표시
