## 2026-08-31 06:45 KST Claude 세션 (osmu 라인) ★LLM 실연동 배포 완료

핸드오프 기준: 이 파일(session-state.osmu.md).

## ★★★ 실제 LLM 연동 완료. 배포됨. (PR #40 병합, 배포 33336853881 success)

**이 제품의 가장 큰 공백이 닫혔다.** 지금까지 후보 A/B/C 는 문자열 조립이었다.
- 이제 학습 정보 일곱 칸(S0/S1/U2/U3/X4/L5/R6) + 채널 규격을 프롬프트로 조립해
  실제 Anthropic Messages API 또는 Claude CLI 가 만든다.
- **세 후보는 제목·첫 전개·outline 이 모두 달라야 저장된다.**
- 워커 실측 후보 예: "자동화가 멈췄을 때, 여기 세 곳을 확인하세요" /
  "자동화 실행 기록에서 찾는 원인" / "자동화 실패, 체계적으로 진단하는 법"
- 영상 파생은 실제 대본과 3개 이상 장면을 만들고 `asset_url: pending:render` 유지
  (렌더링 미제공을 명시).

**실패를 템플릿으로 덮지 않는다(가장 중요한 계약)**:
자격증명·승인·quota·timeout·공급자 장애·계약 밖 JSON·사용량 장부 장애를
서로 다른 API 오류로 반환한다. 조용히 템플릿으로 넘어가는 production 경로가 없다.
회귀 테스트 `LLM-03` 이 검증한다.

**돈 안전장치**: `studioLlmAttempt` 를 **호출 전에** 만들고 성공/실패, member, provider,
model, attempt, input/cache/output/total token, USD 비용을 기록한다.
**장부를 못 만들면 LLM 을 호출하지 않는다.** 재시도 기본 2회 최대 3회, timeout 기본 90초.
같은 idempotency key 재요청은 LLM 호출 전에 기존 결과 반환.

**운영 설정(이름만)**: STUDIO_LLM_MODEL, STUDIO_LLM_FALLBACK_MODELS,
STUDIO_LLM_MAX_ATTEMPTS, STUDIO_LLM_TIMEOUT_MS, STUDIO_LLM_MAX_OUTPUT_TOKENS,
CLAUDE_CODE_OAUTH_TOKEN. 모델 기본값은 `studio-llm.defaults.json`.
**TypeScript 코드에 모델명을 박지 않았다.**

★컨트롤러 실측(배포 후 운영 컨테이너):
- `/api/health` 200
- `CLAUDE_CODE_OAUTH_TOKEN` 존재(1건)
- `claude --version` → **2.1.197 (Claude Code)**. `/usr/local/bin/claude` 심볼릭 링크 정상.
- ★단 `STUDIO_LLM_*` 환경변수는 운영에 **없다**(기본값 파일로 동작하는 설계).
- ★**운영 화면에서 생성 버튼을 눌러 본 것은 아직 아니다. 미검증.**
  live-verify-gate.sh 가 이제 이걸 안 하고 "쓰실 수 있다"고 하면 막는다.

## 회장 2차 피드백 대조 완료 (codex 2판)

- `docs/qa/2차피드백-학습정보와-생성실-대조-2026-08-30.md` (표 41행)
  학습 정보 8 + 생성실 11 = 19건 대조. 18건 수정.
  실제 LLM 과 완성 미디어는 그 판 범위 밖이라 미구현으로 명시(그건 llm 판이 했다).
  생성실은 규칙 기반 구성 초안과 준비 중인 완성 미디어를 화면에서 분리 표시.
- `docs/qa/2차피드백-편집실과-발행실-대조-2026-08-30.md` (표 21행)
  편집실 8 + 발행실 4 + 왕복 띠 제거. **왕복 띠는 세 번 지적받은 항목이다.**

## Meta App Review 제출 준비 완료

`docs/releases/meta-app-review-제출-준비-2026-08-31.md` (표 24행)
- 지금 `threads_basic` 오류는 앱 심사 전 + 계정이 Threads Tester 아님 + 초대 미수락.
- 외부 고객 클릭형 OAuth 연결은 **App Review + Advanced Access 승인 뒤** 가능.
- ★워커 경고: **9개 권한 전체 제출은 세 가지가 끝나기 전에는 하면 안 된다.**
  그 세 가지는 문서에 있다. 회장께 제출 안내하기 전에 컨트롤러가 읽고 확인할 것.

## 아직 안 끝난 codex 1판

`osmu-fullaudit0831` — 회장 세션 발화 R-S01~R-S16 전건 대조. 산출물 미생성.
★이게 회장 R-S16 지시의 핵심이다. 회수 시 발화 16건이 요구 단위로 쪼개져
 표에 다 있는지 컨트롤러가 센다.

## 검증 상태

- 전체 시험 **207 파일 1,556건 통과, 실패 0**(컨트롤러 직접 실행)
- TypeScript 0
- PR #40 CI pass 후 병합, 배포 success

## 남은 것

- **운영 화면에서 생성 버튼 실제로 눌러 확인**(최우선. 이걸 해야 "된다"고 말할 수 있다)
- 회장 세션 발화 전건 대조표 회수
- Meta 테스터 등록(회장) + 초대 수락
- 배포 스모크에 OAuth 왕복 완주 검사 추가
- 266건 대조표의 미충족 48 · 부분 60 처리

