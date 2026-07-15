import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// OSMU v1.0.0 공개 대시보드 마이그레이션 계약 — db/schema.sql은 psql -f로 몇 번이고 재적용되는
// "선언형" 스키마 파일이라(별도 마이그레이션 러너/schema_migrations 테이블 없음), 신규 컬럼 +
// 1회성 백필을 한 번에 안전히 실을 유일한 방법은 "컬럼이 이번 실행에서 처음 생기는 경우에만" 백필
// UPDATE를 함께 실행하는 것이다. 그렇지 않으면(단순 `ADD COLUMN IF NOT EXISTS` + 무조건 UPDATE)
// 재배포마다 운영자가 이미 revoke한 shared_cli_approved_at을 다시 now()로 되살리는 회귀가 난다.
// 이 계약 테스트는 실제 Postgres 없이 소스 텍스트로 그 구조를 고정한다(다른 tests/brand/*.contract.test.ts와
// 동일한 패턴 — DB 없는 CI에서도 회귀를 잡는다).

const SCHEMA = readFileSync(path.resolve(__dirname, "../../db/schema.sql"), "utf8");

describe("db/schema.sql — shared_cli_approved_at 1회성 백필 계약", () => {
  it("컬럼 추가는 information_schema 존재 확인으로 감싼 DO 블록 안에서만 실행된다(무조건 ADD COLUMN IF NOT EXISTS 단독 사용 금지 — 백필과 분리되면 안 됨)", () => {
    const doBlock = SCHEMA.slice(
      SCHEMA.indexOf("DO $$", SCHEMA.indexOf("shared_cli_approved_at")),
      SCHEMA.indexOf("END $$;", SCHEMA.indexOf("shared_cli_approved_at")) + "END $$;".length,
    );
    expect(doBlock).toMatch(/IF NOT EXISTS[\s\S]*information_schema\.columns/);
    expect(doBlock).toMatch(/column_name\s*=\s*'shared_cli_approved_at'/);
    expect(doBlock).toMatch(/ALTER TABLE tenants ADD COLUMN shared_cli_approved_at TIMESTAMPTZ/);
  });

  it("백필 UPDATE 두 개(active 즉시승인 / pending→active) 모두 그 IF NOT EXISTS 블록 '안에서'만 실행된다(재적용 시 스킵되어 운영자 회수를 되돌리지 않음)", () => {
    const start = SCHEMA.indexOf("DO $$", SCHEMA.indexOf("shared_cli_approved_at"));
    const end = SCHEMA.indexOf("END $$;", start) + "END $$;".length;
    const doBlock = SCHEMA.slice(start, end);

    expect(doBlock).toMatch(/UPDATE tenants SET shared_cli_approved_at = now\(\) WHERE status = 'active'/);
    expect(doBlock).toMatch(/UPDATE tenants SET status = 'active' WHERE status = 'pending'/);

    // 두 UPDATE 모두 THEN...END IF 사이(즉 IF NOT EXISTS 가드 안)에 있어야 한다.
    const thenIdx = doBlock.indexOf("THEN");
    const endIfIdx = doBlock.indexOf("END IF");
    const activeBackfillIdx = doBlock.indexOf("UPDATE tenants SET shared_cli_approved_at = now()");
    const pendingBackfillIdx = doBlock.indexOf("UPDATE tenants SET status = 'active' WHERE status = 'pending'");
    expect(thenIdx).toBeGreaterThan(-1);
    expect(endIfIdx).toBeGreaterThan(-1);
    expect(activeBackfillIdx).toBeGreaterThan(thenIdx);
    expect(activeBackfillIdx).toBeLessThan(endIfIdx);
    expect(pendingBackfillIdx).toBeGreaterThan(thenIdx);
    expect(pendingBackfillIdx).toBeLessThan(endIfIdx);
  });

  it("paused 테넌트를 건드리는 UPDATE는 없다(그대로 유지)", () => {
    const start = SCHEMA.indexOf("DO $$", SCHEMA.indexOf("shared_cli_approved_at"));
    const end = SCHEMA.indexOf("END $$;", start) + "END $$;".length;
    const doBlock = SCHEMA.slice(start, end);
    expect(doBlock).not.toMatch(/WHERE status = 'paused'/);
    expect(doBlock).not.toMatch(/SET status = 'paused'/);
  });

  it("shared_cli_approved_at 컬럼은 NOT NULL이 아니다(nullable — 미승인 표현)", () => {
    expect(SCHEMA).toMatch(/shared_cli_approved_at TIMESTAMPTZ(?!\s*NOT NULL)/);
  });

  it("tenants.status는 더 이상 'pending'을 기본 신규가입 값으로 문서화하지 않는다(구 코멘트 회귀 방지)", () => {
    const statusLine = SCHEMA.slice(SCHEMA.indexOf("status      TEXT NOT NULL"), SCHEMA.indexOf("tier        TEXT"));
    expect(statusLine).not.toMatch(/신규 셀프서브 가입은 'pending'으로 생성/);
  });
});
