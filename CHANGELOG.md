# Changelog

## 0.2.0 (2026-08-28)

### 새 기능

- 생성실, 편집실, 발행실, 성과실의 네 방 흐름과 반응형 이동 구조를 추가했다.
- Studio 후보 생성과 무료 재생성 장부, 여덟 콘셉트 숏폼 공장, 댓글 행동, 운영 사건 원장을 추가했다.
- 채널별 연결 준비 상태, 발행 결과, 성과 제안과 생성 큐 인계를 보강했다.

### 운영 안전

- 운영에서는 개발용 Studio 신원 어댑터를 예외 없이 거절한다.
- 설정 누락 경로가 500으로 죽지 않고 준비되지 않음 상태를 반환하도록 보강했다.
- 신규 마이그레이션에 명시적 순서를 두고 모든 파일을 트랜잭션으로 묶었다.
- OSMU 대시보드 이미지를 `openclaw-auto/dashboard:0.2.0`으로 고정했다.

### 실린 산출물

- PRD 8.2.1
- 디자인 시스템 v18
- 승인 프로토타입 v38
- 릴리스 후보 문서 `docs/releases/2026-08-28-osmu-네방.md`

### 알려진 제한

- 운영 Studio 신원 어댑터와 내부 스킬 버전 공급 경로가 없어 생성 API는 운영에서 사용할 수 없다.
- FDD, API 계약, QA 승인 핀이 없고 디자인 정합 행렬이 승인되지 않았다. 0.2.0은 병합 검토용 릴리스 후보이며 운영 배포 완료가 아니다.

## 2026-04-07 ~ 2026-04-14 — Instagram 확장 + Figma/Midjourney 연동

### Instagram 채널 완전 활성화
- 큐에 `instagram` 채널 추가 (Channels 타입, migratePost, update_channel)
- `instagram-publish` 이미지 업로드: tmpfiles.org → Cloudflare R2 교체
- 크론잡 2개: `instagram-generate-drafts` (카드뉴스 6h), `instagram-auto-publish` (2h)
- Instagram 전용 채널 페이지: Queue / Editor / Settings 탭 (Threads 패턴)
- 카드뉴스 캐러셀 발행 검증 완료 (R2 → Instagram Graph API)

### 카드뉴스 에디터 (Instagram > Editor 탭)
- AI 초안 생성: 주제 입력 → 슬라이드 텍스트 + 캡션 + 해시태그 자동 생성
- 카드뉴스 이미지 생성: `card_generate` tool → PNG 슬라이드
- 슬라이드 관리: 드래그앤드롭 순서 변경, 개별 삭제, 이미지 추가
- 이미지 클릭 시 풀스크린 프리뷰
- 스타일 5종: dark / light / gradient / tech / warm
- 레이아웃: 수직 중앙 정렬, 인스타 세이프존 (상 160px, 하 120px)
- 폰트: Noto Sans CJK KR (한국어 최적)

### 큐 스키마 확장
- Post에 `imageUrls: string[]` + `cardBatchId: string` 필드 추가
- 캐러셀 발행 시 imageUrls 배열 직접 사용 (디스크 스캔 제거)
- Queue에서 이미지 추가 API: `POST /api/queue/{id}/add-image`

### Midjourney Discord 연동
- `extensions/midjourney-image/` 신규 (Discord REST 클라이언트 + imagine/upscale tool)
- Discord 유저 토큰으로 /imagine 전송 → 폴링 → 이미지 다운로드
- 대시보드 Setup Guide: XMLHttpRequest 방식 토큰 추출법
- Editor + Queue에서 미드저니 이미지 추가 가능
- `POST /api/midjourney/generate` 엔드포인트

### Figma MCP 연동
- Figma Remote MCP 서버 연결 (`https://mcp.figma.com/mcp`)
- 대시보드에서 원클릭 OAuth 인증 (Claude Code client_name으로 등록)
- `use_figma` tool로 프레임/텍스트 직접 생성 (Write to Canvas)
- Figma REST API로 PNG Export → 큐 업데이트
- MCP 토글 ON/OFF → openclaw.json 자동 반영
- Gateway 재시작 버튼 (대시보드)
- `POST /api/figma/create-slides`, `POST /api/figma/export-to-queue`

### 마케터-디자이너 협업 플로우
```
마케터: AI 초안 → 텍스트 수정 → 카드뉴스 생성 → (미드저니 배경) → Figma에 올리기
디자이너: Figma에서 리터치
마케터: Figma에서 가져오기 → Draft 저장 → Approve → 자동 발행
```
- Queue에서 Edit 클릭 → Editor 탭으로 이동 (draft 수정)
- Queue 버튼 간소화: Approve / Edit / Delete
- Editor에서 "← Queue로 돌아가기" 네비게이션

### Cloudflare R2 Storage
- 대시보드 Images 페이지 → Settings > Storage 탭으로 이동
- Setup Guide: 버킷 생성 → 퍼블릭 URL → API 토큰 → 입력
- `.env` 파일에 자동 저장
- `POST /api/images/upload` 엔드포인트

### Claude 토큰 관리
- Settings > AI Engine 탭에서 setup-token 입력/검증
- 토큰 상태: 길이 + gateway 에러 기록 기반 판정
- Setup Guide 포함

### Settings 리팩토링
- 5개 탭 분리: Channels / AI Engine / Storage / Design Tools / System
- 각 탭에 "어디에서 사용되는지" 설명
- 탭 전환 시 필요한 데이터만 로드 (비동기 타이밍 문제 해결)
- Design Tools: Canva + Figma (각각 Quick Setup + 더 알아보기 + credentials)

### Sample Community (Custom Integration)
- 커뮤니티 글 수집: `GET https://api.example.com/api/v1/community/posts` 프록시
- 큐레이션 / 요약 / 토론유도 톤으로 draft 생성
- `POST /api/custom/sample-community/draft`

### 버그 수정
- Threads 중복 발행: 미연결 채널(X, Instagram) 자동 skip → top-level 상태 갱신
- Instagram User ID 자동 검증 (`/me` API 호출)
- weekly-summary 500: timezone naive/aware 비교 에러
- Discord API 403: User-Agent 헤더 누락
- Figma MCP read-only: client_name "Claude Code (figma)" → "Claude Code"
- jiti 캐시 문제: 코드 변경 후 캐시 미반영
