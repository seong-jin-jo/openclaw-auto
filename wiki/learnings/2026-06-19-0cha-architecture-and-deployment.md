# Learnings: 0차 아키텍처 + Deployment (2026-06-19)

**Date**: 2026-06-19
**Context**: gstack CEO review 후 0차/1차 목표 재정의 + 실제 배포 모델 결정

## 핵심 결정

### 0차 / 1차 목표 (확정)
- **0차 (지금 완벽히 먼저)**: 운영자(나)가 여러 서비스의 wiki/context를 끌어와서 마케팅 자동화를 **안정적으로 직접 운영**하는 상태.
  - 에러가 나도 설명 가능해야 함.
  - 인프라/루프가 신뢰할 수 있어야 함.
  - 여러 서비스 위키를 context로 잘 쓰는 것.
- **1차 (PMF)**: 0차가 완벽해진 후, 단 1명이라도 결제해서 쓰거나 자기 사용량만 내고 실제로 쓰는 사람이 '존재'하는 것.
- 원칙: 0차를 완벽하게 구현하고 나서 1차로 넘어간다.

### Architecture 원칙
- **하나의 사이트/앱**에서 관리.
- 하지만 **화면(UI)과 DB가 테넌트별로 완전히 격리**.
- Single codebase + strong tenant isolation.

### Deployment 모델 (정답)
**Cloudflare for SaaS (Custom Hostnames)**

- 고객이 자기 도메인을 직접 꽂을 수 있게 하는 방식.
- 예시: `marketing.example.com`
  1. 우리 CF 계정에서 Custom Hostname으로 등록.
  2. 고객 계정에서 CNAME을 우리의 fallback origin으로 설정.
  3. CF가 cross-account routing + SSL 자동 발급.
- 장점: 멀티테넌트 SaaS 표준, 고객 브랜딩 완전 지원, 2개 도메인까지 무료.
- 0차에서 이 모델을 먼저 안정화한다.

### Wiki 전략
- 이 `wiki/` = 상품 자체의 지식 베이스 (제품 위키).
- 사용자가 가진 **다른 레포 위키를 포인팅**해서 컨텍스트를 끌어오는 기능은 별도로 구현해야 함 (0차에 포함).

### 상품 이름
- **SoloClaw** 강력 추천 (솔로/셀프/혼자마케팅 + Claw 브랜드 + 숏폼 생산 공장 느낌 모두 커버 가능).
- 대안: ClawFactory, SoloForge, ShortsClaw.
- 이름은 0차 진행하면서 가정하고, 나중에 최종 확정.

### 현재 최우선 과제 (0차) — 더 세밀한 태스크
1. **Tenant Isolation 완벽화**
   - 단일 앱 + UI/DB 완전 격리 (RLS + withTenant 강제).
   - 크로스-테넌트 누출 테스트.

2. **Cloudflare Custom Hostnames (배포 핵심)**
   - Fallback origin + hostname→tenant 매핑.
   - 예: marketing.example.com (고객 CNAME → 우리 origin).
   - SSL/routing 검증 (2개 도메인 무료).

3. **Multi-repo Wiki Context Pulling**
   - 다른 레포 위키 포인팅해서 context 끌어오기 (0차에 포함).
   - Product wiki (`wiki/`) + 외부 위키 동시 사용.

4. **Reliability & Error Handling**
   - 에러를 "사용자가 설명 가능"하게 (상세 로그 + 친화적 메시지).
   - 재현성 확보, 인프라 안정.

5. **Shorts Factory + Loop 안정화**
   - Wiki context로 숏폼 후보 → 발행 → 인사이트까지 안정 동작.
   - 사용자가 실제 가치 (시간 절감 or 부수입) 체감.

6. **Onboarding 마찰 최소화**
   - API 토큰 과정 가이드 (메뉴얼 or 셀프).

**0차 완료 기준**: 위 성공 기준 (vision.md 참조) 만족 시 1차 이동. gstack 절차 엄수.

### Product Name
SoloClaw 강력 추천 (솔로 + Claw + 숏폼 공장 포지셔닝). 0차 동안 가정 사용, 이름 확정은 별도 review.

## Why this matters
이전에는 1000명+ 유료, 높은 가격대, 강한 리텐션 중심으로 생각했으나, 현실은:
- 0차가 완벽해야 1차가 의미 있음.
- 신뢰성과 사용성(에러 대응, 온보딩)이 가격보다 훨씬 중요.
- 실제 운영자가 먼저 잘 써야 진짜 제품이 나옴.

**운영 현실 반영 (handoff 2026-06-19)**:
- 실제 라이브: cloudflared 터널 (Proxmox) + self-hosted GHA (marketing_runner) + 수동 `gh workflow run deploy-marketing.yml -f services="openclaw-dashboard-osmu"` (포트 18789).
- 시크릿: GitHub Secrets only. 빌드 규칙 엄수 (NEXT_PUBLIC_* 는 build-arg, DASHBOARD_PORT 사용).
- 이미 고쳐진 치명 버그 + 스모크 게이트 존재.
- **전체 상세**: `wiki/learnings/2026-06-19-openclaw-osmu-handoff.md` 필수 선행 읽기.
- 0차 작업은 이 현재 배포 모델을 깨지 않으면서 진행. CF SaaS Custom Hostnames 는 고객 커스텀 도메인 단계(1차)에서 본격.

**다음 단계**: 위 0차 plan 태스크를 gstack 절차대로 (read wiki → plan → implement with comments → verify) 진행. 배포 시 반드시 스모크 게이트 통과 확인.

이 문서는 gstack CEO review 결과를 wiki에 직접 반영한 결과물이다.