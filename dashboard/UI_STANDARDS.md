# Dashboard UI Standards

## 채널 페이지 구조 (Threads가 표준)

모든 채널 페이지는 Threads 패턴을 따름:

```
┌─ Back 버튼 ──────────────────────────────┐
│ [아이콘] 채널명   Connected/Live          │
├─ [Queue] [Analytics] [Settings]  ← 탭    │
├──────────────────────────────────────────┤
│ 탭 콘텐츠                                │
└──────────────────────────────────────────┘
```

### 필수 탭
- **Queue**: 해당 채널의 콘텐츠 큐 (draft → approved → published)
- **Analytics**: 성과 지표 (views, likes, engagement)
- **Settings**: 크레덴셜 + 자동화 토글 + Setup Guide

### Queue 탭 규칙
- 해당 채널과 관련된 글만 필터 (예: Instagram은 이미지 있는 글)
- 카드뉴스는 슬라이드 가로 스크롤로 표시
- 상태 필터: All / Draft / Approved / Published
- 글별 액션: Approve / Edit / Delete

### Settings 탭 규칙
- **Credentials**: `credField()` 패턴 사용 (Show/Hide 내장)
  - 값이 있으면 readonly, "Edit Credentials" 클릭 시 편집 모드
  - Connect/Update 버튼 → "Verifying..." → 성공/실패 토스트
- **Automation**: Threads `renderChannelSettings()` 패턴 동일
  - 토글 + 마지막 실행 상태 (✓/✗) + 시간
  - 클릭 시 실행 이력 10건 펼침 (`expandedFeature`)
- **Setup Guide**: Quick Steps + "더 알아보기" Detail

## 사이드바 규칙

### 카테고리 자동 열기
- 카테고리 내 **하나라도 Live/Connected 상태**이면 자동 열기
- 유저 토글은 자동 동작 오버라이드

### 카테고리 구분
- **Social**: Threads, X, Instagram, Facebook, LinkedIn, Bluesky 등
- **Video**: TikTok, YouTube
- **Blog & SEO**: Naver Blog, Medium 등
- **Messaging**: Telegram, Discord, Slack, LINE 등
- **Data & SEO**: Google Analytics, Search Console 등
- **Custom Integration**: Blog, Midjourney, Sample Community, Custom API 등
- **Assets**: Images

## 공통 UI 컴포넌트

### credField(id, label, desc, isSecret, fullValue, editable)
- Secret 필드: `type="password"` + Show/Hide 토글
- readonly 모드: 배경 어둡게, 커서 기본
- editable 모드: 밝은 입력 필드

### channelBadge(label, channelStatus)
- published: 초록
- failed: 빨강
- pending: 회색
- skipped: 어두운 회색

### showToast(message, type)
- success: 초록
- error: 빨강
- warning: 노랑
- info: 파랑

## 이미지/미디어

### Midjourney
- **공통 기능** — 모든 서비스에서 사용 가능한 이미지 생성 도구
- Settings > AI Engine 또는 Assets 영역에 배치
- 채널 전용이 아님

### 카드뉴스
- `imageUrls: string[]` — 캐러셀 슬라이드 배열
- `cardBatchId: string` — 카드 생성 배치 ID
- 큐에서 슬라이드 가로 스크롤 표시
- Instagram 캐러셀로 발행
