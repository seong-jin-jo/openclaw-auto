import postgres from "postgres";

// OSMU 멀티테넌트 DB (Postgres, 제공자 중앙 호스팅).
// 연결정보는 env DATABASE_URL. 하드코딩 금지(CLAUDE.md 서비스 중립).
// 예: postgres://user@localhost:5432/openclaw_osmu

let _sql: ReturnType<typeof postgres> | null = null;

export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL 미설정 — Postgres 연결 불가");
    _sql = postgres(url, { max: 5, idle_timeout: 20 });
  }
  return _sql;
}

// L1: RLS 방어심층. 매 요청 트랜잭션에서
//   ① set_config('app.tenant_id') → RLS 정책이 그 테넌트 행만 허용
//   ② SET LOCAL ROLE osmu_service → 접속 role(Supabase postgres는 rolbypassrls=true)이
//      RLS를 우회하지 못하도록 비우회 role로 강등. txn 종료 시 자동 복원(SET LOCAL).
// 모든 테넌트-스코프 쿼리는 db() 직접 대신 이 래퍼 경유. (인증모델 a: tenantId=활성 워크스페이스)
// rls.sql(role 생성·GRANT·정책) 적용된 DB에서만 동작 — 미적용 DB면 SET ROLE에서 throw.
export async function withTenant<T>(tenantId: string, fn: (tx: ReturnType<typeof db>) => Promise<T>): Promise<T> {
  const sql = db();
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SET LOCAL ROLE osmu_service`;
    return fn(tx as unknown as ReturnType<typeof db>);
  }) as Promise<T>;
}

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  created_at: string;
};
