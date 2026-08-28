# v24 완성 브리프 — 기존 v23을 이어 완성 (신규 제작 아님)

> STAMP | v24-brief | 2026-08-12 | opus-4-8 | 회장 "ㄱㄱ" 승인 방향
> 규율: **기존 v23을 복사해 편집(진화). 새 IA/화면 창작 금지. 실제 코드(dashboard/src)가 진실원. 재창조 금지(회장 R-03/R-13 반복 지적, v23이 이걸 어겨 감사 불통과했음).**

## 기준 파일 (이것을 복사해서 v24로)
`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html` (316KB, v15~v23 8회 진화. 여정·studio·admin·onboarding·OAuth·성과·정책 이미 포함).
→ 산출: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html`

## 반영할 4가지 (실측·요청 근거 첨부됨)

### 1. 실제 코드 정합 — 재창조 되돌리기 (최우선)
`docs/audit/v23-codex-crosscheck.md`가 지적한 v23의 재창조·누락을 **실제 dashboard/src 코드 구조에 맞게 교정**. 실제 코드가 진실원. 코드에 있는 기능을 프로토타입에서 빼거나, 코드에 없는 화면을 새로 그린 부분을 실제와 일치시킨다.

### 2. 안 되는 것 수정 반영 (실측)
`docs/audit/r02-journey-plan/r02-journey-fix-plan-v1-opus.html` + qa 실측. 4개:
- 채널 연결상태 단일 소스 통일(고객화면=Admin 같은 channel_accounts)
- 홈 지표 4패널(성과/발행물성과/운영현황/THIS WEEK)→1블록 통합
- 드래프트 본문 저장 갭(text:null)→수정·발행 흐름 완결
- Admin 14플랫폼 폼→접이식
- (생성실패 배너·홈 recent activity·채널통합 3건은 이미 코드 수정 완료 — 그 상태로 반영)

### 3. 디자인 시스템 전체 통일 (R-09)
여백 제각각·따닥따닥·텍스트 넘침·정보 중복 제거. `/DESIGN.md` 토큰·간격 6단·글자 7단·넘침 규칙. 전 화면 일관.

### 4. R-06 반영 — 정책조사·포지셔닝·AAARR
- 플랫폼 정책조사(인스타·페북·유튜브 API/심사, Later·Metricool 비교) 요약 섹션.
- 포지셔닝 + AAARR 퍼널 마케팅("API키 등록·승인을 없애주는 SaaS 장점" → 단순 자동화 넘어 마케팅 퍼널). 
- 이 부분 자료는 wiki/marketing/positioning.md·wiki/reference/channel-status.md 기반 + 부족분 WebSearch. (별도 위임으로 위키 갱신 병행 예정 — 프로토타입엔 요약 섹션으로.)

## 완료 기준
- v23 대비 위 4개 반영. 재창조 0(실제 코드 대조). design-review 실호출 B+ 이상.
- 저장만, open은 코디네이터.
