# Threads 자동 발행 시스템 (openclaw-auto)

## 프로젝트 개요

OpenClaw 완전 자동화 기반 Threads 콘텐츠 생성/검수/발행 시스템.
모든 자동화가 OpenClaw Cron → Claude Agent → Tool 파이프라인으로 동작.

## 아키텍처

```
OpenClaw Cron → Claude Agent → threads_queue Tool   (생성)
OpenClaw Cron → Claude Agent → threads_publish Tool  (발행)
OpenClaw Cron → Claude Agent → threads_insights Tool (반응 수집)
OpenClaw Cron → Claude Agent → threads_search Tool   (인기글 수집)
OpenClaw Cron → Claude Agent → threads_growth Tool   (팔로워 추적)
```

```
openclaw/extensions/
  threads-publish/   → Threads API 2단계 발행 tool
  threads-queue/     → queue.json CRUD tool
  threads-style/     → style-data.json RAG 학습 tool
  threads-insights/  → 반응 수집 + 터진 글 감지 + 자동 피드 tool
  threads-search/    → 키워드 기반 외부 인기글 수집 tool
  threads-growth/    → 팔로워 수/증감 추적 tool

data/
  queue.json           → 콘텐츠 큐 (draft → approved → published, engagement 포함)
  style-data.json      → 사용자 수정 이력 + 터진 글 패턴 (RAG)
  popular-posts.txt    → 인기글 참고 (수동 + 외부 수집 + 자체 바이럴)
  search-keywords.txt  → 외부 인기글 검색 키워드
  growth.json          → 팔로워 수/증감 추적 데이터

dashboard/
  server.py            → Flask 대시보드 백엔드 (localhost:3000)
  static/index.html    → SPA 프론트엔드
  static/app.js        → 대시보드 JS
```

## 워크플로우

1. **생성**: OpenClaw Cron → Claude Agent가 popular-posts.txt + style-data.json 참고하여 draft 배치 생성 → threads_queue tool
2. **검수**: 사용자가 CLI로 draft 확인/수정/승인, 수정 시 style-data.json에 학습 데이터 저장
3. **발행**: OpenClaw Cron → Claude Agent가 2시간마다 approved + 시간 도래한 글을 threads_publish tool로 자동 발행
4. **반응 수집**: OpenClaw Cron → Claude Agent가 6시간마다 threads_insights tool로 반응 수집
5. **인기글 수집**: OpenClaw Cron → Claude Agent가 주 1회 threads_search tool로 외부 인기글 수집
6. **성장 추적**: OpenClaw Cron → Claude Agent가 매일 threads_growth tool로 팔로워 추적
7. **피드백 루프**: 터진 글(views >= VIRAL_THRESHOLD) → popular-posts.txt + style-data.json 자동 피드 → 다음 생성에 반영

## 환경 변수

- `THREADS_ACCESS_TOKEN`: Threads API long-lived access token
- `THREADS_USER_ID`: Threads user ID
- `THREADS_QUEUE_PATH`: queue.json 경로 (선택, 기본: data/queue.json)
- `THREADS_STYLE_PATH`: style-data.json 경로 (선택, 기본: data/style-data.json)
- `VIRAL_THRESHOLD`: 터진 글 기준 views 수 (선택, 기본: 500)
- `MAX_POPULAR_POSTS`: popular-posts.txt 최대 보관 수 (선택, 기본: 30)
- `MIN_LIKES`: 외부 인기글 최소 좋아요 수 (선택, 기본: 10)
- `SEARCH_DAYS`: 외부 인기글 검색 기간 (선택, 기본: 7)
- `DASHBOARD_PORT`: 대시보드 포트 (선택, 기본: 3000)

## 구현 상태

| Step | 작업 | 상태 |
|------|------|------|
| 0 | Threads API 승인 | ✅ 완료 |
| 1 | threads_publish tool | ✅ 완료 |
| 2 | threads_queue tool | ✅ 완료 |
| 3 | threads_style tool | ✅ 완료 |
| 4 | threads_insights tool | ✅ 완료 |
| 5 | threads_search tool | ✅ 완료 |
| 6 | threads_growth tool | ✅ 완료 |
| 7 | OpenClaw Cron 통합 (5개) | ✅ 완료 |
| 8 | 콘텐츠 대시보드 (dashboard/) | ✅ 완료 |
| 9 | 아키텍처 전환: scripts/ 제거 → OpenClaw 완전 자동화 | ✅ 완료 |

## Tool 목록

| Tool | 설명 |
|------|------|
| `threads_publish` | Threads API 2단계 발행 (container → publish) |
| `threads_queue` | 콘텐츠 큐 CRUD (list/add/update/delete/get_approved/cleanup) |
| `threads_style` | 스타일 학습 데이터 RAG (read/add/summary) |
| `threads_insights` | 반응 수집 + 터진 글 감지 + 자동 피드 (collect) |
| `threads_search` | 키워드 기반 외부 인기글 수집 (fetch) |
| `threads_growth` | 팔로워 수/증감 추적 (track) |

## Cron Jobs (모두 OpenClaw Cron)

| 이름 | 주기 | 설명 |
|------|------|------|
| `threads-generate-drafts` | 6시간마다 | Claude Agent가 threads_queue/style tool로 draft 5개 생성 |
| `threads-auto-publish` | 2시간마다 | Claude Agent가 threads_publish/queue tool로 자동 발행 |
| `threads-collect-insights` | 6시간마다 | Claude Agent가 threads_insights tool로 반응 수집 |
| `threads-fetch-trending` | 주 1회 | Claude Agent가 threads_search tool로 인기글 수집 |
| `threads-track-growth` | 매일 1회 | Claude Agent가 threads_growth tool로 팔로워 추적 |

Cron 관리:
```bash
openclaw cron list                    # 목록 확인
openclaw cron run <id>                # 수동 실행
openclaw cron runs --id <id>          # 실행 이력
openclaw cron disable <id>            # 비활성화
openclaw cron enable <id>             # 활성화
```

## 설정

- **Gateway**: `gateway.mode=local`, port 18789
- **모델**: Claude Sonnet 4.6 (메인, setup-token 인증) → Gemini 2.5 Flash (폴백) → Ollama llama3.1:8b (2차 폴백)
  - Ollama 서버: `https://ollama-serve.example.com`
- **Plugin config**: `~/.openclaw/openclaw.json`에서 각 tool의 데이터 파일 절대 경로 지정

## CLI 사용법

```bash
# Draft 목록 확인
openclaw agent --agent main --message "threads_queue로 draft 목록 보여줘"

# 글 수정
openclaw agent --agent main --message "threads_queue로 [id] 글 텍스트를 '...'로 수정해"

# 승인 + 예약
openclaw agent --agent main --message "threads_queue로 [id] 승인하고 2시간 후 발행 예약해"

# 수동 발행 테스트
openclaw agent --agent main --message "threads_publish로 '테스트 글입니다' 발행해"

# 스타일 데이터 확인
openclaw agent --agent main --message "threads_style로 학습 데이터 요약 보여줘"

# 수동 반응 수집
openclaw agent --agent main --message "threads_insights로 반응 수집해"

# 수동 인기글 수집
openclaw agent --agent main --message "threads_search로 인기글 수집해"

# 수동 팔로워 추적
openclaw agent --agent main --message "threads_growth로 팔로워 추적해"
```

## 대시보드

```bash
# 실행
python3 dashboard/server.py
# 브라우저: http://localhost:3000

# 환경변수로 포트 변경
DASHBOARD_PORT=8080 python3 dashboard/server.py
```

기능: Queue 관리 (검수/승인/수정/삭제), Analytics, Popular Posts, Growth, Keywords 편집

## 트러블슈팅 로그

(이슈 발생 시 여기에 기록)
