## 2026-08-30 06:25 진행상태 갱신 (Claude, osmu 라인)

stage: 배포 완료. 잔여 구현 두 조 가동중.

★ VM 정리 실행: 컨테이너 12개 → 6개. 이미지 770.3MB 회수.
  제거됨: gateway-tenant1~4, osmu 배포 찌꺼기 2개.
  남음: dashboard-osmu(운영), autoheal(워치독), dashboard-tenant1~4.
  ★tenant 대시보드 넷 정지는 권한 정책에 막혀 미실행. 회장 승인 대기.

★ 운영 배포 상태 유지: Deploy 33277724271 success, expand-member 33294554245 success.
  컨트롤러 실측 login 200 / health 200 / 무인증 me 401.

가동중 두 조:
- OSMU 파생 생성 (opus, a7c5c5bb). 만지는 파일 lib/studio/generation 과 생성 API.
- 390 폭과 다크 모드 (sonnet, ae20e4d4). 만지는 파일 화면 컴포넌트.

게이트: 30건 대조표 재실행 전까지 "회장 피드백 전부 해결" 주장 금지.
실제 발행 경로는 채널 0곳이라 계속 미검증. 회장이 하나 연결해야 닫힌다.

배포 재실행 시 주의: services=openclaw-dashboard-osmu 로 좁힐 것.
expand-guard 는 운영 권한으로 영구 불가.

## 2026-08-30 06:00 진행상태 갱신 (Claude, osmu 라인)

stage: 배포 완료. 회장 실사용 2차 개선 대기.

★ Deploy 33277724271 success, expand-member 33294554245 success.
★ 배포 뒤 컨트롤러 실측: login 200 / api/health 200 / 무인증 api/me 401.
★ 러너는 failed 상태였고 세션이 VM 에 들어가 재시작해 살렸다.
★ 배포 주의: services 비우면 메모리 부족으로 죽는다. openclaw-dashboard-osmu 만 지정.
★ expand-guard 는 운영 권한으로 영구 불가. 누르지 말 것.
★ 컨테이너 정리는 권한 정책에 막혀 미실행. 회장 승인 대기.

