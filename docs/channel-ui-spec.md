# 채널 UI 명세 — 플랫폼별 사업자 관점 분석

## 전체 채널 (26개)

---

## Social (텍스트 중심 SNS)

### Threads
- **사업자 용도**: 주력 마케팅 채널. 짧은 글로 브랜드 노출 + 팔로워 확보
- **콘텐츠**: 텍스트 (500자) + 선택 이미지
- **AI 활용**: 글 자동 생성 → 검수 → 자동 발행 → 반응 학습
- **핵심 지표**: 조회수, 좋아요, 댓글, 팔로워 증감
- **특수 기능**: 팔로워 추적(Growth), 인기글 수집(Popular), 피드백 루프
- **사업자 니즈**: "매일 안 봐도 알아서 돌아가게", "뭐가 터졌는지 알려줘"
- **탭**: Queue / Analytics / Growth / Popular / Settings

### X (Twitter)
- **사업자 용도**: 뉴스/의견 공유, 바이럴 가능성 높음
- **콘텐츠**: 텍스트 (280자) + 선택 이미지
- **AI 활용**: Threads와 동일 파이프라인, 280자 자동 압축
- **핵심 지표**: 조회수, 리트윗, 좋아요
- **특수 기능**: 없음 (Threads와 거의 동일)
- **사업자 니즈**: "Threads랑 같이 올리고 싶다" → 현재는 단일 채널 발행
- **탭**: Queue / Analytics / Settings

### Facebook
- **사업자 용도**: 지역 사업 페이지, 40대+ 고객층
- **콘텐츠**: 텍스트 + 이미지 + 링크
- **AI 활용**: Threads와 동일 파이프라인
- **핵심 지표**: 반응, 공유, 댓글
- **사업자 니즈**: "페이지에 자동으로 올려줘", "이벤트 홍보"
- **현재 상태**: extension 있음, 대시보드 generic 렌더링
- **탭**: Queue / Analytics / Settings

### LinkedIn
- **사업자 용도**: B2B 마케팅, 채용, 전문성 어필
- **콘텐츠**: 긴 텍스트 OK, 전문적 톤
- **AI 활용**: 전문적 톤으로 변환 필요 (prompt-guide 중요)
- **핵심 지표**: 반응, 댓글, 프로필 방문
- **사업자 니즈**: "전문적으로 보이게", "채용 공고도"
- **현재 상태**: extension 있음, Partner Program 승인 필요
- **탭**: Queue / Analytics / Settings

### Bluesky
- **사업자 용도**: 얼리어답터/개발자 커뮤니티 타겟
- **콘텐츠**: 텍스트 (300자) + 이미지
- **AI 활용**: Threads와 동일
- **핵심 지표**: 좋아요, 리포스트
- **사업자 니즈**: 서브 채널. "Threads 올리는 거 여기도"
- **현재 상태**: extension 있음, 무료/승인 불필요
- **탭**: Queue / Analytics / Settings

### Pinterest
- **사업자 용도**: 시각 콘텐츠 마케팅 (인테리어, 패션, 요리)
- **콘텐츠**: **이미지 필수** + 설명 + 링크
- **AI 활용**: 이미지 설명 생성, 키워드 최적화
- **핵심 지표**: 저장, 클릭, 노출
- **사업자 니즈**: "내 제품 사진 핀으로 올려줘"
- **특이점**: 이미지 없으면 발행 불가. **비주얼 채널**
- **탭**: Queue / Analytics / Settings

### Tumblr
- **사업자 용도**: 니치 커뮤니티, 팬덤, 크리에이터
- **콘텐츠**: 텍스트 + 이미지 + GIF
- **AI 활용**: Threads와 동일
- **핵심 지표**: 노트, 리블로그
- **사업자 니즈**: 서브 채널
- **탭**: Queue / Analytics / Settings

---

## Visual (비주얼 중심)

### Instagram
- **사업자 용도**: 핵심 비주얼 마케팅. 카페/미용실/식당의 1순위 채널
- **콘텐츠**: **이미지 필수**. 피드(단일/캐러셀), 스토리, 릴스
- **AI 활용**: 카드뉴스 자동 생성, 캡션 생성, 해시태그 추천
- **핵심 지표**: 좋아요, 댓글, 저장, 도달
- **특수 기능**: 카드뉴스 에디터, Figma 연동, Midjourney 배경
- **사업자 니즈**: "예쁜 카드뉴스 만들어줘", "매일 1개씩 올려줘"
- **특이점**: 이미지 없으면 발행 불가. Editor 탭 필수
- **탭**: Queue / **Editor** / Analytics / Settings

### TikTok
- **사업자 용도**: 숏폼 영상 마케팅, MZ세대 타겟
- **콘텐츠**: **영상 필수**. 15~60초 숏폼
- **AI 활용**: 카드뉴스 → 숏폼 변환 (TTS + FFmpeg)
- **핵심 지표**: 조회수, 좋아요, 공유, 댓글
- **사업자 니즈**: "영상 만들기 어렵다", "자동으로 만들어줘"
- **특이점**: 영상 없으면 발행 불가. 앱 심사 필요. **Video Editor 필요**
- **탭**: Queue / **Editor** / Analytics / Settings

### YouTube
- **사업자 용도**: 영상 콘텐츠 + Shorts
- **콘텐츠**: **영상 필수**. Shorts(60초) 또는 일반 영상
- **AI 활용**: 블로그 → 스크립트 → 숏폼 변환
- **핵심 지표**: 조회수, 구독자, 시청 시간
- **사업자 니즈**: "블로그 글을 영상으로 만들어줘", "Shorts 자동"
- **특이점**: 영상 업로드만 API 지원 (커뮤니티 글 불가)
- **탭**: Queue / **Editor** / Analytics / Settings

---

## Blog (장문 콘텐츠)

### Blog (자체 사이트)
- **사업자 용도**: 자사 블로그/홈페이지 콘텐츠
- **콘텐츠**: 제목 + 본문 (HTML/Markdown) + 이미지 + SEO
- **AI 활용**: SEO 키워드 기반 글 자동 생성
- **핵심 지표**: 페이지뷰, 체류시간, 검색 유입
- **사업자 니즈**: "블로그 글 자동으로 써줘", "SEO 잘 되게"
- **특이점**: 리치 에디터 필요, SEO 키워드/태그 관리
- **탭**: Queue / **Editor** / Analytics / Settings

### Naver Blog
- **사업자 용도**: 한국 자영업자의 핵심 채널. 네이버 검색 노출
- **콘텐츠**: 장문 텍스트 + 이미지 + SEO
- **AI 활용**: Blog와 동일
- **핵심 지표**: 검색 노출, 방문자 수
- **사업자 니즈**: "네이버에서 검색되게", "매주 2~3개"
- **특이점**: 비공식 API (XML-RPC), 안정성 보장 안 됨
- **탭**: Queue / **Editor** / Analytics / Settings

### Medium
- **사업자 용도**: 영문 콘텐츠 마케팅, 기술 블로그
- **콘텐츠**: 장문 텍스트 + 이미지
- **AI 활용**: Blog와 동일
- **핵심 지표**: 읽기 수, 클랩, 팔로워
- **사업자 니즈**: 글로벌 타겟 서브 채널
- **탭**: Queue / **Editor** / Analytics / Settings

### Substack
- **사업자 용도**: 뉴스레터 + 유료 구독
- **콘텐츠**: 장문 텍스트 (이메일 형식)
- **AI 활용**: Blog와 동일
- **핵심 지표**: 구독자, 열람률
- **사업자 니즈**: "정기 뉴스레터 자동화"
- **탭**: Queue / **Editor** / Analytics / Settings

---

## Messaging (알림/소통)

### Telegram
- **사업자 용도**: 관리자 알림 + 양방향 명령
- **콘텐츠 발행**: ❌ (알림 전달만)
- **기능**: 발행 완료/바이럴/에러 알림, 주간 리포트, 봇 대화
- **사업자 니즈**: "터지면 알려줘", "폰에서 바로 확인"
- **구성**: Settings (Credentials + 알림 설정 + 테스트 + Interactive Chat)

### Discord
- **사업자 용도**: 커뮤니티 채널 알림
- **콘텐츠 발행**: ❌ (Webhook 알림만)
- **기능**: 이벤트별 알림 발송
- **사업자 니즈**: 팀 내부 알림
- **구성**: Settings (Credentials + 알림 설정 + 테스트)

### Slack
- **사업자 용도**: 팀 업무 알림 + 주간 리포트
- **콘텐츠 발행**: ❌
- **기능**: 알림 + 주간 리포트 템플릿 + 커스텀 발송
- **사업자 니즈**: "마케팅 결과를 Slack으로 받고 싶다"
- **구성**: Settings (Credentials + 알림 + 리포트 템플릿 + 테스트)

### LINE
- **사업자 용도**: 고객 대상 브로드캐스트 (한국/일본)
- **콘텐츠 발행**: △ (브로드캐스트는 마케팅이지만 콘텐츠 생성은 아님)
- **기능**: 전체 발송
- **사업자 니즈**: "고객한테 쿠폰/이벤트 보내기"
- **구성**: Settings (Credentials + 알림 설정 + 테스트)

### Kakao Channel
- **사업자 용도**: 한국 자영업자 필수. 알림톡/친구톡
- **콘텐츠 발행**: △ (알림톡 템플릿 기반)
- **기능**: 템플릿 발송 (리셀러 API 필요)
- **사업자 니즈**: "예약 확인 알림", "프로모션 발송"
- **현재 상태**: Coming Soon
- **구성**: Settings

### WhatsApp
- **사업자 용도**: 글로벌 고객 소통
- **콘텐츠 발행**: △ (템플릿 기반)
- **기능**: BSP 연동 필요
- **현재 상태**: Coming Soon
- **구성**: Settings

---

## Design & Tools

### Midjourney
- **사업자 용도**: AI 이미지 생성 도구
- **콘텐츠 발행**: ❌ (도구. 이미지 생성 → 다른 채널에서 사용)
- **기능**: 프롬프트 → Discord 연동 → 이미지 생성
- **사업자 니즈**: "카드뉴스 배경 만들어줘"
- **구성**: Settings (Credentials + 연결 상태)

---

## Data & Analytics

### Google Analytics
- **사업자 용도**: 웹사이트 트래픽 분석
- **콘텐츠 발행**: ❌
- **기능**: 유입 데이터 수집 → 콘텐츠 전략 반영
- **사업자 니즈**: "어디서 유입되는지 알고 싶다"
- **구성**: Settings (Credentials) + Analytics 대시보드

### Search Console
- **사업자 용도**: 검색 노출 현황
- **콘텐츠 발행**: ❌
- **기능**: 검색어, 노출수, 클릭수
- **사업자 니즈**: "우리 가게가 검색에 나오나?"
- **구성**: Settings (Credentials) + Analytics 대시보드

### Google Business
- **사업자 용도**: 지역 사업 검색 관리
- **콘텐츠 발행**: ❌
- **기능**: 리뷰, 지도 노출
- **사업자 니즈**: "구글 지도에 잘 나오게"
- **구성**: Settings (Credentials) + Analytics 대시보드

### SEO Keywords
- **사업자 용도**: 검색 키워드 연구
- **콘텐츠 발행**: ❌
- **기능**: 키워드 분석 도구
- **구성**: Settings + 분석 도구

---

## Custom

### Custom API
- **사업자 용도**: 자체 시스템 연동
- **현재 상태**: Coming Soon
- **구성**: Settings (Webhook URL)

### RSS Feed
- **사업자 용도**: 콘텐츠 수집/배포
- **현재 상태**: Coming Soon
- **구성**: Settings (Feed URL)

---

## 통일 UI 정의

### 채널 유형별 탭 구조

| 유형 | 채널 | 탭 |
|------|------|-----|
| **텍스트 SNS** | Threads, X, Facebook, LinkedIn, Bluesky, Tumblr | Queue / Analytics / Settings |
| **비주얼 SNS** | Instagram, Pinterest | Queue / **Editor** / Analytics / Settings |
| **영상** | TikTok, YouTube | Queue / **Editor** / Analytics / Settings |
| **블로그** | Blog, Naver Blog, Medium, Substack | Queue / **Editor** / Analytics / Settings |
| **메시징** | Telegram, Discord, Slack, LINE, Kakao, WhatsApp | Settings (인라인) |
| **도구** | Midjourney | Settings (인라인) |
| **데이터** | GA, GSC, Google Business, SEO Keywords | Settings + Analytics 대시보드 |
| **커스텀** | Custom API, RSS | Settings (인라인) |
| **Threads 전용** | Threads | + Growth / Popular (추가 탭) |

### Post 카드 통일

**모든 Queue에서 동일한 Post 카드:**

| 요소 | 텍스트 채널 | 비주얼 채널 | 블로그 |
|------|-----------|-----------|-------|
| 상태 뱃지 | ✅ | ✅ | ✅ |
| 메인 콘텐츠 | 텍스트 미리보기 | **이미지 크게** + 캡션 | **제목** + 본문 미리보기 |
| 이미지 | 선택 (작게) | **필수 (크게)** | 썸네일 (선택) |
| 글자수 표시 | ✅ (280/500 등) | 캡션 글자수 | 본문 글자수 |
| 해시태그/태그 | ✅ | ✅ | ✅ (SEO 키워드 포함) |
| 생성일 | ✅ | ✅ | ✅ |
| 승인일 | ✅ | ✅ | ✅ |
| 발행예정 | ✅ | ✅ | ✅ |
| 발행일 | ✅ | ✅ | ✅ |
| 참여 통계 | ✅ (published만) | ✅ | ✅ (pageview) |
| Approve/Edit/Delete | ✅ | ✅ | ✅ |
| 벌크 체크박스 | ✅ | ✅ | ✅ |

### Settings 구성 통일

**콘텐츠 발행 채널 (텍스트/비주얼/블로그):**
```
Settings
├── Credentials (readonly/edit + Show/Hide + 검증)
├── Channel Info (상태, 캐릭터 제한, 인증 방식)
├── Setup Guide (Quick + 더 알아보기)
├── Automation (크론잡 토글 + 실행 이력)
├── Content Guide (AI 제안 포함)
└── Keywords (AI 제안 포함)
```

**메시징 채널:**
```
Settings
├── Credentials
├── Setup Guide
├── 알림 설정 (이벤트별 ON/OFF)
└── 테스트 발송
```

**도구/데이터/커스텀:**
```
Settings
├── Credentials
└── Setup Guide
```
