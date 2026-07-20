import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const schema = fs.readFileSync(path.resolve(__dirname, "../../db/schema.sql"), "utf8");

describe("TikTok async publication schema", () => {
  it("keeps the provider publish id and final post id in separate persisted fields", () => {
    expect(schema).toContain("provider_post_id TEXT");
    expect(schema).toContain("column_name='provider_post_id'");
    expect(schema).toContain("ALTER TABLE published_posts ADD COLUMN provider_post_id TEXT");
    expect(schema).toContain("provider_meta JSONB NOT NULL DEFAULT '{}'::jsonb");
    expect(schema).toContain("ALTER TABLE published_posts ADD COLUMN provider_meta JSONB NOT NULL DEFAULT '{}'::jsonb");
  });
});
