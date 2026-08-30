## 2026-08-30 20:40 KST Claude 세션 (osmu 라인) VM 완전 정리, 인프라 보고서 제출

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ VM 정리 완료. 컨테이너 12개 → **2개**. 디스크 81% → **36%**.
- 회장 승인으로 tenant 대시보드 넷도 정지 후 제거했다.
- docker image prune -af, builder prune -af, volume prune -f 실행.
  이미지 2.5GB + 볼륨 6.6GB 회수.
- ★볼륨 prune 전에 osmu 볼륨이 dangling 목록에 없음을 먼저 확인했다(0건).
  남은 볼륨은 openclaw-osmu-config 와 openclaw-osmu-data 둘뿐이다.
- 정리 후 앱 실측: /api/health {"ok":true,"db":"up","ms":9}, login 200.

★★ 찌꺼기 재발 방지 두 겹 설치:
1. 배포 워크플로에 정리 단계 추가(커밋 3dc8af80). if: always() 라 배포 성패와 무관.
   168시간보다 오래된 이미지·빌드캐시·컨테이너만 지운다.
2. VM 크론에 주간 정리 등록: `17 4 * * 0 /home/marketing/osmu-docker-gc.sh`
   로그는 ~/osmu-docker-gc.log 에 쌓이되 뒤 500줄만 남긴다.
   ★크론 등록 시 이중 SSH 를 거치면 별표가 셸에 먹힌다. 따옴표 친 heredoc 을 써야 한다.

★★ 회장 보고서 제출: docs/rendered/osmu-인프라와-1차개선-2026-08-30.html (커밋 d8698401)
- 인프라 구조 + 1차 개선 보고를 한 장에. 브라우저로 열어 회장께 띄웠다.
- verify FAIL(Skill/WebSearch 0회). 우리 인프라 실사 정리라 벤치마크 축이 아니라고 보고
  경고 라벨로 출고. 사실은 전부 컨트롤러가 VM 에서 직접 관측해 워커에게 준 것이다.

★★ R2 관련 중대 사실 (회장 판단 필요):
  **운영 컨테이너에 R2 설정이 0개다.** 코드에는 경로가 셋 있다
  (extensions/image-upload, extensions/instagram-publish, api/r2-config).
  즉 코드는 준비됐는데 운영에 안 붙어 있다.
  ⇒ 영상 원본 내려받기와 실물 미리보기가 온전히 성립하려면 이게 먼저 정해져야 한다.

★ 인프라 요약 (다음 세션이 다시 조사하지 않게):
- 마케팅 VM 한 대. 메모리 7GB, 디스크 49GB. GitHub Actions self-hosted 러너가 여기서 돈다.
- cloudflared 터널(토큰 방식, 라우팅은 Cloudflare 대시보드) → 호스트 18789.
- 컨테이너 둘: openclaw-dashboard-osmu(운영 앱, Next.js 라 화면+서버 겸함),
  openclaw-autoheal(감시자, healthcheck 비정상 시 재시작. 100% CPU 멎음엔 무력).
- DB 와 로그인 전부 Supabase. 서울 리전 풀러.
  ★Supabase 주소와 공개 키는 이미지 빌드 시점에 코드에 박힌다. 값만 바꾸면 반영 안 된다.
- VM 크론 셋: 상태감시 1분, 예약발행 10분, 도커 정리 주간.
- 워크플로 넷: CI(자동), Deploy(수동), DB 마이그레이션(수동), Health Monitor(정기).

★ 배포 시 반드시:
1. services=openclaw-dashboard-osmu 로 좁힐 것. 비우면 메모리 부족으로 죽는다.
2. expand-guard 는 운영 Supabase 권한으로 영구 불가.
   순서 audit → apply-legacy → Deploy → expand-member.

남은 것:
- 30건 대조표 재실행(마지막 판정 08-29. 그 뒤 여덟 조가 고쳤다).
- 실제 발행 경로. 채널 0곳이라 미검증. 회장이 하나 연결해야 닫힌다.
- R2 연결 여부 회장 판단.
- 편집실 파생물 갈래 구분 표시.
- 고위험 코드 크로스모델 리뷰. codex 한도 초과, 9월 4일 복구.

다음 액션:
1. 회장 2차 실사용 피드백 접수.
2. 30건 대조표 재실행.
3. 채널 연결되면 실제 발행 한 건 확인.

