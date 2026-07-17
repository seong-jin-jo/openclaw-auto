import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// SNS-007 마이그레이션 계약 테스트 — db/schema.sql의 channel_accounts 백필 블록.
// 이 레포엔 tests/isolation/*.isolation.test.ts 처럼 DATABASE_URL 라이브 접속 스킵 패턴이 있지만,
// 그건 이미 배포된 Supabase 데이터가 있어야 의미 있는 "교차테넌트 격리" 검증용이라 이 신규
// 마이그레이션 SQL 자체의 정적 계약(평문 미복사·idempotent 백필)과는 성격이 다르다.
// 이 파일은 SQL 텍스트를 정적으로 검증한다(빠르고 항상 실행됨, DB 불필요).
// ⚠️ 실제 적용 동작은 로컬 brew Postgres(psql -h /tmp -p 5432)에 schema.sql을 2회 이상 적용해
// 수동으로도 확인했다(2026-07-17): (1) refresh_enc가 legacy 백필 행에서 항상 NULL, meta에서
// refreshToken 키 제거됨 (2) 한 provider(youtube) 백필 후 재배포 시점에 integrations에 새 provider
// (threads)가 추가돼도 다음 schema.sql 재적용에서 자동 백필됨 (3) 3회 재적용해도 row 수 불변
// (중복 삽입 없음). 이 파일은 그 실측을 회귀 방지용 정적 어서션으로 고정한다.

const schemaSql = fs.readFileSync(path.resolve(__dirname, "../../db/schema.sql"), "utf8");

describe("db/schema.sql — SNS-007 channel_accounts 백필 계약", () => {
  it("legacy 백필이 refresh_enc에 평문 refreshToken을 복사하지 않는다", () => {
    // 백필 INSERT의 refresh_enc 값 자리에 NULL 리터럴만 있어야 한다 — meta->>'refreshToken' 참조 금지.
    const insertBlock = schemaSql.slice(schemaSql.indexOf("INSERT INTO channel_accounts"), schemaSql.indexOf("ON CONFLICT (tenant_id, provider, external_account_id) DO NOTHING;"));
    expect(insertBlock).toMatch(/NULL,\s*--\s*평문 refresh/);
    expect(insertBlock).not.toMatch(/refreshToken['"]?\s*\)\s*,?\s*$/m);
    // refresh_enc 자리 값이 r.meta->>'refreshToken' 유래가 아님을 확인(정확히 "NULL,"이 refresh_enc 위치).
    expect(schemaSql).not.toMatch(/refresh_enc\s*=\s*NULLIF\(r\.meta->>'refreshToken'/);
  });

  it("백필이 meta에서도 refreshToken 키를 제거한다(jsonb minus 연산자)", () => {
    expect(schemaSql).toMatch(/\(r\.meta\s*-\s*'refreshToken'\)/);
  });

  it("global existence-guard(`IF NOT EXISTS (SELECT 1 FROM channel_accounts LIMIT 1)`)가 백필 블록에 없다", () => {
    const backfillStart = schemaSql.indexOf("-- 멱등 백필");
    const backfillBlock = schemaSql.slice(backfillStart);
    expect(backfillBlock).not.toMatch(/IF NOT EXISTS \(SELECT 1 FROM channel_accounts LIMIT 1\)/);
  });

  it("백필이 provider/tenant 단위 idempotency를 ON CONFLICT DO NOTHING으로 보장한다", () => {
    const backfillStart = schemaSql.indexOf("-- 멱등 백필");
    const backfillBlock = schemaSql.slice(backfillStart);
    expect(backfillBlock).toMatch(/ON CONFLICT \(tenant_id, provider, external_account_id\) DO NOTHING/);
  });

  it("integrations 테이블 정의는 이 마이그레이션에서 변경되지 않는다(ADD-ONLY 원칙)", () => {
    // CREATE TABLE IF NOT EXISTS integrations 정의부는 SNS-007 마커 이전에 그대로 있어야 한다.
    const sns007Marker = schemaSql.indexOf("SNS-007");
    const integrationsDef = schemaSql.indexOf("CREATE TABLE IF NOT EXISTS integrations");
    expect(integrationsDef).toBeGreaterThan(-1);
    expect(integrationsDef).toBeLessThan(sns007Marker);
  });

  it("channel_accounts에 provider당 1개 기본계정만 허용하는 partial unique index가 있다", () => {
    expect(schemaSql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS uq_channel_accounts_one_default\s*\n\s*ON channel_accounts\(tenant_id, provider\) WHERE is_default/);
  });
});

describe("db/rls.sql — channel_accounts RLS 포함", () => {
  const rlsSql = fs.readFileSync(path.resolve(__dirname, "../../db/rls.sql"), "utf8");
  it("channel_accounts가 tenant_iso 정책 대상 테이블 배열에 포함된다", () => {
    const arrLine = rlsSql.split("\n").find((l) => l.includes("FOREACH t IN ARRAY"));
    expect(arrLine).toBeTruthy();
    expect(arrLine).toContain("'channel_accounts'");
  });
});
