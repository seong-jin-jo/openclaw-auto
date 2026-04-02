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
                                 ├── sample_blog          (자체 사이트 블로그 발행)
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

## 새 채널 추가 방법

1. `extensions/PLATFORM-publish/` 디렉토리 생성 (threads-publish 패턴 참고)
2. `config/openclaw.json`의 `plugins.entries`에 설정 추가
3. `threads-queue-tool.ts`의 `Channels` 타입에 채널 추가
4. Docker 이미지 리빌드 (`OPENCLAW_EXTENSIONS`에 포함)
5. 크론잡 프롬프트에 새 채널 발행 로직 추가
6. 대시보드 사이드바 + Settings에 채널 UI 추가

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
- `DASHBOARD_AUTH_TOKEN`: 대시보드 인증 토큰 (미설정 시 인증 비활성화)
- `VIRAL_THRESHOLD`: 터진 글 기준 views (기본: 500)

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
