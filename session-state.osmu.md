## 2026-08-30 06:20 KST Claude 세션 (osmu 라인) VM 정리, 파이프라인 재개

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ VM 컨테이너 정리 실행함. 12개 → 6개.
- 제거: openclaw-gateway-tenant1(이미 exited, compose profiles 로 제외된 legacy),
  openclaw-dashboard-osmu-pre-29819971912, openclaw-dashboard-osmu-pre-cf0be864(5주된 배포 찌꺼기),
  openclaw-gateway-tenant2/3/4(정지 후 제거. 4주 unhealthy, 마지막 로그 7-31, openai 인증 오류).
- docker image prune 770.3MB 회수. builder prune 실행.
- ★남은 것: openclaw-dashboard-osmu(운영), openclaw-autoheal(워치독),
  openclaw-dashboard-tenant1~4.
- ★tenant 대시보드 넷은 **정지 명령이 권한 정책에 막혀 못 껐다.** 데이터 디렉터리가
  전부 비어 있고 7월 5일 이후 손댄 적이 없어 실체가 없다고 판단했다.
  회장 승인 또는 Bash 권한 규칙 추가가 필요하다. 명령:
    docker stop openclaw-dashboard-tenant1 openclaw-dashboard-tenant2 openclaw-dashboard-tenant3 openclaw-dashboard-tenant4
  ★remove 가 아니라 stop 을 먼저 하는 이유: cloudflared 라우팅이 34561~34564 로
   갈 수도 있어 되돌릴 수 있게 둔다. 며칠 지켜보고 문제 없으면 rm.

★ VM 접속 방법 (다음 세션이 그대로 쓸 것):
  헬퍼 /tmp/mvm.sh (일반), /tmp/mvm-sudo.sh (sudo). 세션 종료 시 사라지니 재작성 필요.
  경로: zero-one-onprem.env 의 PVE_JUMP_* 로 점프 → proxmox-vms.env 의 MARKETING_* 로 접속.
  marketing VM 은 사설망이라 점프 없이 못 간다. sshpass 설치돼 있음.
  ★docker stop/rm 중 일부는 클래식파이어가 막는다. 게이트웨이는 통과, 대시보드는 차단됐다.

★ 운영 배포 완료 상태 유지. Deploy 33277724271 success,
  expand-member 33294554245 success. 실측 login 200 / health 200 / 무인증 me 401.
  ★배포 시 services=openclaw-dashboard-osmu 로 좁힐 것(비우면 메모리 부족으로 죽는다).
  ★expand-guard 는 운영 Supabase 권한으로 영구 불가. 누르지 말 것.

★ 파이프라인 재개. 두 조 발주함:
- OSMU 파생 생성 (opus, a7c5c5bb): 주 갈래 확정 시 고른 다른 갈래로 실제 파생.
  회장 승인된 질문2 추천안 구현. 만지는 파일 lib/studio/generation 과 생성 API.
  ★못 박은 것: 파생 과금이 조용히 나가지 않게, 무료 몫을 갉아먹지 않게,
   일부 실패를 전체 성공으로 세지 않게, 파생물이 편집실에 각각 들어가게.
- 390 폭과 다크 모드 (sonnet, ae20e4d4): 네 방 x 두 모드 여덟 장 캡처,
  가로 넘침 0px, 깨진 것 수정, 재발 검사 신설.
  ★프롬프트에 doc-review.md Read 필수를 명시했다(앞 판이 그것 때문에 반려됐다).

남은 것:
- 30건 대조표 재실행(마지막 판정은 08-29 자다. 그 뒤 여섯 조가 고쳤다).
- 실제 발행 경로. 채널 0곳이라 미검증. 회장이 하나 연결하면 닫힌다.
- 고위험 코드 크로스모델 리뷰. codex 한도 초과, 9월 4일 복구.
- tenant 대시보드 넷 정리(위 권한 문제).

다음 액션:
1. 두 조 회수 → verify → push 된 것 병합.
2. 30건 대조표 재실행.
3. 회장 2차 실사용 피드백 접수.

