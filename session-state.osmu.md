## 2026-08-29 21:15 KST Claude 세션 (osmu 라인) 돈/발행 조 회수

핸드오프 기준: 이 파일(session-state.osmu.md).

회수 완료: 돈/발행 MAJOR 7건 수리 (opus, 커밋 277252f7 ccead10b 외 4개)
- verify-agent-quality FAIL(Skill/WebSearch 0회). 코드 수리 판이라 벤치마크 축이
  적용되지 않는 경우로 판단하고 경고 라벨로 출고. 대신 컨트롤러가 직접 재검증했다.
- ★컨트롤러 직접 실행 증거 (워커 주장이 아니다):
  node scripts/verify-free-regeneration-rejection-gate.mjs 13/13 통과.
  거절 없는 재생성 409 CANDIDATES_NOT_REJECTED, 그때 태운 몫 0건,
  셋 다 거절 후에만 201, 둘째는 PAID_REGENERATION_APPROVAL_REQUIRED,
  복구 안내 2026-08-30T00:00:00.000Z, 하루에 나간 무료 몫 1건.
- 고친 7건: ①거절 장부 신설해 거절 확인과 몫 차감을 한 transaction ②복구 안내를
  협정시로 통일 ③모든 실발행이 예약 경유, 초안 없으면 멱등 키 요구 ④예약 임차 10분 +
  공급자 조회, 조회 실패는 uncertain 보존 ⑤uncertain 상태 신설해 멱등 인덱스 포함
  ⑥first_comment_status 독립 컬럼 ⑦shorts factory lease_token 울타리 + AbortController
  실제 취소 + 마감 CAS.
- 워커 판단 두 개가 옳다고 본다:
  ①시간대를 몫 키로 옮기지 않고 키는 협정시 유지, 안내만 맞췄다. 반대로 했으면
   시간대 우회가 다시 열린다.
  ②임차 회수 전에 공급자에게 먼저 묻는다. 만료만 보고 회수하면 그 회수가 곧 중복 게시다.
- 신설 검증 스크립트 3개. 전부 자기가 만든 것만 전용 회원·전용 키로 정리한다
  (리뷰가 지적한 "공유 원장 통째 DELETE" 를 반복하지 않았다).
  verify-free-regeneration-rejection-gate.mjs / verify-publish-intent-guard.mjs /
  verify-shorts-factory-fencing.mjs. 회귀 테스트 17건 추가.
- 지시 범위 초과 1건 보고받음: src/proxy.ts 한 줄. 새 거절 엔드포인트가 경로 허용목록에
  없어 401 이 나서 넣었다고 한다. 타당하다.
- 미검증: 실제 SNS 계정을 붙인 중복 게시 실측. 계정이 없어 못 했다.

★ 컨트롤러 직접 실행: npm run test → 1,467 통과 / 2 실패 / 1 skip.
  실패 2건 분석:
  ① tests/db/osmu-migration-runner.contract.test.ts
     배포 교착 해소 조가 지금 run-migrations.sh 를 고치는 중이라 계약 문구가 어긋난 것.
     그 조가 끝나면 다시 확인할 것.
  ② tests/brand/social-connect.test.ts 5초 timeout. 병렬 실행 부하 플레이키.
     단독 실행하면 통과한다고 워커가 보고. 컨트롤러가 단독 재확인은 아직 안 했다.

아직 도는 조:
- 배포 교착 해소 code-builder (opus). 커밋 46142b69 는 들어왔으나
  docs/releases/2026-08-29-배포-교착-해소-순서.md 는 아직 없다. 진행중이다.

막힌 것:
1. 배포. 교착 해소 대기. ★회장께 배포 버튼 더 누르지 마시라고 보고한 상태.
2. 상품명 확정 회장 대기. 추천 "OSMU 팩토리".
3. Supabase 인증 복귀 주소. 관리 토큰이 금고에 없다.
4. 교차 모델 리뷰 불가(codex 소진).

다음 액션:
1. 배포 교착 해소 조 회수 → 순서 문서 확인 → 회장에게 제시.
2. 회수 직후 npm run test 다시 돌려 migration-runner 계약 테스트 해소 확인.
3. social-connect 테스트 단독 실행해 플레이키인지 컨트롤러가 직접 확인.
4. 상품명 정해지면 문구 반영 판(haiku).
5. 영상 모델 "무엇으로 만들었는지 보이기" 개발 판.
6. 전체 재검증 E2E(sonnet) + 교차 리뷰(opus).

