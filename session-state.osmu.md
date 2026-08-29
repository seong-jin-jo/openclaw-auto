## 2026-08-29 21:25 KST Claude 세션 (osmu 라인) 배포 교착 해소, PR #36 올림

핸드오프 기준: 이 파일(session-state.osmu.md).

★★ 배포 교착 해소됨. PR #36 회장 머지 대기.
   https://github.com/seong-jin-jo/openclaw-auto/pull/36
   origin/main 대비 59커밋.

회수 완료: 배포 교착 해소 (opus, 커밋 46142b69 4b2ee6ca 4f76ca11)
- verify-agent-quality FAIL(Skill/WebSearch 0회). 코드 수리 판이라 벤치마크 축이
  적용되지 않는 경우로 판단하고 경고 라벨로 출고. 컨트롤러가 전체 테스트로 재검증했다.
- 근본 원인이 보고보다 한 겹 더 있었다: expand-guard 는 컨테이너 표식을 요구하지 않아
  우회로가 되어야 하는데, 배포를 막던 그 검사(run-migrations.sh:123)가 그 단계까지
  똑같이 막고 있었다. 뿌리는 하나였고 배포 워크플로에 예외를 뚫지 않고 검사를 바로잡았다.
- 게이트를 느슨하게 하지 않았다. 대칭성 요구를 지원 상태 집합으로 바꾸는 대신
  필수 표 21개 존재, RLS ENABLE·FORCE·tenant_iso 정책, osmu_service 우회 여부를 추가했다
  (리뷰 :433 지적 해소). fail-closed 실측도 했다.
- ★잠복 결함 발견: expand-member 는 표식이 붙었어도 항상 실패했을 것이다.
  색인 정합 검사가 int2vector 를 smallint[] 로 캐스팅해 배열 시작 번호가 0이 되어
  1-based ARRAY 와 영원히 불일치했다. verify-rollback-indexes.sql 방식으로 통일.
- 워커 실행 검증: 운영 상태 재현 → 옛 코드로 교착 재현 → 새 코드로 expand-guard →
  preflight 통과 → expand-member → S2|S2. 매트릭스 17개 사례 전량 PASS.

★ 컨트롤러 직접 실행: npm run test → 199 파일 1,474 통과 실패 0.
  앞 턴의 실패 2건(migration-runner 계약, social-connect timeout) 둘 다 해소됐다.

★★ 회장이 누를 순서 (문서 docs/releases/2026-08-29-배포-교착-해소-순서.md, 렌더해 띄웠다):
   0. PR #36 머지 (먼저다)
   1. OSMU approved DB migration, phase=audit (읽기 전용 관측)
   2. OSMU approved DB migration, phase=expand-guard (표식 불요, 교착 해소 지점)
   3. Deploy openclaw (marketing VM), services 비움 (이 배포가 표식을 붙인다)
   4. OSMU approved DB migration, phase=expand-member (S2|S2 로 마감)
   ※ 1단계에서 확인할 것: 중복 0, RLS 전부 ok, 장부에 20260829_010 applied 여부.
     없으면 expand-fk 가 한 단계 추가된다.

이번 세션 완료 목록:
- 로그인 실패 원인 규명(코드 정상, 설정 누락 유력)
- 회장 실사용 피드백 화면 고장 10건 수리
- 돈/외부 부작용 MAJOR 7건 수리 (컨트롤러가 스크립트 13/13 직접 확인)
- 죽은 간격 유틸리티 전수조사 (전역 문제 아님으로 정정, 회귀 가드 추가)
- 제품 이름 후보 조사 (추천 OSMU 팩토리, marketify 기각)
- 배포 교착 해소
- 하네스 §5.5 신설 (선택지는 추천안 자동 채택)
- codex 감독 정지 및 거짓 완료 기록 정정

막힌 것:
1. PR #36 머지와 4단계 실행. 회장 몫. 세션은 배포·머지를 실행하지 않는다.
2. 상품명 확정 회장 대기. 추천 "OSMU 팩토리".
3. Supabase 인증 복귀 주소 허용목록. 관리 토큰이 금고에 없다.
4. 교차 모델 리뷰 불가(codex 소진). 이번 돈·교착 수리는 고위험이라 codex 복귀 시 재리뷰 권장.
5. 실제 채널 계정 붙인 중복 게시 실측 미검증. 회장 로그인 필요.

다음 액션:
1. 회장이 4단계를 밟으면 각 단계 결과를 gh 로 실측하고 배포 환경에서 네 방을 직접 확인.
2. 상품명 정해지면 문구 반영 판(haiku).
3. 영상 모델 "무엇으로 만들었는지 보이기" 개발 판(sonnet).
4. 구조 질문 6건 추천안을 개발 판으로 발주(회장이 전부 추천대로 승인함).
5. 전체 재검증 E2E(sonnet).

