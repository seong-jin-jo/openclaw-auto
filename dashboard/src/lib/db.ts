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

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  created_at: string;
};
