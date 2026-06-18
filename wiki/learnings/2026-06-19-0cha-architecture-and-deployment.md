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

### 현재 최우선 과제 (0차)
- 신뢰성 + 에러 설명력 (사용자가 "왜 이런 에러가 났는지" 설명할 수 있게)
- 온보딩 마찰 최소화 (API 토큰 과정)
- Multi-repo wiki context pulling 안정화
- Shorts Factory (숏폼 생산 공장) 안정 동작
- 테넌트 완전 격리 + Custom Hostnames 동작 검증

## Why this matters
이전에는 1000명+ 유료, 높은 가격대, 강한 리텐션 중심으로 생각했으나, 현실은:
- 0차가 완벽해야 1차가 의미 있음.
- 신뢰성과 사용성(에러 대응, 온보딩)이 가격보다 훨씬 중요.
- 실제 운영자가 먼저 잘 써야 진짜 제품이 나옴.

**다음 단계**: 0차 plan에 따라 Cloudflare Custom Hostnames + tenant isolation + multi-repo wiki pulling을 안정화.

이 문서는 gstack CEO review 결과를 wiki에 직접 반영한 결과물이다.