# v62 네 방 API 갭 감사

한 줄 결론: v62 네 방의 핵심 동작 46개를 현행 API route 파일 163개와 대조한 결과, 있음 14개, 부족 21개, 없음 11개다. 특히 댓글 본문과 답글, 성과 제안의 생성 큐 인계, 성과 0건 방향 제안이 실제 백엔드 계약으로 이어지지 않는다.

## 1. 감사 범위와 판정 기준

### 기반 산출물

- 확정 프로토타입: `docs/prototype/openclaw-auto-4room-v62.html`
- 회장 요구 원문: `docs/requests/회장-확정-요구사항-대장.md`
- 화면 구현: `dashboard/src/app/page.tsx`, `dashboard/src/app/studio/page.tsx`
- 공용 UI: `dashboard/src/components/layout/Sidebar.tsx`, `dashboard/src/components/channel/ChannelPage.tsx`, `dashboard/src/components/studio/PlatformPreview.tsx`
- 채널 능력 정본: `dashboard/src/lib/channel-capabilities.ts`
- API 구현: `dashboard/src/app/api/**/route.ts`
- DB 정본: `dashboard/db/schema.sql`

### 실측 정정

- 위임서의 현행 API 98개는 상위 route family 수와 일치한다. 실제 구현 파일은 동적 하위 route를 포함해 163개다.
- 요구사항 대장은 205개의 고유 요구 번호를 가진다. 번호 범위는 R1부터 R207이며 R154와 R155가 없다. 위임서의 210건과 일치하지 않는다.
- 감사에서는 family 98개만 세고 끝내지 않고, 하위 route 파일 163개 전부를 훑었다.

### 판정

| 판정 | 뜻 |
|---|---|
| 있음 | 화면 동작에 필요한 읽기, 쓰기, 거절 조건이 기존 API와 저장소에 연결되어 있다 |
| 부족 | 일부 데이터나 동작은 있으나 프로토타입 계약을 끝까지 수행하지 못한다 |
| 없음 | 대응 API, provider 호출, 저장 경로가 없다 |

## 2. 네 방 대조표

### 생성실

| 프로토타입 화면과 동작 | 필요한 데이터 | 지금 있는 API | 판정(있음/없음/부족) |
|---|---|---|---|
| 현재 작업과 현재 단계 표시 | tenant, 진행 중 draft, 최근 활동 | `GET /api/me`, `GET /api/studio/drafts`, `GET /api/activity` | 부족. 화면이 요구하는 단일 current work 계약이 없다 |
| 브랜드 학습 준비도와 누락 입력 | 브랜드 가이드, 말투, 키워드, 제품 소스, wiki 동기화 상태 | `GET/POST /api/studio/brand-setup`, `GET/POST /api/guide`, `GET/POST /api/keywords`, `GET/POST /api/product-source`, `POST /api/brand/sync-wiki`, `POST /api/brand/sync-repo` | 있음 |
| 성과 기반 선제 제안 | 상위 성과, 트렌드, 제안 근거, 표본 충분성 | `GET/POST /api/suggestions`, `GET /api/trend-report`, `POST /api/google-trend`, `POST /api/naver-trend` | 부족. 제안 근거와 표본 판정이 응답 계약에 없다 |
| 성과 0건에서도 방향 3개 제안 | 브랜드 맥락, 시장 트렌드, 가설 라벨 | `POST /api/suggestions` | 없음. 현재는 빈 배열과 재시도 안내만 반환한다 |
| 제안 A/B/C 비교와 선택 | 후보별 형식, 근거, 예상 비용, 채널 | `POST /api/studio/text`, `POST /api/video/generate`, `POST /api/card-news/outline`, `POST /api/card-news/generate`, 이미지 생성 API군 | 부족. 후보를 한 계약으로 묶는 proposal 응답이 없다 |
| 챗봇에서 선택이나 수정 지시 실행 | 대화 문맥, 명령, 대상 draft, 실행 결과 | `POST /api/ai-suggest/guide`, `POST /api/ai-suggest/keywords`, `POST /api/studio/text` | 부족. 채팅 명령을 동작으로 라우팅하는 오케스트레이션 API가 없다 |
| 선택 제안을 생성 큐로 넣기 | suggestion text, source, evidence, tenant, queue status | `POST /api/queue/add` | 부족. 큐 API는 재사용 가능하지만 suggestion에서 이를 호출하는 연결과 출처 보존 계약이 없다 |
| 생성 결과 초안 저장과 다시 열기 | idea, 플랫폼별 payload, 상태 | `GET/POST /api/studio/drafts` | 있음 |
| 편집실로 결과 인계 | draft id, content kind, payload | `GET/POST /api/studio/drafts` | 부족. draft payload는 있으나 v62 네 가지 형식의 명시적 handoff 계약이 없다 |

### 편집실

| 프로토타입 화면과 동작 | 필요한 데이터 | 지금 있는 API | 판정(있음/없음/부족) |
|---|---|---|---|
| 생성된 형식으로 편집실 열기 | draft id, text/image/video/card/audio kind | `GET /api/studio/drafts`, media와 video API군 | 부족. kind 스키마와 유효성 계약이 명시되지 않았다 |
| 대본과 개요 편집 및 저장 | scene 또는 section 순서, 본문, 변경 버전 | `POST /api/studio/drafts`, `POST /api/video/script-from-blog` | 부족. 전체 payload 저장만 있고 scene 단위 수정 계약과 충돌 방지가 없다 |
| 장면 순서 변경 | ordered scene ids, revision | 대응 전용 API 없음 | 없음 |
| 문장 삭제와 복원 | line id, visibility, undo history | 대응 API 없음 | 없음 |
| 영상 자르기와 재가공 | source asset, clip range, output asset | `POST /api/video/refine-clip`, `POST /api/video/repurpose` | 있음 |
| 이미지와 영상 생성 상태 확인 | job id, state, artifact URL, cost | Higgsfield image/video/status/transactions, Midjourney, image API군 | 있음 |
| 카드뉴스 개요와 슬라이드 생성 | outline, slides, batch id | `POST /api/card-news/outline`, `POST /api/card-news/generate`, `GET /api/card-slides/[batchId]` | 있음 |
| 음성과 보이스 선택 | voice list, voice settings, audio asset | `GET /api/elevenlabs-voices`, `GET/POST /api/elevenlabs-config`, `GET/POST /api/voice-tone` | 부족. 음성 합성 결과를 draft에 연결하는 명시적 편집 계약이 없다 |
| 비율, 자막, 글꼴, 배경, 음악 도구 | 형식별 편집 값과 validation | draft payload, 이미지 및 영상 생성 API군 | 부족. 필드별 허용값과 거절 조건이 서버에 없다 |
| 편집 완료 후 발행실 인계 | draft id, 플랫폼별 완성 payload | `POST /api/studio/drafts` | 부족. 발행 전 준비상태 검사와 v62 handoff 응답이 없다 |

### 발행실

| 프로토타입 화면과 동작 | 필요한 데이터 | 지금 있는 API | 판정(있음/없음/부족) |
|---|---|---|---|
| 채널 연결 상태와 계정 선택 | provider, account, default, readiness, token 상태 | channel accounts API군, `GET /api/connect/readiness`, `GET /api/channel-config`, `GET /api/token-status` | 있음 |
| 7개 플랫폼 실물 미리보기 | 플랫폼별 title, display name, caption, tags, media | `GET /api/studio/drafts`, `PlatformPreview.tsx` | 있음. 렌더는 프론트 책임이다 |
| 미리보기 안에서 문구 직접 수정 | 플랫폼별 필드와 길이 제한 | `POST /api/studio/drafts`, `POST /api/content/validate` | 부족. first comment와 일부 플랫폼 필드가 draft 계약에 명시되지 않았다 |
| 플랫폼 선택과 계정 선택 저장 | includes, account ids | draft payload, channel accounts API군 | 있음 |
| 초안 저장 | idea, payload, status | `POST /api/studio/drafts` | 있음 |
| 검토 요청을 inbox로 보내기 | draft id, reviewer, status, notification | queue API군, notification API군 | 부족. review request라는 단일 상태 전환 계약이 없다 |
| 캘린더 예약 | platforms, scheduled_at, payload | `GET/POST /api/schedule` | 있음 |
| 텍스트와 카드 발행 | draft, channels, account ids, idempotency | `POST /api/publish` | 있음 |
| Reels와 TikTok 영상 발행 | asset, account, provider validation, idempotency | `POST /api/video/publish`, `GET /api/tiktok/publish-status` | 있음 |
| Shorts 영상 발행 | YouTube credential, asset, metadata | YouTube status/refresh와 video API군 | 부족. 발행 경로가 v62 통합 발행 계약과 분리되어 있다 |
| 첫 댓글 발행 | platform post id, first comment text, provider capability | 대응 전용 API 없음 | 없음 |
| 플랫폼별 진행률, 중지, 성공 URL, 오류 | per-target state, provider job, permalink, stop capability | publish 응답, TikTok status, `published_posts` | 부족. 7개 플랫폼을 아우르는 통합 job 상태와 stop 계약이 없다 |
| inbox와 calendar에서 발행실로 복귀 | draft id, source route | `GET /api/studio/drafts`, 프론트 라우팅 | 부족. return context 서버 계약이 없다 |

### 성과실

| 프로토타입 화면과 동작 | 필요한 데이터 | 지금 있는 API | 판정(있음/없음/부족) |
|---|---|---|---|
| 조회, 저장, 답글, 팔로워 핵심 지표 | post metrics, growth metrics | `GET/POST /api/metrics`, `GET /api/analytics`, `GET /api/growth` | 부족. `POST /api/metrics`는 Threads의 views, likes, replies, reposts만 수집한다 |
| 보조 지표와 사용량 | likes, reposts, clicks, watch, usage | analytics API군, `GET /api/usage`, `GET /api/overview` | 부족. 플랫폼마다 실제 수집 범위가 다르고 결측 이유 계약이 없다 |
| 30일 비교와 판정 근거 | 시계열 snapshot, 비교 기간, sample count, confidence | 최신값 중심 `published_posts`, `growth_metrics` | 부족. 게시물별 metrics history가 없어 재현 가능한 추세 판정이 어렵다 |
| 잘된 글과 아쉬운 글 | score, 기준, 비교군, 콘텐츠 | `GET /api/analytics`, `GET /api/suggestions`, `GET /api/popular` | 부족. score와 판정 이유가 단일 계약으로 묶이지 않는다 |
| 이 결로 한 편 더 만들기 | selected evidence, idea, target format, queue result | `POST /api/suggestions`, `POST /api/queue/add` | 없음. 두 API 사이 호출과 출처 보존이 없다 |
| 성과 0건에서 방향 3개 시작 | hypothesis, source, action target | `POST /api/suggestions` | 없음. 현재 구현은 다음 행동을 만들지 않는다 |
| 댓글과 반응 본문 목록 | provider comment id, post id, author, body, timestamp, state | `GET /api/metrics`의 replies 숫자만 있음 | 없음 |
| 댓글 답글 초안 생성 | comment body, brand voice, suggested reply | 대응 API 없음 | 없음 |
| 답글 보내기 | provider comment id, body, result id | 대응 API 없음 | 없음 |
| 댓글 좋아요와 나중 처리 | provider capability, moderation state | 대응 API 없음 | 없음 |
| 댓글에서 편집실 인계 | comment context, target draft | 대응 API 없음 | 없음 |
| 학습 후보 수락 또는 거절 | evidence, candidate, sample threshold, decision | guide, voice-tone, brand setup API군 | 부족. 후보와 수락 이력을 저장하는 계약이 없다 |
| 경고와 사용량 알림 | alert, notification, quota | `GET /api/alerts`, notification API군, usage API군 | 있음 |
| 게시물별 원자료와 오류 | platform, permalink, metrics, status, error | `GET /api/metrics`, `GET /api/errors` | 있음 |

### 합계

| 판정 | 건수 |
|---|---:|
| 있음 | 14 |
| 부족 | 21 |
| 없음 | 11 |
| 전체 | 46 |

## 3. 없음과 부족 목록

| 심각도 | 결함 | 사용자 결과 | 근거 |
|---|---|---|---|
| P0 | 댓글 본문을 가져오고 답글을 보내는 경로 없음 | 성과실의 답하기가 숫자 장식으로 끝난다 | `metrics`는 replies 개수만 저장한다. 댓글 provider 호출과 route가 없다 |
| P0 | 성과 제안을 생성 큐로 보내는 연결 없음 | R56과 R68의 학습 고리가 끊겨 제안을 보고 다시 손으로 입력해야 한다 | `suggestions`와 `queue/add`가 독립되어 있다 |
| P1 | 성과 0건 제안이 R68과 반대로 중단됨 | 신규 사용자는 첫 콘텐츠를 시작할 방향을 받지 못한다 | `suggestions`가 성과와 signal이 모두 없으면 ideas 빈 배열을 반환한다 |
| P1 | Threads 답글 권한 scope가 없음 | 답글 route만 추가해도 OAuth token으로 호출할 수 없다 | `social-connect.ts`의 Threads scope에 `threads_manage_replies`가 없다 |
| P1 | 여러 플랫폼 성과 수집 계약이 없음 | 7개 플랫폼을 보여주지만 실제 판정은 Threads 일부 숫자에 편향된다 | `POST /api/metrics`가 Threads 전용이다 |
| P1 | 첫 댓글 발행 API 없음 | 발행실 미리보기의 first comment가 실제 발행에 반영되지 않는다 | publish API군에 first comment provider 호출이 없다 |
| P1 | 학습 후보 수락 이력 없음 | 무엇을 왜 배웠는지, 표본 5건을 충족했는지 재현할 수 없다 | 후보 lifecycle 저장소와 API가 없다 |
| P1 | 제안 근거와 표본 충분성 응답이 없음 | 잘된 것을 가속한 제안인지 일반 생성인지 구분할 수 없다 | `suggestions`는 ideas와 basedOn만 반환한다 |
| P1 | 편집실 scene, line, undo 계약 없음 | 프로토타입의 재정렬, 삭제, 복원이 저장되지 않는다 | draft payload 전체 저장만 있다 |
| P2 | 성과 시계열 snapshot 없음 | 30일 비교 판정이 현재 누계값만으로 만들어질 위험이 있다 | `published_posts`는 최신 metrics만 가진다 |
| P2 | 통합 발행 job 상태 없음 | 일곱 플랫폼의 진행, 중지, 오류, URL을 한 요청으로 추적하기 어렵다 | TikTok만 별도 status route가 있다 |
| P2 | 검토 요청 상태 전환 없음 | inbox 검토 요청이 큐나 알림 조합에 의존해 의미가 불명확하다 | review request 전용 계약이 없다 |
| P2 | 형식별 편집 validation 부족 | 비율, 자막, 음악, 카드 도구의 잘못된 값이 서버까지 들어갈 수 있다 | 서버 필드 허용값 계약이 없다 |
| P2 | 현황 집계 단위 불명확 | 후속 감사가 family 98개만 보고 하위 route를 누락할 수 있다 | 실측은 family 98개, route 파일 163개, 고유 요구 205개다 |

## 4. 게이트가 열리면 먼저 할 저비용 구현

현재 `pipeline-state.osmu.md`의 design은 in-progress이며 approved가 아니고, build의 `artifacts_ok`도 false다. override는 2026-08-17에 만료됐다. 따라서 이 감사에서는 소스를 수정하지 않았다.

게이트 승인 뒤 아래 순서가 가장 되돌리기 쉽다.

1. 기존 `POST /api/queue/add`를 재사용해 성과 제안을 큐로 보내는 연결을 만든다. 새 테이블과 새 큐 route는 만들지 않는다. payload에는 source=`performance_suggestion`, evidence post ids, sample count를 보존한다.
2. `POST /api/suggestions`의 성과 0건 분기를 브랜드 가이드와 trend signals 기반 가설 3개로 바꾼다. 각 항목에 `basis: hypothesis`, `verified: false`를 붙인다.
3. 댓글은 먼저 read-through provider adapter를 제안한다. DB 확정 전에는 댓글 본문 저장을 하지 않고 provider에서 읽어 응답하며, 답글도 provider로 직접 보낸다. defer, 답글 이력, 통합 inbox는 DB 선택 후 구현한다.

## 5. build 단계 계약 테스트 계획

테스트 이름은 시험 항목 번호와 한국어 설명을 함께 둔다.

| 번호 | 계층 | 정상 경로 | 거절 경로 | 경합 경로 |
|---|---|---|---|---|
| BE-V62-01 | 통합 | `BE-V62-01 성과 제안을 기존 생성 큐 초안으로 보낸다` | `BE-V62-01 빈 제안은 400으로 거절한다` | 같은 idempotency key의 동시 요청은 큐 1건만 만든다 |
| BE-V62-02 | 단위와 통합 | `BE-V62-02 성과 0건이면 가설 세 개를 반환한다` | `BE-V62-02 tenant가 없으면 401을 반환한다` | 해당 없음 |
| BE-V62-03 | 통합 | `BE-V62-03 게시물 댓글 본문을 provider에서 읽는다` | `BE-V62-03 외부 게시물 id가 없으면 400을 반환한다` | 해당 없음 |
| BE-V62-04 | 통합 | `BE-V62-04 댓글에 답글을 보내고 provider id를 반환한다` | `BE-V62-04 빈 답글과 다른 tenant 게시물을 거절한다` | 같은 idempotency key의 동시 답글은 provider 호출 1회만 허용한다 |
| BE-V62-05 | 계약 | `BE-V62-05 Threads 답글 권한이 readiness에 표시된다` | `BE-V62-05 권한 없는 token은 reply-ready로 판정하지 않는다` | 해당 없음 |

실제 provider 네트워크를 mock한 테스트만으로 완료를 주장하지 않는다. build에서는 단위와 통합을 만들고, QA에서는 승인된 테스트 계정으로 댓글 조회와 답글 1건, 제안 큐 인계 1건을 실제로 관찰해야 한다.

## 6. 공식 API 벤치마크

| 공식 근거 | 확인한 계약 | 이번 설계에 반영할 점 |
|---|---|---|
| YouTube Comments list | 댓글 목록은 `commentThreads.list` 또는 `comments.list`로 읽고 part와 parent 관계가 필요하다 | 댓글 읽기를 metrics count와 분리하고 provider comment id를 보존한다 |
| YouTube Comments insert | 답글 작성은 parent comment id와 snippet이 필요하다 | reply 요청에 post id만 받지 않고 comment id와 body를 요구한다 |
| Threads API official Postman collection | thread replies 조회와 conversation 조회가 별도다 | 목록과 대화 thread 조회를 provider adapter에서 구분한다 |
| Threads API official Postman collection | reply 생성은 `reply_to_id`가 필요하다 | reply 대상 id를 서버에서 tenant 소유 게시물과 대조한다 |
| Instagram API official Postman collection | comment reply는 `/{ig_comment_id}/replies` POST다 | Instagram도 동일한 내부 reply contract로 감싸되 provider path는 분리한다 |
| YouTube Analytics query | dimensions와 metrics, 날짜 범위를 명시해 보고서를 조회한다 | 30일 판정에는 조회 기간과 표본 수를 응답에 포함한다 |

## 7. API 전수 확인 증거

163개 route 파일을 모두 목록화했다. 대조에 사용한 상위 family와 파일 수는 아래와 같다. route 1개짜리 family도 생략하지 않고 전체 합계가 163인지 확인했다.

| 묶음 | route 수 | 주요 역할 |
|---|---:|---|
| queue | 12 | 생성 큐 CRUD, 승인, 변형, 승격, seed |
| video | 8 | 업로드, 생성, 재가공, 발행, 목록, 삭제 |
| blog-queue | 7 | 블로그 큐 CRUD와 승인 |
| design-tools | 5 | Figma, Canva, MCP 연결 |
| higgsfield | 5 | 이미지와 영상 생성, 상태, 비용, asset |
| images | 4 | 업로드, 조회, 전달 |
| keyword-bank | 4 | 키워드 저장과 사용 상태 |
| studio | 4 | brand setup, drafts, engine status, text |
| channels | 3 | provider account 목록, 기본값, 삭제 |
| connect | 3 | OAuth 시작, callback, readiness |
| figma | 3 | 슬라이드 생성과 export |
| popular | 3 | 인기글 목록, 추가, 삭제 |
| 기타 86개 family | 102 | 분석, 발행, 예약, 알림, 채널 설정, 생성 도구, 운영 |
| 합계 | 163 | `dashboard/src/app/api/**/route.ts` 실측 |

## 8. 레드팀과 셀프심문

### 레드팀

공격: 기존 `queue/add`가 있으므로 제안 인계는 이미 있다고 볼 수 있고, `drafts.payload` JSONB가 있으므로 댓글과 학습 이력도 거기에 넣으면 새 계약 없이 빨리 끝낼 수 있다.

수정: API의 존재와 사용자 동선의 연결은 다르다. 제안 ID, 근거, 표본, idempotency를 보존하지 않은 수동 queue call은 R56의 학습 고리를 증명하지 못한다. 댓글과 학습 이력을 draft JSONB에 넣으면 게시물 단위 동시성, provider comment unique key, tenant RLS, 상태 조회가 불안정해진다. 따라서 저비용 인계는 기존 큐를 재사용하되 명시적 계약 테스트를 붙이고, 댓글 지속성은 DB 선택 전 확정하지 않는다.

### 셀프심문

질문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 무엇인가?

답: route 파일 밖의 cron, 외부 worker, OpenClaw extension이 댓글과 제안 인계를 수행할 가능성이다. 이를 확인하려고 `dashboard/src`, queue helper, provider scope, DB schema에서 comment, reply, suggestion, enqueue 관련 경로를 교차 검색했다. 숫자 replies 외 댓글 본문 provider 호출은 없었고, suggestions가 queue를 호출하는 경로도 없었다. 외부 배포 환경의 비공개 worker는 이번 저장소 감사만으로 미검증이다.

## 9. 게이트 상태와 종료 판정

| 단계 | 상태 | 증거와 비고 |
|---|---|---|
| design | 미승인 | v62는 stage artifact이나 approved artifact가 아니다 |
| eng-design | 미착수 | API 계약과 DB 선택 합의가 없다 |
| build | 차단 | `artifacts_ok: false`, 만료된 override뿐이다 |
| 소스 수정 | 0건 | 게이트 규율에 따라 변경하지 않았다 |
| 구현분 실행 증거 | 없음 | 구현분 자체가 없으므로 요청 실행을 통과했다고 주장하지 않는다 |

다음 실행: 부모 컨트롤러가 v62 design 승인 여부를 확정하고, 댓글 지속성 및 제안 lifecycle의 DB 선택을 회장과 합의한다. 종료증거는 `pipeline-state.osmu.md`에 승인된 design과 eng-design 산출물 버전 핀이 기록되는 것이다. 이후 code-builder가 위 계약 테스트를 먼저 작성하고 실제 API 요청을 관찰한다.

---

🏷 STAMP | line: osmu | 생성: 2026-08-27 20:40 KST | model: gpt-5.6 | agent: code-builder

SKILLS_USED: 없음

SKILLS_SKIPPED: 매칭되는 설치 코드 스킬 없음. `dev.md`, `benchmarks.md`, `doc-review.md`와 저장소 규율을 적용했다.

SOURCES: `docs/prototype/openclaw-auto-4room-v62.html` | `docs/requests/회장-확정-요구사항-대장.md` | `dashboard/src/app/api/**/route.ts` | `dashboard/db/schema.sql` | https://developers.google.com/youtube/v3/docs/comments/list | https://developers.google.com/youtube/v3/docs/comments/insert | https://developers.google.com/youtube/analytics/reference/reports/query | https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api | https://www.postman.com/meta/instagram/request/23987686-59e5000b-326c-42a1-8545-b984c7fd0e40

MODEL: gpt-5.6 / code-builder

RUBRIC_SCORE: completeness=5/5 evidence=5/5 traceability=5/5 decisions=5/5 readability=4/5 total=24/25

WEAKEST_SECTION: 163개 route의 상위 family 합계는 전수 실측했지만, 비공개 외부 worker의 존재 여부는 저장소만으로 검증할 수 없다.
