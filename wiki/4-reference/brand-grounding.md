# Brand Grounding — 셀프서브 콘텐츠 그라운딩

마케팅 콘텐츠가 각 테넌트의 브랜드 톤·사실에 근거해 생성되게 하는 구조. 담당자(고객)가 셀프서브로
온보딩한다 — 가입 → 자기 Anthropic 키·GitHub PAT 등록 → 위키 연결/브랜드 입력 → 생성.

## 단일 store + 소스 어댑터 (drift 방지)
생성기는 `brand_guides`(톤)·`wiki_docs`(사실)만 읽는다(인입↔생성 분리). 인입 어댑터:
- **wizard** — `BrandSetupWizard`(6문항) → `/api/studio/brand-setup`.
- **repo** — `RepoConnect`(위키 폴더/파일) → `/api/brand/sync-wiki`·`/api/brand/sync-repo`(GitHub fetch).
- **paste** — 직접 붙여넣기.
`brand_guides.source` = `wizard | repo | paste`. 검색·주입은 `lib/wiki-retrieve`(pg_trgm) + `studio/text`.

## 생성/증류 백엔드 = 하이브리드 (2026-06-26 결정)
`lib/anthropic.ts` `generateText(prompt, tenantId)` 단일 경로:
- 테넌트가 자기 **Anthropic 키**(`integrations kind='anthropic'`)를 등록 → 그 키로 API 호출(고객 과금·격리).
- 미등록 → **`claude -p`(운영자 Max 구독) 폴백**(내부 4앱은 이 경로로 공짜 운영).
→ 내부 4앱은 지금 claude -p, 고객은 점진적으로 자기 키. 한 코드 경로가 두 모드를 동시에 커버.

### A1 (2026-06-26) — 증류 3라우트 generateText 통일
과거 `brand-setup`·`sync-wiki`·`sync-repo`가 **`claude -p` 하드코딩**이라, 고객이 Anthropic 키만
등록하면 텍스트 생성은 되는데 **브랜드 증류·위키 sync는 502**(서버에 claude CLI 없음)였다.
3라우트를 `generateText(prompt, tenantId)`로 통일 → 셀프서브가 고객 키만으로 끝까지 동작.
회귀 방지: `tests/brand/distill-backend.contract.test.ts`(claude -p 재등장 차단) + `brand-setup.test.ts`.

### GitHub repo 어댑터 오류 계약 (2026-07-30)

- `RepoConnect`는 non-2xx의 서버 `error`를 danger 배너로 표시하고, 네트워크 예외는 별도 한국어
  안내로 구분한다. 성공/실패 색은 메시지 문자열이 아니라 `ok | error` 상태와
  `text-success | text-danger` 시맨틱 토큰으로 결정한다.
- 브랜치를 비우면 GitHub Repositories API의 `default_branch`를 사용한다. 메타데이터 조회 실패 시에만
  `main` → `master` 순서로 시도하며, `feature/x` 같은 slash ref는 Trees path에서 slash를 보존한다.
- Trees 200 결과는 `폴더 밖에는 .md가 있음`과 `레포 전체에 .md가 없음`을 구분한다. 404는 저장 토큰
  유무와 레포 메타데이터 결과에 따라 레포/브랜치 또는 private 권한 조치로 안내한다. GitHub의 private
  리소스 인증 실패도 404가 될 수 있으므로, PAT에는 대상 레포와 `Contents: read`가 필요하다.
- `OSMU_SECRET_KEY` 미설정과 저장 PAT 복호화 실패는 일반 404로 숨기지 않는다. 복호화 로그에는 토큰
  원문을 남기지 않으며 사용자는 관리자에게 키 설정 또는 PAT 재저장을 요청하게 한다.
- GitHub Wiki clone(`repo.wiki.git`)은 REST Trees 대상이 아니므로 지원하지 않는다. 문서는 일반 레포의
  `.md` 폴더로 옮겨야 한다.
- `sync-wiki`, `studio/text`, `sourcing`의 GitHub 파일 읽기는 모두 Contents API +
  `Authorization: Bearer`로 통일한다.

## 셀프서브 전제조건 (플랫폼 = 운영자)
- DB: 스키마 + RLS(`osmu_service`) + **pg_trgm** 확장 적용(`wiki-retrieve`가 word_similarity 사용).
- `OSMU_SECRET_KEY`: 고객 토큰(Anthropic 키·GitHub PAT) pgp 암호화 — **없으면 토큰 등록부터 실패**.
- Supabase Auth: Email confirm/redirect 설정(가입 정상화).
- `claude -p` 폴백을 쓰려면(키 미등록 테넌트) 컨테이너에 claude CLI + Max 인증 필요(B0).

## 비용 (요약)
고객 키 경로면 비용은 고객 부담(플랫폼은 호스팅+DB만). 드라이버 = 위키 full 주입(~25K톤/콜).
저비용 디폴트 = Haiku + retrieval + 프롬프트 캐싱. 상세: [[product/plan-ga4-slack-central]] 인접 논의.
