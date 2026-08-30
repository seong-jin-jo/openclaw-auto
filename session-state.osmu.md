## 2026-08-31 04:50 KST Claude 세션 (osmu 라인) ADR 미독이 근본 원인. codex 4판 가동.

핸드오프 기준: 이 파일(session-state.osmu.md).
★★ 이 항목 위의 모든 "완료" 는 배포 환경 실동작으로 확인된 것이 아니다. 그대로 믿지 마라.

## ★★★ 근본 원인 확정: 이미 결정된 ADR 을 안 읽고 그 위에 개발했다

`wiki/거버넌스/결정.md` **ADR-004** 에 이미 적혀 있었다:
- 개발 모드(현재): 계정을 앱에 테스터 초대 + 수락. 50명 한계.
- 상품화: **App Review 1회** 통과 → 누구나 OAuth 연결. **테스터 등록·콘솔 작업 0.**
- 상품화 마일스톤 = App Review 준비(privacy policy URL + 데모 영상 + 검수 제출).
- ★**"Meta 콘솔 자동 운전 금지."** 2026-07-01 콘솔 자동 조작으로 개발자 계정 플래그 실사고.

⇒ 회장이 "클릭클릭하다 API 발급? 돌았어?" 라고 한 요구는 **이미 ADR 로 확정돼 있었고**
  전제 조건이 App Review 라는 것도 적혀 있었다. **아무도 실행하지 않았을 뿐이다.**

**왜 안 읽었나**: ①거버넌스를 읽는 절차가 실행 순서에 없었다. session-state 와 최신 QA 문서부터 봤다.
②위임 프롬프트에 ADR 을 근거로 안 넣었다. ③"막힌 것을 뚫는다"에만 집중하고 상위 결정을 안 봤다.

**재발 방지(절차로 박음. 결정 원장에도 기록)**:
- **모든 build 위임 프롬프트 Read 목록 1번 = 관련 ADR. 요청 원문보다 위다.**
- 컨트롤러도 새 갈래를 열 때 거버넌스 세 원장을 먼저 읽는다. session-state 는 그 다음.
- "막혔다"를 코드 문제로 단정하기 전에 결정 원장을 검색한다.
  ★이번 건은 `grep "App Review" wiki/거버넌스/결정.md` 한 번이면 나왔다.

## 계정 연결 실패 원인 확정 (로깅 수정이 값을 했다)

운영 로그 실측:
```
[connect-callback][exchange-fail] threads 장기 토큰 교환 실패 (HTTP 400):
This action requires the threads_basic permission. You must submit for app review,
or your user must be in the list of Threads testers.
```
⇒ **코드 결함 아님. 앱이 심사 전이라 테스터 등록 계정만 연결된다.**
⇒ 앱 자격증명 유효, 요청 형식도 공식 규격과 일치(워커가 Meta 직접 호출로 확인).
⇒ Meta 앱 번호 905965605850465. 회장 계정 j.the.great.investor 테스터 등록 필요.
  ★등록 후 **회장 계정에서 초대 수락**해야 적용된다. 이게 빠지면 같은 오류 반복.
⇒ ★세션은 Meta 콘솔을 조작하지 않는다(ADR-004 금지 + 실사고).

## Supabase Redirect URL 이 빈칸이었던 이유

배포 스모크가 `/api/auth/google` 200 과 authUrl 반환까지만 본다.
**authUrl 은 우리 서버가 만드는 문자열이라 Supabase 설정과 무관하게 정상으로 나온다.**
즉 스모크 통과가 로그인 완주를 전혀 보장하지 않았다. OAuth 는 브라우저가 밖으로 나갔다
돌아오는 흐름인데 우리 검증은 전부 서버 관점이었다.
설정값(회장께 안내함):
```
https://<운영주소>/login
https://<운영주소>/login?**
```
재발 방지: 배포 스모크에 OAuth 왕복 완주 검사 추가. 그리고
**외부 콘솔 의존 항목 목록**을 만든다(Supabase Redirect URL, Meta 테스터, 채널별 redirect URI).

## 가동중 codex 4판 (전부 항목 번호 붙여 표로 대조 보고하게 함)

| 세션 | 담당 | 산출물 |
|---|---|---|
| osmu-llm0831 | **실제 LLM 연동**(회장 "지금 당장 붙여야지") | docs/qa/생성-LLM-연동-2026-08-31.md |
| osmu-gen0830 | 학습 정보 8건 + 생성실 11건 | docs/qa/2차피드백-학습정보와-생성실-대조-2026-08-30.md |
| osmu-edit0830 | 편집실 8건 + 발행실 4건 + 왕복 띠 제거 | docs/qa/2차피드백-편집실과-발행실-대조-2026-08-30.md |
| osmu-appreview0831 | **Meta App Review 제출 준비** | docs/releases/meta-app-review-제출-준비-2026-08-31.md |

★회수 시 **표의 행 수가 발주한 항목 수와 같은지 컨트롤러가 센다. 모자라면 반려.**
★LLM 판에 못 박은 것: 실패 시 템플릿으로 조용히 대체 금지. 화면에 왜 안 되는지 말할 것.
 무료 몫 계약 유지, 호출 횟수·토큰 기록, 타임아웃·재시도 상한, 모델명 설정으로 분리.
★App Review 판에 못 박은 것: Meta 콘솔 조작 금지. 제출물 제작까지만.

## 거버넌스 기록 완료 (회장 확인 요구)

- `wiki/거버넌스/요청.md`: 2026-08-31 지시 원문 + 처리 결과
- `wiki/거버넌스/결정.md`: LLM 즉시 연동 / 용어 사전 중단 / 항목별 대조 강제 /
  App Review 즉시 착수 / 거버넌스를 위임 1번에
- `wiki/거버넌스/실수.md`: ADR 미독 근본 원인 / 완료 판정 위반 / 비표준 용어 반복 /
  원인 2·3·4 조치 결과 / Redirect URL 미확인 이유
- `wiki/거버넌스/요청-원문/2026-08-30-회장-2차-실사용-피드백.md`: verbatim 박제
- ★`wiki/거버넌스/회고/` 는 아직 비어 있다. 스프린트 종료 시 작성할 것.
- 평가 적립: eval-log.sh 로 osmu-controller neg 1점 기록(2026-08-31).

## 남은 것

- 배포 스모크에 OAuth 왕복 완주 검사 추가(미착수)
- 외부 콘솔 의존 항목 목록 신설(미착수)
- 스프린트 회고 작성(미착수)
- 배포 환경에서 컨트롤러가 직접 로그인부터 발행까지 통과(미착수)
  ★이걸 하기 전에 회장께 "써 보시라" 금지. 이번 사고의 재발 방지 조건.
- 266건 대조표의 미충족 48 · 부분 60 처리

## VM 접속 헬퍼 (세션 종료 시 사라짐. 재작성)

```
cat > /tmp/mvm.sh <<'EOF'
#!/bin/bash
set -a; . ~/.sj-agent-harness/secrets/zero-one-onprem.env; . ~/.sj-agent-harness/secrets/proxmox-vms.env; set +a
sshpass -p "$PVE_JUMP_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$PVE_JUMP_USER@$PVE_JUMP_HOST" \
  "sshpass -p '$MARKETING_PASS' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=12 $MARKETING_USER@$MARKETING_HOST \"$1\"" 2>&1
EOF
chmod +x /tmp/mvm.sh
```
★codex-in-pane.sh 는 프롬프트를 **파일 경로**로 받는다. 문자열 직접 전달은 죽는다.

