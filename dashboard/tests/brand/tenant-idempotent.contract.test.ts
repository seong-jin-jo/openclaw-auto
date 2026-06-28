import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// 2026-06-28 장애 회귀 가드 — ensureTenantForUser의 tenant INSERT는 ON CONFLICT(owner_auth_id)로
// 멱등이어야 한다. 동시 첫로그인 레이스에서 unique 위반 throw→500→재시도 폭주→CPU 100% 고착을 막음.
// 누군가 throw하는 단순 INSERT로 되돌리면 이 테스트가 깨진다.
it("ensureTenantForUser는 tenants INSERT에 ON CONFLICT(owner_auth_id) 멱등 upsert를 쓴다", () => {
  const src = readFileSync(path.resolve(__dirname, "../../src/lib/tenant-auth.ts"), "utf8");
  const m = src.match(/INSERT INTO tenants[\s\S]*?RETURNING id/);
  expect(m, "tenants INSERT 블록을 찾지 못함").toBeTruthy();
  expect(m![0], "tenant INSERT는 ON CONFLICT (owner_auth_id) 멱등이어야 함").toMatch(
    /ON CONFLICT\s*\(owner_auth_id\)\s*DO UPDATE/i,
  );
});
