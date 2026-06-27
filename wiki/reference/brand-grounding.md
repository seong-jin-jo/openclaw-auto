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

## 셀프서브 전제조건 (플랫폼 = 운영자)
- DB: 스키마 + RLS(`osmu_service`) + **pg_trgm** 확장 적용(`wiki-retrieve`가 word_similarity 사용).
- `OSMU_SECRET_KEY`: 고객 토큰(Anthropic 키·GitHub PAT) pgp 암호화 — **없으면 토큰 등록부터 실패**.
- Supabase Auth: Email confirm/redirect 설정(가입 정상화).
- `claude -p` 폴백을 쓰려면(키 미등록 테넌트) 컨테이너에 claude CLI + Max 인증 필요(B0).

## 비용 (요약)
고객 키 경로면 비용은 고객 부담(플랫폼은 호스팅+DB만). 드라이버 = 위키 full 주입(~25K톤/콜).
저비용 디폴트 = Haiku + retrieval + 프롬프트 캐싱. 상세: [[product/plan-ga4-slack-central]] 인접 논의.
