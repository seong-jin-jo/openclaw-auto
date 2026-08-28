# Release 0.2.0

```yaml
release: 0.2.0
date: 2026-08-28
status: release-candidate
ships:
  prd: 8.2.1
  design-system: v18
  prototype: v38
  fdd: null
  api-contract: null
  qa: null
image: openclaw-auto/dashboard:0.2.0
changelog: CHANGELOG.md#020-2026-08-28
```

`ships`는 `pipeline-state.osmu.md`의 `approved_artifacts`만 옮겼다. FDD, API 계약, QA는 승인 핀이 없으므로 값을 만들지 않고 `null`로 남겼다. 이 매니페스트는 병합 검토용 릴리스 후보이며 운영 배포 완료 선언이 아니다.

## 검증

| 항목 | 결과 | 직접 증거 |
|---|---|---|
| 운영 빌드 | PASS | 환경파일을 분리한 `npm run build`, 174개 정적 경로 생성, `/tmp/osmu-release-production-build-final.log` |
| 무설정 기동 | PASS | `/` 200, 주요 설정 의존 API 503, 500 응답 0건, `/tmp/osmu-release-no-config-smoke-final.tsv` |
| 마이그레이션 | PASS | 기존 운영 스키마에서 순차 적용 6/6, 최신 스키마에서 재적용 6/6, 대상 테이블 7/7, `/tmp/osmu-release-migration.log` |
| 개발 신원 운영 차단 | PASS | 운영 환경에서는 모든 개발 신원 예외값을 무시하고 503으로 거절, 배포 환경파일 정적 차단 계약 |
| 전체 회귀 | PASS | Vitest 186파일, 1,332건 통과, 3건 조건부 제외, 실패 0. `/tmp/osmu-release-regression.log` |
| TypeScript | PASS | `npx tsc --noEmit`, `/tmp/osmu-release-tsc.log` |
| 기본 흐름 | PASS | 실제 `localhost:3456` 11/11, `/tmp/osmu-release-basic-flow-e2e.log` |
| Studio 개발 계약 | PASS | 실제 `localhost:3456` 12/12, `/tmp/osmu-release-studio-v1-e2e.log` |
| Docker 이미지 | PASS | 로컬 검증 이미지 `openclaw-auto/dashboard:0.2.0`, 이미지 ID `sha256:8afe50435060773d4d171472dd428564d29e6faa44e15fd9c299962cee47a0b3` |
| 디자인 정합 게이트 | NG | `docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`가 전체 v63 정합 NG를 유지 |
| 산출물 드리프트 | FAIL | 미산출 design spec, FDD, API 계약, ERD 4건. 스크립트의 이미지 파서 공백 오탐 1건은 별도 |

## 배포 판정

이미지 버전과 매니페스트 버전은 0.2.0으로 정렬했다. 다만 QA 승인 산출물이 없으므로 release-manager 판정은 `배포 승인 전`이다. 병합 요청은 회장이 변경 내용과 미지원 범위를 검토하는 용도로 올리며, 병합과 운영 워크플로 실행은 회장 판단 뒤에만 한다.

## 기준과 검토

- 참고한 방식: Next.js의 빌드 시점 환경변수 규율, GitHub Actions의 self-hosted runner 배포 규율, 프로젝트 릴리스 매니페스트 규율.
- 차용한 점: 빌드 시점 공개값과 런타임 비밀값을 분리하고, 배포 전에 이미지 태그와 매니페스트 버전을 고정했다.
- 다르게 한 점: 자동 병합과 자동 배포는 하지 않고, 현재 승인 산출물의 빈칸을 그대로 드러낸 릴리스 후보로 멈춘다.

STAMP | line: osmu-ship1 | 생성: 2026-08-28 21:21 KST | model: gpt-5.6-sol | agent: release-manager | skill: ship | 고민: 실행 검증 통과와 단계 승인 통과를 섞지 않고 별도 상태로 기록했다.

SKILLS_USED: ship. 버전 선언, 매니페스트, 회귀, 변경기록, 병합 요청 준비에 사용.

SKILLS_SKIPPED: 없음.

SOURCES/MODEL: gpt-5.6-sol | `/Users/sj/.claude/standards/release-and-artifacts.md` | `pipeline-state.osmu.md` | `pipeline-state.studio.md` | `docs/qa/qa-tracker.md` | `docs/구현현황.md` | https://nextjs.org/docs/app/guides/environment-variables | https://docs.github.com/en/actions/reference/runners/self-hosted-runners

RELEASE_FOOTER: release=0.2.0 | manifest=`RELEASE.md` | image=`openclaw-auto/dashboard:0.2.0` | drift-check=FAIL, 필수 산출물 4건 미산출
