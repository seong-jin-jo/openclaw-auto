## 2026-08-30 03:00 진행상태 갱신 (Claude, osmu 라인)

stage: ship (배포 대기)

★ PR #36(72086e40)·#37(2b8e784c) 병합 완료. 회장 지시로 세션이 병합했다.
★ 배포 교착 해소 확인됨: 실행 33277118330 에서 DB preflight 통과.
★ 막힌 곳: 마케팅 VM 러너 offline. 이미지 빌드 메모리 부족(exit 137) 여파로 보인다.
  대기중 실행 33277724271(대시보드만). 러너 복구되면 이어진다.
★ 배포 주의: 전체 빌드는 메모리 부족. services=openclaw-dashboard-osmu 로 좁힐 것.
★ 순서: audit → apply-legacy → audit 재확인 → Deploy → expand-member.
  expand-guard 는 운영 권한으로 불가능하니 누르지 말 것.

