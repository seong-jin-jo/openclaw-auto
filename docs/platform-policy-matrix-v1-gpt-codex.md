# 플랫폼별 API 정책 매트릭스 v1

> 목적: openclaw-auto(마케팅 자동화 SaaS)의 design / eng-design 단계 **사실 입력 자료**.
> 이 문서는 기획서가 아니다. 판단·설계는 이 사실 위에서 별도로 한다.

## STAMP

| 항목 | 값 |
|------|-----|
| 생성 시각 | 2026-08-08 (KST) |
| 모델 | claude-opus-5[1m] (research 위임: sonnet 5개 병렬 워커) |
| 에이전트 | general-purpose 리서치 워커 5 + 컨트롤러 종합 |
| 대상 채널 | 16개 (IMPLEMENTED_PLUGINS, `dashboard/src/lib/constants.ts:100-117` 실측) |
| 근거 URL 개수 | 71 |
| 미확인 / 공식 확정 필요 항목 수 | 31 (본문 표기, 하단 집계) |
| 기반 | 코드 실측(constants.ts) + 각 플랫폼 공식 개발자 문서 + 경쟁사 공식 help 문서 |
| 금지 준수 | 소스코드·API·DB·배포 변경 없음. 이 md 1개만 생성 |

**증거 등급 표기 규칙**: `[공식]` = 플랫폼 공식 문서에서 직접 확인 / `[2차]` = 신뢰 가능한 2차 출처만 / `[미확인]` = 확인 실패 / `[확정필요]` = 출처 간 수치 충돌.

---

## 1. 요약 표 (채널 × 핵심 6항목)

| 채널 | 인증 방식 | 앱 심사 | 계정 요건 | **한도 단위** | 24h 발행 상한 | 확장 위험도 |
|------|-----------|---------|-----------|---------------|----------------|-------------|
| **youtube** | OAuth 2.0 (우리 GCP 프로젝트 1개) | **필수 2중** (Google 민감스코프 검증 + YouTube 컴플라이언스 감사) | 일반 채널 가능 | **🔴 앱(GCP 프로젝트) 전체 공유** | 10,000 유닛/일 ÷ insert 비용 → **6건 또는 100건** `[확정필요]` | **상 (최악)** |
| **tiktok** | OAuth 2.0 (우리 앱 1개) | **필수** (미감사 시 SELF_ONLY 강제) | 신청 시 비즈니스 계정 `[2차]` | 앱 캡(비공개) + 계정당 캡 | ~15건/계정 `[2차]`, 미감사 시 **24h 내 5명 유저까지만** `[공식]` | **상** |
| **x** | OAuth 1.0a(쓰기) / 2.0 | 심사 없음, **과금 게이트** | 제한 없음 | 앱+유저 혼합 → **2026-02부터 종량제** | 하드캡 없음, **$0.015/건**(URL 포함 시 $0.20) `[2차]` | **상 (비용)** |
| **linkedin** | OAuth 2.0 | **필수** (법인 검증 + 스크린캐스트) | **법인** + Page super admin | 앱 전체 + 회원별 이중, **수치 비공개** | `[미확인]` 비공개 | **상** |
| **naver_blog** | — | — | — | — | **공식 발행 API 없음** (2020-05 글쓰기 API 종료) | **상 (불가)** |
| **midjourney** | 비공식 wrapper만 | — | — | — | 공식 퍼블릭 API 없음, ToS상 자동화 금지 | **상 (불가)** |
| **pinterest** | OAuth 2.0 | **필수** (Trial→Standard, 영상 데모) | **비즈니스 계정 필수** | Trial=**앱 전체 300/day** / Standard=**유저당 100/min** | 명시 캡 없음(분당 제한 대체) | **중** (Standard 승격 전 상) |
| **instagram** | OAuth 2.0 | **필수** (`instagram_business_content_publish`) | **프로페셔널**(비즈니스/크리에이터), FB Login 경로면 Page 연결 | **유저(계정)당** | **100건/24h 롤링** `[공식]` (25는 구버전 잔존 수치) | **중** |
| **facebook** | OAuth 2.0 | **필수** (`pages_manage_posts` 등 Advanced Access) | **페이지** + admin 권한 | Page당 BUC(4800×engaged users/24h) + 앱당 플랫폼(200×users/hr) | "25/day" `[확정필요]` | **중** |
| **tumblr** | OAuth 1.0a / 2.0 | 없음 | 제한 없음 | **앱(consumer key) 1,000/hr·5,000/day** + 유저당 250 posts/day | 250건/유저 | **중** (앱 키 병목) |
| **discord** | 봇 토큰 / 웹훅 URL | 서버 100개↑ 봇 검증, privileged intent는 유저 10,000↑ | 서버 admin(웹훅 생성) | **봇 전역 50 req/s 공유** + 웹훅 5req/2s(길드 버킷 공유) | 실질 무제한 | **중** |
| **telegram** | 봇 토큰 | 없음 | 채널 admin | **봇당 30 msg/s 공유** + 동일 chat 1/s | 실질 무제한 | **하~중** |
| **line** | 채널 액세스 토큰(테넌트 소유) | OA 인증은 선택·유료 | **LINE 공식계정** 필수 | 채널(OA)당 + **플랜별 월 무료 건수** | 월 500 / 5,000 / 50,000 (플랜별) | **중** (과금) |
| **slack** | OAuth 2.0 (우리 앱, 워크스페이스별 토큰) | 마켓플레이스 등재 시만(4~6주) | 워크스페이스 admin | **워크스페이스별** (채널당 1 msg/s) | 실질 무제한 | **하** |
| **bluesky** | OAuth 2.0 / app password (유저 소유) | 없음 | 개인 계정 가능 | **계정당** 5,000pt/h·35,000pt/day | ~11,666건 (실질 무제한) | **하** |

**핵심 한 줄**: 한도가 **앱/프로젝트 전체 공유**인 채널(youtube, tumblr, discord, telegram, pinterest-Trial)이 회원 증가 시 먼저 터진다. **유저(계정)당**인 채널(instagram, threads, bluesky, facebook-BUC, slack)은 회원이 늘어도 선형 확장된다.

> threads는 표 정렬상 아래 상세에 포함: 인증 OAuth 2.0 / 심사 필요 / 계정 제한 없음 / **유저당 250건 24h 롤링** `[공식]` / 위험도 **하**.

---

## 2. 채널별 상세

### 2.1 threads — 위험도 하

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. Meta 앱 1개(우리 소유), 유저는 OAuth 인가만 `[공식]` |
| 심사 | 테스터 외 유저에게 쓰려면 App Review 필요. 스코프: `threads_basic`, `threads_content_publish`, `threads_manage_replies`, `threads_read_replies`, `threads_manage_insights`. 기간·제출물 상세 `[미확인]` |
| 계정 요건 | 비즈니스 전환 불필요. **공개 프로필**은 권한 90일(갱신 가능), **비공개 프로필**은 연장 불가 → 만료 시 재인가 필수 `[공식]` |
| **한도 단위** | **프로필(계정)당**. 게시 250건/24h 이동창(86,400s). 추가로 "4800 × impressions"의 콜 상한. 확인 엔드포인트 `GET /{threads-user-id}/threads_publishing_limit` `[공식]` |
| 24h 상한 | 게시 250 / 답글 1,000 / 삭제 100. 캐러셀은 1건으로 계산 |
| 콘텐츠 규격 | `[미확인]` (2차 출처는 500자라 하지만 공식 확인 실패) |
| 토큰 | 단기 1시간 → 장기 60일, `GET /refresh_access_token`으로 갱신 |
| 자동화 정책 | Threads 전용 조항 `[미확인]`. Meta Platform Terms 일반 스팸 조항 적용 |
| 함정 | ① 이동창(달력일 아님)이라 자정 리셋 가정하면 틀림 ② 비공개 프로필 토큰은 조용히 만료되고 refresh 불가 |

### 2.2 instagram — 위험도 중

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. Instagram Login(`graph.instagram.com`) 또는 Facebook Login for Business(`graph.facebook.com`). 앱은 우리 소유 1개 |
| 심사 | `instagram_business_content_publish` 등 App Review 필요. 소요 2~4주 `[2차]` |
| 계정 요건 | **프로페셔널 계정 필수**(비즈니스 또는 크리에이터). FB Login 경로면 Facebook Page 연결 필요 + Page Publishing Authorization 요구될 수 있음 `[공식]` |
| **한도 단위** | **IG User ID(계정)당**. 앱 전체 공유 아님 `[공식]` |
| 24h 상한 | **100건 / 24h 이동창** — 공식 문서 원문 "limited to 100 API-published posts within a 24-hour moving period". 널리 퍼진 **25건은 구버전 잔존 수치**(Ayrshare 등 2차 출처). 확인 엔드포인트 `GET /{ig-user-id}/content_publishing_limit`. 앱 내 수동 게시에는 미적용 `[공식]` |
| 콘텐츠 규격 | 이미지 **JPEG만**. 캐러셀 최대 10장, 첫 장 비율로 크롭(기본 1:1). **릴스 발행 가능**: `POST /{ig-user-id}/media` with `media_type=REELS` + 공개 `video_url` → 컨테이너 상태 폴링 → `/media_publish`. 커버는 `cover_url`(권장 1080×1920). 릴스 탭 노출 조건 9:16 / 5~90초 `[2차]` — 범위 밖이면 일반 영상 게시로 강등 |
| 토큰 | IG 전용 장기 토큰 수명 `[미확인]` (Meta 일반 패턴 60일 추정, 재확인 필요) |
| 자동화 정책 | 전용 조항 `[미확인]` |
| 함정 | ① 25 vs 100 혼선 ② 규격 이탈 시 릴스가 조용히 일반 영상으로 강등 ③ PNG 업로드 실패 ④ 컨테이너 폴링 타임아웃 |

### 2.3 facebook (페이지) — 위험도 중

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. 유저 토큰 → Page 토큰 교환. 앱은 우리 소유 |
| 심사 | `pages_manage_posts`·`pages_read_engagement`·`pages_show_list` 전부 App Review 필요. 고객 페이지를 대행하려면 **모든 권한 Advanced Access** 필요. 심사 약 5영업일 `[2차]` |
| 계정 요건 | Facebook **Page**(개인 프로필 불가) + 인가 유저의 admin/publish 권한 |
| **한도 단위** | **혼합**. Platform Rate Limit = 앱 전체 "1시간당 200 × 일일 활성 유저 수". Business Use Case(BUC, Page) = **Page당 24h "4800 × engaged users"** `[공식]` |
| 24h 상한 | "25건/일" 주장 존재하나 공식 rate-limiting 문서에는 콜량 공식만 있고 게시 건수 하드캡 문장 없음 → **`[확정필요]`** |
| 콘텐츠 규격 | `[미확인]` (`/{page-id}/feed`, `/photos`, `/videos` 경로) |
| 토큰 | 단기 Page 토큰 1~2시간 → 장기 Page 토큰(유저 장기 토큰이 유효하고 Page 역할 유지 시 실질 무기한) `[미확인]` 원문 재확인 필요 |
| 자동화 정책 | Pages 전용 조항 `[미확인]` |
| 함정 | ① 앱 단위(200×users/hr)와 Page 단위(BUC) 공식을 혼동 ② "콘텐츠를 게시합니다" 수준의 막연한 use case 서술로 심사 반려 ③ 제3자 페이지 대행 시 Business Verification 누락으로 Advanced Access 상실 |

### 2.4 x (트위터) — 위험도 상 (비용)

| 항목 | 내용 |
|------|------|
| 인증 | 쓰기는 OAuth 1.0a, 앱 전용 컨텍스트는 OAuth 2.0. "테넌트마다 자체 개발자 앱이 필요한가 vs 운영사 앱 1개로 다수 계정 인가" 구조는 `[미확인]` — 설계 전 확정 필요 |
| 심사 | Meta식 앱 리뷰 없음. **접근은 요금 티어로 게이팅** |
| 계정 요건 | 비즈니스/크리에이터 요건 없음 |
| **한도 단위 / 과금** | **2026-02-06부터 신규 개발자는 고정 티어 대신 종량제(pay-per-use)가 기본. 신규 가입에 무료 티어 없음.** 기존 Basic($200/mo)·Pro($5,000/mo) 구독자는 유예되나 2026-06-01부터 자동 이관 시작. Enterprise ~$42,000+/mo. 종량제 단가: **게시 생성 $0.015/건, URL 포함 시 $0.20/건**, 읽기 $0.005/건(월 200만 건 상한) `[2차, 복수 출처 일치]` |
| 24h 상한 | 종량제에서는 하드캡 없음 = **예산이 곧 상한**. 레거시 티어 기준 유저당 100건/24h·앱당 10,000건 `[확정필요]` |
| 콘텐츠 규격 | `[미확인]` (통상 280자, 영상 140초 등 현행 재확인 실패) |
| 토큰 | OAuth 1.0a 토큰은 폐기 전까지 무기한. OAuth 2.0 유저 토큰 약 2시간 + refresh `[미확인]` |
| 자동화 정책 | 개발자 계약상 중복/근사 중복 스팸 및 부가가치 없는 순수 자동화 금지 — 2026 현행 문구 `[미확인]` |
| 함정 | **유료가 필수인가 → 신규 개발자는 사실상 예** (무료 티어 소멸). URL 포함 게시가 13배 비싸다는 점이 마케팅 SaaS에 치명적(마케팅 글은 링크를 붙인다) |

### 2.5 bluesky — 위험도 하

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0(권장) 또는 app password(신규는 비권장). **크리덴셜은 유저 소유** — 테넌트마다 자기 PDS 계정을 연결. 봇 토큰 같은 앱 단위 발행 주체 없음 |
| 심사 | 없음. 유료 티어도 없음 |
| 계정 요건 | 개인 계정 가능. 비즈니스 등급 개념 없음 |
| **한도 단위** | **계정당** 포인트제: 5,000pt/시간, 35,000pt/일. createRecord(게시) 3pt → 시간당 ~1,666건, 일 ~11,666건. 세션 생성 30/5min·300/day. IP 기준: 계정 생성 100/5min, 전체 ~3,000 req/5min `[공식]` |
| 24h 상한 | ~11,666건/계정 (실질 무제한) |
| 콘텐츠 규격 | 텍스트 **300 grapheme / 최대 3,000 byte UTF-8**. 링크·멘션·해시태그는 richtext facet으로 별도 저장(grapheme 미포함). 이미지 최대 4장, blob 현재 1MB(2MB 인상 예정) `[확정필요]`. JPEG/PNG/WebP. blob 일반 상한 50MB |
| 토큰 | app password는 폐기 전까지 무기한. OAuth 토큰 수명 `[미확인]` |
| 자동화 정책 | 명시 조항 `[미확인]`. 심사 게이트 없어 관용적으로 판단 |
| 함정 | ① byte(3,000) vs grapheme(300) 혼동, 이모지=1 grapheme ② 1MB 초과 이미지 업로드 거부 ③ app password 폐지 흐름 ④ 셀프호스팅 PDS는 한도가 다를 수 있음 `[미확인]` |

### 2.6 telegram — 위험도 하~중

| 항목 | 내용 |
|------|------|
| 인증 | @BotFather 봇 토큰. **두 모델 가능**: 공용 봇 1개(우리 소유, chat_id로 분기) 또는 테넌트별 봇 |
| 심사 | 없음 |
| 계정 요건 | 채널 게시는 봇이 해당 채널 admin이어야 함 |
| **한도 단위** | **주로 봇(토큰)당 = 공용 봇이면 전 테넌트 공유**. 전역 30 msg/s, 동일 개인 chat ~1 msg/s, 동일 그룹 ~20/min. sendMessage·sendMediaGroup·editMessage·sendChatAction이 카운터 공유. 수 초 내 20건 초과 버스트는 공표치 이하에서도 스로틀 `[2차]` |
| 24h 상한 | 일일 캡 문서화 없음. 실질 제약은 동일 chat 1/s |
| 콘텐츠 규격 | 텍스트 4,096자, 캡션 1,024자. 사진 ≤10MB, 문서/영상 ≤50MB(셀프호스팅 Bot API 서버는 2,000MB) |
| 토큰 | 만료 없음. BotFather에서 재발급 시에만 재연결 |
| 자동화 정책 | 봇이 곧 자동화 수단. 명시 스팸 조항 `[미확인]`, per-chat 1/s가 사실상 안티스팸 |
| 함정 | ① 멀티테넌트가 공용 봇으로 팬아웃하면 30/s 천장에 걸림 → **봇당 큐 필요** ② 캡션(1,024)과 본문(4,096) 한도가 달라 잘림 버그 ③ 429의 `retry_after`를 지키지 않으면 봇 일시 차단 |

### 2.7 discord — 위험도 중

| 항목 | 내용 |
|------|------|
| 인증 | 봇 토큰(개발자 포털, 앱 소유=우리) 또는 채널별 웹훅 URL(테넌트 admin이 생성해 전달) |
| 심사 | 서버 100개 이상이면 봇 검증. **privileged intent**(Message Content 등) 승인 기준이 서버 100개 → **고유 유저 10,000명**으로 2026 변경 `[2차]`. 발행만 하면 Message Content intent 불필요 |
| 계정 요건 | 테넌트가 자기 서버의 admin("Manage Webhooks" 또는 봇 초대 권한) |
| **한도 단위** | 웹훅 5 req/2s, **한 길드의 모든 웹훅이 같은 `X-RateLimit-Bucket` 공유**. 봇은 **전역 50 req/s가 앱 단위로 모든 길드에 걸쳐 공유** ← 멀티테넌트 핵심 리스크. 10분간 invalid(401/403/429) 10,000건이면 IP 차단 `[2차/공식 이슈]` |
| 24h 상한 | 일일 캡 없음. 웹훅당 ~216,000건/일 이론치 |
| 콘텐츠 규격 | 본문 2,000자. embed: title 256, description 4,096, footer 2,048, field ≤25(name 256/value 1,024), 메시지 내 embed 텍스트 총합 ≤6,000, embed ≤10개 |
| 토큰 | 봇 토큰 무기한(리셋 시에만 변경). 웹훅 URL은 서버 admin이 삭제/재생성하면 **조용히 깨짐**(별도 이벤트 없음, 404 처리 필요) |
| 자동화 정책 | 봇/웹훅이 정식 경로. 대량 발송 조항 `[미확인]` |
| 함정 | ① 단일 봇 앱으로 다수 테넌트를 라우팅하면 전역 50/s가 실제 천장 → 중앙 큐 필요 ② 길드 버킷 공유로 대량 테넌트가 서로를 스로틀 ③ 웹훅 무효화가 무통보 |

### 2.8 slack — 위험도 하

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. **앱(client id/secret)은 우리 소유 1개**, 워크스페이스마다 자체 봇 토큰(`xoxb-`) 발급. 또는 Incoming Webhook |
| 심사 | **App Directory/Marketplace 등재 시에만** 필요(약 4~6주, use case·리스팅·데이터 접근 스코프 검토). 고객에게 직접 배포하는 OAuth 설치는 심사 불필요 `[공식]` |
| 계정 요건 | 워크스페이스 admin/owner(또는 앱 설치 권한) |
| **한도 단위** | **워크스페이스 설치별**(테넌트 간 분리). `chat.postMessage` **채널당 1 msg/s**(버스트 허용) + 워크스페이스 전체 분당 수백 건 상한 `[공식]` |
| 24h 상한 | 하드 일일 캡 없음. 남용 시 스로틀 또는 **앱 영구 비활성화** |
| 콘텐츠 규격 | `chat.postMessage` 텍스트 하드 캡 `[미확인]`(통상 40,000자 언급, 미확인). Block Kit 한도(블록 50개, text object 3,000자) `[미확인]` |
| 토큰 | **기본적으로 만료 없음**. uninstall·유저 삭제·`auth.revoke`로만 무효화. 토큰 로테이션은 opt-in |
| 자동화 정책 | 봇 게시가 표준 패턴. 지속적 한도 위반은 영구 비활성화로 제재 |
| 함정 | ① "만료 없음"에 안심하다가 테넌트 재설치로 토큰이 조용히 무효화 → `token_revoked`/401 처리 필요 ② Directory 심사(공개 등재용)와 멀티테넌트 OAuth 배포(심사 불요)를 혼동해 불필요한 컴플라이언스 작업 |

### 2.9 line — 위험도 중 (과금)

| 항목 | 내용 |
|------|------|
| 인증 | 채널 액세스 토큰 3종: **장기**(만료 없음), **단기 v2.1**(최대 30일, 채널당 최대 30개, 초과 시 오래된 것 자동 폐기), **stateless**(15분, 조기 폐기 불가). **테넌트가 자기 LINE 공식계정 + Messaging API 채널을 직접 생성** — 공용 앱 크리덴셜 모델 아님 `[공식]` |
| 심사 | Messaging API 활성화는 무료·무심사. **계정 인증**(Blue/Green Shield)은 선택·유료, 약 5~10영업일 `[2차]`. 미인증(Grey)도 API 사용 가능 |
| 계정 요건 | **LINE 공식계정**(개인 LINE과 별개) + 테넌트가 admin |
| **한도 단위** | **채널(공식계정)당**. push는 수신자 수로 계산(5명에게 4개 메시지 객체 = 5건). 차단/부재 유저는 미카운트. **초당 요청 수치는 `[미확인]`** |
| 24h 상한 | 일일 캡이 아니라 **플랜별 월 무료 건수**: Communication 500 / Basic 5,000 / Advanced 50,000(지역별 차이). 초과분은 건당 과금 `[2차/공식 pricing]` |
| 콘텐츠 규격 | 메시지 객체별 문자·미디어 한도 `[미확인]`(텍스트 5,000자 언급 있으나 미검증) |
| 토큰 | 위 3종 참조. 단기 토큰 30개 캡의 FIFO 폐기가 다른 연동을 조용히 깨뜨림 |
| 자동화 정책 | 자동/대량 발송이 본래 용도. 동일 메시지 대량 발송 금지 조항 `[미확인]`. 월 쿼터 + 건당 과금이 실질 억제 |
| 함정 | ① "API 활성화 무료"를 "발송 무제한"으로 오해 ② 단기 토큰 30개 캡 FIFO 폐기 ③ 인증 등급(신뢰 배지)과 API 접근 게이팅을 혼동 |

### 2.10 tumblr — 위험도 중

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 1.0a 또는 2.0. 앱 1개 등록(우리 소유), 유저는 OAuth 인가. 스코프 `basic`/`write`/`offline_access` |
| 심사 | 공식 앱 리뷰 프로세스 없음(등록만) |
| 계정 요건 | 특별 요건 없음 |
| **한도 단위** | **3중**. IP당 300/min·18,000/hr·432,000/day. **consumer key(앱)당 1,000/hr·5,000/day** ← 진짜 병목. 유저당 게시 250/day(리블로그 포함), 이미지 250/day, 영상 20개/day(합 60분) `[공식]` |
| 24h 상한 | 유저당 250건 |
| 콘텐츠 규격 | text/photo/quote/link/chat/audio/video/answer. 사진·오디오 10MB, 영상 500MB·10분. `POST /v2/blog/{id}/post`(legacy) 또는 `/v2/blog/{id}/posts`(Neue Post Format) |
| 토큰 | 만료 고정치 명시 없음 `[미확인]` |
| 자동화 정책 | `[미확인]` — ToS 재확인 필요 |
| 함정 | 앱 키 전체 한도가 낮다(5,000/day). 멀티테넌트가 한 키를 나눠 쓰므로 **회원 수 증가에 취약** |

### 2.11 pinterest — 위험도 중 (Standard 승격 전에는 상)

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. 앱 1개(우리 소유) |
| 심사 | 신규 앱은 즉시 **Trial access**. **Standard access**로 올리려면 실제 동작 영상 데모 제출 + OAuth/보안 구현 검증. 기간 `[미확인]` |
| 계정 요건 | **비즈니스 계정 필수**(개인 계정 API 접근 불가, 개인→비즈니스 전환 또는 신규 생성. 개인 계정을 비즈니스에 연결하는 방식은 폐지) `[공식]` |
| **한도 단위** | **Trial = 앱 전체/일** (org_write/pins·boards 300/day, catalogs 1,000/day). **Standard = 유저당/분** (org_write 100/min/user, read 1,000/min). 전역 100 calls/sec/user/app `[공식]` → **멀티테넌트는 Standard 승격이 사실상 필수** |
| 24h 상한 | 명시 캡 없음(분당 제한이 대체). 커뮤니티 경험칙 10~25핀/일(정책 아님) |
| 콘텐츠 규격 | `POST /v5/pins` — `board_id` + `media_source` 필수, title/description/alt/link 선택. 이미지 권장 2:3, 1000×1500px. 영상 2GB, H.264/AAC, `/v5/media` 업로드 후 참조. 캐러셀 2~5장 |
| 토큰 | access 30일, **continuous refresh token 60일**(구 365일 legacy refresh는 미지원). 60일 방치 시 재인증 |
| 자동화 정책 | 승인된 API 기반 자동화만 허용(비번 로그인·스크레이핑 금지). 동일 이미지 반복, 동일 보드 대량 핀, 100+/day는 스팸 플래그 |
| 함정 | Trial에 갇히면 앱 전체 300/day로 회원 몇 명에 고갈. Standard도 핀 생성은 100/min/user로 낮음 |

### 2.12 linkedin — 위험도 상

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. 앱 1개(우리 소유) + **제품 승인 별도**: 회사 페이지 발행은 **Community Management API**, 개인 프로필 발행은 `w_member_social`(Share on LinkedIn) |
| 심사 | Community Management API는 **법인 심사 필수** — 사업자 이메일(개인 메일 불가), 법인명·주소·웹사이트·개인정보처리방침, LinkedIn Page **super admin**의 앱 연결 검증. **Development → Standard tier 2단계**, Standard 승격 시 **화면 녹화(나레이션 권장)**로 OAuth 플로우·게시·댓글 표시 실동작 증명. 기능 변경 시 재심사 `[공식]` |
| 계정 요건 | Community Management API는 **등록 법인(상업 용도)만**. 개인 프로필 발행은 일반 앱도 가능하나 **programmatic refresh token은 MDP 승인 앱만** |
| **한도 단위** | **앱 전체 일일 한도 + 회원별(앱당·일) 한도 이중 구조**. **구체 수치 비공개** — Developer Portal Analytics 탭에서 앱별 확인, 75% 도달 시 admin 이메일 경보. 2차 추정(회원당 ~100콜/일, 앱 전체 ~10만/일) `[확정필요]` |
| 24h 상한 | `[미확인]` (비공개) |
| 콘텐츠 규격 | 본문 3,000자, 영상 최대 15분(조직 게시). ugcPosts/Posts API 정확한 필드 스키마 `[미확인]` |
| 토큰 | access token 60일 고정. **MDP 승인 앱만 refresh token 프로그래매틱 갱신(refresh 유효 1년)**. 일반 앱은 refresh token 미지급 → **60일마다 전 테넌트 재로그인** |
| 자동화 정책 | User Agreement 8.2 "Prohibited Software and Extensions" — 스크레이핑·비인가 자동화·봇 접근 금지. 공식 API 발행은 허용, restricted use case면 심사 반려 |
| 함정 | ① 개인 이메일로는 vetting 통과 불가 ② Standard tier 스크린캐스트 데모가 반려 사유 1순위 ③ 일반 앱 refresh token 부재로 60일 주기 재인증 UX 폭탄 ④ 한도 수치 비공개라 사전 설계에 버퍼 필요 |

### 2.13 tiktok — 위험도 상

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0 Bearer. **앱(client_key/secret)은 우리 소유 1개**, 전 테넌트 공유. 유저별 access token 개별 발급 |
| **심사(핵심)** | Content Posting API는 **미감사(unaudited client) 상태로도 즉시 호출 가능하지만, 게시물이 강제로 `SELF_ONLY`(비공개)로만 발행된다.** 공개 게시를 열려면 **audit 통과 필수** `[공식]`. 기간은 공식 SLA 없음 — 3~5영업일~1~4주 `[2차/확정필요]` |
| 계정 요건 | API 신청 시 **검증된 비즈니스 계정** 요구 `[2차, 공식 문구 미확인]`. 게시 대상 크리에이터 계정은 일반 계정도 Direct Post 동작 |
| **한도 단위** | **앱 단위 + 계정 단위 이중**. 유저 토큰당 **분당 6회 요청**(초기화 기준, 429로 감지) `[공식]`. 계정당 24h 발행 ~15건(모든 API 클라이언트 합산 공유) `[2차]`. **미감사 클라이언트는 24시간 내 최대 5명 유저에게만 게시 허용** `[공식]`. 앱 전체 상한은 **비공개**, 승인 과정에서 개별 협상 `[확정필요]` |
| 24h 상한 | 계정당 ~15~25건 `[2차]`. 공식 미공개 |
| 콘텐츠 규격 | mp4/mov/webm. 캡션 최대 2,200 UTF-16 code unit. 필수: `privacy_level`(PUBLIC_TO_EVERYONE / MUTUAL_FOLLOW_FRIENDS / FOLLOWER_OF_CREATOR / SELF_ONLY), `source`(PULL_FROM_URL 또는 FILE_UPLOAD). FILE_UPLOAD면 `video_size`/`chunk_size`/`total_chunk_count`, PULL_FROM_URL이면 `video_url`. 커버 `video_cover_timestamp_ms`(미지정 시 첫 프레임). **PULL_FROM_URL은 도메인 소유 검증 필수** — Manage Apps 포털에서 검증한 도메인/URL prefix 하위여야 함 `[공식]` |
| 토큰 | access **24시간**(86400s), refresh **1년**(31536000s, 갱신 시 자동 연장). 1년 미사용 또는 유저 철회 시 재로그인 |
| 자동화 정책 | Community Guidelines가 봇·다수 계정 운영·반복 콘텐츠 살포 금지. **2025-09-15부 Originality Policy 강화** — 서드파티 워터마크·근사 중복 업로드 노출 감소. API 에러 코드에 `spam_risk_too_many_posts`, `spam_risk_user_banned_from_posting` 존재(빈도·중복 검사가 API 단에서 실시간 작동) |
| 함정 | ① **감사 전에는 뭘 해도 비공개** → "발행됐는데 안 보임" 오인 ② 미감사 상태 유저 5명/24h 캡으로 파일럿 이상 운영 불가 ③ 앱 레벨 총 캡이 비공개라 테스트에서 못 본 임계치에서 프로덕션이 갑자기 막힘 |

### 2.14 youtube (쇼츠 중심) — 위험도 상 (최악)

| 항목 | 내용 |
|------|------|
| 인증 | OAuth 2.0. 유저별 access/refresh token이지만 **client id/secret = Google Cloud 프로젝트가 우리 1개**, 전 유저 공유 `[공식]` |
| **심사(2중, 별개)** | ① `youtube.upload`은 **민감 스코프** → Google sensitive-scope verification(개인정보처리방침 게시, 도메인 소유 검증, 시연 영상) ② 별도로 **YouTube API Services "Audit and Quota Extension Form"** 제출해 컴플라이언스 감사 통과 → 기본 1만 유닛 이상 증량 가능. **두 절차는 별개** `[공식]` |
| 미감사 시 제약 | 2020-07-28 이후 신규 API 클라이언트가 컴플라이언스 감사를 통과하지 못하면 **업로드가 `private`로만 가능, 공개 게시 불가** `[2차/확정필요 — 공식 원문 직접 인용 실패]` |
| 계정 요건 | 별도 비즈니스 계정 요건 확인 안 됨. 일반 채널로 가능 |
| **한도 단위(가장 중요)** | **쿼터는 Google Cloud 프로젝트 단위이며 그 프로젝트에 붙은 모든 최종 사용자가 공유한다. 유저별 분리 쿼터 없음.** 기본 프로젝트당 **10,000 유닛/일** + `search.list` 100회/일 + `videos.insert` 100회/일 별도 하드캡 `[공식]` |
| **insert 유닛 비용 충돌** | 공식 페이지 내부에서 "1600 포인트(최고비용)"와 "call당 1 quota"가 동시에 서술됨. 2차 출처 다수는 **2025-12-04부로 1600 → 약 100 유닛 인하**를 Revision History 근거로 주장. **`[확정필요]`** → 1600이면 **하루 약 6건**(전 테넌트 합산), 100이면 **하루 100건**. **17배 차이로 용량 설계가 갈린다** |
| 24h 상한 | 위 쿼터 계산이 곧 상한. 추가로 `videos.insert` 자체 100회/일 하드캡(유닛 소진과 무관하게 존재) |
| **쇼츠 판정 조건** | **정사각형 또는 세로 비율 + 3분 이하** = 자동 Shorts 분류(2024-10-15 업로드분부터, 기존 60초 룰 확장) `[공식]`. 권장 1080×1920(9:16). **`#Shorts` 해시태그는 필수 아님**(자동 판정), 노출 관례상 권장 |
| **쇼츠 업로드 경로** | **Shorts 전용 API·엔드포인트 없음.** 일반 `videos.insert` + resumable upload 동일 경로. Shorts 전용 메타데이터 필드 없음(snippet/status 스키마 동일) |
| 토큰 | **미검증(Testing) 앱: refresh token이 발급 7일 후 자동 만료 + 테스트 유저 100명 하드캡** `[2차]`. **검증 완료(Production) 앱: 6개월 미사용 시에만 만료, 유저당 토큰 50개 캡, 철회 전까지 무기한** |
| 자동화 정책 | API 크리덴셜 제3자 공유 금지. **"최소 변경으로 대량의 유사 콘텐츠를 자동 생성"하는 행위 명시적 금지.** 반복/중복 콘텐츠는 수익화 부적격 및 계정 정지 리스크 `[공식]` |
| 함정 | ① 쿼터가 SaaS 전체 단위 → 한 테넌트의 대량 업로드가 다른 테넌트를 막는 **noisy neighbor** ② insert 유닛 비용 변경 주장으로 용량 산정 불가 ③ 감사 미통과 시 private 강제 |

### 2.15 naver_blog — 위험도 상 (공식 경로 없음)

- **공식 발행(글쓰기) API: 없음.** 네이버는 **2020년 5월 "글쓰기 API"를 광고성 블로그 대량생산 차단 목적으로 공식 종료**했다(뉴스핌·뉴시스 2020-04 보도). 종료 이전 발행 글은 유지되나 신규 API 발행 경로는 그 시점부터 차단.
- **2026 현재 확인 가능한 것**: 검색 오픈API(`/v1/search/blog`) — 블로그 **검색만** 가능. client ID/secret 호출, 로그인 불필요.
- **한계 고백**: 리서치 환경에서 `developers.naver.com` 직접 fetch가 차단되어 2026 시점 공식 페이지 원문 재확인은 못 했다. "현재도 글쓰기 API 미제공"은 **2020 종료 보도 + 이후 재개 공지 부재**에 기반한 판단이다. → `[확정필요]`
- **파트너/상업 경로**: 확인된 공식 파트너 발행 API 없음. 스크레이핑은 권장하지 않음(지시 준수).
- **비-API 대안**: 스마트에디터 수동 발행. 네이버 블로그 RSS는 구독용이며 발행용 아님.
- **경쟁사 커버리지**: Later·Metricool·Buffer·Hootsuite·Publer 5개 툴 공식 채널 목록에 **네이버 블로그 없음** → 글로벌 툴의 한국 로컬 공백. 우리가 반자동(초안 생성 + 사람 수동 발행)으로라도 메우면 차별점이 된다.

### 2.16 midjourney — 발행 채널 아님 (이미지 생성)

- **공식 퍼블릭 API: 2026 현재도 없음.** Discord 봇과 자체 웹앱만 공식 인터페이스.
- **ToS**: Discord·웹 양쪽 모두 **자동화된 접근을 명시적으로 금지**. 시중 "Midjourney API"는 전부 비공식 wrapper(브라우저 에뮬레이션 / 봇 계정 풀).
- **상업적 이용**: 플랜 티어에 따라 상업 이용권 차등(무료·베이직 제한, 유료 이상 부여). 티어별 세부 조항 `[미확인]` — midjourney.com 공식 ToS 원문 대조 필요.
- **Enterprise API**: 설문 등으로 타진한 정황은 있으나 2026 현재 정식 출시 없음 `[2차]`.
- **함의**: 비공식 wrapper 사용은 ToS 위반 + 계정 밴 리스크. 공식 API가 있는 대체 이미지 생성기 검토가 필요하다.

---

## 3. 경쟁 벤치마크

### "later, metricool은 뭐임?" — 직답

- **Later**: 인스타그램·틱톡·유튜브 등 여러 SNS에 콘텐츠를 미리 예약·발행하고 성과를 분석하는 소셜미디어 관리 플랫폼.
- **Metricool**: 소셜 발행 + 광고(Ads) 관리 + 분석을 한 대시보드에 통합한 스페인계 SMB 타깃 마케팅 관리 툴.
- 둘 다 우리와 **같은 카테고리**(다채널 예약 발행 + 분석)이지, 브랜드 지식을 근거로 콘텐츠를 창작하는 에이전트는 아니다.

### 3.1 Later

| 항목 | 내용 |
|------|------|
| 채널 | Instagram, Facebook, TikTok, Threads, YouTube, Pinterest, LinkedIn, Snapchat |
| 가격 | 연간 기준 Starter $18.75/mo, Growth $37.50/mo, Scale $82.50/mo. 플랜별 소셜셋·월 게시수 제한, AI 크레딧 5/50/100. 14일 체험, 상시 무료 플랜 명시 없음 |
| **연결 모델** | **OAuth 원클릭. 사용자가 개발자 앱/API 키 만들 필요 없음.** IG 비즈니스는 연결된 Facebook 페이지 로그인으로 재인증 |
| 문제 표면화 | IG Business 토큰 90일 만료 → 재연결 안내(이메일/알림). 경로 Settings > Social Sets & Access Groups > Edit |
| AI | Caption Writer(문구 생성/리라이트, 브랜드 톤 학습) — 캡션 한정 |

### 3.2 Metricool

| 항목 | 내용 |
|------|------|
| 채널 | Instagram, Facebook, X, LinkedIn, TikTok, YouTube, Pinterest, Twitch 등 `[2차]` |
| 가격 | Free(브랜드 1개, 월 20게시), Starter $20~25/mo(브랜드 최대 10), Advanced $53~67/mo(브랜드 15~50), Custom(50+). **X 계정 연결은 부가금 $10/mo**(2026-07-13 이전 연결분 $5 유지). **공식 pricing 페이지 fetch 실패로 `[미확인]`** |
| **연결 모델** | OAuth. **Instagram은 Business/Creator만 지원(개인 계정 불가)** |
| 문제 표면화 | 토큰 60~90일 만료 시 연결 끊김 → Brand Connections에서 수동 Reconnect. **연결 방식(FB 경유 vs IG 로그인) 변경 시 과거 데이터 유실 경고** |
| AI | MetriLAB AI 런칭 언급만 확인, 기능 깊이 `[미확인]` |

> Metricool의 **X 연결 별도 과금**은 §2.4의 X 종량제 전환이 경쟁사 가격표에 실제로 전가된 증거다. 우리도 X를 붙이려면 원가 전가 구조가 필요하다.

### 3.3 Buffer

| 항목 | 내용 |
|------|------|
| 채널 | Instagram, Facebook, TikTok, LinkedIn, X, YouTube, Threads, Pinterest, Google Business Profile, Bluesky, Mastodon |
| 가격 | Free($0, 채널 3개·채널당 예약 10건), Essentials **$5/채널/월**(연간; 월결제 $6), Team $10/채널/월(월결제 $12). 14일 체험(카드 불필요) |
| **연결 모델** | OAuth 원클릭. IG는 Business/Creator 로그인 필요. 개발자 키 발급은 사용자 몫이 아님 |
| 문제 표면화 | 채널 만료 시 **"Refresh" 버튼**으로 재로그인. **권한 일부만 승인하면 기능 일부가 동작하지 않음을 명문화**. **Instagram 전용 에러 라이브러리 페이지**를 별도 운영(에러코드별 원인·해결) ← 우리가 벤치마크할 최고 사례 |
| AI | AI Assistant — 캡션/후크/해시태그/CTA 생성, 톤 조절, 플랫폼별 리패키징, 부진 게시물 리라이트. OpenAI LLM 명시. **브랜드 지식 그라운딩·성과 피드백 언급 없음** |

### 3.4 Hootsuite

| 항목 | 내용 |
|------|------|
| 가격 | Standard $99/user/mo(계정 10개), Professional $199(무제한 계정), Advanced $399, Enterprise 협의. **무료 플랜 없음**, 14일 체험(체험 중 일일 게시 10~20건 제한) |
| **연결 모델** | 채널 연결은 OAuth 로그인(자체 키 불필요). 별개로 제3자 앱 연동용 **Hootsuite 자체 REST API**가 존재(앱 등록 필요) — 채널 연결과 혼동 주의 |
| 문제 표면화 | 토큰 만료 시 로그인마다 상단 **"Reconnect your social networks" 배너** → 클릭 시 팝업으로 만료 계정 목록. **게시 실패·스트림 미로딩·분석 중단이 함께 발생함을 명시**. **네트워크별 토큰 유효기간 차등을 문서화**(LinkedIn 1년, Facebook/Instagram 60일). 재연결 공식 문서는 401로 직접 확인 실패 `[미확인]` |
| AI | OwlyWriter AI — 캡션 생성, HOOK/AMP/WIIFM/AIDA 카피 프레임워크, 링크 요약 후 게시물 생성, **고성과 게시물 재활용 제안**. 그래도 재학습 루프는 아님 |

### 3.5 Publer

| 항목 | 내용 |
|------|------|
| 가격 | Free(계정 3개, 계정당 대기 10건, 초안 25개, **X 미지원**), Professional $5/mo부터(+계정당 $4, +멤버당 $2), Business $10/mo부터(+계정당 $7, +멤버당 $3), Enterprise 협의 |
| **연결 모델** | OAuth. IG Creator는 다이렉트 스토리 미지원(Business만), Creator가 상품태그·영상분석·스토리 예약을 쓰려면 Facebook 비즈니스 페이지 경유 연결 필요 |
| **문제 표면화(최고 사례)** | TikTok API 한계를 그대로 문서화: (a) 여러 TikTok 계정 동시 게시 불가 (b) 중복/반복 예약 불가 (c) 프라이버시·참여설정 기본값 저장 불가, 매 영상 수동 설정 (d) 앱 내 사운드 추가 불가 — **전부 "TikTok API 한계"로 명시** |
| AI | 공식 help에서 확인 실패 `[미확인]` |

### 3.6 5개 툴 교차 발견 (우리 설계에 직결)

1. **연결 모델은 전부 OAuth 원클릭.** 사용자가 자기 developer app / API key를 발급하는 구조는 **단 하나도 없다.** → 우리가 "사용자가 직접 API 키 발급"을 요구하면 업계 표준과 어긋난다.
2. **토큰 만료 처리 패턴이 사실상 동일**: 배너/이메일 알림 → "Reconnect" 버튼 → 재로그인만으로 복구. IG/FB는 60~90일, LinkedIn은 더 김.
3. **Instagram/TikTok의 Business·Creator 계정 요건을 공식 help에 그대로 문서화**하고, 플랫폼 정책을 우회하지 않고 사용자에게 전가한다.
4. **AI는 전부 "생성 보조" 수준**(캡션·후크·해시태그·톤·리패키징). 공식 문서 어디에도 **브랜드 위키 기반 그라운딩**, **발행 결과가 다음 생성에 피드백되는 학습 루프**, **바이럴 지표를 넘는 퍼널/전환 분석**을 제공한다는 서술이 없다 → **우리 차별점 후보 3개가 그대로 비어 있다.**
5. **네이버 블로그는 5개 툴 모두 미지원**(검색으로도 언급 없음) → 한국 로컬 공백.

---

## 4. 다중 사용자 확장 위험 순위

회원이 늘 때 **먼저 터지는 순서**. 판정 기준 = ①한도가 앱 전체 공유인가 ②감사·심사 게이트가 회원 수를 직접 제한하는가 ③비용이 회원 수에 비례하는가.

| 순위 | 채널 | 왜 먼저 터지나 | 완화책 |
|------|------|----------------|--------|
| **1** | **youtube** | 쿼터가 **GCP 프로젝트 1개에 전 회원이 공유**. 기본 10,000 유닛 → insert 1600이면 **전체 합쳐 하루 6건**. 회원 10명이면 이미 파탄 | ① 컴플라이언스 감사 + 증량 신청을 **회원 모집 전에** 착수 ② insert 유닛 비용 재확인 후 용량 재산정 ③ 회원당 일일 업로드 상한(예: 1건)을 제품에 강제 ④ 큐 우선순위 + 쿼터 소진 시 명시적 대기 상태 ⑤ 최후 수단으로 테넌트 그룹별 GCP 프로젝트 분리(단, 프로젝트마다 감사 필요) |
| **2** | **tiktok** | **미감사 상태에서 24h 내 최대 5명 유저까지만 게시**. 감사 전에는 전부 비공개. 앱 레벨 총 캡도 비공개 | ① 감사 신청을 파일럿 단계에서 즉시 ② 도메인 소유 검증 선행(PULL_FROM_URL) ③ 감사 전 회원 수를 5명 이하로 제한하는 웨이팅 ④ `spam_risk_*` 에러 코드 분기 처리 |
| **3** | **x** | 한도가 아니라 **비용**이 회원 수에 비례. 신규 개발자는 무료 티어 없음. URL 포함 게시 $0.20 = 마케팅 글 원가 폭탄 | ① 채널별 원가 전가(Metricool처럼 X 연결 부가금) ② 회원당 월 게시 크레딧제 ③ 링크는 요약·프로필 링크로 우회해 URL 게시 회피 검토 |
| **4** | **linkedin** | 앱 전체 일일 한도가 존재하고 **수치가 비공개**. 게다가 일반 앱은 refresh token이 없어 **60일마다 전 회원 재인증** | ① Portal Analytics 75% 경보를 운영 알림에 연결 ② MDP 승인 추진(refresh token 확보) ③ 60일 만료 D-7 사전 재연결 유도 UX ④ 법인 심사·스크린캐스트 준비를 별도 태스크로 |
| **5** | **pinterest** | Trial access는 **앱 전체 300/day**. 승격 전에는 회원 수십 명에 고갈 | Standard access 승격(동작 영상 데모)을 우선순위로. 승격 후엔 유저당 단위라 위험 급감 |
| **6** | **tumblr** | **consumer key 전체 1,000/hr·5,000/day**를 모든 회원이 나눠 씀 | 회원당 시간당 콜 배분 + 발행 큐 분산. 증량 경로 `[미확인]` |
| **7** | **discord** | 봇 전역 **50 req/s가 앱 단위로 모든 서버에 걸쳐 공유**. 길드 웹훅 버킷도 공유 | 중앙 큐 + 봇 단위 토큰 버킷. 웹훅 404 감지 → 재연결 요청 UX |
| **8** | **telegram** | 공용 봇이면 **30 msg/s가 전 회원 공유** | 테넌트별 봇 생성 유도(공유 병목 제거) 또는 봇당 큐 + `retry_after` 준수 |
| **9** | **line** | 한도가 아니라 **플랜별 월 무료 건수**가 병목(Communication 500건) | 테넌트가 자기 OA·플랜을 소유하므로 우리 리스크는 낮음. 대신 잔여 쿼터 표시 필요 |
| **10** | **facebook / instagram / threads / bluesky / slack** | 한도가 **계정/워크스페이스 단위**라 회원 증가에 **선형 확장**. 병목은 한도가 아니라 **심사 통과와 계정 요건**(IG 프로페셔널, FB Page admin) | 심사는 1회성 비용. 온보딩에서 계정 요건 사전 검증 |
| **—** | **naver_blog / midjourney** | 확장 문제가 아니라 **경로 자체가 없음** | 자동 발행 스코프에서 제외하거나 반자동으로 강등. Midjourney는 공식 API 있는 대체 생성기 검토 |

### 완화책 총론

1. **쿼터 증량 감사를 로드맵의 선행 태스크로 승격.** YouTube 컴플라이언스 감사, TikTok audit, Pinterest Standard, LinkedIn 법인 심사는 모두 **회원 모집 전에** 끝나야 하는 리드타임 항목이다.
2. **회원당 상한(per-tenant quota)을 제품에 내장.** 앱 전체 공유 채널에서 한 테넌트가 전체를 먹는 noisy neighbor를 코드로 막아야 한다.
3. **큐 분산 + 채널별 토큰 버킷.** 팬아웃 발행은 채널별 rate limiter를 통과해야 한다(Telegram 30/s, Discord 50/s, Slack 1/s/채널).
4. **쿼터 가시화.** 남은 앱 쿼터·회원 쿼터를 대시보드에 노출해 "왜 내 글이 안 나갔나"를 지원 티켓 없이 설명한다.

---

## 5. 제품 기획에 주는 시사점 (화면·상태·온보딩 요구)

### 5.1 온보딩

1. **API 키 직접 입력 요구는 버려야 한다.** 경쟁사 5개 전부 OAuth 원클릭이다. 현재 우리 구조가 채널 Settings에서 credential을 입력받는 형태라면(`verify_channel` 경로), 최소한 주요 채널은 OAuth 커넥트 버튼으로 전환하는 설계가 필요하다.
2. **계정 요건 사전 검증 화면.** instagram=프로페셔널 계정, facebook=Page admin, pinterest=비즈니스 계정, line=공식계정, linkedin=Page super admin + 법인. 연결 **전에** 체크리스트로 보여주고, 실패 시 전환 방법을 링크한다.
3. **채널을 "즉시 가능 / 심사 대기 / 반자동 / 미지원" 4단계로 분류해 노출.** 지금의 Live/Connected/Coming Soon 3분류로는 "심사 통과 전에는 TikTok이 비공개로만 나간다", "네이버 블로그는 API가 없다"를 표현할 수 없다.

### 5.2 상태 표시

4. **연결 상태에 만료 D-day를 표시.** threads 60일(공개 프로필 권한 90일), instagram/facebook ~60일, pinterest access 30일·refresh 60일, linkedin 60일(일반 앱은 refresh 없음), tiktok access 24h·refresh 1년. Hootsuite처럼 **네트워크별 유효기간을 문서·UI에 명시**하고, D-7 사전 알림 + 원클릭 Reconnect를 붙인다.
5. **"발행 실패"를 원인별로 분해해 보여준다.** Buffer의 Instagram 에러 라이브러리가 벤치마크다. 최소 분류: ①토큰 만료 ②계정 요건 미충족 ③앱 쿼터 소진 ④계정 24h 상한 초과 ⑤심사 미통과로 비공개 강제 ⑥콘텐츠 규격 위반 ⑦스팸 리스크 차단(`spam_risk_*`). 지금 queue 스키마의 `channels.{ch}.error` 문자열 하나로는 부족하고, **에러 코드 + 사용자 행동 안내**가 필요하다.
6. **쿼터 게이지 2종.** (a) 계정당 남은 발행 수(instagram 100/24h, threads 250/24h, tumblr 250/day) (b) **앱 전체 남은 쿼터**(youtube 유닛, pinterest Trial, tumblr consumer key). (b)는 지금 UI에 개념 자체가 없다. Meta는 `content_publishing_limit`/`threads_publishing_limit` 엔드포인트를 제공하니 실측 가능하다.
7. **미감사 상태 경고 배너.** TikTok·YouTube는 감사 전 발행물이 비공개로만 나간다. 유저가 "발행됐다는데 안 보인다"고 오인하는 대표 함정이므로, 발행 결과에 **"비공개로 게시됨(플랫폼 심사 대기)"** 상태를 별도 표기해야 한다.

### 5.3 콘텐츠 생성·발행 로직

8. **채널별 규격 검증을 생성 단계에서.** bluesky 300 grapheme(byte 3,000 별개), discord 2,000자, telegram 본문 4,096/캡션 1,024, tiktok 캡션 2,200 UTF-16, linkedin 3,000자, instagram JPEG 전용. 발행 시점 실패가 아니라 **생성/승인 시점 경고**로 옮긴다.
9. **쇼츠/릴스 규격 게이트.** youtube Shorts = 세로·정사각 + 3분 이하(전용 API 없음, `videos.insert` 동일 경로). instagram Reels = 9:16 · 5~90초 아니면 일반 영상으로 강등. 업로드 전 비율·길이 검사를 붙이고, 조건 미달 시 "쇼츠/릴스로 인식되지 않습니다" 경고를 띄운다.
10. **중복 콘텐츠 정책이 OSMU의 정면 리스크.** YouTube는 "최소 변경으로 대량의 유사 콘텐츠 자동 생성"을 명시 금지하고, TikTok은 2025-09-15 Originality Policy로 근사 중복 노출을 감소시키며, Pinterest는 동일 이미지 반복을 스팸 플래그한다. **One Source Multi Use를 "같은 글 복사 붙여넣기"로 구현하면 플랫폼 정책과 충돌한다** → 채널별 재작성(리라이팅)을 선택이 아닌 **필수 파이프라인 단계**로 설계해야 한다.
11. **X는 링크 비용을 고려한 별도 취급.** URL 포함 게시가 13배($0.015 → $0.20)라면, X 발행 시 링크 삽입 여부를 유저에게 명시적으로 묻거나 비용을 표시해야 한다.
12. **큐 스케줄러에 채널별 rate limiter.** 현재 `multi-channel-publish` 크론이 승인 글을 순회하며 각 채널로 던지는 구조라면, 채널별 토큰 버킷과 429/`retry_after` 백오프, 앱 쿼터 소진 시 "다음 창까지 대기" 상태가 필요하다.

### 5.4 차별점 (경쟁사 공백에 정렬)

13. 경쟁사 5개 공식 문서에 **브랜드 위키 그라운딩 / 성과 피드백 학습 루프 / 퍼널 관점**이 전무하다. 이 셋이 우리 제품의 방어 가능한 축이며, 위 12개 항목은 "그 축을 세우기 위해 먼저 통과해야 하는 배관 공사"에 해당한다.
14. **네이버 블로그**는 글로벌 툴 전원 미지원이다. 공식 발행 API가 없으므로 "초안 생성 + 사람이 수동 발행"이라는 반자동으로 스코프를 낮추면, 자동 발행은 못 해도 한국 시장 커버리지는 차별점이 된다.

---

## 6. 셀프심문 — 이 표에서 내가 틀렸을 가능성이 가장 큰 칸은 어디이고 왜인가

**자문**: 이 문서가 기획 입력으로 쓰였을 때 가장 비싼 오류를 낼 칸은?

**자답 (틀릴 확률 순)**

1. **youtube `videos.insert` 유닛 비용(1600 vs 100)** — 가장 위험하다. 공식 페이지 안에서 서로 다른 서술이 나왔고, 2차 출처는 2025-12-04 인하를 주장하는데 Revision History 원문 대조를 못 했다. **이 한 칸으로 "하루 6건 vs 100건"이 갈리고, 그에 따라 YouTube를 정식 채널로 넣을지 말지가 뒤집힌다.** 기획 착수 전 반드시 사람이 `developers.google.com/youtube/v3/determine_quota_cost`와 revision_history를 직접 열어 확정해야 한다.
2. **instagram 24h 상한 100건** — 공식 문서 원문을 직접 읽어 확인했으므로 근거는 가장 강한 편이다. 다만 "25"가 여전히 다수 2차 출처에 살아 있어, 특정 API 버전·특정 계정 유형에서는 25가 적용되는 잔존 조건이 있을 가능성을 배제하지 못했다. 실제 계정에서 `content_publishing_limit`을 호출해 실측하는 것이 유일한 종결 방법이다.
3. **naver_blog "공식 발행 API 없음"** — 2020년 종료 보도 + 이후 재개 공지 부재라는 **부재 증거**에 기대고 있고, `developers.naver.com` 직접 접근이 막혀 2026 시점 원문을 못 봤다. 결론 방향은 맞을 확률이 높지만(경쟁사 5곳 전원 미지원이 정황 보강) "없다"는 단정의 근거 등급은 `[2차]`다.
4. **facebook "25건/일"** — 공식 rate-limiting 문서에는 콜량 공식만 있고 게시 건수 하드캡 문장이 없었다. 2차 출처의 25는 다른 제약(예: 앱 리뷰 전 상태, 또는 옛 정책)을 옮긴 것일 수 있다.
5. **linkedin 한도 수치** — LinkedIn이 공개하지 않으므로 어떤 숫자를 써도 추정이다. 2차 추정치를 표에 넣지 않고 "비공개"로 남긴 판단은 옳지만, 그 결과 **설계 시 용량을 알 수 없다**는 리스크가 남는다.
6. **x의 크리덴셜 소유 구조** — "운영사 앱 1개로 다수 테넌트 계정 인가"가 되는지를 확인하지 못했다. 만약 테넌트마다 자체 개발자 앱이 필요하면 온보딩 UX가 근본적으로 달라진다.
7. **각 채널의 "자동화·중복 게시 정책" 칸** — 9개 채널에서 `[미확인]`이다. 리서치가 rate limit 문서에 집중했고 ToS 원문을 덜 읽었다. §5.3-10(OSMU 중복 리스크)이 이 문서의 가장 중요한 기획 시사점 중 하나인데, 근거는 youtube·tiktok·pinterest 3곳만 확보됐다. **여기가 가장 큰 커버리지 공백이다.**

**교정 조치**: 위 7개를 아래 `⛔ 회수 필요` 및 확정필요 목록에 그대로 올렸다. 이 문서를 eng-design 입력으로 쓸 때 1·2·6번이 미해결이면 해당 채널의 용량 설계는 착수하지 않는다.

---

## 7. 미확인 / 공식 확정 필요 집계 (31건)

**`[확정필요]` (출처 충돌 · 설계 영향 큼)**
1. youtube `videos.insert` 유닛 비용 1600 vs 100
2. youtube 감사 미통과 시 private 강제 여부(공식 원문)
3. instagram 24h 상한 100 vs 25(잔존 조건 유무)
4. facebook 게시 건수 "25/일" 하드캡 존재 여부
5. x 레거시 티어 유저당/앱당 정확한 게시 캡
6. tiktok 계정당 24h 상한 정확 수치(공식 미공개)
7. tiktok 앱 레벨 총 캡(공식 미공개, 승인 시 협상)
8. tiktok 비즈니스 계정 요건 공식 문구
9. tiktok 심사 소요 기간(공식 SLA 없음)
10. bluesky 이미지 blob 현행 상한 1MB vs 2MB
11. linkedin 앱/회원별 일일 한도 수치(비공개)
12. naver_blog 2026 시점 공식 페이지 원문(도메인 fetch 차단)
13. metricool 공식 가격표(페이지 fetch 실패)

**`[미확인]` (확인 실패)**
14. threads 콘텐츠 규격(글자 수·영상 스펙)
15. threads App Review 기간·제출물
16. threads 자동화·중복 정책
17. instagram 장기 토큰 수명
18. instagram 자동화·중복 정책
19. facebook 콘텐츠 규격
20. facebook 장기 Page 토큰 정책 원문
21. facebook 자동화·중복 정책
22. x 콘텐츠 규격(글자·영상)
23. x OAuth 2.0 토큰 수명 현행
24. x 2026 자동화·중복 정책 문구
25. bluesky OAuth 토큰 수명 / 셀프호스팅 PDS 한도 균일성
26. telegram · discord · slack · line 명시적 안티스팸 정책 조항
27. slack `chat.postMessage` 텍스트·Block Kit 정확한 한도
28. line 초당 요청 한도 및 메시지 객체별 콘텐츠 한도
29. tumblr 토큰 수명 / 자동화 정책 / 한도 증량 경로
30. pinterest Standard 승격 심사 소요 기간
31. linkedin ugcPosts/Posts API 필드 스키마 · midjourney 티어별 상업 이용 조항 · publer/metricool AI 기능 깊이 · hootsuite 재연결 공식 문서(401)

---

## ⛔ 회수 필요 (회장 판단 필요)

1. **youtube를 정식 자동 발행 채널로 유지할지.** insert 유닛 비용이 1600이면 **전 회원 합산 하루 6건**이 상한이다. 감사·증량 없이는 상품화가 불가능하다.
   - 추천: ①`determine_quota_cost` + revision_history를 사람이 직접 열어 유닛 비용 확정(30분) ②확정 후에도 6건이면 컴플라이언스 감사 신청을 로드맵 선행 태스크로 승격, 그 전까지 YouTube는 "심사 대기" 상태로 노출.
   - 하면: 리드타임을 미리 태운다. 안 하면: 회원 유입 직후 전 회원 업로드가 동시 실패한다.
2. **naver_blog 스코프 결정.** 공식 발행 API가 없다(2020-05 종료).
   - 추천: **자동 발행 제외 + "초안 생성 → 사람이 수동 발행" 반자동으로 강등.** 스크레이핑은 배제.
   - 하면: 한국 시장 커버리지를 정직하게 확보. 안 하면: 없는 기능을 UI에 남겨 신뢰를 잃는다.
3. **midjourney 처리.** 공식 퍼블릭 API 없음 + ToS가 자동화를 명시 금지.
   - 추천: 공식 API가 있는 대체 이미지 생성기로 교체 검토. 비공식 wrapper는 계정 밴 리스크를 우리가 진다.
4. **x 채널 원가 전가 방식.** 신규 개발자에게 무료 티어가 없고 URL 포함 게시가 $0.20/건이다. Metricool은 X 연결에 월 $10 부가금을 받는다.
   - 추천: X는 별도 부가 요금 또는 회원별 게시 크레딧으로 분리 과금.
   - 하면: 원가 폭탄 회피. 안 하면: 마케팅 글(링크 포함)이 많은 헤비 유저가 마진을 잠식한다.
5. **온보딩 인증 방식 전환(사용자 API 키 입력 → OAuth 원클릭).** 경쟁사 5곳 전원이 OAuth 원클릭이다. 이는 API 계약·DB 스키마·설정 화면을 모두 건드리는 비가역 결정이므로 eng-design 진입 전 합의가 필요하다.

---

## SOURCES

### 코드 실측
- `/Users/sj/sj_code_master/openclaw-auto/dashboard/src/lib/constants.ts` (IMPLEMENTED_PLUGINS, L100-117)

### Meta 계열 (threads / instagram / facebook)
1. https://developers.facebook.com/docs/threads/get-started
2. https://developers.facebook.com/documentation/threads/overview
3. https://developers.facebook.com/docs/threads/troubleshooting
4. https://developers.facebook.com/docs/instagram-platform/content-publishing
5. https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
6. https://singhamandeep.com/facebook-page-api-permissions-app-review/
7. https://postproxy.dev/blog/instagram-reels-api-publishing-guide/
8. https://zernio.com/blog/instagram-graph-api
9. https://www.ayrshare.com/solutions/instagram-graph-api-error-9-the-25-post-daily-limit-how-to-fix-it/ (구 25건 수치 — 현행 공식 문서와 상충)

### X
10. https://docs.x.com/x-api/fundamentals/rate-limits
11. https://www.wearefounders.uk/the-x-api-price-hike-a-blow-to-indie-hackers/
12. https://gigazine.net/gsc_news/en/20260209-x-api-pay-per-use/
13. https://postproxy.dev/blog/x-api-pricing-2026/
14. https://www.netrows.com/blog/x-twitter-api-pricing-tiers-2026

### Bluesky
15. https://docs.bsky.app/docs/advanced-guides/rate-limits
16. https://docs.bsky.app/blog/oauth-atproto
17. https://www.blotato.com/blog/bluesky-api-pricing
18. https://blog.brandghost.ai/posts/bluesky-caption-character-counter/
19. https://github.com/bluesky-social/atproto/discussions/4832

### Telegram
20. https://core.telegram.org/bots/api
21. https://gramio.dev/rate-limits
22. https://botnamefinder.com/blog/telegram-bot-rate-limits-explained
23. https://github.com/yagop/node-telegram-bot-api/issues/165
24. https://grokipedia.com/page/Telegram_Bot_API_Limitations

### Discord
25. https://docs.discord.com/developers/topics/rate-limits
26. https://birdie0.github.io/discord-webhooks-guide/other/rate_limits.html
27. https://github.com/discord/discord-api-docs/issues/6753
28. https://support-dev.discord.com/hc/en-us/articles/6223003921559-My-Bot-is-Being-Rate-Limited
29. https://blogs.arkcore.arkdevlabs.com/discord-privileged-intents-10000-user-update
30. https://discord-webhook.com/en/blog/discord-webhook-embed-limits/
31. https://www.itgeared.com/what-is-the-character-limit-on-discord/

### Slack
32. https://docs.slack.dev/apis/web-api/rate-limits/
33. https://docs.slack.dev/authentication/installing-with-oauth
34. https://api.slack.com/directory/app-review-guide
35. https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/

### LINE
36. https://developers.line.biz/en/docs/messaging-api/overview/
37. https://developers.line.biz/en/docs/basics/channel-access-token/
38. https://developers.line.biz/en/docs/messaging-api/pricing/
39. https://blog.omnichat.ai/line-official-account-tutorial/
40. https://community.sinch.com/t5/LINE/Is-there-a-limit-on-the-number-of-messages-I-can-send-with-LINE/ta-p/9787

### Tumblr
41. https://www.tumblr.com/docs/en/api/v2

### Pinterest
42. https://developers.pinterest.com/docs/reference/rate-limits/
43. https://developers.pinterest.com/docs/key-concepts/access-tiers/
44. https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/
45. https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/

### LinkedIn
46. https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review?view=li-lms-2026-07
47. https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
48. https://learn.microsoft.com/en-us/linkedin/compliance/request-limits-and-patterns
49. https://www.linkedin.com/help/linkedin/answer/a1341387

### Naver Blog
50. https://www.newspim.com/news/view/20200413000737 (글쓰기 API 종료 보도)
51. https://www.newsis.com/view/NISX20200413_0000992012
52. https://naver.github.io/naver-openapi-guide/apilist.html

### Midjourney
53. https://apiframe.ai/blog/best-midjourney-apis
54. https://10b.ai/blog/does-midjourney-have-an-api

### YouTube
55. https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits
56. https://developers.google.com/youtube/v3/determine_quota_cost
57. https://developers.google.com/youtube/v3/revision_history
58. https://developers.google.com/youtube/v3/guides/uploading_a_video
59. https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
60. https://developers.google.com/youtube/v3/docs/videos/insert
61. https://support.google.com/youtube/answer/15424877 (3분 Shorts 룰)
62. https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
63. https://support.google.com/cloud/answer/15549945 (테스트 100유저 캡)
64. https://developers.google.com/youtube/terms/developer-policies
65. https://support.google.com/youtube/answer/2801973 (스팸 정책)

### TikTok
66. https://developers.tiktok.com/doc/content-sharing-guidelines
67. https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
68. https://developers.tiktok.com/doc/content-posting-api-get-started
69. https://developers.tiktok.com/doc/oauth-user-access-token-management

### 경쟁 벤치마크
70. https://later.com/pricing/
71. https://help.later.com/hc/en-us/articles/360043244093-Refresh-Your-Social-Profile-Connection
72. https://help-influence.later.com/hc/en-us/articles/20462372546455-Instagram-Account-Authentication-Token-Overview
73. https://help.later.com/hc/en-us/articles/12252569781015-Later-s-Caption-Writer
74. https://help.metricool.com/instagram-disconnected-how-to-recover-your-connection-b6fva
75. https://metricool.com/press-release-metricool-launches-metrilab-ai/
76. https://buffer.com/pricing
77. https://support.buffer.com/article/568-connecting-your-instagram-business-or-creator-account-to-buffer
78. https://support.buffer.com/article/573-refreshing-a-channel-in-buffer
79. https://support.buffer.com/article/581-instagram-error-library
80. https://support.buffer.com/article/583-using-buffers-ai-assistant
81. https://www.hootsuite.com/plans
82. https://help.hootsuite.com/hc/en-us/articles/204585460-Reconnect-a-social-account-to-Hootsuite
83. https://help.hootsuite.com/hc/en-us/articles/115002758887-Renew-expired-access-token
84. https://www.hootsuite.com/newsroom/press-releases/hootsuite-launches-owlywriter-ai
85. https://publer.com/help/en/article/what-are-publers-plans-and-pricing-15h4yqh/
86. https://publer.com/help/en/article/managing-tiktok-accounts-in-publer-1gloujj/

---

## MODEL

| 항목 | 값 |
|------|-----|
| 컨트롤러 | claude-opus-5[1m] (종합·검증·작성) |
| 리서치 워커 | general-purpose × 5 (sonnet), 병렬. 그룹: ①Meta 4채널 ②메시징 5채널 ③블로그·비주얼 5채널 ④YouTube Shorts + TikTok 심층 ⑤경쟁 벤치마크 |
| 도구 | WebSearch, WebFetch, Read, Grep |
| 검증 방식 | 워커별 공식 문서 fetch 강제, 2차 출처는 등급 분리 표기, 충돌 수치는 양쪽 병기 후 `[확정필요]` |
| 산출물 | 이 파일 1개. 소스코드·API·DB·배포 무변경 |
