# osmu-appreview0831 핸드오프

STAMP | line: osmu-appreview0831 | 갱신: 2026-08-31 05:26 KST | model: gpt-codex/gpt-5.6-sol | agent: code-builder

## 무엇을 어디까지 했나

- ADR-004의 개발 모드와 상품화 계약을 읽고 Meta App Review 준비를 구현했다.
- 채널 연결 전 Instagram, Threads, Facebook은 앱 심사 전 테스터 등록과 초대 수락 계정만 연결할 수 있다는 안내를 표시한다. 승인 뒤에는 테스터 등록 없이 OAuth 연결할 수 있다고 안내한다.
- `/privacy`, `/terms`, `/data-deletion`에 Meta 데이터 수집 범위, 이용 목적, 제3자 공유 제한, 보관 기간, 사용자 삭제 방법, 심사 전 테스터 한계를 반영했다.
- `docs/releases/meta-app-review-제출-준비-2026-08-31.md`에 권한 9개 표, Advanced Access 조건, 녹화 대본 8개, 영문 이용 사례 9개, Threads와 Instagram 테스터 등록·수락 경로, 제출 전 체크리스트를 작성했다.
- 커밋 `6bf30888`, `17b6b93a`, `af29fad9`를 `origin/feat/design-system-and-missing-features`에 푸시했다. 원격과 로컬 HEAD는 `af29fad90f425b11a7d12b9bb06b6b9f2713760c`로 일치한다.
- Meta 콘솔은 자동 조작하지 않았고 PR merge도 실행하지 않았다.

## 남은 이슈·블로커

- 운영 `/privacy`, `/terms`, `/data-deletion`은 HTTP 200이지만 이번 보강 문구는 아직 미배포다.
- `instagram_business_manage_insights`는 OAuth scope에 포함돼 있지만 제품에 실제 Instagram 인사이트 조회 API와 화면이 없다. 구현하거나 첫 App Review 범위에서 제거해야 한다. 추천은 최소 권한 원칙에 따라 첫 제출에서 제거하는 것이다.
- Advanced Access를 요청할 각 권한에 대해 최근 30일 안의 성공 API 호출과 실제 사용 녹화가 필요하다.
- Threads를 당장 연결하려면 앱 905965605850465에 회장 계정을 Threads Tester로 추가하고, 동일 Threads 계정에서 초대를 수락해야 한다.
- App Review 제출 버튼은 회장이 직접 누른다.

## 다음에 칠 명령

계약 재검증:

```bash
cd dashboard && npx vitest run tests/api/connect-readiness-resolver.test.ts tests/api/connect-readiness.test.ts tests/components/SocialConnectButton.test.tsx tests/brand/legal-pages.test.ts
```

운영 배포 뒤 법적 고지 확인:

```bash
for path in privacy terms data-deletion; do curl -fsS -o /dev/null -w "$path %{http_code}\n" "https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/$path"; done
```

실제 QA는 초대를 수락한 Threads 계정으로 채널 연결을 실행하고 `threads_basic` HTTP 400이 재현되지 않으며 연결 계정이 표시되는지 확인한다.

## 검증했나

- `cd dashboard && npm run test`: 207파일, 1,556건 통과, 조건부 1건 제외, 실패 0.
- `cd dashboard && npx tsc --noEmit`: 오류 0.
- `cd dashboard && npm run build`: 177/177, exit 0. 기존 NFT 추적 경고 1건 유지.
- `bash ~/.claude/harness/bin/design-lint.sh dashboard/src`: 디자인 토큰 위반 0.
- 로컬 production 서버에서 `/privacy`, `/terms`, `/data-deletion` 각각 HTTP 200, 콘솔 오류 0.
- 1440px 캡처를 직접 확인해 잘림, 빈 화면, 본문 누락, 영어 UI 라벨 잔존이 없음을 확인했다.
- 운영 배포, 실제 Threads OAuth 연결, App Review 제출은 미검증이다.

## 모델과 벤치마크

- 모델: gpt-codex/gpt-5.6-sol, code-builder.
- 벤치마크 소스 1: Meta App Review Submission Guide, <https://developers.facebook.com/documentation/resp-plat-initiatives/individual-processes/app-review/submission-guide>
- 벤치마크 소스 2: Meta Permissions Reference, <https://developers.facebook.com/docs/permissions>
- 벤치마크 소스 3: Meta Data Deletion Callback and Instructions, <https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback>
- 차용: 권한별 실제 사용 녹화, 최근 성공 API 호출, Privacy Policy와 Data Deletion URL 요구를 제출 체크리스트에 반영했다.
- 변경: 공식 결정 목표와 별개로 Business Verification과 재제출을 감안한 2주에서 4주 운영 버퍼를 분리 표기했다.
- 차별화: 요청 scope와 실제 코드 사용처를 대조해 구현되지 않은 Instagram 인사이트 권한을 제출 차단 조건으로 올렸다.

SKILLS_USED: 없음

SKILLS_SKIPPED: 매칭되는 build 코드 구현 스킬 없음. 저장소 계약과 dev 품질헌법을 적용함.
