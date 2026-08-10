# OSMU v7 Wireframe 04: PRD AC28 Traceability

> STAMP: created_at=2026-08-05 02:04 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer, https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code | deliberation=28개 acceptance criterion을 화면과 상태에 연결해 설계 누락과 기각안 유입을 동시에 막는 방법

## 사용법

프로토타입 상단의 `AC 추적표`는 제품 내비게이션이 아니라 QA 도구다. 각 행의 `보기`를 누르면 해당 view와 state를 연다. Initial 3 밖의 항목은 상세 화면 대신 범위 경계와 fail-close 증거로 연결한다.

## AC28에서 view/state로의 RTM

| AC | PRD 의도 | Prototype view | State/interaction | 결과 |
|---:|---|---|---|---|
| 01 | 실제 코드 inventory 고정 | `truth` | text8/direct4/preview7/video3/extensions15 | covered |
| 02 | 기존 shell 보존 | `truth` | sidebar26/routes24/tabs/settings counts | covered |
| 03 | Initial 3 readiness | `studio` | Threads/IG ready, X fail-close | covered |
| 04 | extensions 실제 상태 | `inventory` | 15 rows, inventory only | covered |
| 05 | OAuth concurrent/replay | `settings` | 20 callbacks, accepted1/rejected19 | covered |
| 06 | provider/account identity 일치 | `settings` | expected vs callback identity | covered |
| 07 | wrong-account 차단 | `settings` | token/publish 0, reconnect | covered |
| 08 | source provenance | `studio` | SourceCard provenance/approval | covered post-migration |
| 09 | Studio/Inbox bridge 진실 | `inbox` | unlinked current vs linked target | covered |
| 10 | migration M0-M8 | `migration` | stepper and authority labels | covered |
| 11 | rollback/reverse replay | `migration` | rollback state, external republish 0 | covered |
| 12 | independent variants | `studio` | Threads/IG/X row validation | covered |
| 13 | dispatch concurrency20 | `studio` | reservation1/duplicate19 | covered post-migration |
| 14 | persistence repair | `result` | external ID/permalink repair | covered |
| 15 | reconciliation | `result` | unknown to found/failed | covered |
| 16 | one result group | `result` | source 1 under account results | covered post-migration |
| 17 | failed-only retry | `result` | success locked, failed selected | covered post-migration |
| 18 | fake permalink 금지 | `result` | no-link, external ID copy | covered |
| 19 | video processing truth | `inventory` | YouTube/TikTok/Reels state only | covered, no full flow |
| 20 | video result parity | `inventory` | gap and future-bet boundary | covered as gap |
| 21 | video readiness | `inventory` | readiness-needed rows | covered |
| 22 | extension disposition | `inventory` | repair/adapter/retire undecided | covered as gap |
| 23 | revoke/incident | `settings` | revoked, side effect0, reconnect | covered |
| 24 | isolation/privacy | `settings` | exact account identity, secret values hidden | covered |
| 25 | F4 cohort rollout | `inventory` | future cohort blocked by approval | covered as boundary |
| 26 | artifact RTM/orphan0 | `rtm` | 28 rows clickable | covered |
| 27 | F4 data rights | `inventory` | owner/export/delete unknown, rollout blocked | covered as gap |
| 28 | 28h circuit breaker | `breaker` | 1679/1680/1681 side effect0 | covered |

**RTM_COUNTS: AC=28 | mapped=28 | orphan=0 | rejected-v5-v6-input=0**

## Prototype preservation test map

| Evidence | Selector or visible test | Expected |
|---|---|---:|
| sidebar links | `[data-app-route]` | 26 |
| route ledger | `[data-route-ledger] li` | 24 |
| Threads tabs | Threads inventory chips | 5 |
| Instagram tabs | Instagram inventory chips | 3 |
| Settings tabs | `[data-settings-tab]` | 9 |
| new top-level nav | `[data-new-top-level]` | 0 |
| text providers | truth chips | 8 |
| direct providers | truth chips | 4 |
| preview providers | truth chips | 7 |
| video providers | inventory video rows | 3 |
| extensions | inventory extension rows | 15 |
| AC rows | `[data-ac]` | 28 |
| dead-end actionless error | manual audit | 0 |
| touch targets below 44px | browser audit | 0 |
| console errors | browser console | 0 |

## 기각안 차단

- v5/v6의 구조, 카피, 내비게이션은 source로 사용하지 않는다.
- 실제 코드와 PRD 4.1.2에서 확인한 수량만 쓴다.
- 기각안에서 들어온 요소가 발견되면 해당 RTM row를 `rejected-input`으로 표시하고 출고를 막는다.

## 레드팀과 셀프심문

**공격:** 28개를 모두 매핑했다고 써도 실제 클릭이 같은 화면만 반복하면 형식적 coverage에 불과하다.

**수정:** 각 AC에 state/interaction을 별도로 지정하고 프로토타입에서 해당 상태 토글을 활성화한다. 미래 범위는 성공 화면이 아니라 `gap`과 `blocked`에 연결한다.

**이게 틀렸다면 가장 그럴듯한 이유는?** PRD 문구를 지나치게 축약해 각 AC의 법적 의미가 달라질 수 있다. 이 RTM은 설계 탐색용이며 승인 정본은 PRD 4.1.2다. 구현 인계 시 정확한 AC 원문과 API 계약을 tech-architect가 재결선해야 한다.

## 회수 필요

- 회수 필요: eng-design RTM에서 API/schema/test evidence까지 확장
- 회수 필요: F4 data rights owner/export/delete 계약

SOURCES: docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | DESIGN.md | docs/user-flow.md | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/app/settings/page.tsx | dashboard/src/components/channels/ChannelPage.tsx | dashboard/src/components/channels/InstagramPage.tsx | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, prototype state routing selectors | design-review, AC coverage and orphan audit

SKILLS_SKIPPED: 없음
