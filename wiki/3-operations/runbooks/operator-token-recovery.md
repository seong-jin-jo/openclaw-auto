# 운영자 canonical 토큰 복구 runbook

## 목적

운영자 토큰의 로컬 값·GitHub Actions 값·배포 런타임 값이 서로 달라져도 API 스모크만 통과하던
사고를 막는다. 운영 복구는 반드시 한 명령으로 실행하며, 중간 단계 하나라도 실패하면 뒤 단계를
실행하지 않는 fail-closed 절차다.

## 단일 진실원

- 파일: `~/.sj-agent-harness/secrets/openclaw-auto.env`
- canonical 키: `DASHBOARD_AUTH_TOKEN`
- GitHub 동기화 대상: `OSMU_DASHBOARD_AUTH_TOKEN`
- 로컬 호환 키 `OSMU_DASHBOARD_AUTH_TOKEN`도 canonical 키와 정확히 같아야 한다.
- 파일은 현재 사용자 소유의 일반 파일이어야 하며 권한 `600`, symlink 금지다.
- 토큰 원문은 CLI 인자, 로그, Git 추적 파일에 넣지 않는다.

## 실행

저장소 루트에서:

```bash
cd dashboard
npm run ops:recover-operator-token
```

이 명령은 순서대로 다음을 수행한다.

1. 보호된 로컬 inventory의 형식·소유권·권한·두 키의 정확 일치를 검증한다.
2. 토큰을 stdin으로만 `gh secret set OSMU_DASHBOARD_AUTH_TOKEN`에 전달한다.
3. `deploy-marketing.yml`의 OSMU dashboard 서비스 배포를 시작한다.
4. 반환된 정확한 run ID를 `gh run watch --exit-status`로 끝까지 감시한다.
5. 운영 `/api/me`가 HTTP 200과 `isOperator:true`, `/api/operator/customers`가 HTTP 200인지 확인한다.
6. 독립 gstack 브라우저에서 storage를 비우고 실제 `/operator` 폼을 제출한다.
7. `/operator/customers` 이동, `Admin`·`고객 관리` 렌더, invalid 문구 없음,
   4xx/5xx 응답 0건, console error 0건을 모두 확인한다.

폼 경로만 재검증하려면:

```bash
cd dashboard
npm run e2e:operator
```

## 실패 해석

- secret inventory 실패: 파일 권한·소유권·중복 키·두 로컬 별칭 불일치를 먼저 바로잡는다.
- GitHub secret 실패: GitHub CLI 인증 또는 저장소 권한 문제이며 배포는 시작되지 않는다.
- deploy/watch 실패: 실패한 Actions run을 조사하며 live 검증은 실행되지 않는다.
- API 실패: 런타임 secret 또는 운영 API 계약이 잘못된 상태라 실제 폼 E2E는 실행되지 않는다.
- 폼 E2E 실패: API가 통과해도 사용자 입력 계약은 복구되지 않은 것이므로 운영 PASS로 닫지 않는다.

## 보안·운영 근거

- GitHub CLI 공식 계약은 secret 값을 stdin으로 받을 수 있으며, CLI가 전송 전에 로컬 암호화를 수행한다.
- GitHub 공식 보안 지침은 가능하면 command line으로 프로세스 사이에 secret을 전달하지 말 것을 권고한다.
- 배포 성공만으로 운영자 로그인을 완료 처리하지 않는다. API identity와 실제 새 브라우저 폼 제출을
  서로 독립된 종료 증거로 요구한다.

SOURCES:
- https://cli.github.com/manual/gh_secret_set
- https://cli.github.com/manual/gh_workflow_run
- https://cli.github.com/manual/gh_run_watch
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- `pipeline-state.md` — 2026-07-28 operator canonical token recovery
- `docs/qa-tracker.md` — 같은 운영자 canonical token NG
