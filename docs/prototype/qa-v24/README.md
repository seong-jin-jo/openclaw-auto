# Marketing Agent v24 런타임·레이아웃 QA

> STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer | skills=gstack browse workflow | evidence=v24 prototype, dashboard/src, jsdom audit | deliberation=DOM 통과와 실제 Chrome 통과를 분리해 대리지표 승격을 막음

## 판정

현재 상태는 **DOM 런타임 복구 확인, 실제 Chrome 미검증**이다.

- `v24-jsdom-audit.mjs`: 26개 route, 172개 상태·전환, 60개 고유 `data-action` 클릭.
- `jsdom-audit-after.json`: runtime error 0, failed check 0.
- HTML source: 중복 `class` 속성 0, 미정의 CSS custom property 0, em dash·en dash 0.
- Chrome/CDP: 현재 worker sandbox가 localhost bind와 Chrome 시작을 차단해 실행하지 못했다.

DOM 결과는 `ReferenceError`와 빈 root 회귀를 잡는 증거다. 계산된 레이아웃, 실제 overflow, focus, 폰트 로딩, 브라우저 고유 오류의 완료 증거는 아니다.

## 실제 Chrome 종료조건

`v24-console-audit.mjs`는 coordinator가 localhost와 Chrome CDP를 사용할 수 있는 환경에서 다음을 한 번에 검사하도록 고정했다.

1. 26개 route API 전환과 실제 `data-route` 클릭.
2. Settings 8탭과 Threads·Instagram 탭 실제 클릭.
3. journey 7개 대표 단계, onboarding, connect, operator role.
4. Home·Studio의 success/loading/empty/error/partial/permission/uncertain/repair.
5. 발견된 모든 `data-action` 실제 클릭.
6. 1440, 1024, 390에서 전 route 문서 가로 overflow 0.
7. `Runtime.exceptionThrown`, console error, browser log error 0.

결과 JSON의 `runtimeErrorCount=0`, `failed=[]`가 실제 Chrome 승인 증거다.

## 레드팀과 셀프심문

레드팀: DOM 에뮬레이션은 브라우저의 폰트, reflow, sticky, dialog, focus를 대신하지 못한다. 따라서 정적·DOM 통과를 디자인 승인으로 올리지 않았다.

셀프심문: 이 복구가 틀렸다면 가장 그럴듯한 이유는 route가 열려도 390에서 콘텐츠가 잘리거나 브라우저 전용 예외가 남는 것이다. CDP 감사에 세 viewport와 실제 클릭을 넣고 별도 종료조건으로 유지했다.

SOURCES: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` | `dashboard/src` | `docs/prototype/qa-v24/jsdom-audit-after.json` | https://help.later.com/hc/en-us/articles/1500003115942-Social-Profile-Connection-Statuses | https://help.metricool.com/api-limitations-per-social-network-n7zlr

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack browse workflow를 console, click, viewport 감사 설계에 사용

SKILLS_SKIPPED: gstack design-review 실호출은 현재 도구 목록에 없어 동일 rubric을 수동 적용. 실제 Chrome은 sandbox 권한 차단
