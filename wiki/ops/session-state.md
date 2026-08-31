# 세션 상태 (얇은 인덱스)

트랙별 상세는 각 트랙 파일에 둔다. 이 파일은 어느 세션이 무엇을 primary 로 잡았는지만 남긴다.

## 2026-09-01 03:40 KST (Codex, OSMU R2 저장 계층)

핸드오프 기준: 회장이 이 턴에 지정한 비공개 R2 저장과 기존 HMAC 배달 유지 과제.

현재 상태: `media-store` 단일 계층과 업로드·배달·삭제 전환, 로컬 이전 fallback, 이전 스크립트,
환경변수와 배포 연결, 아키텍처 문서를 구현했다. 구현 커밋은 `fd33b653`, `01e0f1bd`다. 원격
`feat/design-system-and-missing-features`에도 두 커밋이 포함된 것을 확인했다.

검증: R2 집중 계약 10건 통과, 깨끗한 `npm ci` 설치에서 TypeScript 오류 0, production build 정적
페이지 177/177, design lint 위반 0.
실제 PostgreSQL 스키마와 RLS를 붙인 전체 Vitest는 211파일 중 210파일, 1,569건 중 1,566건 통과와
조건부 1건 제외다. 실패 2건은 공유 브랜치 Studio의 `검토 요청하기` 단추 계약이며 R2 경로와 무관하다.

남은 것: 깨끗한 설치 타입 보정과 구현현황 기록은 로컬 최신 커밋에 있다. `git push origin
feat/design-system-and-missing-features`는 실행 정책이 승인을 요구했지만 이 세션은 승인 요청이 금지돼
실행되지 않았다. 원격에는 구현 커밋 `fd33b653`, `01e0f1bd`까지 있고 최신 검증 기록 커밋은 로컬에만
있다. 운영 R2 자격증명 주입, 실 업로드·배달, 로컬 파일 이전은 미실행·미검증이다. 다음 QA는 Studio
계약 실패 2건 해소 뒤 `cd dashboard && npx vitest run` 전량 재실행이다.

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

## 2026-09-01 01:40 KST (Codex, OSMU 편집실·발행실 2차 피드백)

핸드오프 기준: 회장이 이 턴에 지정한 편집실·발행실 10개 미충족 항목과
`pipeline-state.osmu.md`의 v64 승인 핀. 이전 `osmu-editroom0901` pane은 핀 부재로 종료됐고,
현재 `osmu-editroom0901b`가 같은 과제를 재개했다.

현재 작업: 글 문단 편집, 영상 대사 편집 분리, 카드뉴스 이미지 안 글자 수정·이동,
콘텐츠 형식과 발행 채널 분리, 저장과 발행실 이동 노출, 의미 불명 라벨 제거를 구현한다.
착수 시점 결함은 `docs/qa/qa-tracker.md` 최상단에 NG로 등록했다.

보존할 다른 세션 변경: `.codex/logs/harness.jsonl`, `docs/prototype/qa-flow/`,
`docs/requests/inbox/chairman-2026-08.md`, `docs/requests/inbox/chairman-2026-09.md`는 수정하거나
stage하지 않는다. 다음 액션은 편집실 계약 테스트를 먼저 추가한 뒤 소스 구현이다.

## 2026-09-01 01:35 KST (Opus, OSMU 라인)

핸드오프 기준: 이 파일. 상세는 `session-state.osmu.md`.

현재 작업: 회장 지적 두 건 처리(초대 절차 내재화 가능성, R2 생성)와 편집실 판 재발주.

관찰한 것:
- Threads 테스터 `j.the.great.investor` 초대 수락 완료. 콘솔에서 `대기 중` 표기가 사라졌다.
- 초대 수락을 우리 앱 안에서 끝낼 수 없다. Meta 자산이고 사용자 Threads 로그인이 필요하며
  로그인 리다이렉트와 교차출처 정책으로 임베드도 안 된다. 없애는 방법은 App Review 통과뿐이다.
- 에셋은 R2 가 아니라 컨테이너 영속 볼륨에 있었고 Meta 는 `/api/images/deliver/<서명토큰>` 으로
  가져간다. R2 는 발행의 전제가 아니다. 앞선 보고가 틀렸다.
- Cloudflare 계정에 `osmu-media` 버킷 생성 완료(S3 API). 공개 URL 설정은 콘솔이 필요해 미완.
  보유 토큰은 터널 전용이고 브라우저 쿠키 가져오기로도 콘솔 로그인이 살아나지 않았다.
- OAuth 왕복: 동의 화면까지는 정상(권한 5개). curl 로 시작한 콜백은 브라우저 state 불일치로
  정상 거절됐다. 보안 검사가 작동한 것이고 왕복 완주는 아직 못 봤다.

만진 파일: `pipeline-state.osmu.md`(v64 핀), `wiki/5-hubs/hub-eng/architecture/system-architecture.md`,
`wiki/거버넌스/실수.md`, `dashboard/src/app/api/r2-config/route.ts`, `dashboard/src/components/settings/StorageSettings.tsx`.

진행 중 위임: `osmu-editroom0901b`(편집실·발행실 10건). 직전 판 `osmu-editroom0901` 은 승인 핀 부재로 빈손 종료.

다음 액션:
1. `osmu-editroom0901b` 회수, 검증, 배포.
2. 회장이 대시보드에서 Threads 연결을 눌러 왕복 완주 확인.
3. R2 를 실제로 쓸지 결정. 지금은 발행에 필요 없다.

## 2026-08-31 23:48 KST (Codex, OSMU 소셜 연결 안내)

핸드오프 기준: 회장이 지정한 심사 전 소셜 연결 안내 과제. 상세는
`session-state.osmu-connectux0831.md`.

현재 작업: readiness 구조화 안내, Threads와 Instagram 링크, 안내가 있어도 클릭 가능한 연결 단추,
초대 미수락 오류와 같은 링크 재노출을 구현했다. 코드와 계약 테스트 7파일은 커밋 `ec092a89`다.

검증: 신규 계약 집중 Vitest 3파일 40건, 전체 Vitest 208파일 1,567건, `npx tsc --noEmit`,
프로덕션 build 정적 페이지 177개, design lint 토큰 위반 0. 구현과 문서는 `ec092a89`, `45b75f7c`로
커밋했다. 지정 브랜치 push는 실행 정책이 승인 필요로 차단했고 이 세션은 승인 요청이 금지돼 미반영이다.
로컬 HEAD `45b75f7c`, 원격 HEAD `88407d09`를 직접 확인했다.

보존한 사용자 변경: `.codex/logs/harness.jsonl`, `docs/prototype/qa-flow/observations.json`,
`docs/requests/inbox/chairman-2026-08.md`와 QA 캡처 파일은 이 작업에서 수정하거나 stage하지 않는다.

## 2026-08-31 22:05 KST (Opus, OSMU 라인)

핸드오프 기준: 이 파일. 상세는 `session-state.osmu.md`.

현재 작업: Threads 연결 실패 해소와 네 방 모달 차단 제거. 운영 배포까지 끝냈다.

만진 파일:
- `wiki/5-hubs/hub-eng/architecture/system-architecture.md` (플랫폼 OAuth 권한 구조 신설)
- `dashboard/src/app/studio/page.tsx`, `dashboard/src/components/studio/learning-info.ts` (자동 모달 제거)
- `dashboard/src/app/api/connect/readiness/route.ts` (사유 문구에 채널 표시명)
- `dashboard/scripts/seed-local-demo.sql` (테넌트 선삽입, queue_posts 기본키)
- `wiki/거버넌스/실수.md`, `wiki/거버넌스/요청.md`, `session-state.osmu.md`
- `~/.sj-agent-harness/bin/mvm.sh` 신설, 자격증명 하드코딩 임시 스크립트 삭제

검증: `npx vitest run` 207파일 1,557건 전건 통과. `probe-four-room-flow.mjs` PASS(가린 모달 0). `verify-four-room-ui-e2e.mjs` PASS. 배포 워크플로 33394212507 success, 운영 응답으로 반영 확인.

막힌 것: 운영 화면 실제 생성. 운영 Studio API 는 Supabase 회원 JWT 만 받아 운영자 토큰과 테넌트 토큰으로는 누를 수 없다. 회장 로그인 세션이 필요하다.

다음 액션:
1. 회장이 https://www.threads.com/settings/website_permissions 초대 탭에서 정성컴퍼니 초대를 수락한다.
2. 수락 확인 후 Threads 연결 왕복을 실측한다(연결 상태 connected).
3. 회장 로그인 뒤 운영 생성 1회를 실측한다.
