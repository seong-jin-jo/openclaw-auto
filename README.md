# openclaw-auto — SNS 콘텐츠 자동화 시스템

OpenClaw 기반 콘텐츠 자동 생성/검수/발행/분석 파이프라인. 현재 Threads 지원, 플랫폼 확장 가능.

## 왜 OpenClaw인가 — n8n, 단순 LLM Agent와 비교

### 세 가지 자동화 접근법

```
┌──────────────────┬──────────────────┬───────────────────┬──────────────────────┐
│                  │ 단순 LLM Agent   │ n8n               │ OpenClaw             │
├──────────────────┼──────────────────┼───────────────────┼──────────────────────┤
│ 핵심 개념        │ 프롬프트 → 응답  │ 노드 → 노드 연결   │ Agent → Tool 호출    │
│ 실행 주체        │ LLM이 텍스트 생성 │ 워크플로우 엔진    │ LLM이 판단 + 실행     │
│ 분기/판단        │ 코드로 하드코딩   │ IF 노드 (수동 설계)│ LLM이 자율 판단       │
│ 확장 방식        │ 코드 수정         │ 노드 추가 (GUI)    │ 플러그인 등록 (SDK)   │
│ 스케줄링         │ crontab 직접     │ 내장 트리거        │ Cron → Agent 자동 호출│
│ 적합한 작업      │ 1회성 생성       │ 정해진 흐름 반복    │ 판단이 필요한 자동화   │
└──────────────────┴──────────────────┴───────────────────┴──────────────────────┘
```

### 컴퓨터공학 관점에서 차이

**단순 LLM Agent** — 순수 함수

```
사용자 → API 호출 → LLM → 텍스트 응답 → 끝
```

LLM은 `f(prompt) → text` 순수 함수. Side effect 없음. "글 올려줘" → LLM이 텍스트 생성 → **개발자가 별도 코드로** API 호출. LLM과 실행이 분리. 매번 접착 코드(glue code) 필요.

**n8n** — 정적 DAG

```
트리거 → [노드A] → [노드B] → [노드C] → 결과
              │         │
              └── IF 분기 (설계 시점에 결정)
```

DAG(방향성 비순환 그래프) 기반. 모든 분기를 사람이 미리 설계. "이 글 품질이 괜찮으면 발행하고, 토픽이 겹치면 삭제해" 같은 **맥락 판단**은 표현 불가. 컴파일 타임에 흐름 확정.

**OpenClaw** — 런타임 바인딩

```
┌─────────────────────────────────────────────┐
│              OpenClaw Gateway                │
│                                              │
│  Cron ──→ LLM Agent ──→ Tool Registry        │
│  (시간)   (판단)        (실행)                │
│                                              │
│  Agent가 상황을 보고 실행 시점에 결정:         │
│  "draft 5개 있는데 3개는 OK, 2개는 토픽 중복  │
│   → 2개 삭제 → 3개 승인 → 발행"              │
│                                              │
│  Tool Registry:                              │
│   threads_publish  ← 플러그인 A               │
│   threads_queue    ← 플러그인 B               │
│   threads_style    ← 플러그인 C               │
└─────────────────────────────────────────────┘
```

핵심 차이: **런타임 바인딩**. LLM이 실행 시점에 어떤 Tool을 어떤 순서로 호출할지 결정. 플러그인 등록만 하면 Agent가 자동으로 사용. 새 상황에 대해 워크플로우 수정 없이 LLM이 알아서 판단.

### 이 프로젝트에서 왜 OpenClaw인가

콘텐츠 생성→검수→발행 과정에서 **맥락 판단**이 필요하기 때문:
- "이 draft가 기존 글과 토픽 중복인가?"
- "인기글 트렌드에 맞는 톤인가?"
- "터진 글의 어떤 패턴을 학습해야 하나?"

이런 판단을 IF 노드로 하드코딩할 수 없다. LLM이 상황을 보고 Tool을 조합해서 처리.

## 전체 아키텍처

```
                     ┌──────────────────────────────────┐
                     │  최종 목표: 팔로워 → 사이트 유입    │
                     └──────────────┬───────────────────┘
                                    │
  ┌─────────────────────────────────────────────────────────────┐
  │                     OpenClaw Gateway                        │
  │                                                             │
  │  ┌────────────┐    ┌──────────────────┐    ┌─────────────┐ │
  │  │ Cron       │───▶│ Claude Agent     │───▶│ Tool        │ │
  │  │ (스케줄러)  │    │ (Sonnet 4.6)    │    │ Registry    │ │
  │  │            │    │                  │    │             │ │
  │  │ 6h: 생성   │    │ 프롬프트 → 판단  │    │ publish     │ │
  │  │ 4h: 발행   │    │ → Tool 호출     │    │ queue       │ │
  │  │ 6h: 수집   │    │ → 결과 확인     │    │ style       │ │
  │  │ 1w: 인기글 │    │ → 다음 행동     │    │ insights    │ │
  │  │ 1d: 팔로워 │    │                  │    │ search      │ │
  │  └────────────┘    └──────────────────┘    │ growth      │ │
  │                                             └─────────────┘ │
  └─────────────────────────────────────────────────────────────┘
                           │                         │
                    ┌──────┴──────┐            ┌─────┴──────┐
                    │ Threads API │            │ 로컬 파일   │
                    │ (발행/수집)  │            │ (data/)    │
                    └─────────────┘            └────────────┘
```

### 실행 흐름

스크립트/crontab 없음. 모든 자동화:

```
OpenClaw Cron (시간 도래)
  → Claude Agent 세션 생성 (isolated)
    → Agent가 한국어 프롬프트를 읽고 판단
      → Tool 호출 (threads_queue, threads_publish 등)
        → Tool이 Threads API 호출 / 로컬 파일 읽기쓰기
          → 결과를 Agent가 받아 다음 행동 결정
```

코드를 직접 실행하는 게 아니라, Cron이 Agent에게 **자연어 프롬프트**를 보내면 Agent(Claude Sonnet 4.6)가 상황을 판단해서 적절한 Tool을 호출한다.

### 데이터 흐름 (피드백 루프)

```
① 인기글 수집 (주 1회)
   search-keywords.txt → Threads Search API → popular-posts.txt
                                                       │
② 콘텐츠 생성 (6시간마다)                                ▼
   popular-posts.txt + style-data.json ──→ Agent ──→ queue.json (draft)
                     ▲                                     │
                     │                               ③ 검수 (사람)
                     │                               대시보드에서 승인/수정
                     │                                     │
                     │                               ④ 자동 발행 (2시간마다)
                     │                               queue.json → Threads API
                     │                                     │
                     │                               ⑤ 반응 수집 (6시간마다)
                     │                               Threads Insights API
                     │                                     │
                     └─── 터진 글 자동 피드 ←── views >= 500 감지
                          popular-posts.txt
                          style-data.json

⑥ 팔로워 추적 (매일)
   Threads Account API → growth.json
```

## 프로젝트 구조

```
ai-product-systems-lab/           # GitHub 레포 (이 저장소)
├── extensions/                   # 커스텀 OpenClaw 플러그인 (TypeScript)
│   ├── threads-publish/          #   → Threads API 발행
│   ├── threads-queue/            #   → queue.json 읽기/쓰기
│   ├── threads-style/            #   → style-data.json 읽기/쓰기
│   ├── threads-insights/         #   → 반응 수집 + 터진 글 감지
│   ├── threads-search/           #   → 키워드 기반 외부 인기글 수집
│   └── threads-growth/           #   → 팔로워 추적
│
├── config/                       # 설정 템플릿 (실제 설정은 gitignore)
│   ├── openclaw.json.example     #   Gateway + Plugin 설정 템플릿
│   └── cron/
│       └── jobs.json.example     #   Cron Job 5개 정의
│
├── dashboard/                    # 웹 대시보드 (Flask + Vanilla JS)
│   ├── Dockerfile                #   Python 3.12 slim
│   ├── server.py                 #   API 백엔드
│   ├── requirements.txt          #   flask>=3.0
│   └── static/
│       ├── index.html            #   SPA 진입점
│       └── app.js                #   Tailwind CSS + Vanilla JS
│
├── docker-compose.yml            # gateway(18789) + dashboard(3456)
├── .env.example                  # 환경변수 템플릿
├── CLAUDE.md                     # Agent용 프로젝트 문서
├── README.md                     # 이 파일
│
├── openclaw/                     # ⚠️ gitignore — 서버에서 별도 clone
│   └── (OpenClaw 오픈소스 전체)   #   extensions/ 에 커스텀 플러그인 복사 후 빌드
│
└── data/                         # ⚠️ gitignore — 런타임 데이터
    ├── queue.json                #   콘텐츠 큐
    ├── style-data.json           #   스타일 학습 데이터
    ├── growth.json               #   팔로워 추적
    ├── popular-posts.txt         #   인기글 참고
    ├── search-keywords.txt       #   검색 키워드
    ├── analytics-history.json    #   삭제된 글의 성과 이력 (영구 보존)
    └── trend-report.json         #   트렌드 분석 리포트
```

### gitignore 정책

| 경로 | Git 추적 | 이유 |
|------|---------|------|
| `extensions/` | ✅ 추적 | 커스텀 플러그인 코드 |
| `config/*.example` | ✅ 추적 | 설정 템플릿 |
| `dashboard/` | ✅ 추적 | 대시보드 코드 |
| `openclaw/` | ❌ 제외 | OpenClaw 오픈소스 (서버에서 별도 clone) |
| `config/openclaw.json` | ❌ 제외 | 토큰 포함 |
| `config/cron/jobs.json` | ❌ 제외 | 런타임 설정 |
| `.env` | ❌ 제외 | 시크릿 |
| `data/` | ❌ 제외 | 런타임 데이터 |

**데이터 저장 원리:** 모든 데이터는 `data/` 디렉토리에 flat file로 저장된다. DB 없음. 각 Tool이 직접 파일을 읽고 쓴다. 대시보드도 같은 파일을 직접 읽는다.

| 파일 | 읽는 주체 | 쓰는 주체 |
|------|----------|----------|
| `queue.json` | queue, insights, 대시보드 | queue, insights, 대시보드 |
| `style-data.json` | style, insights, 생성 Agent | style, insights |
| `popular-posts.txt` | search, insights, 생성 Agent | search, insights |
| `growth.json` | growth, 대시보드 | growth |
| `search-keywords.txt` | search, 대시보드 | 대시보드 |

## 6개 Tool 상세

각 Tool은 `openclaw/extensions/threads-*/` 의 TypeScript 플러그인이다.

### Tool이 실행되는 과정 (컴퓨터공학적 분석)

```
1. 등록 (빌드 타임)
   openclaw.plugin.json → 메타데이터 (이름, 설명)
   index.ts             → createTool(api) 호출하여 Tool 객체 반환
   src/*-tool.ts        → execute() 함수: 실제 비즈니스 로직

2. 로딩 (Gateway 기동 시)
   ~/.openclaw/openclaw.json의 plugins.entries에서 enabled=true인 플러그인 로드
   → 각 플러그인의 config (파일 경로, API 토큰 등)를 pluginConfig로 주입
   → Tool Registry에 {name, parameters(JSON Schema), execute} 등록

3. 호출 (Agent 런타임)
   Agent가 Tool 이름 + JSON 파라미터 전달
   → Gateway가 Registry에서 Tool 검색
   → execute(toolCallId, rawParams) 호출
   → 결과를 JSON으로 Agent에 반환
   → Agent가 결과를 보고 다음 행동 결정 (또 다른 Tool 호출 or 종료)
```

이것이 n8n과의 핵심 차이: n8n은 노드 연결이 **설계 시점**에 확정. OpenClaw은 Agent가 **실행 시점**에 어떤 Tool을 호출할지 결정. 같은 프롬프트라도 queue 상태에 따라 다른 Tool 조합을 호출할 수 있다.

### threads_publish — Threads API 2단계 발행

```
입력:  text (max 500자), image_url (선택 — 이미지 포스트)
동작:  POST /{userId}/threads (container 생성, TEXT 또는 IMAGE) → POST /{userId}/threads_publish (발행)
출력:  { success, threadsMediaId, containerId, mediaType }
인증:  plugin config의 accessToken + userId
```

### threads_queue — 콘텐츠 큐 CRUD (6개 action)

```
list          전체 목록 (statusFilter로 필터링)
add           draft 추가 (한국어 비율 30% 검증, 500자 제한, UUID 자동 생성)
update        상태/텍스트/스케줄/threadsMediaId/error 변경
delete        삭제
get_approved  approved + scheduledAt <= now 인 글 반환 (발행 대상)
cleanup       published 7일, failed 3일 이상 자동 삭제
```

Post 구조:
```json
{
  "id": "uuid",
  "text": "글 내용",
  "originalText": "수정 전 원본 (수정 시 자동 저장)",
  "topic": "AI코딩",
  "hashtags": ["AI", "코딩"],
  "status": "draft | approved | published | failed",
  "scheduledAt": "ISO | null (발행 예약 시간)",
  "threadsMediaId": "발행 후 Threads ID | null",
  "model": "claude-sonnet-4-6 | null",
  "abVariant": "A",
  "imageUrl": "https://... | null (이미지 포스트용)",
  "engagement": { "views": 0, "likes": 0, "replies": 0, "reposts": 0, "quotes": 0,
                   "collectCount": 0, "fedToPopular": false, "fedToStyle": false }
}
```

### threads_insights — 반응 수집 + 댓글 좋아요 + 저조 글 삭제

```
action: collect
1. queue.json에서 published + threadsMediaId 있는 글 필터
2. 24시간 이상 경과 + collectCount < 3 인 글만 수집
3. GET /{mediaId}/insights?metric=views,likes,replies,reposts,quotes
4. views >= VIRAL_THRESHOLD(기본 500) → 터진 글 판정
   → popular-posts.txt에 추가 (source: own-viral)
   → style-data.json에 viral_pattern으로 추가

action: auto_like_replies
1. 발행된 글의 댓글 목록 조회 (GET /{mediaId}/replies)
2. 각 댓글에 좋아요 (POST /{replyId}/likes)

action: cleanup_low_engagement
1. 발행 3일+ 경과 글 중 views < minViews(기본 100) AND likes < minLikes(기본 3) 필터
2. Threads API로 해당 글 삭제 (DELETE /{mediaId})
3. queue에서 status를 failed로 업데이트 (사유 기록)
```

### threads_search — 외부 인기글 수집

```
action: fetch
1. search-keywords.txt에서 키워드 로드
2. 키워드별 GET /{userId}/threads_search?q={keyword}&search_type=TOP&limit=25
3. 필터: likes >= 10, 한국어 20% 이상, 7일 이내, 자기 글 제외, 중복 제외
4. popular-posts.txt에 병합 (likes 내림차순, 최대 30개)
5. 초과분은 popular-posts-archive.txt로 아카이브
```

### threads_growth — 팔로워 추적

```
action: track
1. GET /{userId}/threads_insights?metric=followers_count (24h 윈도우)
2. GET /{userId}/threads_insights?metric=views (24h 윈도우)
3. 전일 대비 delta 계산
4. growth.json에 일별 기록 (같은 날 중복 시 덮어쓰기, 최대 90일 보관)
```

### threads_style — 스타일 학습 데이터 RAG

```
read     최근 20개 엔트리 반환 (Agent가 글 생성 시 참고)
add      원본→수정 쌍 기록 (editType: tone_change/length_adjust/style_rewrite/content_fix/format_change)
summary  통계: 편집 유형별 카운트, 평균 길이, 길이 트렌드
```

## 5개 Cron Job

`~/.openclaw/cron/jobs.json`에 정의. 각 Job의 `payload.message`가 Agent에게 전달되는 한국어 프롬프트.

| Cron Job | 주기 | Agent가 하는 일 |
|----------|------|----------------|
| `threads-generate-drafts` | 6시간 | popular-posts.txt + style-data.json 참고하여 글 5개 생성 → queue에 draft 저장 |
| `threads-auto-publish` | 2시간 | queue에서 approved + 시간 도래한 글 **1개만** 발행 (속도 제한) |
| `threads-collect-insights` | 6시간 | 반응 수집 + 댓글 자동 좋아요 + 3일 경과 저조 글 자동 삭제 |
| `threads-fetch-trending` | 주 1회 | search-keywords.txt 키워드로 외부 인기글 검색 → popular-posts.txt 갱신 |
| `threads-rewrite-trending` | 주 1회 | 인기글 트렌드 분석 → trend-report.json + 리라이팅 draft 생성 |
| `threads-track-growth` | 매일 | 팔로워 수/프로필 조회수 수집 → growth.json 갱신 |

Cron 관리:
```bash
openclaw cron list                     # 목록
openclaw cron run <id>                 # 수동 실행
openclaw cron runs --id <id>           # 실행 이력
```

## 대시보드

```bash
python3 dashboard/server.py    # http://localhost:3456
```

대시보드는 `data/` 디렉토리의 파일을 **직접 읽고 쓰는** Flask 앱이다. OpenClaw Tool과 같은 파일을 공유.

### API 엔드포인트

| 엔드포인트 | 메서드 | 데이터 소스 | 기능 |
|-----------|--------|-----------|------|
| `/api/queue` | GET | queue.json | 글 목록 (status 필터) |
| `/api/queue/{id}/approve` | POST | queue.json | 승인 (즉시 발행 가능 상태, 다음 cron에서 발행) |
| `/api/queue/{id}/update` | POST | queue.json | 텍스트/토픽/해시태그 수정 |
| `/api/queue/{id}/delete` | POST | queue.json | 삭제 |
| `/api/queue/bulk-approve` | POST | queue.json | 다건 승인 (2시간 간격 분산 예약) |
| `/api/queue/bulk-delete` | POST | queue.json | 다건 삭제 |
| `/api/trend-report` | GET | trend-report.json | 트렌드 분석 리포트 |
| `/api/analytics` | GET | queue.json | 토픽별 평균 반응, 터진 글 수 |
| `/api/growth` | GET | growth.json | 팔로워 일별 기록 |
| `/api/popular` | GET | popular-posts.txt | 인기글 (source 필터) |
| `/api/keywords` | GET/POST | search-keywords.txt | 검색 키워드 조회/수정 |
| `/api/overview` | GET | 전체 | 대시보드 상단 요약 |

### 탭 기능

| 탭 | 하는 일 |
|----|---------|
| Overview | 큐 상태, 팔로워, 터진 글, 크론 현황 요약 |
| Queue | draft 검수: 승인/수정/삭제, bulk approve/delete, 타임스탬프 표시 |
| Analytics | 포스트별 engagement, 토픽별 평균 반응 |
| Popular Posts | 인기글 (manual/own-viral/external 필터) |
| Trends | 키워드별 트렌드, 리라이팅 후보, 자동화 크론 상태 |
| Settings | 검색 키워드 편집, 콘텐츠 가이드 편집 |

## 설정

### OpenClaw 설정 (`~/.openclaw/openclaw.json`)

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["google/gemini-2.5-flash", "ollama/llama3.1:8b"]
      }
    }
  },
  "plugins": {
    "entries": {
      "threads-publish": { "enabled": true, "config": { "accessToken": "...", "userId": "..." } },
      "threads-queue":   { "enabled": true, "config": { "queuePath": "/abs/path/data/queue.json" } },
      "threads-style":   { "enabled": true, "config": { "stylePath": "/abs/path/data/style-data.json" } },
      "threads-insights": { "enabled": true, "config": { "accessToken": "...", "userId": "...", "queuePath": "...", "stylePath": "...", "popularPostsPath": "..." } },
      "threads-search":  { "enabled": true, "config": { "accessToken": "...", "userId": "...", "keywordsPath": "...", "popularPostsPath": "...", "archivePath": "..." } },
      "threads-growth":  { "enabled": true, "config": { "accessToken": "...", "userId": "...", "growthPath": "..." } }
    }
  }
}
```

### 인증

```bash
claude setup-token                                    # Claude Max 구독에서 토큰 발급
openclaw models auth login --provider anthropic       # OpenClaw에 등록
```

### 환경 변수

| 변수 | 필수 | 설명 | 기본값 |
|------|------|------|--------|
| `THREADS_ACCESS_TOKEN` | O (또는 plugin config) | Threads API access token | - |
| `THREADS_USER_ID` | O (또는 plugin config) | Threads user ID | - |
| `VIRAL_THRESHOLD` | X | 터진 글 기준 views | 500 |
| `MAX_POPULAR_POSTS` | X | popular-posts.txt 최대 보관 수 | 30 |
| `MIN_LIKES` | X | 외부 인기글 최소 좋아요 | 10 |
| `SEARCH_DAYS` | X | 외부 인기글 검색 기간(일) | 7 |
| `DASHBOARD_PORT` | X | 대시보드 포트 | 3456 |

## 사용법

### 수동 Tool 실행 (CLI)

```bash
openclaw agent --agent main --message "threads_queue로 draft 목록 보여줘"
openclaw agent --agent main --message "threads_queue로 [id] 승인하고 2시간 후 발행 예약해"
openclaw agent --agent main --message "threads_insights로 반응 수집해"
openclaw agent --agent main --message "threads_growth로 팔로워 추적해"
openclaw agent --agent main --message "threads_search로 인기글 수집해"
```

### 운영

일상적으로 할 일은 **검수 하나**뿐.

1. 대시보드 접속 (http://localhost:3456)
2. Queue 탭에서 draft 확인
3. 괜찮으면 Approve (다음 auto-publish cron에서 자동 발행)
4. 수정 필요하면 Edit → 수정 후 Approve
5. 별로면 Delete

나머지(생성, 발행, 반응 수집, 인기글 수집, 팔로워 추적)는 Cron이 자동 처리.

## 로드맵

### 완료: 기본 구조

```
  ① 인기글 수집 ───────────────────────────────┐
     (주 1회, 외부 트렌딩)                       │
                                               ▼
  ② 콘텐츠 생성 ◀── popular-posts.txt + style-data.json
     (6시간마다, AI)           │
                              ▼
  ③ 검수 (사람) ──── 대시보드에서 승인/수정
                              │
                              ▼
  ④ 자동 발행 ──── Threads API (2시간마다)
                              │
                              ▼
  ⑤ 반응 수집 ──── views/likes/replies (6시간마다)
         │
         ├─ 터진 글 → popular-posts.txt 자동 피드 ──→ ②
         └─ 터진 글 패턴 → style-data.json 자동 학습 ─→ ②

  ⑥ 팔로워 추적 ──── growth.json (일 1회)
```

핵심: **⑤→② 피드백 루프** — 터진 글이 자동으로 다음 생성에 반영되어 품질 점진적 개선.

| Phase | 내용 | 상태 |
|-------|------|------|
| MVP | 글 생성/발행/검수 파이프라인 | 완료 |
| 1 | 반응 수집 + 터진 글 자동 학습 (피드백 루프) | 완료 |
| 2a | 외부 인기글 수집 (Threads Search API) | 완료 |
| 2b | 팔로워 추적 (Account Insights API) | 완료 |
| 2c | 콘텐츠 대시보드 (Flask) | 완료 |
| 2d | 아키텍처 전환: scripts/ 제거 → OpenClaw 완전 자동화 | 완료 |

### 다음: A/B 테스트 구조

같은 주제의 글을 다른 변수(톤/길이/포맷)로 발행하여 반응을 비교하고, 승자 패턴을 자동 학습.

```
기본 구조:
  생성 → [A만] → 발행 → 반응 수집 → 터진 글 피드

A/B 구조:
  생성 → [A + B 쌍] → 둘 다 발행 → 반응 수집 → A vs B 비교 → 승자 패턴 학습
              │                                        │
              │  experimentId로 묶임                     │
              │  같은 주제, 다른 변수                     ▼
              │                              style-data.json에
              └──────────────────────────── ab_winner로 기록
                                            → 다음 생성에 반영
```

**테스트 변수:**

| 변수 | A | B | 측정 |
|------|---|---|------|
| 길이 | 짧은 글 (100자) | 긴 글 (400자) | views, likes |
| 톤 | 구어체 ("~임") | 존댓말 ("~요") | engagement rate |
| 해시태그 | 2개 | 4개 | reach (views) |
| 포맷 | 텍스트만 | 링크 포함 | 클릭/유입 |
| CTA | 없음 | "어떻게 생각하세요?" | replies |

**구현 순서:**

| Step | 작업 | 변경 대상 | 상태 |
|------|------|----------|------|
| 3a | Post에 `experimentId`, `experimentVar` 필드 추가 | `threads-queue` | 예정 |
| 3b | 생성 프롬프트에 A/B 쌍 생성 지시 | Cron `threads-generate-drafts` | 예정 |
| 3c | `analyze_experiments` action (A/B 비교 + 승자 판정) | `threads-insights` | 예정 |
| 3d | Experiments 탭 (A vs B 비교 차트, 변수별 승률) | `dashboard` | 예정 |
| 3e | 승자 패턴 → style-data.json 자동 피드 | `threads-insights` | 예정 |
| 3f | 링크 포스트 A/B (사이트 유입 측정) | `threads-publish` 확장 | 예정 |

기존 코드의 `abVariant` 필드를 활용. `experimentId`로 A/B 쌍을 그룹핑하는 것만 추가하면 시작 가능.

### Phase 4: 유입 최적화

| Step | 내용 |
|------|------|
| 4a | 링크 포스트 발행 (사이트 URL + UTM 파라미터) |
| 4b | 캐러셀/투표 포맷 실험 |
| 4c | Webhook 기반 댓글 자동 응답 |

## Fork & Deploy (멀티 프로덕트)

이 레포를 중앙 허브로 두고, 각 제품/팀에서 fork하여 독립 운영할 수 있다.

### 구조

```
이 레포 (중앙 허브)
  ├── fork → org-A/openclaw-auto   (팀 A — 팀원 접근 가능)
  ├── fork → org-B/openclaw-auto   (팀 B — 팀원 접근 가능)
  └── clone → 개인 서버             (개인 프로덕트 — fork 불필요)
```

### 제품별로 다른 것 (로컬에만, .gitignore)

| 파일 | 설명 |
|------|------|
| `.env` | API 토큰, 계정 정보 |
| `config/openclaw.json` | 플러그인 설정, 모델 선택 |
| `config/cron/jobs.json` | 발행 주기, 생성 프롬프트 |
| `data/prompt-guide.txt` | 콘텐츠 전략, 타겟, 톤 |
| `data/queue.json` | 콘텐츠 큐 |
| `data/popular-posts.txt` | 인기글 참고 데이터 |
| `data/search-keywords.txt` | 검색 키워드 |

### 공통 코드 (git 추적, 모든 fork가 공유)

| 경로 | 설명 |
|------|------|
| `extensions/` | OpenClaw 플러그인 (publish, queue, insights 등) |
| `dashboard/` | 웹 대시보드 |
| `docker-compose.yml` | 컨테이너 구성 |
| `scripts/` | 유틸리티 스크립트 |

### Fork 후 셋업

```bash
# 1. Fork (GitHub UI) 또는 직접 clone
git clone git@github.com:your-org/openclaw-auto.git
cd openclaw-auto

# 2. upstream 등록 (중앙 레포에서 업데이트 받기 위해)
git remote add upstream git@github.com:원본유저/openclaw-auto.git

# 3. 제품별 설정 (로컬만, git에 안 올라감)
cp .env.example .env
cp config/openclaw.json.example config/openclaw.json
cp config/cron/jobs.json.example config/cron/jobs.json

# 4. 제품 전략 작성
vim data/prompt-guide.txt    # 타겟, 톤, 콘텐츠 유형 정의

# 5. 실행
docker compose up -d --build
```

### 코드 동기화

```bash
# 중앙 레포의 최신 코드 가져오기
git fetch upstream
git merge upstream/main

# 내가 개선한 공통 코드를 중앙 레포에 반영
git push upstream main          # 직접 push (권한 있으면)
# 또는
gh pr create --repo 원본유저/openclaw-auto   # PR
```

### fork에서 extension 추가/수정 후 원본에 반영하기

예: fork에서 `extensions/twitter-publish/` 새로 만든 경우

```bash
# fork 레포에서 개발 완료 후
git add extensions/twitter-publish/
git commit -m "Add Twitter publish extension"

# 원본 레포에 반영 (2가지 방법)
# 방법 1: 직접 push (권한 있으면)
git push upstream main

# 방법 2: PR
git push origin main    # fork에 먼저 push
gh pr create --repo 원본유저/openclaw-auto --title "Add Twitter publish"

# 다른 fork에서 최신화
git fetch upstream && git merge upstream/main
cp -r extensions/twitter-* openclaw/extensions/  # submodule에 복사
docker compose up -d --build
```

주의: `extensions/` 코드만 원본에 반영. `data/`, `.env`, `config/openclaw.json` 등 서비스별 파일은 절대 push하지 않음 (.gitignore 처리됨).

### 대시보드 사용법

대시보드에서 서비스별 커스터마이징 가능:

| 탭 | 기능 |
|----|------|
| **Overview** | 큐 상태, 팔로워, 터진 글, Cron 현황 (다음/마지막 실행) |
| **Queue** | draft 검수: 승인/수정/삭제, bulk approve. 최신순 정렬, 이미지 미리보기 |
| **Analytics** | 포스트별 engagement, 토픽별 평균 반응 |
| **Popular Posts** | 인기글 (manual/own-viral/external 필터) |
| **Settings** | Content Guide (전략/톤/타겟 편집), 검색 키워드 편집, Threshold 설정 |

**Settings 탭에서 튜닝할 수 있는 것:**
- **Content Guide** (`prompt-guide.txt`) — 타겟 오디언스, 톤, 콘텐츠 유형, 금지사항 등. AI가 글 생성할 때 이 가이드를 최우선으로 따름.
- **Search Keywords** (`search-keywords.txt`) — 인기글 수집에 사용할 키워드
- **Thresholds** — 터진 글 기준 views, 최소 좋아요, 검색 기간 등

### 플랫폼 확장

새 플랫폼 추가 시:
1. `extensions/` 에 새 tool 추가 (예: `twitter-publish/`, `instagram-publish/`)
2. `docker-compose.yml`의 `OPENCLAW_EXTENSIONS` build arg에 추가
3. `config/openclaw.json`에 해당 플러그인 설정 (토큰 등)
4. 대시보드는 queue.json 기반이라 플랫폼 무관하게 동작

## 온프레미스 배포

### 사전 준비

```bash
# Git
sudo apt update && sudo apt install -y git

# Docker + Docker Compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# ※ 로그아웃 후 재로그인 (docker 그룹 적용)
sudo apt install -y docker-compose-plugin
```

### 최초 설치

```bash
# 1. 프로젝트 클론
git clone https://github.com/seong-jin-jo/ai-product-systems-lab.git
cd ai-product-systems-lab

# 2. OpenClaw 소스 클론 (Docker 빌드에 필요, 1회만)
git clone https://github.com/openclaw/openclaw.git openclaw

# 3. 커스텀 플러그인을 OpenClaw 소스에 복사
cp -r extensions/threads-* openclaw/extensions/

# 4. 환경변수 설정
cp .env.example .env
vim .env   # OPENCLAW_GATEWAY_TOKEN, THREADS_ACCESS_TOKEN, THREADS_USER_ID 입력

# 5. Gateway 설정
cp config/openclaw.json.example config/openclaw.json
# 토큰 교체 (YOUR_GATEWAY_TOKEN, YOUR_THREADS_ACCESS_TOKEN, YOUR_THREADS_USER_ID)
sed -i 's/YOUR_GATEWAY_TOKEN/<게이트웨이토큰>/g' config/openclaw.json
sed -i 's|YOUR_THREADS_ACCESS_TOKEN|<스레드토큰>|g' config/openclaw.json
sed -i 's/YOUR_THREADS_USER_ID/<유저ID>/g' config/openclaw.json

# 6. Cron 설정
cp config/cron/jobs.json.example config/cron/jobs.json

# 7. 데이터 디렉토리 생성
mkdir -p data

# 8. 빌드 + 실행 (첫 빌드 10~20분)
docker compose up -d --build
```

### 서비스 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| `openclaw-gateway` | **18789** | OpenClaw Gateway (커스텀 플러그인 포함) |
| `dashboard` | **3456** | Flask 대시보드 |

### 볼륨 매핑

| 호스트 | 컨테이너 | 용도 |
|--------|----------|------|
| `./config/` | `/home/node/.openclaw/` | openclaw.json + cron/jobs.json |
| `./data/` | `/home/node/data/` (gateway), `/app/data/` (dashboard) | 데이터 파일 |

### Cloudflare Tunnel 매핑

```yaml
# Cloudflare tunnel config
- hostname: dashboard.example.com
  service: http://localhost:3456
- hostname: gateway.example.com    # 필요 시
  service: http://localhost:18789
```

### 검증

```bash
docker compose ps                                    # 서비스 상태
curl http://localhost:18789/healthz                   # Gateway 헬스체크
curl http://localhost:3456/api/overview               # Dashboard API
docker compose logs openclaw-gateway --tail 50        # Gateway 로그
docker compose logs dashboard --tail 50               # Dashboard 로그
```

## 개발 → 배포 워크플로우

```
┌─────────────────────┐         ┌──────────────────────┐
│  WSL (개발)          │  push   │  GitHub (중앙 허브)    │
│                     │ ──────▶ │                      │
│  Claude Code로 튜닝  │         │  openclaw-auto        │
│  extensions/ 수정   │  pull   │                      │
│  dashboard/ 수정    │ ◀────── │                      │
│                     │         │                      │
│  git commit + push  │         │  다른 WSL에서 pull     │
└─────────────────────┘         └──────────────────────┘
```

### 코드 수정 후 반영

```bash
# 코드 수정 + 커밋
git add extensions/ dashboard/
git commit -m "설명"
git push origin main

# 다른 WSL에서 최신화
git pull origin main
docker compose up -d --build    # extensions 변경 시 rebuild 필요
```

### 언제 `--build`가 필요한가

| 변경 내용 | 명령어 |
|----------|--------|
| `extensions/` 플러그인 코드 | `docker compose up -d --build` |
| `dashboard/server.py` 또는 `static/` | 자동 반영 (볼륨 마운트) |
| `config/` 설정 | `docker compose restart` |
| `data/` 데이터 | 자동 반영 (볼륨 마운트) |
