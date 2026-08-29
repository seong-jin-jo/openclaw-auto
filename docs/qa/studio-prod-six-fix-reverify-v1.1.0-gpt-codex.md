# OSMU Studio 운영 수정 6건 재검증 v1.1.0

STAMP | line: studio | 생성: 2026-08-29 08:04 KST | model: gpt-5.6-sol | agent: qa-verifier | skill: qa | 근거 URL: https://github.com/seong-jin-jo/openclaw-auto/actions/runs/33216078099, https://playwright.dev/docs/auth, https://supabase.com/docs/guides/auth/sessions | 고민: 다른 세션의 PASS 문장보다 이 브라우저에서 관찰한 최종 URL과 요청 수를 우선했다.

## 한 줄 결론

운영 수정 6건 중 4건은 PASS, 무료 재생성은 부분 검증, 만료 세션 returnTo는 FAIL이다. 390px과 1440px 네 방은 가로 넘침 0이며, 정상 스모크의 신규 콘솔 오류와 비정상 네트워크 응답은 0건이다. 만료 고객이 최종적으로 운영자 콘솔에 도달하는 High 결함 때문에 전체 QA는 NG다.

## 기반

- 운영 배포: GitHub Actions run `33216078099`, `completed/success`, head SHA `ec6f4ccfae64247315addfa12b7d9ae975f5ea63`.
- 계정: 기존과 같은 실제 Supabase QA 고객. `/api/me` HTTP 200, active tenant `f744c767-b6ed-4c04-9d5a-6365e126405d`.
- 데이터 경계: 생성용 주제 `[QA-FIX6-0752] 운영 입력 보존 확인`. 연결 발행 계정 0개.
- 안전 경계: 외부 SNS 게시, 유료 재생성, 운영 데이터 삭제 0건.

## 수정 6건 판정

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 직접 관찰 증거 |
|---|---|---|---|---|
| R08, R168 | 생성실 입력 보존 | FIX6-INPUT-01 | PASS | 주제, 목적, 대상, 권리 확인이 생성실→편집실→생성실 왕복과 새로고침 뒤 동일 |
| R168 | 생성 연타 POST 1회 | FIX6-DOUBLE-01 | PASS | 같은 버튼을 동기적으로 두 번 눌러도 `POST /api/studio/v1/generations` 201 한 건, 후보 A·B·C 표시 |
| R27 | 후보 전체 거절 뒤 무료 재생성 | FIX6-REGEN-01 | 부분 검증 | 버튼과 regeneration API 도달 확인. 계정의 오늘 무료 몫 사용 상태로 409와 안내 문구. 새 후보 201은 이 세션에서 미관찰 |
| R08, R132 | 편집실 글 전환 | FIX6-EDIT-01 | PASS | 카드뉴스에서 `글` 클릭 뒤 aria-pressed true, `지금 만드는 것: 글`, 5개 문단과 글 목차 표시 |
| R89, R128, R151, R165, R171, R175 | 연결 채널 0개 발행 차단 | FIX6-PUBLISH-01 | PASS | 발행 체크박스 7개 모두 미선택·disabled, `0곳에 올리기`와 `지금 발행하기` disabled, publish POST 0건 |
| R104 | 만료 세션 고객 로그인 returnTo | FIX6-AUTH-01 | FAIL, High | 만료형 JWT는 `/studio?room=edit` URL에 공개 랜딩을 표시. 형식 불량 stale token은 returnTo 로그인 뒤 최종 `/operator`. 안정된 고객 로그인 복귀 없음 |
| R01~R207 | 회장 확정 요구 전건 | REQ-ALL | 이월 | 기존 전건 요구 추적표 유지 |

## 발견과 사업 의미

입력 보존은 수정됐다. 고객이 제작 중 다른 방을 확인하거나 새로고침해도 목적, 대상, 권리 확인을 다시 입력하지 않는다. 생성 버튼 연타도 운영 서버 요청 한 건으로 수렴해 중복 생성 비용과 후보 혼선을 막는다.

글 전환과 채널 0개 발행 차단도 수정됐다. 글을 선택하면 실제 편집 단위가 5개 문단으로 바뀌고, 계정이 연결되지 않은 고객은 선택과 발행을 시작할 수 없다. 외부 provider 요청이 나가기 전에 화면에서 안전하게 막힌다.

무료 재생성은 버튼과 서버 한도 경계까지 확인했지만 성공 재생성은 이 세션에서 증명하지 못했다. 같은 QA 계정의 오늘 무료 몫이 사용된 상태였고 서버는 409와 `오늘의 무료 재생성을 이미 사용했습니다`를 반환했다. 다른 동시 QA 기록에는 앞선 regeneration POST 201 관찰이 적혀 있지만, 이 보고서는 현재 세션의 직접 관찰만 판정 근거로 삼았다.

만료 세션 문제는 남았다. 실제 고객 JWT 구조를 유지한 채 `exp`와 `iat`만 지난 값으로 바꾸자 `/studio?room=edit` URL은 유지됐지만 화면은 공개 랜딩으로 바뀌었다. 형식이 불량한 stale token에서는 returnTo가 붙은 고객 로그인 주소에 잠깐 도달한 뒤 최종 `/operator` 운영자 토큰 입력으로 이동했다. 두 변형 모두 안정된 고객 로그인과 Studio 복귀 주소를 제공하지 않는다. 고객 관점에서는 세션 만료 뒤 제작실 복귀가 막히므로 전체 QA PASS를 금지하는 High 결함이다.

## 반응형·콘솔·네트워크

| 폭 | 생성실 | 편집실 | 발행실 | 성과실 | 가로 넘침 |
|---|---|---|---|---|---|
| 1440px | PASS | PASS | PASS | PASS | 네 방 0px |
| 390px | PASS | PASS | PASS | PASS | 네 방 0px |

정상 스모크에서 `/api/me`는 200이며 신규 콘솔 오류와 비정상 네트워크 응답은 0건이다. 의도적인 음수 테스트에서는 무료 몫 409와 만료 세션 401이 각각 관찰됐다. 인증 저장소를 다시 주입한 뒤 `/api/me` 200으로 복구했다.

## 증거

- 입력 전후: `osmu-prod-six-fix-reverify-20260829/input-before-roundtrip-1440-v2.png`, `input-after-reload-1440-v2.png`
- 생성·재생성: `free-regen-before-click.png`, `free-regen-after-click.png`
- 글 전환: `edit-text-switch-1440.png`
- 0채널 발행 차단: `publish-zero-channels-1440.png`
- 만료 세션 실패: `expired-jwt-returnto-1440.png`, `expired-session-returnto-1440.png`
- 반응형: `create-390.png`, `edit-390.png`, `publish-390.png`, `performance-390.png`, `create-1440.png`, `edit-1440.png`, `publish-1440.png`, `performance-1440-v2.png`

## 정리 계획

브라우저에는 새 실제 QA 세션을 다시 주입했고 `/api/me` 200으로 복구했다. 세션 원문은 저장소 밖 600 권한 파일에만 있다. 이번 검증이 만든 generation과 무료 재생성 장부는 tenant와 `[QA-FIX6-0752]` 표식으로 식별 가능하다. 만료 세션 결함 수정판을 재검증한 뒤 제한된 운영 정리 경로로 QA 표식 generation, draft, quota만 삭제한다. 현재는 결함 재현 근거를 보존하기 위해 운영 데이터 삭제를 실행하지 않았다.

## 벤치마크 적용

Playwright는 인증 상태 파일을 비밀값으로 취급하고 만료 시 갱신할 것을 권고한다. 이를 따라 QA 세션 원문은 저장소에 넣지 않고 로컬 600 권한 파일로 갱신했다. Supabase의 세션 수명 주기 문서를 기준으로 세션 발급 성공과 만료 뒤 앱 라우팅 성공을 별개로 판정했다. W3C의 페이지 구조 기준은 네 방의 접근 가능한 이름과 구조를 확인하는 보조 기준으로 사용했다.

## 레드팀과 셀프심문

까다로운 고객의 반론은 "네 건이 고쳐져도 세션이 만료되면 제작실에 돌아오지 못하므로 제품을 믿을 수 없다"다. 이 반론이 핵심 경로를 찌르므로 전체 QA를 NG로 유지했다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 `/login?returnTo=...` 중간 주소가 이미 수정 성공이고 최종 `/operator`가 형식 불량 토큰의 인공 결과라는 점이다. 이를 반박하려고 실제 JWT 구조를 유지한 만료 토큰도 추가로 시험했지만 안정된 고객 로그인 대신 Studio URL 위 공개 랜딩이 나타났다. 토큰 변형 두 개가 모두 고객 복귀에 실패했으므로 결론을 유지했다.

SKILLS_USED: qa. 실제 브라우저 회귀, 인증 세션 안전, 네트워크 요청 수, 반응형 증거 기록에 사용. / SKILLS_SKIPPED: 없음.

SOURCES: https://github.com/seong-jin-jo/openclaw-auto/actions/runs/33216078099 | https://playwright.dev/docs/auth | https://supabase.com/docs/guides/auth/sessions | https://www.w3.org/WAI/tutorials/page-structure/headings/

MODEL: gpt-codex/gpt-5.6-sol

RUBRIC_SCORE: evidence=4/5 scope=5/5 safety=5/5 traceability=5/5 reporting=5/5 total=24/25
