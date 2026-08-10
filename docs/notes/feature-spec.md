# 기능 명세 — openclaw-auto

모든 fork가 참조하는 기능 사양서. 각 기능의 동작 방식과 구현 상태를 정의한다.

---

## 채널 관리

### 공통 동작

- 사이드바: 모든 채널 클릭 가능 (미설정=기본, 연결됨=Connected 뱃지, Live=초록 뱃지)
- 아이콘: SVG 브랜드 로고 (`src/lib/channel-icons.tsx`), 미등록 채널은 첫 글자 fallback
- Credential 저장 시 실제 API 검증 (`src/lib/verify-channel.ts`)
- 채널 26개 정의 (`src/lib/constants.ts > CH_LABELS`)

### 카테고리 분류

| 카테고리 | 채널 |
|----------|------|
| Social | Threads, X, Instagram, Facebook, LinkedIn, Bluesky, Pinterest, Tumblr |
| Video | TikTok, YouTube |
| Blog | Naver Blog, Medium, Substack |
| Messaging | Telegram, Discord, Slack, LINE, Kakao, WhatsApp |
| Data & SEO | Google Analytics, Search Console, Google Business |
| Custom | Custom API, RSS Feed |

### Threads

- **탭**: Queue / Analytics / Growth / Popular / Settings
- **인증**: Long-lived Access Token (60일 갱신)
- **글자수**: 500자
- **Settings**: Credentials + Channel Info + Setup Guide + Automation 토글 + Parameters + Content Guide + Keywords
- **Analytics**: 반응 수집 (views/likes/replies), 바이럴 감지, 토픽/해시태그 분석
- **Growth**: 팔로워 수 일간 추적 차트
- **Popular**: 키워드 기반 외부 인기글 수집 목록
- **자동화**: content_generation, auto_publish, insights_collection, auto_like_replies, trending_collection, follower_tracking, instagram_carousel

### X (Twitter)

- **탭**: Queue / Analytics / Settings
- **인증**: OAuth 1.0a (Consumer Keys + Access Token, 4개 키)
- **글자수**: 280자 (자동 압축)
- **Settings**: Credentials (2그룹: 소비자 키 / 액세스 토큰) + Channel Info + Setup Guide + Content Guide + Keywords
- **검증**: 4개 키 존재 여부 확인 (OAuth 서명 미검증)

### Instagram

- **전용 페이지**: `InstagramPage` 컴포넌트 (별도 구현)
- **탭**: Queue / Editor / Settings
- **인증**: Instagram Graph API (Access Token + User ID)
- **Queue**: 캐러셀 미리보기, 필터 (all/draft/approved/published), 벌크 승인/삭제, 이미지 첨부 필수
- **Editor**: 슬라이드 편집기 (카드뉴스 생성)
- **카드뉴스**: AI 초안 생성 (`/api/card-news/outline` + `/api/card-news/generate`), 슬라이드별 편집
- **디자인 도구 연동**: Figma/Canva로 내보내기

### Messaging (Telegram / Discord / Slack / LINE / Kakao / WhatsApp)

- **전용 페이지**: `MessagingPage` 컴포넌트
- **Content Guide / Keywords 없음** (콘텐츠 생성 채널이 아님)
- **Credentials**: 채널별 인증 (Bot Token, Webhook URL 등)
- **알림 발송**: 이벤트별 ON/OFF (onPublish, onViral, onError, weeklyReport)
- **테스트 발송**: 즉시 메시지 전송으로 연결 확인
- **Interactive Chat**: 양방향 대화 가능 채널 표시 (Telegram 등)

### Data & SEO 채널

- **전용 페이지**: `DataChannelPage` 컴포넌트
- **Credentials + Setup Guide만** (콘텐츠 생성/발행 없음)
- Google Analytics, Search Console, Google Business

### Generic 채널

- **탭 없음** — 인라인 레이아웃으로 직접 표시
- **구성**: Credentials + Setup Guide + Content Guide + Keywords
- 대상: Social/Video/Blog 카테고리 중 Threads/X/Instagram이 아닌 채널 (Facebook, LinkedIn, Bluesky, Pinterest, Tumblr, TikTok, YouTube, Naver Blog, Medium, Substack 등)
- "공통에서 복사" 버튼으로 공통 가이드/키워드 동기화

---

## 콘텐츠 관리

### Queue

- **통합 큐**: 모든 채널의 발행 대기열을 하나로 관리 (`data/queue.json`)
- **필터**: all / draft / approved / published / failed
- **벌크 작업**: 일괄 승인 (`/api/queue/bulk-approve`), 일괄 삭제 (`/api/queue/bulk-delete`)
- **포스트 카드** (`PostCard` 컴포넌트): 본문 미리보기, 상태 뱃지, 채널별 발행 상태, 승인/편집/삭제 버튼
- **이미지 첨부**: 포스트별 이미지 추가 (`/api/queue/[postId]/add-image`)
- **채널별 상태**: 각 포스트가 채널마다 독립적 상태 (pending/published/failed/skipped)

### Blog Queue

- **별도 큐**: 블로그 전용 발행 대기열 (`data/blog-queue.json`)
- **API**: `/api/blog-queue` (CRUD), `/api/blog-queue/[postId]/approve|delete|update`
- **블로그 통계**: `/api/blog-stats`
- **이미지 업로드**: `/api/blog-upload-image`

### Content Guide

- **공통 파일**: `data/prompt-guide.txt`
- **채널별 파일**: `data/prompt-guide.{channel}.txt`
- **편집**: 채널 Settings에서 채널 전용 파일로 저장
- **공통에서 복사**: 공통 가이드를 채널 전용으로 복사
- **AI 제안**: `/api/ai-suggest/guide` — 현재 가이드 기반 개선 또는 업종 기반 새 작성
- **적용 대상**: Social, Video, Blog 채널만 (Messaging, Data 제외)

### Keywords

- **공통 파일**: `data/search-keywords.txt`
- **채널별 파일**: `data/search-keywords.{channel}.txt`
- **편집**: 줄바꿈 구분, `#`으로 시작하는 줄은 주석
- **공통에서 복사**: 공통 키워드를 채널 전용으로 복사
- **AI 제안**: `/api/ai-suggest/keywords` — 15~25개 키워드 카테고리별 제안
- **적용 대상**: Social, Video, Blog 채널만

### Keyword Bank (전역)

- **Settings > Keywords 탭**에서 관리
- **API**: `/api/keyword-bank` (조회), `/api/keyword-bank/add` (추가), `/api/keyword-bank/remove` (삭제), `/api/keyword-bank/mark-used` (사용 표시)
- **키워드 리서치**: `/api/keyword-research`
- **KW Planner**: `/api/kw-planner-config` (Google Keyword Planner 설정)

---

## 자동화

### Cron Jobs

| 크론잡 | 주기 | 모델 | 설명 | 상태 |
|--------|------|------|------|------|
| `threads-generate-drafts` | 6h | Sonnet | prompt-guide 기반 draft 생성 | 구현됨 |
| `multi-channel-publish` | 2h | Haiku | 승인 글 멀티채널 발행 | 구현됨 |
| `instagram-generate-drafts` | 6h | Sonnet | Instagram 카드뉴스 콘텐츠 생성 | 구현됨 |
| `instagram-auto-publish` | 2h | Haiku | Instagram 이미지 글 자동 발행 | 구현됨 |
| `threads-collect-insights` | 6h | Haiku | 반응 수집 + 댓글 좋아요 | 구현됨 |
| `threads-fetch-trending` | 주1회 | Haiku | 외부 인기글 수집 | 구현됨 |
| `threads-track-growth` | 매일 | Haiku | 팔로워 추적 | 구현됨 |

### Automation Features (15개)

| key | label | 상태 |
|-----|-------|------|
| `content_generation` | Content Generation | 구현됨 (기본 ON) |
| `auto_publish` | Auto Publish | 구현됨 (기본 ON) |
| `insights_collection` | Insights Collection | 구현됨 (기본 ON) |
| `auto_like_replies` | Auto Like Replies | 구현됨 (기본 ON) |
| `trending_collection` | Trending Collection | 구현됨 (기본 ON) |
| `follower_tracking` | Growth Tracking | 구현됨 (기본 ON) |
| `instagram_carousel` | Instagram Carousel | 구현됨 (기본 OFF) |
| `auto_reply` | Auto Reply | Coming Soon |
| `low_engagement_cleanup` | Low Engagement Cleanup | Coming Soon |
| `trending_rewrite` | Trending Rewrite | Coming Soon |
| `quote_trending` | Quote Trending | Coming Soon |
| `series_followup` | Series Follow-up | Coming Soon |
| `casual_posts` | Casual Posts | Coming Soon |
| `image_generation` | Image Generation | Coming Soon |
| `youtube_shorts` | YouTube Shorts | Coming Soon |

### Automation 토글

- **UI**: 채널 Settings의 Automation 섹션 (Threads 채널에서만 노출)
- **저장**: `jobs.json`과 연동
- **토글 API**: `/api/cron/[jobName]/toggle`, `/api/cron/[jobName]/interval`
- **상태 확인**: `/api/cron-status`, `/api/cron-check`, `/api/cron-runs`
- Coming Soon feature: 토글 비활성화 (opacity-40) + "Coming Soon" 텍스트

---

## Settings (전역)

### 8탭 구조

| 탭 | 컴포넌트 | 설명 |
|----|----------|------|
| Channels | `ChannelsSettings` | 채널 연결 현황 |
| AI Engine | `LlmModel` + `ClaudeToken` + `AIEngine` | LLM 모델 선택 + OAuth 토큰 + Runtime 전환 |
| Storage | `StorageSettings` | Cloudflare R2 스토리지 설정 |
| Design Tools | `DesignToolsSettings` | Canva/Figma 크레덴셜 + Figma MCP OAuth |
| Notifications | `SlackSettings` | Slack 알림 설정 + 주간 리포트 |
| Keywords | `KeywordBankSettings` + `KwPlannerSettings` | 키워드 뱅크 + Google KW Planner |
| Video / TTS | `ElevenLabsSettings` | ElevenLabs TTS 설정 |
| System | `SystemSettings` | 크론 상태 + 계정 |

### AI Engine 상세

- **LLM Model**: primary 모델 + fallbacks 설정 (`config/openclaw.json`)
- **Claude Token**: Max Plan OAuth 토큰 상태 확인 (`/api/claude-token`)
- **Runtime**: Gateway / Claude CLI 전환 카드 (`/api/ai-runtime`)
  - Gateway: 파란 테두리 (`border-blue-600 bg-blue-950/30`), Extra Usage 과금
  - CLI: 초록 테두리 (`border-green-600 bg-green-950/30`), Max Plan Usage
- **크론잡별 모델 오버라이드**: 콘텐츠 생성=Sonnet/Opus, 발행/수집=Haiku

---

## 온보딩

### 3단계 위저드 (`OnboardingWizard`)

1. **업종 선택**: 카페, 뷰티, 음식점, 피트니스, 쇼핑, 테크, 교육, 기타 (8개)
2. **채널 선택**: Threads, X, Instagram, Facebook, Telegram (5개 주요 채널)
3. **채널 연결**: 선택한 첫 번째 채널의 Credential 입력 + Setup Guide 표시

- **진입 조건**: 온보딩 미완료 + 연결된 채널 0개 + 미닫힘
- **저장**: `/api/onboarding` — `data/settings.json`에 `onboardingComplete`, `industry` 저장 + `prompt-guide.txt` 자동 생성
- **건너뛰기**: "나중에 설정하기" 버튼으로 닫기 가능 (UI 상태로 기억)
- **스텝 표시기**: 보라색 progress bar (3칸)

---

## Marketing Home (전역 대시보드)

- **채널 그리드**: 12개 주요 채널 아이콘 (연결된 채널=초록 도트, 클릭 시 채널 페이지)
- **성과 카드**: 총 발행 수, 승인 대기, 채널별 발행 수
- **크론 상태**: 각 크론잡 상태 (정상/에러/정지), 마지막 실행 시간
- **Alerts**: 바이럴 감지, 크론 에러, 시스템 알림 (`/api/alerts`)
- **활동 타임라인**: 최근 발행/수집/알림 이벤트 (`/api/activity`)
- **주간 요약**: 주간 성과 요약 카드 (`/api/weekly-summary`)
- **토큰 상태**: Claude API 토큰 상태 확인 (`/api/token-status`)
- **Agent 로그**: 최근 AI agent 실행 로그 (`/api/agent-logs`)

---

## AI 기능

### Content Guide AI 제안

- **API**: `POST /api/ai-suggest/guide`
- **입력**: channel, industry (선택), currentGuide (선택)
- **출력**: 개선된 가이드 텍스트 (목적/타겟/톤/유형/주제 섹션)
- **실행**: Gateway 컨테이너에서 AI agent 호출

### Keywords AI 제안

- **API**: `POST /api/ai-suggest/keywords`
- **입력**: channel, industry (선택), currentKeywords (선택)
- **출력**: 15~25개 키워드 (핵심/트렌드/롱테일/경쟁사 카테고리)
- **UI**: 태그 형태로 표시, 개별 클릭 추가

### 카드뉴스 AI 초안

- **Outline**: `POST /api/card-news/outline` — 슬라이드 구성 초안
- **Generate**: `POST /api/card-news/generate` — 슬라이드별 콘텐츠 생성
- **Card Generate**: `POST /api/generate-card` — 개별 카드 이미지 생성

### 이미지 생성

- **AI 이미지**: `POST /api/generate-image` — 본문 기반 이미지 생성
- **Midjourney**: `POST /api/midjourney/generate` — Midjourney 연동 이미지 생성

### 비디오 생성

- **스크립트**: `POST /api/video/script-from-blog` — 블로그 글에서 영상 스크립트 생성
- **생성**: `POST /api/video/generate` — ElevenLabs TTS 기반 영상 생성
- **발행**: `POST /api/video/publish` — 생성된 영상 발행
- **관리**: `GET /api/video/list`, `DELETE /api/video/delete`

---

## 이미지 관리

- **갤러리**: `GET /api/images` — 업로드된 이미지 목록
- **업로드**: `POST /api/images/upload` — R2로 이미지 업로드
- **개별 조회**: `GET /api/images/[filename]`

---

## 외부 연동

### Google Analytics

- **설정**: `/api/ga-config` (Property ID 등)
- **데이터**: `/api/ga-analytics` (트래픽 분석)

### Google Search Console

- **설정**: `/api/gsc-config` (사이트 URL)
- **데이터**: `/api/gsc-analytics` (검색 성과)
- **색인**: `/api/gsc-index` (색인 요청)

### Google Trends

- **데이터**: `/api/google-trend` (트렌드 조회)

### Naver Trends

- **설정**: `/api/naver-datalab-config`
- **데이터**: `/api/naver-trend`
- **검색 어드바이저**: NSA 데이터 (`/api/nsa-data`)

### Figma

- **연동**: `/api/figma/create-slides`, `/api/figma/export`, `/api/figma/export-to-queue`
- **MCP OAuth**: `/api/figma-mcp/start-oauth`, `/api/figma-mcp/callback`
- **토큰**: `/api/design-tools/figma-mcp-tokens`

### YouTube

- **OAuth**: `/api/youtube/auth-url`, `/api/youtube/callback`, `/api/youtube/refresh`
- **상태**: `/api/youtube/status`

---

## 알림 시스템

### 알림 이벤트

| 이벤트 | 설명 |
|--------|------|
| onPublish | 콘텐츠 발행 시 알림 |
| onViral | 바이럴 감지 시 알림 |
| onError | 크론 에러 시 알림 |
| weeklyReport | 주간 리포트 발송 |

### 알림 채널

- Messaging 채널 (Telegram, Discord, Slack, LINE, Kakao, WhatsApp) 중 연결된 채널로 발송
- **API**: `/api/notification-settings` (설정), `/api/send-notification` (발송), `/api/notification-log` (로그)
- **Slack 전용**: `/api/slack-config`, `/api/slack-test`, `/api/slack-send-custom`, `/api/slack-template`, `/api/slack-report-preview`

### 주간 리포트

- **생성**: `/api/weekly-report`
- **발송**: `/api/weekly-report/send`
- **트렌드 리포트**: `/api/trend-report`

---

## API 목록

### 채널 관리

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/channel-config` | GET | 전체 채널 설정 조회 |
| `/api/channel-config/[channel]` | GET/POST | 채널별 설정 조회/저장 (credential 검증 포함) |
| `/api/channel-settings` | GET | 전체 채널 설정 |
| `/api/channel-settings/[channel]` | GET/POST | 채널별 설정 |
| `/api/chat-channels` | GET | Interactive Chat 채널 목록 |

### 큐 관리

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/queue` | GET | 큐 목록 조회 |
| `/api/queue/add` | POST | 큐에 포스트 추가 |
| `/api/queue/bulk-approve` | POST | 일괄 승인 |
| `/api/queue/bulk-delete` | POST | 일괄 삭제 |
| `/api/queue/[postId]/approve` | POST | 개별 승인 |
| `/api/queue/[postId]/delete` | POST | 개별 삭제 |
| `/api/queue/[postId]/update` | POST | 개별 수정 |
| `/api/queue/[postId]/add-image` | POST | 이미지 첨부 |

### 블로그

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/blog-queue` | GET | 블로그 큐 조회 |
| `/api/blog-queue/approve` | POST | 블로그 일괄 승인 |
| `/api/blog-queue/delete` | POST | 블로그 일괄 삭제 |
| `/api/blog-queue/update` | POST | 블로그 일괄 수정 |
| `/api/blog-queue/[postId]/approve` | POST | 블로그 개별 승인 |
| `/api/blog-queue/[postId]/delete` | POST | 블로그 개별 삭제 |
| `/api/blog-queue/[postId]/update` | POST | 블로그 개별 수정 |
| `/api/blog-guide` | GET/POST | 블로그 가이드 |
| `/api/blog-keywords` | GET/POST | 블로그 키워드 |
| `/api/blog-stats` | GET | 블로그 통계 |
| `/api/blog-upload-image` | POST | 블로그 이미지 업로드 |

### 콘텐츠 가이드 / 키워드

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/guide` | GET | 공통 가이드 조회 |
| `/api/guide/[channel]` | GET/POST | 채널별 가이드 |
| `/api/keywords` | GET | 공통 키워드 조회 |
| `/api/keywords/[channel]` | GET/POST | 채널별 키워드 |
| `/api/ai-suggest/guide` | POST | AI 가이드 제안 |
| `/api/ai-suggest/keywords` | POST | AI 키워드 제안 |

### AI / LLM

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/ai-runtime` | GET/POST | Runtime 모드 조회/전환 |
| `/api/llm-config` | GET/POST | LLM 설정 |
| `/api/claude-token` | GET | Claude 토큰 상태 |
| `/api/token-status` | GET | 전체 토큰 상태 |

### 크론 / 자동화

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/cron-status` | GET | 크론 상태 조회 |
| `/api/cron-check` | GET | 크론 헬스 체크 |
| `/api/cron-runs` | GET | 크론 실행 이력 |
| `/api/cron/[jobName]/toggle` | POST | 크론잡 활성화/비활성화 |
| `/api/cron/[jobName]/interval` | POST | 크론잡 주기 변경 |

### 이미지 / 디자인

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/images` | GET | 이미지 목록 |
| `/api/images/upload` | POST | 이미지 업로드 |
| `/api/images/[filename]` | GET | 개별 이미지 |
| `/api/generate-image` | POST | AI 이미지 생성 |
| `/api/generate-card` | POST | 카드 이미지 생성 |
| `/api/card-news/outline` | POST | 카드뉴스 아웃라인 |
| `/api/card-news/generate` | POST | 카드뉴스 생성 |
| `/api/card-slides/[batchId]` | GET | 카드 슬라이드 조회 |
| `/api/midjourney/generate` | POST | Midjourney 이미지 |
| `/api/design-tools` | GET | 디자인 도구 설정 |
| `/api/design-tools/canva` | GET/POST | Canva 설정 |
| `/api/design-tools/figma` | GET/POST | Figma 설정 |
| `/api/design-tools/figma-mcp` | GET/POST | Figma MCP 설정 |
| `/api/design-tools/figma-mcp-tokens` | GET/POST | Figma MCP 토큰 |
| `/api/figma/create-slides` | POST | Figma 슬라이드 생성 |
| `/api/figma/export` | POST | Figma 내보내기 |
| `/api/figma/export-to-queue` | POST | Figma에서 큐로 내보내기 |
| `/api/figma-mcp/start-oauth` | GET | Figma MCP OAuth 시작 |
| `/api/figma-mcp/callback` | GET | Figma MCP OAuth 콜백 |

### 비디오

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/video/list` | GET | 비디오 목록 |
| `/api/video/generate` | POST | 비디오 생성 |
| `/api/video/publish` | POST | 비디오 발행 |
| `/api/video/delete` | POST | 비디오 삭제 |
| `/api/video/script-from-blog` | POST | 블로그→영상 스크립트 |
| `/api/elevenlabs-config` | GET/POST | ElevenLabs 설정 |
| `/api/elevenlabs-voices` | GET | ElevenLabs 음성 목록 |
| `/api/youtube/auth-url` | GET | YouTube OAuth URL |
| `/api/youtube/callback` | GET | YouTube OAuth 콜백 |
| `/api/youtube/refresh` | POST | YouTube 토큰 갱신 |
| `/api/youtube/status` | GET | YouTube 연결 상태 |

### 분석 / 트렌드

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/analytics` | GET | 채널 분석 데이터 |
| `/api/growth` | GET | 팔로워 성장 데이터 |
| `/api/popular` | GET | 인기글 목록 |
| `/api/popular/add` | POST | 인기글 추가 |
| `/api/popular/delete` | POST | 인기글 삭제 |
| `/api/ga-config` | GET/POST | Google Analytics 설정 |
| `/api/ga-analytics` | GET | GA 분석 데이터 |
| `/api/gsc-config` | GET/POST | Search Console 설정 |
| `/api/gsc-analytics` | GET | GSC 분석 데이터 |
| `/api/gsc-index` | POST | GSC 색인 요청 |
| `/api/google-trend` | GET | Google Trends |
| `/api/naver-datalab-config` | GET/POST | Naver DataLab 설정 |
| `/api/naver-trend` | GET | Naver 트렌드 |
| `/api/nsa-data` | GET | 검색 어드바이저 데이터 |

### 알림

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/notification-settings` | GET/POST | 알림 설정 |
| `/api/notification-log` | GET | 알림 로그 |
| `/api/send-notification` | POST | 알림 발송 |
| `/api/alerts` | GET | 알림 목록 |
| `/api/slack-config` | GET/POST | Slack 설정 |
| `/api/slack-test` | POST | Slack 테스트 |
| `/api/slack-send-custom` | POST | Slack 커스텀 메시지 |
| `/api/slack-template` | GET/POST | Slack 템플릿 |
| `/api/slack-report-preview` | GET | 리포트 미리보기 |

### 키워드

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/keyword-bank` | GET | 키워드 뱅크 조회 |
| `/api/keyword-bank/add` | POST | 키워드 추가 |
| `/api/keyword-bank/remove` | POST | 키워드 삭제 |
| `/api/keyword-bank/mark-used` | POST | 사용 표시 |
| `/api/keyword-research` | POST | 키워드 리서치 |
| `/api/kw-planner-config` | GET/POST | KW Planner 설정 |

### 시스템

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/settings` | GET/POST | 전역 설정 |
| `/api/seo-settings` | GET/POST | SEO 설정 |
| `/api/overview` | GET | 대시보드 개요 |
| `/api/activity` | GET | 활동 타임라인 |
| `/api/agent-logs` | GET | Agent 실행 로그 |
| `/api/weekly-summary` | GET | 주간 요약 |
| `/api/weekly-report` | GET | 주간 리포트 |
| `/api/weekly-report/send` | POST | 주간 리포트 발송 |
| `/api/trend-report` | GET | 트렌드 리포트 |
| `/api/onboarding` | GET/POST | 온보딩 상태 |
| `/api/tenant-info` | GET | 테넌트 정보 |
| `/api/threads-username` | GET | Threads 유저네임 |
| `/api/r2-config` | GET/POST | R2 스토리지 설정 |
| `/api/gateway/restart` | POST | Gateway 재시작 |
