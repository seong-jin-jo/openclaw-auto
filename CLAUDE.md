# openclaw-auto — SNS 콘텐츠 자동화 시스템

## 프로젝트 개요

OpenClaw 기반 SNS 콘텐츠 자동 생성/검수/발행/분석 시스템.
모든 자동화가 OpenClaw Cron → Claude Agent → Tool 파이프라인으로 동작.
서비스별 전략/톤/타겟은 `data/prompt-guide.txt`와 대시보드 Settings에서 커스터마이징.

## 아키텍처

```
OpenClaw Cron → Claude Agent → threads_queue Tool   (생성)
OpenClaw Cron → Claude Agent → threads_publish Tool  (발행)
OpenClaw Cron → Claude Agent → threads_insights Tool (반응 수집)
OpenClaw Cron → Claude Agent → threads_search Tool   (인기글 수집)
OpenClaw Cron → Claude Agent → threads_growth Tool   (팔로워 추적)
```

```
extensions/
  threads-publish/   → Threads API 2단계 발행 (TEXT/IMAGE)
  threads-queue/     → queue.json CRUD
  threads-style/     → style-data.json RAG 학습
  threads-insights/  → 반응 수집 + 터진 글 감지 + 자동 피드
  threads-search/    → 키워드 기반 외부 인기글 수집
  threads-growth/    → 팔로워 수/증감 추적

data/                → 서비스별 로컬 데이터 (.gitignore)
  queue.json           → 콘텐츠 큐
  style-data.json      → 스타일 학습 데이터
  popular-posts.txt    → 인기글 참고
  search-keywords.txt  → 검색 키워드
  growth.json          → 팔로워 추적
  prompt-guide.txt     → 서비스별 콘텐츠 전략 (타겟/톤/유형)

dashboard/
  server.py            → Flask 대시보드 백엔드
  static/              → SPA 프론트엔드
```

## 워크플로우

1. **생성**: Cron → Agent가 prompt-guide.txt + popular-posts.txt + style-data.json 참고하여 draft 배치 생성
2. **검수**: 대시보드에서 draft 확인/수정/승인
3. **발행**: Cron → Agent가 approved 글을 자동 발행 (주기 설정 가능)
4. **반응 수집**: Cron → Agent가 발행 글의 engagement 수집
5. **인기글 수집**: Cron → Agent가 키워드 기반 외부 인기글 수집
6. **성장 추적**: Cron → Agent가 팔로워 추적
7. **피드백 루프**: 터진 글 → popular-posts.txt + style-data.json 자동 피드 → 다음 생성에 반영

## 환경 변수

- `THREADS_ACCESS_TOKEN`: Threads API access token
- `THREADS_USER_ID`: Threads user ID
- `OPENCLAW_GATEWAY_TOKEN`: Gateway 인증 토큰
- `DASHBOARD_PORT`: 대시보드 포트 (기본: 3456)
- `VIRAL_THRESHOLD`: 터진 글 기준 views (기본: 500)

## Tool 목록

| Tool | 설명 |
|------|------|
| `threads_publish` | Threads API 발행 (TEXT/IMAGE, container → publish) |
| `threads_queue` | 콘텐츠 큐 CRUD (list/add/update/delete/get_approved/cleanup) |
| `threads_style` | 스타일 학습 데이터 RAG (read/add/summary) |
| `threads_insights` | 반응 수집 + 터진 글 감지 + 자동 피드 (collect) |
| `threads_search` | 키워드 기반 외부 인기글 수집 (fetch) |
| `threads_growth` | 팔로워 수/증감 추적 (track) |

## Cron Jobs

| 이름 | 기본 주기 | 설명 |
|------|----------|------|
| `threads-generate-drafts` | 6시간 | draft 배치 생성 (prompt-guide.txt 기반) |
| `threads-auto-publish` | 4시간 | approved 글 1개 자동 발행 |
| `threads-collect-insights` | 6시간 | 발행 글 반응 수집 |
| `threads-fetch-trending` | 주 1회 | 외부 인기글 수집 |
| `threads-track-growth` | 매일 | 팔로워 추적 |

주기는 `config/cron/jobs.json`에서 서비스별 조정.

## 서비스별 커스터마이징

모든 커스터마이징은 로컬 파일 (git에 안 올라감):

| 파일 | 용도 | 편집 방법 |
|------|------|----------|
| `data/prompt-guide.txt` | 콘텐츠 전략 (타겟/톤/유형/주제) | 대시보드 Settings 탭 |
| `data/search-keywords.txt` | 인기글 검색 키워드 | 대시보드 Settings 탭 |
| `config/cron/jobs.json` | Cron 주기/프롬프트 | 직접 편집 |
| `.env` | API 토큰 | 직접 편집 |
| `config/openclaw.json` | 플러그인 설정 | 직접 편집 |

## 대시보드

Docker로 실행 시 자동 시작. 포트는 docker-compose.yml에서 설정.

기능: Queue 관리 (검수/승인/수정/삭제), Cron 현황, Analytics, Popular Posts, Settings (전략/키워드 편집)

## CLI

```bash
openclaw cron list                    # Cron 목록
openclaw cron run <id>                # 수동 실행
openclaw agent --agent main --message "threads_queue로 draft 목록 보여줘"
openclaw agent --agent main --message "threads_publish로 '테스트' 발행해"
```
