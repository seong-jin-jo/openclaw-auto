## 2026-08-30 22:10 KST Claude 세션 (osmu 라인) 계정 연결 실패 지점 특정

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ 회장 지시 정정 두 가지:
1. **표준 IT 용어 사전은 만들지 마라.** 회장이 불필요하다고 명시했다.
   "내가 되게끔 해놓고 QA 자세히 들어가라고 했지 확인도 안하고 대충 만들어 올리라고 했냐."
   ⇒ 문제의 해법은 사전이 아니라 **실제로 되게 만들고 QA 를 제대로 하는 것**이다.
   ★단 보고와 문서에서 표준 IT 용어를 쓰는 것은 계속 지켜라
    (container, environment variable, OAuth redirect URI, CI/CD runner 그대로).
    억지 한국어 번역이 문제였지 용어 자체가 문제가 아니었다.
2. **"내가 한 요청들 하나씩 대조하고 항목별로 결과 보고 하게 시켜."** ⇒ 대조 조 발주함.

★★★ 계정 연결 실패 지점 특정됨. 컨트롤러가 운영 컨테이너 로그를 직접 읽었다.

```
[connect-callback][exchange-fail] threads threads 장기 토큰 교환 실패
```

그리고 이것이 수십 번 반복:
```
osmu_alert token_expired severity:error
  workspaceId: badd844f-9106-4992-ad10-41a234fceb35
  context: {provider: instagram, reason: token_revoked}
  context: {provider: threads,   reason: token_revoked}
osmu_alert publish_failed severity:warning
  resourceKey: account:04db6842-39aa-46c4-b60d-7b096847aefb (instagram)
  resourceKey: account:1ff8d851-426b-4829-9461-c97c75a0895a (threads)
  context: {reason: "unknown"}
```

**이 로그에서 읽히는 것:**
- workspace badd844f... 가 실재하고 활동 중이다. **회장이 로그인에 성공한 적이 있다.**
  ★"로그인이 안 된다"와 "연결이 안 된다"를 섞어 보지 마라. 로그로 갈라야 한다.
- OAuth callback 은 돌아오는데 **long-lived token 교환에서 실패**한다. 그게 exchange-fail 이다.
- 교환 실패 후에도 **계정 레코드가 남아** 매번 token_revoked 로 떨어진다.
  ⇒ 실패한 연결이 레코드를 남기는 것 자체가 결함일 수 있다.
    연결된 것처럼 보이는데 쓰면 죽는 상태다.
- publish_failed 의 reason 이 "unknown" 이다. **실패 사유를 우리가 기록조차 못 하고 있다.**

★운영 공개 주소: 컨테이너 환경변수 OSMU_PUBLIC_URL 에 있다.
 (서비스 중립 레포라 여기 적지 않는다. VM 에서 꺼내 쓸 것)
 컨트롤러 실측: GET /login 200, GET /api/auth/google 200 (authUrl 정상,
 redirect_to 가 운영 주소 /login, prompt=select_account 포함),
 GET /api/connect/readiness 401(비인증이라 정상).
 ⇒ **로그인 시작 지점까지는 서버가 정상 응답한다. 실패는 그 뒤다.**

가동중 두 조:
- 로그인·계정연결 실패 원인 규명과 수정 (opus, acd16630).
  위 로그를 추가 지시로 전달함. 산출물
  docs/qa/로그인과-계정연결-실패-원인-2026-08-30.md
  ★생성 경로가 실제 LLM 을 부르는지도 코드로 확정하라고 지시함
   (화면에 "실제 미디어 생성은 준비 중입니다" 문구가 있다).
- 회장 요청 전항목 대조 (opus, abaafdf8). 산출물
  docs/qa/회장-요청-전항목-대조표-2026-08-30.md
  ★대조 대상 넷: 확정 요구사항 대장, 1차 실사용 피드백,
   2차 실사용 피드백(이 파일 21:30 항목의 UX 지적 29건), 앞선 30건 대조표 재판정.
  ★"확인불가" 등급을 반드시 쓰게 했다. 로그인·연결이 막혀 확인 자체가 불가능한 것을
   "충족"으로 밀어 넣지 않게 하기 위해서다.

★VM 접속 헬퍼는 세션 종료 시 사라진다. 재작성:
```
cat > /tmp/mvm.sh <<'EOF'
#!/bin/bash
set -a; . ~/.sj-agent-harness/secrets/zero-one-onprem.env; . ~/.sj-agent-harness/secrets/proxmox-vms.env; set +a
sshpass -p "$PVE_JUMP_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$PVE_JUMP_USER@$PVE_JUMP_HOST" \
  "sshpass -p '$MARKETING_PASS' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=12 $MARKETING_USER@$MARKETING_HOST \"$1\"" 2>&1
EOF
chmod +x /tmp/mvm.sh
```
★이중 SSH 라 셸 확장에 주의. 파이프와 별표가 먹으면 따옴표 친 heredoc 을 써라.

다음 액션:
1. 두 조 회수 → verify → 로그인·연결 수정 배포.
2. 배포 후 **컨트롤러가 직접 로그인부터 발행까지 밟는다.** 이걸 하기 전에
   회장께 "써 보시라"고 하지 마라. 이번 사고의 재발 방지 조건이다.
3. 대조표로 미충족 항목 우선순위 잡고 순차 처리.

