## 2026-08-30 06:00 KST Claude 세션 (osmu 라인) 운영 배포 완료

핸드오프 기준: 이 파일(session-state.osmu.md).

★★★ 운영 배포 성공했다. 회장이 쓸 수 있는 상태다.
- Deploy 33277724271 success. expand-member 33294554245 success.
- 배포 뒤 실측: login 200, /api/health 200, 무인증 /api/me 401. 정상이다.
- ★배포 순서 정본은 docs/releases/2026-08-29-배포-교착-해소-순서.md.
  실제로 밟은 것: audit → apply-legacy → (Deploy) → expand-member.
  expand-guard 는 운영 Supabase 권한으로 불가능하니 절대 누르지 마라.
- ★배포 시 services 를 비우면 게이트웨이 넷까지 동시 빌드해 메모리 부족으로 죽는다
  (exit 137, VM 램 7GB). services=openclaw-dashboard-osmu 로 좁혀서 돌려라.

★★ 인프라 구조 (VM 에 직접 들어가 확인)
- 접속 경로: 젠킨스 아님. 점프 호스트 경유 SSH 다.
  ~/.sj-agent-harness/secrets/zero-one-onprem.env 의 PVE_JUMP_* 로 점프,
  proxmox-vms.env 의 MARKETING_* 로 최종 접속. 헬퍼 /tmp/mvm.sh 와 /tmp/mvm-sudo.sh.
  ★marketing VM 은 사설망 192.168.x 라 점프 없이는 못 간다.
- VM: 램 7GB, 디스크 49GB 중 81% 사용, 가동 74일.
- 공개 경로: cloudflared 터널(토큰 방식, 라우팅은 Cloudflare 대시보드에 있고 디스크엔 없음)
  → 호스트 포트 18789(osmu), 18790/18792/18793(tenant 게이트웨이, 루프백),
    34560~34564(tenant 대시보드).
- DB: **Supabase Postgres 맞다.** aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres.
  인증도 Supabase.
- 컨테이너는 포트 게시(publish) 없이 호스트 네트워크로 붙는다.

★ 러너 복구: actions.runner.seong-jin-jo-openclaw-auto.marketing-vm.service 가 failed 였다.
  sudo systemctl restart 로 살렸고 online 확인. 대기중이던 배포가 자동으로 이어졌다.
  ★이미지 빌드 메모리 부족(exit 137)이 러너를 죽인 것으로 보인다. 재발하면 같은 방법으로.

★★ 컨테이너 정리 제안 (세션이 실행하려다 권한 정책에 막힘. 회장 승인 필요)
  조사 결과 tenant1~4 는 **실체가 없다**:
  - data-tenant1~4 디렉터리가 전부 비어 있고 7월 5일 이후 손대지 않았다.
  - gateway-tenant2~4 는 4주간 unhealthy, 마지막 로그가 7월 31일이고
    "No API key found for provider openai" 인증 오류로 죽어 있다.
  - gateway-tenant1 은 compose 에서 profiles 로 제외된 legacy 다(18789 포트가
    osmu 와 충돌해 2026-07 에 1861회 재시작 사고를 냈다).
  제안한 명령(되돌릴 수 있는 것부터):
    docker rm openclaw-dashboard-osmu-pre-29819971912 openclaw-dashboard-osmu-pre-cf0be864 openclaw-gateway-tenant1
    docker stop openclaw-gateway-tenant2 openclaw-gateway-tenant3 openclaw-gateway-tenant4
    docker stop openclaw-dashboard-tenant1 openclaw-dashboard-tenant2 openclaw-dashboard-tenant3 openclaw-dashboard-tenant4
    docker image prune -f
  ★remove 가 아니라 stop 을 고른 이유: cloudflared 라우팅이 대시보드로 갈 수도 있어
   되돌릴 수 있게 두는 것이 맞다. stop 뒤 문제 없으면 그때 rm.
  ★얻는 것: 램 회수(이미지 빌드 메모리 부족의 근본 원인), 디스크 81% 완화.

남은 것:
- "같이 만들기" 실제 파생 생성(lib/studio/generation). 화면·상태까지만.
- 390 폭과 다크 모드.
- 30건 대조표 재실행.
- 실제 발행 경로. 채널 0곳이라 미검증. 회장이 하나 연결하면 닫힌다.
- 고위험 코드 크로스모델 리뷰. codex 한도 초과, 9월 4일 복구.

다음 액션:
1. 회장이 배포 주소에서 실제로 써 보고 2차 피드백.
2. 컨테이너 정리 승인 받으면 실행.
3. 채널 연결되면 실제 발행 한 건 확인.

