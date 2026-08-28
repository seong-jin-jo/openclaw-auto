---
title: 운영 런북
type: overview
owner: "@sj"
policy: living
updated: 2026-08-28
source: ["./cron.md", "./multi-tenant.md", "./operator-token-recovery.md", "./osmu-v1-external-setup.md"]
links: ["../_index.md", "../../2-product/build/current-state.md"]
visibility: private
---

# 운영 런북

- [Cron](./cron.md)
- [Multi-tenant](./multi-tenant.md)
- [Operator token recovery](./operator-token-recovery.md)
- [OSMU v1 external setup](./osmu-v1-external-setup.md)
- [Session state](../session-state.md)
- [Archived June sessions](../archive/session-2026-06.md)

실행 가능한 운영 스크립트의 정본은 저장소 `scripts/`다. 문서의 명령을 실행하기 전에 현재 파일과 옵션을 확인한다.

How the system runs in production.

- Cron jobs and automation
- Deployment (Docker, multi-tenant)
- Environment and secrets
- Monitoring and insights
- [session-state.md](../session-state.md) — 재실행 가능한 작업 핸드오프 (작업 하네스 규칙 #3, 항상 최신 유지)

여기서 시작: 실행 전 [현재 제품 상태](../../2-product/build/current-state.md)와 실제 `scripts/`를 다시 확인한다. 오너: @sj. 갱신일: 2026-08-28.

관련: [운영](../_index.md), [환경 변수](../../4-reference/env-vars.md)
