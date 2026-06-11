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

// L1: RLS 방어심층. 매 요청 트랜잭션에서 SET LOCAL app.tenant_id → RLS 정책이 그 테넌트 행만 허용.
// 모든 테넌트-스코프 쿼리는 db() 직접 대신 이 래퍼 경유. (인증모델 a: tenantId=활성 워크스페이스)
export async function withTenant<T>(tenantId: string, fn: (tx: ReturnType<typeof db>) => Promise<T>): Promise<T> {
  const sql = db();
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
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
