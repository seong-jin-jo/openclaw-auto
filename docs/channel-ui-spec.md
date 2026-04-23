# 채널 UI 명세 — 현재 상태 + 통일 방향

## 현재 상태 (채널 유형별)

### 1. 채널 유형 분류

| 유형 | 채널 | 라우팅 | 컴포넌트 |
|------|------|--------|---------|
| **콘텐츠 발행** | Threads | ChannelPage | ChannelPage.tsx |
| **콘텐츠 발행** | X (Twitter) | ChannelPage | ChannelPage.tsx |
| **콘텐츠 발행** | Instagram | 전용 라우팅 | InstagramPage.tsx |
| **콘텐츠 발행** | Facebook, LinkedIn, Bluesky, Pinterest, Tumblr, TikTok, YouTube, Naver Blog | ChannelPage (generic) | ChannelPage.tsx |
| **메시징** | Telegram, Discord, Slack, LINE, Kakao, WhatsApp | 전용 라우팅 | MessagingPage.tsx |
| **데이터** | Google Analytics, Search Console, Google Business | 전용 라우팅 | DataChannelPage.tsx |
| **블로그** | Blog | /blog 별도 페이지 | blog/page.tsx |

### 2. 현재 탭 구성 비교

| 채널 | 탭 구성 | 비고 |
|------|---------|------|
| **Threads** | Queue / Analytics / Growth / Popular / Settings | 5탭 (최대) |
| **X** | Queue / Analytics / Settings | 3탭 |
| **Instagram** | Queue / Editor / Settings | 3탭 (전용 컴포넌트) |
| **Blog** | Queue / Editor / Settings | 3탭 (별도 페이지) |
| **Generic 발행** | (탭 없음) 인라인 레이아웃 | Credentials + Guide + Keywords |
| **Messaging** | (탭 없음) 인라인 레이아웃 | Credentials + 알림 + 테스트 |
| **Data** | (탭 없음) 인라인 레이아웃 | Credentials + Setup Guide |

### 3. Queue Post 카드 비교

| 구성 요소 | Threads | Instagram | Blog |
|----------|---------|-----------|------|
| 상태 뱃지 (draft/approved/published) | ✅ | ✅ | ✅ |
| 채널 뱃지 (T:published 등) | ✅ T뱃지 | ✅ IG뱃지 | ❌ |
| 텍스트 미리보기 | ✅ | ✅ | ✅ 제목+본문 |
| 이미지 미리보기 | ✅ 단일 이미지 | ✅ 캐러셀 슬라이드 | ❌ |
| 해시태그 | ✅ | ✅ | ✅ 태그 |
| **생성일** | ✅ | ❌ | ❌ |
| **승인일** | ✅ | ❌ | ❌ |
| **발행예정일** | ✅ | ❌ | ❌ |
| **발행일** | ✅ | ❌ | ❌ |
| 토픽/모델 | ✅ | ✅ | ❌ |
| 참여 통계 (views/likes) | ✅ | ❌ | ❌ |
| Approve 버튼 | ✅ draft만 | ✅ draft만 | ✅ |
| Edit 버튼 | ✅ 인라인 편집 | ✅ Editor 탭 전환 | ✅ Editor 전환 |
| Delete 버튼 | ✅ draft만 | ✅ draft만 | ✅ |
| 체크박스 (벌크) | ✅ | ✅ | ❌ |

### 4. Settings 탭 비교

| 구성 요소 | Threads | X | Instagram | Generic | Messaging | Blog |
|----------|---------|---|-----------|---------|-----------|------|
| Credentials | ✅ 전용 | ✅ OAuth 4키 | ✅ 전용 | ✅ CredentialForm | ✅ CredentialForm | ❌ (Settings 탭 내) |
| Channel Info | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Setup Guide | ❌ | ✅ | ✅ 인라인 | ✅ | ✅ | ❌ |
| Automation 토글 | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Content Guide | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Keywords | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| 알림 발송 설정 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 테스트 발송 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 통일 방향

### A. 탭 구조 통일

모든 **콘텐츠 발행 채널**에 동일 탭 제공:

| 탭 | 용도 | 모든 채널 |
|----|------|----------|
| **Queue** | 글 목록 + 승인/편집/삭제 | ✅ |
| **Analytics** | 발행 통계 + 참여율 | ✅ (데이터 없으면 빈 상태) |
| **Settings** | Credentials + Automation + Guide + Keywords | ✅ |

특수 탭 (해당 채널에만):
| 탭 | 채널 |
|----|------|
| **Growth** | Threads (팔로워 추적) |
| **Popular** | Threads (인기글 수집) |
| **Editor** | Instagram (카드뉴스), Blog (글 편집) |

### B. Post 카드 통일

**모든 Queue의 Post 카드에 동일 구성:**

| 구성 요소 | 필수 여부 |
|----------|----------|
| 상태 뱃지 | ✅ 필수 |
| 텍스트 미리보기 | ✅ 필수 |
| 이미지 미리보기 (있으면) | ✅ 필수 |
| 해시태그/태그 (있으면) | ✅ 필수 |
| **생성일** | ✅ 필수 (통일) |
| **승인일** | ✅ 필수 (있으면) |
| **발행예정일** | ✅ 필수 (있으면) |
| **발행일** | ✅ 필수 (있으면) |
| 토픽/모델 | ✅ 필수 (있으면) |
| 참여 통계 | ✅ published만 (있으면) |
| Approve / Edit / Delete | ✅ 필수 |
| 체크박스 (벌크) | ✅ 필수 |

### C. Settings 구성 통일

**모든 콘텐츠 발행 채널의 Settings:**

```
Settings 탭
├── Credentials (readonly/edit + Show/Hide)
├── Channel Info (상태, 캐릭터 제한, 인증 방식)
├── Setup Guide (Quick + 더 알아보기)
├── Automation 토글 (해당 채널 크론잡)
├── Content Guide (AI 제안 + 공통에서 복사)
└── Keywords (AI 제안 + 공통에서 복사)
```

**Messaging 채널의 Settings:**

```
Settings
├── Credentials
├── Setup Guide
├── 알림 발송 설정 (이벤트별 ON/OFF)
└── 테스트 발송
```

### D. 채널 유형별 구성 요약

| 유형 | 탭 | Post 카드 | Settings | 특수 기능 |
|------|-----|----------|----------|----------|
| **콘텐츠 발행** | Queue + Analytics + Settings | 통일된 카드 | Cred + Info + Guide + Auto + Guide + KW | - |
| **콘텐츠+에디터** | Queue + Editor + Analytics + Settings | 통일된 카드 | 위 + Editor 탭 | Instagram 카드뉴스, Blog 글 편집 |
| **Threads** | Queue + Analytics + Growth + Popular + Settings | 통일된 카드 | 위 전체 | 팔로워 추적, 인기글 |
| **Messaging** | (인라인) | - | Cred + Guide + 알림 + 테스트 | 알림 발송 |
| **Data** | (인라인) | - | Cred + Guide | 분석 대시보드 (별도 페이지) |
