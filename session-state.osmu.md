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

