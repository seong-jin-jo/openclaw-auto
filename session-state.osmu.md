# OSMU 세션 상태

## 2026-09-02 05:24 KST | Codex 메인 컨트롤러 | v67 디자인 승인 후보 수렴

### 무엇을 어디까지 했나

- 독립 감사에서 v65·v66이 승인본 v64 셸을 상속하지 않아 Design Score C로 반려된 사실을 확인했다.
- product-designer가 승인 정본 v64 셸을 유지하고 v65 편집실과 v66 발행실을 한 클릭 라우팅 허브 v67로 통합했다. 제품 소스는 수정하지 않았다.
- `DESIGN.md` v36, v65·v66 증분 디자인 명세, 디자인 리뷰 보고서, 1024·390의 두 방 여섯 상태 clean frame 24장과 스탬프 24개를 만들었다.
- 직접 픽셀 검수 피드백을 반영해 44px 선택 히트박스 안 표시 체크를 20px로 줄였고, 390 발행실에서는 네 발행 행동을 카드보다 먼저 두고 담당 패널 152px를 계속 보이게 했다.
- `pipeline-state.osmu.md`에 v67을 `design_canonical_candidate`로만 핀했다. `/approve design` 전 승인 정본이나 제품 구현 기준은 아니다.
- active goal은 디자인 승인 뒤 개발, 코드리뷰, QA, 원격 CI, 운영 실경로 검증까지 연쇄 진행하도록 유지 중이다.

### 남은 이슈·블로커

- 디자인 게이트 승인만 남았다. matched-pair actual frame은 build 뒤 같은 seed, state, viewport로 촬영해야 하므로 현재는 design frame만 준비됐다.
- v67 승인 뒤에도 v66 미구현과 코드리뷰 MAJOR 10건이 남는다. 표시 이름 읽기 전용화, 플랫폼별 실제 필드와 제한, 계정 상태 보존, 하드 제한 발행 차단, 집중 필터, v65 런타임 상태와 글 형식 계약을 구현해야 한다.
- 운영 제품 구현, 고객 데이터, 실제 외부 채널 발행은 미검증이다.

### 다음에 칠 명령

```text
/approve design
```

승인 시 v67 허브, DESIGN.md v36, v1.0.0 증분 명세를 build 입력으로 핀한다. build 뒤에는 캡처 감사와 같은 24조합으로 actual frame을 만들고 matched-pair 대조를 닫는다.

### 검증했나

- clean frame 24장, 스탬프 24개, 감사 JSON 1개 생성.
- 감사 결과: ready 누락 0, console error 0, 가로 넘침 0, 44px 미만 상호작용 대상 0, review control 노출 0, wide rect 0.
- `check-frame-purity.sh` 통과, `prototype-coverage-check.sh` 24/24 통과, `git diff --check` 통과.
- 대표 1024 편집실, 1024 발행실 overflow, 390 발행실 normal 픽셀 직접 확인. Design Score B+ 88/100.
- 로컬 `npm run test:publish`: 27파일 258건 통과, 2건 제외.
- 로컬 `npx tsc --noEmit`: 오류 0.
- 로컬 `npm run build`: 성공. 기존 NFT tracing 경고 1건.
- PR #41 상태 기록 HEAD `61172554`, CI run `33552996869`: success.
- 운영 실경로: 미검증.

## 2026-09-02 04:33 KST | Codex 메인 컨트롤러 | v65·v66 디자인 승인 대기

### 무엇을 어디까지 했나

- 회장의 `다 진행하고 보고`를 primary로 삼고 active goal을 걸었다. 상태 정합화, 코드리뷰, QA 준비를 병렬 실행했다.
- v64만 현재 승인본이며 v65 편집실은 디자인 승인 기록 없이 구현됐고, v66 발행실은 디자인만 있음을 확정했다.
- `pipeline-state.osmu.md`를 `stage: design`, `status: awaiting-approval`로 재개했다. 승인 후 구현 기준은 v64 전체 정본 + v65 편집실 증분 + v66 발행실 증분이다.
- 현 브랜치를 원격에 push하고 초안 PR #41을 열었다. 최신 HEAD `136a1c64`의 CI run `33549746071`은 성공했다.
- 승인 후 구현할 원문 `docs/prototype/osmu-publishfield-v66-gpt-codex-20260901-0813.html`을 열었다.

### 남은 이슈·블로커

- 하드 블로커는 `/approve design` 하나다. 현 헌법상 메인 컨트롤러가 자가 승인할 수 없다.
- 독립 리뷰에서 MAJOR 10건을 확인했다. v65 런타임 state 미연결, 글 저장 format 오류, v66 표시 이름 편집 잔존, 플랫폼별 필드·제한 미분리, 금지 용어 잔존, 집중 필터 미구현이다.
- 머지·배포·실 고객 세션 QA는 build·QA 승인 전이라 미실행이다.
- 사용자 소유 dirty 파일 `.codex/logs/harness.jsonl`, `docs/requests/inbox/chairman-2026-09.md`는 보존했다.

### 다음에 칠 명령

```text
/approve design
```

승인 직후 메인 컨트롤러가 `code-builder` 1명을 별도 worktree에 배차하고 `code-reviewer`, `qa-verifier`를 병렬로 돌린다. 종료 증거는 MAJOR 10건 해소, 전체 회귀, 390·1024 실렌더, 최신 CI, 실 고객 세션 E2E다.

### 검증했나

- `npm run test:publish`: 27파일 258건 통과, 2건 제외.
- `npx tsc --noEmit`: 오류 0.
- `npm run build`: 성공. 기존 NFT tracing 경고 1건.
- PR #41 CI run `33549746071`: success.
- 운영 실경로: 미검증.

## 2026-09-01 07:48 KST | 편집실 v65 디자인 증분

### 무엇을 어디까지 했나

- 승인된 `docs/prototype/openclaw-auto-4room-v64.html`과 DESIGN.md v33, 거버넌스, 회장 원문, 현재 편집실 구현을 정독했다.
- 제품 코드는 수정하지 않았다. DESIGN.md v34, 편집실 v65 프로토타입, 와이어프레임, 유저 플로우 증분, R-S10-31~38·41 대조 문서를 작성했다.
- 편집실은 콘텐츠 형식만 소유하고 플랫폼과 채널별 문구는 발행실이 소유하도록 분리했다. 글 전체 자유 편집, 카드 안 직접 편집과 위치 이동, 단위가 있는 한국어 라벨, 자동 저장, `발행실로 이동` 단일 주 행동을 정본에 반영했다.
- 로컬 커밋은 `66ad58dd`, `c6b4eada`다. 종료 훅 대응 핸드오프 갱신은 후속 커밋에 기록한다.

### 남은 이슈·블로커

- `git push origin work/editroom`은 실행 정책이 승인 필요로 차단했다. 이 세션은 승인 요청이 금지되어 원격 브랜치는 미생성·미검증이다.
- pipeline design pin은 v64다. v65 집중 프로토타입과 DESIGN.md v34를 디자인 게이트에서 확인한 뒤 핀을 갱신해야 후속 구현 기준이 된다.
- 전용 디자인 리뷰 스킬이 현재 세션에 없어 자동 Design Score는 미검증이다. 수동 판정은 B+다.
- `.codex/logs/harness.jsonl`은 기존 하네스 변경이므로 커밋에서 제외했다.

### 다음에 칠 명령

```bash
git push origin work/editroom
```

push 권한이 있는 컨트롤러가 실행한다. 종료 증거는 원격 `work/editroom`에 핸드오프 후속 커밋까지 보이는 것이다. 그 뒤 `/approve design` 검증으로 v65와 DESIGN.md v34의 핀 정합을 확인한다.

### 검증했나

- `cd dashboard && npx tsc --noEmit`: 오류 0.
- `cd dashboard && npx vitest run tests/publish tests/api`: 최종 단독 실행 67파일, 519건 통과, 2건 제외, 실패 0.
- Chromium 실렌더: 글·카드뉴스·영상·음악의 정상 상태와 빈 상태·불러오는 중·오류·긴 내용을 1024·390 총 16조합 확인했다. 가로 넘침 0, 자바스크립트 오류 0, 정상 상태 활성 주 버튼 1개, 차단 상태 0개.
- 제품 운영 반영: 미검증.

## 2026-09-01 05:20 KST 위임 하네스 결함과 배포 복구

- 테넌트 접속 이력(b6e0b4aa) push 하고 배포했다. run 33435731993 success. services=openclaw-dashboard-osmu.
- 워커 3판(tenantlog, r2store, connectux)은 이미 끝나 있었다. 완료 감시를 안 걸어 세션이 그것을 몰랐다.
- 워커가 매번 push 에 실패한 이유: 워커 샌드박스 기본값에 네트워크가 없다.
- 배포 워크플로 이미지 빌드를 서비스별 순차로 바꿨다. VM 7.8GiB 인데 게이트웨이 빌드가 서비스마다 heap 8GiB 를 잡아 병렬이면 OOM.
- 남은 상류 결함: 게이트웨이 전체 빌드는 extensions/qwen-portal-auth 의 QWEN_OAUTH_MARKER 미정의로 실패한다. 대시보드 배포에는 영향 없다.
- 회장 승인 대기: 발주 래퍼에 완료 마커와 네트워크 기본값을 넣는 수정이 자동 승인 정책에 막혔다.


## 2026-09-01 04:26 KST (Opus, OSMU 라인)

핸드오프 기준: 이 파일. 상세는 `session-state.osmu.md`.

현재 작업: 회장 질문 5건 처리. 연결 미판정의 진짜 원인을 값으로 잡아 고쳤다.

원인 확정(운영 실측):
- 회장 테넌트 Threads 계정 2건. 기본계정 1건인데 그 행에 장기 토큰 만료 시각이 없다.
  새로 연결한 계정은 만료 2026-10-30 으로 정상인데 기본이 아니다.
- Threads·Instagram·Facebook 은 만료 시각이 없으면 재연결 필요로 판정한다. 그래서 저장은
  됐는데 화면은 계속 미연결이었고 발행 대상도 죽은 계정을 가리켰다.
- 고침: 기존 기본계정이 못 쓰는 상태면 새로 연결한 계정으로 기본을 넘긴다(`41ac094d`).

만진 파일:
- `dashboard/src/lib/channel-accounts.ts` (기본계정 승격), 회귀 테스트 신규
- `dashboard/src/app/api/operator/customers/route.ts` (판정 입력 3값 노출)
- `dashboard/src/app/studio/page.tsx` (`승인 인박스로 보내기` → `검토 요청하기`)
- 편집실 글 문단 편집 마무리(`f4ad3326`)
- `~/.claude/harness/bin/md-to-web.sh` (다크 모드에서 다이어그램이 안 보이던 것 수정)

검증: `npx tsc --noEmit` 0. 배포 33430014377 success. 전량 테스트는 6파일 실패인데 전부
로컬 Postgres 미가동 의존 판이다.

진행 중 위임(병렬 2판):
- `osmu-r2store0901` 종료. R2 저장 계층 커밋 완료.
- `osmu-tenantlog0901` 진행 중. 별도 worktree `/tmp/osmu-wt-tenant` 에서 돈다.

다음 액션:
1. 회장이 Threads 연결을 한 번 더 누르면 기본계정이 승격돼 연결됨으로 바뀐다. 확인.
2. `osmu-tenantlog0901` 회수와 배포.
3. 편집실 나머지 항목 순차 발주.

## 2026-09-01 03:26 KST (Opus, OSMU 라인)

핸드오프 기준: 이 파일. 상세는 `session-state.osmu.md`.

현재 작업: 회장 질문 세 건(식별자 차이, 인프라 문서, R2) 처리와 편집실 글 편집 마무리.

만진 파일:
- `dashboard/src/components/studio/StudioRooms.tsx`, `EditPreview.tsx`, `EditPreview.module.css`,
  `StudioCommandPanel.tsx`, `dashboard/src/app/studio/page.tsx` (글은 문단으로 편집)
- `dashboard/src/app/api/operator/customers/route.ts` (연결 판정 입력 3값 노출, 자격증명 제외)
- `dashboard/tests/studio/studio-fe2-rooms.test.tsx` (도구 이름 변경 반영)
- `wiki/5-hubs/hub-eng/architecture/system-architecture.md` (권한 절, 미디어 절)

검증: `npx tsc --noEmit` 은 R2 워커가 쓰는 중인 `tests/lib/media-store.test.ts` 만 오류.
편집실 계약 19건 통과, 관련 UI 18파일 154건 통과. 전량 실행은 6파일 실패인데 넷은 로컬 DB
연결 끊김, 둘은 워커 작업 중 파일이다. `osmu-media` 버킷 쓰기·읽기·삭제 왕복은 직접 확인.

막힌 것:
- 회장 Threads 연결이 저장은 됐는데(계정 2건, 2026-09-01 01:32 KST) 판정은 미연결이다.
  원인 값(상태, 기본 계정, 만료 시각)을 운영자 조회에 노출했고 배포 후 확인해야 한다.
- VM SSH 가 로컬 네트워크에서 닿지 않아 컨테이너 로그를 못 본다. 배포는 self-hosted runner 로 정상.

진행 중 위임: `osmu-r2store0901`(R2 저장 계층). 커밋 `fd33b653`, `01e0f1bd`.

다음 액션:
1. R2 워커 회수, 전량 테스트, 배포.
2. 배포 후 운영자 조회로 연결 판정 3값 확인, 원인 확정.
3. 편집실 나머지 항목 순차 발주.

## 2026-09-01 01:22 KST (Opus)

한 일:
- Threads 테스터 초대 수락 확인. 콘솔에서 `대기 중` 표기가 사라졌다.
- 초대 수락을 우리 앱 안에서 끝내는 것은 불가로 판정했다. Meta 자산이고 사용자 본인 Threads
  로그인이 필요하며, 그 페이지는 로그인 리다이렉트와 교차출처 정책으로 임베드가 막힌다.
  없애는 유일한 길은 App Review 통과다.
- **정정**: 에셋은 R2 가 아니라 컨테이너 영속 볼륨 `osmu-data:/app/data` 에 저장돼 있었고
  Meta 는 `/api/images/deliver/<서명토큰>` 으로 직접 가져간다. R2 는 발행의 전제가 아니다.
  앞서 올린 "R2 미설정이라 보관되지 않는다" 결정 요청은 틀렸다. 실수 원장에 기록했다.
- Cloudflare 계정에 `osmu-media` 버킷 생성(S3 API). 공개 URL 설정은 콘솔이 필요해 미완이고,
  위 정정 때문에 급하지 않다. 보유 토큰은 터널 전용이라 R2 권한이 없다.
- R2 설정 API 가 시크릿 키를 평문으로 브라우저에 내려주던 것을 막고 회귀 테스트를 붙였다.
- OAuth 왕복 시도: 동의 화면은 권한 5개로 정상. curl 로 시작한 콜백은 브라우저 state 불일치로
  정상 거절됐다(보안 검사 작동). 왕복 완주는 회장 로그인 세션에서만 가능하다.

위임:
- `osmu-editroom0901b` 진행 중. 편집실·발행실 미충족 10건.
- 직전 `osmu-editroom0901` 은 승인 프로토타입 핀 부재로 빈손 종료. `pipeline-state.osmu.md` 에
  v64 를 핀하고 재발주했다.

남은 이슈:
- Threads 연결 왕복 완주 미확인.
- App Review 제출 조건: 권한별 성공 호출 증거와 심사용 영상.
- 전건 대조표 미충족 잔여. 가장 큰 덩어리가 편집실·발행실 화면 구조다.
- 로컬 데이터베이스 연결이 끊겨 있어 전량 테스트 중 DB 의존 판 10건이 실패한다(코드 회귀 아님).

다음 액션:
1. `osmu-editroom0901b` 회수, 검증, 배포.
2. 회장이 대시보드에서 Threads 연결을 눌러 왕복 완주 확인.
3. 연결 성립 후 권한별 성공 호출 증거 수집.


## 2026-08-31 23:48 KST (Codex) 심사 전 소셜 연결 안내 build

- 기반: 회장이 지정한 과제, `wiki/거버넌스/결정.md` ADR-004, `wiki/거버넌스/실수.md` 최신 기록,
  `wiki/5-hubs/hub-eng/architecture/system-architecture.md` OAuth 절, 현행 readiness와 연결 컴포넌트.
- 구현: readiness 선택형 `guidance` 계약, Threads와 Instagram의 서로 다른 초대 수락 링크,
  중립 안내 단계, 연결 단추 활성 유지, 초대 미수락 사람 말 변환, 실패 때 같은 링크 재노출.
- 보존: 계정 전환 도움말, 팝업 선점, origin 검증, 연결과 발행 상태 분리, readiness 장애 fail-closed.
- 커밋: `ec092a89`.
- 검증: 신규 계약 집중 Vitest 3파일 40건, 전체 Vitest 208파일 1,567건, TypeScript 오류 0,
  프로덕션 build 정적 페이지 177개, design lint 토큰 위반 0.
- 미검증: 운영 배포, 실제 Threads와 Instagram 초대 수락, 실제 OAuth 왕복.
- 출고 상태: 구현 커밋 `ec092a89`, 후속 계약·문서 커밋 `45b75f7c`. 로컬 HEAD는 원격보다 3개
  커밋 앞서 있다. `git push origin feat/design-system-and-missing-features`는 실행 정책이 승인 필요로
  차단했지만 이 세션은 승인 요청이 금지돼 원격 반영하지 못했다. 원격 HEAD는 `88407d09`로 관찰했다.
- 다음 액션: 푸시 권한이 있는 컨트롤러가 동일 브랜치를 push한 뒤 QA가 실제 OAuth 왕복을 검증한다.

## 2026-08-31 23:20 KST (Opus) 정정과 추가

- **정정**: 앞 기록이 초대 수락을 제품 흐름처럼 적었다. 그것은 App Review 통과 전에만 있는 한시 절차다.
  회장 지적으로 ADR-006 을 세웠다. 심사 전에는 화면이 링크까지 안내하고, 심사 통과가 이 절차를 없앤다.
- **정정**: 운영 화면에서 네 방을 확인했다고 볼 뻔했으나, 운영자 토큰으로 접속하면 고객 Studio 가 아니라
  운영자 관리 화면이 뜬다. 네 방이 모두 같은 숫자를 낸 것이 그 신호였다. 운영 고객 화면은 여전히 미검증이다.
  운영 Studio 는 Supabase 회원 JWT 만 받는다.
- 진행 중 위임: `osmu-connectux0831`(심사 전 안내 UX). 다음 대기: `/tmp/codex-editroom.md`(편집실·발행실 미충족 10건).
- 남은 개발: 전건 대조표의 미충족 38건 중 이번 턴에 회귀·시드·탐침 4건 해소. 나머지는 편집실·발행실 화면 구조가 큰 덩어리다.


## 2026-08-31 22:00 KST (Opus)

무엇까지: Threads 연결 실패 원인을 찾아 콘솔에서 처리했고, 네 방을 덮던 모달을 없앴고, 운영에 배포했다(run 33394212507 success).

- Threads 연결 원인: 회장 계정 `j.the.great.investor` 가 Meta 앱의 Threads 테스터 목록에 없었다. 등록된 것은 darkcupiding, isanghan.math, teamconnectors, zero_to_one_ai 4개뿐이었다. 콘솔에서 추가했고 상태는 `대기 중`이다.
- 남은 회장 조치: <https://www.threads.com/settings/website_permissions> 의 `초대` 탭에서 정성컴퍼니 초대를 수락한다. 수락 전에는 연결되지 않는다.
- 앱 번호 주의: `905965605850465` 는 Facebook 앱 번호가 아니라 Facebook 앱 `1553503759757107`(정성컴퍼니) 의 **Threads 앱 ID** 다. 운영 설정은 정상이다.
- 운영 OAuth 동의 화면은 테스터 계정으로 정상 렌더를 직접 확인했다(권한 5개 표시).
- 고친 것: 학습 정보 자동 모달 제거(네 방 차단 해소), 연결 준비상태 사유의 표시명, 로컬 데모 시드 외래키·기본키.
- 검증: `npx vitest run` 207파일 1,557건 전건 통과. `probe-four-room-flow.mjs` PASS(가린 모달 0). `verify-four-room-ui-e2e.mjs` PASS(20회 측정).
- 미검증: 운영 화면에서의 실제 생성. 운영 Studio API 는 Supabase 회원 JWT 만 받는다(운영자 토큰·테넌트 토큰 거부). 회장 로그인 세션이 있어야 눌러볼 수 있다.

## 2026-08-31 17:50 KST Claude 세션 (osmu 라인) Meta 심사 선행 조건 정리

핸드오프 기준: 이 파일(session-state.osmu.md).

## ★회장 지적 R-S17: "meta 심사 다 해놓지 않앗어? 왜 또 멈췄음?"

**컨트롤러가 워커 경고를 읽지 않고 회장께 넘긴 stopping short.** 실수 원장에 기록함.
워커가 "9개 권한 전체 제출은 세 가지가 끝나기 전에 하면 안 된다"고 했는데
그 셋이 무엇인지 열어 보지도 않고 "제가 읽고 안내하겠습니다"로 턴을 끝냈다.

**실제로 읽어 보니:**
| 선행조건 | 내용 | 상태 |
|---|---|---|
| 1 | 운영에 Privacy·Terms·Data Deletion 배포 | **이미 완료.** PR #40 에 함께 나갔다. 컨트롤러 실측 `/privacy` 200 `/terms` 200 `/data-deletion` 200 |
| 2 | 각 권한으로 최근 30일 내 성공한 API 호출 만들고 녹화 | 회장 테스터 등록 뒤 컨트롤러가 진행 |
| 3 | `instagram_business_manage_insights` 쓰는 화면 구현 또는 첫 제출 범위에서 제거 | **컨트롤러 몫.** codex `osmu-scope0831` 에 발주(범위에서 제거 방향) |

⇒ 셋 중 둘이 컨트롤러 몫이었고 하나는 이미 끝나 있었다. 멈출 이유가 없었다.

## ★Meta 테스터 등록 클릭 경로 (회장 몫. 문서 원문 그대로)

앱: `905965605850465` / <https://developers.facebook.com/apps/905965605850465/>

**Threads**: 왼쪽 `Use cases` → `Access the Threads API` 의 `Customize`
→ `Settings` 의 `User Token Generator` → `Add or Remove Threads Testers`
→ `App roles` 의 `Roles` → `Add people`
★역할은 일반 `Tester` 가 아니라 **`Threads Tester`** 를 선택해야 한다.

**초대 수락(빠지면 적용 안 됨)**: 초대한 Threads 계정으로 로그인 →
<https://www.threads.com/settings/website_permissions> → `Invites` → `Accept`

**Instagram**: 같은 앱 `App roles > Roles > Add people` → `Instagram Tester`
→ Instagram Professional 계정 추가

★ADR-004: **Meta 콘솔 자동 조작 금지.** 2026-07-01 계정 플래그 실사고.

## ★신설 훅이 첫날 제 일을 했다 (기록)

`delegation-governance-gate.sh` 가 codex 발주를 막았다. 오탐으로 의심했으나
**프롬프트 파일이 실제로 없었다**(앞선 명령이 승인 단계에서 죽어 heredoc 미실행).
훅이 없었으면 빈 프롬프트로 워커가 떠서 빈손으로 끝났을 것이다.
**교훈: 훅이 막으면 우회부터 생각하지 말고 훅이 본 것이 사실인지 먼저 확인한다.**
★codex-in-pane.sh 는 프롬프트를 **파일 경로**로 받는다. 파일이 없으면
 "프롬프트 파일 없음" 으로 죽는다. Write 도구로 파일을 먼저 만들어라.

## 가동중 codex 2판

| 세션 | 담당 | 산출물 |
|---|---|---|
| osmu-fullaudit0831 | 회장 세션 발화 R-S01~R-S16 전건 대조 | docs/qa/회장-세션발화-전건-대조표-2026-08-31.md |
| osmu-scope0831 | 미사용 권한 첫 제출 범위에서 제거 + 전 provider 전수 확인 | meta-app-review 문서 갱신 |

★scope 판에 못 박은 것: content_publish 는 절대 빼지 마라(제품 핵심).
 뺀 권한 때문에 깨지는 화면은 "아직 제공하지 않습니다"로 정직하게 표시. 0으로 표시 금지.

## 회수 완료 (앞선 항목)

- **실제 LLM 연동 배포 완료**(PR #40, 배포 33336853881 success).
  후보 A/B/C 가 실제 모델 생성. 실패를 템플릿으로 덮지 않음. 사용량 기록 선행.
  운영 컨테이너 실측: health 200, CLAUDE_CODE_OAUTH_TOKEN 존재, claude 2.1.197.
  ★**운영 화면에서 생성 버튼은 아직 안 눌러 봤다. 미검증.**
- 학습정보 8 + 생성실 11 대조(표 41행), 편집실 8 + 발행실 4 + 왕복 띠 제거(표 21행)
- 전체 시험 207파일 1,556건 통과 실패 0(컨트롤러 직접 실행)

## 남은 것

- **운영 화면에서 생성 버튼 실제 실행 확인**(최우선)
- 회장 세션 발화 전건 대조표 회수 → 발화 16건이 요구 단위로 다 들어갔는지 행 수 확인
- scope 판 회수 → **"지금 제출하셔도 됩니다" 한 줄 판정**을 회장께
- 테스터 등록되면 권한별 성공 호출 만들고 녹화 대본대로 진행
- 배포 스모크에 OAuth 왕복 완주 검사 추가
- 266건 대조표의 미충족 48 · 부분 60 처리
