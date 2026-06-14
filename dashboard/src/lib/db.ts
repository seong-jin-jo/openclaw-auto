import postgres from "postgres";

// OSMU 멀티테넌트 DB (Postgres, 제공자 중앙 호스팅).
// 연결정보는 env DATABASE_URL. 하드코딩 금지(CLAUDE.md 서비스 중립).
// 예: postgres://user@localhost:5432/openclaw_osmu

// P4: tier별 Supabase 프로젝트 라우팅.
//   team    → DATABASE_URL (팀 공유 프로젝트, RLS로 테넌트 행 격리)
//   private → PRIVATE_DATABASE_URL (19금 물리 분리 프로젝트, sj_wsl에만 존재)
// 19금 격리 핵심: 팀 WSL엔 PRIVATE_DATABASE_URL이 없어 db('private')가 throw → 조회 불가.
export type Tier = "team" | "private";

// tier별 연결 인스턴스 캐시(요청마다 새 풀 생성 방지).
const _sqls = new Map<Tier, ReturnType<typeof postgres>>();

export function db(tier: Tier = "team") {
  let sql = _sqls.get(tier);
  if (!sql) {
    const url = tier === "private" ? process.env.PRIVATE_DATABASE_URL : process.env.DATABASE_URL;
    if (!url) throw new Error(`${tier} DATABASE_URL 미설정 — Postgres 연결 불가`);
    sql = postgres(url, { max: 5, idle_timeout: 20 });
    _sqls.set(tier, sql);
  }
  return sql;
}

// L1: RLS 방어심층. 매 요청 트랜잭션에서
//   ① set_config('app.tenant_id') → RLS 정책이 그 테넌트 행만 허용
//   ② SET LOCAL ROLE osmu_service → 접속 role(Supabase postgres는 rolbypassrls=true)이
//      RLS를 우회하지 못하도록 비우회 role로 강등. txn 종료 시 자동 복원(SET LOCAL).
// 모든 테넌트-스코프 쿼리는 db() 직접 대신 이 래퍼 경유. (인증모델 a: tenantId=활성 워크스페이스)
// rls.sql(role 생성·GRANT·정책) 적용된 DB에서만 동작 — 미적용 DB면 SET ROLE에서 throw.
// tier 인자(기본 'team')로 tier별 프로젝트 라우팅. 기존 2-인자 호출부는 그대로 team 동작.
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: ReturnType<typeof db>) => Promise<T>,
  tier: Tier = "team",
): Promise<T> {
  const sql = db(tier);
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SET LOCAL ROLE osmu_service`;
    return fn(tx as unknown as ReturnType<typeof db>);
  }) as Promise<T>;
}

// 테넌트 tier를 서버에서 도출(tenants.tier). 클라가 ?tier= 로 못 정하게 — 19금 물리격리 강제.
// tenants는 RLS 제외라 bare db()로 조회. 없으면 안전하게 'team'.
export async function tenantTier(tenantId: string): Promise<Tier> {
  if (!tenantId) return "team";
  try {
    const sql = db();
    const [row] = await sql<{ tier: string }[]>`SELECT tier FROM tenants WHERE id = ${tenantId} LIMIT 1`;
    return row?.tier === "private" ? "private" : "team";
  } catch {
    return "team";
  }
}

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  domain?: string | null;
  created_at: string;
};
