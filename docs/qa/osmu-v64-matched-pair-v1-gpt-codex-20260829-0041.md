# OSMU v64 실제 화면 matched-pair 검증

STAMP
- 생성시각: 2026-08-29 00:41 KST
- 모델: gpt-codex/gpt-5.6-sol
- 에이전트: product-designer, osmu_design_convergence
- 스킬: qa
- 기준 URL: http://localhost:3456/studio, http://localhost:3456/login, docs/prototype/openclaw-auto-4room-v64.html
- 고민 한 줄: 인증실에 들어가지 못한 증거를 화면 불일치로 오판하지 않고, 비교 불능 자체를 출고 차단 근거로 남겼다.

## 한 줄 결론

v64의 생성실, 편집실, 발행실, 성과실은 390, 1024, 1440 폭에서 모두 렌더링됐지만 실제 구현 네 방은 인증 단계에서 막혀 한 장도 관찰하지 못했다. 따라서 12개 matched-pair는 PASS도 NG도 아닌 `BLOCKED`다. 현재 증거로 v64 정합 출고를 승인하면 안 된다.

## 무엇이 왜 깨져 있었나

`http://localhost:3456/studio`는 HTTP 200을 반환했지만 Studio를 보여주지 않고 비로그인 랜딩을 표시했다. 랜딩의 로그인 동선을 따라 `Google로 계속`을 누르면 페이지는 `/login`에 머물렀고, 화면에는 `일시적 오류입니다`가 표시됐다. 같은 시점의 브라우저 콘솔에는 `[login] supabase init: Error: supabaseUrl is required.`가 남았고 네트워크 리소스는 HTTP 503을 반환했다.

문제는 단순히 고객 세션이 없다는 데서 끝나지 않는다. 현재 개발 서버의 공개 Supabase URL 초기화도 실패하므로, 새 인증 세션을 만드는 정상 경로까지 닫혀 있다. 이 상태에서 `/studio`의 HTTP 200이나 공개 랜딩을 Studio 구현 증거로 쓰는 것은 대리지표 오용이다.

또한 검증 도중 공유 브랜치 HEAD가 `31754f8fa9aebbab075393f9179ca01086dd080f`에서 `cfa74e4602b1b2cec3eebe3b3fcb1a8cf77b1595`로 이동했고, 다른 작업자의 `dashboard/src/app/studio/page.tsx` 미커밋 수정도 발견됐다. 최신 `main`은 `066cb3d5cb6165bdfa6c2907be9d6765eaa862ce`이며 v64 파일 자체가 그 커밋에 존재하지 않는다. 따라서 `최신 main의 실제 화면`과 `같은 커밋의 v64`라는 엄격한 비교 기준은 현재 저장소 구조상 성립하지 않는다.

## 그래서 회장과 사업에 무엇이 달라지나

현재 결과는 디자인이 맞거나 틀렸다는 판정이 아니다. 인증된 고객이 실제로 보는 화면을 보지 못했기 때문에, v64를 근거로 개발 수렴이나 배포 승인을 내릴 수 없다는 판정이다. 특히 공개 랜딩이 잘 뜬다는 사실은 생성, 편집, 발행, 성과 흐름의 레이아웃과 반응형 안전성을 전혀 보증하지 않는다.

반면 v64 자체는 세 폭에서 제품 프레임이 렌더링됐다. 이 증거는 비교 기준 화면이 준비됐다는 뜻까지만 가진다. 실제 구현이 열리는 즉시 같은 장면으로 대조를 재개할 수 있다.

## 캡처 결과

| 방 | 390 v64 | 1024 v64 | 1440 v64 | 실제 구현 | 판정 |
|---|---|---|---|---|---|
| 생성실 | `prototype/create-390.png` | `prototype/create-1024.png` | `prototype/create-1440.png` | 인증 전 차단 | BLOCKED |
| 편집실 | `prototype/edit-390.png` | `prototype/edit-1024.png` | `prototype/edit-1440.png` | 인증 전 차단 | BLOCKED |
| 발행실 | `prototype/publish-390.png` | `prototype/publish-1024.png` | `prototype/publish-1440.png` | 인증 전 차단 | BLOCKED |
| 성과실 | `prototype/performance-390.png` | `prototype/performance-1024.png` | `prototype/performance-1440.png` | 인증 전 차단 | BLOCKED |

실제 차단 화면은 `actual/auth-blocker-390.png`, `actual/auth-blocker-1024.png`, `actual/auth-blocker-1440.png`에 저장했다. 세 화면 모두 동일한 로그인 오류 상태를 보여준다. 원본 캡처 디렉터리는 `docs/qa/osmu-v64-matched-pair-20260829/`이다.

v64 캡처 12장은 브라우저 전체 문서가 아니라 각 장면의 `.device` 요소를 직접 캡처했다. 390 장면은 390px 폭, 1024 장면은 장치 테두리를 제외한 994px 폭, 1440 장면은 장치 테두리를 제외한 1410px 폭으로 저장됐다. 12장을 직접 열어 생성실의 카드 세로 적층, 편집실의 목차 우선 배열, 발행실의 채널 연결 경고와 작업 버튼, 성과실의 판정 우선 정보 위계가 각 폭에서 렌더링되는 것을 확인했다. 이 관찰은 프로토타입 내부 정합 증거이며 실제 제품 정합 증거는 아니다.

## 재검증 acceptance criteria

1. 하나의 고정 커밋을 선언하고 실제 서버와 v64 기준 파일을 모두 그 커밋에서 제공한다. 최신 main을 기준으로 삼는다면 v64를 main에 포함시키거나, v64가 존재하는 승인 커밋을 별도 기준으로 명시해야 한다.
2. 개발 서버에 유효한 Supabase 공개 URL과 인증 설정을 주입한다. `Google로 계속` 이후 인증된 사용자로 `/studio`에 진입하며 콘솔의 `supabaseUrl is required`와 HTTP 503이 없어야 한다.
3. 동일한 사용자, 작업 공간, 콘텐츠 시드를 사용해 생성실, 편집실, 발행실, 성과실의 동일 상태를 390, 1024, 1440에서 각각 캡처한다.
4. 각 실제 화면과 해당 v64 이미지를 나란히 놓고 구조, 순서, 밀도, overflow, 카피, 인터랙션 진입점을 판정한다. 관찰 가능한 차이만 PASS 또는 NG로 기록한다.
5. 실제 12장과 비교 12쌍을 모두 직접 열어 본 뒤에만 전체 정합 등급을 낸다.

종료 증거는 인증된 실제 네 방 12장, 같은 커밋의 v64 12장, 콘솔 오류 0, 12개 pair별 PASS 또는 NG 판정이다.

## 레드팀

회의적 검토자는 `로그인 화면만 봤는데 왜 프로토타입까지 검증했다고 말하나`라고 공격할 수 있다. 그 공격이 맞다. 그래서 본 문서는 프로토타입 렌더링과 실제 제품 정합을 분리했고, 실제 정합 점수는 산정하지 않았다.

또 다른 공격은 `공유 브랜치가 움직였는데 같은 커밋이라고 할 수 있나`이다. 이것도 맞다. 최종 차단 화면은 현재 HEAD `cfa74e4`에서 재촬영했지만, 실행 중 다른 작업자의 미커밋 Studio 수정이 존재한다. 엄격한 immutable 비교는 재실행이 필요하다.

## 셀프심문

이 결론이 틀렸다면 가장 그럴듯한 이유는 브라우저에 재사용 가능한 고객 인증 쿠키가 있는데 별도 브라우저 프로필을 열어 놓쳐서다. 그러나 사용한 브라우저에는 상속된 인증 세션이 없었고, 로그인 생성 경로도 Supabase 초기화 오류와 503으로 직접 실패했다. 따라서 현재 실행 환경에서의 `BLOCKED` 판정은 유지한다. 다만 다른 운영 브라우저의 기존 세션이 제공되면 즉시 재검증해야 한다.

## 검증 범위와 변경

- 관찰됨: `/studio` 비로그인 랜딩, `/login` Google 로그인 실패, 화면 오류 문구, 콘솔 Supabase 초기화 오류, HTTP 503.
- 관찰됨: v64 네 방 12장 요소 단위 렌더링과 직접 이미지 확인.
- 미검증: 인증된 실제 생성실, 편집실, 발행실, 성과실의 390, 1024, 1440 화면.
- 변경: 제품 UI 코드는 수정하지 않았다. 이 보고서와 캡처 증거만 추가했다.

DESIGN_SCORE: N/A, 실제 제품 화면 0장으로 정합 점수 산정 불가

SKILLS_USED: qa, 브라우저 재현, 콘솔 및 네트워크 오류 확인, 세 폭 캡처, 시각 검토 / SKILLS_SKIPPED: 없음

SOURCES: http://localhost:3456/studio ; http://localhost:3456/login ; docs/prototype/openclaw-auto-4room-v64.html ; docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md ; git commits 066cb3d5, 31754f8f, cfa74e46

MODEL: gpt-codex/gpt-5.6-sol
