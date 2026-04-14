# openclaw-auto — 멀티채널 SNS 마케팅 자동화 플랫폼

AI 에이전트가 콘텐츠를 자동 생성하고, 검수 후 멀티채널로 발행하고, 반응을 분석하여 다음 콘텐츠에 반영하는 마케팅 자동화 시스템. 어떤 서비스/도메인이든 fork하여 독립 운영 가능한 공통 플랫폼.

## Changelog

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-30 | **Threads 자동화** — 콘텐츠 생성/발행/분석 + 피드백 루프 + 대시보드 |
| v2.0 | 2026-04-06 | **멀티채널 플랫폼** — X 동시 발행, 20개+ 채널, credential 검증, LLM 설정, 카드뉴스, 이미지 파이프라인 |
| v3.0 | 2026-04-14 | **Next.js 전환 + Instagram/Figma/Midjourney + 기능 통합** — Flask→Next.js 마이그레이션, Instagram 카드뉴스, Figma MCP, Midjourney, Design Tools, R2 Storage UI |
| v4.0 | 예정 | **SaaS 출시** — 온보딩, 성과 리포트, 멀티 테넌트, 결제 |

<details>
<summary>PR 히스토리</summary>

| PR | 제목 | 주요 내용 |
|----|------|----------|
| #17 | Data Analytics + SEO + Blog 자동화 | SEO 분석, 블로그 자동화 개선 |
| #16 | Instagram + Midjourney + Claude 토큰 관리 | Instagram 채널, Midjourney 이미지, 토큰 관리 |
| #15 | Instagram 카드뉴스 + card-generator | card-generator extension, Instagram 캐러셀 |
| #14 | 자동화 강화: 댓글 답글, 인기글 스크래핑, 이미지 발행, 해시태그 분석 | auto-reply, quote trending, 스크래핑 수집, hashtag/hourly 분석, 비율 설정 |
| #13 | 자동화 토글 실제 연동 + 이미지 생성 + 주기 설정 | 토글→크론 연동, 대시보드 이미지 생성 UI, 주기 파라미터 |
| #12 | 이미지 파이프라인 + 에셋 갤러리 + 자동화 토글 | image-upload extension, Images 탭, 자동화 ON/OFF, 실행 기록 |
| #11 | 블로그 SEO 자동화 | blog-queue/seo-keywords extensions, Blog 탭 |
| #10 | 이미지 파이프라인 changelog | README changelog 추가 |
| #9 | Threads 프로필 링크 | 대시보드에 Threads 링크 |
| #8 | 서비스별 데이터 제네릭화 | prompt-guide/keywords를 .example 템플릿으로 분리 |
| #7 | analytics-history | 성과 영구 보존 |
| #6 | 파이프라인 확장 | 트렌드 재가공, 댓글 좋아요, 저조 글 삭제 |
| #5 | 대시보드 보안 | 인증 + XSS 방지 |
| #4 | 발행 rate limit | 1회 1글 발행 + 스태거드 스케줄링 |
| #3 | 일괄 큐 관리 | bulk select/approve/delete |

</details>

## 왜 OpenClaw인가

핵심 차이: **런타임 바인딩**. LLM 에이전트가 실행 시점에 어떤 Tool을 어떤 순서로 호출할지 결정.

| | 단순 LLM Agent | n8n | OpenClaw |
|---|---|---|---|
| 실행 주체 | LLM이 텍스트 생성 | 워크플로우 엔진 | LLM이 판단 + 실행 |
| 분기/판단 | 코드로 하드코딩 | IF 노드 (수동 설계) | LLM이 자율 판단 |
| 확장 | 코드 수정 | 노드 추가 (GUI) | 플러그인 등록 (SDK) |

## 아키텍처

```
                     OpenClaw Gateway
  Cron (스케줄) ──→ Claude Agent (판단) ──→ Tool Registry (실행)
                                              │
                    ┌───────────────────────────┤
                    ▼                           ▼
              Threads / X API              로컬 파일 (data/)
              (발행/수집)                   (queue, style, growth)
```

### 피드백 루프 — 핵심 차별점

```
① 인기글 수집 → ② AI 콘텐츠 생성 → ③ 사람 검수 → ④ 멀티채널 발행
                      ▲                                    │
                      └── ⑤ 반응 수집 → 터진 글 자동 학습 ──┘
```

## 현재 기능

### 지원 채널

**Social:** Threads ✅ · X ✅ · Instagram ✅ · Facebook · LinkedIn · Bluesky · Pinterest · Tumblr
**Video:** TikTok · YouTube
**Blog & SEO:** Naver Blog · Medium · Substack
**Messaging:** Telegram · Discord · Slack · LINE · Kakao · WhatsApp
**Data & Analytics:** Google Analytics · Search Console · Google Business
**Design & Image:** Midjourney (이미지) · Figma (디자인)
**Custom:** Blog (자체 사이트) · Custom API · Webhook · RSS

✅ = 운영 중, 나머지 = 연결 가능(Ready) 또는 준비 중(Soon)

### 대시보드
사이드바 기반 멀티채널 관제 UI:
- **Marketing Home** — 채널 아이콘 그리드, 주간 성과, 크론 상태, 활동 타임라인, Alerts
- **채널별 페이지** — Queue / Analytics / Growth / Popular / Settings (credential + 가이드 + 키워드)
- **Blog** — 블로그 큐 관리
- **Images** — 에셋 갤러리
- **Settings** — 채널 연결, AI Engine (LLM 모델 설정), 자동화 토글, Account

### Content Guide + Keywords
채널별로 독립 관리 가능. 공통 가이드를 기본으로, 채널 전용 가이드로 오버라이드.
- 공통: `data/prompt-guide.txt`, `data/search-keywords.txt`
- 채널별: `data/prompt-guide.x.txt`, `data/search-keywords.x.txt` 등
- "공통에서 복사" 버튼으로 동기화

### 자동화 (Cron)
| 기능 | 기본 주기 | 설명 |
|------|----------|------|
| 콘텐츠 생성 | 6시간 | AI가 prompt-guide 기반으로 draft 배치 생성 |
| 멀티채널 발행 | 2시간 | 승인된 글 Threads + X 동시 발행 (채널별 글자수 최적화) |
| 반응 수집 | 6시간 | views/likes/replies 수집 + 터진 글 감지 |
| 인기글 수집 | 주 1회 | 키워드 기반 외부 트렌딩 수집 |
| 팔로워 추적 | 일 1회 | 팔로워 수/증감 기록 |

모든 주기는 대시보드 Settings에서 조정 가능.

## 프로젝트 구조

```
extensions/                  # OpenClaw 플러그인 (TypeScript)
  threads-publish/           #   Threads API 발행
  threads-queue/             #   콘텐츠 큐 (멀티채널 channels 지원)
  threads-style/             #   스타일 학습 RAG
  threads-insights/          #   반응 수집 + 터진 글 감지
  threads-search/            #   외부 인기글 수집
  threads-growth/            #   팔로워 추적
  x-publish/                 #   X (Twitter) 발행
  instagram-publish/         #   Instagram 발행
  midjourney-image/          #   Midjourney 이미지 생성
  image-upload/              #   Cloudflare R2 이미지 업로드
  card-generator/            #   카드뉴스 생성
  blog-queue/                #   블로그 큐 CRUD
  seo-keywords/              #   SEO 키워드 분석
  ...                        #   + 14개 채널 publish extensions

dashboard/                   # 웹 대시보드 (Next.js + TypeScript)
  src/
    app/                     #   App Router (pages + API routes)
    components/              #   React 컴포넌트
    lib/                     #   유틸리티, 상수, API 헬퍼
    hooks/                   #   커스텀 React hooks
    types/                   #   TypeScript 타입 정의
    store/                   #   상태 관리
  legacy/                    #   Flask 호환용 (점진적 제거 예정)

docs/                        # UI 규칙 등 공유 문서
config/                      # 설정 템플릿 (.example)
data/                        # 런타임 데이터 (.gitignore)
openclaw/                    # OpenClaw 오픈소스 (git submodule)
```

### gitignore 정책

| 경로 | Git | 이유 |
|------|-----|------|
| `extensions/`, `dashboard/` | ✅ 추적 | 공통 코드 |
| `config/*.example`, `.env.example` | ✅ 추적 | 설정 템플릿 |
| `config/openclaw.json`, `.env` | ❌ | 토큰/시크릿 |
| `data/` | ❌ | 런타임 데이터 |
| `openclaw/` | submodule | OpenClaw 오픈소스 |

## 공통 레포 정책

이 레포는 **서비스 중립적 공통 플랫폼**입니다. 모든 서비스 특정 내용은 fork에서 관리합니다.

### 포함 (공통 코드)
- 채널 연동 (extensions, API routes)
- 큐 관리 (생성/승인/발행/삭제)
- 자동화 (Cron, 피드백 루프)
- 대시보드 UI (컴포넌트, 페이지, 설정)

### 금지 (PR에 포함 불가)
- 특정 서비스 URL, 도메인
- 특정 사용자명, 브랜드명
- 하드코딩된 API 키, 토큰
- 특정 서비스에만 필요한 로직

### Custom Integration
- fork에서 추가
- `config/`, `data/`, `.env`로 서비스별 설정 분리
- 서비스 전용 extension도 fork에서 관리

## 사용법

### 1. 최초 설치

```bash
# 프로젝트 클론
git clone --recurse-submodules https://github.com/seong-jin-jo/openclaw-auto.git
cd openclaw-auto

# 설정 파일 생성
cp .env.example .env
cp config/openclaw.json.example config/openclaw.json
cp config/cron/jobs.json.example config/cron/jobs.json
cp docker-compose.yml.example docker-compose.yml
# docker-compose.yml에서 포트, 이미지명 등 서비스에 맞게 수정

# 대시보드 빌드
cd dashboard && npm ci && npm run build && cd ..

# 커스텀 플러그인을 OpenClaw에 복사
cp -r extensions/* openclaw/extensions/

# 빌드 + 실행
docker compose up -d --build
```

### 2. 채널 연결

대시보드에서 각 채널 클릭 → credential 입력 → **자동 검증** → Connected.

- credential 입력 후 실제 API를 호출하여 유효성 검증
- 검증 실패 시 Connected로 표시되지 않음 (에러 메시지 표시)
- **Setup Guide**: 단계별 따라하기로 시작 가능
- **더 알아보기**: 각 키의 역할, OAuth 구조, 비용/제한사항 확인

주요 채널:
- **Threads**: developers.facebook.com > Access Token + User ID
- **X (Twitter)**: developer.x.com > OAuth 1.0a 소비자 키 + 액세스 토큰 (Read+Write)
- **Instagram**: developers.facebook.com > Graph API Access Token + User ID
- **Bluesky**: bsky.app > Handle + App Password (무료, 승인 불필요)
- **Telegram**: @BotFather > Bot Token + Chat ID (무료)
- 기타: 각 채널 Settings의 Setup Guide 참조

### 3. 콘텐츠 전략 설정

대시보드 채널 > Settings에서:
- **Content Guide**: 타겟/톤/주제/유형 정의 (AI 생성에 반영)
- **Search Keywords**: 외부 인기글 수집 키워드

### 4. 일상 운영

**할 일은 검수 하나뿐:**
1. 대시보드 Queue에서 draft 확인
2. 괜찮으면 Approve → 다음 Cron에서 자동 발행
3. 수정 필요하면 Edit → Approve
4. 나머지(생성, 발행, 반응 수집, 학습)는 자동

### CLI

```bash
openclaw cron list                    # Cron 목록
openclaw cron run <id>                # 수동 실행
openclaw agent --agent main --message "threads_queue로 draft 목록 보여줘"
```

## Fork & Deploy

이 레포를 중앙 허브로 두고 fork하여 독립 운영:

```
원본 레포 (중앙 허브)
  ├── fork → team-A/openclaw-auto
  ├── fork → team-B/openclaw-auto
  └── clone → 개인 서버
```

**제품별로 다른 것** (.gitignore, 로컬만): `.env`, `config/`, `data/`
**공통 코드** (git 추적, fork가 공유): `extensions/`, `dashboard/`

```bash
# Fork 후 셋업
git clone git@github.com:your-org/openclaw-auto.git && cd openclaw-auto
git remote add upstream git@github.com:seong-jin-jo/openclaw-auto.git
cp .env.example .env && cp config/openclaw.json.example config/openclaw.json
cp config/cron/jobs.json.example config/cron/jobs.json
# data/*.example → data/* 복사 후 서비스에 맞게 수정
cd dashboard && npm ci && npm run build && cd ..
docker compose up -d --build
```

## 로드맵

### 완료

| 기능 | 설명 |
|------|------|
| Threads 자동화 | 생성/발행/수집/학습 전체 파이프라인 |
| X (Twitter) 발행 | OAuth 1.0a, 280자 자동 압축 |
| Instagram 발행 | 카드뉴스/이미지 발행 (Graph API) |
| Midjourney 이미지 | Discord 연동 이미지 생성 |
| Figma 디자인 | MCP 연동 디자인 자동화 |
| 멀티채널 대시보드 | 사이드바 + 통합 현황 + 채널별 관리 |
| Next.js 전환 | Flask + Vanilla JS → Next.js + TypeScript 마이그레이션 |
| 이미지 파이프라인 | AI 생성 → R2 업로드 → 발행 |
| 자동화 토글 | 9개 기능 ON/OFF + 실행 기록 |
| 블로그 자동화 | SEO 키워드 분석 + 블로그 글 생성 |
| 크리덴셜 관리 | 대시보드에서 API 키 입력/수정/확인 |
| 피드백 루프 | 터진 글 → 스타일 학습 → 다음 생성 반영 |

### 예정 (v4.0 SaaS)

| 기능 | 설명 |
|------|------|
| A/B 테스트 | 톤/길이/포맷 변형 비교 → 승자 패턴 자동 학습 |
| 성과 리포트 | 주간/월간 마케팅 성과 요약 자동 생성 |
| 온보딩 템플릿 | 업종별 콘텐츠 전략 자동 설정 |
| SaaS 인프라 | 멀티 테넌트, 결제 연동, 관리자 권한 |
