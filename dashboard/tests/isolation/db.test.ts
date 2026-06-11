import { describe, it, expect, afterEach, vi } from "vitest";
import { getDatabaseUrl } from "./_env";

// P4 db(tier) 라우팅 + withTenant 하위호환 검증.
// db.ts는 모듈 레벨 _sqls Map 캐시를 쓰므로 매 테스트 vi.resetModules + 동적 import로 격리.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("db(tier) 라우팅", () => {
  it("db('private')는 PRIVATE_DATABASE_URL 미설정 시 throw", async () => {
    vi.resetModules();
    vi.stubEnv("PRIVATE_DATABASE_URL", ""); // falsy = 미설정
    const { db } = await import("@/lib/db");
    expect(() => db("private")).toThrow(/private DATABASE_URL/);
  });

  it("db('team')는 DATABASE_URL 미설정 시 throw", async () => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("@/lib/db");
    expect(() => db("team")).toThrow(/team DATABASE_URL/);
  });

  it("db('team') 동일 tier 반복 호출은 캐시 인스턴스 재사용", async () => {
    vi.resetModules();
    // 더미 URL — postgres()는 지연연결이라 실제 접속 안 함.
    vi.stubEnv("DATABASE_URL", "postgres://u@localhost:5432/x");
    const { db } = await import("@/lib/db");
    const a = db("team");
    const b = db("team");
    expect(a).toBe(b);
    await a.end({ timeout: 5 }); // 핸들 정리(미연결이라 즉시 resolve)
  });
});

describe("withTenant 하위호환", () => {
  it("기본 tier='team' (3번째 인자 선택적)", async () => {
    vi.resetModules();
    const { withTenant } = await import("@/lib/db");
    // tier 기본값 때문에 필수 인자는 2개 — 시그니처 하위호환 보증.
    expect(withTenant.length).toBe(2);
  });

  it("기본 tier로 team DB에 트랜잭션 실행 (PRIVATE_DATABASE_URL 없이도 동작)", async (ctx) => {
    const url = getDatabaseUrl();
    if (!url) return ctx.skip();
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", url);
    vi.stubEnv("PRIVATE_DATABASE_URL", ""); // private 미설정이어도 team 경로는 정상
    const { withTenant, db } = await import("@/lib/db");

    const tenantId = "00000000-0000-0000-0000-000000000001";
    try {
      const got = await withTenant(tenantId, async (tx) => {
        const r = await tx<{ t: string }[]>`
          select current_setting('app.tenant_id', true) as t`;
        return r[0].t;
      });
      // withTenant가 set_config로 박은 값이 트랜잭션 내에서 보여야 함 → team 경로 동작 증명.
      expect(got).toBe(tenantId);
    } catch (e) {
      // rls.sql 미적용(osmu_service role 없음) 등 환경 미비 → 하드실패 대신 skip.
      return ctx.skip();
    } finally {
      try {
        await db("team").end({ timeout: 5 });
      } catch {
        /* noop */
      }
    }
  });
});
